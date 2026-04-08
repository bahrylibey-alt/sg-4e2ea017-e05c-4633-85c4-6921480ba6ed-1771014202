import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * GLOBAL AUTOPILOT BACKGROUND RUNNER
 * Runs in _app.tsx - checks database every 60 seconds
 * Executes autopilot tasks when enabled
 */
export function AutopilotRunner() {
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

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
          
          // Call the edge function to execute autopilot tasks
          try {
            await supabase.functions.invoke('autopilot-engine', {
              body: { 
                action: 'execute',
                user_id: session.user.id 
              }
            });
          } catch (error) {
            console.error('Autopilot execution error:', error);
          }
        }
      } catch (error) {
        console.error('AutopilotRunner error:', error);
      }
    };

    // Run immediately on mount
    runAutopilotCheck();

    // Then run every 60 seconds
    intervalId = setInterval(runAutopilotCheck, 60000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return null; // This component doesn't render anything
}