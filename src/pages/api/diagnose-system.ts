import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

interface DiagnosticCheck {
  component: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  action?: string;
  data?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checks: DiagnosticCheck[] = [];

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      checks.push({
        component: 'Authentication',
        status: 'FAIL',
        message: 'No authenticated user',
        action: 'Please log in to use the system'
      });
      
      return res.status(200).json({
        status: 'CRITICAL',
        totalChecks: checks.length,
        passed: 0,
        failed: 1,
        warnings: 0,
        checks,
        recommendations: ['Log in to your account to proceed']
      });
    }

    checks.push({
      component: 'Authentication',
      status: 'PASS',
      message: 'User authenticated',
      data: { userId: user.id, email: user.email }
    });

    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      checks.push({
        component: 'User Profile',
        status: 'WARNING',
        message: 'Profile not found or incomplete',
        action: 'Profile will be created automatically'
      });
    } else {
      checks.push({
        component: 'User Profile',
        status: 'PASS',
        message: 'Profile exists',
        data: { email: profile.email, created: profile.created_at }
      });
    }

    // Check user settings
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (settingsError || !userSettings) {
      checks.push({
        component: 'User Settings',
        status: 'WARNING',
        message: 'No user settings configured',
        action: 'Visit /settings to configure preferences'
      });
    } else {
      checks.push({
        component: 'User Settings',
        status: 'PASS',
        message: 'Settings configured',
        data: {
          timezone: userSettings.timezone,
          notifications: userSettings.email_notifications
        }
      });
    }

    // Check autopilot settings
    const { data: autopilotSettings, error: autopilotError } = await supabase
      .from('autopilot_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (autopilotError || !autopilotSettings) {
      checks.push({
        component: 'Autopilot Settings',
        status: 'WARNING',
        message: 'Autopilot not configured',
        action: 'Visit /settings to configure autopilot'
      });
    } else {
      checks.push({
        component: 'Autopilot Settings',
        status: 'PASS',
        message: 'Autopilot configured',
        data: {
          enabled: autopilotSettings.enabled,
          budget: autopilotSettings.daily_budget
        }
      });
    }

    // Check integrations
    const { data: integrations, error: integrationsError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'connected');

    if (integrationsError || !integrations || integrations.length === 0) {
      checks.push({
        component: 'Affiliate Networks',
        status: 'FAIL',
        message: 'No affiliate networks connected',
        action: 'Visit /integrations to connect Amazon, AliExpress, or other networks'
      });
    } else {
      const networksWithKeys = integrations.filter(i => {
        const config = i.config as any;
        return config?.api_key && config.api_key !== 'your_api_key_here';
      });

      if (networksWithKeys.length === 0) {
        checks.push({
          component: 'Affiliate Networks',
          status: 'WARNING',
          message: `${integrations.length} networks connected but no valid API keys`,
          action: 'Add valid API keys in /integrations',
          data: { networks: integrations.map(i => i.provider) }
        });
      } else {
        checks.push({
          component: 'Affiliate Networks',
          status: 'PASS',
          message: `${networksWithKeys.length} networks with valid API keys`,
          data: { 
            connected: networksWithKeys.map(i => i.provider),
            needsKeys: integrations.filter(i => !networksWithKeys.includes(i)).map(i => i.provider)
          }
        });
      }
    }

    // Check products
    const { data: products, error: productsError } = await supabase
      .from('product_catalog')
      .select('id, network, status')
      .eq('status', 'active');

    if (productsError || !products || products.length === 0) {
      checks.push({
        component: 'Product Catalog',
        status: 'FAIL',
        message: 'No products discovered yet',
        action: 'Click "Find Products" in dashboard or run /api/run-product-discovery'
      });
    } else {
      const byNetwork = products.reduce((acc, p) => {
        acc[p.network] = (acc[p.network] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      checks.push({
        component: 'Product Catalog',
        status: 'PASS',
        message: `${products.length} active products`,
        data: { total: products.length, byNetwork }
      });
    }

    // Check affiliate links
    const { data: links, error: linksError } = await supabase
      .from('affiliate_links')
      .select('id, status, clicks, conversions')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (linksError || !links || links.length === 0) {
      checks.push({
        component: 'Affiliate Links',
        status: 'WARNING',
        message: 'No active affiliate links',
        action: 'Links are created automatically when products are discovered'
      });
    } else {
      const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
      const totalConversions = links.reduce((sum, l) => sum + (l.conversions || 0), 0);

      checks.push({
        component: 'Affiliate Links',
        status: 'PASS',
        message: `${links.length} active links`,
        data: { 
          total: links.length,
          clicks: totalClicks,
          conversions: totalConversions
        }
      });
    }

    // Check Edge Function
    const { data: edgeFunctionTest, error: edgeError } = await supabase.functions.invoke('autopilot-engine', {
      body: { userId: user.id, dryRun: true }
    });

    if (edgeError) {
      checks.push({
        component: 'Edge Function',
        status: 'FAIL',
        message: 'Autopilot engine not responding',
        action: 'Edge function may need to be redeployed',
        data: { error: edgeError.message }
      });
    } else {
      checks.push({
        component: 'Edge Function',
        status: 'PASS',
        message: 'Autopilot engine operational',
        data: edgeFunctionTest
      });
    }

    // Calculate summary
    const passed = checks.filter(c => c.status === 'PASS').length;
    const failed = checks.filter(c => c.status === 'FAIL').length;
    const warnings = checks.filter(c => c.status === 'WARNING').length;

    const recommendations: string[] = checks
      .filter(c => c.action)
      .map(c => c.action!);

    const overallStatus = failed > 0 ? 'CRITICAL' : warnings > 0 ? 'PARTIAL' : 'READY';

    return res.status(200).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      totalChecks: checks.length,
      passed,
      failed,
      warnings,
      checks,
      recommendations,
      nextSteps: failed > 0 
        ? ['Fix critical issues listed above']
        : warnings > 0
        ? ['Complete recommended configurations']
        : ['System ready - enable autopilot in dashboard']
    });

  } catch (error: any) {
    console.error('❌ Diagnostic error:', error);
    return res.status(500).json({
      status: 'ERROR',
      error: error.message,
      checks
    });
  }
}