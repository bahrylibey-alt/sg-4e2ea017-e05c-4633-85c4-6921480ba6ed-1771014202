import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        error: "Not authenticated",
        message: "Please log in first"
      });
    }

    console.log(`🔧 Running Quick Fix for user: ${userId}`);

    const fixes: any[] = [];
    let fixedCount = 0;
    let failedCount = 0;

    // FIX 1: User Settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!settings) {
      const { error: createSettingsError } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          timezone: 'UTC',
          notification_email: true,
          conversion_tracking_enabled: true,
          commission_calculations_enabled: true
        } as any);

      if (createSettingsError) {
        console.error('Failed to create user settings:', createSettingsError);
        failedCount++;
        fixes.push({
          issue: 'Missing user settings',
          action: 'Attempted to create',
          status: 'FAILED',
          error: createSettingsError.message
        });
      } else {
        fixedCount++;
        fixes.push({
          issue: 'Missing user settings',
          action: 'Created default settings',
          status: 'FIXED'
        });
      }
    }

    // FIX 2: Autopilot Settings
    const { data: autopilotSettings, error: autopilotError } = await supabase
      .from('autopilot_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!autopilotSettings) {
      const { error: createAutopilotError } = await supabase
        .from('autopilot_settings')
        .insert({
          user_id: userId,
          enabled: true,
          min_product_price: 10,
          max_product_price: 500,
          budget_limit: 100,
          daily_budget: 10
        } as any);

      if (createAutopilotError) {
        console.error('Failed to create autopilot settings:', createAutopilotError);
        failedCount++;
        fixes.push({
          issue: 'Missing autopilot settings',
          action: 'Attempted to create',
          status: 'FAILED',
          error: createAutopilotError.message
        });
      } else {
        fixedCount++;
        fixes.push({
          issue: 'Missing autopilot settings',
          action: 'Created default autopilot config',
          status: 'FIXED'
        });
      }
    }

    // FIX 3: Default Campaign
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (!campaigns || campaigns.length === 0) {
      const { error: createCampaignError } = await supabase
        .from('campaigns')
        .insert({
          user_id: userId,
          name: 'Main Campaign',
          status: 'active',
          budget: 10,
          goal: 'revenue',
          start_date: new Date().toISOString()
        } as any);

      if (createCampaignError) {
        console.error('Failed to create campaign:', createCampaignError);
        failedCount++;
        fixes.push({
          issue: 'No campaigns',
          action: 'Attempted to create',
          status: 'FAILED',
          error: createCampaignError.message
        });
      } else {
        fixedCount++;
        fixes.push({
          issue: 'No campaigns',
          action: 'Created default campaign',
          status: 'FIXED'
        });
      }
    }

    // FIX 4: Traffic Sources
    const { data: userCampaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', userId);
    
    const userCampaignIds = userCampaigns?.map(c => c.id) || [];
    let trafficCount = 0;
    
    if (userCampaignIds.length > 0) {
      const { count } = await supabase
        .from('traffic_sources')
        .select('*', { count: 'exact', head: true })
        .in('campaign_id', userCampaignIds)
        .eq('status', 'active');
      trafficCount = count || 0;
    }

    if (trafficCount === 0) {
      // Create default campaign if none exists
      let defaultCampaignId;
      if (userCampaignIds.length === 0) {
        const { data: newCampaign } = await supabase
          .from('campaigns')
          .insert({
            user_id: userId,
            name: 'Default Campaign',
            status: 'active'
          })
          .select()
          .single();
        defaultCampaignId = newCampaign?.id;
      } else {
        defaultCampaignId = userCampaignIds[0];
      }

      if (defaultCampaignId) {
        await supabase
          .from('traffic_sources')
          .insert({
            campaign_id: defaultCampaignId,
            name: 'Pinterest',
            platform: 'pinterest',
            status: 'active'
          } as any);

        await supabase
          .from('traffic_sources')
          .insert({
            campaign_id: defaultCampaignId,
            name: 'TikTok',
            platform: 'tiktok',
            status: 'active'
          } as any);

        fixedCount++;
        fixes.push({
          issue: 'No traffic sources',
          action: 'Created default traffic sources',
          status: 'FIXED'
        });
      }
    }

    console.log(`✅ Quick Fix complete: ${fixedCount} fixed, ${failedCount} failed`);

    return res.status(200).json({
      success: failedCount === 0,
      message: `Quick Fix ${failedCount === 0 ? 'complete' : 'partial'}`,
      summary: {
        fixed: fixedCount,
        failed: failedCount,
        total: fixes.length
      },
      fixes
    });

  } catch (error: any) {
    console.error('❌ Quick Fix error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}