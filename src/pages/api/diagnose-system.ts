import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Use service role key for diagnostics
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is authenticated
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    let isAuthenticated = false;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
      isAuthenticated = !!user;
    }

    const results: any[] = [];
    let passCount = 0;
    let failCount = 0;
    let warnCount = 0;

    // CHECK 1: Authentication
    if (!isAuthenticated || !userId) {
      failCount++;
      results.push({
        step: 'Authentication',
        status: 'FAIL',
        message: 'Not authenticated - please log in',
        action: 'Click "Log In" button to authenticate'
      });

      return res.status(200).json({
        status: 'CRITICAL',
        message: 'Authentication required',
        summary: { total: 1, passed: 0, failed: 1, warnings: 0 },
        results,
        actions: ['Log in to access dashboard features']
      });
    }

    passCount++;
    results.push({
      step: 'Authentication',
      status: 'PASS',
      message: 'User authenticated'
    });

    // CHECK 2: User Settings
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!userSettings) {
      failCount++;
      results.push({
        step: 'User Settings',
        status: 'FAIL',
        message: 'User settings missing',
        action: 'Click "Quick Fix" to create default settings'
      });
    } else {
      passCount++;
      results.push({
        step: 'User Settings',
        status: 'PASS',
        message: 'Settings configured'
      });
    }

    // CHECK 3: Autopilot Settings
    const { data: autopilotSettings, error: autopilotError } = await supabase
      .from('autopilot_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!autopilotSettings) {
      failCount++;
      results.push({
        step: 'Autopilot Settings',
        status: 'FAIL',
        message: 'Autopilot settings not configured',
        action: 'Click "Quick Fix" to create default autopilot settings'
      });
    } else {
      passCount++;
      results.push({
        step: 'Autopilot Settings',
        status: 'PASS',
        message: 'Autopilot configured'
      });
    }

    // CHECK 4: Integrations
    const { data: integrations, error: integrationsError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'connected');

    if (!integrations || integrations.length === 0) {
      warnCount++;
      results.push({
        step: 'Integrations',
        status: 'WARN',
        message: 'No integrations connected',
        action: 'Visit /integrations to connect affiliate networks (Amazon, AliExpress, etc.)'
      });
    } else {
      passCount++;
      results.push({
        step: 'Integrations',
        status: 'PASS',
        message: `${integrations.length} network(s) connected`
      });
    }

    // CHECK 5: Products
    const { data: products, error: productsError } = await supabase
      .from('product_catalog')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (!products || products.length === 0) {
      warnCount++;
      results.push({
        step: 'Products',
        status: 'WARN',
        message: 'No products in catalog',
        action: 'Click "Find Products" to discover products from connected networks'
      });
    } else {
      passCount++;
      results.push({
        step: 'Products',
        status: 'PASS',
        message: 'Products available in catalog'
      });
    }

    // CHECK 6: Campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (!campaigns || campaigns.length === 0) {
      warnCount++;
      results.push({
        step: 'Campaigns',
        status: 'WARN',
        message: 'No campaigns created',
        action: 'Click "Quick Fix" to create a default campaign'
      });
    } else {
      passCount++;
      results.push({
        step: 'Campaigns',
        status: 'PASS',
        message: 'Campaign(s) configured'
      });
    }

    // Determine overall status
    let overallStatus = 'READY';
    if (failCount > 0) {
      overallStatus = 'CRITICAL';
    } else if (warnCount > 0) {
      overallStatus = 'PARTIAL';
    }

    // Generate recommendations
    const actions: string[] = [];
    if (failCount > 0) {
      actions.push('Click "Quick Fix" to automatically resolve configuration issues');
    }
    if (warnCount > 0) {
      if (results.some(r => r.step === 'Integrations' && r.status === 'WARN')) {
        actions.push('Visit /integrations to connect affiliate networks (Amazon, AliExpress, etc.)');
      }
      if (results.some(r => r.step === 'Products' && r.status === 'WARN')) {
        actions.push('Click "Find Products" to discover products from connected networks');
      }
    }

    return res.status(200).json({
      status: overallStatus,
      message: overallStatus === 'READY' 
        ? 'All systems operational' 
        : overallStatus === 'PARTIAL'
        ? 'System partially configured - some features need setup'
        : 'Critical issues detected - click Quick Fix',
      summary: {
        total: results.length,
        passed: passCount,
        failed: failCount,
        warnings: warnCount
      },
      results,
      actions
    });

  } catch (error: any) {
    console.error('❌ Diagnostic error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Diagnostic check failed',
      summary: { total: 0, passed: 0, failed: 1, warnings: 0 },
      results: [{
        step: 'System Diagnostic',
        status: 'FAIL',
        message: error.message
      }],
      actions: ['Check server logs for details']
    });
  }
}