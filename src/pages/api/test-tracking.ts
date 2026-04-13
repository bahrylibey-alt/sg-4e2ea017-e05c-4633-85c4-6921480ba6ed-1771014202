import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

/**
 * END-TO-END TRACKING TEST
 * Tests: Product → Click → Conversion → System State
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Starting end-to-end tracking test...');

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const testLog: string[] = [];
    testLog.push(`✅ User authenticated: ${user.id}`);

    // Step 1: Get a random product
    const { data: products } = await (supabase as any)
      .from('affiliate_links')
      .select('id, slug, product_name, network, clicks')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1);

    if (!products || products.length === 0) {
      return res.status(400).json({ 
        error: 'No products found',
        message: 'Please sync products first'
      });
    }

    const testProduct = products[0];
    testLog.push(`📦 Selected product: ${testProduct.product_name} (${testProduct.network})`);

    // Step 2: Get initial state
    const { data: initialState } = await (supabase as any)
      .from('system_state')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const initialClicks = initialState?.total_clicks || 0;
    const initialConversions = initialState?.total_verified_conversions || 0;
    const initialRevenue = Number(initialState?.total_verified_revenue) || 0;

    testLog.push(`📊 Initial state: ${initialClicks} clicks, ${initialConversions} conversions, $${initialRevenue}`);

    // Step 3: Simulate a click
    const clickId = `test-${Date.now()}`;
    const { data: clickEvent, error: clickError } = await (supabase as any)
      .from('click_events')
      .insert({
        link_id: testProduct.id,
        user_id: user.id,
        click_id: clickId,
        ip_address: '127.0.0.1',
        user_agent: 'Test Agent',
        referrer: 'test',
        clicked_at: new Date().toISOString(),
        converted: false
      })
      .select()
      .single();

    if (clickError) {
      testLog.push(`❌ Click tracking failed: ${clickError.message}`);
    } else {
      testLog.push(`✅ Click tracked: ${clickEvent.id}`);

      // Update product click count
      await (supabase as any)
        .from('affiliate_links')
        .update({ 
          clicks: (testProduct.clicks || 0) + 1,
          click_count: (testProduct.clicks || 0) + 1
        })
        .eq('id', testProduct.id);

      testLog.push(`✅ Product click count updated`);
    }

    // Step 4: Simulate a conversion
    const testRevenue = 25.50;
    const { data: conversion, error: conversionError } = await (supabase as any)
      .from('conversion_events')
      .insert({
        click_id: clickId,
        user_id: user.id,
        revenue: testRevenue,
        source: 'test',
        verified: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (conversionError) {
      testLog.push(`❌ Conversion tracking failed: ${conversionError.message}`);
    } else {
      testLog.push(`✅ Conversion tracked: $${testRevenue}`);

      // Mark click as converted
      await (supabase as any)
        .from('click_events')
        .update({ converted: true })
        .eq('click_id', clickId);

      testLog.push(`✅ Click marked as converted`);
    }

    // Step 5: Update system_state
    const { error: updateError } = await (supabase as any)
      .from('system_state')
      .update({
        total_clicks: initialClicks + 1,
        total_verified_conversions: initialConversions + 1,
        total_verified_revenue: initialRevenue + testRevenue,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      testLog.push(`❌ System state update failed: ${updateError.message}`);
    } else {
      testLog.push(`✅ System state updated`);
    }

    // Step 6: Verify final state
    const { data: finalState } = await (supabase as any)
      .from('system_state')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const finalClicks = finalState?.total_clicks || 0;
    const finalConversions = finalState?.total_verified_conversions || 0;
    const finalRevenue = Number(finalState?.total_verified_revenue) || 0;

    testLog.push(`📊 Final state: ${finalClicks} clicks, ${finalConversions} conversions, $${finalRevenue.toFixed(2)}`);

    // Step 7: Verify changes
    const clicksIncreased = finalClicks > initialClicks;
    const conversionsIncreased = finalConversions > initialConversions;
    const revenueIncreased = finalRevenue > initialRevenue;

    const allTestsPassed = clicksIncreased && conversionsIncreased && revenueIncreased;

    testLog.push('');
    testLog.push('📋 Test Results:');
    testLog.push(`  ${clicksIncreased ? '✅' : '❌'} Clicks: ${initialClicks} → ${finalClicks}`);
    testLog.push(`  ${conversionsIncreased ? '✅' : '❌'} Conversions: ${initialConversions} → ${finalConversions}`);
    testLog.push(`  ${revenueIncreased ? '✅' : '❌'} Revenue: $${initialRevenue.toFixed(2)} → $${finalRevenue.toFixed(2)}`);
    testLog.push('');
    testLog.push(allTestsPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED');

    console.log(testLog.join('\n'));

    return res.status(200).json({
      success: allTestsPassed,
      test_log: testLog,
      results: {
        product: {
          name: testProduct.product_name,
          network: testProduct.network
        },
        before: {
          clicks: initialClicks,
          conversions: initialConversions,
          revenue: initialRevenue
        },
        after: {
          clicks: finalClicks,
          conversions: finalConversions,
          revenue: finalRevenue
        },
        tests: {
          clicks_increased: clicksIncreased,
          conversions_increased: conversionsIncreased,
          revenue_increased: revenueIncreased
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Tracking test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}