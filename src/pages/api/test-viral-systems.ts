
<![CDATA[
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { unifiedOrchestrator } from "@/services/unifiedOrchestrator";
import { viralDnaAnalyzer } from "@/services/viralDnaAnalyzer";
import { quantumContentMultiplier } from "@/services/quantumContentMultiplier";
import { contentIntelligence } from "@/services/contentIntelligence";
import { viralEngine } from "@/services/viralEngine";

/**
 * COMPREHENSIVE TEST FOR ALL VIRAL SYSTEMS
 * No authentication required - for easy testing
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🧪 VIRAL SYSTEMS TEST: Starting comprehensive test...');

    // Get test user
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No users found'
      });
    }

    const userId = profiles[0].id;
    const testResults: any = {
      success: true,
      userId,
      timestamp: new Date().toISOString(),
      systems: {}
    };

    // TEST 1: DNA ANALYZER
    console.log('TEST 1: DNA Analyzer...');
    try {
      const dnaResults = await viralDnaAnalyzer.extractDNA(userId);
      testResults.systems.dnaAnalyzer = {
        status: '✅ PASSED',
        patternsFound: dnaResults.viralPatterns.length,
        topGenes: dnaResults.topGenes.length,
        totalAnalyzed: dnaResults.totalAnalyzed
      };
    } catch (error) {
      testResults.systems.dnaAnalyzer = {
        status: '❌ FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // TEST 2: CONTENT INTELLIGENCE
    console.log('TEST 2: Content Intelligence...');
    try {
      const testContent = "🚨 Wait! This amazing product is only $29.99?! I've been testing this for weeks and it's genuinely impressive. Limited time deal - link in bio!";
      const prediction = await contentIntelligence.predictVirality(
        testContent,
        "Test Product",
        29.99,
        "pinterest"
      );
      testResults.systems.contentIntelligence = {
        status: '✅ PASSED',
        viralityScore: prediction.viralityScore,
        confidence: prediction.confidence,
        predictedClicks: prediction.predictedClicks,
        recommendations: prediction.recommendations.length
      };
    } catch (error) {
      testResults.systems.contentIntelligence = {
        status: '❌ FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // TEST 3: QUANTUM MULTIPLIER
    console.log('TEST 3: Quantum Content Multiplier...');
    try {
      const { data: post } = await supabase
        .from('posted_content')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (post) {
        const quantumResults = await quantumContentMultiplier.createSuperposition(userId, post.id);
        testResults.systems.quantumMultiplier = {
          status: '✅ PASSED',
          variations: quantumResults.variations,
          quantumStates: quantumResults.quantumStates.length
        };
      } else {
        testResults.systems.quantumMultiplier = {
          status: '⚠️ SKIPPED',
          reason: 'No posts available for testing'
        };
      }
    } catch (error) {
      testResults.systems.quantumMultiplier = {
        status: '❌ FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // TEST 4: VIRAL ENGINE
    console.log('TEST 4: Viral Engine...');
    try {
      const viralResults = await viralEngine.orchestrate(userId);
      testResults.systems.viralEngine = {
        status: viralResults.success ? '✅ PASSED' : '⚠️ PARTIAL',
        campaignsCreated: viralResults.campaigns.length,
        estimatedReach: viralResults.totalEstimatedReach,
        estimatedRevenue: viralResults.totalEstimatedRevenue,
        systemHealth: viralResults.systemHealth
      };
    } catch (error) {
      testResults.systems.viralEngine = {
        status: '❌ FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // TEST 5: UNIFIED ORCHESTRATOR
    console.log('TEST 5: Unified Orchestrator...');
    try {
      const orchestratorResults = await unifiedOrchestrator.execute(userId);
      testResults.systems.unifiedOrchestrator = {
        status: orchestratorResults.success ? '✅ PASSED' : '⚠️ PARTIAL',
        execution: orchestratorResults.execution,
        metrics: orchestratorResults.metrics,
        systemHealth: orchestratorResults.systemHealth,
        nextActions: orchestratorResults.nextActions
      };
    } catch (error) {
      testResults.systems.unifiedOrchestrator = {
        status: '❌ FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // TEST 6: SYSTEM HEALTH CHECK
    console.log('TEST 6: System Health Check...');
    try {
      const healthCheck = await unifiedOrchestrator.healthCheck(userId);
      testResults.systems.healthCheck = {
        status: '✅ PASSED',
        overallStatus: healthCheck.status,
        systemsOnline: healthCheck.systems,
        recommendations: healthCheck.recommendations
      };
    } catch (error) {
      testResults.systems.healthCheck = {
        status: '❌ FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Calculate overall success
    const systemStatuses = Object.values(testResults.systems).map((s: any) => s.status);
    const passedCount = systemStatuses.filter(s => s === '✅ PASSED').length;
    const totalCount = systemStatuses.length;
    
    testResults.summary = {
      totalTests: totalCount,
      passed: passedCount,
      failed: systemStatuses.filter(s => s === '❌ FAILED').length,
      skipped: systemStatuses.filter(s => s === '⚠️ SKIPPED').length,
      partial: systemStatuses.filter(s => s === '⚠️ PARTIAL').length,
      successRate: `${Math.round((passedCount / totalCount) * 100)}%`
    };

    console.log(`✅ VIRAL SYSTEMS TEST COMPLETE: ${testResults.summary.successRate} success rate`);

    return res.status(200).json(testResults);

  } catch (error: any) {
    console.error('❌ TEST ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
</content>
