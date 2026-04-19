import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

interface DiagnosticResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'INFO';
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

  const results: DiagnosticResult[] = [];

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return res.status(200).json({
        status: 'CRITICAL',
        message: 'Not authenticated - please log in',
        summary: { total: 1, passed: 0, failed: 1, warnings: 0 },
        results: [{
          step: 'Authentication',
          status: 'FAIL',
          message: 'No authenticated user',
          action: 'Please log in to use the system'
        }],
        actions: ['Click the login button in the header to get started']
      });
    }

    results.push({
      step: 'Authentication',
      status: 'PASS',
      message: `Logged in as ${user.email}`,
      data: { userId: user.id }
    });

    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      results.push({
        step: 'User Profile',
        status: 'WARN',
        message: 'Profile not found',
        action: 'Click Quick Fix to create profile automatically'
      });
    } else {
      results.push({
        step: 'User Profile',
        status: 'PASS',
        message: 'Profile exists'
      });
    }

    // Check user settings
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!userSettings) {
      results.push({
        step: 'User Settings',
        status: 'WARN',
        message: 'Settings not configured',
        action: 'Click Quick Fix to configure automatically'
      });
    } else {
      results.push({
        step: 'User Settings',
        status: 'PASS',
        message: 'Settings configured'
      });
    }

    // Check autopilot settings
    const { data: autopilotSettings } = await supabase
      .from('autopilot_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!autopilotSettings) {
      results.push({
        step: 'Autopilot Settings',
        status: 'WARN',
        message: 'Autopilot not configured',
        action: 'Click Quick Fix to configure autopilot'
      });
    } else {
      results.push({
        step: 'Autopilot Settings',
        status: 'PASS',
        message: 'Autopilot configured'
      });
    }

    // Check integrations
    const { data: integrations } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'connected');

    if (!integrations || integrations.length === 0) {
      results.push({
        step: 'Affiliate Networks',
        status: 'FAIL',
        message: 'No affiliate networks connected',
        action: 'Visit /integrations to connect Amazon, AliExpress, etc.'
      });
    } else {
      const networksWithKeys = integrations.filter(i => {
        const config = i.config as any;
        return config?.api_key && config.api_key !== 'your_api_key_here';
      });

      if (networksWithKeys.length === 0) {
        results.push({
          step: 'Affiliate Networks',
          status: 'WARN',
          message: `${integrations.length} networks connected but no valid API keys`,
          action: 'Add valid API keys in /integrations'
        });
      } else {
        results.push({
          step: 'Affiliate Networks',
          status: 'PASS',
          message: `${networksWithKeys.length} networks with valid API keys`
        });
      }
    }

    // Check products
    const { data: products } = await supabase
      .from('product_catalog')
      .select('id, network, status')
      .eq('status', 'active');

    if (!products || products.length === 0) {
      results.push({
        step: 'Product Catalog',
        status: 'FAIL',
        message: 'No products discovered yet',
        action: 'Click "Find Products" to discover real products from your networks'
      });
    } else {
      results.push({
        step: 'Product Catalog',
        status: 'PASS',
        message: `${products.length} active products discovered`
      });
    }

    // Check affiliate links
    const { data: links } = await supabase
      .from('affiliate_links')
      .select('id, status, clicks, conversions')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (!links || links.length === 0) {
      results.push({
        step: 'Affiliate Links',
        status: 'WARN',
        message: 'No active affiliate links',
        action: 'Links are created automatically when products are discovered'
      });
    } else {
      results.push({
        step: 'Affiliate Links',
        status: 'PASS',
        message: `${links.length} active links`
      });
    }

    // Calculate summary
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warnings = results.filter(r => r.status === 'WARN').length;

    const actions = results
      .filter(r => r.action)
      .map(r => r.action!);

    const overallStatus = failed > 0 ? 'CRITICAL' : warnings > 0 ? 'PARTIAL' : 'READY';

    return res.status(200).json({
      status: overallStatus,
      message: overallStatus === 'READY' 
        ? 'All systems operational' 
        : overallStatus === 'PARTIAL'
        ? 'System partially configured - complete setup to activate autopilot'
        : 'Critical configuration required - follow recommended actions',
      summary: {
        total: results.length,
        passed,
        failed,
        warnings
      },
      results,
      actions
    });

  } catch (error: any) {
    console.error('❌ Diagnostic error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: error.message,
      summary: { total: 0, passed: 0, failed: 1, warnings: 0 },
      results: [{
        step: 'System Check',
        status: 'FAIL',
        message: error.message
      }],
      actions: ['Check server logs for details']
    });
  }
}