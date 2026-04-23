import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [productsRes, articlesRes, conversionsRes] = await Promise.all([
      supabase.from("products").select("id, content_generated", { count: "exact" }),
      supabase.from("generated_content").select("id, status, social_posted", { count: "exact" }),
      supabase.from("click_events").select("conversion_id", { count: "exact" })
    ]);

    const productsWithoutContent = productsRes.data?.filter(p => !p.content_generated).length || 0;
    const articlesWithoutSocial = articlesRes.data?.filter(a => !a.social_posted).length || 0;
    const totalProducts = productsRes.count || 0;
    const totalArticles = articlesRes.count || 0;
    const totalClicks = conversionsRes.count || 0;

    const decisions = [];

    if (totalProducts < 10) {
      decisions.push({ action: "product-discovery", reason: "Low product count", priority: 1 });
    }

    if (productsWithoutContent > 0) {
      decisions.push({ action: "content-generator", reason: `${productsWithoutContent} products need content`, priority: 2 });
    }

    if (articlesWithoutSocial > 0) {
      decisions.push({ action: "social-publisher", reason: `${articlesWithoutSocial} articles need social posts`, priority: 3 });
    }

    if (totalArticles > 5) {
      decisions.push({ action: "seo-optimizer", reason: "Optimize existing content for better rankings", priority: 4 });
    }

    if (totalClicks < 100) {
      decisions.push({ action: "traffic-boost", reason: "Low traffic, need more visitors", priority: 5 });
    }

    decisions.sort((a, b) => a.priority - b.priority);

    const actionToExecute = decisions[0];

    if (!actionToExecute) {
      return res.status(200).json({
        success: true,
        message: "All systems optimal, no action needed",
        analysis: {
          totalProducts,
          totalArticles,
          productsWithoutContent,
          articlesWithoutSocial,
          totalClicks
        }
      });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/autopilot/${actionToExecute.action}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      }
    );

    const result = await response.json();

    return res.status(200).json({
      success: true,
      message: `Smart AutoPilot executed: ${actionToExecute.action}`,
      decision: actionToExecute,
      result,
      analysis: {
        totalProducts,
        totalArticles,
        productsWithoutContent,
        articlesWithoutSocial,
        totalClicks
      }
    });
  } catch (error: any) {
    console.error("Smart autopilot error:", error);
    return res.status(500).json({
      error: error.message || "Failed to execute smart autopilot"
    });
  }
}