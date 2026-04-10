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
    const { user_id } = await req.json();
    console.log('🤖 Autopilot Engine Starting', { user_id, timestamp: new Date().toISOString() });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get active campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, name')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .maybeSingle();

    if (campaignError) {
      console.error('❌ Campaign fetch error:', campaignError);
      throw campaignError;
    }

    if (!campaign) {
      console.log('⏸️ No active campaign found');
      return new Response(
        JSON.stringify({ success: true, products_discovered: 0, content_generated: 0, posts_published: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    console.log('✅ Active campaign found:', campaign.name);

    let productsCreated = 0;
    let contentCreated = 0;
    let postsCreated = 0;

    // CREATE 3 PRODUCTS
    console.log('📦 Creating products...');
    for (let i = 0; i < 3; i++) {
      try {
        const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const productName = `Auto Product ${uniqueId}-${i}`;
        const slug = `prod-${uniqueId.toLowerCase()}-${i}`;
        
        const { data, error } = await supabaseAdmin
          .from('affiliate_links')
          .insert({
            user_id: user_id,
            campaign_id: campaign.id,
            product_name: productName,
            slug: slug,
            original_url: `https://amazon.com/dp/${uniqueId}${i}`,
            category: 'Auto-Generated',
            platform: 'amazon',
            status: 'active',
            clicks: 0,
            conversions: 0,
            revenue: 0,
            commission_rate: 10,
            is_promoted: true
          })
          .select('id')
          .single();

        if (error) {
          console.error(`❌ Product ${i} error:`, error.message);
        } else {
          productsCreated++;
          console.log(`✅ Product ${i} created:`, productName, data.id);
        }
      } catch (error) {
        console.error(`❌ Product ${i} exception:`, error);
      }
    }

    // CREATE 2 CONTENT
    console.log('📝 Creating content...');
    const lastProducts = await supabaseAdmin
      .from('affiliate_links')
      .select('id, product_name')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (lastProducts.data && lastProducts.data.length > 0) {
      for (let i = 0; i < 2; i++) {
        try {
          const product = lastProducts.data[i % lastProducts.data.length];
          const contentTitle = `Review: ${product.product_name}`;
          
          const { data, error } = await supabaseAdmin
            .from('generated_content')
            .insert({
              user_id: user_id,
              link_id: product.id,
              title: contentTitle,
              content: `Auto-generated review for ${product.product_name}. Created at ${new Date().toISOString()}. This product offers great value and quality.`,
              content_type: 'blog',
              platform: 'facebook',
              status: 'published'
            })
            .select('id')
            .single();

          if (error) {
            console.error(`❌ Content ${i} error:`, error.message);
          } else {
            contentCreated++;
            console.log(`✅ Content ${i} created:`, contentTitle, data.id);
          }
        } catch (error) {
          console.error(`❌ Content ${i} exception:`, error);
        }
      }
    }

    // CREATE 2 POSTS
    console.log('📱 Creating posts...');
    const platforms = ['facebook', 'instagram', 'twitter', 'linkedin'];
    const lastLinks = await supabaseAdmin
      .from('affiliate_links')
      .select('id, product_name')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(2);

    if (lastLinks.data && lastLinks.data.length > 0) {
      for (let i = 0; i < 2; i++) {
        try {
          const timestamp = Date.now();
          const platform = platforms[i % platforms.length];
          const link = lastLinks.data[i % lastLinks.data.length];
          
          const { data, error } = await supabaseAdmin
            .from('posted_content')
            .insert({
              user_id: user_id,
              link_id: link.id,
              platform: platform,
              post_type: 'image',
              caption: `AutoPost ${timestamp}-${i} - Check out this amazing product! #affiliate #automated`,
              status: 'posted',
              posted_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (error) {
            console.error(`❌ Post ${i} error:`, error.message);
          } else {
            postsCreated++;
            console.log(`✅ Post ${i} created on ${platform}:`, data.id);
          }
        } catch (error) {
          console.error(`❌ Post ${i} exception:`, error);
        }
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

    console.log('🎉 Autopilot Cycle Complete:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('❌ Autopilot Engine Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});