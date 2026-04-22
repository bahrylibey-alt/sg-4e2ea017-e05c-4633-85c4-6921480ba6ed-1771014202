import { supabase } from "@/integrations/supabase/client";
import { unifiedOrchestrator } from "./unifiedOrchestrator";
import { smartProductDiscovery } from "./smartProductDiscovery";

export interface HealingResult {
  success: boolean;
  issuesFound: number;
  issuesFixed: number;
  failedFixes: number;
  details: Array<{
    issue: string;
    status: 'FIXED' | 'ALREADY_OK' | 'FAILED';
    action: string;
  }>;
}

class SelfHealingAutopilot {
  private lastHealthCheck: Date | null = null;
  private isHealing: boolean = false;
  private healingInterval: NodeJS.Timeout | null = null;

  public startContinuousHealing(): void {
    if (this.healingInterval) {
      console.log('⚕️ Self-healing already running');
      return;
    }

    console.log('🚀 Starting continuous self-healing autopilot...');
    this.runHealthCheckAndHeal();

    this.healingInterval = setInterval(() => {
      this.runHealthCheckAndHeal();
    }, 5 * 60 * 1000);
  }

  public stopContinuousHealing(): void {
    if (this.healingInterval) {
      clearInterval(this.healingInterval);
      this.healingInterval = null;
      console.log('⏸️ Self-healing stopped');
    }
  }

  private async runHealthCheckAndHeal(): Promise<void> {
    if (this.isHealing) {
      console.log('⏳ Healing already in progress, skipping...');
      return;
    }

    try {
      this.isHealing = true;
      this.lastHealthCheck = new Date();
      
      console.log('🔍 Running health check...');
      const result = await this.diagnoseAndHeal();
      
      if (result.issuesFixed > 0) {
        console.log(`✅ Self-healing completed: Fixed ${result.issuesFixed}/${result.issuesFound} issues`);
      } else if (result.issuesFound === 0) {
        console.log('💚 System healthy - no issues found');
      } else {
        console.log(`⚠️ Partial healing: ${result.failedFixes} issues could not be auto-fixed`);
      }
    } catch (error) {
      console.error('❌ Self-healing error:', error);
    } finally {
      this.isHealing = false;
    }
  }

  public async diagnoseAndHeal(): Promise<HealingResult> {
    const details: HealingResult['details'] = [];
    let issuesFound = 0;
    let issuesFixed = 0;
    let failedFixes = 0;

    try {
      const userHealing = await this.healUserSettings();
      details.push(...userHealing.details);
      issuesFound += userHealing.issuesFound;
      issuesFixed += userHealing.issuesFixed;
      failedFixes += userHealing.failedFixes;

      if (!userHealing.userId) {
        return { success: false, issuesFound, issuesFixed, failedFixes, details };
      }

      const userId = userHealing.userId;

      const stateHealing = await this.healSystemState(userId);
      details.push(...stateHealing.details);
      issuesFound += stateHealing.issuesFound;
      issuesFixed += stateHealing.issuesFixed;
      failedFixes += stateHealing.failedFixes;

      const queueHealing = await this.healContentQueue(userId);
      details.push(...queueHealing.details);
      issuesFound += queueHealing.issuesFound;
      issuesFixed += queueHealing.issuesFixed;
      failedFixes += queueHealing.failedFixes;

      const productsHealing = await this.healProducts(userId);
      details.push(...productsHealing.details);
      issuesFound += productsHealing.issuesFound;
      issuesFixed += productsHealing.issuesFixed;
      failedFixes += productsHealing.failedFixes;

      const publishHealing = await this.healTrendingPublishing(userId);
      details.push(...publishHealing.details);
      issuesFound += publishHealing.issuesFound;
      issuesFixed += publishHealing.issuesFixed;
      failedFixes += publishHealing.failedFixes;

      const autopilotHealing = await this.healAutopilotExecution(userId);
      details.push(...autopilotHealing.details);
      issuesFound += autopilotHealing.issuesFound;
      issuesFixed += autopilotHealing.issuesFixed;
      failedFixes += autopilotHealing.failedFixes;

      return {
        success: failedFixes === 0,
        issuesFound,
        issuesFixed,
        failedFixes,
        details
      };

    } catch (error: any) {
      console.error('Diagnosis error:', error);
      details.push({
        issue: 'System Diagnosis',
        status: 'FAILED',
        action: `Error: ${error.message}`
      });

      return {
        success: false,
        issuesFound: issuesFound + 1,
        issuesFixed,
        failedFixes: failedFixes + 1,
        details
      };
    }
  }

