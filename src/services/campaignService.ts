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

      // 1. Get real daily performance history
      const { data: dailyData } = await supabase
        .from("campaign_performance")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("date", { ascending: true })
        .limit(30);

      const dailyPerformance = dailyData?.map(d => ({
        date: d.date,
        revenue: Number(d.revenue) || 0,
        spent: Number(d.spent) || 0,
        clicks: d.clicks || 0,
        conversions: d.conversions || 0
      })) || [];

      // 2. Get real top products from affiliate links
      // Cast to any to avoid deep type instantiation issues with joins
      const { data: productStats } = await (supabase.from("affiliate_links") as any)
        .select("product_name, conversion_count, commission_earned")
        .eq("campaign_id", campaignId)
        .order("commission_earned", { ascending: false })
        .limit(5);

      const topProducts = productStats?.map((p: any) => ({
        product: p.product_name || "Unknown Product",
        revenue: Number(p.commission_earned) || 0,
        conversions: p.conversion_count || 0
      })) || [];

      // 3. Get real top channels from traffic sources
      const { data: channelStats } = await supabase
        .from("traffic_sources")
        .select("name, visitors, conversions")
        .eq("campaign_id", campaignId)
        .order("conversions", { ascending: false })
        .limit(5);

      const topChannels = channelStats?.map(c => ({
        channel: c.name,
        clicks: c.visitors || 0,
        conversions: c.conversions || 0
      })) || [];

      // 4. Calculate aggregate metrics
      const totalRevenue = dailyPerformance.reduce((sum, d) => sum + d.revenue, 0);
      const totalSpent = dailyPerformance.reduce((sum, d) => sum + d.spent, 0);
      const totalConversions = dailyPerformance.reduce((sum, d) => sum + d.conversions, 0);
      const totalClicks = dailyPerformance.reduce((sum, d) => sum + d.clicks, 0);

      const metrics: CampaignMetrics = {
        impressions: dailyPerformance.reduce((sum, d) => sum + (d.impressions || 0), 0),
        clicks: totalClicks,
        conversions: totalConversions,
        revenue: totalRevenue,
        spent: totalSpent,
        roi: totalSpent > 0 ? (totalRevenue - totalSpent) / totalSpent : 0,
        ctr: 0, // Need impressions for this
        conversionRate: totalClicks > 0 ? totalConversions / totalClicks : 0,
        cpa: totalConversions > 0 ? totalSpent / totalConversions : 0,
        roas: totalSpent > 0 ? totalRevenue / totalSpent : 0
      };

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
  },

  // Helper method for UI components that expect a direct array
  async listCampaigns(): Promise<Campaign[]> {
    const { campaigns } = await this.getUserCampaigns();
    return campaigns;
  }
};