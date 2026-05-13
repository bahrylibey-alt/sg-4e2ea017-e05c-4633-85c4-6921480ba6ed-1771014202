import { supabase } from "@/integrations/supabase/client";

/**
 * SIMPLE POSTER
 * Just marks content as "posted" (real posting would need API keys)
 */

export const simplePoster = {
  /**
   * "Post" ready content
   */
  async postContent(userId: string) {
    console.log('[Poster] Getting ready content...');
    
    // Get ready content
    const { data: readyContent } = await supabase
      .from('generated_content')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ready')
      .limit(10);
    
    if (!readyContent || readyContent.length === 0) {
      console.log('[Poster] No ready content found');
      return [];
    }

    const posted = [];

    for (const content of readyContent) {
      // Create posted content record
      const { data: post, error: postError } = await supabase
        .from('posted_content')
        .insert({
          user_id: userId,
          product_id: content.product_id,
          platform: content.category as any,
          post_type: 'text',
          caption: content.body,
          status: 'posted',
          posted_at: new Date().toISOString(),
          impressions: 0,
          clicks: 0
        })
        .select()
        .single();
      
      if (postError) {
        console.error(`[Poster] Failed to post ${content.title}:`, postError);
        continue;
      }

      // Mark content as posted
      await supabase
        .from('generated_content')
        .update({ status: 'posted' })
        .eq('id', content.id);
      
      console.log(`[Poster] Posted: ${content.title}`);
      posted.push(post);
    }

    return posted;
  }
};