import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * ENABLE AUTOPILOT
 * 
 * Ensures user has autopilot enabled and settings configured
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Enabling autopilot for user:', user.id);

    // 1. Ensure user_settings exists and autopilot is enabled
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingSettings) {
      // Create user_settings
      await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          autopilot_enabled: true,
          notification_email: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } else {
      // Update existing settings
      await supabase
        .from('user_settings')
        .update({
          autopilot_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    }

    // 2. Ensure autopilot_settings exists with defaults
    const { data: autopilotSettings } = await supabase
      .from('autopilot_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!autopilotSettings) {
      await supabase
        .from('autopilot_settings')
        .insert({
          user_id: user.id,
          autopilot_frequency: 'every_30_minutes',
          content_generation_frequency: 'daily',
          product_discovery_frequency: 'daily',
          target_niches: [],
          excluded_niches: [],
          content_tone: 'conversational',
          content_length: 'medium',
          use_emojis: true,
          use_hashtags: true,
          max_hashtags: 5,
          enabled_platforms: ['pinterest', 'tiktok', 'twitter', 'facebook', 'instagram'],
          min_product_price: 10.00,
          max_product_price: 500.00,
          min_product_rating: 4.0,
          preferred_networks: ['amazon', 'aliexpress'],
          auto_scale_winners: true,
          scale_threshold: 100,
          pause_underperformers: true,
          pause_threshold: 20,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    // 3. Check if user has any products
    const { data: products, count: productCount } = await supabase
      .from('affiliate_links')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'active');

    return res.status(200).json({
      success: true,
      message: 'Autopilot enabled successfully',
      user: {
        id: user.id,
        email: user.email
      },
      settings: {
        autopilot_enabled: true,
        has_autopilot_settings: true
      },
      products: {
        count: productCount || 0,
        needsProducts: (productCount || 0) === 0
      },
      nextSteps: (productCount || 0) === 0 
        ? ['Add products to catalog', 'Run product discovery', 'Wait for cron job']
        : ['Wait for next cron execution (every 30 minutes)', 'Or manually trigger with /api/force-autopilot-run']
    });

  } catch (error: any) {
    console.error('Error enabling autopilot:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}