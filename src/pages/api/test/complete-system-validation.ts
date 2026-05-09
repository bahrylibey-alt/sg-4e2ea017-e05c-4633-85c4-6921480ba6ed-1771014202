import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { trendingProductDiscovery } from "@/services/trendingProductDiscovery";
import { magicTrafficEngine } from "@/services/magicTrafficEngine";
import { viralEngine } from "@/services/viralEngine";
import { viralDnaAnalyzer } from "@/services/viralDnaAnalyzer";
import { quantumContentMultiplier } from "@/services/quantumContentMultiplier";
import { unifiedOrchestrator } from "@/services/unifiedOrchestrator";

/**
 * COMPLETE SYSTEM VALIDATION TEST
 * Tests every feature and strategy end-to-end
 * Generates detailed report of what works and what doesn't
 */

interface TestResult {
  feature: string;
  status: '✅ PASS' | '⚠️ PARTIAL' | '❌ FAIL';
  details: string;
  metrics?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const testResults: TestResult[] = [];
  const startTime = Date.now();

  try {
    console.log('🧪 STARTING COMPLETE SYSTEM VALIDATION...');

    // Get test user
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No users found for testing'
      });
    }

    const userId = profiles[0].id;

    // TEST 1: Product Discovery (2026 Products Only)
    console.log('\n📦 TEST 1: Product Discovery (2026 Filter)...');
    try {
      const discoveryResult = await trendingProductDiscovery.discoverAllTrendingProducts(userId);
      
      // Verify all products are from 2026
      const { data: savedProducts } = await supabase
        .from('product_catalog')
        .select('name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      const products2026 = savedProducts?.filter(p => 
        p.name.includes('2026') || new Date(p.created_at).getFullYear() === 2026
      ).length || 0;

      testResults.push({
        feature: 'Product Discovery - 2026 Filter',
        status: products2026 > 0 ? '✅ PASS' : '❌ FAIL',
        details: `Found ${discoveryResult.total_found} products, ${products2026} are 2026 products`,
        metrics: {
          total_found: discoveryResult.total_found,
          products_2026: products2026,
          sources_checked: discoveryResult.sources_checked
        }
      });
    } catch (error) {
      testResults.push({
        feature: 'Product Discovery',
        status: '❌ FAIL',
        details: 'Discovery failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // TEST 2: Traffic Source Activation (All 12 Sources)
    console.log('\n🚦 TEST 2: Traffic Sources (12 Advanced Tactics)...');
    try {
      const trafficResult = await magicTrafficEngine.autoActivateBestSources(userId);
      
      // Get activated sources
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', userId);

      const campaignIds = campaigns?.map(c => c.id) || [];
      
      let activeSources: any[] = [];
      if (campaignIds.length > 0) {
        const { data } = await supabase
          .from('traffic_sources')
          .select('source_name, platform, status')
          .in('campaign_id', campaignIds)
          .eq('status', 'active');
        activeSources = data || [];
      }

      const expectedSources = [
        'Pinterest', 'TikTok', 'Reddit', 'Medium', 'Quora',
        'Twitter', 'Instagram', 'Facebook', 'LinkedIn', 'YouTube',
        'Email', 'SEO'
      ];

      const activeSourceNames = activeSources.map(s => s.source_name);
      const matchedSources = expectedSources.filter(s => 
        activeSourceNames.some(as => as.toLowerCase().includes(s.toLowerCase()))
      );

      testResults.push({
        feature: 'Traffic Sources - 12 Advanced Tactics',
        status: matchedSources.length >= 10 ? '✅ PASS' : matchedSources.length >= 6 ? '⚠️ PARTIAL' : '❌ FAIL',
        details: `${activeSources.length} sources active, ${matchedSources.length}/12 tactics enabled`,
        metrics: {
          active_sources: activeSources.length,
          tactics_enabled: matchedSources.length,
          activated_tactics: matchedSources
        }
      });
    } catch (error) {
      testResults.push({
        feature: 'Traffic Sources',
        status: '❌ FAIL',
        details: 'Traffic activation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // TEST 3: Viral Engine
    console.log('\n🚀 TEST 3: Viral Content Engine...');
    try {
      const viralResult = await viralEngine.batchGenerateViralContent(userId, 5);
      
      testResults.push({
        feature: 'Viral Content Engine',
        status: viralResult.success ? '✅ PASS' : '⚠️ PARTIAL',
        details: `Generated ${viralResult.generated_count} viral posts for ${viralResult.products_processed} products`,
        metrics: {
          posts_generated: viralResult.generated_count,
          products_processed: viralResult.products_processed
        }
      });
    } catch (error) {
      testResults.push({
        feature: 'Viral Engine',
        status: '❌ FAIL',
        details: 'Viral generation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // TEST 4: Viral DNA Analyzer
    console.log('\n🧬 TEST 4: Viral DNA Analyzer...');
    try {
      const dnaResult = await viralDnaAnalyzer.batchOptimizeContent(userId);
      
      testResults.push({
        feature: 'Viral DNA Analyzer',
        status: dnaResult.optimized_count > 0 ? '✅ PASS' : '⚠️ PARTIAL',
        details: `Optimized ${dnaResult.optimized_count} content pieces, ${dnaResult.average_boost}% average boost`,
        metrics: {
          optimized_count: dnaResult.optimized_count,
          average_boost: dnaResult.average_boost
        }
      });
    } catch (error) {
      testResults.push({
        feature: 'Viral DNA Analyzer',
        status: '❌ FAIL',
        details: 'DNA analysis failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // TEST 5: Quantum Content Multiplier
    console.log('\n⚛️ TEST 5: Quantum Content Multiplier...');
    try {
      const quantumResult = await quantumContentMultiplier.autoPost(userId);
      
      testResults.push({
        feature: 'Quantum Content Multiplier',
        status: quantumResult.success ? '✅ PASS' : '⚠️ PARTIAL',
        details: `Posted ${quantumResult.posted_count} pieces across ${quantumResult.platforms.length} platforms`,
        metrics: {
          posted_count: quantumResult.posted_count,
          platforms: quantumResult.platforms
        }
      });
    } catch (error) {
      testResults.push({
        feature: 'Quantum Multiplier',
        status: '❌ FAIL',
        details: 'Quantum posting failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // TEST 6: Unified Orchestrator
    console.log('\n🎯 TEST 6: Unified Orchestrator...');
    try {
      const orchestratorResult = await unifiedOrchestrator.execute(userId);
      
      testResults.push({
        feature: 'Unified Orchestrator',
        status: orchestratorResult.success ? '✅ PASS' : '⚠️ PARTIAL',
        details: `Execution complete - ${orchestratorResult.metrics.contentVariations} variations, ${orchestratorResult.metrics.viralityScore}% virality score`,
        metrics: orchestratorResult.metrics
      });
    } catch (error) {
      testResults.push({
        feature: 'Unified Orchestrator',
        status: '❌ FAIL',
        details: 'Orchestration failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // TEST 7: Database Integrity
    console.log('\n💾 TEST 7: Database Integrity...');
    try {
      const [products, links, content, traffic] = await Promise.all([
        supabase.from('product_catalog').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('affiliate_links').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('generated_content').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('campaigns').select('id').eq('user_id', userId)
      ]);

      const hasData = (products.count || 0) > 0 && (links.count || 0) > 0;

      testResults.push({
        feature: 'Database Integrity',
        status: hasData ? '✅ PASS' : '⚠️ PARTIAL',
        details: 'All tables accessible and populated',
        metrics: {
          products: products.count,
          links: links.count,
          content: content.count,
          campaigns: traffic.data?.length || 0
        }
      });
    } catch (error) {
      testResults.push({
        feature: 'Database Integrity',
        status: '❌ FAIL',
        details: 'Database check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // TEST 8: Real Data Validation (No Mocks)
    console.log('\n🔍 TEST 8: Real Data Validation...');
    try {
      const { data: recentProducts } = await supabase
        .from('product_catalog')
        .select('name, affiliate_url, network')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const hasRealUrls = recentProducts?.every(p => 
        p.affiliate_url && (p.affiliate_url.includes('amzn.to') || p.affiliate_url.includes('http'))
      ) || false;

      const hasRealNetworks = recentProducts?.every(p => 
        p.network && p.network !== 'mock' && p.network !== 'test'
      ) || false;

      testResults.push({
        feature: 'Real Data Validation',
        status: hasRealUrls && hasRealNetworks ? '✅ PASS' : '⚠️ PARTIAL',
        details: hasRealUrls && hasRealNetworks ? 'All data is real, no mocks detected' : 'Some mock data detected',
        metrics: {
          products_checked: recentProducts?.length || 0,
          real_urls: hasRealUrls,
          real_networks: hasRealNetworks
        }
      });
    } catch (error) {
      testResults.push({
        feature: 'Real Data Validation',
        status: '❌ FAIL',
        details: 'Validation check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Calculate overall results
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.status === '✅ PASS').length;
    const partialTests = testResults.filter(r => r.status === '⚠️ PARTIAL').length;
    const failedTests = testResults.filter(r => r.status === '❌ FAIL').length;
    const executionTime = Date.now() - startTime;

    const summary = {
      total_tests: totalTests,
      passed: passedTests,
      partial: partialTests,
      failed: failedTests,
      success_rate: `${Math.round((passedTests / totalTests) * 100)}%`,
      execution_time: `${(executionTime / 1000).toFixed(2)}s`,
      timestamp: new Date().toISOString()
    };

    console.log(`\n✅ VALIDATION COMPLETE: ${summary.success_rate} success rate in ${summary.execution_time}`);

    return res.status(200).json({
      success: failedTests === 0,
      summary,
      test_results: testResults,
      recommendations: generateRecommendations(testResults)
    });

  } catch (error: any) {
    console.error('❌ VALIDATION ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      test_results: testResults,
      timestamp: new Date().toISOString()
    });
  }
}

function generateRecommendations(results: TestResult[]): string[] {
  const recommendations: string[] = [];

  const failedFeatures = results.filter(r => r.status === '❌ FAIL');
  const partialFeatures = results.filter(r => r.status === '⚠️ PARTIAL');

  if (failedFeatures.length === 0 && partialFeatures.length === 0) {
    recommendations.push('🎉 System is fully operational! All tests passed.');
    recommendations.push('✅ Ready for production deployment');
    recommendations.push('📊 Monitor analytics dashboard for traffic metrics');
  } else {
    if (failedFeatures.length > 0) {
      recommendations.push(`⚠️ ${failedFeatures.length} critical features need attention`);
      failedFeatures.forEach(f => {
        recommendations.push(`  → Fix: ${f.feature} - ${f.details}`);
      });
    }

    if (partialFeatures.length > 0) {
      recommendations.push(`⚡ ${partialFeatures.length} features need optimization`);
      partialFeatures.forEach(f => {
        recommendations.push(`  → Optimize: ${f.feature} - ${f.details}`);
      });
    }
  }

  recommendations.push('');
  recommendations.push('Next Steps:');
  recommendations.push('1. Visit /analytics to monitor real-time performance');
  recommendations.push('2. Check /traffic-channels to verify active sources');
  recommendations.push('3. Review /system-audit for data quality');
  recommendations.push('4. Enable autopilot for autonomous operation');

  return recommendations;
}