import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * FIX BACKLOG - Clear stuck queue and restart content generation
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🧹 FIXING BACKLOG: Starting cleanup...');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.id;
    const fixes: string[] = [];

    // 1. Clear stuck content queue
    const { data: stuckQueue } = await supabase
      .from('content_queue')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (stuckQueue && stuckQueue.length > 0) {
      await supabase
        .from('content_queue')
        .update({
          status: 'failed',
          error_message: 'Cleared during backlog fix',
          updated_at: new Date().toISOString()
        })
        .in('id', stuckQueue.map(q => q.id));

      fixes.push(`✅ Cleared ${stuckQueue.length} stuck queue items`);
    }

    // 2. Publish old drafts
    const { data: oldDrafts } = await supabase
      .from('generated_content')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .lt('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

    if (oldDrafts && oldDrafts.length > 0) {
      await supabase
        .from('generated_content')
        .update({
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .in('id', oldDrafts.map(d => d.id));

      fixes.push(`✅ Published ${oldDrafts.length} old drafts`);
    }

    // 3. Update system state last_run
    await supabase
      .from('user_settings')
      .update({
        last_autopilot_run: new Date().toISOString(),
        autopilot_enabled: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    fixes.push('✅ Reset autopilot timestamp');

    console.log('✅ BACKLOG FIX COMPLETE');

    return res.status(200).json({
      success: true,
      fixes,
      message: 'Backlog cleared - system ready to run'
    });

  } catch (error: any) {
    console.error('❌ BACKLOG FIX ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}