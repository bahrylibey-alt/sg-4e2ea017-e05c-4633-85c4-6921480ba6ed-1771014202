import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * Quick Fix Endpoint - Automatically fixes common configuration issues
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const fixes: Array<{
    issue: string;
    action: string;
    status: 'FIXED' | 'SKIPPED' | 'FAILED';
    message: string;
  }> = [];

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please log in first'
      });
    }

    console.log(`🔧 Running quick fixes for user ${user.id}`);

    // FIX 1: Ensure user profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.email?.split('@')[0] || 'User'
        });

      fixes.push({
        issue: 'Missing user profile',
        action: 'Created profile',
        status: profileError ? 'FAILED' : 'FIXED',
        message: profileError ? profileError.message : 'Profile created successfully'
      });
    } else {
      fixes.push({
        issue: 'User profile',
        action: 'Check profile',
        status: 'SKIPPED',
        message: 'Profile already exists'
      });
    }

    // FIX 2: Create default user settings if missing
    const { data: settings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!settings) {
      const { error: settingsError } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          timezone: 'UTC',
          notification_email: user.email,
          conversion_tracking_enabled: true,
          commission_calculations_enabled: true
        });

      fixes.push({
        issue: 'Missing user settings',
        action: 'Created default settings',
        status: settingsError ? 'FAILED' : 'FIXED',
        message: settingsError ? settingsError.message : 'Settings created'
      });
    } else {
      fixes.push({
        issue: 'User settings',
        action: 'Check settings',
        status: 'SKIPPED',
        message: 'Settings already configured'
      });
    }

    // FIX 3: Create default autopilot settings if missing
    const { data: autopilot } = await supabase
      .from('autopilot_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!autopilot) {
      const { error: autopilotError } = await supabase
        .from('autopilot_settings')
        .insert({
          user_id: user.id,
          enabled: true,
          daily_budget: 10,
          min_product_price: 10,
          max_product_price: 500,
          auto_optimize: true,
          auto_pause_low_performers: true
        });

      fixes.push({
        issue: 'Missing autopilot settings',
        action: 'Created default autopilot config',
        status: autopilotError ? 'FAILED' : 'FIXED',
        message: autopilotError ? autopilotError.message : 'Autopilot configured'
      });
    } else {
      fixes.push({
        issue: 'Autopilot settings',
        action: 'Check autopilot',
        status: 'SKIPPED',
        message: 'Autopilot already configured'
      });
    }

    // FIX 4: Create default campaign if none exists
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (!campaigns || campaigns.length === 0) {
      const { error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name: 'Main Campaign',
          status: 'active',
          budget: 10,
          start_date: new Date().toISOString()
        });

      fixes.push({
        issue: 'No campaigns',
        action: 'Created default campaign',
        status: campaignError ? 'FAILED' : 'FIXED',
        message: campaignError ? campaignError.message : 'Campaign created'
      });
    } else {
      fixes.push({
        issue: 'Campaigns',
        action: 'Check campaigns',
        status: 'SKIPPED',
        message: 'Campaigns already exist'
      });
    }

    // Summary
    const fixed = fixes.filter(f => f.status === 'FIXED').length;
    const failed = fixes.filter(f => f.status === 'FAILED').length;
    const skipped = fixes.filter(f => f.status === 'SKIPPED').length;

    return res.status(200).json({
      success: failed === 0,
      summary: {
        total: fixes.length,
        fixed,
        failed,
        skipped
      },
      fixes,
      nextSteps: failed > 0 
        ? ['Check failed fixes and try again']
        : fixed > 0
        ? ['Configuration updated! Visit /integrations to connect affiliate networks']
        : ['Everything is already configured! Visit /dashboard to start']
    });

  } catch (error: any) {
    console.error('❌ Quick fix error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      fixes
    });
  }
}