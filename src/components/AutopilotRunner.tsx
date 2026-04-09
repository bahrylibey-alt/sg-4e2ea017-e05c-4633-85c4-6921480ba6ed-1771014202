import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * GLOBAL AUTOPILOT BACKGROUND RUNNER
 * Runs in _app.tsx - checks database every 60 seconds
 * Executes autopilot tasks when enabled
 */
export function AutopilotRunner() {
  useEffect(() => {
    const executeAutopilotCycle = async () => {
      try {
        console.log('🔄 AutopilotRunner: Starting cycle check...');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('⏸️ AutopilotRunner: No user authenticated, skipping cycle');
          return;
        }

        // Check if autopilot is enabled
        const { data: settings } = await supabase
          .from('user_settings')
          .select('autopilot_enabled')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('🔍 AutopilotRunner: Settings check:', { 
          autopilot_enabled: settings?.autopilot_enabled,
          user_id: user.id 
        });

        if (!settings?.autopilot_enabled) {
          console.log('⏸️ AutopilotRunner: Autopilot disabled, skipping cycle');
          return;
        }

        console.log('✅ AutopilotRunner: Autopilot is enabled, proceeding to campaign check...');

        // Get user's campaigns
        const { data: campaigns, error: campaignError } = await supabase
          .from('campaigns')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        console.log('📋 AutopilotRunner: Campaign query result:', { 
          campaigns_count: campaigns?.length || 0,
          campaign_error: campaignError,
          campaigns: campaigns
        });

        const campaignId = campaigns && campaigns.length > 0 ? campaigns[0].id : null;

        if (!campaignId) {
          console.warn('⚠️ AutopilotRunner: No campaign found, creating default campaign...');
          
          // Auto-create campaign if missing
          const { data: newCampaign, error: createError } = await supabase
            .from('campaigns')
            .insert({
              user_id: user.id,
              name: 'Default Autopilot Campaign',
              goal: 'traffic',
              status: 'active'
            })
            .select('id')
            .single();

          if (createError) {
            console.error('❌ AutopilotRunner: Failed to create campaign:', createError);
            return;
          }

          console.log('✅ AutopilotRunner: Created default campaign:', newCampaign);
        }

        // Execute autopilot cycle
        console.log('🚀 AutopilotRunner: Calling autopilot-engine with:', {
          action: 'execute',
          user_id: user.id,
          campaign_id: campaignId
        });
        
        const { data, error } = await supabase.functions.invoke('autopilot-engine', {
          body: { 
            action: 'execute',
            user_id: user.id,
            campaign_id: campaignId
          }
        });

        if (error) {
          console.error('❌ AutopilotRunner: Edge function error:', error);
        } else if (data?.success) {
          console.log('✅ AutopilotRunner: Cycle completed successfully:', {
            products_added: data.products_added,
            content_generated: data.content_generated,
            traffic_activated: data.traffic_activated,
            posts_queued: data.posts_queued_for_zapier,
            trending_discovered: data.trending_discovered
          });
        } else {
          console.warn('⚠️ AutopilotRunner: Edge function returned unsuccessful:', data);
        }
      } catch (error) {
        console.error('❌ AutopilotRunner: Unexpected error:', error);
      }
    };

    // Execute immediately on mount
    console.log('🎬 AutopilotRunner: Component mounted, starting background service');
    executeAutopilotCycle();

    // Then execute every 60 seconds
    const intervalId = setInterval(() => {
      console.log('⏰ AutopilotRunner: 60-second interval triggered');
      executeAutopilotCycle();
    }, 60000); // 60 seconds

    return () => {
      console.log('🛑 AutopilotRunner: Component unmounting, stopping background service');
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return null; // This component doesn't render anything
}