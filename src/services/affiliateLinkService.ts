import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AffiliateLink = Database["public"]["Tables"]["affiliate_links"]["Row"];
type AffiliateLinkInsert = Database["public"]["Tables"]["affiliate_links"]["Insert"];

export const affiliateLinkService = {
  // Create a new affiliate link with automatic slug generation
  async createLink(data: {
    original_url: string;
    title: string;
    campaign_id?: string;
  }): Promise<{ link: AffiliateLink | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { link: null, error: "User not authenticated" };
      }

      // Generate unique slug
      const slug = this.generateSlug();

      const insertData: AffiliateLinkInsert = {
        user_id: user.id,
        original_url: data.original_url,
        slug,
        title: data.title,
        campaign_id: data.campaign_id || null,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        is_active: true
      };

      const { data: link, error } = await supabase
        .from("affiliate_links")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Error creating link:", error);
        return { link: null, error: error.message };
      }

      return { link, error: null };
    } catch (err) {
      console.error("Unexpected error:", err);
      return { link: null, error: "Failed to create link" };
    }
  },

  // Get all links for current user
  async getUserLinks(): Promise<{ links: AffiliateLink[]; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { links: [], error: "User not authenticated" };
      }

      const { data, error } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching links:", error);
        return { links: [], error: error.message };
      }

      return { links: data || [], error: null };
    } catch (err) {
      console.error("Unexpected error:", err);
      return { links: [], error: "Failed to fetch links" };
    }
  },

  // Track a click on an affiliate link
  async trackClick(slug: string, metadata?: {
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    country?: string;
    device?: string;
  }): Promise<{ success: boolean; redirect_url: string | null }> {
    try {
      // Get the link by slug
      const { data: link, error: linkError } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (linkError || !link) {
        console.error("Link not found:", linkError);
        return { success: false, redirect_url: null };
      }

      // Record click event
      const { error: clickError } = await supabase
        .from("click_events")
        .insert({
          link_id: link.id,
          ip_address: metadata?.ip_address || null,
          user_agent: metadata?.user_agent || null,
          referrer: metadata?.referrer || null,
          country: metadata?.country || null,
          device: metadata?.device || null
        });

      if (clickError) {
        console.error("Error tracking click:", clickError);
      }

      // Increment click count on link
      await supabase
        .from("affiliate_links")
        .update({ clicks: (link.clicks || 0) + 1 })
        .eq("id", link.id);

      return { success: true, redirect_url: link.original_url };
    } catch (err) {
      console.error("Unexpected error:", err);
      return { success: false, redirect_url: null };
    }
  },

  // Update link status
  async toggleLinkStatus(linkId: string, isActive: boolean): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from("affiliate_links")
        .update({ is_active: isActive })
        .eq("id", linkId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Failed to update link" };
    }
  },

  // Delete a link
  async deleteLink(linkId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from("affiliate_links")
        .delete()
        .eq("id", linkId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Failed to delete link" };
    }
  },

  // Generate random slug for short URL
  generateSlug(length: number = 8): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let slug = "";
    for (let i = 0; i < length; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return slug;
  },

  // Get cloaked URL for display
  getCloakedUrl(slug: string): string {
    // In production, this would use your actual domain
    return `${window.location.origin}/go/${slug}`;
  }
};