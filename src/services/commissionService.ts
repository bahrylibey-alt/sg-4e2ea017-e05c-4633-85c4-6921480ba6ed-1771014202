import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Commission = Database["public"]["Tables"]["commissions"]["Row"];
type CommissionInsert = Database["public"]["Tables"]["commissions"]["Insert"];

export interface CommissionCalculation {
  affiliateLinkId: string;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  processingFee?: number;
  netCommission: number;
}

export const commissionService = {
  /**
   * Calculate commission for a sale
   */
  calculateCommission(saleAmount: number, commissionRate: number = 0.40): CommissionCalculation {
    const commissionAmount = saleAmount * commissionRate;
    const processingFee = commissionAmount * 0.029 + 0.30; // Stripe fees
    const netCommission = commissionAmount - processingFee;

    return {
      affiliateLinkId: "",
      saleAmount,
      commissionRate,
      commissionAmount,
      processingFee,
      netCommission
    };
  },

  /**
   * Record a commission (REAL database operation)
   */
  async recordCommission(
    userId: string,
    affiliateLinkId: string,
    saleAmount: number,
    commissionRate: number = 0.40
  ): Promise<{ success: boolean; commission: Commission | null; error: string | null }> {
    try {
      const calc = this.calculateCommission(saleAmount, commissionRate);

      const { data, error } = await supabase
        .from("commissions")
        .insert({
          user_id: userId,
          affiliate_link_id: affiliateLinkId,
          sale_amount: saleAmount,
          commission_rate: commissionRate,
          commission_amount: calc.commissionAmount,
          processing_fee: calc.processingFee,
          net_commission: calc.netCommission,
          status: "pending",
          commission_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error("Commission record error:", error);
        return { success: false, commission: null, error: error.message };
      }

      console.log(`✅ Commission recorded: $${calc.netCommission.toFixed(2)}`);
      return { success: true, commission: data, error: null };

    } catch (err) {
      console.error("Record commission error:", err);
      return {
        success: false,
        commission: null,
        error: err instanceof Error ? err.message : "Failed to record commission"
      };
    }
  },

  /**
   * Get user's commissions
   */
  async getUserCommissions(userId: string, status?: string): Promise<{
    commissions: Commission[];
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
    error: string | null;
  }> {
    try {
      let query = supabase
        .from("commissions")
        .select("*")
        .eq("user_id", userId)
        .order("commission_date", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        return {
          commissions: [],
          totalEarned: 0,
          totalPending: 0,
          totalPaid: 0,
          error: error.message
        };
      }

      const commissions = data || [];
      const totalEarned = commissions.reduce((sum, c) => sum + (Number(c.net_commission) || 0), 0);
      const totalPending = commissions
        .filter(c => c.status === "pending")
        .reduce((sum, c) => sum + (Number(c.net_commission) || 0), 0);
      const totalPaid = commissions
        .filter(c => c.status === "paid")
        .reduce((sum, c) => sum + (Number(c.net_commission) || 0), 0);

      return {
        commissions,
        totalEarned,
        totalPending,
        totalPaid,
        error: null
      };

    } catch (err) {
      console.error("Get commissions error:", err);
      return {
        commissions: [],
        totalEarned: 0,
        totalPending: 0,
        totalPaid: 0,
        error: "Failed to fetch commissions"
      };
    }
  },

  /**
   * Update commission status
   */
  async updateCommissionStatus(
    commissionId: string,
    status: "pending" | "approved" | "paid" | "rejected",
    paidDate?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const updates: any = { status };
      if (status === "paid" && paidDate) {
        updates.paid_date = paidDate;
      }

      const { error } = await supabase
        .from("commissions")
        .update(updates)
        .eq("id", commissionId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };

    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update status"
      };
    }
  },

  /**
   * Generate commission for a conversion (automated)
   */
  async generateCommissionFromConversion(
    affiliateLinkId: string,
    saleAmount: number
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get affiliate link to find user
      const { data: link } = await supabase
        .from("affiliate_links")
        .select("user_id")
        .eq("id", affiliateLinkId)
        .single();

      if (!link) {
        return { success: false, error: "Affiliate link not found" };
      }

      // Record commission
      const result = await this.recordCommission(
        link.user_id,
        affiliateLinkId,
        saleAmount
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Update affiliate link conversion count
      const { data: currentLink } = await supabase
        .from("affiliate_links")
        .select("conversions, total_revenue")
        .eq("id", affiliateLinkId)
        .single();

      if (currentLink) {
        await supabase
          .from("affiliate_links")
          .update({
            conversions: (currentLink.conversions || 0) + 1,
            total_revenue: (Number(currentLink.total_revenue) || 0) + saleAmount
          })
          .eq("id", affiliateLinkId);
      }

      return { success: true, error: null };

    } catch (err) {
      console.error("Generate commission error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to generate commission"
      };
    }
  },

  /**
   * Get commission summary statistics
   */
  async getCommissionStats(userId: string): Promise<{
    totalEarnings: number;
    pendingCommissions: number;
    paidCommissions: number;
    conversionRate: number;
    avgCommissionAmount: number;
    error: string | null;
  }> {
    try {
      const { commissions, error } = await this.getUserCommissions(userId);

      if (error) {
        return {
          totalEarnings: 0,
          pendingCommissions: 0,
          paidCommissions: 0,
          conversionRate: 0,
          avgCommissionAmount: 0,
          error
        };
      }

      const totalEarnings = commissions.reduce((sum, c) => sum + (Number(c.net_commission) || 0), 0);
      const pendingCommissions = commissions.filter(c => c.status === "pending").length;
      const paidCommissions = commissions.filter(c => c.status === "paid").length;
      const avgCommissionAmount = commissions.length > 0
        ? totalEarnings / commissions.length
        : 0;

      // Get click count for conversion rate
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("clicks, conversions")
        .eq("user_id", userId);

      const totalClicks = links?.reduce((sum, l) => sum + (l.clicks || 0), 0) || 0;
      const totalConversions = links?.reduce((sum, l) => sum + (l.conversions || 0), 0) || 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      return {
        totalEarnings,
        pendingCommissions,
        paidCommissions,
        conversionRate,
        avgCommissionAmount,
        error: null
      };

    } catch (err) {
      console.error("Get commission stats error:", err);
      return {
        totalEarnings: 0,
        pendingCommissions: 0,
        paidCommissions: 0,
        conversionRate: 0,
        avgCommissionAmount: 0,
        error: "Failed to fetch stats"
      };
    }
  }
};