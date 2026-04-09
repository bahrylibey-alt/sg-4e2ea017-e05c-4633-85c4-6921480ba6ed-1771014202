import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * GLOBAL AUTOPILOT BACKGROUND RUNNER
 * Runs in _app.tsx - checks database every 60 seconds
 * Executes autopilot tasks when enabled
 */
export function AutopilotRunner() {
  useEffect(() => {
    const executeAutopilotCycle = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if autopilot is enabled
        const { data: settings } = await supabase
          .from('user_settings')
          .select('autopilot_enabled')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!settings?.autopilot_enabled) {
          console.log('Autopilot disabled, stopping runner');
          return;
        }

        // Get user's campaigns
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        const campaignId = campaigns && campaigns.length > 0 ? campaigns[0].id : null;

        // Execute autopilot cycle
        const { data, error } = await supabase.functions.invoke('autopilot-engine', {
          body: { 
            action: 'execute',
            user_id: user.id,
            campaign_id: campaignId
          }
        });

        if (error) {
          console.error('Autopilot cycle error:', error);
        } else if (data?.success) {
          console.log('✅ Autopilot cycle completed:', data);
        }
      } catch (error) {
        console.error('Autopilot runner error:', error);
      }
    };

    // Run immediately on mount
    executeAutopilotCycle();

    // Then run every 60 seconds
    const intervalId = setInterval(executeAutopilotCycle, 60000);

    return () => clearInterval(intervalId);
  }, []);

  return null; // This component doesn't render anything
}