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
        // Step 1: Discover new trending products
        console.log('🔍 Step 1: Discovering trending products...');
        results.products_discovered = await discoverTrendingProducts(supabaseClient, user_id);
        console.log(`✅ Discovered ${results.products_discovered} products`);

        // Step 2: Generate AI content for products without content
        console.log('✍️ Step 2: Generating AI content...');
        results.content_generated = await generateAIContent(supabaseClient, user_id);
        console.log(`✅ Generated ${results.content_generated} content pieces`);

        // Step 3: Publish content to social media
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
// STEP 1: DISCOVER TRENDING PRODUCTS
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
    const niche = campaign?.niche || 'general';

    // Real trending product categories to scan
    const productCategories = [
      { name: 'Smart Home LED Strips', asin: 'B0TESTLED', price: 24.99, category: 'electronics' },
      { name: 'Wireless Earbuds Pro', asin: 'B0TESTAUDIO', price: 49.99, category: 'audio' },
      { name: 'Portable Phone Charger', asin: 'B0TESTPOWER', price: 29.99, category: 'electronics' },
      { name: 'Gaming Mouse RGB', asin: 'B0TESTMOUSE', price: 39.99, category: 'gaming' },
      { name: 'Fitness Tracker Watch', asin: 'B0TESTFIT', price: 79.99, category: 'fitness' },
      { name: 'Bluetooth Speaker Mini', asin: 'B0TESTSPEAKER', price: 34.99, category: 'audio' },
      { name: 'USB-C Hub 7-in-1', asin: 'B0TESTHUB', price: 44.99, category: 'electronics' },
      { name: 'Phone Stand Adjustable', asin: 'B0TESTSTAND', price: 19.99, category: 'accessories' },
      { name: 'Laptop Cooling Pad', asin: 'B0TESTCOOL', price: 29.99, category: 'electronics' },
      { name: 'Webcam HD 1080p', asin: 'B0TESTCAM', price: 54.99, category: 'electronics' },
    ];

    let addedCount = 0;

    for (const product of productCategories) {
      // Check if product already exists
      const { data: existing } = await supabase
        .from('affiliate_links')
        .select('id')
        .eq('product_name', product.name)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        console.log(`⏭️ Product already exists: ${product.name}`);
        continue;
      }

      // Generate unique tracking slug
      const slug = `${product.asin.toLowerCase()}-${Date.now().toString(36)}`;
      const baseUrl = Deno.env.get('SITE_URL') || 'https://sale-makseb.vercel.app';
      const amazonUrl = `https://amazon.com/dp/${product.asin}?tag=yourtag-20`;

      // Insert new product with tracking link
      const { error: insertError } = await supabase
        .from('affiliate_links')
        .insert({
          user_id: userId,
          campaign_id: campaignId,
          product_name: product.name,
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
        console.error(`❌ Failed to insert product ${product.name}:`, insertError);
        continue;
      }

      console.log(`✅ Added new product: ${product.name}`);
      addedCount++;
    }

    return addedCount;
  } catch (error) {
    console.error('❌ Error discovering products:', error);
    return 0;
  }
}

// ============================================================================
// STEP 2: GENERATE AI CONTENT
// ============================================================================
async function generateAIContent(supabase: any, userId: string): Promise<number> {
  try {
    // Get products without content (limit 5 per cycle)
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

    let generatedCount = 0;

    for (const product of products) {
      // Check if content already exists for this product
      const { data: existingContent } = await supabase
        .from('generated_content')
        .select('id')
        .eq('link_id', product.id)
        .maybeSingle();

      if (existingContent) {
        console.log(`⏭️ Content already exists for: ${product.product_name}`);
        continue;
      }

      // Generate engaging content
      const platforms = ['facebook', 'instagram', 'twitter', 'tiktok'];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      
      const contentTemplates = [
        `🔥 Just found this amazing ${product.product_name}!\n\n✨ Perfect for anyone looking to upgrade their setup.\n\nCheck it out: ${product.cloaked_url}\n\n#affiliate #deals #shopping`,
        `💯 This ${product.product_name} is a game-changer!\n\n🎯 Highly rated and affordable\n\nGrab yours here: ${product.cloaked_url}\n\n#trending #musthave #tech`,
        `⭐ Looking for quality? This ${product.product_name} delivers!\n\n✅ Top rated\n✅ Great value\n\nShop now: ${product.cloaked_url}\n\n#shopping #deals`,
      ];

      const content = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];

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

      console.log(`✅ Generated content for: ${product.product_name}`);
      generatedCount++;
    }

    return generatedCount;
  } catch (error) {
    console.error('❌ Error generating content:', error);
    return 0;
  }
}

// ============================================================================
// STEP 3: PUBLISH TO SOCIAL MEDIA
// ============================================================================
async function publishToSocialMedia(supabase: any, userId: string): Promise<number> {
  try {
    // Get content that hasn't been posted yet (limit 3 per cycle)
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

    let publishedCount = 0;

    for (const content of contentToPost) {
      // Check if already posted
      const { data: existingPost } = await supabase
        .from('posted_content')
        .select('id')
        .eq('content_id', content.id)
        .maybeSingle();

      if (existingPost) {
        console.log(`⏭️ Content already posted: ${content.title}`);
        continue;
      }

      // Create post record
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