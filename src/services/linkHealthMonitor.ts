import { supabase } from "@/integrations/supabase/client";

export const linkHealthMonitor = {
  /**
   * New Smart Auto-Repair
   * Calls the backend API that uses Googlebot spoofing to actually verify 404s and bypass CAPTCHAs.
   */
  async oneClickAutoRepair(campaignId?: string, userId?: string) {
    try {
      console.log("Initiating Deep Smart Repair...");
      
      // We must have user_id to replace links
      let uid = userId;
      if (!uid) {
        const { data: { session } } = await supabase.auth.getSession();
        uid = session?.user?.id;
      }
      
      const response = await fetch('/api/smart-repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, campaignId })
      });
      
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error || "Repair failed");

      return {
        success: true,
        totalChecked: result.totalChecked || 0,
        invalidRemoved: result.deadRemoved || 0,
        duplicatesRemoved: 0,
        repaired: result.replaced || 0,
        replaced: result.replaced || 0,
        details: {
          invalidLinks: result.deadLinks || []
        }
      };
    } catch (error: any) {
      console.error("Smart Auto-Repair failed:", error);
      return {
        success: false,
        totalChecked: 0,
        invalidRemoved: 0,
        duplicatesRemoved: 0,
        repaired: 0,
        replaced: 0,
        details: { error: error.message }
      };
    }
  },

  async checkCampaignHealth(campaignId: string) {
    try {
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("status", "active");

      if (!links) return { healthScore: 100, activeLinks: 0, brokenLinks: 0, metrics: {} };

      return {
        healthScore: 100, // We assume 100 until smart repair runs
        activeLinks: links.length,
        brokenLinks: 0,
        metrics: {
          amazon: { total: links.filter(l => l.network.includes("Amazon")).length, valid: links.filter(l => l.network.includes("Amazon")).length },
          temu: { total: links.filter(l => l.network.includes("Temu")).length, valid: links.filter(l => l.network.includes("Temu")).length },
          aliexpress: { total: links.filter(l => l.network.includes("AliExpress")).length, valid: links.filter(l => l.network.includes("AliExpress")).length }
        }
      };
    } catch (error) {
      console.error("Health check failed:", error);
      return { 
        healthScore: 0, 
        activeLinks: 0, 
        brokenLinks: 0, 
        metrics: {
          amazon: { total: 0, valid: 0 },
          temu: { total: 0, valid: 0 },
          aliexpress: { total: 0, valid: 0 }
        }
      };
    }
  }
};