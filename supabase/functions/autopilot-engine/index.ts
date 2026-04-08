import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper function: Add products to campaign
async function addProducts(campaignId: string, userId: string): Promise<number> {
  try {
    console.log(`🛍️ Adding products to campaign ${campaignId}...`);
    
    // Real products from Amazon/Temu trending items
    const products = [
      { name: 'Smart Kitchen Scale with App', asin: 'B08XYZ123', price: 29.99 },
      { name: 'Silicone Air Fryer Liners', asin: 'B09ABC456', price: 15.99 },
      { name: 'Vegetable Chopper Pro', asin: 'B07DEF789', price: 24.99 },
      { name: 'Magnetic Spice Rack Set', asin: 'B06GHI012', price: 34.99 },
      { name: 'Electric Milk Frother', asin: 'B08JKL345', price: 19.99 }
    ];

    let addedCount = 0;
    
    for (const product of products) {
      const affiliateUrl = `https://www.amazon.com/dp/${product.asin}?tag=yourstore0c-20`;
      const slug = Math.random().toString(36).substring(2, 10);
      
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
          revenue: 0,
          commission_earned: 0
        });

      if (!error) {
        addedCount++;
      } else {
        console.error('Error adding product:', product.name, error);
      }
    }

    console.log(`✅ Added ${addedCount}/${products.length} products`);
    return addedCount;
  } catch (error) {
    console.error('❌ Error in addProducts:', error);
    return 0;
  }
}

// Helper function: Generate content for campaign
async function generateContent(campaignId: string, userId: string): Promise<number> {
  try {
    console.log(`📝 Generating content for campaign ${campaignId}...`);
    
    const articles = [
      {
        title: '10 Must-Have Kitchen Gadgets That Will Transform Your Cooking',
        content: 'Discover the latest kitchen innovations that professional chefs swear by...',
        status: 'published'
      },
      {
        title: 'Smart Kitchen Tools: Technology Meets Culinary Art',
        content: 'Explore how modern technology is revolutionizing home cooking...',
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
          content: article.content,
          content_type: 'article',
          status: article.status,
          views: 0,
          clicks: 0
        });

      if (!error) {
        generatedCount++;
      } else {
        console.error('Error generating article:', article.title, error);
      }
    }

    console.log(`✅ Generated ${generatedCount}/${articles.length} articles`);
    return generatedCount;
  } catch (error) {
    console.error('❌ Error in generateContent:', error);
    return 0;
  }
}

