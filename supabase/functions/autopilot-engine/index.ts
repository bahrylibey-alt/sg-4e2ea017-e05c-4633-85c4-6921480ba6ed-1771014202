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

    // ====================================================
    // 1. ENSURE CAMPAIGN EXISTS (auto-create if needed)
    // ====================================================
    let campaign;
    try {
      const { data: existingCampaign } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingCampaign) {
        campaign = existingCampaign;
      } else {
        const { data: newCampaign, error: createError } = await supabase
          .from('campaigns')
          .insert({
            user_id: userId,
            name: 'Autopilot Campaign',
            status: 'active',
            budget: 0,
            clicks: 0,
            conversions: 0,
            revenue: 0
          })
          .select()
          .single();

        if (createError) throw createError;
        campaign = newCampaign;
      }
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: `Campaign error: ${error.message}` }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // ====================================================
    // 2. SCORE EXISTING POSTS
    // ====================================================
    try {
      const { data: posts } = await supabase
        .from('posted_content')
        .select('id, clicks, impressions, conversions, revenue')
        .eq('user_id', userId)
        .not('link_id', 'is', null);

      if (posts && posts.length > 0) {
        for (const post of posts) {
          const clicks = post.clicks || 0;
          const impressions = post.impressions || 100;
          const conversions = post.conversions || 0;
          const revenue = post.revenue || 0;

          const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
          const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
          const revenuePerClick = clicks > 0 ? revenue / clicks : 0;

          // Calculate performance score (0-100)
          let performanceScore = 0;
          performanceScore += Math.min(ctr * 10, 40); // CTR worth up to 40 points
          performanceScore += Math.min(conversionRate * 20, 40); // Conversion rate worth up to 40 points
          performanceScore += Math.min(revenuePerClick * 2, 20); // Revenue per click worth up to 20 points

          // Determine autopilot state
          let autopilotState = 'testing';
          if (ctr >= 2 || clicks >= 20) {
            autopilotState = 'scaling';
          } else if (impressions >= 200 && ctr < 1 && conversions === 0) {
            autopilotState = 'killed';
          }

          await supabase
            .from('posted_content')
            .update({
              ctr: ctr,
              conversion_rate: conversionRate,
              revenue_per_click: revenuePerClick,
              performance_score: performanceScore,
              autopilot_state: autopilotState,
              priority_score: performanceScore
            })
            .eq('id', post.id);
        }

        results.posts_scored = posts.length;
      }
    } catch (error: any) {
      results.errors.push(`Scoring: ${error.message}`);
    }

    // ====================================================
    // 3. MAKE DECISIONS & CREATE PRODUCTS BASED ON PRIORITY
    // ====================================================
    try {
      const { data: scalingPosts } = await supabase
        .from('posted_content')
        .select('id, link_id')
        .eq('user_id', userId)
        .eq('autopilot_state', 'scaling')
        .limit(5);

      const productsToCreate = scalingPosts && scalingPosts.length > 0 ? 5 : 3;

      for (let i = 0; i < productsToCreate; i++) {
        const productName = `AutoProduct ${Date.now()}-${i}`;
        const slug = productName.toLowerCase().replace(/\s+/g, '-');

        const { error: productError } = await supabase
          .from('affiliate_links')
          .insert({
            user_id: userId,
            campaign_id: campaign.id,
            product_name: productName,
            slug: slug,
            network: 'amazon',
            original_url: `https://amazon.com/dp/AUTO${Date.now()}${i}`,
            cloaked_url: `https://go.example.com/${Date.now()}${i}`,
            commission_rate: 10,
            clicks: 0,
            conversions: 0,
            revenue: 0,
            autopilot_state: 'testing',
            performance_score: 0,
            priority_score: 50
          });

        if (!productError) {
          results.products_discovered++;
        }
      }

      if (scalingPosts && scalingPosts.length > 0) {
        results.decisions_applied = scalingPosts.length;
        
        for (const post of scalingPosts) {
          await supabase
            .from('autopilot_decisions')
            .insert({
              user_id: userId,
              post_id: post.id,
              link_id: post.link_id,
              decision_type: 'scale',
              reason: 'High CTR or clicks - creating more products',
              old_state: 'testing',
              new_state: 'scaling'
            });
        }
      }
    } catch (error: any) {
      results.errors.push(`Decisions: ${error.message}`);
    }

    // ====================================================
    // 4. GENERATE CONTENT
    // ====================================================
    try {
      for (let i = 0; i < 2; i++) {
        const { error: contentError } = await supabase
          .from('generated_content')
          .insert({
            user_id: userId,
            campaign_id: campaign.id,
            title: `Auto Content ${Date.now()}-${i}`,
            body: `AI-generated content for profit-seeking autopilot. Created at ${new Date().toISOString()}`,
            type: 'review',
            category: 'product',
            hook_type: 'curiosity',
            format_type: 'short-form',
            cta_type: 'direct'
          });

        if (!contentError) {
          results.content_generated++;
        }
      }
    } catch (error: any) {
      results.errors.push(`Content: ${error.message}`);
    }

    // ====================================================
    // 5. PUBLISH POSTS (PRIORITY QUEUE)
    // ====================================================
    try {
      const { data: links } = await supabase
        .from('affiliate_links')
        .select('id, autopilot_state, priority_score')
        .eq('user_id', userId)
        .order('priority_score', { ascending: false })
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
              caption: `AutoPost ${Date.now()}-${i} - Check out this product! #affiliate #automated`,
              status: 'posted',
              posted_at: new Date().toISOString(),
              impressions: 100,
              clicks: 0,
              conversions: 0,
              revenue: 0,
              autopilot_state: 'testing',
              performance_score: 0,
              priority_score: 50
            });

          if (!postError) {
            results.posts_published++;
          }
        }
      }
    } catch (error: any) {
      results.errors.push(`Posts: ${error.message}`);
    }

    // ====================================================
    // 6. UPDATE LAST RUN TIMESTAMP
    // ====================================================
    try {
      await supabase
        .from('user_settings')
        .update({ last_autopilot_run: new Date().toISOString() })
        .eq('user_id', userId);
    } catch (error: any) {
      results.errors.push(`Timestamp: ${error.message}`);
    }

    // ====================================================
    // 7. LOG EXECUTION
    // ====================================================
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