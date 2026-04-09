import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * GLOBAL AUTOPILOT BACKGROUND RUNNER
 * Runs in _app.tsx - checks database every 60 seconds
 * Executes autopilot tasks when enabled
 */
export function AutopilotRunner() {
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let isActive = true; // Flag to prevent execution after unmount
    
    const executeAutopilotCycle = async () => {
      if (!isActive) {
        console.log('🛑 AutopilotRunner: Execution cancelled (component unmounted)');
        return;
      }

      try {
        console.log('🔄 AutopilotRunner: Starting cycle check...');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isActive) {
          console.log('⏸️ AutopilotRunner: No user authenticated, skipping cycle');
          return;
        }

        // Check if autopilot is enabled
        const { data: settings } = await supabase
          .from('user_settings')
          .select('autopilot_enabled')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!isActive) return; // Check again after async operation

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

        if (!isActive) return; // Check again after async operation

        console.log('📋 AutopilotRunner: Campaign query result:', { 
          campaigns_count: campaigns?.length || 0,
          campaign_error: campaignError,
          first_campaign_id: campaigns?.[0]?.id
        });

        let campaignId = campaigns && campaigns.length > 0 ? campaigns[0].id : null;

        if (!campaignId) {
          console.warn('⚠️ AutopilotRunner: No campaign found, creating default campaign...');
          
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

          if (!isActive) return;

          if (createError) {
            console.error('❌ AutopilotRunner: Failed to create campaign:', createError);
            return;
          }

          campaignId = newCampaign?.id;
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

        if (!isActive) return; // Check again after async operation

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
          console.warn('⚠️ AutopilotRunner: Edge function returned:', data);
        }
      } catch (error) {
        if (!isActive) return;
        console.error('❌ AutopilotRunner: Unexpected error:', error);
      }
    };

    // Execute immediately on mount
    console.log('🎬 AutopilotRunner: Component mounted, starting background service');
    executeAutopilotCycle();

    // Then execute every 60 seconds
    intervalId = setInterval(() => {
      if (!isActive) return;
      console.log('⏰ AutopilotRunner: 60-second interval triggered');
      executeAutopilotCycle();
    }, 60000);

    return () => {
      console.log('🛑 AutopilotRunner: Component unmounting, stopping background service');
      isActive = false; // Prevent any in-flight operations from continuing
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return null; // This component doesn't render anything
}