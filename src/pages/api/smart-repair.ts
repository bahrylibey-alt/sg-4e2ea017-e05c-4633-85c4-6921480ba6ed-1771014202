import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * INTELLIGENT AUTO-FIX SYSTEM - REAL DATA ONLY
 * 
 * Scans the entire system, detects problems, and fixes configuration issues.
 * NEVER generates fake data. Only validates and repairs system configuration.
 * 
 * Usage: GET /api/smart-repair
 */

interface RepairReport {
  timestamp: string;
  totalIssues: number;
  issuesFixed: number;
  issuesFailed: number;
  details: RepairDetail[];
  systemStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  recommendations: string[];
}

interface RepairDetail {
  category: string;
  issue: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'FIXED' | 'FAILED' | 'SKIPPED';
  action: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RepairReport>
) {
  const report: RepairReport = {
    timestamp: new Date().toISOString(),
    totalIssues: 0,
    issuesFixed: 0,
    issuesFailed: 0,
    details: [],
    systemStatus: 'HEALTHY',
    recommendations: []
  };

  try {
    console.log('🔧 SMART REPAIR: Starting system scan...');

    // Get user ID
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (!users || users.length === 0) {
      throw new Error('No users found in database');
    }

    const userId = users[0].id;
    console.log(`👤 User ID: ${userId}`);

    const now = new Date();

    // Check 1: Autopilot Configuration
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('autopilot_enabled, last_autopilot_run')
      .eq('user_id', userId)
      .maybeSingle();

    if (!userSettings) {
      report.details.push({
        category: 'Configuration',
        issue: 'User settings missing',
        severity: 'CRITICAL',
        status: 'FIXED',
        action: 'Created default user settings'
      });
      report.totalIssues++;

      await supabase.from('user_settings').insert({
        user_id: userId,
        autopilot_enabled: true,
        last_autopilot_run: now.toISOString()
      });
      report.issuesFixed++;
    } else if (!userSettings.autopilot_enabled) {
      report.details.push({
        category: 'Configuration',
        issue: 'Autopilot is disabled',
        severity: 'HIGH',
        status: 'FIXED',
        action: 'Enabled autopilot'
      });
      report.totalIssues++;

      await supabase
        .from('user_settings')
        .update({ autopilot_enabled: true, updated_at: now.toISOString() })
        .eq('user_id', userId);
      report.issuesFixed++;
    }

    // Check 2: Autopilot Settings
    const { data: autopilotSettings } = await supabase
      .from('autopilot_settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!autopilotSettings) {
      report.details.push({
        category: 'Configuration',
        issue: 'Autopilot settings not configured',
        severity: 'MEDIUM',
        status: 'FIXED',
        action: 'Created default autopilot settings'
      });
      report.totalIssues++;

      await supabase.from('autopilot_settings').insert({
        user_id: userId
      });
      report.issuesFixed++;
    }

    // Check 3: Integration Status
    const { data: integrations } = await supabase
      .from('integrations')
      .select('provider, status')
      .eq('user_id', userId);

    const connectedIntegrations = integrations?.filter(i => i.status === 'connected').length || 0;
    
    if (connectedIntegrations === 0) {
      report.details.push({
        category: 'Integrations',
        issue: 'No integrations connected',
        severity: 'CRITICAL',
        status: 'SKIPPED',
        action: 'User needs to connect affiliate networks and traffic sources'
      });
      report.totalIssues++;
      report.recommendations.push('Visit /integrations to connect affiliate networks (Amazon, AliExpress, etc.)');
      report.recommendations.push('Connect traffic sources (Pinterest, TikTok, etc.) via API keys');
    }

    // Check 4: Product Discovery
    const { data: products } = await supabase
      .from('product_catalog')
      .select('id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!products || products.length === 0) {
      report.details.push({
        category: 'Products',
        issue: 'No products in catalog',
        severity: 'HIGH',
        status: 'SKIPPED',
        action: 'Run product discovery from connected affiliate networks'
      });
      report.totalIssues++;
      report.recommendations.push('Trigger product discovery: /api/cron/discover-products');
    } else {
      const lastProductDate = new Date(products[0].created_at);
      const daysSinceLastProduct = Math.floor((now.getTime() - lastProductDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastProduct > 7) {
        report.details.push({
          category: 'Products',
          issue: `No new products in ${daysSinceLastProduct} days`,
          severity: 'MEDIUM',
          status: 'SKIPPED',
          action: 'Product discovery cron needs to run'
        });
        report.totalIssues++;
        report.recommendations.push('Run product discovery: /api/cron/discover-products');
      }
    }

    // Check 5: Real Data Tracking
    const { data: clickEvents } = await supabase
      .from('click_events')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const { data: viewEvents } = await supabase
      .from('view_events')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if ((!clickEvents || clickEvents.length === 0) && (!viewEvents || viewEvents.length === 0)) {
      report.details.push({
        category: 'Tracking',
        issue: 'No real tracking data yet',
        severity: 'LOW',
        status: 'SKIPPED',
        action: 'Waiting for real traffic from connected platforms'
      });
      report.totalIssues++;
      report.recommendations.push('Ensure traffic sources are properly configured in /integrations');
      report.recommendations.push('Traffic data comes from real API webhooks, not generated');
    }

    // Check 6: System State
    const { data: systemState } = await supabase
      .from('system_state')
      .select('state')
      .eq('user_id', userId)
      .maybeSingle();

    if (!systemState) {
      report.details.push({
        category: 'System',
        issue: 'System state not initialized',
        severity: 'HIGH',
        status: 'FIXED',
        action: 'Created system state'
      });
      report.totalIssues++;

      await supabase.from('system_state').insert({
        user_id: userId,
        state: 'NO_TRAFFIC',
        total_views: 0,
        total_clicks: 0
      });
      report.issuesFixed++;
    }

    // FINAL ASSESSMENT
    console.log('\n📈 PHASE 2: Final Assessment...');

    if (report.totalIssues === 0) {
      report.systemStatus = 'HEALTHY';
      report.recommendations.push('System is properly configured. Waiting for real traffic data.');
    } else if (report.issuesFixed >= report.totalIssues * 0.8) {
      report.systemStatus = 'DEGRADED';
      report.recommendations.push('Configuration issues fixed. Connect integrations to start receiving real data.');
    } else {
      report.systemStatus = 'CRITICAL';
      report.recommendations.push('Multiple critical configuration issues. Fix integrations and settings.');
    }

    console.log('\n✅ SMART REPAIR COMPLETE');
    console.log(`📊 Issues Found: ${report.totalIssues}`);
    console.log(`✅ Issues Fixed: ${report.issuesFixed}`);
    console.log(`❌ Issues Failed: ${report.issuesFailed}`);
    console.log(`🏥 System Status: ${report.systemStatus}`);

    return res.status(200).json(report);

  } catch (error: any) {
    console.error('❌ SMART REPAIR ERROR:', error);
    report.systemStatus = 'CRITICAL';
    report.details.push({
      category: 'System',
      issue: 'Auto-repair system error',
      severity: 'CRITICAL',
      status: 'FAILED',
      action: 'Could not complete repair',
      error: error.message
    });
    report.issuesFailed++;
    return res.status(500).json(report);
  }
}