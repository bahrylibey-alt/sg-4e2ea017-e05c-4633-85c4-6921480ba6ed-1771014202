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
      real_links_used: 0,
      content_generated: 0,
      posts_published: 0,
      posts_scored: 0,
      decisions_applied: 0,
      webhooks_sent: 0,
      errors: [] as string[]
    };

    // ====================================================
    // 0. GET ZAPIER WEBHOOK URL
    // ====================================================
    let zapierWebhookUrl: string | null = null;
    try {
      const { data: integration } = await supabase
        .from('integrations')
        .select('config')
        .eq('user_id', userId)
        .eq('provider', 'zapier')
        .eq('status', 'connected')
        .maybeSingle();

      if (integration?.config && typeof integration.config === 'object' && 'webhook_url' in integration.config) {
        zapierWebhookUrl = (integration.config as any).webhook_url;
        console.log('✅ Zapier webhook URL found:', zapierWebhookUrl);
      }
    } catch (error: any) {
      console.log('⚠️ No Zapier integration found:', error.message);
    }

    // ====================================================
    // 1. GET REAL AFFILIATE LINKS (Temu + Amazon)
    // ====================================================
    let realLinks: any[] = [];
    try {
      const { data: links, error: linksError } = await supabase
        .from('affiliate_links')
        .select('id, slug, product_name, original_url, network, cloaked_url')
        .eq('user_id', userId)
        .eq('status', 'active')
        .in('network', ['temu', 'amazon'])
        .not('original_url', 'like', '%AUTO%')
        .limit(50);

      if (linksError) throw linksError;

      if (links && links.length > 0) {
        realLinks = links;
        results.real_links_used = realLinks.length;
        console.log(`✅ Found ${realLinks.length} real affiliate links to use`);
      } else {
        console.log('⚠️ No real affiliate links found - autopilot will skip posting');
        results.errors.push('No real affiliate links found');
      }
    } catch (error: any) {
      results.errors.push(`Links fetch: ${error.message}`);
    }

    // ====================================================
    // 2. ENSURE CAMPAIGN EXISTS (auto-create if needed)
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
    // 3. SCORE EXISTING POSTS
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
          performanceScore += Math.min(ctr * 10, 40);
          performanceScore += Math.min(conversionRate * 20, 40);
          performanceScore += Math.min(revenuePerClick * 2, 20);

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
    // 5. PUBLISH POSTS USING REAL LINKS + SEND TO ZAPIER
    // ====================================================
    if (realLinks.length > 0) {
      try {
        const platforms = ['facebook', 'instagram', 'twitter', 'linkedin'];
        
        for (let i = 0; i < 2; i++) {
          const randomLink = realLinks[Math.floor(Math.random() * realLinks.length)];
          const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
          
          // Create engaging caption based on product
          const caption = `🔥 Check out this amazing ${randomLink.product_name}! Limited time offer! #${randomLink.network} #affiliate #deals`;

          const { data: newPost, error: postError } = await supabase
            .from('posted_content')
            .insert({
              user_id: userId,
              link_id: randomLink.id,
              platform: randomPlatform,
              post_type: 'image',
              caption: caption,
              status: 'posted',
              posted_at: new Date().toISOString(),
              impressions: 100,
              clicks: 0,
              conversions: 0,
              revenue: 0,
              autopilot_state: 'testing',
              performance_score: 0,
              priority_score: 50
            })
            .select()
            .single();

          if (!postError && newPost) {
            results.posts_published++;

            // SEND WEBHOOK TO ZAPIER
            if (zapierWebhookUrl && zapierWebhookUrl.includes('hooks.zapier.com')) {
              try {
                const webhookData = {
                  event: 'post.created',
                  data: {
                    id: newPost.id,
                    platform: randomPlatform,
                    caption: caption,
                    link_url: randomLink.original_url,
                    product_name: randomLink.product_name,
                    network: randomLink.network,
                    created_at: new Date().toISOString()
                  },
                  timestamp: new Date().toISOString()
                };

                const webhookResponse = await fetch(zapierWebhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(webhookData)
                });

                if (webhookResponse.ok) {
                  results.webhooks_sent++;
                  console.log('✅ Webhook sent to Zapier for post:', newPost.id);
                } else {
                  console.error('❌ Webhook failed:', webhookResponse.status);
                }
              } catch (webhookError: any) {
                console.error('❌ Webhook error:', webhookError.message);
              }
            }
          }
        }
      } catch (error: any) {
        results.errors.push(`Posts: ${error.message}`);
      }
    } else {
      results.errors.push('No real affiliate links available - skipping post creation');
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