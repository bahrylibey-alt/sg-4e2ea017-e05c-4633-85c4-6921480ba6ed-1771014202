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
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const results: any[] = [];

    // TEST 1: Authentication
    if (!userId) {
      results.push({
        step: '1. Authentication',
        status: 'FAIL',
        message: 'Not authenticated - Please log in first',
        action: 'Visit /dashboard and log in'
      });
      return res.status(200).json({
        status: 'CRITICAL',
        message: 'Authentication required',
        summary: { total: 1, passed: 0, failed: 1, warnings: 0 },
        results,
        actions: ['Log in to your account to continue']
      });
    }

    results.push({
      step: '1. Authentication',
      status: 'PASS',
      message: `Authenticated as user: ${userId}`,
      data: { userId }
    });

    // TEST 2: Database Connectivity
    try {
      const { data: testQuery, error: dbError } = await supabase
        .from('user_settings')
        .select('id')
        .limit(1);
      
      if (dbError) throw dbError;
      
      results.push({
        step: '2. Database',
        status: 'PASS',
        message: 'Database connection successful'
      });
    } catch (error: any) {
      results.push({
        step: '2. Database',
        status: 'FAIL',
        message: `Database error: ${error.message}`
      });
    }

    // TEST 3: User Settings
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!userSettings) {
      results.push({
        step: '3. User Settings',
        status: 'WARN',
        message: 'No user settings found',
        action: 'Click Quick Fix to create default settings'
      });
    } else {
      results.push({
        step: '3. User Settings',
        status: 'PASS',
        message: 'User settings configured'
      });
    }

    // TEST 4: Autopilot Settings
    const { data: autopilotConfig } = await supabase
      .from('autopilot_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!autopilotConfig) {
      results.push({
        step: '4. Autopilot Config',
        status: 'WARN',
        message: 'Autopilot not configured',
        action: 'Click Quick Fix to configure autopilot'
      });
    } else {
      results.push({
        step: '4. Autopilot Config',
        status: 'PASS',
        message: 'Autopilot configured',
        data: {
          min_price: (autopilotConfig as any).min_product_price,
          max_price: (autopilotConfig as any).max_product_price,
          budget: (autopilotConfig as any).daily_budget || (autopilotConfig as any).budget_limit
        }
      });
    }

    // TEST 5: Affiliate Networks
    const { data: integrations } = await supabase
      .from('affiliate_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!integrations || integrations.length === 0) {
      results.push({
        step: '5. Affiliate Networks',
        status: 'WARN',
        message: 'No integrations connected',
        action: 'Visit /integrations to add affiliate networks'
      });
    } else {
      results.push({
        step: '5. Affiliate Networks',
        status: 'PASS',
        message: `${integrations.length} network(s) connected`,
        data: { networks: integrations.map((i: any) => i.provider_name) }
      });
    }

    // TEST 6: Product Catalog
    const { data: products } = await supabase
      .from('product_catalog')
      .select('id, name, network, commission_rate, price')
      .eq('user_id', userId)
      .limit(5);

    if (!products || products.length === 0) {
      results.push({
        step: '6. Product Catalog',
        status: 'WARN',
        message: 'No products discovered yet',
        action: 'Click "Find Products" to discover from networks'
      });
    } else {
      results.push({
        step: '6. Product Catalog',
        status: 'PASS',
        message: `${products.length} products in catalog`,
        data: { sample: products }
      });
    }

    // TEST 7: Traffic Sources
    const { data: trafficSources } = await supabase
      .from('traffic_sources')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!trafficSources || trafficSources.length === 0) {
      results.push({
        step: '7. Traffic Sources',
        status: 'WARN',
        message: 'No traffic sources configured',
        action: 'Visit /integrations to connect traffic sources'
      });
    } else {
      results.push({
        step: '7. Traffic Sources',
        status: 'PASS',
        message: `${trafficSources.length} traffic source(s) active`,
        data: { sources: trafficSources.map((t: any) => t.platform) }
      });
    }

    // TEST 8: Click Tracking
    const { data: clicks, count: clickCount } = await supabase
      .from('click_tracking')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .limit(5);

    if (!clicks || clicks.length === 0) {
      results.push({
        step: '8. Click Tracking',
        status: 'INFO',
        message: 'No clicks tracked yet (normal for new setup)',
        action: 'Clicks will appear after traffic starts flowing'
      });
    } else {
      results.push({
        step: '8. Click Tracking',
        status: 'PASS',
        message: `${clickCount || 0} total clicks tracked`,
        data: { recentClicks: clicks.slice(0, 3) }
      });
    }

    // TEST 9: Conversions
    const { data: conversions, count: conversionCount } = await supabase
      .from('conversion_tracking')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .limit(5);

    if (!conversions || conversions.length === 0) {
      results.push({
        step: '9. Conversions',
        status: 'INFO',
        message: 'No conversions yet (normal for new setup)',
        action: 'Conversions will appear after sales occur'
      });
    } else {
      const totalRevenue = conversions.reduce((sum: number, c: any) => sum + (Number(c.revenue) || 0), 0);
      results.push({
        step: '9. Conversions',
        status: 'PASS',
        message: `${conversionCount || 0} conversions tracked`,
        data: { 
          conversions: conversionCount,
          totalRevenue: `$${totalRevenue.toFixed(2)}`
        }
      });
    }

    // TEST 10: AI Autopilot Scores
    const { data: scores } = await supabase
      .from('performance_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!scores || scores.length === 0) {
      results.push({
        step: '10. AI Scores',
        status: 'INFO',
        message: 'No AI scores yet',
        action: 'Click "Run Autopilot" to generate scores'
      });
    } else {
      const avgScore = scores.reduce((sum: number, s: any) => sum + (Number(s.score) || 0), 0) / scores.length;
      results.push({
        step: '10. AI Scores',
        status: 'PASS',
        message: `${scores.length} items scored`,
        data: { 
          averageScore: avgScore.toFixed(3),
          recentScores: scores.slice(0, 3).map((s: any) => ({
            id: s.content_id,
            score: Number(s.score).toFixed(3),
            classification: s.classification
          }))
        }
      });
    }

    // Calculate summary
    const summary = {
      total: results.length,
      passed: results.filter((r: any) => r.status === 'PASS').length,
      failed: results.filter((r: any) => r.status === 'FAIL').length,
      warnings: results.filter((r: any) => r.status === 'WARN').length
    };

    // Determine overall status
    let status = 'READY';
    if (summary.failed > 0) {
      status = 'CRITICAL';
    } else if (summary.warnings > 2) {
      status = 'PARTIAL';
    }

    // Generate actions
    const actions: string[] = [];
    results.forEach((r: any) => {
      if (r.action) actions.push(r.action);
    });

    return res.status(200).json({
      status,
      message: status === 'READY' 
        ? 'System fully operational' 
        : status === 'PARTIAL'
        ? 'System partially configured - some features need setup'
        : 'System needs configuration',
      summary,
      results,
      actions: [...new Set(actions)] // Remove duplicates
    });

  } catch (error: any) {
    console.error('Test system error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: error.message,
      summary: { total: 0, passed: 0, failed: 1, warnings: 0 },
      results: [{
        step: 'System Test',
        status: 'FAIL',
        message: error.message
      }],
      actions: ['Check server logs for details']
    });
  }
}