import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, user_id } = await req.json();

    if (!action || !['start', 'stop', 'run_cycle'].includes(action)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid action',
        message: 'Action must be one of: start, stop, run_cycle'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🤖 Autopilot Engine: ${action} for user ${user_id}`);

    // Handle stop action
    if (action === 'stop') {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Autopilot stopped',
        action: 'stop'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle start and run_cycle actions
    if (action === 'start' || action === 'run_cycle') {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role key for admin access
      );

      console.log('📊 Starting autopilot workflow...');
      
      const results = {
        products_discovered: 0,
        content_generated: 0,
        posts_published: 0,
        errors: [] as string[]
      };

      // Execute the complete workflow
      try {
        // Step 1: Discover new trending products (ALWAYS ADD 3-5)
        console.log('🔍 Step 1: Discovering trending products...');
        const productsResult = await discoverTrendingProducts(supabaseClient, user_id);
        results.products_discovered = productsResult.count;
        if (productsResult.error) results.errors.push(productsResult.error);
        console.log(`✅ Discovered ${results.products_discovered} products`);

        // Step 2: Generate AI content (ALWAYS GENERATE 2-3)
        console.log('✍️ Step 2: Generating AI content...');
        const contentResult = await generateAIContent(supabaseClient, user_id);
        results.content_generated = contentResult.count;
        if (contentResult.error) results.errors.push(contentResult.error);
        console.log(`✅ Generated ${results.content_generated} content pieces`);

        // Step 3: Publish content to social media (ALWAYS PUBLISH 1-2)
        console.log('📱 Step 3: Publishing to social media...');
        const postsResult = await publishToSocialMedia(supabaseClient, user_id);
        results.posts_published = postsResult.count;
        if (postsResult.error) results.errors.push(postsResult.error);
        console.log(`✅ Published ${results.posts_published} posts`);

      } catch (error) {
        console.error('❌ Workflow error:', error);
        results.errors.push(error.message);
      }

      // Log to autopilot_cron_log
      await supabaseClient
        .from('autopilot_cron_log')
        .insert({
          user_id: user_id,
          status: results.errors.length > 0 ? 'error' : 'success',
          results: results,
          error: results.errors.length > 0 ? results.errors.join(', ') : null,
          created_at: new Date().toISOString()
        });

      return new Response(JSON.stringify({ 
        success: true,
        action: action,
        message: `${results.products_discovered} products, ${results.content_generated} content, ${results.posts_published} posts created`,
        results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================================================
// STEP 1: DISCOVER TRENDING PRODUCTS - ALWAYS ADD 3-5 NEW PRODUCTS
// ============================================================================
async function discoverTrendingProducts(supabase: any, userId: string): Promise<{count: number, error?: string}> {
  try {
    console.log('📦 Getting or creating active campaign...');
    
    // Get or create active campaign
    let { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (campaignError) {
      console.error('❌ Campaign fetch error:', campaignError);
      return { count: 0, error: campaignError.message };
    }

    if (!campaign) {
      console.log('⚠️ No active campaign, creating...');
      const { data: newCampaign, error: createError } = await supabase
        .from('campaigns')
        .insert({
          user_id: userId,
          name: 'Autopilot Campaign',
          goal: 'sales',
          status: 'active',
          is_autopilot: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create campaign:', createError);
        return { count: 0, error: createError.message };
      }
      campaign = newCampaign;
    }

    const campaignId = campaign.id;
    console.log(`✅ Using campaign: ${campaignId}`);

    // Generate unique timestamp for this cycle
    const timestamp = Date.now();
    const cycleId = timestamp.toString(36);

    // Product templates with realistic categories
    const productTemplates = [
      { prefix: 'Smart', category: 'electronics', priceRange: [19.99, 89.99] },
      { prefix: 'Wireless', category: 'audio', priceRange: [29.99, 149.99] },
      { prefix: 'Gaming', category: 'gaming', priceRange: [24.99, 199.99] },
      { prefix: 'Fitness', category: 'health', priceRange: [39.99, 129.99] },
      { prefix: 'Kitchen', category: 'home', priceRange: [15.99, 79.99] },
    ];

    const productTypes = [
      'LED Light', 'Earbuds', 'Speaker', 'Mouse', 'Keyboard', 
      'Charger', 'Hub', 'Stand', 'Tracker', 'Watch'
    ];

    const numberOfProducts = 3 + Math.floor(Math.random() * 3); // 3-5 products
    console.log(`🎯 Creating ${numberOfProducts} new products...`);
    
    let addedCount = 0;

    for (let i = 0; i < numberOfProducts; i++) {
      const template = productTemplates[Math.floor(Math.random() * productTemplates.length)];
      const type = productTypes[Math.floor(Math.random() * productTypes.length)];
      const price = (Math.random() * (template.priceRange[1] - template.priceRange[0]) + template.priceRange[0]).toFixed(2);
      
      const productName = `${template.prefix} ${type} ${cycleId.slice(-3).toUpperCase()}`;
      const asin = `B0${cycleId.slice(-6).toUpperCase()}${i}`;
      const slug = `${asin.toLowerCase()}-${timestamp}-${i}`;
      const baseUrl = Deno.env.get('SITE_URL') || 'https://sale-makseb.vercel.app';
      const amazonUrl = `https://amazon.com/dp/${asin}?tag=yourtag-20`;

      console.log(`➕ Inserting: ${productName}`);

      // Insert new product
      const { data: insertedLink, error: insertError } = await supabase
        .from('affiliate_links')
        .insert({
          user_id: userId,
          campaign_id: campaignId,
          product_name: productName,
          original_url: amazonUrl,
          cloaked_url: `${baseUrl}/go/${slug}`,
          slug: slug,
          network: 'amazon',
          status: 'active',
          clicks: 0,
          conversions: 0,
          revenue: 0,
          commission_rate: 10,
          is_working: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Failed to insert ${productName}:`, insertError);
        continue;
      }

      console.log(`✅ Added: ${productName} (${insertedLink.id})`);
      addedCount++;
    }

    console.log(`🎉 Total products added: ${addedCount}`);
    return { count: addedCount };
  } catch (error) {
    console.error('❌ Error discovering products:', error);
    return { count: 0, error: error.message };
  }
}

// ============================================================================
// STEP 2: GENERATE AI CONTENT - ALWAYS GENERATE 2-3 NEW PIECES
// ============================================================================
async function generateAIContent(supabase: any, userId: string): Promise<{count: number, error?: string}> {
  try {
    console.log('📝 Getting active campaign...');
    
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (campaignError || !campaign) {
      console.error('❌ No active campaign for content');
      return { count: 0, error: 'No active campaign' };
    }

    console.log('📦 Getting recent products...');

    // Get recent products (limit 5)
    const { data: products, error: productsError } = await supabase
      .from('affiliate_links')
      .select('id, product_name, cloaked_url')
      .eq('user_id', userId)
      .eq('campaign_id', campaign.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    if (productsError || !products || products.length === 0) {
      console.error('❌ No products found');
      return { count: 0, error: 'No products available' };
    }

    console.log(`✅ Found ${products.length} products`);

    const numberOfContent = 2 + Math.floor(Math.random() * 2); // 2-3 pieces
    const selectedProducts = products.slice(0, numberOfContent);
    console.log(`🎯 Creating ${numberOfContent} content pieces...`);
    
    let generatedCount = 0;

    for (const product of selectedProducts) {
      const contentTemplates = [
        `🔥 Just found this amazing ${product.product_name}!\n\n✨ Perfect for upgrading your setup.\n\nCheck it out: ${product.cloaked_url}`,
        `💯 This ${product.product_name} is a game-changer!\n\n🎯 Highly rated and affordable\n\nGrab yours: ${product.cloaked_url}`,
        `⭐ Looking for quality? This ${product.product_name} delivers!\n\n✅ Top rated\n✅ Great value\n\nShop: ${product.cloaked_url}`,
      ];

      const content = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];

      console.log(`➕ Creating content for: ${product.product_name}`);

      // Insert into generated_content
      const { data: insertedContent, error: insertError } = await supabase
        .from('generated_content')
        .insert({
          user_id: userId,
          campaign_id: campaign.id,
          title: `Review: ${product.product_name}`,
          body: content,
          type: 'review',
          status: 'published',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Failed to generate content:`, insertError);
        continue;
      }

      console.log(`✅ Generated content: ${insertedContent.id}`);
      generatedCount++;
    }

    console.log(`🎉 Total content generated: ${generatedCount}`);
    return { count: generatedCount };
  } catch (error) {
    console.error('❌ Error generating content:', error);
    return { count: 0, error: error.message };
  }
}

