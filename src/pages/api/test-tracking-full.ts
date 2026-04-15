import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * COMPREHENSIVE TRACKING TEST
 * Tests: Views → Clicks → Conversions flow
 * Visit: /api/test-tracking-full
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const testResults: any = {
      views: null,
      clicks: null,
      conversions: null,
      database: null
    };

    const userId = 'cd9e03a2-9620-44be-a934-ac2ed69db465';
    const contentId = 'test-content-' + Date.now();
    const clickId = 'test-click-' + Date.now();

    // Get a real link_id from database
    const { data: linkData } = await supabase
      .from('affiliate_links')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (!linkData) {
      throw new Error('No affiliate links found - create products first');
    }

    const linkId = linkData.id;

    // TEST 1: Track Views
    const viewResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/tracking/views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content_id: contentId,
        platform: 'test',
        views: 100,
        user_id: userId
      })
    });
    testResults.views = {
      status: viewResponse.status,
      data: await viewResponse.json()
    };

    // TEST 2: Track Clicks
    const clickResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/tracking/clicks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        link_id: linkId,
        content_id: contentId,
        platform: 'test',
        user_id: userId,
        click_id: clickId,
        ip_address: '192.168.1.1',
        user_agent: 'Test Agent'
      })
    });
    testResults.clicks = {
      status: clickResponse.status,
      data: await clickResponse.json()
    };

    // TEST 3: Track Conversion
    const conversionResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/tracking/conversions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        click_id: clickId,
        content_id: contentId,
        user_id: userId,
        revenue: 15.99,
        source: 'webhook',
        verified: true
      })
    });
    testResults.conversions = {
      status: conversionResponse.status,
      data: await conversionResponse.json()
    };

    // TEST 4: Verify in Database
    const { data: viewEvents } = await supabase
      .from('view_events')
      .select('*')
      .eq('content_id', contentId);

    const { data: clickEvents } = await supabase
      .from('click_events')
      .select('*')
      .eq('click_id', clickId);

    const { data: conversionEvents } = await supabase
      .from('conversion_events')
      .select('*')
      .eq('click_id', clickId);

    testResults.database = {
      viewEvents: viewEvents?.length || 0,
      clickEvents: clickEvents?.length || 0,
      conversionEvents: conversionEvents?.length || 0,
      totalRevenue: conversionEvents?.reduce((sum, c) => sum + Number(c.revenue), 0) || 0
    };

    return res.status(200).json({
      success: true,
      message: 'Tracking test complete',
      results: testResults,
      summary: {
        viewsTracked: testResults.views.data.tracked,
        clicksTracked: testResults.clicks.data.tracked,
        conversionsTracked: testResults.conversions.data.tracked,
        databaseVerified: testResults.database.viewEvents > 0 && 
                          testResults.database.clickEvents > 0 && 
                          testResults.database.conversionEvents > 0
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}