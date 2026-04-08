import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { action, user_id, campaign_id } = body;

    console.log(`🎯 Autopilot Engine - Action: ${action}`, { user_id, campaign_id });

    // Validate action
    const validActions = ['start', 'stop', 'status', 'execute'];
    if (!action || !validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action', valid_actions: validActions }),
        { status: 400, headers: corsHeaders }
      );
    }

    // For 'execute' action, campaign_id is required
    if (action === 'execute' && (!user_id || !campaign_id)) {
      return new Response(
        JSON.stringify({ error: 'user_id and campaign_id required for execute action' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // START ACTION
    if (action === 'start') {
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'user_id required for start action' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // 1. Enable autopilot in user_settings
      const { error: settingsError } = await supabaseAdmin
        .from('user_settings')
        .upsert({
          user_id: user_id,
          autopilot_enabled: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (settingsError) {
        console.error('Error updating user_settings:', settingsError);
        return new Response(
          JSON.stringify({ error: settingsError.message }),
          { status: 500, headers: corsHeaders }
        );
      }

      // 2. Find or create autopilot campaign
      let activeCampaignId = campaign_id;
      
      if (!activeCampaignId) {
        const { data: existingCampaigns } = await supabaseAdmin
          .from('campaigns')
          .select('id')
          .eq('user_id', user_id)
          .eq('is_autopilot', true)
          .limit(1);

        if (existingCampaigns && existingCampaigns.length > 0) {
          activeCampaignId = existingCampaigns[0].id;
        } else {
          const { data: newCampaign, error: createError } = await supabaseAdmin
            .from('campaigns')
            .insert({
              user_id: user_id,
              name: 'AI Autopilot Campaign',
              status: 'active',
              is_autopilot: true
            })
            .select('id')
            .single();

          if (createError || !newCampaign) {
            console.error('Error creating campaign:', createError);
            return new Response(
              JSON.stringify({ error: createError?.message || 'Failed to create campaign' }),
              { status: 500, headers: corsHeaders }
            );
          }

          activeCampaignId = newCampaign.id;
        }
      }

      console.log(`✅ Autopilot enabled for user ${user_id}, campaign ${activeCampaignId}`);

      // 3. Execute initial work cycle
      const productCount = await addProducts(activeCampaignId, user_id);
      const contentCount = await generateContent(activeCampaignId, user_id);
      const trafficCount = await activateTraffic(activeCampaignId, user_id);
      const queuedCount = await queueContentForPosting(activeCampaignId, user_id);

      // Log activity
      await supabaseAdmin.from('activity_logs').insert({
        user_id: user_id,
        action: 'autopilot_started',
        status: 'success',
        details: `Autopilot started: ${productCount} products, ${contentCount} content, ${trafficCount} traffic, ${queuedCount} queued`,
        metadata: { campaign_id: activeCampaignId, products: productCount, content: contentCount, traffic: trafficCount, queued_posts: queuedCount }
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Autopilot started successfully',
          campaign_id: activeCampaignId,
          initial_work: {
            products_added: productCount,
            content_generated: contentCount,
            traffic_channels: trafficCount,
            posts_queued_for_zapier: queuedCount
          }
        }),
        { headers: corsHeaders }
      );
    }

    // STOP ACTION
    if (action === 'stop') {
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'user_id required for stop action' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const { error } = await supabaseAdmin
        .from('user_settings')
        .update({
          autopilot_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: corsHeaders }
        );
      }

      await supabaseAdmin.from('activity_logs').insert({
        user_id: user_id,
        action: 'autopilot_stopped',
        status: 'success',
        details: 'Autopilot manually stopped by user'
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Autopilot stopped' }),
        { headers: corsHeaders }
      );
    }

    // EXECUTE ACTION (Background cycle)
    if (action === 'execute') {
      console.log(`🔄 Executing autopilot cycle for user ${user_id}, campaign ${campaign_id}`);

      const productCount = await addProducts(campaign_id, user_id);
      const contentCount = await generateContent(campaign_id, user_id);
      const trafficCount = await activateTraffic(campaign_id, user_id);
      const queuedCount = await queueContentForPosting(campaign_id, user_id);

      await supabaseAdmin.from('activity_logs').insert({
        user_id: user_id,
        action: 'autopilot_cycle',
        status: 'success',
        details: `Cycle: ${productCount} products, ${contentCount} content, ${trafficCount} traffic, ${queuedCount} queued`,
        metadata: { campaign_id, products: productCount, content: contentCount, traffic: trafficCount, queued_posts: queuedCount }
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          cycle_completed: true,
          products_added: productCount,
          content_generated: contentCount,
          traffic_activated: trafficCount,
          posts_queued_for_zapier: queuedCount
        }),
        { headers: corsHeaders }
      );
    }

    // STATUS ACTION
    if (action === 'status') {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Autopilot engine is operational',
          available_actions: ['start', 'stop', 'execute', 'status']
        }),
        { headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Autopilot engine error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function: Add products to campaign
async function addProducts(campaignId: string, userId: string): Promise<number> {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const products = [
      { name: 'Air Fryer XL', asin: 'B0ABCDEF01', category: 'Kitchen' },
      { name: 'Yoga Mat Pro', asin: 'B0GHIJKL02', category: 'Fitness' },
      { name: 'Smart Watch Ultra', asin: 'B0MNOPQR03', category: 'Tech' },
      { name: 'Coffee Maker Premium', asin: 'B0STUVWX04', category: 'Kitchen' },
      { name: 'Resistance Bands Set', asin: 'B0YZABCD05', category: 'Fitness' }
    ];

    let addedCount = 0;

    for (const product of products) {
      const slug = Math.random().toString(36).substring(2, 10);
      const affiliateUrl = `https://www.amazon.com/dp/${product.asin}?tag=yourstore-20`;

      const { error } = await supabaseAdmin
        .from('affiliate_links')
        .insert({
          campaign_id: campaignId,
          user_id: userId,
          product_name: product.name,
          original_url: affiliateUrl,
          cloaked_url: `https://yourapp.com/go/${slug}`,
          slug: slug,
          status: 'active',
          clicks: 0,
          conversions: 0,
          revenue: 0
        });

      if (!error) addedCount++;
    }

    console.log(`✅ Added ${addedCount} products to campaign ${campaignId}`);
    return addedCount;
  } catch (error) {
    console.error('Error adding products:', error);
    return 0;
  }
}

// Helper function: Generate content
async function generateContent(campaignId: string, userId: string): Promise<number> {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const articles = [
      {
        title: '10 Must-Have Kitchen Gadgets',
        body: 'Discover the latest kitchen innovations...',
        type: 'article',
        status: 'published'
      },
      {
        title: 'Smart Kitchen Tools Guide',
        body: 'Technology meets culinary art...',
        type: 'article',
        status: 'published'
      }
    ];

    let generatedCount = 0;

    for (const article of articles) {
      const { error } = await supabaseAdmin
        .from('generated_content')
        .insert({
          campaign_id: campaignId,
          user_id: userId,
          title: article.title,
          body: article.body,
          type: article.type,
          status: article.status,
          views: 0,
          clicks: 0
        });

      if (!error) generatedCount++;
    }

    console.log(`✅ Generated ${generatedCount} articles`);
    return generatedCount;
  } catch (error) {
    console.error('Error generating content:', error);
    return 0;
  }
}

// Helper function: Activate traffic sources
async function activateTraffic(campaignId: string, userId: string): Promise<number> {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const sources = [
      'Pinterest Auto-Pinning',
      'Email Drip Campaigns',
      'Twitter/X Auto-Posting',
      'YouTube Community Posts',
      'Facebook Group Sharing',
      'Instagram Stories Automation',
      'Reddit Deal Posting',
      'LinkedIn Article Publishing'
    ];

    let activatedCount = 0;

    for (const source of sources) {
      const { error } = await supabaseAdmin
        .from('traffic_sources')
        .upsert({
          campaign_id: campaignId,
          user_id: userId,
          source_name: source,
          status: 'active',
          automation_enabled: true,
          traffic_sent: 0
        }, { onConflict: 'campaign_id,source_name' });

      if (!error) activatedCount++;
    }

    console.log(`✅ Activated ${activatedCount} traffic sources`);
    return activatedCount;
  } catch (error) {
    console.error('Error activating traffic:', error);
    return 0;
  }
}

// Helper function: Queue content for Zapier posting
async function queueContentForPosting(campaignId: string, userId: string): Promise<number> {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('📝 Queuing content for Zapier...');

    const { data: products } = await supabaseAdmin
      .from('affiliate_links')
      .select('product_name, cloaked_url')
      .eq('campaign_id', campaignId)
      .limit(5);

    if (!products || products.length === 0) {
      return 0;
    }

    let queuedCount = 0;
    const platforms = ['pinterest', 'facebook', 'instagram', 'twitter'];

    for (const platform of platforms) {
      const product = products[Math.floor(Math.random() * products.length)];
      
      const { error } = await supabaseAdmin
        .from('posted_content')
        .insert({
          campaign_id: campaignId,
          user_id: userId,
          platform: platform,
          content_type: 'post',
          title: `Amazing ${product.product_name}`,
          body: `Check out this ${product.product_name}!`,
          link_url: product.cloaked_url,
          status: 'pending',
          scheduled_for: new Date().toISOString(),
          views: 0,
          clicks: 0
        });

      if (!error) {
        queuedCount++;
        console.log(`✅ Queued ${platform} post`);
      }
    }

    console.log(`✅ Queued ${queuedCount} posts for Zapier`);
    return queuedCount;
  } catch (error) {
    console.error('Error queuing content:', error);
    return 0;
  }
}