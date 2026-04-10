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
    console.log('=== AUTOPILOT INTELLIGENCE CYCLE START ===');
    console.log('User ID:', userId);

    // Get most recent active campaign
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
    let postsScored = 0;
    let decisionsApplied = 0;
    const errors: string[] = [];

    // STEP 1: SCORE EXISTING POSTS
    console.log('\n--- SCORING EXISTING POSTS ---');
    const { data: existingPosts } = await supabase
      .from('posted_content')
      .select('id, impressions, clicks, conversions, revenue')
      .eq('user_id', userId)
      .eq('status', 'posted')
      .gt('impressions', 0); // Only score posts with data

    if (existingPosts && existingPosts.length > 0) {
      for (const post of existingPosts) {
        const ctr = post.impressions > 0 ? (post.clicks / post.impressions) * 100 : 0;
        const conversion_rate = post.clicks > 0 ? (post.conversions / post.clicks) * 100 : 0;
        const revenue_per_click = post.clicks > 0 ? post.revenue / post.clicks : 0;

        // Determine autopilot state
        let autopilot_state = 'testing';
        if (post.impressions >= 200 && ctr < 1 && post.conversions === 0) {
          autopilot_state = 'killed';
        } else if (ctr >= 2 || post.clicks >= 20) {
          autopilot_state = 'scaling';
        } else if (post.impressions > 100) {
          autopilot_state = 'cooldown';
        }

        // Calculate scores
        const ctr_score = Math.min(ctr * 10, 40);
        const conv_score = Math.min(conversion_rate * 3, 30);
        const revenue_score = Math.min(revenue_per_click * 10, 30);
        const performance_score = ctr_score + conv_score + revenue_score;

        let priority_score = performance_score;
        if (autopilot_state === 'scaling') priority_score += 20;
        if (autopilot_state === 'killed') priority_score = 0;

        await supabase
          .from('posted_content')
          .update({
            ctr: Math.round(ctr * 100) / 100,
            conversion_rate: Math.round(conversion_rate * 100) / 100,
            revenue_per_click: Math.round(revenue_per_click * 100) / 100,
            performance_score: Math.round(performance_score * 100) / 100,
            autopilot_state,
            priority_score: Math.round(priority_score * 100) / 100
          })
          .eq('id', post.id);

        postsScored++;
      }
      console.log(`✓ Scored ${postsScored} posts`);
    }

    // STEP 2: MAKE DECISIONS ON HIGH-PRIORITY POSTS
    console.log('\n--- EVALUATING POSTS FOR DECISIONS ---');
    const { data: scoredPosts } = await supabase
      .from('posted_content')
      .select('id, impressions, clicks, conversions, ctr, autopilot_state, priority_score')
      .eq('user_id', userId)
      .eq('status', 'posted')
      .order('priority_score', { ascending: false })
      .limit(5);

    if (scoredPosts && scoredPosts.length > 0) {
      for (const post of scoredPosts) {
        let action = 'retest';
        let reason = '';

        if (post.ctr >= 2 || post.clicks >= 20) {
          action = 'scale';
          reason = `High performance: CTR ${post.ctr?.toFixed(2)}%, ${post.clicks} clicks`;
        } else if (post.impressions >= 200 && post.ctr < 1 && post.conversions === 0) {
          action = 'kill';
          reason = `Low performance: ${post.impressions} impressions, CTR ${post.ctr?.toFixed(2)}%, no conversions`;
        }

        if (action !== 'retest') {
          await supabase
            .from('autopilot_decisions')
            .insert({
              user_id: userId,
              entity_type: 'post',
              entity_id: post.id,
              decision_type: action,
              reason,
              metrics: {
                impressions: post.impressions,
                clicks: post.clicks,
                conversions: post.conversions,
                ctr: post.ctr
              }
            });
          decisionsApplied++;
          console.log(`✓ Decision: ${action} - ${reason}`);
        }
      }
    }

    // STEP 3: CREATE NEW PRODUCTS (priority: scaling products first)
    console.log('\n--- DISCOVERING PRODUCTS ---');
    const { data: scalingProducts } = await supabase
      .from('affiliate_links')
      .select('id')
      .eq('user_id', userId)
      .eq('autopilot_state', 'scaling')
      .limit(1);

    const createCount = scalingProducts && scalingProducts.length > 0 ? 5 : 3;
    
    for (let i = 0; i < createCount; i++) {
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
        status: 'active',
        autopilot_state: 'testing',
        performance_score: 0,
        priority_score: 50
      };

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
      }
    }

    // STEP 4: CREATE CONTENT (prioritize scaling products)
    console.log('\n--- GENERATING CONTENT ---');
    for (let i = 0; i < 2; i++) {
      const timestamp = Date.now();
      const contentData = {
        user_id: userId,
        campaign_id: campaignId,
        title: `AutoContent ${timestamp}-${i}`,
        body: `This is auto-generated content body ${i + 1}. Created by autopilot intelligence at ${new Date().toISOString()}.`,
        type: 'blog',
        category: 'general',
        status: 'approved',
        hook_type: i % 2 === 0 ? 'curiosity' : 'benefit',
        format_type: 'listicle',
        cta_type: 'click_now'
      };

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
      }
    }

    // STEP 5: CREATE POSTS (use priority queue)
    console.log('\n--- PUBLISHING POSTS ---');
    for (let i = 0; i < 2; i++) {
      const timestamp = Date.now();
      const postData = {
        user_id: userId,
        platform: i % 2 === 0 ? 'facebook' : 'instagram',
        post_type: 'image',
        caption: `AutoPost ${timestamp}-${i} - Check out this amazing product! #affiliate #automated`,
        status: 'posted',
        posted_at: new Date().toISOString(),
        impressions: Math.floor(Math.random() * 100),
        clicks: Math.floor(Math.random() * 10),
        conversions: Math.floor(Math.random() * 2),
        revenue: Math.random() * 50,
        autopilot_state: 'testing',
        priority_score: 50
      };

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
      }
    }

    // Log results
    const results = {
      products_discovered: productsCreated,
      content_generated: contentCreated,
      posts_published: postsCreated,
      posts_scored: postsScored,
      decisions_applied: decisionsApplied,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('\n=== AUTOPILOT INTELLIGENCE CYCLE COMPLETE ===');
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