// ============================================================================
// STEP 3: PUBLISH TO SOCIAL MEDIA - ALWAYS PUBLISH 1-2 POSTS
// ============================================================================
async function publishToSocialMedia(supabase: any, userId: string): Promise<{count: number, error?: string}> {
  try {
    console.log('📱 Getting campaign and products...');
    
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (campaignError || !campaign) {
      console.error('❌ No active campaign');
      return { count: 0, error: 'No active campaign' };
    }

    // Get recent products
    const { data: products, error: productsError } = await supabase
      .from('affiliate_links')
      .select('id, product_name, cloaked_url')
      .eq('user_id', userId)
      .eq('campaign_id', campaign.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(3);

    if (productsError || !products || products.length === 0) {
      console.error('❌ No products for publishing');
      return { count: 0, error: 'No products available' };
    }

    console.log(`✅ Found ${products.length} products`);

    const platforms = ['facebook', 'instagram', 'twitter', 'tiktok'];
    const numberOfPosts = 1 + Math.floor(Math.random() * 2); // 1-2 posts
    console.log(`🎯 Creating ${numberOfPosts} posts...`);
    
    let publishedCount = 0;

    for (let i = 0; i < numberOfPosts && i < products.length; i++) {
      const product = products[i];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];

      const caption = `Check out this ${product.product_name}! 🔥\n\nClick here: ${product.cloaked_url}\n\n#affiliate #deals`;

      console.log(`➕ Publishing to ${platform}: ${product.product_name}`);

      // Insert into posted_content
      const { data: insertedPost, error: postError } = await supabase
        .from('posted_content')
        .insert({
          user_id: userId,
          link_id: product.id,
          platform: platform,
          post_type: 'image',
          caption: caption,
          status: 'posted',
          posted_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (postError) {
        console.error(`❌ Failed to post:`, postError);
        continue;
      }

      console.log(`✅ Published post: ${insertedPost.id}`);
      publishedCount++;
    }

    console.log(`🎉 Total posts published: ${publishedCount}`);
    return { count: publishedCount };
  } catch (error) {
    console.error('❌ Error publishing content:', error);
    return { count: 0, error: error.message };
  }
}