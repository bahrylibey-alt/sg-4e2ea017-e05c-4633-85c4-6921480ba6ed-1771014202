import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * CLICK TRACKER - Real Click Tracking
 * 
 * Tracks REAL clicks on affiliate links
 * Called when user clicks on an affiliate link
 * 
 * URL Format: /api/click-tracker?link_id=xxx&platform=pinterest&country=US&device=mobile
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const {
      link_id,
      platform = 'unknown',
      country,
      device_type = 'desktop',
      referrer
    } = req.query;

    console.log('👆 CLICK TRACKED:', {
      link_id,
      platform,
      country,
      device_type
    });

    // Validate required fields
    if (!link_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: link_id'
      });
    }

    const linkIdStr = Array.isArray(link_id) ? link_id[0] : link_id;
    const platformStr = Array.isArray(platform) ? platform[0] : platform;
    const countryStr = country ? (Array.isArray(country) ? country[0] : country) : 'unknown';
    const deviceStr = Array.isArray(device_type) ? device_type[0] : device_type;
    const referrerStr = referrer ? (Array.isArray(referrer) ? referrer[0] : referrer) : undefined;

    // Get the affiliate link
    const { data: affiliateLink } = await supabase
      .from('affiliate_links')
      .select('id, user_id, product_id, destination_url')
      .eq('id', linkIdStr)
      .maybeSingle();

    if (!affiliateLink) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate link not found'
      });
    }

    // Record the click event
    const { data: clickEvent, error: clickError } = await supabase
      .from('click_events')
      .insert({
        link_id: affiliateLink.id,
        user_id: affiliateLink.user_id,
        platform: platformStr,
        country: countryStr,
        device_type: deviceStr,
        referrer: referrerStr,
        clicked_at: new Date().toISOString(),
        converted: false
      })
      .select()
      .single();

    if (clickError) {
      console.error('❌ Failed to record click:', clickError);
      return res.status(500).json({
        success: false,
        error: 'Failed to record click'
      });
    }

    // Update affiliate link stats
    const { data: link } = await supabase
      .from('affiliate_links')
      .select('clicks')
      .eq('id', affiliateLink.id)
      .single();

    if (link) {
      await supabase
        .from('affiliate_links')
        .update({
          clicks: (link.clicks || 0) + 1
        })
        .eq('id', affiliateLink.id);
    }

    console.log('✅ Click recorded:', clickEvent.id);

    // Return redirect URL
    return res.status(200).json({
      success: true,
      click_id: clickEvent.id,
      redirect_url: affiliateLink.destination_url,
      message: 'Click tracked successfully'
    });

  } catch (error: any) {
    console.error('❌ CLICK TRACKER ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}