import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { unifiedOrchestrator } from "@/services/unifiedOrchestrator";
import { trendingProductDiscovery } from "@/services/trendingProductDiscovery";
import { magicTrafficEngine } from "@/services/magicTrafficEngine";

/**
 * ACTIVATE FULL SYSTEM
 * One-click activation of the entire autonomous affiliate system
 * No authentication required for easy activation
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 FULL SYSTEM ACTIVATION: Starting...');

    // Get first user (for testing - in production, use authenticated user)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No users found. Please sign up first.'
      });
    }

    const userId = profiles[0].id;

    const activationResult: any = {
      success: true,
      userId,
      timestamp: new Date().toISOString(),
      phases: {}
    };

    // PHASE 1: Discover Trending Products
    console.log('📦 PHASE 1: Discovering trending products...');
    try {
      const discoveryResult = await (trendingProductDiscovery as any).discoverAllTrendingProducts(userId);
      activationResult.phases.productDiscovery = {
        status: discoveryResult.success ? '✅ SUCCESS' : '⚠️ PARTIAL',
        productsFound: discoveryResult.total_found || 0,
        sources: 4
      };
      console.log(`✅ Products: ${discoveryResult.total_found || 0} added`);
    } catch (error) {
      console.error('⚠️ Product discovery failed:', error);
      activationResult.phases.productDiscovery = {
        status: '❌ FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // PHASE 2: Activate Traffic Engine
    console.log('🚦 PHASE 2: Activating traffic engine...');
    try {
      const trafficResult = await (magicTrafficEngine as any).autoActivateBestSources(userId);
      activationResult.phases.trafficEngine = {
        status: trafficResult.success ? '✅ SUCCESS' : '⚠️ PARTIAL',
        sourcesActivated: trafficResult.activated_count || 0,
        totalSources: 12
      };
      console.log(`✅ Traffic: ${trafficResult.activated_count || 0}/12 sources activated`);
    } catch (error) {
      console.error('⚠️ Traffic activation failed:', error);
      activationResult.phases.trafficEngine = {
        status: '❌ FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // PHASE 3: Run Unified Orchestrator (Viral System)
    console.log('🎯 PHASE 3: Launching viral content system...');
    try {
      const orchestratorResult = await unifiedOrchestrator.execute(userId);
      activationResult.phases.viralSystem = {
        status: orchestratorResult.success ? '✅ SUCCESS' : '⚠️ PARTIAL',
        execution: orchestratorResult.execution,
        metrics: orchestratorResult.metrics,
        systemHealth: orchestratorResult.systemHealth
      };
      console.log(`✅ Viral: ${orchestratorResult.metrics.contentVariations} content pieces created`);
    } catch (error) {
      console.error('⚠️ Viral system failed:', error);
      activationResult.phases.viralSystem = {
        status: '❌ FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // PHASE 4: Enable Autopilot
    console.log('🤖 PHASE 4: Enabling autopilot...');
    try {
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          autopilot_enabled: true,
          last_autopilot_run: new Date().toISOString()
        });

      if (settingsError) throw settingsError;

      activationResult.phases.autopilot = {
        status: '✅ SUCCESS',
        enabled: true
      };
      console.log('✅ Autopilot: Enabled');
    } catch (error) {
      console.error('⚠️ Autopilot activation failed:', error);
      activationResult.phases.autopilot = {
        status: '❌ FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Calculate overall success
    const phaseStatuses = Object.values(activationResult.phases).map((p: any) => p.status);
    const successCount = phaseStatuses.filter(s => s === '✅ SUCCESS').length;
    const totalCount = phaseStatuses.length;

    activationResult.summary = {
      totalPhases: totalCount,
      successful: successCount,
      failed: phaseStatuses.filter(s => s === '❌ FAILED').length,
      partial: phaseStatuses.filter(s => s === '⚠️ PARTIAL').length,
      successRate: `${Math.round((successCount / totalCount) * 100)}%`
    };

    activationResult.nextSteps = [
      'Visit /analytics to see AI-powered insights',
      'Check /traffic-channels to monitor active sources',
      'Review /system-audit for data quality verification',
      'Monitor dashboard for real-time metrics'
    ];

    console.log(`✅ FULL SYSTEM ACTIVATION COMPLETE: ${activationResult.summary.successRate} success rate`);

    return res.status(200).json(activationResult);

  } catch (error: any) {
    console.error('❌ ACTIVATION ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}