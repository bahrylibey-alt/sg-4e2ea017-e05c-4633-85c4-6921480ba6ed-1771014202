import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * VISIT TRACKER - Real View/Impression Tracking
 * 
 * Tracks REAL views on posted content
 * Called by platform APIs (Pinterest, TikTok, etc.) via webhooks
 * 
 * URL Format: /api/track-visit?content_id=xxx&platform=pinterest&views=150
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const {
      content_id,
      platform = 'unknown',
      views = 1,
      impressions,
      engagement_rate
    } = req.query;

    console.log('👁️ VISIT TRACKED:', {
      content_id,
      platform,
      views,
      impressions
    });

    // Validate required fields
    if (!content_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: content_id'
      });
    }

    // Get the posted content
    const { data: postedContent } = await supabase
      .from('posted_content')
      .select('id, user_id')
      .eq('id', content_id)
      .maybeSingle();

    if (!postedContent) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    const viewCount = parseInt(views as string);

    // Record the view event
    const { error: viewError } = await supabase
      .from('view_events')
      .insert({
        content_id: postedContent.id,
        user_id: postedContent.user_id,
        platform: platform as string,
        views: viewCount,
        engagement_rate: engagement_rate ? parseFloat(engagement_rate as string) : null,
        tracked_at: new Date().toISOString()
      });

    if (viewError) {
      console.error('❌ Failed to record view:', viewError);
      return res.status(500).json({
        success: false,
        error: 'Failed to record view'
      });
    }

    // Update posted content stats
    const { data: content } = await supabase
      .from('posted_content')
      .select('impressions')
      .eq('id', postedContent.id)
      .single();

    if (content) {
      await supabase
        .from('posted_content')
        .update({
          impressions: (content.impressions || 0) + viewCount
        })
        .eq('id', postedContent.id);
    }

    console.log('✅ View recorded for content:', content_id);

    return res.status(200).json({
      success: true,
      message: 'View tracked successfully',
      views: viewCount
    });

  } catch (error: any) {
    console.error('❌ VISIT TRACKER ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}