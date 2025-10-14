"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { generateAIInsights } from "@/actions/dashboard";


export async function updateUser(data) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) return { success: false, error: "User not found" };

    // Normalize incoming data from client form
    const normalized = {
      industry: String(data.industry || "").trim(),
      experience:
        typeof data.experience === "number"
          ? data.experience
          : parseInt(String(data.experience || "0"), 10) || 0,
      bio: data.bio?.trim() || null,
      skills: Array.isArray(data.skills)
        ? data.skills
        : String(data.skills || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
    };
    //find if the industry insights is exits
    const result = await db.$transaction(
      async (tx) => {
        let industryInsight = await tx.industryInsight.findUnique({
          where: {
            industry: normalized.industry,
          },
        });
        //if the industry doesn't exits ,create it value ..
        // we will change the login with ai industry insights
        if (!industryInsight) {
          // Try generating AI insights; if it fails, use safe defaults
          let insights = null;
          try {
            insights = await generateAIInsights(normalized.industry);
          } catch (e) {
            // fall through to defaults
          }
          // Non-empty fallback to ensure dashboard chart renders
          const defaultSalaryRanges = [
            { role: "Machine Learning Engineer", min: 90000, median: 140000, max: 200000, location: "Global" },
            { role: "Data Scientist", min: 85000, median: 130000, max: 190000, location: "Global" },
            { role: "AI Researcher", min: 100000, median: 150000, max: 220000, location: "Global" },
            { role: "MLOps Engineer", min: 95000, median: 135000, max: 195000, location: "Global" },
            { role: "Computer Vision Engineer", min: 90000, median: 138000, max: 205000, location: "Global" },
          ];

          const safeInsights = {
            salaryRanges: Array.isArray(insights?.salaryRanges) && insights.salaryRanges.length > 0
              ? insights.salaryRanges
              : defaultSalaryRanges,
            growthRate:
              typeof insights?.growthRate === "number" && !isNaN(insights.growthRate)
                ? insights.growthRate
                : 5,
            demandLevel: String(insights?.demandLevel || "MEDIUM").toUpperCase(), // HIGH|MEDIUM|LOW
            topSkills: Array.isArray(insights?.topSkills) && insights.topSkills.length > 0
              ? insights.topSkills
              : ["Python", "TensorFlow", "PyTorch", "Data Modeling", "Cloud ML"],
            marketOutlook: String(insights?.marketOutlook || "NEUTRAL").toUpperCase(), // POSITIVE|NEGATIVE|NEUTRAL
            keyTrends: Array.isArray(insights?.keyTrends) && insights.keyTrends.length > 0
              ? insights.keyTrends
              : ["Generative AI", "Edge AI", "Responsible AI"],
            recommendedSkills: Array.isArray(insights?.recommendedSkills) && insights.recommendedSkills.length > 0
              ? insights.recommendedSkills
              : ["Leadership", "MLOps", "Prompt Engineering"],
          };

          industryInsight = await tx.industryInsight.create({
            data: {
              industry: normalized.industry,
              ...safeInsights,
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        }

        // Now update the user
        const updatedUser = await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            industry: normalized.industry,
            experience: normalized.experience,
            bio: normalized.bio,
            skills: normalized.skills,
          },
        });
        return { updatedUser, industryInsight };
      },
      {
        timeout: 60000,
      }
    );
    return { success: true, ...result };
  } catch (error) {
    console.error("ERROR updating user and industry", error?.message || error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) return { isOnboarded: false };

  try {
    const u = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { industry: true },
    });
    return { isOnboarded: !!u?.industry };
  } catch (error) {
    console.error("Error checking onboarding status:", error.message);
    // Fail-safe: treat as not onboarded to avoid redirect loops
    return { isOnboarded: false };
  }
}
