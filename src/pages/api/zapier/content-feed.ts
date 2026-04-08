import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * ZAPIER CONTENT FEED ENDPOINT
 * 
 * This endpoint provides a feed of content waiting to be posted.
 * Zapier polls this endpoint to get new content that needs to be published.
 * 
 * Zapier monitors: https://yourapp.vercel.app/api/zapier/content-feed
 * 
 * When new content appears (status = 'pending'), Zapier triggers the posting workflow.
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { 
      platform,     // Filter by platform: 'pinterest', 'facebook', etc.
      limit = 10,   // How many items to return
      status = 'pending'  // Filter by status
    } = req.query;

    console.log('📡 Zapier content feed request:', { platform, limit, status });

    // Build query
    let query = supabase
      .from('posted_content')
      .select(`
        id,
        campaign_id,
        platform,
        content_type,
        title,
        body,
        image_url,
        link_url,
        status,
        scheduled_for,
        created_at
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    // Filter by platform if specified
    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data: content, error } = await query;

    if (error) {
      console.error('Error fetching content feed:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Returning ${content?.length || 0} content items for Zapier`);

    // Return content in Zapier-friendly format
    res.status(200).json({
      success: true,
      count: content?.length || 0,
      items: content || [],
      metadata: {
        platform: platform || 'all',
        status: status,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Content feed error:', error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}