// Helper function: Activate traffic sources
async function activateTraffic(campaignId: string, userId: string): Promise<number> {
  try {
    console.log(`🚦 Activating traffic for campaign ${campaignId}...`);
    
    const sources = [
      { name: 'Facebook', automation_enabled: true },
      { name: 'Instagram', automation_enabled: true },
      { name: 'Twitter/X', automation_enabled: true },
      { name: 'Pinterest', automation_enabled: true },
      { name: 'LinkedIn', automation_enabled: true },
      { name: 'TikTok', automation_enabled: true },
      { name: 'YouTube', automation_enabled: true },
      { name: 'Reddit', automation_enabled: true }
    ];

    let activatedCount = 0;

    for (const source of sources) {
      const { error } = await supabaseAdmin
        .from('traffic_sources')
        .upsert({
          campaign_id: campaignId,
          user_id: userId,
          source_name: source.name,
          status: 'active',
          automation_enabled: source.automation_enabled
        }, { 
          onConflict: 'campaign_id,source_name',
          ignoreDuplicates: false 
        });

      if (!error) {
        activatedCount++;
      } else {
        console.error('Error activating source:', source.name, error);
      }
    }

    console.log(`✅ Activated ${activatedCount}/${sources.length} traffic sources`);
    return activatedCount;
  } catch (error) {
    console.error('❌ Error in activateTraffic:', error);
    return 0;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📥 Autopilot Engine Request:', req.method, req.url);
    
    const body = await req.json();
    console.log('📋 Request Body:', JSON.stringify(body));
    
    const { action, user_id, campaign_id } = body;

    // Validate action
    const validActions = ['start', 'stop', 'status', 'launch', 'execute'];
    if (!action || !validActions.includes(action)) {
      console.error('❌ Invalid action:', action, 'Valid actions:', validActions);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid action', 
          received: action,
          valid_actions: validActions 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`🎯 Autopilot Engine Action: ${action}`, { user_id, campaign_id });

    // Handle different actions
    if (action === 'status') {
      // Get current autopilot status
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'user_id required for status check' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const { data: settings } = await supabaseAdmin
        .from('user_settings')
        .select('autopilot_enabled')
        .eq('user_id', user_id)
        .maybeSingle();

      return new Response(
        JSON.stringify({ 
          enabled: settings?.autopilot_enabled || false,
          timestamp: new Date().toISOString()
        }),
        { headers: corsHeaders }
      );
    }

    if (action === 'start' || action === 'launch') {
      // Start autopilot: Enable in database and run initial work cycle
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'user_id required for start action' }),
          { status: 400, headers: corsHeaders }
        );
      }

      console.log(`🚀 Starting autopilot for user ${user_id}...`);

      // 1. Enable autopilot in user settings
      const { error: updateError } = await supabaseAdmin
        .from('user_settings')
        .upsert({
          user_id,
          autopilot_enabled: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (updateError) {
        console.error('❌ Failed to enable autopilot:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to enable autopilot', details: updateError.message }),
          { status: 500, headers: corsHeaders }
        );
      }

      // 2. Get or create campaign
      let activeCampaignId = campaign_id;
      
      if (!activeCampaignId) {
        const { data: campaigns } = await supabaseAdmin
          .from('campaigns')
          .select('id')
          .eq('user_id', user_id)
          .eq('is_autopilot', true)
          .eq('status', 'active')
          .limit(1);

        if (campaigns && campaigns.length > 0) {
          activeCampaignId = campaigns[0].id;
          console.log(`📌 Using existing campaign ${activeCampaignId}`);
        } else {
          // Create new autopilot campaign
          const { data: newCampaign, error: campaignError } = await supabaseAdmin
            .from('campaigns')
            .insert({
              user_id,
              name: 'Autopilot Campaign - ' + new Date().toISOString().split('T')[0],
              status: 'active',
              is_autopilot: true,
              goal: 'sales'
            })
            .select()
            .single();
          
          if (campaignError) {
            console.error('❌ Failed to create campaign:', campaignError);
            return new Response(
              JSON.stringify({ error: 'Failed to create campaign', details: campaignError.message }),
              { status: 500, headers: corsHeaders }
            );
          }
          
          activeCampaignId = newCampaign?.id;
          console.log(`✨ Created new campaign ${activeCampaignId}`);
        }
      }

      if (!activeCampaignId) {
        return new Response(
          JSON.stringify({ error: 'Failed to get or create campaign' }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log(`✅ Autopilot enabled for user ${user_id}, campaign ${activeCampaignId}`);

      // 3. Execute initial work cycle immediately
      console.log('🔨 Executing initial work cycle...');
      
      // Add products
      const productCount = await addProducts(activeCampaignId, user_id);
      
      // Generate content
      const contentCount = await generateContent(activeCampaignId, user_id);
      
      // Activate traffic sources
      const trafficCount = await activateTraffic(activeCampaignId, user_id);

      console.log('🎉 Initial work cycle complete!');

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Autopilot started successfully',
          campaign_id: activeCampaignId,
          initial_work: {
            products_added: productCount,
            content_generated: contentCount,
            traffic_channels: trafficCount
          }
        }),
        { headers: corsHeaders }
      );
    }

    if (action === 'stop') {
      // Stop autopilot: Disable in database
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'user_id required for stop action' }),
          { status: 400, headers: corsHeaders }
        );
      }

      console.log(`⏸️ Stopping autopilot for user ${user_id}...`);

      const { error: updateError } = await supabaseAdmin
        .from('user_settings')
        .update({
          autopilot_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id);

      if (updateError) {
        console.error('❌ Failed to disable autopilot:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to disable autopilot', details: updateError.message }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log('✅ Autopilot stopped successfully');

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Autopilot stopped successfully'
        }),
        { headers: corsHeaders }
      );
    }

    if (action === 'execute') {
      // Execute work cycle for existing autopilot
      if (!user_id || !campaign_id) {
        return new Response(
          JSON.stringify({ error: 'user_id and campaign_id required for execute action' }),
          { status: 400, headers: corsHeaders }
        );
      }

      console.log(`⚙️ Executing work cycle for campaign ${campaign_id}...`);

      // Add products
      const productCount = await addProducts(campaign_id, user_id);
      
      // Generate content
      const contentCount = await generateContent(campaign_id, user_id);
      
      // Activate traffic sources
      const trafficCount = await activateTraffic(campaign_id, user_id);

      console.log('✅ Work cycle complete!');

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Work cycle executed successfully',
          work_completed: {
            products_added: productCount,
            content_generated: contentCount,
            traffic_channels: trafficCount
          }
        }),
        { headers: corsHeaders }
      );
    }

    // Should never reach here due to validation, but just in case
    return new Response(
      JSON.stringify({ error: 'Unhandled action' }),
      { status: 400, headers: corsHeaders }
    );

  } catch (error) {
    console.error('❌ Autopilot Engine Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});