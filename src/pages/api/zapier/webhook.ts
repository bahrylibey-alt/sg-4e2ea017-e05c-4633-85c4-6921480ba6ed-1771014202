import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * ZAPIER WEBHOOK ENDPOINT
 * 
 * This endpoint receives updates from Zapier when:
 * - A post was published successfully
 * - Views/clicks were tracked on external platforms
 * - Any status updates from social media
 * 
 * Zapier calls this URL: https://yourapp.vercel.app/api/zapier/webhook
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { 
      action,           // 'post_success', 'update_stats', 'post_failed'
      content_id,       // ID from posted_content table
      platform,         // 'pinterest', 'facebook', 'instagram', etc.
      external_id,      // Post ID on external platform
      views,            // View count (optional)
      clicks,           // Click count (optional)
      status,           // 'published', 'failed', 'pending'
      error_message     // Error details if failed
    } = req.body;

    console.log('📥 Zapier webhook received:', { action, content_id, platform });

    // Validate required fields
    if (!action || !content_id || !platform) {
      return res.status(400).json({ 
        error: "Missing required fields: action, content_id, platform" 
      });
    }

    switch (action) {
      case 'post_success':
        // Update posted_content with external platform details
        const { error: updateError } = await supabase
          .from('posted_content')
          .update({
            status: 'published',
            external_id: external_id,
            posted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', content_id);

        if (updateError) {
          console.error('Error updating posted_content:', updateError);
          return res.status(500).json({ error: updateError.message });
        }

        console.log(`✅ Content ${content_id} published successfully to ${platform}`);
        break;

      case 'update_stats':
        // Update view/click counts from external platform
        const { error: statsError } = await supabase
          .from('posted_content')
          .update({
            views: views || 0,
            clicks: clicks || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', content_id);

        if (statsError) {
          console.error('Error updating stats:', statsError);
          return res.status(500).json({ error: statsError.message });
        }

        console.log(`📊 Stats updated for content ${content_id}: ${views} views, ${clicks} clicks`);
        break;

      case 'post_failed':
        // Mark content as failed with error details
        const { error: failError } = await supabase
          .from('posted_content')
          .update({
            status: 'failed',
            error_message: error_message || 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', content_id);

        if (failError) {
          console.error('Error marking content as failed:', failError);
          return res.status(500).json({ error: failError.message });
        }

        console.log(`❌ Content ${content_id} failed to post: ${error_message}`);
        break;

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    res.status(200).json({ 
      success: true, 
      message: `Webhook processed successfully: ${action}`,
      content_id,
      platform
    });

  } catch (error: any) {
    console.error('Zapier webhook error:', error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}