import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * AutopilotRunner - Status Display Component (Read-Only)
 * 
 * This component ONLY displays autopilot status from the database.
 * It does NOT execute the autopilot - that runs server-side via Vercel Cron.
 * 
 * Autopilot execution happens in:
 * - /api/cron/autopilot (Vercel Cron - every 2 minutes)
 * - /api/autopilot/trigger (can be called by external cron services)
 * 
 * This component simply monitors the database and updates localStorage
 * so the UI can show current status.
 */
export function AutopilotRunner() {
  const checkInProgress = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('📊 AutopilotRunner: Monitoring autopilot status (display only)...');

    const checkAutopilotStatus = async () => {
      // Prevent overlapping checks
      if (checkInProgress.current) {
        console.log('⏭️ AutopilotRunner: Check already in progress, skipping...');
        return;
      }

      checkInProgress.current = true;

      try {
        // Use a simpler auth check that doesn't require locks
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ AutopilotRunner: Session error:', sessionError);
          checkInProgress.current = false;
          return;
        }

        const user = sessionData?.session?.user;
        if (!user) {
          console.log('ℹ️ AutopilotRunner: No user session');
          checkInProgress.current = false;
          return;
        }

        // Check database for autopilot status
        const { data: settings, error: settingsError } = await supabase
          .from('user_settings')
          .select('autopilot_enabled, last_autopilot_run')
          .eq('user_id', user.id)
          .maybeSingle();

        if (settingsError) {
          console.error('❌ AutopilotRunner: Settings error:', settingsError);
          checkInProgress.current = false;
          return;
        }

        if (settings) {
          // Update localStorage for UI display
          localStorage.setItem('autopilot_active', settings.autopilot_enabled ? 'true' : 'false');
          
          if (settings.last_autopilot_run) {
            localStorage.setItem('autopilot_last_run', settings.last_autopilot_run);
          }

          console.log('📊 Autopilot Status:', {
            enabled: settings.autopilot_enabled,
            last_run: settings.last_autopilot_run
          });
        }
      } catch (error) {
        console.error('❌ AutopilotRunner: Error checking status:', error);
      } finally {
        checkInProgress.current = false;
      }
    };

    // Check status immediately on mount
    checkAutopilotStatus();

    // Then check every 60 seconds (not 10 - reduces lock conflicts)
    intervalRef.current = setInterval(checkAutopilotStatus, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      checkInProgress.current = false;
    };
  }, []); // Empty dependency array - runs once on app mount

  // This component doesn't render anything
  return null;
}