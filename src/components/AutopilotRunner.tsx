import { useEffect } from "react";
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
  useEffect(() => {
    console.log('📊 AutopilotRunner: Starting status monitoring (read-only)...');
    
    let intervalId: NodeJS.Timeout | null = null;
    let checkInProgress = false;

    const checkAutopilotStatus = async () => {
      // Prevent overlapping checks
      if (checkInProgress) {
        console.log('⏭️ AutopilotRunner: Check already in progress, skipping...');
        return;
      }

      checkInProgress = true;

      try {
        // Use getSession() instead of getUser() to avoid Navigator lock
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ AutopilotRunner: Session error:', sessionError);
          checkInProgress = false;
          return;
        }

        const user = sessionData?.session?.user;
        if (!user) {
          console.log('ℹ️ AutopilotRunner: No user session');
          checkInProgress = false;
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
          checkInProgress = false;
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
        checkInProgress = false;
      }
    };

    // Check status immediately on mount
    checkAutopilotStatus();

    // Then check every 60 seconds (not too frequent to avoid conflicts)
    intervalId = setInterval(checkAutopilotStatus, 60000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      checkInProgress = false;
    };
  }, []); // Empty dependency array - runs once on app mount

  // This component doesn't render anything
  return null;
}