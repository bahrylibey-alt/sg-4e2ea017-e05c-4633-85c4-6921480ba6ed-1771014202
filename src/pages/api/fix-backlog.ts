import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * EMERGENCY BACKLOG FIX
 * Processes the 12-day backlog of stuck drafts
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚨 EMERGENCY BACKLOG FIX STARTING...');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Count stuck drafts
    const { count: totalDrafts } = await supabase
      .from('generated_content')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'draft');

    console.log(`📊 Found ${totalDrafts} total drafts`);

    if (!totalDrafts || totalDrafts === 0) {
      return res.status(200).json({
        success: true,
        message: 'No drafts to process',
        processed: 0
      });
    }

    // Process in batches to avoid timeout
    const batchSize = 100;
    const maxToProcess = Math.min(totalDrafts, 1000); // Cap at 1000
    let totalProcessed = 0;

    for (let i = 0; i < maxToProcess; i += batchSize) {
      const { data: batch } = await supabase
        .from('generated_content')
        .select('id, title, body')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: true })
        .limit(batchSize);

      if (!batch || batch.length === 0) break;

      // Publish batch
      const { error: updateError } = await supabase
        .from('generated_content')
        .update({ 
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .in('id', batch.map(d => d.id));

      if (updateError) {
        console.error('Batch update error:', updateError);
        continue;
      }

      totalProcessed += batch.length;
      console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}: ${totalProcessed}/${maxToProcess}`);

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`🎉 BACKLOG FIX COMPLETE: ${totalProcessed} drafts published`);

    return res.status(200).json({
      success: true,
      message: `Successfully processed ${totalProcessed} drafts`,
      totalDrafts,
      processed: totalProcessed,
      remaining: totalDrafts - totalProcessed
    });

  } catch (error: any) {
    console.error('❌ BACKLOG FIX ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}