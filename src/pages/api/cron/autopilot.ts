import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { scoringEngine } from "@/services/scoringEngine";
import { decisionEngine } from "@/services/decisionEngine";
import { aiInsightsEngine } from "@/services/aiInsightsEngine";

/**
 * AUTONOMOUS ENGINE CRON
 * Runs every 30-60 minutes
 * Collects data → Scores → Classifies → Recommends → Saves decisions
 * 
 * SAFE: Only generates recommendations, never auto-executes
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron authorization (optional - add API key check here)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("🤖 [Autopilot] Starting autonomous engine cycle...");

  try {
    // Get all active users
    const { data: users } = await supabase
      .from("profiles")
      .select("id")
      .limit(100); // Process in batches

    if (!users || users.length === 0) {
      console.log("No users to process");
      return res.status(200).json({
        success: true,
        message: "No users to process",
        processed: 0,
      });
    }

    console.log(`Processing ${users.length} users...`);

    let totalScored = 0;
    let totalDecisions = 0;

    for (const user of users) {
      try {
        console.log(`📊 Processing user: ${user.id}`);

        // Step 1: Score all posts
        const scoreResults = await scoringEngine.scoreAllPosts(user.id);
        totalScored += scoreResults.total;

        console.log(`✅ Scored ${scoreResults.total} posts (${scoreResults.winners} winners)`);

        // Step 2: Generate decisions
        const decisions = await decisionEngine.analyzeAllPosts(user.id);
        totalDecisions += decisions.totalDecisions;

        console.log(`✅ Generated ${decisions.totalDecisions} recommendations`);

        // Step 3: Generate insights
        await aiInsightsEngine.generateInsights(user.id);

        console.log(`✅ Insights updated`);

        // Rate limit between users
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (userError) {
        console.error(`Failed to process user ${user.id}:`, userError);
        // Continue with next user (FAIL-SAFE)
      }
    }

    console.log(`
🎯 Autopilot Cycle Complete:
- Users Processed: ${users.length}
- Posts Scored: ${totalScored}
- Decisions Generated: ${totalDecisions}
    `);

    return res.status(200).json({
      success: true,
      message: "Autopilot cycle completed",
      stats: {
        usersProcessed: users.length,
        postsScored: totalScored,
        decisionsGenerated: totalDecisions,
      },
    });
  } catch (error: any) {
    console.error("Autopilot cycle failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Autopilot cycle failed",
    });
  }
}