import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { magicTrafficEngine } from "@/services/magicTrafficEngine";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * ADVANCED TRAFFIC DISCOVERY API
 * Finds sophisticated traffic sources competitors don't use
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, niche, auto_activate } = req.body;

    console.log("🔮 MAGIC TRAFFIC DISCOVERY INITIATED");
    console.log(`   User: ${userId || 'demo'}`);
    console.log(`   Niche: ${niche || 'general'}`);

    // Get user ID from database if not provided
    let actualUserId = userId;
    if (!actualUserId) {
      const { data: users } = await supabase.from("profiles").select("id").limit(1);
      actualUserId = users?.[0]?.id || null;
    }

    if (!actualUserId) {
      return res.status(400).json({
        error: "No user found. Please create an account first.",
        demo_mode: true
      });
    }

    // Discover all opportunities
    const discovery = await magicTrafficEngine.discoverAllOpportunities(
      actualUserId,
      niche || "general",
      supabase
    );

    // Auto-activate if requested
    let activation = null;
    if (auto_activate) {
      activation = await magicTrafficEngine.autoActivateBestSources(
        actualUserId,
        5,
        supabase
      );
    }

    return res.status(200).json({
      success: true,
      message: "Advanced traffic discovery complete",
      discovery,
      activation,
      next_steps: activation ? [
        "Traffic sources activated and ready",
        "Create content to distribute across all sources",
        "Monitor real-time analytics in dashboard"
      ] : [
        "Review discovered opportunities",
        "Activate sources you want to use",
        "Start distributing content"
      ]
    });

  } catch (error: any) {
    console.error("❌ Traffic discovery error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}