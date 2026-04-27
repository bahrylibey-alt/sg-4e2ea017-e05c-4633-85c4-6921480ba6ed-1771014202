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
 * - Articles: generated_content (status = 'published')
 * - Posts: posted_content (status = 'posted')
 * - Clicks: click_events table
 * - Views: view_events table
 * - Conversions: conversion_events (verified = true)
 * - Revenue: sum of conversion_events.revenue (verified = true)
 */
export class UnifiedStatsService {
  /**
   * Get real-time stats from database
   * Returns actual data, never mock/demo data
   * FAILS GRACEFULLY - returns zeros if database unreachable
   */
  static async getStats(): Promise<UnifiedStats> {
    try {
      console.log("🔍 UnifiedStatsService: Fetching stats from database...");
      
      // Run all queries in parallel for speed
      const [
        productsResult,
        articlesResult,
        postsResult,
        clicksResult,
        viewsResult,
        conversionsResult
      ] = await Promise.all([
        supabase.from('affiliate_links').select('id', { count: 'exact', head: true }).timeout(5000),
        supabase.from('generated_content').select('id', { count: 'exact', head: true }).eq('status', 'published').timeout(5000),
        supabase.from('posted_content').select('id', { count: 'exact', head: true }).eq('status', 'posted').timeout(5000),
        supabase.from('click_events').select('id', { count: 'exact', head: true }).timeout(5000),
        supabase.from('view_events').select('id', { count: 'exact', head: true }).timeout(5000),
        supabase.from('conversion_events').select('revenue').eq('verified', true).timeout(5000)
      ].map(p => p.catch(err => {
        console.warn("Query failed:", err);
        return { data: null, error: err, count: 0 };
      })));

      // Log results for debugging
      console.log("📊 Query results:", {
        products: productsResult.count,
        articles: articlesResult.count,
        posts: postsResult.count,
        clicks: clicksResult.count,
        views: viewsResult.count,
        conversions: conversionsResult.data?.length
      });

      // Calculate total revenue
      const totalRevenue = conversionsResult.data?.reduce((sum, conv) => {
        const revenue = Number(conv.revenue) || 0;
        return sum + revenue;
      }, 0) || 0;

      const stats: UnifiedStats = {
        products: productsResult.count || 0,
        articles: articlesResult.count || 0,
        posts: postsResult.count || 0,
        clicks: clicksResult.count || 0,
        views: viewsResult.count || 0,
        conversions: conversionsResult.data?.length || 0,
        revenue: totalRevenue
      };

      console.log("✅ Final stats:", stats);
      return stats;
      
    } catch (error) {
      console.error("❌ UnifiedStatsService error:", error);
      console.warn("Returning zeros - database may be unreachable");
      
      // Return zeros on error - page still loads
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

  /**
   * Get stats for a specific user
   */
  static async getStatsForUser(userId: string): Promise<UnifiedStats> {
    try {
      console.log(`🔍 UnifiedStatsService: Fetching stats for user ${userId}...`);
      
      const [
        productsResult,
        articlesResult,
        postsResult,
        clicksResult,
        viewsResult,
        conversionsResult
      ] = await Promise.all([
        supabase.from('affiliate_links').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('generated_content').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'published'),
        supabase.from('posted_content').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'posted'),
        supabase.from('click_events').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('view_events').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('conversion_events').select('revenue').eq('user_id', userId).eq('verified', true)
      ]);

      const totalRevenue = conversionsResult.data?.reduce((sum, conv) => {
        const revenue = Number(conv.revenue) || 0;
        return sum + revenue;
      }, 0) || 0;

      const stats: UnifiedStats = {
        products: productsResult.count || 0,
        articles: articlesResult.count || 0,
        posts: postsResult.count || 0,
        clicks: clicksResult.count || 0,
        views: viewsResult.count || 0,
        conversions: conversionsResult.data?.length || 0,
        revenue: totalRevenue
      };

      console.log(`✅ User ${userId} stats:`, stats);
      return stats;
      
    } catch (error) {
      console.error(`❌ UnifiedStatsService error for user ${userId}:`, error);
      
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