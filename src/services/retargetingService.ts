import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Types will need to be generated if retargeting_audiences table is new
// For now we map to standard table structure
interface RetargetingAudience {
  id: string;
  name: string;
  size: number;
  source: string;
  status: string;
}

export const retargetingService = {
  // REAL: Create new retargeting audience
  async createAudience(data: {
    name: string;
    source: "website_visitors" | "cart_abandoners" | "past_purchasers";
    duration_days: number;
    campaign_id: string;
  }): Promise<{ audience: RetargetingAudience | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { audience: null, error: "User not authenticated" };

      // In a real implementation we would define rules
      // For now we just create the audience container
      const { data: audience, error } = await supabase
        .from("retargeting_audiences")
        .insert({
          name: data.name,
          source: data.source,
          campaign_id: data.campaign_id,
          user_id: user.id,
          status: "collecting",
          size: 0,
          rules: { duration: data.duration_days }
        })
        .select()
        .single();

      if (error) {
        return { audience: null, error: error.message };
      }

      return { audience: audience as any, error: null };
    } catch (err) {
      return { audience: null, error: "Failed to create audience" };
    }
  },

  // REAL: Get audience insights
  async getAudienceInsights(campaignId: string): Promise<{
    totalReach: number;
    potentialRevenue: number;
    topSegments: string[];
    error: string | null;
  }> {
    try {
      const { data: audiences } = await supabase
        .from("retargeting_audiences")
        .select("*")
        .eq("campaign_id", campaignId);

      if (!audiences || audiences.length === 0) {
        return { totalReach: 0, potentialRevenue: 0, topSegments: [], error: null };
      }

      const totalReach = audiences.reduce((sum, a) => sum + (a.size || 0), 0);
      
      return {
        totalReach,
        potentialRevenue: totalReach * 0.15, // Approx $0.15 per retargeted user
        topSegments: audiences.map(a => a.name),
        error: null
      };
    } catch (err) {
      return { totalReach: 0, potentialRevenue: 0, topSegments: [], error: "Failed to fetch insights" };
    }
  }
};