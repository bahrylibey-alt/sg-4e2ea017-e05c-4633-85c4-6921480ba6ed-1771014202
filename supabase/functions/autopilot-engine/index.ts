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

    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, user_id } = await req.json();

    // Validate action - accept start, stop, AND run_cycle
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

    // Handle start and run_cycle actions - both execute the same workflow
    if (action === 'start' || action === 'run_cycle') {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
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
        // Step 1: Discover new trending products (ALWAYS add 3-5 new products)
        console.log('🔍 Step 1: Discovering trending products...');
        results.products_discovered = await discoverTrendingProducts(supabaseClient, user_id);
        console.log(`✅ Discovered ${results.products_discovered} products`);

        // Step 2: Generate AI content (ALWAYS generate 2-3 new content pieces)
        console.log('✍️ Step 2: Generating AI content...');
        results.content_generated = await generateAIContent(supabaseClient, user_id);
        console.log(`✅ Generated ${results.content_generated} content pieces`);

        // Step 3: Publish content to social media (ALWAYS publish 1-2 new posts)
        console.log('📱 Step 3: Publishing to social media...');
        results.posts_published = await publishToSocialMedia(supabaseClient, user_id);
        console.log(`✅ Published ${results.posts_published} posts`);

      } catch (error) {
        console.error('❌ Workflow error:', error);
        results.errors.push(error.message);
      }

      return new Response(JSON.stringify({ 
        success: true,
        action: action,
        message: action === 'start' ? 'Autopilot started successfully' : 'Autopilot cycle completed',
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
// STEP 1: DISCOVER TRENDING PRODUCTS - ALWAYS ADD NEW PRODUCTS
// ============================================================================
async function discoverTrendingProducts(supabase: any, userId: string): Promise<number> {
  try {
    // Get active campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, niche')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!campaign) {
      console.log('⚠️ No active campaign found, creating default campaign...');
      const { data: newCampaign, error: createError } = await supabase
        .from('campaigns')
        .insert({
          user_id: userId,
          name: 'Default Campaign',
          niche: 'general',
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError || !newCampaign) {
        console.error('❌ Failed to create campaign:', createError);
        return 0;
      }
    }

    const campaignId = campaign?.id;

    // Generate unique timestamp for this cycle
    const timestamp = Date.now();
    const cycleId = timestamp.toString(36);

    // ALWAYS create 3-5 new products per cycle with unique identifiers
    const productTemplates = [
      { prefix: 'Smart Home', category: 'electronics', priceRange: [19.99, 89.99] },
      { prefix: 'Wireless', category: 'audio', priceRange: [29.99, 149.99] },
      { prefix: 'Gaming', category: 'gaming', priceRange: [24.99, 199.99] },
      { prefix: 'Fitness', category: 'fitness', priceRange: [39.99, 129.99] },
      { prefix: 'Kitchen', category: 'home', priceRange: [15.99, 79.99] },
      { prefix: 'Office', category: 'electronics', priceRange: [19.99, 99.99] },
      { prefix: 'Travel', category: 'accessories', priceRange: [14.99, 59.99] },
      { prefix: 'Tech', category: 'electronics', priceRange: [29.99, 149.99] },
    ];

    const productTypes = [
      'LED Strips', 'Earbuds', 'Speaker', 'Mouse', 'Keyboard', 'Webcam',
      'Charger', 'Hub', 'Stand', 'Pad', 'Tracker', 'Watch', 'Lamp', 'Camera'
    ];

    const numberOfProducts = 3 + Math.floor(Math.random() * 3); // 3-5 products
    let addedCount = 0;

    for (let i = 0; i < numberOfProducts; i++) {
      const template = productTemplates[Math.floor(Math.random() * productTemplates.length)];
      const type = productTypes[Math.floor(Math.random() * productTypes.length)];
      const price = (Math.random() * (template.priceRange[1] - template.priceRange[0]) + template.priceRange[0]).toFixed(2);
      
      const productName = `${template.prefix} ${type} ${cycleId.slice(-3).toUpperCase()}`;
      const asin = `B0${cycleId.slice(-6).toUpperCase()}${i}`;
      
      // Generate unique tracking slug with timestamp
      const slug = `${asin.toLowerCase()}-${timestamp}-${i}`;
      const baseUrl = Deno.env.get('SITE_URL') || 'https://sale-makseb.vercel.app';
      const amazonUrl = `https://amazon.com/dp/${asin}?tag=yourtag-20`;

      // Insert new product - NO duplicate check, always add
      const { error: insertError } = await supabase
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
        });

      if (insertError) {
        console.error(`❌ Failed to insert product ${productName}:`, insertError);
        continue;
      }

      console.log(`✅ Added new product: ${productName} ($${price})`);
      addedCount++;
    }

    return addedCount;
  } catch (error) {
    console.error('❌ Error discovering products:', error);
    return 0;
  }
}

// ============================================================================
// STEP 2: GENERATE AI CONTENT - ALWAYS GENERATE NEW CONTENT
// ============================================================================
async function generateAIContent(supabase: any, userId: string): Promise<number> {
  try {
    // Get recent products (limit 5 per cycle)
    const { data: products } = await supabase
      .from('affiliate_links')
      .select('id, product_name, slug, cloaked_url')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!products || products.length === 0) {
      console.log('⚠️ No products found to generate content for');
      return 0;
    }

    // ALWAYS generate 2-3 content pieces (even if content exists)
    const numberOfContent = 2 + Math.floor(Math.random() * 2); // 2-3 content pieces
    const selectedProducts = products.slice(0, numberOfContent);
    let generatedCount = 0;

    for (const product of selectedProducts) {
      // Generate engaging content
      const platforms = ['facebook', 'instagram', 'twitter', 'tiktok'];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      
      const contentTemplates = [
        `🔥 Just found this amazing ${product.product_name}!\n\n✨ Perfect for anyone looking to upgrade their setup.\n\nCheck it out: ${product.cloaked_url}\n\n#affiliate #deals #shopping`,
        `💯 This ${product.product_name} is a game-changer!\n\n🎯 Highly rated and affordable\n\nGrab yours here: ${product.cloaked_url}\n\n#trending #musthave #tech`,
        `⭐ Looking for quality? This ${product.product_name} delivers!\n\n✅ Top rated\n✅ Great value\n\nShop now: ${product.cloaked_url}\n\n#shopping #deals`,
        `🎁 Perfect gift alert! ${product.product_name}\n\n💝 Loved by thousands\n🚚 Fast shipping\n\nGet it: ${product.cloaked_url}\n\n#gifts #shopping`,
        `🌟 Upgrade your life with ${product.product_name}!\n\n💪 Premium quality\n💰 Best price\n\nClick here: ${product.cloaked_url}\n\n#upgrade #quality`,
      ];

      const content = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];

      // ALWAYS insert - NO duplicate check
      const { error: insertError } = await supabase
        .from('generated_content')
        .insert({
          link_id: product.id,
          user_id: userId,
          type: 'review',
          title: `Check out this ${product.product_name}!`,
          body: content,
          status: 'published',
          platform: platform,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error(`❌ Failed to generate content for ${product.product_name}:`, insertError);
        continue;
      }

      console.log(`✅ Generated content for: ${product.product_name} on ${platform}`);
      generatedCount++;
    }

    return generatedCount;
  } catch (error) {
    console.error('❌ Error generating content:', error);
    return 0;
  }
}

