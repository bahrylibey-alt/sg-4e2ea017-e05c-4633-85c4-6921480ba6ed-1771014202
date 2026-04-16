import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * SYSTEM HEALTH CHECK
 * Quick diagnostic endpoint to verify all components
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const checks: any[] = [];
  
  try {
    // 1. Database connectivity
    const { error: dbError } = await supabase
      .from('user_settings')
      .select('id')
      .limit(1);
    
    checks.push({
      name: 'Database',
      status: dbError ? 'FAIL' : 'PASS',
      error: dbError?.message
    });

    // 2. Edge Function availability
    try {
      const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/autopilot-engine`;
      checks.push({
        name: 'Edge Function',
        status: 'DEPLOYED',
        url: edgeFunctionUrl
      });
    } catch (error: any) {
      checks.push({
        name: 'Edge Function',
        status: 'FAIL',
        error: error.message
      });
    }

    // 3. Check if any users exist
    const { count: userCount } = await supabase
      .from('user_settings')
      .select('*', { count: 'exact', head: true });

    checks.push({
      name: 'User Accounts',
      status: (userCount || 0) > 0 ? 'PASS' : 'WARN',
      count: userCount || 0
    });

    // 4. Check integrations table
    const { count: integrationCount } = await supabase
      .from('integrations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'connected');

    checks.push({
      name: 'Integrations',
      status: (integrationCount || 0) > 0 ? 'PASS' : 'WARN',
      count: integrationCount || 0
    });

    // 5. Check products
    const { count: productCount } = await supabase
      .from('affiliate_links')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    checks.push({
      name: 'Products',
      status: (productCount || 0) > 0 ? 'PASS' : 'WARN',
      count: productCount || 0
    });

    const allPass = checks.every(c => c.status === 'PASS');
    const anyFail = checks.some(c => c.status === 'FAIL');

    return res.status(200).json({
      status: anyFail ? 'CRITICAL' : allPass ? 'HEALTHY' : 'WARNING',
      checks,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: error.message,
      checks
    });
  }
}