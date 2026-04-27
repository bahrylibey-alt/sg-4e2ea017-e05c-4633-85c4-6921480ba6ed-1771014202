import { supabase } from "@/integrations/supabase/client";

export interface UnifiedStats {
  products: number;
  articles: number;
  posts: number;
  clicks: number;
  views: number;
  conversions: number;
  revenue: number;
}

/**
 * UNIFIED STATS SERVICE - SINGLE SOURCE OF TRUTH
 * 
 * All dashboard pages MUST use this service to display stats.
 * This ensures data consistency across the entire application.
 * 
 * Data sources:
 * - Products: affiliate_links table
 * - Articles: generated_content (published)
 * - Posts: posted_content (posted to social)
 * - Clicks: click_events table
 * - Views: view_events table
 * - Conversions: conversion_events (verified)
 * - Revenue: sum of conversion_events.revenue (verified)
 */
export class UnifiedStatsService {
  /**
   * Get real-time stats from database
   * Returns actual data, never mock/demo data
   */
  static async getStats(): Promise<UnifiedStats> {
    try {
      // Execute single query to get all stats at once
      const { data, error } = await supabase.rpc('get_unified_stats');
      
      if (error) {
        console.error("Stats query error:", error);
        // Fall back to individual queries if RPC doesn't exist
        return await this.getStatsFallback();
      }

      if (!data || data.length === 0) {
        return await this.getStatsFallback();
      }

      const stats = data[0];
      return {
        products: stats.total_products || 0,
        articles: stats.total_articles || 0,
        posts: stats.total_posts || 0,
        clicks: stats.total_clicks || 0,
        views: stats.total_views || 0,
        conversions: stats.total_conversions || 0,
        revenue: Number(stats.total_revenue) || 0
      };
    } catch (error) {
      console.error("Failed to get stats:", error);
      return await this.getStatsFallback();
    }
  }

  /**
   * Fallback method using individual queries
   */
  private static async getStatsFallback(): Promise<UnifiedStats> {
    const [products, articles, posts, clicks, views, conversions] = await Promise.all([
      supabase.from('affiliate_links').select('id', { count: 'exact', head: true }),
      supabase.from('generated_content').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('posted_content').select('id', { count: 'exact', head: true }).eq('status', 'posted'),
      supabase.from('click_events').select('id', { count: 'exact', head: true }),
      supabase.from('view_events').select('id', { count: 'exact', head: true }),
      supabase.from('conversion_events').select('revenue', { count: 'exact' }).eq('verified', true)
    ]);

    const totalRevenue = conversions.data?.reduce((sum, conv) => sum + (Number(conv.revenue) || 0), 0) || 0;

    return {
      products: products.count || 0,
      articles: articles.count || 0,
      posts: posts.count || 0,
      clicks: clicks.count || 0,
      views: views.count || 0,
      conversions: conversions.count || 0,
      revenue: totalRevenue
    };
  }

  /**
   * Get stats for a specific user
   */
  static async getStatsForUser(userId: string): Promise<UnifiedStats> {
    try {
      const [products, articles, posts, clicks, views, conversions] = await Promise.all([
        supabase.from('affiliate_links').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('generated_content').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'published'),
        supabase.from('posted_content').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'posted'),
        supabase.from('click_events').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('view_events').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('conversion_events').select('revenue', { count: 'exact' }).eq('user_id', userId).eq('verified', true)
      ]);

      const totalRevenue = conversions.data?.reduce((sum, conv) => sum + (Number(conv.revenue) || 0), 0) || 0;

      return {
        products: products.count || 0,
        articles: articles.count || 0,
        posts: posts.count || 0,
        clicks: clicks.count || 0,
        views: views.count || 0,
        conversions: conversions.count || 0,
        revenue: totalRevenue
      };
    } catch (error) {
      console.error("Failed to get user stats:", error);
      return {
        products: 0,
        articles: 0,
        posts: 0,
        clicks: 0,
        views: 0,
        conversions: 0,
        revenue: 0
      };
    }
  }
}