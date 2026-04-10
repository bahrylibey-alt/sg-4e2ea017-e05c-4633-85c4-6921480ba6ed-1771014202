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
    try {
      for (let i = 0; i < 3; i++) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        const productName = `Auto Product ${randomId}-${i}`;
        const slug = `${randomId.toLowerCase()}-${i}`;
        
        const { data: product, error: productError } = await supabaseAdmin
          .from('affiliate_links')
          .insert({
            user_id: user_id,
            campaign_id: campaign.id,
            product_name: productName,
            slug: slug,
            original_url: `https://example.com/product/${slug}`,
            short_url: `https://go.example.com/${slug}`,
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
          .select('id, product_name')
          .single();

        if (productError) {
          console.error(`❌ Product ${i} insert error:`, productError);
        } else {
          productsCreated++;
          console.log(`✅ Product ${i} created:`, product.product_name);
        }
      }
    } catch (error) {
      console.error('❌ Products creation failed:', error);
    }

    // 2. CREATE CONTENT (2 per cycle)
    console.log('📝 Creating content...');
    try {
      for (let i = 0; i < 2; i++) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        // Get a random product for the content
        const { data: randomProduct } = await supabaseAdmin
          .from('affiliate_links')
          .select('id, product_id, product_name')
          .eq('user_id', user_id)
          .limit(1)
          .maybeSingle();

        const contentData: any = {
          user_id: user_id,
          title: randomProduct ? `Review: ${randomProduct.product_name}` : `AutoContent ${randomId}-${i}`,
          content: `This is auto-generated content #${i} created at ${new Date().toISOString()}. ${randomProduct ? `Featuring ${randomProduct.product_name}.` : ''}`,
          content_type: 'blog',
          platform: 'facebook',
          status: 'published',
          created_at: new Date().toISOString()
        };

        // Add link_id if available
        if (randomProduct) {
          contentData.link_id = randomProduct.id;
          if (randomProduct.product_id) {
            contentData.product_id = randomProduct.product_id;
          }
        }

        const { data: content, error: contentError } = await supabaseAdmin
          .from('generated_content')
          .insert(contentData)
          .select('id, title')
          .single();

        if (contentError) {
          console.error(`❌ Content ${i} insert error:`, contentError);
        } else {
          contentCreated++;
          console.log(`✅ Content ${i} created:`, content.title);
        }
      }
    } catch (error) {
      console.error('❌ Content creation failed:', error);
    }

    // 3. CREATE POSTS (2 per cycle)
    console.log('📱 Creating posts...');
    try {
      // Get a random affiliate link for the post
      const { data: randomLink } = await supabaseAdmin
        .from('affiliate_links')
        .select('id, product_id')
        .eq('user_id', user_id)
        .limit(1)
        .maybeSingle();

      for (let i = 0; i < 2; i++) {
        const timestamp = Date.now();
        const platforms = ['facebook', 'instagram', 'twitter', 'linkedin'];
        const platform = platforms[i % platforms.length];
        
        const postData: any = {
          user_id: user_id,
          platform: platform,
          post_type: 'image',
          caption: `AutoPost ${timestamp}-${i} - Check out this amazing product! #affiliate #automated`,
          status: 'posted',
          posted_at: new Date().toISOString()
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
          .select('id, platform')
          .single();

        if (postError) {
          console.error(`❌ Post ${i} insert error:`, postError);
        } else {
          postsCreated++;
          console.log(`✅ Post ${i} created on ${platform}:`, post.id);
        }
      }
    } catch (error) {
      console.error('❌ Posts creation failed:', error);
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
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});