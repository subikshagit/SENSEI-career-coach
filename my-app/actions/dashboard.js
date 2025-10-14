"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";


console.log("Gemini Key:", process.env.GEMINI_API_KEY?.slice(0, 6));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateAIInsights = async (industry) => {
  const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  // Robust clean & parse like Inngest fn
  const cleanedText = (text || "")
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/```/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '$1') // line comments
    .trim();
  const tryParse = (s) => {
    try { return JSON.parse(s); } catch { return null; }
  };
  const extractFirstJSONObject = (input) => {
    let i = 0; while (i < input.length && input[i] !== '{') i++;
    if (i >= input.length) return null;
    let inStr = false, esc = false, depth = 0;
    for (let j = i; j < input.length; j++) {
      const ch = input[j];
      if (inStr) { if (!esc && ch === '"') inStr = false; esc = ch === '\\' ? !esc : false; continue; }
      if (ch === '"') { inStr = true; continue; }
      if (ch === '{') depth++;
      if (ch === '}') depth--;
      if (depth === 0) return input.slice(i, j + 1);
    }
    return null;
  };
  const preprocessJSONish = (s) => {
    let t = s;
    t = t.replace(/:\s*(-?\d+(?:\.\d+)?)\s*%/g, ': "$1%"');
    t = t.replace(/:\s*\$\s*([0-9,]+(?:\.[0-9]+)?)/g, ': "$1"');
    t = t.replace(/,\s*([}\]])/g, '$1');
    t = t.replace(/([,{\s])([A-Za-z_][A-Za-z0-9_\-]*)\s*:/g, '$1"$2":');
    if (!/\"/.test(t) && /'/.test(t)) t = t.replace(/'/g, '"');
    return t;
  };

  let parsed = tryParse(cleanedText);
  if (!parsed) {
    const slice = extractFirstJSONObject(cleanedText);
    if (slice) {
      parsed = tryParse(slice) || tryParse(preprocessJSONish(slice));
    }
    
  }
  if (!parsed) {
    parsed = tryParse(preprocessJSONish(cleanedText));
  }
  if (!parsed) {
    throw new Error("Gemini returned non-JSON content");
  }
  return parsed;
};

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");

  // Helper to provide non-empty defaults for chart visibility
  const defaultSalaryRanges = [
    { role: "Machine Learning Engineer", min: 90000, median: 140000, max: 200000, location: "Global" },
    { role: "Data Scientist", min: 85000, median: 130000, max: 190000, location: "Global" },
    { role: "AI Researcher", min: 100000, median: 150000, max: 220000, location: "Global" },
    { role: "MLOps Engineer", min: 95000, median: 135000, max: 195000, location: "Global" },
    { role: "Computer Vision Engineer", min: 90000, median: 138000, max: 205000, location: "Global" },
  ];

  const withNonEmptyDefaults = (insights) => {
    const patched = { ...insights };
    if (!Array.isArray(patched.salaryRanges) || patched.salaryRanges.length === 0) {
      patched.salaryRanges = defaultSalaryRanges;
    }
    if (typeof patched.growthRate !== "number" || isNaN(patched.growthRate)) {
      patched.growthRate = 5;
    }
    if (!Array.isArray(patched.topSkills) || patched.topSkills.length === 0) {
      patched.topSkills = ["Python", "TensorFlow", "PyTorch", "Data Modeling", "Cloud ML"];
    }
    if (!Array.isArray(patched.keyTrends) || patched.keyTrends.length === 0) {
      patched.keyTrends = ["Generative AI", "Edge AI", "Responsible AI"];
    }
    if (!Array.isArray(patched.recommendedSkills) || patched.recommendedSkills.length === 0) {
      patched.recommendedSkills = ["Leadership", "MLOps", "Prompt Engineering"];
    }
    // DemandLevel and MarketOutlook enums stored uppercase in DB; keep as-is or default
    patched.demandLevel = String(patched.demandLevel || "MEDIUM").toUpperCase();
    patched.marketOutlook = String(patched.marketOutlook || "NEUTRAL").toUpperCase();
    return patched;
  };

  // If no insights exist, generate them
  if (!user.industryInsight) {
    const insights = await generateAIInsights(user.industry);

    const industryInsight = await db.industryInsight.create({
      data: {
        industry: user.industry,
        ...withNonEmptyDefaults(insights),
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return industryInsight;
  }

  // If insights exist but are empty, repair them in DB so the chart shows
  const needsRepair = !Array.isArray(user.industryInsight.salaryRanges) || user.industryInsight.salaryRanges.length === 0;
  if (needsRepair) {
    const patched = withNonEmptyDefaults(user.industryInsight);
    const updated = await db.industryInsight.update({
      where: { industry: user.industryInsight.industry },
      data: { ...patched },
    });
    return updated;
  }

  return user.industryInsight;
}
