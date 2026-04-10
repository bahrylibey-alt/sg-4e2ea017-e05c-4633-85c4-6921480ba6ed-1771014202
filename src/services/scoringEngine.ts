import { supabase } from "@/integrations/supabase/client";

/**
 * SCORING ENGINE
 * Calculates performance scores for posts and products
 */

export interface PostScore {
  performance_score: number;
  autopilot_state: 'testing' | 'scaling' | 'cooldown' | 'killed';
  priority_score: number;
  ctr: number;
  conversion_rate: number;
  revenue_per_click: number;
}

export interface ProductScore {
  performance_score: number;
  autopilot_state: 'testing' | 'scaling' | 'cooldown' | 'killed';
  priority_score: number;
}

/**
 * Score a single post based on performance metrics
 */
export async function scorePost(postId: string): Promise<PostScore | null> {
  try {
    const { data: post, error } = await supabase
      .from('posted_content')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !post) {
      console.error('Error fetching post:', error);
      return null;
    }

    // Calculate metrics
    const impressions = post.impressions || 0;
    const clicks = post.clicks || 0;
    const conversions = post.conversions || 0;
    const revenue = post.revenue || 0;

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversion_rate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const revenue_per_click = clicks > 0 ? revenue / clicks : 0;

    // Determine autopilot state based on rules
    let autopilot_state: 'testing' | 'scaling' | 'cooldown' | 'killed' = 'testing';

    if (impressions >= 200 && ctr < 1 && conversions === 0) {
      autopilot_state = 'killed';
    } else if (ctr >= 2 || clicks >= 20) {
      autopilot_state = 'scaling';
    } else if (impressions > 100) {
      autopilot_state = 'cooldown';
    }

    // Calculate performance score (0-100)
    const ctr_score = Math.min(ctr * 10, 40); // max 40 points
    const conv_score = Math.min(conversion_rate * 3, 30); // max 30 points
    const revenue_score = Math.min(revenue_per_click * 10, 30); // max 30 points
    const performance_score = ctr_score + conv_score + revenue_score;

    // Calculate priority score
    let priority_score = performance_score;
    if (autopilot_state === 'scaling') priority_score += 20;
    if (autopilot_state === 'killed') priority_score = 0;

    const score: PostScore = {
      performance_score: Math.round(performance_score * 100) / 100,
      autopilot_state,
      priority_score: Math.round(priority_score * 100) / 100,
      ctr: Math.round(ctr * 100) / 100,
      conversion_rate: Math.round(conversion_rate * 100) / 100,
      revenue_per_click: Math.round(revenue_per_click * 100) / 100
    };

    // Update post with calculated scores
    await supabase
      .from('posted_content')
      .update({
        ctr: score.ctr,
        conversion_rate: score.conversion_rate,
        revenue_per_click: score.revenue_per_click,
        performance_score: score.performance_score,
        autopilot_state: score.autopilot_state,
        priority_score: score.priority_score
      })
      .eq('id', postId);

    return score;
  } catch (error) {
    console.error('Error scoring post:', error);
    return null;
  }
}

/**
 * Score a product based on aggregated post performance
 */
export async function scoreProduct(productId: string): Promise<ProductScore | null> {
  try {
    const { data: product, error } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('id', productId)
      .single();

    if (error || !product) {
      console.error('Error fetching product:', error);
      return null;
    }

    // Get all posts for this product
    const { data: posts } = await supabase
      .from('posted_content')
      .select('clicks, conversions, revenue, ctr, conversion_rate, autopilot_state')
      .eq('product_id', productId);

    if (!posts || posts.length === 0) {
      return {
        performance_score: 0,
        autopilot_state: 'testing',
        priority_score: 0
      };
    }

    // Aggregate metrics
    const total_clicks = posts.reduce((sum, p) => sum + (p.clicks || 0), 0);
    const total_conversions = posts.reduce((sum, p) => sum + (p.conversions || 0), 0);
    const total_revenue = posts.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const avg_ctr = posts.reduce((sum, p) => sum + (p.ctr || 0), 0) / posts.length;
    const avg_conversion_rate = posts.reduce((sum, p) => sum + (p.conversion_rate || 0), 0) / posts.length;

    // Count state distribution
    const scaling_posts = posts.filter(p => p.autopilot_state === 'scaling').length;
    const killed_posts = posts.filter(p => p.autopilot_state === 'killed').length;

    // Determine product state
    let autopilot_state: 'testing' | 'scaling' | 'cooldown' | 'killed' = 'testing';
    
    if (killed_posts > posts.length / 2) {
      autopilot_state = 'killed';
    } else if (scaling_posts >= 2 || (total_clicks >= 50 && avg_ctr >= 2)) {
      autopilot_state = 'scaling';
    } else if (posts.length >= 5) {
      autopilot_state = 'cooldown';
    }

    // Calculate performance score
    const ctr_score = Math.min(avg_ctr * 10, 40);
    const conv_score = Math.min(avg_conversion_rate * 3, 30);
    const revenue_score = Math.min((total_revenue / 100) * 10, 30);
    const performance_score = ctr_score + conv_score + revenue_score;

    // Calculate priority score
    let priority_score = performance_score;
    if (autopilot_state === 'scaling') priority_score += 30;
    if (autopilot_state === 'killed') priority_score = 0;

    const score: ProductScore = {
      performance_score: Math.round(performance_score * 100) / 100,
      autopilot_state,
      priority_score: Math.round(priority_score * 100) / 100
    };

    // Update product with calculated scores
    await supabase
      .from('affiliate_links')
      .update({
        performance_score: score.performance_score,
        autopilot_state: score.autopilot_state,
        priority_score: score.priority_score,
        ...(autopilot_state === 'scaling' ? { last_scaled_at: new Date().toISOString() } : {}),
        ...(autopilot_state === 'killed' ? { last_killed_at: new Date().toISOString() } : {})
      })
      .eq('id', productId);

    return score;
  } catch (error) {
    console.error('Error scoring product:', error);
    return null;
  }
}

/**
 * Score all posts for a user
 */
export async function scoreAllPosts(userId: string): Promise<number> {
  try {
    const { data: posts } = await supabase
      .from('posted_content')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'posted');

    if (!posts) return 0;

    let scored = 0;
    for (const post of posts) {
      const score = await scorePost(post.id);
      if (score) scored++;
    }

    return scored;
  } catch (error) {
    console.error('Error scoring all posts:', error);
    return 0;
  }
}

/**
 * Score all products for a user
 */
export async function scoreAllProducts(userId: string): Promise<number> {
  try {
    const { data: products } = await supabase
      .from('affiliate_links')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (!products) return 0;

    let scored = 0;
    for (const product of products) {
      const score = await scoreProduct(product.id);
      if (score) scored++;
    }

    return scored;
  } catch (error) {
    console.error('Error scoring all products:', error);
    return 0;
  }
}