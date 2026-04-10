import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 Autopilot Engine Started');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, user_id } = body;
    
    console.log('📥 Request:', { action, user_id });

    if (!action || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing action or user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'stop') {
      return new Response(JSON.stringify({ success: true, message: 'Stopped' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');

    const results = {
      products_discovered: 0,
      content_generated: 0,
      posts_published: 0,
      errors: [] as string[]
    };

    // ========================================
    // STEP 1: CREATE PRODUCTS
    // ========================================
    console.log('📦 STEP 1: Creating products...');
    try {
      // Get or create active campaign
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user_id)
        .eq('status', 'active')
        .limit(1);

      if (campaignError) {
        console.error('❌ Campaign fetch error:', campaignError);
        results.errors.push(`Campaign error: ${campaignError.message}`);
      } else {
        let campaignId;
        
        if (!campaigns || campaigns.length === 0) {
          console.log('⚠️ No campaign found, creating one...');
          const { data: newCampaign, error: createError } = await supabase
            .from('campaigns')
            .insert({
              user_id: user_id,
              name: 'Autopilot Campaign',
              goal: 'sales',
              status: 'active',
              is_autopilot: true
            })
            .select()
            .single();
          
          if (createError) {
            console.error('❌ Campaign create error:', createError);
            results.errors.push(`Campaign create error: ${createError.message}`);
          } else {
            campaignId = newCampaign.id;
            console.log('✅ Campaign created:', campaignId);
          }
        } else {
          campaignId = campaigns[0].id;
          console.log('✅ Using campaign:', campaignId);
        }

        // Create 3 products
        if (campaignId) {
          const timestamp = Date.now();
          const cycleId = timestamp.toString(36);
          const baseUrl = Deno.env.get('SITE_URL') || 'https://sale-makseb.vercel.app';

          for (let i = 0; i < 3; i++) {
            const asin = `B0${cycleId.slice(-6).toUpperCase()}${i}`;
            const slug = `${asin.toLowerCase()}-${timestamp}-${i}`;
            const productName = `Auto Product ${cycleId.slice(-4).toUpperCase()}-${i}`;

            console.log(`➕ Creating product ${i+1}/3: ${productName}`);

            const { data: link, error: linkError } = await supabase
              .from('affiliate_links')
              .insert({
                user_id: user_id,
                campaign_id: campaignId,
                product_name: productName,
                original_url: `https://amazon.com/dp/${asin}?tag=yourtag-20`,
                cloaked_url: `${baseUrl}/go/${slug}`,
                slug: slug,
                network: 'amazon',
                status: 'active',
                clicks: 0,
                conversions: 0,
                revenue: 0,
                commission_rate: 10,
                is_working: true
              })
              .select()
              .single();

            if (linkError) {
              console.error(`❌ Product ${i+1} insert error:`, linkError);
              results.errors.push(`Product ${i+1}: ${linkError.message}`);
            } else {
              console.log(`✅ Product ${i+1} created:`, link.id);
              results.products_discovered++;
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Products step error:', error);
      results.errors.push(`Products: ${error.message}`);
    }

    console.log(`📦 Products created: ${results.products_discovered}/3`);

    // ========================================
    // STEP 2: CREATE CONTENT
    // ========================================
    console.log('✍️ STEP 2: Creating content...');
    try {
      // Get campaign
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user_id)
        .eq('status', 'active')
        .limit(1);

      if (campaigns && campaigns.length > 0) {
        const campaignId = campaigns[0].id;

        // Get recent products
        const { data: products } = await supabase
          .from('affiliate_links')
          .select('id, product_name, cloaked_url')
          .eq('user_id', user_id)
          .eq('campaign_id', campaignId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5);

        if (products && products.length > 0) {
          // Create content for 2 products
          for (let i = 0; i < Math.min(2, products.length); i++) {
            const product = products[i];
            const content = `🔥 Amazing ${product.product_name}!\n\n✨ Perfect for you.\n\nGet it: ${product.cloaked_url}`;

            console.log(`➕ Creating content ${i+1}/2 for: ${product.product_name}`);

            const { data: genContent, error: contentError } = await supabase
              .from('generated_content')
              .insert({
                user_id: user_id,
                campaign_id: campaignId,
                title: `Review: ${product.product_name}`,
                body: content,
                type: 'review',
                status: 'published'
              })
              .select()
              .single();

            if (contentError) {
              console.error(`❌ Content ${i+1} insert error:`, contentError);
              results.errors.push(`Content ${i+1}: ${contentError.message}`);
            } else {
              console.log(`✅ Content ${i+1} created:`, genContent.id);
              results.content_generated++;
            }
          }
        } else {
          console.log('⚠️ No products found for content generation');
        }
      }
    } catch (error) {
      console.error('❌ Content step error:', error);
      results.errors.push(`Content: ${error.message}`);
    }

    console.log(`✍️ Content created: ${results.content_generated}/2`);

    // ========================================
    // STEP 3: CREATE POSTS
    // ========================================
    console.log('📱 STEP 3: Creating posts...');
    try {
      // Get campaign
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user_id)
        .eq('status', 'active')
        .limit(1);

      if (campaigns && campaigns.length > 0) {
        const campaignId = campaigns[0].id;

        // Get recent products
        const { data: products } = await supabase
          .from('affiliate_links')
          .select('id, product_name, cloaked_url')
          .eq('user_id', user_id)
          .eq('campaign_id', campaignId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3);

        if (products && products.length > 0) {
          const platforms = ['facebook', 'instagram', 'twitter'];

          // Create 2 posts
          for (let i = 0; i < Math.min(2, products.length); i++) {
            const product = products[i];
            const platform = platforms[i % platforms.length];
            const caption = `Check out ${product.product_name}! 🔥\n\n${product.cloaked_url}\n\n#affiliate #deals`;

            console.log(`➕ Creating post ${i+1}/2 on ${platform}: ${product.product_name}`);

            const { data: post, error: postError } = await supabase
              .from('posted_content')
              .insert({
                user_id: user_id,
                campaign_id: campaignId,
                platform: platform,
                post_type: 'image',
                caption: caption,
                status: 'posted',
                posted_at: new Date().toISOString()
              })
              .select()
              .single();

            if (postError) {
              console.error(`❌ Post ${i+1} insert error:`, postError);
              results.errors.push(`Post ${i+1}: ${postError.message}`);
            } else {
              console.log(`✅ Post ${i+1} created:`, post.id);
              results.posts_published++;
            }
          }
        } else {
          console.log('⚠️ No products found for posting');
        }
      }
    } catch (error) {
      console.error('❌ Posts step error:', error);
      results.errors.push(`Posts: ${error.message}`);
    }

    console.log(`📱 Posts created: ${results.posts_published}/2`);

    // ========================================
    // LOG RESULTS
    // ========================================
    console.log('📝 Logging to database...');
    const { error: logError } = await supabase
      .from('autopilot_cron_log')
      .insert({
        user_id: user_id,
        status: results.errors.length > 0 ? 'error' : 'success',
        results: {
          action: action,
          message: `Created: ${results.products_discovered} products, ${results.content_generated} content, ${results.posts_published} posts`,
          results: results
        },
        error: results.errors.length > 0 ? results.errors.join('; ') : null
      });

    if (logError) {
      console.error('❌ Failed to log:', logError);
    } else {
      console.log('✅ Logged to autopilot_cron_log');
    }

    // ========================================
    // RETURN RESPONSE
    // ========================================
    const response = {
      success: true,
      action: action,
      message: `Created: ${results.products_discovered} products, ${results.content_generated} content, ${results.posts_published} posts`,
      results: results
    };

    console.log('📤 Response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Fatal error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});