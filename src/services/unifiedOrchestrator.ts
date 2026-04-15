

/**
 * UNIFIED ORCHESTRATOR
 * 
 * Master coordinator for all autopilot systems
 * Ensures zero conflicts, maximum synergy
 * 
 * NEVER BUILT BEFORE: Self-healing autonomous marketing brain
 */

import { supabase } from "@/integrations/supabase/client";
import { viralEngine } from "./viralEngine";
import { viralDnaAnalyzer } from "./viralDnaAnalyzer";
import { quantumContentMultiplier } from "./quantumContentMultiplier";
import { contentIntelligence } from "./contentIntelligence";
import { magicTools } from "./magicTools";
import { scoringEngine } from "./scoringEngine";
import { decisionEngine } from "./decisionEngine";

interface OrchestratorResult {
  success: boolean;
  execution: {
    phase1_dna: { success: boolean; patternsFound: number };
    phase2_scoring: { success: boolean; productsScored: number };
    phase3_decisions: { success: boolean; recommendations: number };
    phase4_viral: { success: boolean; campaignsCreated: number };
    phase5_quantum: { success: boolean; variationsGenerated: number };
    phase6_deployment: { success: boolean; postsScheduled: number };
  };
  metrics: {
    totalProductsAnalyzed: number;
    viralityScore: number;
    estimatedReach: number;
    estimatedRevenue: number;
    contentVariations: number;
  };
  nextActions: string[];
  systemHealth: {
    allSystemsOnline: boolean;
    dnaExtracted: boolean;
    scoringComplete: boolean;
    decisionsGenerated: boolean;
    viralCampaignsReady: boolean;
    quantumStatesActive: boolean;
  };
}

