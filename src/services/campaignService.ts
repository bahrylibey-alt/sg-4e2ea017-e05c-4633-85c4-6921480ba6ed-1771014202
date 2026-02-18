import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  spent: number;
  roi: number;
  ctr: number;
  conversionRate: number;
  cpa: number;
  roas: number;
}

export interface CampaignPerformance {
  campaign: Campaign;
  metrics: CampaignMetrics;
  topProducts: Array<{ product: string; revenue: number; conversions: number }>;
  topChannels: Array<{ channel: string; clicks: number; conversions: number }>;
  dailyPerformance: Array<{ date: string; revenue: number; spent: number }>;
}

export const campaignService = {
  // Create a new campaign with enhanced validation
  async createCampaign(data: {
    name: string;
    goal: "sales" | "leads" | "traffic" | "awareness";
    budget: number;
    duration_days: number;
    target_audience?: string;
    content_strategy?: string;
    products: string[];
    channels: Array<{ id: string; name: string }>;
  }): Promise<{ campaign: Campaign | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { campaign: null, error: "User not authenticated" };
      }

      // Validate input
      if (!data.name || data.name.trim().length === 0) {
        return { campaign: null, error: "Campaign name is required" };
      }
      if (data.budget <= 0) {
        return { campaign: null, error: "Budget must be greater than 0" };
      }
      if (data.duration_days <= 0) {
        return { campaign: null, error: "Duration must be greater than 0" };
      }

      // Calculate end date
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + data.duration_days);

      const insertData: CampaignInsert = {
        user_id: user.id,
        name: data.name.trim(),
        goal: data.goal,
        status: "active",
        budget: data.budget,
        spent: 0,
        revenue: 0,
        duration_days: data.duration_days,
        target_audience: data.target_audience || null,
        content_strategy: data.content_strategy || null,
        start_date: startDate.toISOString(),
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

        const { error: productError } = await supabase
          .from("campaign_products")
          .insert(productInserts);

        if (productError) {
          console.error("Error inserting products:", productError);
        }
      }

      // Insert channels
      if (data.channels.length > 0) {
        const channelInserts = data.channels.map(channel => ({
          campaign_id: campaign.id,
          channel_id: channel.id,
          channel_name: channel.name
        }));

        const { error: channelError } = await supabase
          .from("campaign_channels")
          .insert(channelInserts);

        if (channelError) {
          console.error("Error inserting channels:", channelError);
        }
      }

      console.log("Campaign created successfully:", campaign);
      return { campaign, error: null };
    } catch (err) {
      console.error("Unexpected error creating campaign:", err);
      return { campaign: null, error: "Failed to create campaign" };
    }
  },

  // Get all campaigns for current user with filtering
  async getUserCampaigns(filters?: {
    status?: "active" | "paused" | "completed" | "draft";
    goal?: "sales" | "leads" | "traffic" | "awareness";
    minBudget?: number;
    maxBudget?: number;
  }): Promise<{ campaigns: Campaign[]; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { campaigns: [], error: "User not authenticated" };
      }

      let query = supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id);

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.goal) {
        query = query.eq("goal", filters.goal);
      }
      if (filters?.minBudget !== undefined) {
        query = query.gte("budget", filters.minBudget);
      }
      if (filters?.maxBudget !== undefined) {
        query = query.lte("budget", filters.maxBudget);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

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
    channels: Array<{ id: string; name: string }>;
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
        .select("channel_id, channel_name")
        .eq("campaign_id", campaignId);

      const channels = channelData?.map(c => ({ id: c.channel_id, name: c.channel_name })) || [];

      return { campaign, products, channels, error: null };
    } catch (err) {
      return { campaign: null, products: [], channels: [], error: "Failed to fetch campaign details" };
    }
  },

  // Get comprehensive campaign performance
  async getCampaignPerformance(campaignId: string): Promise<CampaignPerformance | null> {
    try {
      const { campaign, products, channels } = await this.getCampaignDetails(campaignId);
      
      if (!campaign) return null;

      // Calculate metrics
      const metrics: CampaignMetrics = {
        impressions: 0, // Would come from ad platforms
        clicks: 0,
        conversions: campaign.revenue ? Math.floor(campaign.revenue / 50) : 0, // Assume $50 avg
        revenue: campaign.revenue || 0,
        spent: campaign.spent || 0,
        roi: campaign.spent && campaign.spent > 0 
          ? ((campaign.revenue || 0) - campaign.spent) / campaign.spent 
          : 0,
        ctr: 0, // Would calculate from actual data
        conversionRate: 0, // Would calculate from actual data
        cpa: campaign.spent && campaign.revenue 
          ? campaign.spent / Math.max(1, Math.floor(campaign.revenue / 50))
          : 0,
        roas: campaign.spent && campaign.spent > 0 
          ? (campaign.revenue || 0) / campaign.spent 
          : 0
      };

      // Mock top products (would be from actual data)
      const topProducts = products.slice(0, 3).map(product => ({
        product,
        revenue: Math.random() * (campaign.revenue || 0),
        conversions: Math.floor(Math.random() * 10)
      }));

      // Mock top channels (would be from actual data)
      const topChannels = channels.slice(0, 3).map(channel => ({
        channel: channel.name,
        clicks: Math.floor(Math.random() * 1000),
        conversions: Math.floor(Math.random() * 50)
      }));

      // Mock daily performance (last 7 days)
      const dailyPerformance = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split("T")[0],
          revenue: Math.random() * ((campaign.revenue || 0) / 7),
          spent: Math.random() * ((campaign.spent || 0) / 7)
        };
      });

      return {
        campaign,
        metrics,
        topProducts,
        topChannels,
        dailyPerformance
      };
    } catch (err) {
      console.error("Performance error:", err);
      return null;
    }
  },

  // Update campaign status
  async updateCampaignStatus(campaignId: string, status: "active" | "paused" | "completed" | "draft"): Promise<{
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

  // Bulk update campaign status
  async bulkUpdateStatus(campaignIds: string[], status: "active" | "paused" | "completed" | "draft"): Promise<{
    success: boolean;
    updated: number;
    error: string | null;
  }> {
    try {
      const { error, count } = await supabase
        .from("campaigns")
        .update({ status })
        .in("id", campaignIds);

      if (error) {
        return { success: false, updated: 0, error: error.message };
      }

      return { success: true, updated: count || 0, error: null };
    } catch (err) {
      return { success: false, updated: 0, error: "Bulk update failed" };
    }
  },

  // Update campaign metrics (called when conversions happen)
  async updateCampaignMetrics(campaignId: string, metrics: {
    revenue?: number;
    spent?: number;
  }): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("revenue, spent")
        .eq("id", campaignId)
        .single();

      if (!campaign) {
        return { success: false, error: "Campaign not found" };
      }

      const updates = {
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
  },

  // Duplicate campaign
  async duplicateCampaign(campaignId: string, newName?: string): Promise<{
    campaign: Campaign | null;
    error: string | null;
  }> {
    try {
      const { campaign, products, channels } = await this.getCampaignDetails(campaignId);
      
      if (!campaign) {
        return { campaign: null, error: "Campaign not found" };
      }

      const duplicatedCampaign = await this.createCampaign({
        name: newName || `${campaign.name} (Copy)`,
        goal: campaign.goal,
        budget: campaign.budget || 0,
        duration_days: campaign.duration_days || 30,
        target_audience: campaign.target_audience || undefined,
        content_strategy: campaign.content_strategy || undefined,
        products,
        channels
      });

      return duplicatedCampaign;
    } catch (err) {
      return { campaign: null, error: "Failed to duplicate campaign" };
    }
  },

  // Delete campaign
  async deleteCampaign(campaignId: string): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      // Delete related data first
      await supabase.from("campaign_products").delete().eq("campaign_id", campaignId);
      await supabase.from("campaign_channels").delete().eq("campaign_id", campaignId);

      // Delete campaign
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Failed to delete campaign" };
    }
  },

  // Get campaign statistics summary
  async getCampaignStats(): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalRevenue: number;
    totalSpent: number;
    avgROI: number;
    error: string | null;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalRevenue: 0,
          totalSpent: 0,
          avgROI: 0,
          error: "User not authenticated"
        };
      }

      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id);

      if (!campaigns) {
        return {
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalRevenue: 0,
          totalSpent: 0,
          avgROI: 0,
          error: null
        };
      }

      const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
      const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
      const avgROI = totalSpent > 0 ? (totalRevenue - totalSpent) / totalSpent : 0;

      return {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === "active").length,
        totalRevenue,
        totalSpent,
        avgROI,
        error: null
      };
    } catch (err) {
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalRevenue: 0,
        totalSpent: 0,
        avgROI: 0,
        error: "Failed to fetch stats"
      };
    }
  }
};