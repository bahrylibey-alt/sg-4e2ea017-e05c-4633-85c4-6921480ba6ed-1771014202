import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * AutopilotRunner - Global background process manager
 * 
 * This component runs at the application root level and manages
 * the autopilot system through database state checking.
 * 
 * Key Features:
 * - Checks database every 2 minutes for autopilot status
 * - Triggers Edge Function if autopilot is enabled
 * - Works independently of page navigation
 * - Persists across browser sessions
 */
export function AutopilotRunner() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    console.log('🤖 AutopilotRunner: Initializing global autopilot monitor...');

    const checkAndRunAutopilot = async () => {
      // Prevent concurrent executions
      if (isRunningRef.current) {
        console.log('⏭️ AutopilotRunner: Skipping - already running');
        return;
      }

      try {
        isRunningRef.current = true;

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('⚠️ AutopilotRunner: No authenticated user, skipping cycle');
          isRunningRef.current = false;
          return;
        }

        // Check if autopilot is enabled in database (SINGLE SOURCE OF TRUTH)
        const { data: settings, error: settingsError } = await supabase
          .from('user_settings')
          .select('autopilot_enabled, last_autopilot_run')
          .eq('user_id', user.id)
          .maybeSingle();

        if (settingsError) {
          console.error('❌ AutopilotRunner: Error fetching settings:', settingsError);
          isRunningRef.current = false;
          return;
        }

        if (!settings?.autopilot_enabled) {
          console.log('⏸️ AutopilotRunner: Autopilot disabled, skipping cycle');
          isRunningRef.current = false;
          return;
        }

        console.log('🚀 AutopilotRunner: Autopilot enabled - triggering Edge Function...');

        // Call the Edge Function to execute autopilot workflow
        const { data, error } = await supabase.functions.invoke('autopilot-engine', {
          body: { 
            action: 'run_cycle',
            user_id: user.id 
          }
        });

        if (error) {
          console.error('❌ AutopilotRunner: Edge Function error:', error);
          // Store error in localStorage for UI to display
          localStorage.setItem('autopilot_last_error', JSON.stringify({
            timestamp: new Date().toISOString(),
            error: error.message
          }));
        } else {
          console.log('✅ AutopilotRunner: Cycle completed successfully:', data);
          
          // Store success timestamp in localStorage for UI to display
          localStorage.setItem('autopilot_last_run', new Date().toISOString());
          localStorage.removeItem('autopilot_last_error');
          
          // Update last_autopilot_run in database
          await supabase
            .from('user_settings')
            .update({ last_autopilot_run: new Date().toISOString() })
            .eq('user_id', user.id);
        }

      } catch (error) {
        console.error('❌ AutopilotRunner: Unexpected error:', error);
      } finally {
        isRunningRef.current = false;
      }
    };

    // Run immediately on mount
    checkAndRunAutopilot();

    // Then run every 2 minutes (120000ms)
    intervalRef.current = setInterval(checkAndRunAutopilot, 120000);

    console.log('✅ AutopilotRunner: Global monitor started (checks every 2 minutes)');

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('🛑 AutopilotRunner: Global monitor stopped');
      }
    };
  }, []); // Empty dependency array - runs once on app mount

  // This component doesn't render anything
  return null;
}