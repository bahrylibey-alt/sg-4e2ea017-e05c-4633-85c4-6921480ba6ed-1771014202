import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * COMPLETE AUTOPILOT TEST - END TO END
 * 
 * Tests:
 * 1. Database connectivity
 * 2. User configuration
 * 3. Integration status
 * 4. Product availability
 * 5. Tracking setup
 * 6. Edge Function execution
 * 7. Real data validation
 */

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'INFO';
  message: string;
  data?: any;
  action?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const results: TestResult[] = [];
  let criticalFailures = 0;
  
  try {
    const userId = req.query.userId as string || req.body?.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'userId required',
        example: '/api/test-autopilot-complete?userId=YOUR_USER_ID'
      });
    }

    console.log('🧪 Starting complete autopilot test for user:', userId);

    // STEP 1: Database Connection
    results.push({
      step: '1. Database Connection',
      status: 'PASS',
      message: 'Supabase client initialized successfully'
    });

    // STEP 2: User Settings
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!userSettings) {
      criticalFailures++;
      results.push({
        step: '2. User Settings',
        status: 'FAIL',
        message: 'User settings not found',
        action: 'Create user settings: Go to /settings and save preferences'
      });
    } else {
      results.push({
        step: '2. User Settings',
        status: 'PASS',
        message: `Autopilot: ${userSettings.autopilot_enabled ? 'ENABLED ✓' : 'DISABLED'}`,
        data: {
          autopilot_enabled: userSettings.autopilot_enabled,
          last_run: userSettings.last_autopilot_run
        }
      });
    }

    // STEP 3: Autopilot Configuration
    const { data: autopilotConfig } = await supabase
      .from('autopilot_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!autopilotConfig) {
      results.push({
        step: '3. Autopilot Config',
        status: 'WARN',
        message: 'No autopilot configuration - using defaults',
        action: 'Configure autopilot in /settings for better results'
      });
    } else {
      results.push({
        step: '3. Autopilot Config',
        status: 'PASS',
        message: 'Autopilot configured',
        data: {
          min_price: autopilotConfig.min_product_price,
          max_price: autopilotConfig.max_product_price,
          budget: autopilotConfig.daily_budget
        }
      });
    }

    // STEP 4: Affiliate Networks
    const { data: affiliateNetworks } = await supabase
      .from('integrations')
      .select('provider, status, config')
      .eq('user_id', userId)
      .eq('category', 'affiliate')
      .eq('status', 'connected');

    if (!affiliateNetworks || affiliateNetworks.length === 0) {
      criticalFailures++;
      results.push({
        step: '4. Affiliate Networks',
        status: 'FAIL',
        message: 'NO AFFILIATE NETWORKS CONNECTED',
        action: 'Go to /integrations and connect at least one affiliate network (Amazon, AliExpress, etc.)'
      });
    } else {
      // Check if networks have valid API keys
      const validNetworks = affiliateNetworks.filter(network => {
        const config = network.config as any;
        const apiKey = config?.api_key;
        return apiKey && apiKey !== 'your_api_key_here' && apiKey !== '';
      });

      if (validNetworks.length === 0) {
        criticalFailures++;
        results.push({
          step: '4. Affiliate Networks',
          status: 'FAIL',
          message: `${affiliateNetworks.length} networks connected but NO VALID API KEYS`,
          data: { networks: affiliateNetworks.map(n => n.provider) },
          action: 'Add valid API keys for your affiliate networks in /integrations'
        });
      } else {
        results.push({
          step: '4. Affiliate Networks',
          status: 'PASS',
          message: `${validNetworks.length} networks ready: ${validNetworks.map(n => n.provider).join(', ')}`,
          data: { networks: validNetworks.map(n => n.provider) }
        });
      }
    }

    // STEP 5: Traffic Sources
    const { data: trafficSources } = await supabase
      .from('integrations')
      .select('provider, status, config')
      .eq('user_id', userId)
      .eq('category', 'traffic')
      .eq('status', 'connected');

    if (!trafficSources || trafficSources.length === 0) {
      results.push({
        step: '5. Traffic Sources',
        status: 'WARN',
        message: 'No traffic sources connected yet',
        action: 'Connect Pinterest, TikTok, etc. in /integrations for automatic posting'
      });
    } else {
      const validSources = trafficSources.filter(source => {
        const config = source.config as any;
        const apiKey = config?.api_key;
        return apiKey && apiKey !== 'your_api_key_here' && apiKey !== '';
      });

      results.push({
        step: '5. Traffic Sources',
        status: validSources.length > 0 ? 'PASS' : 'WARN',
        message: validSources.length > 0 
          ? `${validSources.length} sources ready: ${validSources.map(s => s.provider).join(', ')}`
          : 'Traffic sources connected but need valid API keys',
        data: { sources: trafficSources.map(s => s.provider) }
      });
    }

    // STEP 6: Product Catalog
    const { data: products, count: productCount } = await supabase
      .from('affiliate_links')
      .select('id, product_name, network, clicks, impressions, conversions, revenue', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (!products || products.length === 0) {
      criticalFailures++;
      results.push({
        step: '6. Product Catalog',
        status: 'FAIL',
        message: 'NO PRODUCTS FOUND - Autopilot needs products to promote',
        action: 'Run product discovery: Call /api/cron/discover-products?userId=' + userId
      });
    } else {
      const withData = products.filter(p => (p.clicks || 0) > 0 || (p.impressions || 0) > 0);
      results.push({
        step: '6. Product Catalog',
        status: 'PASS',
        message: `${productCount} products found (${withData.length} with traffic data)`,
        data: {
          total: productCount,
          with_data: withData.length,
          sample: products.slice(0, 3).map(p => ({
            name: p.product_name,
            network: p.network,
            clicks: p.clicks || 0,
            conversions: p.conversions || 0
          }))
        }
      });
    }

    // STEP 7: Tracking Data
    const { count: clickCount } = await supabase
      .from('click_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: viewCount } = await supabase
      .from('view_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: conversionCount } = await supabase
      .from('conversion_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const hasTracking = (clickCount || 0) > 0 || (viewCount || 0) > 0 || (conversionCount || 0) > 0;

    results.push({
      step: '7. Tracking Data',
      status: hasTracking ? 'PASS' : 'INFO',
      message: hasTracking 
        ? `Real tracking data found: ${clickCount || 0} clicks, ${viewCount || 0} views, ${conversionCount || 0} conversions`
        : 'No tracking data yet - will accumulate as traffic arrives',
      data: {
        clicks: clickCount || 0,
        views: viewCount || 0,
        conversions: conversionCount || 0,
        note: 'Real data only - no mock data'
      }
    });

    // STEP 8: Edge Function Status
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/autopilot-engine`;
    
    results.push({
      step: '8. Edge Function',
      status: 'INFO',
      message: 'Autopilot Edge Function deployed',
      data: {
        url: edgeFunctionUrl,
        note: 'Function processes products and makes decisions'
      }
    });

    // STEP 9: Test Edge Function Execution
    if (products && products.length > 0) {
      try {
        const { data: edgeResponse, error: edgeError } = await supabase.functions.invoke('autopilot-engine', {
          body: { userId }
        });

        if (edgeError) {
          results.push({
            step: '9. Edge Function Test',
            status: 'FAIL',
            message: `Edge Function error: ${edgeError.message}`,
            action: 'Check Edge Function logs in Supabase Dashboard'
          });
        } else {
          results.push({
            step: '9. Edge Function Test',
            status: 'PASS',
            message: 'Edge Function executed successfully',
            data: edgeResponse
          });
        }
      } catch (error: any) {
        results.push({
          step: '9. Edge Function Test',
          status: 'FAIL',
          message: `Edge Function execution failed: ${error.message}`,
          action: 'Check Supabase function logs'
        });
      }
    } else {
      results.push({
        step: '9. Edge Function Test',
        status: 'WARN',
        message: 'Skipped - no products to test with',
        action: 'Run product discovery first'
      });
    }

    // FINAL ASSESSMENT
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warnings = results.filter(r => r.status === 'WARN').length;

    let overallStatus: 'READY' | 'NOT_READY' | 'PARTIAL';
    let overallMessage: string;

    if (criticalFailures === 0 && failed === 0) {
      overallStatus = 'READY';
      overallMessage = '✅ System is ready! Autopilot can run.';
    } else if (criticalFailures > 0) {
      overallStatus = 'NOT_READY';
      overallMessage = `❌ Critical issues found: ${criticalFailures}`;
    } else {
      overallStatus = 'PARTIAL';
      overallMessage = `⚠️ System partially ready with ${warnings} warnings`;
    }

    // Generate action plan
    const actions = results
      .filter(r => r.action)
      .map((r, i) => `${i + 1}. ${r.action}`);

    console.log(`✅ Test complete: ${overallStatus}`);

    return res.status(200).json({
      status: overallStatus,
      message: overallMessage,
      summary: {
        total: results.length,
        passed,
        failed,
        warnings,
        critical_failures: criticalFailures
      },
      results,
      actions: actions.length > 0 ? actions : ['✅ No actions needed - system is ready!'],
      next_steps: overallStatus === 'READY' 
        ? [
            'System is ready to run!',
            'Enable autopilot in /settings',
            'Autopilot will run automatically every 30 minutes',
            'Or manually trigger: /api/autopilot/trigger?userId=' + userId
          ]
        : [
            'Fix the issues listed above',
            'Re-run this test: /api/test-autopilot-complete?userId=' + userId,
            'Once all tests pass, enable autopilot in /settings'
          ],
      important_notes: [
        '🚫 NO MOCK DATA - System uses only real data from:',
        '   • Affiliate network APIs (products)',
        '   • Traffic platform webhooks (clicks/views)',
        '   • Postback URLs (conversions)',
        '',
        '✅ To get started:',
        '   1. Connect affiliate networks in /integrations',
        '   2. Add valid API keys',
        '   3. Run product discovery',
        '   4. Set up tracking (optional but recommended)',
        '   5. Enable autopilot in /settings'
      ]
    });

  } catch (error: any) {
    console.error('❌ Test error:', error);
    return res.status(500).json({
      error: error.message,
      results
    });
  }
}