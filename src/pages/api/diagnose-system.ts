import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token from header
    const authHeader = req.headers.authorization;
    let user = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      user = authUser;
    }

    const checks: any[] = [];

    // TEST 1: Database Connection
    try {
      const { error: dbError } = await supabase
        .from('user_settings')
        .select('id')
        .limit(1);
      
      if (dbError) throw dbError;
      
      checks.push({
        component: 'Database',
        status: 'PASS',
        message: 'Database connection successful'
      });
    } catch (error: any) {
      checks.push({
        component: 'Database',
        status: 'FAIL',
        message: `Database error: ${error.message}`
      });
    }

    // If not authenticated, return early with limited info
    if (!user) {
      checks.push({
        component: 'Authentication',
        status: 'FAIL',
        message: 'Not authenticated',
        action: 'Please log in to continue'
      });

      return res.status(200).json({
        status: 'CRITICAL',
        message: 'Authentication required',
        summary: {
          total: checks.length,
          passed: checks.filter(c => c.status === 'PASS').length,
          failed: checks.filter(c => c.status === 'FAIL').length,
          warnings: 0
        },
        checks,
        actions: ['Log in to access full system diagnostics']
      });
    }

    checks.push({
      component: 'Authentication',
      status: 'PASS',
      message: 'User authenticated'
    });

    // TEST 2: User Settings
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (!settings) {
        checks.push({
          component: 'User Settings',
          status: 'WARNING',
          message: 'No user settings configured',
          action: 'Click Quick Fix to create settings'
        });
      } else {
        checks.push({
          component: 'User Settings',
          status: 'PASS',
          message: 'Settings configured'
        });
      }
    } catch (error: any) {
      checks.push({
        component: 'User Settings',
        status: 'WARNING',
        message: error.message,
        action: 'Click Quick Fix to create settings'
      });
    }

    // TEST 3: Autopilot Settings
    try {
      const { data: autopilotSettings, error: autopilotError } = await supabase
        .from('autopilot_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (autopilotError) throw autopilotError;

      if (!autopilotSettings) {
        checks.push({
          component: 'Autopilot Settings',
          status: 'WARNING',
          message: 'Autopilot not configured',
          action: 'Click Quick Fix to configure autopilot'
        });
      } else {
        checks.push({
          component: 'Autopilot Settings',
          status: 'PASS',
          message: 'Autopilot configured'
        });
      }
    } catch (error: any) {
      checks.push({
        component: 'Autopilot Settings',
        status: 'WARNING',
        message: error.message,
        action: 'Click Quick Fix to configure autopilot'
      });
    }

    // TEST 4: Integrations
    try {
      const { data: integrations, count } = await supabase
        .from('affiliate_integrations')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!integrations || integrations.length === 0) {
        checks.push({
          component: 'Integrations',
          status: 'WARNING',
          message: 'No affiliate networks connected',
          action: 'Visit /integrations to connect networks'
        });
      } else {
        checks.push({
          component: 'Integrations',
          status: 'PASS',
          message: `${integrations.length} network(s) connected`
        });
      }
    } catch (error: any) {
      checks.push({
        component: 'Integrations',
        status: 'WARNING',
        message: 'Could not check integrations',
        action: 'Visit /integrations page'
      });
    }

    // TEST 5: Products
    try {
      const { data: products, count } = await supabase
        .from('product_catalog')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .limit(1);

      if (!products || products.length === 0) {
        checks.push({
          component: 'Products',
          status: 'WARNING',
          message: 'No products discovered yet',
          action: 'Click "Find Products" to discover'
        });
      } else {
        checks.push({
          component: 'Products',
          status: 'PASS',
          message: `${count || 0} products in catalog`
        });
      }
    } catch (error: any) {
      checks.push({
        component: 'Products',
        status: 'WARNING',
        message: 'Could not check products',
        action: 'Click "Find Products" button'
      });
    }

    // Calculate summary
    const summary = {
      total: checks.length,
      passed: checks.filter(c => c.status === 'PASS').length,
      failed: checks.filter(c => c.status === 'FAIL').length,
      warnings: checks.filter(c => c.status === 'WARNING').length
    };

    // Determine status
    let status = 'READY';
    if (summary.failed > 0) {
      status = 'CRITICAL';
    } else if (summary.warnings > 2) {
      status = 'PARTIAL';
    }

    // Collect actions
    const actions = checks
      .filter(c => c.action)
      .map(c => c.action);

    return res.status(200).json({
      status,
      message: status === 'READY' 
        ? 'System fully operational' 
        : status === 'PARTIAL'
        ? 'System needs configuration'
        : 'Critical issues detected',
      summary,
      checks,
      actions: [...new Set(actions)]
    });

  } catch (error: any) {
    console.error('Diagnose system error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'System diagnostic failed',
      error: error.message,
      checks: [{
        component: 'System',
        status: 'FAIL',
        message: error.message
      }],
      actions: ['Check server logs', 'Try refreshing the page']
    });
  }
}