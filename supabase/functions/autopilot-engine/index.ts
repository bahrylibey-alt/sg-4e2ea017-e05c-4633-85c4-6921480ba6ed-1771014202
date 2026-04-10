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
    console.log('🤖 Autopilot starting...', { action, user_id });

    // Create admin client with SERVICE ROLE
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

    if (campaignError || !campaign) {
      console.log('⏸️ No active campaign');
      return new Response(
        JSON.stringify({ success: true, products_discovered: 0, content_generated: 0, posts_published: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    let productsCreated = 0;
    let contentCreated = 0;
    let postsCreated = 0;

    // 1. CREATE PRODUCTS (3 per cycle)
    console.log('📦 Creating products...');
    for (let i = 0; i < 3; i++) {
      try {
        const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        const productName = `Auto Product ${randomId}-${i}`;
        const slug = `auto-${randomId.toLowerCase()}-${i}`;
        
        const { error: productError } = await supabaseAdmin
          .from('affiliate_links')
          .insert({
            user_id: user_id,
            campaign_id: campaign.id,
            product_name: productName,
            slug: slug,
            original_url: `https://amazon.com/dp/${randomId}`,
            short_url: `https://go.example.com/${slug}`,
            category: 'Auto-Generated',
            platform: 'amazon',
            status: 'active',
            clicks: 0,
            conversions: 0,
            revenue: 0,
            commission_rate: 10,
            is_promoted: true
          });

        if (productError) {
          console.error(`❌ Product ${i} error:`, productError.message);
        } else {
          productsCreated++;
          console.log(`✅ Product ${i} created: ${productName}`);
        }
      } catch (error) {
        console.error(`❌ Product ${i} exception:`, error);
      }
    }

    // 2. CREATE CONTENT (2 per cycle)
    console.log('📝 Creating content...');
    for (let i = 0; i < 2; i++) {
      try {
        const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        // Get a random product
        const { data: randomProduct } = await supabaseAdmin
          .from('affiliate_links')
          .select('id, product_id, product_name')
          .eq('user_id', user_id)
          .limit(1)
          .maybeSingle();

        const contentTitle = randomProduct 
          ? `Review: ${randomProduct.product_name}` 
          : `AutoContent ${randomId}-${i}`;

        const contentData: any = {
          user_id: user_id,
          title: contentTitle,
          content: `Auto-generated content #${i} created at ${new Date().toISOString()}. ${randomProduct ? `Featuring ${randomProduct.product_name}.` : ''}`,
          content_type: 'blog',
          platform: 'facebook',
          status: 'published'
        };

        if (randomProduct?.id) {
          contentData.link_id = randomProduct.id;
        }
        if (randomProduct?.product_id) {
          contentData.product_id = randomProduct.product_id;
        }

        const { error: contentError } = await supabaseAdmin
          .from('generated_content')
          .insert(contentData);

        if (contentError) {
          console.error(`❌ Content ${i} error:`, contentError.message);
        } else {
          contentCreated++;
          console.log(`✅ Content ${i} created: ${contentTitle}`);
        }
      } catch (error) {
        console.error(`❌ Content ${i} exception:`, error);
      }
    }

    // 3. CREATE POSTS (2 per cycle)
    console.log('📱 Creating posts...');
    for (let i = 0; i < 2; i++) {
      try {
        const timestamp = Date.now();
        const platforms = ['facebook', 'instagram', 'twitter', 'linkedin'];
        const platform = platforms[i % platforms.length];
        
        // Get a random link
        const { data: randomLink } = await supabaseAdmin
          .from('affiliate_links')
          .select('id, product_id')
          .eq('user_id', user_id)
          .limit(1)
          .maybeSingle();

        const postData: any = {
          user_id: user_id,
          platform: platform,
          post_type: 'image',
          caption: `AutoPost ${timestamp}-${i} - Check out this amazing product! #affiliate #automated`,
          status: 'posted',
          posted_at: new Date().toISOString()
        };

        if (randomLink?.id) {
          postData.link_id = randomLink.id;
        }
        if (randomLink?.product_id) {
          postData.product_id = randomLink.product_id;
        }

        const { error: postError } = await supabaseAdmin
          .from('posted_content')
          .insert(postData);

        if (postError) {
          console.error(`❌ Post ${i} error:`, postError.message);
        } else {
          postsCreated++;
          console.log(`✅ Post ${i} created on ${platform}`);
        }
      } catch (error) {
        console.error(`❌ Post ${i} exception:`, error);
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

    console.log('🎉 Cycle complete:', result);

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