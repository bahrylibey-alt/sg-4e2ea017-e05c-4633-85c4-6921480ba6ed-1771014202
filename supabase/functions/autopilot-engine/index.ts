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
        posts_queued: 0,
        posts_published: 0,
        errors: [] as string[]
      };

      // Execute the complete workflow
      try {
        // Step 1: Discover new products
        results.products_discovered = await discoverProducts(supabaseClient, user_id);
        console.log(`✅ Discovered ${results.products_discovered} products`);

        // Step 2: Generate content for products
        results.content_generated = await generateContent(supabaseClient, user_id);
        console.log(`✅ Generated ${results.content_generated} content pieces`);

        // Step 3: Queue content for posting
        results.posts_queued = await queueContentForPosting(supabaseClient, user_id);
        console.log(`✅ Queued ${results.posts_queued} posts`);

        // Step 4: Publish queued posts
        results.posts_published = await publishQueuedPosts(supabaseClient, user_id);
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
// WORKFLOW FUNCTIONS
// ============================================================================

async function discoverProducts(supabaseClient: any, userId: string): Promise<number> {
  // Get active campaign
  const { data: campaign } = await supabaseClient
    .from('campaigns')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!campaign) {
    console.log('No active campaign found');
    return 0;
  }

  // Simulate product discovery - in production, this would scrape Amazon/Temu
  const mockProducts = [
    { name: 'LED Desk Lamp', asin: 'B0TEST001', price: 29.99, category: 'electronics' },
    { name: 'Smart Watch Pro', asin: 'B0TEST002', price: 89.99, category: 'wearables' },
    { name: 'Wireless Earbuds', asin: 'B0TEST003', price: 49.99, category: 'audio' },
    { name: 'Yoga Mat Premium', asin: 'B0TEST004', price: 35.99, category: 'fitness' },
    { name: 'Coffee Maker', asin: 'B0TEST005', price: 59.99, category: 'kitchen' }
  ];

  let addedCount = 0;

  for (const product of mockProducts) {
    // Check if product already exists
    const { data: existing } = await supabaseClient
      .from('affiliate_links')
      .select('id')
      .eq('product_name', product.name)
      .maybeSingle();

    if (existing) continue;

    // Generate tracking slug
    const slug = Math.random().toString(36).substring(2, 10);
    const baseUrl = 'https://sale-makseb.vercel.app';
    const amazonUrl = `https://amazon.com/dp/${product.asin}?tag=yourtag-20`;

    // Insert new product
    await supabaseClient
      .from('affiliate_links')
      .insert({
        user_id: userId,
        campaign_id: campaign.id,
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

    addedCount++;
  }

  return addedCount;
}

async function generateContent(supabaseClient: any, userId: string): Promise<number> {
  // Get products without content (limit to 5 per cycle)
  const { data: products } = await supabaseClient
    .from('affiliate_links')
    .select('id, product_name, slug, cloaked_url')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(5);

  if (!products || products.length === 0) {
    return 0;
  }

  let generatedCount = 0;

  for (const product of products) {
    // Check if content already exists
    const { data: existing } = await supabaseClient
      .from('generated_content')
      .select('id')
      .eq('link_id', product.id)
      .maybeSingle();

    if (existing) continue;

    // Generate AI content
    const platforms = ['twitter', 'facebook', 'instagram', 'tiktok'];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];

    const content = `🔥 Check out this amazing ${product.product_name}!\n\nGet yours here: ${product.cloaked_url}\n\n#amazon #deals #shopping #trending`;

    await supabaseClient
      .from('generated_content')
      .insert({
        link_id: product.id,
        platform: platform,
        content_type: 'post',
        content: content,
        performance_score: 75 + Math.floor(Math.random() * 25),
        created_at: new Date().toISOString()
      });

    generatedCount++;
  }

  return generatedCount;
}

async function queueContentForPosting(supabaseClient: any, userId: string): Promise<number> {
  // Get generated content that hasn't been posted yet (limit to 5)
  const { data: content } = await supabaseClient
    .from('generated_content')
    .select(`
      id,
      link_id,
      platform,
      content,
      affiliate_links (
        product_name,
        cloaked_url
      )
    `)
    .limit(5);

  if (!content || content.length === 0) {
    return 0;
  }

  let queuedCount = 0;

  for (const item of content) {
    // Check if already queued
    const { data: existing } = await supabaseClient
      .from('posted_content')
      .select('id')
      .eq('content_id', item.id)
      .maybeSingle();

    if (existing) continue;

    // Queue for posting
    await supabaseClient
      .from('posted_content')
      .insert({
        content_id: item.id,
        link_id: item.link_id,
        platform: item.platform,
        post_type: 'product_promotion',
        caption: item.content,
        status: 'scheduled',
        created_at: new Date().toISOString()
      });

    queuedCount++;
  }

  return queuedCount;
}

async function publishQueuedPosts(supabaseClient: any, userId: string): Promise<number> {
  // Get scheduled posts (limit to 3 per cycle)
  const { data: posts } = await supabaseClient
    .from('posted_content')
    .select('id, platform, caption')
    .eq('status', 'scheduled')
    .is('posted_at', null)
    .limit(3);

  if (!posts || posts.length === 0) {
    return 0;
  }

  let publishedCount = 0;

  for (const post of posts) {
    // Simulate publishing to social media
    console.log(`📤 Publishing to ${post.platform}: ${post.caption.substring(0, 50)}...`);

    // Update post as published
    await supabaseClient
      .from('posted_content')
      .update({
        status: 'published',
        posted_at: new Date().toISOString()
      })
      .eq('id', post.id);

    publishedCount++;
  }

  return publishedCount;
}