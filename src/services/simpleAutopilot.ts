import { supabase } from "@/integrations/supabase/client";
import { simpleProductDiscovery } from "./simpleProductDiscovery";
import { simpleContentGenerator } from "./simpleContentGenerator";
import { simplePoster } from "./simplePoster";

/**
 * SIMPLE AUTOPILOT
 * Runs the complete workflow: discover → generate → post
 */

export const simpleAutopilot = {
  /**
   * Run the complete workflow
   */
  async runWorkflow(userId: string) {
    console.log('=== SIMPLE AUTOPILOT STARTING ===');
    
    const results = {
      timestamp: new Date().toISOString(),
      productsAdded: 0,
      contentGenerated: 0,
      contentPosted: 0,
      log: [] as string[],
      success: false
    };

    const log = (msg: string) => {
      console.log(msg);
      results.log.push(`[${new Date().toISOString()}] ${msg}`);
    };

    try {
      // Step 1: Discover Products
      log('STEP 1: Discovering products...');
      const products = await simpleProductDiscovery.discoverProducts(userId);
      results.productsAdded = products.length;
      log(`✓ Added ${products.length} products`);

      // Step 2: Generate Content
      log('STEP 2: Generating content...');
      const content = await simpleContentGenerator.generateForAllProducts(userId);
      results.contentGenerated = content.length;
      log(`✓ Generated ${content.length} pieces of content`);

      // Step 3: Post Content
      log('STEP 3: Posting content...');
      const posts = await simplePoster.postContent(userId);
      results.contentPosted = posts.length;
      log(`✓ Posted ${posts.length} pieces`);

      // Update system state
      await supabase.from('system_state').upsert({
        user_id: userId,
        state: 'RUNNING',
        total_views: 0,
        total_clicks: 0,
        updated_at: new Date().toISOString()
      });

      results.success = true;
      log('=== WORKFLOW COMPLETE ===');

    } catch (error: any) {
      log(`ERROR: ${error.message}`);
      console.error('[Autopilot] Error:', error);
    }

    return results;
  },

  /**
   * Get current stats
   */
  async getStats(userId: string) {
    const [products, content, posts] = await Promise.all([
      supabase.from('product_catalog').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('generated_content').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('posted_content').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    ]);

    return {
      products: products.count || 0,
      contentGenerated: content.count || 0,
      contentPosted: posts.count || 0
    };
  }
};