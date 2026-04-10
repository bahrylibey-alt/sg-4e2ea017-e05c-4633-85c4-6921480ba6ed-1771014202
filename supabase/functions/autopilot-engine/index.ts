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
      .limit(1)
      .maybeSingle();

    if (campaignError) {
      console.error('❌ Campaign error:', campaignError);
      throw campaignError;
    }

    if (!campaign) {
      console.log('⏸️ No active campaign');
      return new Response(
        JSON.stringify({ success: true, products_discovered: 0, content_generated: 0, posts_published: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    console.log('✅ Campaign found:', campaign.name);

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
            network: 'amazon',
            status: 'active',
            clicks: 0,
            conversions: 0,
            revenue: 0,
            commission_rate: 10
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
    for (let i = 0; i < 2; i++) {
      try {
        const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const contentTitle = `Auto Content ${uniqueId}-${i}`;
        
        const { data, error } = await supabaseAdmin
          .from('generated_content')
          .insert({
            user_id: user_id,
            campaign_id: campaign.id,
            title: contentTitle,
            body: `Auto-generated content body. Created at ${new Date().toISOString()}. This is promotional content.`,
            description: `Auto content description ${i}`,
            type: 'blog',
            category: 'promotional',
            status: 'published',
            views: 0,
            clicks: 0
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

    // CREATE 2 POSTS
    console.log('📱 Creating posts...');
    const { data: lastLinks } = await supabaseAdmin
      .from('affiliate_links')
      .select('id, product_name')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(2);

    if (lastLinks && lastLinks.length > 0) {
      const platforms = ['facebook', 'instagram', 'twitter', 'linkedin'];
      
      for (let i = 0; i < 2; i++) {
        try {
          const timestamp = Date.now();
          const platform = platforms[i % platforms.length];
          const link = lastLinks[i % lastLinks.length];
          
          const { data, error } = await supabaseAdmin
            .from('posted_content')
            .insert({
              user_id: user_id,
              link_id: link.id,
              platform: platform,
              post_type: 'image',
              caption: `AutoPost ${timestamp}-${i} - Check out this amazing product! #affiliate #automated`,
              status: 'posted',
              posted_at: new Date().toISOString(),
              likes: 0,
              comments: 0,
              shares: 0,
              clicks: 0,
              revenue_generated: 0
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

    console.log('🎉 Autopilot Complete:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('❌ Autopilot Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});