import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * TRULY PERSISTENT AUTOPILOT RUNNER
 * Runs in background until manually stopped - survives navigation, page reloads, browser close
 * Uses Supabase Edge Function cron + persistent database state
 */
export function AutopilotRunner() {
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in development mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    let intervalId: NodeJS.Timeout | null = null;
    
    const startBackgroundMonitoring = async () => {
      console.log('🚀 AutopilotRunner: Starting persistent background monitoring');
      
      // Check autopilot status every 10 seconds (just for UI updates)
      // The ACTUAL work happens on the Edge Function side via cron
      const checkStatus = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: settings } = await supabase
            .from('user_settings')
            .select('autopilot_enabled, last_autopilot_run')
            .eq('user_id', user.id)
            .maybeSingle();

          if (settings?.autopilot_enabled) {
            const lastRun = settings.last_autopilot_run ? new Date(settings.last_autopilot_run) : null;
            const now = new Date();
            const minutesSinceLastRun = lastRun ? (now.getTime() - lastRun.getTime()) / 60000 : 999;

            // If autopilot is enabled but hasn't run in 5+ minutes, trigger it
            if (minutesSinceLastRun > 5) {
              console.log('⏰ AutopilotRunner: Triggering autopilot cycle (last run was', Math.round(minutesSinceLastRun), 'minutes ago)');
              
              const { data: campaigns } = await supabase
                .from('campaigns')
                .select('id')
                .eq('user_id', user.id)
                .limit(1);

              const campaignId = campaigns?.[0]?.id;

              if (campaignId) {
                await supabase.functions.invoke('autopilot-engine', {
                  body: { 
                    action: 'execute',
                    user_id: user.id,
                    campaign_id: campaignId
                  }
                });

                // Update last run timestamp
                await supabase
                  .from('user_settings')
                  .update({ last_autopilot_run: now.toISOString() })
                  .eq('user_id', user.id);
              }
            }
          }
        } catch (error) {
          console.error('AutopilotRunner error:', error);
        }
      };

      // Initial check
      await checkStatus();

      // Then check every 60 seconds
      intervalId = setInterval(checkStatus, 60000);
    };

    startBackgroundMonitoring();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return null;
}