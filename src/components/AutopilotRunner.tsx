import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Global Autopilot Runner - Runs 24/7 in the background until manually stopped
 * 
 * This component:
 * 1. Checks database every 60 seconds for autopilot_enabled flag
 * 2. If enabled, triggers the Edge Function to do work
 * 3. Runs independently of page navigation
 * 4. Only stops when user clicks "STOP AUTOPILOT" button
 */
export function AutopilotRunner() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    console.log('🤖 Autopilot Runner: Component mounted');

    // Check and run autopilot every 60 seconds
    const checkAndRunAutopilot = async () => {
      try {
        // Prevent overlapping executions
        if (isRunningRef.current) {
          console.log('⏭️ Autopilot Runner: Skipping (already running)');
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('⚠️ Autopilot Runner: No user logged in');
          return;
        }

        // Check if autopilot is enabled in database
        const { data: settings } = await supabase
          .from('user_settings')
          .select('autopilot_enabled, last_autopilot_run')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!settings?.autopilot_enabled) {
          console.log('⏸️ Autopilot Runner: Autopilot is disabled');
          return;
        }

        console.log('🚀 Autopilot Runner: Triggering Edge Function...');
        isRunningRef.current = true;

        // Trigger the Edge Function
        const { data, error } = await supabase.functions.invoke('autopilot-engine', {
          body: { 
            action: 'run_cycle',
            user_id: user.id 
          }
        });

        if (error) {
          console.error('❌ Autopilot Runner: Edge Function error:', error);
        } else {
          console.log('✅ Autopilot Runner: Cycle completed', data);
        }

        // Update last run time
        await supabase
          .from('user_settings')
          .update({ last_autopilot_run: new Date().toISOString() })
          .eq('user_id', user.id);

      } catch (error) {
        console.error('❌ Autopilot Runner: Error:', error);
      } finally {
        isRunningRef.current = false;
      }
    };

    // Run immediately on mount
    checkAndRunAutopilot();

    // Then run every 60 seconds
    intervalRef.current = setInterval(checkAndRunAutopilot, 60000);

    // Cleanup on unmount
    return () => {
      console.log('🛑 Autopilot Runner: Component unmounting');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}