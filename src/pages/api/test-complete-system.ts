import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { contentIntelligence } from "@/services/contentIntelligence";

/**
 * COMPLETE SYSTEM TEST
 * Tests all critical paths end-to-end
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🧪 COMPLETE SYSTEM TEST STARTING...');
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: { passed: 0, failed: 0, total: 0 }
    };

    // TEST 1: Database Connection
    console.log('\n📊 TEST 1: Database Connection');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) throw error;

      results.tests.database = {
        status: '✅ PASSED',
        users: data?.length || 0
      };
      results.summary.passed++;
    } catch (error: any) {
      results.tests.database = {
        status: '❌ FAILED',
        error: error.message
      };
      results.summary.failed++;
    }
    results.summary.total++;

    // TEST 2: Published Content Check
    console.log('\n📝 TEST 2: Published Content');
    try {
      const { data: content, count } = await supabase
        .from('generated_content')
        .select('id, title, body, status', { count: 'exact' })
        .eq('status', 'published')
        .limit(5);

      const withUrls = content?.filter(c => /https?:\/\/|href="\/go\//.test(c.body)).length || 0;

      results.tests.publishedContent = {
        status: withUrls > 0 ? '✅ PASSED' : '⚠️ WARNING',
        total: count,
        withAffiliateUrls: withUrls,
        samples: content?.slice(0, 3).map(c => ({
          id: c.id.substring(0, 8),
          title: c.title.substring(0, 50),
          hasUrl: /https?:\/\/|href="\/go\//.test(c.body)
        }))
      };

      if (withUrls > 0) results.summary.passed++;
      else results.summary.failed++;
    } catch (error: any) {
      results.tests.publishedContent = {
        status: '❌ FAILED',
        error: error.message
      };
      results.summary.failed++;
    }
    results.summary.total++;

    // TEST 3: Affiliate Links Routing
    console.log('\n🔗 TEST 3: Affiliate Links');
    try {
      const { data: links } = await supabase
        .from('affiliate_links')
        .select('slug, product_name, original_url, status')
        .eq('status', 'active')
        .limit(5);

      results.tests.affiliateLinks = {
        status: links && links.length > 0 ? '✅ PASSED' : '⚠️ NO LINKS',
        count: links?.length || 0,
        samples: links?.slice(0, 3).map(l => ({
          slug: l.slug,
          product: l.product_name?.substring(0, 30),
          destination: l.original_url?.substring(0, 50)
        }))
      };

      if (links && links.length > 0) results.summary.passed++;
      else results.summary.failed++;
    } catch (error: any) {
      results.tests.affiliateLinks = {
        status: '❌ FAILED',
        error: error.message
      };
      results.summary.failed++;
    }
    results.summary.total++;

    // TEST 4: Autopilot Status
    console.log('\n🤖 TEST 4: Autopilot');
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('user_id, autopilot_enabled, last_autopilot_run')
        .eq('autopilot_enabled', true);

      const lastRun = settings?.[0]?.last_autopilot_run 
        ? new Date(settings[0].last_autopilot_run)
        : null;

      const hoursSinceRun = lastRun 
        ? Math.round((Date.now() - lastRun.getTime()) / (1000 * 60 * 60))
        : 999;

      results.tests.autopilot = {
        status: settings && settings.length > 0 ? '✅ PASSED' : '⚠️ DISABLED',
        enabledUsers: settings?.length || 0,
        lastRun: lastRun?.toISOString() || 'never',
        hoursSinceRun
      };

      if (settings && settings.length > 0) results.summary.passed++;
      else results.summary.failed++;
    } catch (error: any) {
      results.tests.autopilot = {
        status: '❌ FAILED',
        error: error.message
      };
      results.summary.failed++;
    }
    results.summary.total++;

    // TEST 5: Content Intelligence
    console.log('\n🧠 TEST 5: Content Intelligence');
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (profiles && profiles.length > 0) {
        const result = await contentIntelligence.processAllPublishedContent(profiles[0].id);
        
        results.tests.contentIntelligence = {
          status: result.updated > 0 ? '✅ PASSED' : '⚠️ NO UPDATES',
          processed: result.processed,
          updated: result.updated,
          errors: result.errors
        };

        if (result.errors === 0) results.summary.passed++;
        else results.summary.failed++;
      }
    } catch (error: any) {
      results.tests.contentIntelligence = {
        status: '❌ FAILED',
        error: error.message
      };
      results.summary.failed++;
    }
    results.summary.total++;

    // TEST 6: Draft Queue Check
    console.log('\n📦 TEST 6: Draft Queue');
    try {
      const { count } = await supabase
        .from('generated_content')
        .select('id', { count: 'exact' })
        .eq('status', 'draft');

      results.tests.draftQueue = {
        status: (count || 0) < 100 ? '✅ PASSED' : '⚠️ BACKLOG',
        draftCount: count || 0,
        message: (count || 0) < 100 ? 'Queue healthy' : 'Large backlog detected'
      };

      if ((count || 0) < 100) results.summary.passed++;
      else results.summary.failed++;
    } catch (error: any) {
      results.tests.draftQueue = {
        status: '❌ FAILED',
        error: error.message
      };
      results.summary.failed++;
    }
    results.summary.total++;

    // Calculate success rate
    results.summary.successRate = `${Math.round((results.summary.passed / results.summary.total) * 100)}%`;

    console.log(`\n✅ SYSTEM TEST COMPLETE: ${results.summary.successRate} (${results.summary.passed}/${results.summary.total})`);

    return res.status(200).json(results);

  } catch (error: any) {
    console.error('❌ TEST ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}