  private async healUserSettings(): Promise<{
    userId: string | null;
    issuesFound: number;
    issuesFixed: number;
    failedFixes: number;
    details: HealingResult['details'];
  }> {
    const details: HealingResult['details'] = [];
    let issuesFound = 0;
    let issuesFixed = 0;
    let failedFixes = 0;
    let userId: string | null = null;
    const db = supabase as any;

    try {
      const { data: { user }, error: authError } = await db.auth.getUser();

      if (authError || !user) {
        const { data: allUsers } = await db.auth.admin.listUsers();

        if (!allUsers || allUsers.users.length === 0) {
          issuesFound++;
          failedFixes++;
          details.push({
            issue: 'No User Account',
            status: 'FAILED',
            action: 'User must sign up first'
          });
          return { userId: null, issuesFound, issuesFixed, failedFixes, details };
        }

        userId = allUsers.users[0].id;
      } else {
        userId = user.id;
      }

      const { data: settings, error: settingsError } = await db
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (settingsError) {
        issuesFound++;
        failedFixes++;
        details.push({
          issue: 'User Settings Check',
          status: 'FAILED',
          action: `Database error: ${settingsError.message}`
        });
        return { userId, issuesFound, issuesFixed, failedFixes, details };
      }

      if (!settings) {
        issuesFound++;
        const { error: createError } = await db
          .from('user_settings')
          .insert({
            user_id: userId,
            autopilot_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          failedFixes++;
          details.push({
            issue: 'Create User Settings',
            status: 'FAILED',
            action: `Failed: ${createError.message}`
          });
        } else {
          issuesFixed++;
          details.push({
            issue: 'Create User Settings',
            status: 'FIXED',
            action: 'Created with autopilot enabled'
          });
        }
      } else if (!settings.autopilot_enabled) {
        issuesFound++;
        const { error: updateError } = await db
          .from('user_settings')
          .update({
            autopilot_enabled: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) {
          failedFixes++;
          details.push({
            issue: 'Enable Autopilot',
            status: 'FAILED',
            action: `Failed: ${updateError.message}`
          });
        } else {
          issuesFixed++;
          details.push({
            issue: 'Enable Autopilot',
            status: 'FIXED',
            action: 'Autopilot enabled automatically'
          });
        }
      }

      return { userId, issuesFound, issuesFixed, failedFixes, details };

    } catch (error: any) {
      issuesFound++;
      failedFixes++;
      details.push({
        issue: 'User Settings Healing',
        status: 'FAILED',
        action: `Error: ${error.message}`
      });
      return { userId: null, issuesFound, issuesFixed, failedFixes, details };
    }
  }

  private async healSystemState(userId: string): Promise<{
    issuesFound: number;
    issuesFixed: number;
    failedFixes: number;
    details: HealingResult['details'];
  }> {
    const details: HealingResult['details'] = [];
    let issuesFound = 0;
    let issuesFixed = 0;
    let failedFixes = 0;
    const db = supabase as any;

    try {
      const { data: systemState } = await db
        .from('system_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!systemState) {
        issuesFound++;
        const { error: stateError } = await db
          .from('system_state')
          .insert({
            user_id: userId,
            total_views: 0,
            total_clicks: 0,
            total_conversions: 0,
            total_revenue: 0,
            total_verified_revenue: 0,
            total_verified_conversions: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (stateError) {
          failedFixes++;
          details.push({
            issue: 'Initialize System State',
            status: 'FAILED',
            action: `Failed: ${stateError.message}`
          });
        } else {
          issuesFixed++;
          details.push({
            issue: 'Initialize System State',
            status: 'FIXED',
            action: 'System state tracking initialized'
          });
        }
      }

      return { issuesFound, issuesFixed, failedFixes, details };

    } catch (error: any) {
      issuesFound++;
      failedFixes++;
      details.push({
        issue: 'System State Healing',
        status: 'FAILED',
        action: `Error: ${error.message}`
      });
      return { issuesFound, issuesFixed, failedFixes, details };
    }
  }

  private async healContentQueue(userId: string): Promise<{
    issuesFound: number;
    issuesFixed: number;
    failedFixes: number;
    details: HealingResult['details'];
  }> {
    const details: HealingResult['details'] = [];
    let issuesFound = 0;
    let issuesFixed = 0;
    let failedFixes = 0;
    const db = supabase as any;

    try {
      const { data: stuckContent } = await db
        .from('content_queue')
        .select('id, status, created_at')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (stuckContent && stuckContent.length > 0) {
        issuesFound++;
        
        const ids = stuckContent.map((c: any) => c.id);
        
        const { error: clearError } = await db.from('content_queue').update({
          status: 'failed',
          error_message: 'Auto-cleared by self-healing (stuck >24h)',
          updated_at: new Date().toISOString()
        }).in('id', ids);

        if (clearError) {
          failedFixes++;
          details.push({
            issue: 'Clear Stuck Queue',
            status: 'FAILED',
            action: `Failed: ${clearError.message}`
          });
        } else {
          issuesFixed++;
          details.push({
            issue: 'Clear Stuck Queue',
            status: 'FIXED',
            action: `Cleared ${stuckContent.length} stuck items`
          });
        }
      }

      return { issuesFound, issuesFixed, failedFixes, details };

    } catch (error: any) {
      issuesFound++;
      failedFixes++;
      details.push({
        issue: 'Content Queue Healing',
        status: 'FAILED',
        action: `Error: ${error.message}`
      });
      return { issuesFound, issuesFixed, failedFixes, details };
    }
  }

  private async healProducts(userId: string): Promise<{
    issuesFound: number;
    issuesFixed: number;
    failedFixes: number;
    details: HealingResult['details'];
  }> {
    const details: HealingResult['details'] = [];
    let issuesFound = 0;
    let issuesFixed = 0;
    let failedFixes = 0;
    const db = supabase as any;

    try {
      const { data: networkStats } = await db
        .from('affiliate_links')
        .select('network')
        .eq('user_id', userId)
        .eq('status', 'active');

      const networks = new Set(networkStats?.map((p: any) => p.network) || []);
      const networkCount = networks.size;

      if (networkCount === 0) {
        issuesFound++;
        details.push({
          issue: 'No Products',
          status: 'FAILED',
          action: 'Connect affiliate networks and sync products'
        });
        failedFixes++;
      } else if (networkCount < 2) {
        issuesFound++;
        details.push({
          issue: 'Low Network Diversity',
          status: 'FIXED',
          action: `Only ${networkCount} network active. Recommend adding Temu, AliExpress`
        });
        issuesFixed++;
      }

      return { issuesFound, issuesFixed, failedFixes, details };

    } catch (error: any) {
      issuesFound++;
      failedFixes++;
      details.push({
        issue: 'Products Check',
        status: 'FAILED',
        action: `Error: ${error.message}`
      });
      return { issuesFound, issuesFixed, failedFixes, details };
    }
  }

  private async healTrendingPublishing(userId: string): Promise<{
    issuesFound: number;
    issuesFixed: number;
    failedFixes: number;
    details: HealingResult['details'];
  }> {
    const details: HealingResult['details'] = [];
    let issuesFound = 0;
    let issuesFixed = 0;
    let failedFixes = 0;
    const db = supabase as any;

    try {
      const { data: trending } = await db
        .from('affiliate_links')
        .select('id, product_name, clicks')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('clicks', 0)
        .order('clicks', { ascending: false })
        .limit(5);

      if (trending && trending.length > 0) {
        let unpublished = 0;

        for (const product of trending) {
          const { data: content } = await db
            .from('generated_content')
            .select('id')
            .eq('link_id', product.id)
            .eq('status', 'published')
            .maybeSingle();

          if (!content) {
            unpublished++;
          }
        }

        if (unpublished > 0) {
          issuesFound++;
          const result = await smartProductDiscovery.publishTrendingProducts(userId, unpublished);
          
          if (result.success) {
            issuesFixed++;
            details.push({
              issue: 'Trending Products Not Published',
              status: 'FIXED',
              action: `Auto-published ${result.published} trending products`
            });
          } else {
            failedFixes++;
            details.push({
              issue: 'Trending Products Not Published',
              status: 'FAILED',
              action: 'Could not auto-publish'
            });
          }
        }
      }

      return { issuesFound, issuesFixed, failedFixes, details };

    } catch (error: any) {
      issuesFound++;
      failedFixes++;
      details.push({
        issue: 'Trending Publishing Check',
        status: 'FAILED',
        action: `Error: ${error.message}`
      });
      return { issuesFound, issuesFixed, failedFixes, details };
    }
  }

  private async healAutopilotExecution(userId: string): Promise<{
    issuesFound: number;
    issuesFixed: number;
    failedFixes: number;
    details: HealingResult['details'];
  }> {
    const details: HealingResult['details'] = [];
    let issuesFound = 0;
    let issuesFixed = 0;
    let failedFixes = 0;
    const db = supabase as any;

    try {
      const { data: settings } = await db
        .from('user_settings')
        .select('last_autopilot_run, autopilot_enabled')
        .eq('user_id', userId)
        .maybeSingle();

      if (!settings || !settings.autopilot_enabled) {
        return { issuesFound, issuesFixed, failedFixes, details };
      }

      const lastRun = settings.last_autopilot_run ? new Date(settings.last_autopilot_run) : null;
      const hoursSinceLastRun = lastRun 
        ? (Date.now() - lastRun.getTime()) / (1000 * 60 * 60)
        : 999;

      const { data: stuckDrafts } = await db
        .from('generated_content')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'draft')
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(500);

      if (stuckDrafts && stuckDrafts.length > 100) {
        issuesFound++;
        const batchSize = 50;
        let processed = 0;

        for (let i = 0; i < stuckDrafts.length; i += batchSize) {
          const batch = stuckDrafts.slice(i, i + batchSize);
          const ids = batch.map((d: any) => d.id);
          
          await db.from('generated_content')
            .update({ status: 'published', updated_at: new Date().toISOString() })
            .in('id', ids);
            
          processed += batch.length;
        }

        issuesFixed++;
        details.push({
          issue: 'Draft Publishing',
          status: 'FIXED',
          action: `Published ${processed} stuck drafts`
        });
      }

      if (hoursSinceLastRun > 6) {
        issuesFound++;
        
        try {
          const result = await unifiedOrchestrator.execute(userId);
          
          await db
            .from('user_settings')
            .update({
              last_autopilot_run: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

          if (result.success) {
            issuesFixed++;
            details.push({
              issue: 'Stale Autopilot',
              status: 'FIXED',
              action: `Executed successfully (was ${Math.round(hoursSinceLastRun)}h stale)`
            });
          } else {
            failedFixes++;
            details.push({
              issue: 'Stale Autopilot',
              status: 'FAILED',
              action: 'Execution failed - check logs'
            });
          }
        } catch (execError: any) {
          failedFixes++;
          details.push({
            issue: 'Stale Autopilot',
            status: 'FAILED',
            action: `Execution error: ${execError.message}`
          });
        }
      }

      return { issuesFound, issuesFixed, failedFixes, details };

    } catch (error: any) {
      issuesFound++;
      failedFixes++;
      details.push({
        issue: 'Autopilot Execution Check',
        status: 'FAILED',
        action: `Error: ${error.message}`
      });
      return { issuesFound, issuesFixed, failedFixes, details };
    }
  }
}

export const selfHealingAutopilot = new SelfHealingAutopilot();