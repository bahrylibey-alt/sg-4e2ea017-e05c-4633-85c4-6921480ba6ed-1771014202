import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * AutopilotRunner - Continuous Background Execution
 * 
 * RUNS CONTINUOUSLY until manually stopped
 * - Executes every 30 seconds
 * - Creates products, content, and posts automatically
 * - Only stops when user clicks "Stop Autopilot"
 */
export function AutopilotRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const executionInProgress = useRef(false);

  useEffect(() => {
    console.log('🤖 AutopilotRunner: Starting continuous mode...');

    const executeAutopilot = async () => {
      // Prevent overlapping executions
      if (executionInProgress.current) {
        console.log('⏭️ Execution in progress, skipping...');
        return;
      }

      try {
        executionInProgress.current = true;

        // Check if user is logged in
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        
        if (!user) {
          console.log('⏸️ No user session');
          setIsRunning(false);
          return;
        }

        // Check if autopilot is enabled
        const { data: settings } = await supabase
          .from('user_settings')
          .select('autopilot_enabled, last_autopilot_run')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!settings?.autopilot_enabled) {
          console.log('⏸️ Autopilot disabled');
          setIsRunning(false);
          
          // Clear interval if autopilot is disabled
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        console.log('✅ Autopilot enabled - running cycle...');
        setIsRunning(true);

        // Execute autopilot cycle
        const { data, error } = await supabase.functions.invoke('autopilot-engine', {
          body: { 
            action: 'run_cycle',
            user_id: user.id 
          }
        });

        if (error) {
          console.error('❌ Autopilot error:', error);
        } else {
          console.log('✅ Cycle complete:', data);
          
          // Update last run timestamp
          await supabase
            .from('user_settings')
            .update({ last_autopilot_run: new Date().toISOString() })
            .eq('user_id', user.id);

          // Log to cron table
          await supabase
            .from('autopilot_cron_log')
            .insert({
              user_id: user.id,
              status: 'success',
              results: data,
              created_at: new Date().toISOString()
            });
        }

      } catch (error) {
        console.error('❌ Unexpected error:', error);
      } finally {
        executionInProgress.current = false;
      }
    };

    // Execute immediately on mount
    executeAutopilot();

    // Then execute every 30 seconds continuously
    intervalRef.current = setInterval(() => {
      console.log('🔄 Running autopilot cycle...');
      executeAutopilot();
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      console.log('🛑 AutopilotRunner unmounting...');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      executionInProgress.current = false;
    };
  }, []); // Empty deps - runs once and keeps running

  // This component doesn't render anything visible
  return null;
}