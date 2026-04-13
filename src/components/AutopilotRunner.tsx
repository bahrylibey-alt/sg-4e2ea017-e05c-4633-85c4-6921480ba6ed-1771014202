import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * AutopilotRunner - Global Background Service
 * 
 * Runs continuously across ALL pages until manually stopped
 * - Executes every 30 seconds
 * - Persists through page navigation
 * - Only stops when user disables autopilot
 * - Handles errors gracefully without spamming console
 */
export function AutopilotRunner() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const executionInProgress = useRef(false);
  const consecutiveErrors = useRef(0);
  const lastErrorTime = useRef<number>(0);

  useEffect(() => {
    console.log('🚀 AutopilotRunner: Global service starting...');

    const executeAutopilot = async () => {
      // Prevent overlapping executions
      if (executionInProgress.current) {
        console.log('⏭️ Execution in progress, skipping...');
        return;
      }

      // If we've had too many consecutive errors, slow down attempts
      if (consecutiveErrors.current >= 3) {
        const timeSinceLastError = Date.now() - lastErrorTime.current;
        if (timeSinceLastError < 300000) { // 5 minutes
          console.log('⏸️ Too many errors, waiting before retry...');
          return;
        } else {
          // Reset after 5 minutes
          consecutiveErrors.current = 0;
        }
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

        // Execute autopilot cycle with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 30000)
        );

        const autopilotPromise = supabase.functions.invoke('autopilot-engine', {
          body: { userId: user.id }
        });

        const { data, error } = await Promise.race([autopilotPromise, timeoutPromise]) as any;

        if (error) {
          // Only log error once per 5 minutes to avoid console spam
          const now = Date.now();
          if (now - lastErrorTime.current > 300000) {
            console.error('❌ Autopilot cycle error:', error.message || error);
            lastErrorTime.current = now;
          }
          consecutiveErrors.current++;
        } else {
          console.log('✅ Cycle complete:', data?.results || 'success');
          consecutiveErrors.current = 0; // Reset error counter on success
        }

      } catch (error: any) {
        // Gracefully handle errors without spamming
        const now = Date.now();
        if (now - lastErrorTime.current > 300000) {
          console.error('❌ Unexpected error:', error.message);
          lastErrorTime.current = now;
        }
        consecutiveErrors.current++;
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