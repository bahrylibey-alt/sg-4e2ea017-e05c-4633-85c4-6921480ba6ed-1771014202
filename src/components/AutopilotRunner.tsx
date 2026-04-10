import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * AutopilotRunner - Hybrid Autopilot System
 * 
 * TWO EXECUTION MODES:
 * 
 * 1. BROWSER MODE (Development/Testing):
 *    - Runs while dashboard is open
 *    - Executes workflow every 2 minutes
 *    - Stops when you navigate away or close tab
 *    - Good for immediate testing and seeing results
 * 
 * 2. SERVER MODE (Production):
 *    - Runs on Vercel servers via Cron Job
 *    - Executes every 2 minutes 24/7
 *    - Never stops (even when browser is closed)
 *    - Requires deployment to Vercel
 * 
 * This component handles BOTH modes intelligently.
 */
export function AutopilotRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const executionInProgress = useRef(false);

  useEffect(() => {
    console.log('🤖 AutopilotRunner: Initializing hybrid autopilot system...');

    let statusCheckInterval: NodeJS.Timeout | null = null;

    const checkAndExecute = async () => {
      // Prevent overlapping executions
      if (executionInProgress.current) {
        console.log('⏭️ AutopilotRunner: Execution in progress, skipping...');
        return;
      }

      try {
        executionInProgress.current = true;

        // Check if user is logged in
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ AutopilotRunner: Session error:', sessionError);
          return;
        }

        const user = sessionData?.session?.user;
        if (!user) {
          console.log('⏸️ AutopilotRunner: No user session, skipping execution');
          setIsRunning(false);
          return;
        }

        // Check if autopilot is enabled in database
        const { data: settings, error: settingsError } = await supabase
          .from('user_settings')
          .select('autopilot_enabled, last_autopilot_run')
          .eq('user_id', user.id)
          .maybeSingle();

        if (settingsError) {
          console.error('❌ AutopilotRunner: Settings error:', settingsError);
          return;
        }

        if (!settings || !settings.autopilot_enabled) {
          console.log('⏸️ AutopilotRunner: Autopilot is disabled');
          setIsRunning(false);
          
          // Update localStorage
          localStorage.setItem('autopilot_active', 'false');
          
          // Clear execution interval if it exists
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          return;
        }

        console.log('✅ AutopilotRunner: Autopilot is enabled - checking execution mode...');
        setIsRunning(true);
        
        // Update localStorage
        localStorage.setItem('autopilot_active', 'true');
        if (settings.last_autopilot_run) {
          localStorage.setItem('autopilot_last_run', settings.last_autopilot_run);
        }

        // Check if we're in production (Vercel deployment)
        const isProduction = typeof window !== 'undefined' && 
          window.location.hostname !== 'localhost' && 
          !window.location.hostname.includes('softgen');

        if (isProduction) {
          // PRODUCTION: Vercel Cron handles execution, we just monitor status
          console.log('🌐 AutopilotRunner: Running in PRODUCTION mode - Vercel Cron handles execution');
          return;
        }

        // DEVELOPMENT: Browser handles execution
        console.log('💻 AutopilotRunner: Running in DEVELOPMENT mode - Browser handles execution');

        // Check if enough time has passed since last run (2 minutes = 120 seconds)
        const timeSinceLastRun = settings.last_autopilot_run 
          ? (Date.now() - new Date(settings.last_autopilot_run).getTime()) / 1000
          : 999999;

        if (timeSinceLastRun < 120) {
          console.log(`⏰ AutopilotRunner: Last run was ${Math.floor(timeSinceLastRun)}s ago, waiting...`);
          return;
        }

        console.log('🚀 AutopilotRunner: Executing autopilot workflow...');

        // Call the Edge Function to execute autopilot workflow
        const { data, error } = await supabase.functions.invoke('autopilot-engine', {
          body: { 
            action: 'run_cycle',
            user_id: user.id 
          }
        });

        if (error) {
          console.error('❌ AutopilotRunner: Edge Function error:', error);
          localStorage.setItem('autopilot_last_error', JSON.stringify({
            timestamp: new Date().toISOString(),
            error: error.message
          }));
        } else {
          console.log('✅ AutopilotRunner: Workflow executed successfully:', data);
          
          // Store success timestamp
          localStorage.setItem('autopilot_last_run', new Date().toISOString());
          localStorage.removeItem('autopilot_last_error');
          
          // Update database
          await supabase
            .from('user_settings')
            .update({ last_autopilot_run: new Date().toISOString() })
            .eq('user_id', user.id);

          // Log to autopilot_cron_log
          await supabase
            .from('autopilot_cron_log')
            .insert({
              user_id: user.id,
              status: 'success',
              results: data,
              created_at: new Date().toISOString()
            });

          console.log('📊 AutopilotRunner: Database updated with execution results');
        }

      } catch (error) {
        console.error('❌ AutopilotRunner: Unexpected error:', error);
      } finally {
        executionInProgress.current = false;
      }
    };

    // Start execution interval (runs every 30 seconds, checks if 2 minutes have passed)
    intervalRef.current = setInterval(() => {
      console.log('🔄 AutopilotRunner: Checking if execution is needed...');
      checkAndExecute();
    }, 30000); // Check every 30 seconds

    // Also check immediately on mount
    checkAndExecute();

    // Cleanup on unmount
    return () => {
      console.log('🛑 AutopilotRunner: Component unmounting, clearing interval...');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
      }
      executionInProgress.current = false;
    };
  }, []); // Empty dependency array - runs once on app mount

  // This component doesn't render anything
  return null;
}