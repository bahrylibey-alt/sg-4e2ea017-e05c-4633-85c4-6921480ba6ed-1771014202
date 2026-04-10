import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * AutopilotRunner - Global Background Service
 * 
 * Runs continuously across ALL pages until manually stopped
 * - Executes every 30 seconds
 * - Persists through page navigation
 * - Only stops when user disables autopilot
 */
export function AutopilotRunner() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const executionInProgress = useRef(false);

  useEffect(() => {
    console.log('🚀 AutopilotRunner: Global service starting...');

    const executeAutopilot = async () => {
      // Prevent overlapping executions
      if (executionInProgress.current) {
        console.log('⏭️ Execution in progress, skipping...');
        return;
      }

      executionInProgress.current = true;

      try {
        // Check if user is logged in
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        
        if (!user) {
          console.log('⏸️ No user session - autopilot paused');
          executionInProgress.current = false;
          return;
        }

        // Check if autopilot is enabled
        const { data: settings } = await supabase
          .from('user_settings')
          .select('autopilot_enabled')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!settings?.autopilot_enabled) {
          console.log('⏸️ Autopilot disabled - skipping cycle');
          executionInProgress.current = false;
          return;
        }

        console.log('⚡ Running autopilot cycle...');

        // Execute autopilot cycle
        const { data, error } = await supabase.functions.invoke('autopilot-engine', {
          body: { userId: user.id }
        });

        if (error) {
          console.error('❌ Autopilot cycle error:', error);
        } else {
          console.log('✅ Cycle complete:', data?.results);
        }

      } catch (error) {
        console.error('❌ Unexpected error:', error);
      } finally {
        executionInProgress.current = false;
      }
    };

    // Start interval immediately - runs forever until app closes
    intervalRef.current = setInterval(() => {
      executeAutopilot();
    }, 30000); // 30 seconds

    // Execute once immediately on mount
    executeAutopilot();

    // Cleanup only on app close (not on navigation)
    return () => {
      console.log('🛑 AutopilotRunner: App closing, stopping service...');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Empty deps - mounts once, runs forever

  return null;
}