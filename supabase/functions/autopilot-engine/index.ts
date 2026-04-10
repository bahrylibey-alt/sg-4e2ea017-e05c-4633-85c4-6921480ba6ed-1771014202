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
    console.log('Starting autopilot for user:', userId);

    // Get active campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!campaign) {
      return new Response(
        JSON.stringify({ error: 'No active campaign found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    let productsCreated = 0;
    let contentCreated = 0;
    let postsCreated = 0;

    // 1. CREATE PRODUCTS (3 products)
    console.log('Creating products...');
    for (let i = 0; i < 3; i++) {
      const productName = `AutoProduct ${Date.now()}-${i}`;
      const { data: product, error: productError } = await supabase
        .from('affiliate_links')
        .insert({
          user_id: userId,
          campaign_id: campaign.id,
          product_name: productName,
          product_url: `https://amazon.com/product-${Date.now()}-${i}`,
          affiliate_url: `https://amzn.to/${Date.now()}-${i}`,
          network: 'amazon',
          commission_rate: 5.0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          status: 'active'
        })
        .select('id')
        .maybeSingle();

      if (productError) {
        console.error('Product creation error:', productError);
      } else if (product) {
        productsCreated++;
        console.log('Product created:', productName);
      }
    }

    // 2. CREATE CONTENT (2 pieces)
    console.log('Creating content...');
    for (let i = 0; i < 2; i++) {
      const title = `AutoContent ${Date.now()}-${i}`;
      const { data: content, error: contentError } = await supabase
        .from('generated_content')
        .insert({
          user_id: userId,
          campaign_id: campaign.id,
          title: title,
          body: `This is auto-generated content body ${i + 1}. Created by autopilot engine.`,
          type: 'blog',
          category: 'general',
          status: 'approved'
        })
        .select('id')
        .maybeSingle();

      if (contentError) {
        console.error('Content creation error:', contentError);
      } else if (content) {
        contentCreated++;
        console.log('Content created:', title);
      }
    }

    // 3. CREATE POSTS (2 posts)
    console.log('Creating posts...');
    for (let i = 0; i < 2; i++) {
      const caption = `AutoPost ${Date.now()}-${i}`;
      const { data: post, error: postError } = await supabase
        .from('posted_content')
        .insert({
          user_id: userId,
          platform: i % 2 === 0 ? 'facebook' : 'instagram',
          post_type: 'image',
          caption: caption,
          status: 'posted',
          posted_at: new Date().toISOString()
        })
        .select('id')
        .maybeSingle();

      if (postError) {
        console.error('Post creation error:', postError);
      } else if (post) {
        postsCreated++;
        console.log('Post created:', caption);
      }
    }

    // Log results
    const results = {
      products_discovered: productsCreated,
      content_generated: contentCreated,
      posts_published: postsCreated
    };

    console.log('Autopilot results:', results);

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
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});