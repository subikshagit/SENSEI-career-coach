// Create an API that serves zero functions
import { generateIndustryInsights } from "@/lib/inngest/funtion";
import { inngest } from "@/lib/inngest/client";
import { serve } from "inngest/next";

const handlers = serve({
  client: inngest,
  functions: [generateIndustryInsights],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export async function PUT(req) {
  console.log("Inngest PUT request received");
  try {
    const len = req.headers.get("content-length");
    if (!len || len === "0") {
      console.log("Empty body, patching with {}");
      const patched = new Request(req.url, {
        method: "PUT",
        headers: req.headers,
        body: "{}",
      });
      return handlers.PUT(patched);
    }
    // Validate body is JSON-parsable
    console.log("Validating JSON body");
    await req.clone().json();
    return handlers.PUT(req);
  } catch (err) {
    console.log("Body validation failed, patching with {}", err?.message);
    const patched = new Request(req.url, {
      method: "PUT",
      headers: req.headers,
      body: "{}",
    });
    return handlers.PUT(patched);
  }
}