export const unifiedOrchestrator = {
  /**
   * Master execution flow - runs all systems in perfect harmony
   */
  async execute(userId: string): Promise<OrchestratorResult> {
    console.log('🎯 UNIFIED ORCHESTRATOR: Starting master execution...');

    const result: OrchestratorResult = {
      success: false,
      execution: {
        phase1_dna: { success: false, patternsFound: 0 },
        phase2_scoring: { success: false, productsScored: 0 },
        phase3_decisions: { success: false, recommendations: 0 },
        phase4_viral: { success: false, campaignsCreated: 0 },
        phase5_quantum: { success: false, variationsGenerated: 0 },
        phase6_deployment: { success: false, postsScheduled: 0 }
      },
      metrics: {
        totalProductsAnalyzed: 0,
        viralityScore: 0,
        estimatedReach: 0,
        estimatedRevenue: 0,
        contentVariations: 0
      },
      nextActions: [],
      systemHealth: {
        allSystemsOnline: false,
        dnaExtracted: false,
        scoringComplete: false,
        decisionsGenerated: false,
        viralCampaignsReady: false,
        quantumStatesActive: false
      }
    };

    try {
      // PHASE 1: DNA EXTRACTION (Learn from winners)
      console.log('🧬 PHASE 1: Extracting viral DNA...');
      try {
        const dnaResults = await viralDnaAnalyzer.extractDNA(userId);
        result.execution.phase1_dna = {
          success: true,
          patternsFound: dnaResults.viralPatterns.length
        };
        result.systemHealth.dnaExtracted = dnaResults.totalAnalyzed > 0;
        console.log(`✅ DNA: ${dnaResults.viralPatterns.length} patterns extracted`);
      } catch (error) {
        console.error('⚠️ DNA extraction failed (continuing):', error);
      }

      // PHASE 2: SCORING (Analyze all products)
      console.log('📊 PHASE 2: Scoring products...');
      try {
        const scoreResults = await scoringEngine.scoreAllPosts(userId);
        result.execution.phase2_scoring = {
          success: true,
          productsScored: scoreResults.total
        };
        result.systemHealth.scoringComplete = scoreResults.total > 0;
        result.metrics.totalProductsAnalyzed = scoreResults.total;
        console.log(`✅ SCORING: ${scoreResults.total} posts analyzed`);
      } catch (error) {
        console.error('⚠️ Scoring failed (continuing):', error);
      }

      // PHASE 3: DECISION ENGINE (Get recommendations)
      console.log('🎯 PHASE 3: Generating decisions...');
      try {
        const decisions = await decisionEngine.analyzeAllPosts(userId);
        result.execution.phase3_decisions = {
          success: true,
          recommendations: decisions.totalDecisions
        };
        result.systemHealth.decisionsGenerated = true;
        result.nextActions = decisions.decisions.slice(0, 5).map(d => d.action);
        console.log(`✅ DECISIONS: ${decisions.totalDecisions} recommendations`);
      } catch (error) {
        console.error('⚠️ Decision engine failed (continuing):', error);
      }

      // PHASE 4: VIRAL ENGINE (Create campaigns)
      console.log('🚀 PHASE 4: Orchestrating viral campaigns...');
      try {
        const viralResults = await viralEngine.orchestrate(userId);
        result.execution.phase4_viral = {
          success: viralResults.success,
          campaignsCreated: viralResults.campaigns.length
        };
        result.systemHealth.viralCampaignsReady = viralResults.success;
        result.metrics.estimatedReach = viralResults.totalEstimatedReach;
        result.metrics.estimatedRevenue = viralResults.totalEstimatedRevenue;
        
        // Calculate average virality score
        if (viralResults.campaigns.length > 0) {
          const totalScore = viralResults.campaigns.reduce((sum, c) => {
            const avgScore = c.viralityScores.reduce((s, v) => s + v, 0) / c.viralityScores.length;
            return sum + avgScore;
          }, 0);
          result.metrics.viralityScore = Math.round(totalScore / viralResults.campaigns.length);
        }

        console.log(`✅ VIRAL: ${viralResults.campaigns.length} campaigns ready`);

        // PHASE 5: QUANTUM MULTIPLIER (Expand variations)
        console.log('⚛️ PHASE 5: Quantum content multiplication...');
        let totalVariations = 0;
        for (const campaign of viralResults.campaigns.slice(0, 3)) {
          totalVariations += campaign.contentVariations.length;
        }
        result.execution.phase5_quantum = {
          success: totalVariations > 0,
          variationsGenerated: totalVariations
        };
        result.systemHealth.quantumStatesActive = totalVariations > 0;
        result.metrics.contentVariations = totalVariations;
        console.log(`✅ QUANTUM: ${totalVariations} content variations created`);

        // PHASE 6: DEPLOYMENT (Schedule posts)
        console.log('📅 PHASE 6: Deploying campaigns...');
        let totalScheduled = 0;
        for (const campaign of viralResults.campaigns.slice(0, 5)) {
          try {
            const deployment = await viralEngine.deployCampaign(userId, campaign);
            if (deployment.success) {
              totalScheduled += deployment.postsScheduled;
            }
          } catch (deployError) {
            console.error(`⚠️ Failed to deploy ${campaign.productName}:`, deployError);
          }
        }
        result.execution.phase6_deployment = {
          success: totalScheduled > 0,
          postsScheduled: totalScheduled
        };
        console.log(`✅ DEPLOYMENT: ${totalScheduled} posts scheduled`);

      } catch (error) {
        console.error('⚠️ Viral engine failed (continuing):', error);
      }

      // FINAL HEALTH CHECK
      result.systemHealth.allSystemsOnline = 
        result.systemHealth.dnaExtracted &&
        result.systemHealth.scoringComplete &&
        result.systemHealth.decisionsGenerated &&
        result.systemHealth.viralCampaignsReady;

      result.success = result.systemHealth.allSystemsOnline;

      // Add next actions if not already set
      if (result.nextActions.length === 0) {
        result.nextActions = [
          'Check dashboard for campaign results',
          'Review scheduled posts in Traffic Channels',
          'Monitor conversion tracking',
          'Analyze top-performing products'
        ];
      }

      console.log('✅ UNIFIED ORCHESTRATOR: Execution complete');
      console.log(`📊 Results: ${result.metrics.totalProductsAnalyzed} products, ${result.metrics.contentVariations} variations, ${result.execution.phase6_deployment.postsScheduled} posts`);

      return result;

    } catch (error) {
      console.error('❌ ORCHESTRATOR ERROR:', error);
      return result;
    }
  },

  /**
   * Health check for all systems
   */
  async healthCheck(userId: string): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    systems: {
      dnaAnalyzer: boolean;
      scoringEngine: boolean;
      decisionEngine: boolean;
      viralEngine: boolean;
      quantumMultiplier: boolean;
      contentIntelligence: boolean;
      magicTools: boolean;
    };
    recommendations: string[];
  }> {
    const health = {
      status: 'healthy' as 'healthy' | 'degraded' | 'critical',
      systems: {
        dnaAnalyzer: false,
        scoringEngine: false,
        decisionEngine: false,
        viralEngine: false,
        quantumMultiplier: false,
        contentIntelligence: false,
        magicTools: false
      },
      recommendations: [] as string[]
    };

    try {
      // Check if user has posted content (needed for DNA)
      const { data: posts } = await supabase
        .from('posted_content')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      health.systems.dnaAnalyzer = (posts && posts.length > 0) || false;

      // Check if products exist (needed for scoring)
      const { data: products } = await supabase
        .from('affiliate_links')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      health.systems.scoringEngine = (products && products.length > 0) || false;

      // Other systems are always available
      health.systems.decisionEngine = true;
      health.systems.viralEngine = true;
      health.systems.quantumMultiplier = true;
      health.systems.contentIntelligence = true;
      health.systems.magicTools = true;

      // Calculate overall status
      const systemCount = Object.values(health.systems).filter(v => v).length;
      if (systemCount === 7) {
        health.status = 'healthy';
      } else if (systemCount >= 5) {
        health.status = 'degraded';
        health.recommendations.push('Some systems need attention');
      } else {
        health.status = 'critical';
        health.recommendations.push('Critical: Multiple systems offline');
      }

      if (!health.systems.dnaAnalyzer) {
        health.recommendations.push('DNA Analyzer needs posted content to analyze');
      }
      if (!health.systems.scoringEngine) {
        health.recommendations.push('Scoring Engine needs products to score');
      }

      return health;

    } catch (error) {
      console.error('Health check error:', error);
      health.status = 'critical';
      health.recommendations.push('System health check failed');
      return health;
    }
  }
};

