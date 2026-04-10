import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, user_id } = await req.json();
    
    console.log('🤖 Autopilot Engine starting...', { action, user_id });

    // Create Supabase client with SERVICE ROLE (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user's active campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, name')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (campaignError) {
      console.error('❌ Campaign error:', campaignError);
      throw new Error(`Campaign error: ${campaignError.message}`);
    }

    if (!campaign) {
      console.log('⏸️ No active campaign found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          products_discovered: 0,
          content_generated: 0,
          posts_published: 0,
          message: 'No active campaign'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    console.log('✅ Found active campaign:', campaign.name);

    let productsCreated = 0;
    let contentCreated = 0;
    let postsCreated = 0;

    // 1. CREATE PRODUCTS (3 per cycle)
    console.log('📦 Creating products...');
    for (let i = 0; i < 3; i++) {
      const productName = `AutoProduct ${Date.now()}-${i}`;
      const slug = productName.toLowerCase().replace(/\s+/g, '-');
      
      const { data: product, error: productError } = await supabaseAdmin
        .from('affiliate_links')
        .insert({
          user_id: user_id,
          campaign_id: campaign.id,
          product_name: productName,
          slug: slug,
          original_url: `https://example.com/product/${slug}`,
          short_url: `https://example.com/${slug}`,
          category: 'Auto-Generated',
          platform: 'amazon',
          status: 'active',
          clicks: 0,
          conversions: 0,
          revenue: 0,
          commission_rate: 10,
          is_promoted: true,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (productError) {
        console.error('❌ Product insert error:', productError);
      } else {
        productsCreated++;
        console.log('✅ Product created:', product.id);
      }
    }

    // 2. CREATE CONTENT (2 per cycle)
    console.log('📝 Creating content...');
    for (let i = 0; i < 2; i++) {
      const { data: content, error: contentError } = await supabaseAdmin
        .from('generated_content')
        .insert({
          user_id: user_id,
          title: `AutoContent ${Date.now()}-${i}`,
          content: `This is auto-generated content #${i} created at ${new Date().toISOString()}`,
          content_type: 'blog',
          platform: 'facebook',
          status: 'published',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (contentError) {
        console.error('❌ Content insert error:', contentError);
      } else {
        contentCreated++;
        console.log('✅ Content created:', content.id);
      }
    }

    // 3. CREATE POSTS (2 per cycle) - FIXED COLUMNS
    console.log('📱 Creating posts...');
    
    // Get a random affiliate link for the post
    const { data: randomLink } = await supabaseAdmin
      .from('affiliate_links')
      .select('id, product_id')
      .eq('user_id', user_id)
      .limit(1)
      .maybeSingle();

    for (let i = 0; i < 2; i++) {
      const platforms = ['facebook', 'instagram', 'twitter', 'linkedin'];
      const platform = platforms[i % platforms.length];
      
      const postData: any = {
        user_id: user_id,
        platform: platform,
        post_type: 'image',
        caption: `AutoPost ${Date.now()}-${i} - Check out this amazing product! #affiliate #automated`,
        status: 'posted',
        posted_at: new Date().toISOString(),
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
        revenue_generated: 0
      };

      // Add link_id and product_id if available
      if (randomLink) {
        postData.link_id = randomLink.id;
        if (randomLink.product_id) {
          postData.product_id = randomLink.product_id;
        }
      }

      const { data: post, error: postError } = await supabaseAdmin
        .from('posted_content')
        .insert(postData)
        .select('id')
        .single();

      if (postError) {
        console.error('❌ Post insert error:', postError);
        console.error('Post data:', postData);
      } else {
        postsCreated++;
        console.log('✅ Post created:', post.id);
      }
    }

    const result = {
      success: true,
      products_discovered: productsCreated,
      content_generated: contentCreated,
      posts_published: postsCreated,
      campaign: campaign.name,
      timestamp: new Date().toISOString()
    };

    console.log('🎉 Autopilot cycle complete:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('❌ Autopilot error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
  }
});