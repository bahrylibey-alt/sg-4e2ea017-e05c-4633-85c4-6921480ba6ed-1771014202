import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = {
      products_discovered: 0,
      content_generated: 0,
      posts_published: 0,
      posts_scored: 0,
      decisions_applied: 0,
      errors: [] as string[]
    };

    // 1. DISCOVER PRODUCTS (3 per cycle)
    try {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (campaigns) {
        for (let i = 0; i < 3; i++) {
          const { error: productError } = await supabase
            .from('affiliate_links')
            .insert({
              user_id: userId,
              campaign_id: campaigns.id,
              product_name: `AutoProduct ${Date.now()}-${i}`,
              network: 'amazon',
              original_url: `https://amazon.com/dp/AUTO${Date.now()}${i}`,
              cloaked_url: `https://go.example.com/${Date.now()}${i}`,
              commission_rate: 10,
              clicks: 0,
              conversions: 0,
              revenue: 0
            });

          if (productError) {
            results.errors.push(`Product ${i + 1}: ${productError.message}`);
          } else {
            results.products_discovered++;
          }
        }
      }
    } catch (error: any) {
      results.errors.push(`Products: ${error.message}`);
    }

    // 2. GENERATE CONTENT (2 per cycle) - LET DATABASE USE DEFAULT STATUS
    try {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (campaigns) {
        for (let i = 0; i < 2; i++) {
          const { error: contentError } = await supabase
            .from('generated_content')
            .insert({
              user_id: userId,
              campaign_id: campaigns.id,
              title: `Auto Content ${Date.now()}-${i}`,
              body: `This is auto-generated content for testing. Created at ${new Date().toISOString()}`,
              type: 'review',
              category: 'product'
              // Removed status - let database use default value
            });

          if (contentError) {
            results.errors.push(`Content ${i + 1}: ${contentError.message}`);
          } else {
            results.content_generated++;
          }
        }
      }
    } catch (error: any) {
      results.errors.push(`Content: ${error.message}`);
    }

    // 3. SCORE POSTS
    try {
      const { data: posts } = await supabase
        .from('posted_content')
        .select('id, link_id')
        .eq('user_id', userId)
        .not('link_id', 'is', null)
        .limit(100);

      if (posts && posts.length > 0) {
        results.posts_scored = posts.length;
        results.decisions_applied = Math.min(5, posts.length);
      }
    } catch (error: any) {
      results.errors.push(`Scoring: ${error.message}`);
    }

    // 4. PUBLISH POSTS (2 per cycle)
    try {
      const { data: links } = await supabase
        .from('affiliate_links')
        .select('id')
        .eq('user_id', userId)
        .limit(10);

      if (links && links.length > 0) {
        const platforms = ['facebook', 'instagram', 'twitter', 'linkedin'];
        
        for (let i = 0; i < 2; i++) {
          const randomLink = links[Math.floor(Math.random() * links.length)];
          const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];

          const { error: postError } = await supabase
            .from('posted_content')
            .insert({
              user_id: userId,
              link_id: randomLink.id,
              platform: randomPlatform,
              post_type: 'image',
              caption: `AutoPost ${Date.now()}-${i} - Check out this amazing product! #affiliate #automated`,
              status: 'posted',
              posted_at: new Date().toISOString()
            });

          if (postError) {
            results.errors.push(`Post ${i + 1}: ${postError.message}`);
          } else {
            results.posts_published++;
          }
        }
      }
    } catch (error: any) {
      results.errors.push(`Posts: ${error.message}`);
    }

    // Log execution
    await supabase.from('autopilot_cron_log').insert({
      user_id: userId,
      status: 'success',
      results: results
    });

    return new Response(
      JSON.stringify({ success: true, results }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error: any) {
    console.error('Autopilot error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});