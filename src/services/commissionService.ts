import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Commission = Database["public"]["Tables"]["commissions"]["Row"];
type CommissionInsert = Database["public"]["Tables"]["commissions"]["Insert"];

export const commissionService = {
  // Record a new commission
  async recordCommission(data: {
    link_id: string;
    amount: number;
    product_name: string;
    network: string;
    transaction_id?: string;
    customer_id?: string;
  }): Promise<{ commission: Commission | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { commission: null, error: "User not authenticated" };
      }

      const insertData: CommissionInsert = {
        user_id: user.id,
        link_id: data.link_id,
        amount: data.amount,
        product_name: data.product_name,
        network: data.network,
        transaction_id: data.transaction_id || null,
        customer_id: data.customer_id || null,
        status: "pending"
      };

      const { data: commission, error } = await supabase
        .from("commissions")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Error recording commission:", error);
        return { commission: null, error: error.message };
      }

      // Update link conversion count and revenue
      const { data: link } = await supabase
        .from("affiliate_links")
        .select("conversions, revenue")
        .eq("id", data.link_id)
        .single();

      if (link) {
        await supabase
          .from("affiliate_links")
          .update({
            conversions: (link.conversions || 0) + 1,
            revenue: (link.revenue || 0) + data.amount
          })
          .eq("id", data.link_id);
      }

      return { commission, error: null };
    } catch (err) {
      console.error("Unexpected error:", err);
      return { commission: null, error: "Failed to record commission" };
    }
  },

  // Get all commissions for current user
  async getUserCommissions(filters?: {
    status?: "pending" | "approved" | "paid" | "rejected";
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ commissions: Commission[]; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { commissions: [], error: "User not authenticated" };
      }

      let query = supabase
        .from("commissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching commissions:", error);
        return { commissions: [], error: error.message };
      }

      return { commissions: data || [], error: null };
    } catch (err) {
      console.error("Unexpected error:", err);
      return { commissions: [], error: "Failed to fetch commissions" };
    }
  },

  // Get commission summary/stats
  async getCommissionStats(): Promise<{
    total_pending: number;
    total_approved: number;
    total_paid: number;
    total_earnings: number;
    this_month: number;
    error: string | null;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          total_pending: 0,
          total_approved: 0,
          total_paid: 0,
          total_earnings: 0,
          this_month: 0,
          error: "User not authenticated"
        };
      }

      const { data: commissions } = await supabase
        .from("commissions")
        .select("amount, status, created_at")
        .eq("user_id", user.id);

      if (!commissions) {
        return {
          total_pending: 0,
          total_approved: 0,
          total_paid: 0,
          total_earnings: 0,
          this_month: 0,
          error: null
        };
      }

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats = commissions.reduce((acc, comm) => {
        const amount = Number(comm.amount) || 0;
        
        if (comm.status === "pending") acc.total_pending += amount;
        if (comm.status === "approved") acc.total_approved += amount;
        if (comm.status === "paid") acc.total_paid += amount;
        
        acc.total_earnings += amount;

        if (new Date(comm.created_at || "") >= firstDayOfMonth) {
          acc.this_month += amount;
        }

        return acc;
      }, {
        total_pending: 0,
        total_approved: 0,
        total_paid: 0,
        total_earnings: 0,
        this_month: 0
      });

      return { ...stats, error: null };
    } catch (err) {
      console.error("Unexpected error:", err);
      return {
        total_pending: 0,
        total_approved: 0,
        total_paid: 0,
        total_earnings: 0,
        this_month: 0,
        error: "Failed to fetch stats"
      };
    }
  },

  // Update commission status (admin function in real app)
  async updateCommissionStatus(commissionId: string, status: "approved" | "paid" | "rejected"): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      const updateData: { status: string; paid_date?: string } = { status };
      
      if (status === "paid") {
        updateData.paid_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from("commissions")
        .update(updateData)
        .eq("id", commissionId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Failed to update commission" };
    }
  }
};