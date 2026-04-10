import { supabase } from "@/integrations/supabase/client";

/**
 * DECISION ENGINE
 * Makes autopilot decisions: scale, kill, cooldown, retest
 */

export interface Decision {
  entity_type: 'post' | 'product';
  entity_id: string;
  action: 'scale' | 'kill' | 'cooldown' | 'retest';
  reason: string;
  metrics: any;
}

/**
 * Evaluate a post and make decision
 */
export async function evaluatePost(postId: string, userId: string): Promise<Decision | null> {
  try {
    const { data: post, error } = await supabase
      .from('posted_content')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !post) return null;

    const impressions = post.impressions || 0;
    const clicks = post.clicks || 0;
    const conversions = post.conversions || 0;
    const ctr = post.ctr || 0;

    let action: 'scale' | 'kill' | 'cooldown' | 'retest' = 'cooldown';
    let reason = '';

    // Decision rules
    if (ctr >= 2 || clicks >= 20) {
      action = 'scale';
      reason = `High performance: CTR ${ctr.toFixed(2)}%, ${clicks} clicks`;
    } else if (impressions >= 200 && ctr < 1 && conversions === 0) {
      action = 'kill';
      reason = `Low performance: ${impressions} impressions, CTR ${ctr.toFixed(2)}%, no conversions`;
    } else if (impressions > 100 && ctr < 1.5) {
      action = 'cooldown';
      reason = `Moderate performance: needs more data`;
    } else {
      action = 'retest';
      reason = 'Collecting more data';
    }

    const decision: Decision = {
      entity_type: 'post',
      entity_id: postId,
      action,
      reason,
      metrics: {
        impressions,
        clicks,
        conversions,
        ctr,
        revenue: post.revenue || 0
      }
    };

    // Log decision
    await supabase
      .from('autopilot_decisions')
      .insert({
        user_id: userId,
        entity_type: 'post',
        entity_id: postId,
        action,
        reason,
        metrics: decision.metrics
      });

    return decision;
  } catch (error) {
    console.error('Error evaluating post:', error);
    return null;
  }
}

/**
 * Evaluate a product and make decision
 */
export async function evaluateProduct(productId: string, userId: string): Promise<Decision | null> {
  try {
    const { data: product, error } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('id', productId)
      .single();

    if (error || !product) return null;

    const performance_score = product.performance_score || 0;
    const autopilot_state = product.autopilot_state || 'testing';

    let action: 'scale' | 'kill' | 'cooldown' | 'retest' = 'cooldown';
    let reason = '';

    // Decision rules
    if (performance_score >= 70 && autopilot_state !== 'scaling') {
      action = 'scale';
      reason = `High performance score: ${performance_score.toFixed(2)}`;
    } else if (performance_score < 20 && autopilot_state === 'testing') {
      action = 'kill';
      reason = `Low performance score: ${performance_score.toFixed(2)}`;
    } else if (autopilot_state === 'scaling' && performance_score < 50) {
      action = 'cooldown';
      reason = `Performance declined from ${performance_score.toFixed(2)}`;
    } else {
      action = 'retest';
      reason = 'Monitoring performance';
    }

    const decision: Decision = {
      entity_type: 'product',
      entity_id: productId,
      action,
      reason,
      metrics: {
        performance_score,
        autopilot_state,
        clicks: product.clicks || 0,
        conversions: product.conversions || 0,
        revenue: product.revenue || 0
      }
    };

    // Log decision
    await supabase
      .from('autopilot_decisions')
      .insert({
        user_id: userId,
        entity_type: 'product',
        entity_id: productId,
        action,
        reason,
        metrics: decision.metrics
      });

    return decision;
  } catch (error) {
    console.error('Error evaluating product:', error);
    return null;
  }
}

/**
 * Apply decisions to posts (scale/kill/cooldown)
 */
export async function applyPostDecision(decision: Decision): Promise<boolean> {
  try {
    if (decision.action === 'scale') {
      // Increase posting priority
      await supabase
        .from('posted_content')
        .update({
          autopilot_state: 'scaling',
          priority_score: supabase.raw('priority_score + 20')
        })
        .eq('id', decision.entity_id);

      // Create more variants (add to queue)
      await supabase
        .from('autopilot_queue')
        .insert({
          user_id: decision.metrics.user_id,
          action: 'create_variant',
          entity_type: 'post',
          entity_id: decision.entity_id,
          priority: 90,
          status: 'pending'
        });

      return true;
    } else if (decision.action === 'kill') {
      // Mark as killed
      await supabase
        .from('posted_content')
        .update({
          autopilot_state: 'killed',
          priority_score: 0
        })
        .eq('id', decision.entity_id);

      return true;
    } else if (decision.action === 'cooldown') {
      // Reduce priority
      await supabase
        .from('posted_content')
        .update({
          autopilot_state: 'cooldown',
          priority_score: supabase.raw('priority_score * 0.5')
        })
        .eq('id', decision.entity_id);

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error applying post decision:', error);
    return false;
  }
}

/**
 * Apply decisions to products (scale/kill/cooldown)
 */
export async function applyProductDecision(decision: Decision): Promise<boolean> {
  try {
    if (decision.action === 'scale') {
      // Mark as scaling
      await supabase
        .from('affiliate_links')
        .update({
          autopilot_state: 'scaling',
          last_scaled_at: new Date().toISOString(),
          priority_score: supabase.raw('priority_score + 30')
        })
        .eq('id', decision.entity_id);

      // Add to high-priority content generation queue
      await supabase
        .from('autopilot_queue')
        .insert({
          action: 'generate_content',
          entity_type: 'product',
          entity_id: decision.entity_id,
          priority: 95,
          status: 'pending'
        });

      return true;
    } else if (decision.action === 'kill') {
      // Mark as killed
      await supabase
        .from('affiliate_links')
        .update({
          autopilot_state: 'killed',
          last_killed_at: new Date().toISOString(),
          priority_score: 0,
          status: 'inactive'
        })
        .eq('id', decision.entity_id);

      return true;
    } else if (decision.action === 'cooldown') {
      // Reduce activity
      await supabase
        .from('affiliate_links')
        .update({
          autopilot_state: 'cooldown',
          priority_score: supabase.raw('priority_score * 0.5')
        })
        .eq('id', decision.entity_id);

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error applying product decision:', error);
    return false;
  }
}

/**
 * Get AI recommendation based on recent decisions
 */
export async function getAIRecommendation(userId: string): Promise<string[]> {
  try {
    const { data: decisions } = await supabase
      .from('autopilot_decisions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!decisions || decisions.length === 0) {
      return ["System is learning your patterns. Check back soon!"];
    }

    const recommendations: string[] = [];

    // Count actions
    const scales = decisions.filter(d => d.action === 'scale').length;
    const kills = decisions.filter(d => d.action === 'kill').length;

    if (scales > 3) {
      recommendations.push(`🚀 ${scales} items are scaling now — generating more content for winners`);
    }

    if (kills > 2) {
      recommendations.push(`⚠️ ${kills} low performers paused — focusing budget on what works`);
    }

    // Recent scale
    const recentScale = decisions.find(d => d.action === 'scale');
    if (recentScale) {
      recommendations.push(`✅ "${recentScale.reason}" — autopilot is optimizing`);
    }

    return recommendations.length > 0 ? recommendations : ["System running smoothly"];
  } catch (error) {
    console.error('Error getting AI recommendation:', error);
    return ["System is analyzing performance"];
  }
}