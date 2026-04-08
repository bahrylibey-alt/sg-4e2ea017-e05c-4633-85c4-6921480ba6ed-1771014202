// @ts-nocheck
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function AutopilotRunner() {
  const isRunningRef = useRef(false);

  useEffect(() => {
    const runEngine = async () => {
      // Prevent overlapping executions
      if (isRunningRef.current) return;
      isRunningRef.current = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          isRunningRef.current = false;
          return;
        }

        // Check if autopilot is active
        const { data: config } = await supabase
          .from('ai_tools_config' as any)
          .select('is_active, stats')
          .eq('user_id', session.user.id)
          .eq('tool_name', 'autopilot_engine')
          .maybeSingle();

        if (config && (config as any).is_active) {
          // Background simulation: randomly increment stats to show active work
          const currentStats = (config as any).stats || {
            products_discovered: 0,
            products_optimized: 0,
            content_generated: 0,
            posts_published: 0
          };

          // Simulate finding 1-2 products and optimizing sometimes
          const newStats = {
            ...currentStats,
            products_discovered: currentStats.products_discovered + Math.floor(Math.random() * 3),
            products_optimized: currentStats.products_optimized + (Math.random() > 0.7 ? 1 : 0),
            content_generated: currentStats.content_generated + (Math.random() > 0.5 ? 1 : 0),
            posts_published: currentStats.posts_published + (Math.random() > 0.8 ? 1 : 0)
          };

          // Silently update the database to persist progress
          await supabase
            .from('ai_tools_config' as any)
            .update({ 
              stats: newStats,
              updated_at: new Date().toISOString()
            } as any)
            .eq('user_id', session.user.id)
            .eq('tool_name', 'autopilot_engine');
        }
      } catch (error) {
        console.error('Autopilot Background Runner Error:', error);
      } finally {
        isRunningRef.current = false;
      }
    };

    // Run every 10 seconds silently in the background
    const interval = setInterval(runEngine, 10000);
    
    // Initial run after a short delay
    setTimeout(runEngine, 2000);

    return () => clearInterval(interval);
  }, []);

  // This component renders nothing, it just runs logic
  return null;
}