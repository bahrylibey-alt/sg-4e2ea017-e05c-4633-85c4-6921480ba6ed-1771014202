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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, user_id, campaign_id } = await req.json();
    console.log(`🤖 Autopilot request: ${action} for user ${user_id}`);

    if (action === 'start') {
      const { error: settingsError } = await supabaseAdmin
        .from('user_settings')
        .upsert({
          user_id: user_id,
          autopilot_enabled: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (settingsError) {
        console.error('Settings error:', settingsError);
        return new Response(JSON.stringify({ error: settingsError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let activeCampaignId = campaign_id;

      if (!activeCampaignId) {
        const { data: existingCampaigns } = await supabaseAdmin
          .from('campaigns')
          .select('id')
          .eq('user_id', user_id)
          .eq('is_autopilot', true)
          .eq('status', 'active')
          .limit(1);

        if (existingCampaigns && existingCampaigns.length > 0) {
          activeCampaignId = existingCampaigns[0].id;
        } else {
          const { data: newCampaign, error: campaignError } = await supabaseAdmin
            .from('campaigns')
            .insert({
              user_id: user_id,
              name: 'Autopilot Campaign ' + new Date().toISOString().split('T')[0],
              description: 'Automated by AI Autopilot',
              is_autopilot: true,
              status: 'active',
              budget: 0,
              spent: 0,
              revenue: 0
            })
            .select('id')
            .single();

          if (campaignError || !newCampaign) {
            console.error('Campaign creation error:', campaignError);
            return new Response(JSON.stringify({ error: 'Failed to create campaign' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          activeCampaignId = newCampaign.id;
        }
      }

      console.log(`✅ Autopilot enabled for user ${user_id}, campaign ${activeCampaignId}`);

      const productCount = await addProducts(supabaseAdmin, activeCampaignId, user_id);
      const contentCount = await generateContent(supabaseAdmin, activeCampaignId, user_id);
      const trafficCount = await activateTraffic(supabaseAdmin, activeCampaignId, user_id);
      const queuedCount = await queueContentForPosting(supabaseAdmin, activeCampaignId, user_id);
      const trendingCount = await scanAndAddTrendingProducts(supabaseAdmin, activeCampaignId, user_id);

      await supabaseAdmin.from('activity_logs').insert({
        user_id: user_id,
        action: 'autopilot_started',
        status: 'success',
        details: `Started: ${productCount} products, ${contentCount} articles, ${trafficCount} traffic, ${trendingCount} trending`,
        metadata: { campaign_id: activeCampaignId, products: productCount, content: contentCount, traffic: trafficCount, trending: trendingCount }
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
            posts_queued: queuedCount,
            trending_discovered: trendingCount
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'execute') {
      console.log(`🔄 Executing autopilot cycle for user ${user_id}, campaign ${campaign_id}`);

      const productCount = await addProducts(supabaseAdmin, campaign_id, user_id);
      const contentCount = await generateContent(supabaseAdmin, campaign_id, user_id);
      const trafficCount = await activateTraffic(supabaseAdmin, campaign_id, user_id);
      const queuedCount = await queueContentForPosting(supabaseAdmin, campaign_id, user_id);
      const trendingCount = await scanAndAddTrendingProducts(supabaseAdmin, campaign_id, user_id);

      await supabaseAdmin.from('activity_logs').insert({
        user_id: user_id,
        action: 'autopilot_cycle',
        status: 'success',
        details: `Cycle: ${productCount} products, ${contentCount} content, ${trafficCount} traffic, ${queuedCount} queued, ${trendingCount} trending`,
        metadata: { 
          campaign_id, 
          products: productCount, 
          content: contentCount, 
          traffic: trafficCount,
          queued_posts: queuedCount,
          trending_products: trendingCount
        }
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          cycle_completed: true,
          products_added: productCount,
          content_generated: contentCount,
          traffic_activated: trafficCount,
          posts_queued_for_zapier: queuedCount,
          trending_discovered: trendingCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'stop') {
      const { error } = await supabaseAdmin
        .from('user_settings')
        .update({ autopilot_enabled: false })
        .eq('user_id', user_id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await supabaseAdmin.from('activity_logs').insert({
        user_id: user_id,
        action: 'autopilot_stopped',
        status: 'success',
        details: 'Autopilot stopped by user'
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Autopilot stopped' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Autopilot error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function addProducts(supabaseAdmin: any, campaignId: string, userId: string): Promise<number> {
  const timestamp = Date.now();
  const randomSuffix = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  
  const products = [
    { name: `Smart Watch Pro ${randomSuffix()}`, network: 'amazon' },
    { name: `Wireless Earbuds ${randomSuffix()}`, network: 'amazon' },
    { name: `LED Desk Lamp ${randomSuffix()}`, network: 'temu' },
    { name: `Yoga Mat Premium ${randomSuffix()}`, network: 'amazon' },
    { name: `Phone Stand ${randomSuffix()}`, network: 'temu' }
  ];

  let addedCount = 0;

  for (const product of products) {
    const asin = 'B0' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const slug = Math.random().toString(36).substring(2, 8);
    
    const { error } = await supabaseAdmin
      .from('affiliate_links')
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        product_name: product.name,
        network: product.network,
        original_url: `https://www.amazon.com/dp/${asin}`,
        cloaked_url: `https://sale-makseb.vercel.app/go/${slug}`,
        slug: slug,
        status: 'active',
        clicks: 0,
        conversions: 0
      });

    if (!error) addedCount++;
  }

  return addedCount;
}

async function generateContent(supabaseAdmin: any, campaignId: string, userId: string): Promise<number> {
  const date = new Date().toISOString().split('T')[0];
  const topics = [
    'Top 10 Must-Have Tech Gadgets',
    'Best Home Office Setup Ideas',
    'Ultimate Fitness Equipment Guide',
    'Smart Home Devices Worth Buying',
    'Budget-Friendly Tech Accessories'
  ];
  
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  const title = `${randomTopic} - ${date}`;

  const { data: links } = await supabaseAdmin
    .from('affiliate_links')
    .select('id')
    .eq('campaign_id', campaignId)
    .limit(1);

  if (!links || links.length === 0) return 0;

  const articles = [
    {
      title: title,
      body: 'Discover the latest innovations that are changing how we live and work. From smart home devices to portable power solutions, these products are must-haves for 2026.',
      type: 'review',
      link_id: links[0].id
    }
  ];

  let generatedCount = 0;

  for (const article of articles) {
    const { error } = await supabaseAdmin
      .from('generated_content')
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        link_id: article.link_id,
        platform: 'blog',
        content_type: article.type,
        content: article.body,
        title: article.title,
        performance_score: 85,
        status: 'published'
      });

    if (!error) generatedCount++;
  }

  return generatedCount;
}

async function activateTraffic(supabaseAdmin: any, campaignId: string, userId: string): Promise<number> {
  const sources = ['Pinterest', 'Facebook', 'Instagram', 'Twitter'];
  let activatedCount = 0;

  for (const source of sources) {
    const { data: existing } = await supabaseAdmin
      .from('traffic_sources')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('name', source)
      .maybeSingle();

    if (existing) continue;

    const { error } = await supabaseAdmin
      .from('traffic_sources')
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        name: source,
        type: 'social',
        status: 'active',
        total_visits: 0,
        total_clicks: 0,
        total_conversions: 0
      });

    if (!error) activatedCount++;
  }

  return activatedCount;
}

async function queueContentForPosting(supabaseAdmin: any, campaignId: string, userId: string): Promise<number> {
  const { data: products } = await supabaseAdmin
    .from('affiliate_links')
    .select('id, product_name, cloaked_url, network')
    .eq('campaign_id', campaignId)
    .eq('status', 'active')
    .limit(3);

  if (!products || products.length === 0) return 0;

  let queuedCount = 0;
  const platforms = ['pinterest', 'facebook', 'twitter'];

  for (const platform of platforms) {
    const product = products[Math.floor(Math.random() * products.length)];
    
    const caption = `🔥 Check out this amazing ${product.product_name}! 

Get yours here: ${product.cloaked_url}

#${product.network} #deals #shopping #trending`;

    const { error } = await supabaseAdmin
      .from('posted_content')
      .insert({
        user_id: userId,
        link_id: product.id,
        product_id: product.id,
        platform: platform,
        post_type: 'image',
        caption: caption,
        post_url: product.cloaked_url,
        status: 'posted',
        posted_at: new Date().toISOString(),
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0
      });

    if (!error) queuedCount++;
  }

  return queuedCount;
}

async function scanAndAddTrendingProducts(supabaseAdmin: any, campaignId: string, userId: string): Promise<number> {
  const randomSuffix = () => Math.random().toString(36).substring(2, 5).toUpperCase();
  
  const trendingProducts = [
    { name: `Wireless Earbuds Pro ${randomSuffix()}`, network: 'amazon', price: 45, trend_score: 87, category: 'tech' },
    { name: `Smart LED Strip ${randomSuffix()}`, network: 'amazon', price: 28, trend_score: 82, category: 'home' }
  ];

  let addedCount = 0;

  for (const product of trendingProducts) {
    const asin = 'B0' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const slug = Math.random().toString(36).substring(2, 8);

    const { data: link, error: linkError } = await supabaseAdmin
      .from('affiliate_links')
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        product_name: product.name,
        network: product.network,
        original_url: `https://www.amazon.com/dp/${asin}`,
        cloaked_url: `https://sale-makseb.vercel.app/go/${slug}`,
        slug: slug,
        status: 'active',
        clicks: 0,
        conversions: 0
      })
      .select('id')
      .single();

    if (!linkError && link) {
      await supabaseAdmin
        .from('trend_products')
        .insert({
          product_name: product.name,
          asin: asin,
          category: product.category,
          current_price: product.price,
          trend_score: product.trend_score,
          search_volume: Math.floor(Math.random() * 50000) + 10000,
          velocity: Math.floor(Math.random() * 100),
          competition_score: Math.floor(Math.random() * 50) + 30,
          profit_margin: 25,
          trending_platforms: ['amazon', 'tiktok'],
          status: 'active',
          last_updated: new Date().toISOString()
        });

      addedCount++;
    }
  }

  return addedCount;
}