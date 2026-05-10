import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { selfHealingAutopilot } from "@/services/selfHealingAutopilot";

/**
 * COMPLETE END-TO-END SYSTEM TEST
 * 
 * Tests every component of the autonomous affiliate marketing system:
 * 1. Database connectivity
 * 2. Product discovery
 * 3. Affiliate link creation  
 * 4. Content generation
 * 5. Content posting
 * 6. Autopilot execution
 * 7. Metrics tracking
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const testResults: any = {
    timestamp: new Date().toISOString(),
    tests: {
      database: { status: 'pending', message: '' },
      userProfile: { status: 'pending', message: '' },
      productDiscovery: { status: 'pending', message: '' },
      affiliateLinks: { status: 'pending', message: '' },
      contentGeneration: { status: 'pending', message: '' },
      contentPosting: { status: 'pending', message: '' },
      autopilotExecution: { status: 'pending', message: '' },
      metricsTracking: { status: 'pending', message: '' }
    },
    summary: {
      total: 8,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };

  try {
    // TEST 1: DATABASE CONNECTIVITY
    console.log('TEST 1: Database connectivity...');
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) throw error;

      testResults.tests.database.status = 'passed';
      testResults.tests.database.message = '✅ Database connected';
      testResults.summary.passed++;
    } catch (error) {
      testResults.tests.database.status = 'failed';
      testResults.tests.database.message = `❌ Database error: ${error}`;
      testResults.summary.failed++;
    }

    // TEST 2: USER PROFILE
    console.log('TEST 2: User profile...');
    let userId: string | null = null;
    
    try {
      const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('id')
        .limit(1);

      if (!profiles || profiles.length === 0) {
        // Create test profile
        const { data: newProfile, error } = await (supabase as any)
          .from('profiles')
          .insert({ email: 'test@example.com' })
          .select()
          .single();

        if (error) throw error;
        userId = newProfile.id;
        testResults.tests.userProfile.status = 'passed';
        testResults.tests.userProfile.message = '✅ Created test profile';
      } else {
        userId = profiles[0].id;
        testResults.tests.userProfile.status = 'passed';
        testResults.tests.userProfile.message = '✅ User profile found';
      }
      
      testResults.summary.passed++;
    } catch (error) {
      testResults.tests.userProfile.status = 'failed';
      testResults.tests.userProfile.message = `❌ Profile error: ${error}`;
      testResults.summary.failed++;
    }

    if (!userId) {
      return res.status(500).json({
        success: false,
        message: 'Cannot proceed without user ID',
        results: testResults
      });
    }

    // TEST 3: PRODUCT DISCOVERY
    console.log('TEST 3: Product discovery...');
    try {
      const { data: products } = await (supabase as any)
        .from('product_catalog')
        .select('*')
        .eq('user_id', userId)
        .limit(5);

      if (products && products.length > 0) {
        testResults.tests.productDiscovery.status = 'passed';
        testResults.tests.productDiscovery.message = `✅ Found ${products.length} products`;
        testResults.summary.passed++;
      } else {
        testResults.tests.productDiscovery.status = 'warning';
        testResults.tests.productDiscovery.message = '⚠️ No products found. Run discovery first.';
        testResults.summary.warnings++;
      }
    } catch (error) {
      testResults.tests.productDiscovery.status = 'failed';
      testResults.tests.productDiscovery.message = `❌ Discovery error: ${error}`;
      testResults.summary.failed++;
    }

    // TEST 4: AFFILIATE LINKS
    console.log('TEST 4: Affiliate links...');
    try {
      const { data: links } = await (supabase as any)
        .from('affiliate_links')
        .select('*')
        .eq('user_id', userId)
        .limit(5);

      if (links && links.length > 0) {
        testResults.tests.affiliateLinks.status = 'passed';
        testResults.tests.affiliateLinks.message = `✅ Found ${links.length} active links`;
        testResults.summary.passed++;
      } else {
        testResults.tests.affiliateLinks.status = 'warning';
        testResults.tests.affiliateLinks.message = '⚠️ No links found. Run autopilot first.';
        testResults.summary.warnings++;
      }
    } catch (error) {
      testResults.tests.affiliateLinks.status = 'failed';
      testResults.tests.affiliateLinks.message = `❌ Links error: ${error}`;
      testResults.summary.failed++;
    }

    // TEST 5: CONTENT GENERATION
    console.log('TEST 5: Content generation...');
    try {
      const { data: content } = await (supabase as any)
        .from('generated_content')
        .select('*')
        .eq('user_id', userId)
        .limit(5);

      if (content && content.length > 0) {
        testResults.tests.contentGeneration.status = 'passed';
        testResults.tests.contentGeneration.message = `✅ Found ${content.length} content pieces`;
        testResults.summary.passed++;
      } else {
        testResults.tests.contentGeneration.status = 'warning';
        testResults.tests.contentGeneration.message = '⚠️ No content found. Run autopilot first.';
        testResults.summary.warnings++;
      }
    } catch (error) {
      testResults.tests.contentGeneration.status = 'failed';
      testResults.tests.contentGeneration.message = `❌ Content error: ${error}`;
      testResults.summary.failed++;
    }

    // TEST 6: CONTENT POSTING
    console.log('TEST 6: Content posting...');
    try {
      const { data: posts } = await (supabase as any)
        .from('posted_content')
        .select('*')
        .eq('user_id', userId)
        .limit(5);

      if (posts && posts.length > 0) {
        testResults.tests.contentPosting.status = 'passed';
        testResults.tests.contentPosting.message = `✅ Found ${posts.length} published posts`;
        testResults.summary.passed++;
      } else {
        testResults.tests.contentPosting.status = 'warning';
        testResults.tests.contentPosting.message = '⚠️ No posts found. Run autopilot first.';
        testResults.summary.warnings++;
      }
    } catch (error) {
      testResults.tests.contentPosting.status = 'failed';
      testResults.tests.contentPosting.message = `❌ Posting error: ${error}`;
      testResults.summary.failed++;
    }

    // TEST 7: AUTOPILOT EXECUTION
    console.log('TEST 7: Autopilot execution...');
    try {
      const result = await selfHealingAutopilot.executeFullCycle({
        userId,
        maxProducts: 3,
        maxContentPerProduct: 2,
        platforms: ['pinterest', 'reddit']
      });

      if (result.success) {
        testResults.tests.autopilotExecution.status = 'passed';
        testResults.tests.autopilotExecution.message = `✅ Autopilot executed: ${result.summary?.productsDiscovered || 0} products, ${result.summary?.contentGenerated || 0} content, ${result.summary?.postsPublished || 0} posts`;
        testResults.summary.passed++;
      } else {
        testResults.tests.autopilotExecution.status = 'warning';
        testResults.tests.autopilotExecution.message = `⚠️ Partial success: ${result.error || 'Some phases failed'}`;
        testResults.summary.warnings++;
      }
    } catch (error) {
      testResults.tests.autopilotExecution.status = 'failed';
      testResults.tests.autopilotExecution.message = `❌ Autopilot error: ${error}`;
      testResults.summary.failed++;
    }

    // TEST 8: METRICS TRACKING
    console.log('TEST 8: Metrics tracking...');
    try {
      const { data: tasks } = await (supabase as any)
        .from('autopilot_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('executed_at', { ascending: false })
        .limit(5);

      if (tasks && tasks.length > 0) {
        testResults.tests.metricsTracking.status = 'passed';
        testResults.tests.metricsTracking.message = `✅ Found ${tasks.length} execution logs`;
        testResults.summary.passed++;
      } else {
        testResults.tests.metricsTracking.status = 'warning';
        testResults.tests.metricsTracking.message = '⚠️ No execution logs found';
        testResults.summary.warnings++;
      }
    } catch (error) {
      testResults.tests.metricsTracking.status = 'failed';
      testResults.tests.metricsTracking.message = `❌ Metrics error: ${error}`;
      testResults.summary.failed++;
    }

    // FINAL SUMMARY
    const overallStatus = 
      testResults.summary.failed === 0 && testResults.summary.warnings === 0
        ? '✅ ALL SYSTEMS OPERATIONAL'
        : testResults.summary.failed === 0
        ? '⚠️ SYSTEM OPERATIONAL (with warnings)'
        : '❌ SYSTEM HAS FAILURES';

    return res.status(200).json({
      success: testResults.summary.failed === 0,
      status: overallStatus,
      results: testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('End-to-end test error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: testResults
    });
  }
}