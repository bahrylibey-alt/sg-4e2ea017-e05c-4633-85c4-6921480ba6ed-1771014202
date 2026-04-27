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
        supabase.from('affiliate_links').select('id', { count: 'exact', head: true }),
        supabase.from('generated_content').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('posted_content').select('id', { count: 'exact', head: true }).eq('status', 'posted'),
        supabase.from('click_events').select('id', { count: 'exact', head: true }),
        supabase.from('view_events').select('id', { count: 'exact', head: true }),
        supabase.from('conversion_events').select('revenue').eq('verified', true)
      ]);

      // Log results for debugging
      console.log("📊 Query results:", {
        products: productsResult.count,
        articles: articlesResult.count,
        posts: postsResult.count,
        clicks: clicksResult.count,
        views: viewsResult.count,
        conversions: conversionsResult.data?.length
      });

      // Check for errors
      if (productsResult.error) console.error("Products query error:", productsResult.error);
      if (articlesResult.error) console.error("Articles query error:", articlesResult.error);
      if (postsResult.error) console.error("Posts query error:", postsResult.error);
      if (clicksResult.error) console.error("Clicks query error:", clicksResult.error);
      if (viewsResult.error) console.error("Views query error:", viewsResult.error);
      if (conversionsResult.error) console.error("Conversions query error:", conversionsResult.error);

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
      
      // Return zeros on error (never use localStorage as fallback)
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