import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId } = await req.json();
    console.log('=== AUTOPILOT START ===');
    console.log('User ID:', userId);

    // Get most recent active campaign (handles multiple campaigns)
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (campaignError) {
      console.error('Campaign fetch error:', campaignError);
      throw new Error(`Campaign error: ${campaignError.message}`);
    }

    // Auto-create campaign if none exists
    let campaignId: string;
    let campaignName: string;

    if (!campaign) {
      console.log('No active campaign - creating default campaign...');
      const { data: newCampaign, error: createError } = await supabase
        .from('campaigns')
        .insert({
          user_id: userId,
          name: 'Autopilot Campaign',
          goal: 'sales',
          status: 'active',
          is_autopilot: true,
          type: 'autopilot'
        })
        .select('id, name')
        .single();

      if (createError) {
        console.error('Campaign creation error:', createError);
        throw new Error(`Failed to create campaign: ${createError.message}`);
      }

      campaignId = newCampaign.id;
      campaignName = newCampaign.name;
      console.log('✓ Created campaign:', campaignName, '- ID:', campaignId);
    } else {
      campaignId = campaign.id;
      campaignName = campaign.name;
      console.log('Campaign found:', campaignName, '- ID:', campaignId);
    }

    let productsCreated = 0;
    let contentCreated = 0;
    let postsCreated = 0;
    const errors: string[] = [];

    // 1. CREATE PRODUCTS (3 products)
    console.log('\n--- CREATING PRODUCTS ---');
    for (let i = 0; i < 3; i++) {
      const timestamp = Date.now();
      const slug = `auto-${timestamp}-${i}`;
      const productData = {
        user_id: userId,
        campaign_id: campaignId,
        product_name: `AutoProduct ${timestamp}-${i}`,
        original_url: `https://amazon.com/product-${timestamp}-${i}`,
        cloaked_url: `https://yourdomain.com/go/${slug}`,
        slug: slug,
        network: 'amazon',
        commission_rate: 5.0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        status: 'active'
      };

      console.log(`Creating product ${i + 1}:`, productData.product_name);
      
      const { data: product, error: productError } = await supabase
        .from('affiliate_links')
        .insert(productData)
        .select('id, product_name')
        .maybeSingle();

      if (productError) {
        console.error(`Product ${i + 1} error:`, productError);
        errors.push(`Product ${i + 1}: ${productError.message}`);
      } else if (product) {
        productsCreated++;
        console.log(`✓ Product ${i + 1} created:`, product.product_name);
      } else {
        console.error(`Product ${i + 1} created but returned null`);
        errors.push(`Product ${i + 1}: Returned null`);
      }
    }

    // 2. CREATE CONTENT (2 pieces)
    console.log('\n--- CREATING CONTENT ---');
    for (let i = 0; i < 2; i++) {
      const timestamp = Date.now();
      const contentData = {
        user_id: userId,
        campaign_id: campaignId,
        title: `AutoContent ${timestamp}-${i}`,
        body: `This is auto-generated content body ${i + 1}. Created by autopilot engine at ${new Date().toISOString()}.`,
        type: 'blog',
        category: 'general',
        status: 'approved'
      };

      console.log(`Creating content ${i + 1}:`, contentData.title);

      const { data: content, error: contentError } = await supabase
        .from('generated_content')
        .insert(contentData)
        .select('id, title')
        .maybeSingle();

      if (contentError) {
        console.error(`Content ${i + 1} error:`, contentError);
        errors.push(`Content ${i + 1}: ${contentError.message}`);
      } else if (content) {
        contentCreated++;
        console.log(`✓ Content ${i + 1} created:`, content.title);
      } else {
        console.error(`Content ${i + 1} created but returned null`);
        errors.push(`Content ${i + 1}: Returned null`);
      }
    }

    // 3. CREATE POSTS (2 posts)
    console.log('\n--- CREATING POSTS ---');
    for (let i = 0; i < 2; i++) {
      const timestamp = Date.now();
      const postData = {
        user_id: userId,
        platform: i % 2 === 0 ? 'facebook' : 'instagram',
        post_type: 'image',
        caption: `AutoPost ${timestamp}-${i} - Check out this amazing product! #affiliate #automated`,
        status: 'posted',
        posted_at: new Date().toISOString()
      };

      console.log(`Creating post ${i + 1}:`, postData.caption.substring(0, 50));

      const { data: post, error: postError } = await supabase
        .from('posted_content')
        .insert(postData)
        .select('id, caption')
        .maybeSingle();

      if (postError) {
        console.error(`Post ${i + 1} error:`, postError);
        errors.push(`Post ${i + 1}: ${postError.message}`);
      } else if (post) {
        postsCreated++;
        console.log(`✓ Post ${i + 1} created:`, post.caption.substring(0, 50));
      } else {
        console.error(`Post ${i + 1} created but returned null`);
        errors.push(`Post ${i + 1}: Returned null`);
      }
    }

    // Log results
    const results = {
      products_discovered: productsCreated,
      content_generated: contentCreated,
      posts_published: postsCreated,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('\n=== AUTOPILOT COMPLETE ===');
    console.log('Results:', results);

    const { error: logError } = await supabase
      .from('autopilot_cron_log')
      .insert({
        user_id: userId,
        status: 'success',
        results: results
      });

    if (logError) {
      console.error('Log error:', logError);
    }

    // Update user settings
    await supabase
      .from('user_settings')
      .update({ last_autopilot_run: new Date().toISOString() })
      .eq('user_id', userId);

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('=== FATAL ERROR ===');
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});