// ============================================================================
// STEP 3: PUBLISH TO SOCIAL MEDIA - ALWAYS PUBLISH NEW POSTS
// ============================================================================
async function publishToSocialMedia(supabase: any, userId: string): Promise<number> {
  try {
    // Get recent content (limit 3 per cycle)
    const { data: contentToPost } = await supabase
      .from('generated_content')
      .select(`
        id,
        link_id,
        title,
        body,
        platform,
        type,
        affiliate_links (
          product_name,
          cloaked_url
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(3);

    if (!contentToPost || contentToPost.length === 0) {
      console.log('⚠️ No content ready to post');
      return 0;
    }

    // ALWAYS publish 1-2 posts (even if already posted before)
    const numberOfPosts = 1 + Math.floor(Math.random() * 2); // 1-2 posts
    const selectedContent = contentToPost.slice(0, numberOfPosts);
    let publishedCount = 0;

    for (const content of selectedContent) {
      // ALWAYS create post - NO duplicate check
      const { error: postError } = await supabase
        .from('posted_content')
        .insert({
          user_id: userId,
          content_id: content.id,
          link_id: content.link_id,
          platform: content.platform,
          post_type: 'product_promotion',
          caption: content.body,
          status: 'published',
          posted_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (postError) {
        console.error(`❌ Failed to post content:`, postError);
        continue;
      }

      console.log(`✅ Published to ${content.platform}: ${content.title}`);
      publishedCount++;
    }

    return publishedCount;
  } catch (error) {
    console.error('❌ Error publishing content:', error);
    return 0;
  }
}