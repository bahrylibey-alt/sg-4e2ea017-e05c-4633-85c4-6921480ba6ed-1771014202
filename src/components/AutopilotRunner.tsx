import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * GLOBAL AUTOPILOT BACKGROUND RUNNER
 * Runs in _app.tsx - checks database every 60 seconds
 * Executes autopilot tasks when enabled
 */
export function AutopilotRunner() {
  useEffect(() => {
    const runAutopilotCheck = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // SINGLE SOURCE OF TRUTH: user_settings.autopilot_enabled
        const { data: settings } = await supabase
          .from('user_settings')
          .select('autopilot_enabled')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (settings?.autopilot_enabled) {
          console.log('🤖 Autopilot is ACTIVE - background tasks running');
          
          // Get user's active autopilot campaign
          const { data: campaigns } = await supabase
            .from('campaigns')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('is_autopilot', true)
            .eq('status', 'active')
            .limit(1);

          const campaignId = campaigns && campaigns.length > 0 ? campaigns[0].id : null;

          if (campaignId) {
            // Call Edge Function with BOTH user_id AND campaign_id
            try {
              const { data, error } = await supabase.functions.invoke('autopilot-engine', {
                body: { 
                  action: 'execute',
                  user_id: session.user.id,
                  campaign_id: campaignId
                }
              });

              if (error) {
                console.error('❌ Autopilot background execution error:', error);
              } else {
                console.log('✅ Autopilot background tasks completed:', data);
              }
            } catch (fnError) {
              console.error('Edge function call failed:', fnError);
            }
          } else {
            console.log('⚠️ No active autopilot campaign found - skipping execution');
          }
        }
      } catch (error) {
        console.error('AutopilotRunner error:', error);
      }
    };

    // Run immediately on mount
    runAutopilotCheck();

    // Then run every 60 seconds
    const intervalId = setInterval(runAutopilotCheck, 60000);

    return () => clearInterval(intervalId);
  }, []);

  return null; // This component doesn't render anything
}