import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];

export const campaignService = {
  // Create a new campaign
  async createCampaign(data: {
    name: string;
    goal: string;
    budget: number;
    duration_days: number;
    target_audience?: string;
    content_strategy?: string;
    products: string[];
    channels: string[];
  }): Promise<{ campaign: Campaign | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { campaign: null, error: "User not authenticated" };
      }

      // Calculate end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + data.duration_days);

      const insertData: CampaignInsert = {
        user_id: user.id,
        name: data.name,
        goal: data.goal,
        status: "active",
        budget: data.budget,
        spent: 0,
        revenue: 0,
        clicks: 0,
        conversions: 0,
        target_audience: data.target_audience || null,
        content_strategy: data.content_strategy || null,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString()
      };

      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert(insertData)
        .select()
        .single();

      if (campaignError) {
        console.error("Error creating campaign:", campaignError);
        return { campaign: null, error: campaignError.message };
      }

      // Insert products
      if (data.products.length > 0) {
        const productInserts = data.products.map(product => ({
          campaign_id: campaign.id,
          product_name: product
        }));

        await supabase.from("campaign_products").insert(productInserts);
      }

      // Insert channels
      if (data.channels.length > 0) {
        const channelInserts = data.channels.map(channel => ({
          campaign_id: campaign.id,
          channel_type: channel,
          is_active: true
        }));

        await supabase.from("campaign_channels").insert(channelInserts);
      }

      return { campaign, error: null };
    } catch (err) {
      console.error("Unexpected error:", err);
      return { campaign: null, error: "Failed to create campaign" };
    }
  },

  // Get all campaigns for current user
  async getUserCampaigns(): Promise<{ campaigns: Campaign[]; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { campaigns: [], error: "User not authenticated" };
      }

      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching campaigns:", error);
        return { campaigns: [], error: error.message };
      }

      return { campaigns: data || [], error: null };
    } catch (err) {
      console.error("Unexpected error:", err);
      return { campaigns: [], error: "Failed to fetch campaigns" };
    }
  },

  // Get campaign details with products and channels
  async getCampaignDetails(campaignId: string): Promise<{
    campaign: Campaign | null;
    products: string[];
    channels: string[];
    error: string | null;
  }> {
    try {
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (campaignError) {
        return { campaign: null, products: [], channels: [], error: campaignError.message };
      }

      // Get products
      const { data: productData } = await supabase
        .from("campaign_products")
        .select("product_name")
        .eq("campaign_id", campaignId);

      const products = productData?.map(p => p.product_name) || [];

      // Get channels
      const { data: channelData } = await supabase
        .from("campaign_channels")
        .select("channel_type")
        .eq("campaign_id", campaignId);

      const channels = channelData?.map(c => c.channel_type) || [];

      return { campaign, products, channels, error: null };
    } catch (err) {
      return { campaign: null, products: [], channels: [], error: "Failed to fetch campaign details" };
    }
  },

  // Update campaign status
  async updateCampaignStatus(campaignId: string, status: "active" | "paused" | "completed"): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ status })
        .eq("id", campaignId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Failed to update campaign" };
    }
  },

  // Update campaign metrics (called when conversions happen)
  async updateCampaignMetrics(campaignId: string, metrics: {
    clicks?: number;
    conversions?: number;
    revenue?: number;
    spent?: number;
  }): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("clicks, conversions, revenue, spent")
        .eq("id", campaignId)
        .single();

      if (!campaign) {
        return { success: false, error: "Campaign not found" };
      }

      const updates = {
        clicks: (campaign.clicks || 0) + (metrics.clicks || 0),
        conversions: (campaign.conversions || 0) + (metrics.conversions || 0),
        revenue: (campaign.revenue || 0) + (metrics.revenue || 0),
        spent: (campaign.spent || 0) + (metrics.spent || 0)
      };

      const { error } = await supabase
        .from("campaigns")
        .update(updates)
        .eq("id", campaignId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Failed to update metrics" };
    }
  }
};