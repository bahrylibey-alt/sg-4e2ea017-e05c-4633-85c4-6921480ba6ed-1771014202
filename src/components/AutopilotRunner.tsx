import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * AutopilotRunner - Status Display Component
 * 
 * This component ONLY displays autopilot status from the database.
 * It does NOT execute the autopilot - that runs server-side via Vercel Cron.
 * 
 * Autopilot execution happens in:
 * - /api/cron/autopilot (Vercel Cron - every 2 minutes)
 * 
 * This component simply monitors the database and updates localStorage
 * so the UI can show current status.
 */
export function AutopilotRunner() {
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (isMonitoring) return;

    console.log('📊 AutopilotRunner: Monitoring autopilot status (display only)...');
    setIsMonitoring(true);

    const checkAutopilotStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check database for autopilot status
        const { data: settings } = await supabase
          .from('user_settings')
          .select('autopilot_enabled, last_autopilot_run')
          .eq('user_id', user.id)
          .maybeSingle();

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
      }
    };

    // Check status immediately on mount
    checkAutopilotStatus();

    // Then check every 10 seconds to update UI
    const statusInterval = setInterval(checkAutopilotStatus, 10000);

    return () => {
      clearInterval(statusInterval);
      setIsMonitoring(false);
    };
  }, [isMonitoring]);

  // This component doesn't render anything
  return null;
}