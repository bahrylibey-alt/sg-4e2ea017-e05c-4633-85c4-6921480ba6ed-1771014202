import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AffiliateLink = Database["public"]["Tables"]["affiliate_links"]["Row"];
type AffiliateLinkInsert = Database["public"]["Tables"]["affiliate_links"]["Insert"];

export interface LinkPerformance {
  linkId: string;
  productName: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  status: string;
}

export const affiliateLinkService = {
  /**
   * Create new affiliate link
   */
  async createLink(linkData: {
    originalUrl: string;
    productName?: string;
    network?: string;
    campaignId?: string;
    commissionRate?: number;
  }): Promise<{ success: boolean; link: AffiliateLink | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, link: null, error: "Not authenticated" };
      }

      const slug = this.generateSlug();
      
      // CRITICAL FIX: Use actual domain from environment or window.location
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_APP_URL || 'https://sale-makseb.vercel.app';
      
      const cloakedUrl = `${baseUrl}/go/${slug}`;

      const insert: AffiliateLinkInsert = {
        user_id: user.id,
        original_url: linkData.originalUrl,
        cloaked_url: cloakedUrl,
        slug: slug,
        product_name: linkData.productName,
        network: linkData.network,
        campaign_id: linkData.campaignId,
        commission_rate: linkData.commissionRate || 15,
        status: "active",
        clicks: 0,
        conversions: 0,
        revenue: 0,
        click_count: 0,
        conversion_count: 0,
        commission_earned: 0,
        is_working: true,
        check_failures: 0
      };

      const { data, error } = await (supabase as any).from("affiliate_links")
        .insert(insert)
        .select()
        .single();

      if (error) {
        console.error("❌ Create link error:", error);
        return { success: false, link: null, error: error.message };
      }

      return { success: true, link: data, error: null };
    } catch (err) {
      console.error("💥 Create link failed:", err);
      return { success: false, link: null, error: "Failed to create link" };
    }
  },

  /**
   * Get all links for user
   */
  async getUserLinks(userId?: string): Promise<{
    links: AffiliateLink[];
    error: string | null;
  }> {
    try {
      let query = (supabase as any).from("affiliate_links")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.eq("user_id", user.id);
        }
      }

      const { data, error } = await query;

      if (error) {
        return { links: [], error: error.message };
      }

      return { links: data || [], error: null };
    } catch (err) {
      return { links: [], error: "Failed to fetch links" };
    }
  },

  /**
   * Get links for campaign
   */
  async getCampaignLinks(campaignId: string): Promise<{
    links: AffiliateLink[];
    error: string | null;
  }> {
    try {
      const { data, error } = await (supabase as any).from("affiliate_links")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("clicks", { ascending: false });

      if (error) {
        return { links: [], error: error.message };
      }

      return { links: data || [], error: null };
    } catch (err) {
      return { links: [], error: "Failed to fetch campaign links" };
    }
  },

  /**
   * Track link click
   */
  async trackClick(slug: string): Promise<{
    success: boolean;
    redirectUrl: string | null;
    error: string | null;
  }> {
    try {
      const { data: link, error: fetchError } = await (supabase as any).from("affiliate_links")
        .select("*")
        .eq("slug", slug)
        .single();

      if (fetchError || !link) {
        return { success: false, redirectUrl: null, error: "Link not found" };
      }

      const { error: updateError } = await (supabase as any).from("affiliate_links")
        .update({
          clicks: (link.clicks || 0) + 1,
          click_count: (link.click_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", link.id);

      if (updateError) {
        console.error("❌ Click tracking error:", updateError);
      }

      return { 
        success: true, 
        redirectUrl: link.original_url, 
        error: null 
      };
    } catch (err) {
      console.error("💥 Track click failed:", err);
      return { success: false, redirectUrl: null, error: "Tracking failed" };
    }
  },

  /**
   * Track conversion
   */
  async trackConversion(linkId: string, amount: number): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      const { data: link, error: fetchError } = await (supabase as any).from("affiliate_links")
        .select("*")
        .eq("id", linkId)
        .single();

      if (fetchError || !link) {
        return { success: false, error: "Link not found" };
      }

      const commissionRate = link.commission_rate || 15;
      const commission = amount * (commissionRate / 100);

      const { error: updateError } = await (supabase as any).from("affiliate_links")
        .update({
          conversions: (link.conversions || 0) + 1,
          conversion_count: (link.conversion_count || 0) + 1,
          revenue: (link.revenue || 0) + amount,
          commission_earned: (link.commission_earned || 0) + commission,
          updated_at: new Date().toISOString()
        })
        .eq("id", linkId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      await (supabase as any).from("commissions")
        .insert({
          user_id: link.user_id,
          link_id: linkId,
          amount: amount,
          commission_rate: commissionRate,
          commission_amount: commission,
          status: "pending",
          order_date: new Date().toISOString()
        });

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Conversion tracking failed" };
    }
  },

  /**
   * Get link performance
   */
  async getLinkPerformance(campaignId?: string): Promise<{
    performance: LinkPerformance[];
    error: string | null;
  }> {
    try {
      let query = (supabase as any).from("affiliate_links")
        .select("*");

      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }

      const { data: links, error } = await query.order("clicks", { ascending: false });

      if (error) {
        return { performance: [], error: error.message };
      }

      const performance: LinkPerformance[] = (links || []).map(link => ({
        linkId: link.id,
        productName: link.product_name || "Unknown",
        clicks: link.clicks || 0,
        conversions: link.conversions || 0,
        revenue: Number(link.revenue || 0),
        conversionRate: link.clicks > 0 
          ? ((link.conversions || 0) / link.clicks) * 100 
          : 0,
        status: link.status || "active"
      }));

      return { performance, error: null };
    } catch (err) {
      return { performance: [], error: "Failed to get performance data" };
    }
  },

  /**
   * Update link status
   */
  async updateLinkStatus(linkId: string, status: "active" | "paused" | "archived"): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      const { error } = await (supabase as any).from("affiliate_links")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", linkId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Status update failed" };
    }
  },

  /**
   * Delete link
   */
  async deleteLink(linkId: string): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      const { error } = await (supabase as any).from("affiliate_links")
        .delete()
        .eq("id", linkId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Delete failed" };
    }
  },

  /**
   * Generate random slug
   */
  generateSlug(length: number = 6): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Bulk import links
   */
  async bulkImportLinks(links: Array<{
    originalUrl: string;
    productName?: string;
    network?: string;
    campaignId?: string;
  }>): Promise<{
    success: boolean;
    created: number;
    failed: number;
    error: string | null;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, created: 0, failed: 0, error: "Not authenticated" };
      }

      // CRITICAL FIX: Use actual domain
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_APP_URL || 'https://sale-makseb.vercel.app';

      const inserts: AffiliateLinkInsert[] = links.map(link => {
        const slug = this.generateSlug();
        return {
          user_id: user.id,
          original_url: link.originalUrl,
          cloaked_url: `${baseUrl}/go/${slug}`,
          slug: slug,
          product_name: link.productName,
          network: link.network,
          campaign_id: link.campaignId,
          status: "active",
          clicks: 0,
          conversions: 0,
          revenue: 0
        };
      });

      const { data, error } = await (supabase as any).from("affiliate_links")
        .insert(inserts)
        .select();

      if (error) {
        return { success: false, created: 0, failed: links.length, error: error.message };
      }

      return { 
        success: true, 
        created: data?.length || 0, 
        failed: links.length - (data?.length || 0),
        error: null 
      };
    } catch (err) {
      return { success: false, created: 0, failed: links.length, error: "Bulk import failed" };
    }
  }
};