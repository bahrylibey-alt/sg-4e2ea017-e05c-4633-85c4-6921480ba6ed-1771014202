import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get content with click data
    const { data: content, error: contentError } = await supabase
      .from("generated_content")
      .select(`
        id,
        title,
        views,
        created_at,
        product_id
      `)
      .order("views", { ascending: false })
      .limit(20);

    if (contentError) throw contentError;

    // Get click data
    const { data: clicks, error: clicksError } = await supabase
      .from("affiliate_clicks")
      .select("content_id, created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (clicksError) throw clicksError;

    // Get conversion data
    const { data: conversions, error: conversionsError } = await supabase
      .from("commissions")
      .select("product_id, amount, created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (conversionsError) throw conversionsError;

    // Analyze performance
    const clicksByContent = clicks?.reduce((acc: any, click) => {
      acc[click.content_id] = (acc[click.content_id] || 0) + 1;
      return acc;
    }, {}) || {};

    const conversionsByProduct = conversions?.reduce((acc: any, conv) => {
      acc[conv.product_id] = {
        count: (acc[conv.product_id]?.count || 0) + 1,
        revenue: (acc[conv.product_id]?.revenue || 0) + Number(conv.amount)
      };
      return acc;
    }, {}) || {};

    // Generate insights
    const topPerformers = content?.slice(0, 5).map(c => ({
      title: c.title,
      views: c.views || 0,
      clicks: clicksByContent[c.id] || 0,
      ctr: c.views ? ((clicksByContent[c.id] || 0) / c.views * 100).toFixed(2) : "0.00"
    })) || [];

    const lowPerformers = content?.slice(-5).map(c => ({
      title: c.title,
      views: c.views || 0,
      clicks: clicksByContent[c.id] || 0,
      ctr: c.views ? ((clicksByContent[c.id] || 0) / c.views * 100).toFixed(2) : "0.00"
    })) || [];

    // Store insights
    const insights = {
      analysis_date: new Date().toISOString(),
      top_performers: topPerformers,
      low_performers: lowPerformers,
      total_clicks_30d: clicks?.length || 0,
      total_conversions_30d: conversions?.length || 0,
      avg_ctr: content?.length ? 
        (Object.values(clicksByContent).reduce((a: number, b: any) => a + b, 0) / content.length).toFixed(2) : "0.00"
    };

    const { error: insertError } = await supabase
      .from("performance_insights")
      .insert(insights);

    if (insertError && insertError.code !== "23505") {
      console.error("Performance insights insert error:", insertError);
    }

    return res.status(200).json({
      message: "Performance analysis complete",
      insights: {
        top_performers: topPerformers.length,
        low_performers: lowPerformers.length,
        avg_ctr: insights.avg_ctr,
        total_clicks_30d: insights.total_clicks_30d
      }
    });

  } catch (error: any) {
    console.error("Performance analysis error:", error);
    return res.status(500).json({
      error: error.message || "Failed to analyze performance"
    });
  }
}