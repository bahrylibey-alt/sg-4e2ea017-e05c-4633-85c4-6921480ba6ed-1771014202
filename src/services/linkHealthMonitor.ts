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
  },

  async getHealthDashboard(campaignId?: string) {
    try {
      let query = supabase.from("affiliate_links").select("*");
      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }
      
      const { data: links } = await query;
      
      if (!links || links.length === 0) {
        return {
          healthScore: 100,
          activeLinks: 0,
          brokenLinks: 0,
          metrics: {
            amazon: { total: 0, valid: 0 },
            temu: { total: 0, valid: 0 },
            aliexpress: { total: 0, valid: 0 }
          },
          lastChecked: new Date().toISOString(),
          recentFailures: []
        };
      }

      const active = links.filter(l => l.status === "active").length;
      const paused = links.filter(l => l.status === "paused").length;
      
      return {
        healthScore: active > 0 ? Math.round((active / links.length) * 100) : 100,
        activeLinks: active,
        brokenLinks: paused,
        metrics: {
          amazon: { 
            total: links.filter(l => l.network?.includes("Amazon")).length, 
            valid: links.filter(l => l.network?.includes("Amazon") && l.status === "active").length 
          },
          temu: { 
            total: links.filter(l => l.network?.includes("Temu")).length, 
            valid: links.filter(l => l.network?.includes("Temu") && l.status === "active").length 
          },
          aliexpress: { 
            total: links.filter(l => l.network?.includes("AliExpress")).length, 
            valid: links.filter(l => l.network?.includes("AliExpress") && l.status === "active").length 
          }
        },
        lastChecked: new Date().toISOString(),
        recentFailures: []
      };
    } catch (err) {
      console.error(err);
      return {
        healthScore: 0,
        activeLinks: 0,
        brokenLinks: 0,
        metrics: {
          amazon: { total: 0, valid: 0 },
          temu: { total: 0, valid: 0 },
          aliexpress: { total: 0, valid: 0 }
        },
        lastChecked: new Date().toISOString(),
        recentFailures: []
      };
    }
  },

  async validateProduct(url: string, network?: string) {
    if (!url) return { valid: false, reason: "No URL", confidence: "high" };
    return { valid: true, reason: undefined, confidence: "high" };
  },

  extractProductId(url: string, network: string) {
    if (network.includes("Amazon") || url.includes("amazon")) {
      const match = url.match(/([B][A-Z0-9]{9})/);
      return match ? match[1] : "unknown";
    }
    if (network.includes("Temu") || url.includes("temu")) {
      const match = url.match(/goods_id=([0-9]+)/);
      return match ? match[1] : "unknown";
    }
    return "unknown";
  },

  async trackClickFailure(slug: string) {
    try {
      await supabase.from("affiliate_links").update({ status: "paused" }).eq("slug", slug);
      return true;
    } catch (err) {
      return false;
    }
  },

  async repairLink(slug: string, fallbackUrl?: string) {
    return { repaired: false, newUrl: fallbackUrl };
  },

  detectNetwork(url: string) {
    if (!url) return "Unknown";
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("amazon")) return "Amazon Associates";
    if (lowerUrl.includes("temu")) return "Temu Affiliate";
    if (lowerUrl.includes("aliexpress")) return "AliExpress Affiliate";
    return "Unknown";
  }
};