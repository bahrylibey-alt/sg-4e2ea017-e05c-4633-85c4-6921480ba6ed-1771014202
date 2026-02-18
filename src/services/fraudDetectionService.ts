import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type FraudAlert = Database["public"]["Tables"]["fraud_alerts"]["Row"];

export const fraudDetectionService = {
  // Real-time fraud detection using actual click data
  async detectFraud(campaignId: string): Promise<{
    alerts: FraudAlert[];
    totalLoss: number;
    fraudRate: number;
    error: string | null;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { alerts: [], totalLoss: 0, fraudRate: 0, error: "Not authenticated" };
      }

      // Get campaign's affiliate links
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("id")
        .eq("user_id", user.id);

      if (!links || links.length === 0) {
        return { alerts: [], totalLoss: 0, fraudRate: 0, error: null };
      }

      // Get recent click events
      const { data: clicks } = await supabase
        .from("click_events")
        .select("*")
        .in("link_id", links.map(l => l.id))
        .order("clicked_at", { ascending: false })
        .limit(1000);

      if (!clicks || clicks.length === 0) {
        return { alerts: [], totalLoss: 0, fraudRate: 0, error: null };
      }

      // Analyze for fraud patterns
      const ipCounts = new Map<string, number>();
      const suspiciousIPs: string[] = [];

      clicks.forEach(click => {
        if (click.ip_address) {
          const count = (ipCounts.get(click.ip_address) || 0) + 1;
          ipCounts.set(click.ip_address, count);
          
          // Flag IPs with excessive clicks (>50 clicks)
          if (count > 50 && !suspiciousIPs.includes(click.ip_address)) {
            suspiciousIPs.push(click.ip_address);
          }
        }
      });

      // Create fraud alerts in database
      const newAlerts: FraudAlert[] = [];
      for (const ip of suspiciousIPs) {
        const clickCount = ipCounts.get(ip) || 0;
        const estimatedLoss = clickCount * 0.50; // Assume $0.50 per click

        const { data: alert } = await supabase
          .from("fraud_alerts")
          .insert({
            campaign_id: campaignId,
            alert_type: "click_fraud",
            severity: clickCount > 100 ? "critical" : "high",
            ip_address: ip,
            details: `Suspicious activity: ${clickCount} clicks from single IP address`,
            estimated_loss: estimatedLoss,
            resolved: false
          })
          .select()
          .single();

        if (alert) newAlerts.push(alert);
      }

      // Get all unresolved alerts
      const { data: allAlerts } = await supabase
        .from("fraud_alerts")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("resolved", false)
        .order("created_at", { ascending: false });

      const totalLoss = (allAlerts || []).reduce((sum, alert) => sum + (alert.estimated_loss || 0), 0);
      const fraudRate = clicks.length > 0 ? ((allAlerts || []).length / clicks.length) * 100 : 0;

      return { 
        alerts: allAlerts || [], 
        totalLoss, 
        fraudRate, 
        error: null 
      };
    } catch (err) {
      console.error("Fraud detection error:", err);
      return { alerts: [], totalLoss: 0, fraudRate: 0, error: "Fraud detection failed" };
    }
  },

  // Bot detection using real user agent data
  async detectBots(campaignId: string): Promise<{
    botTraffic: number;
    humanTraffic: number;
    botPercentage: number;
    error: string | null;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { botTraffic: 0, humanTraffic: 0, botPercentage: 0, error: "Not authenticated" };
      }

      const { data: links } = await supabase
        .from("affiliate_links")
        .select("id")
        .eq("user_id", user.id);

      if (!links || links.length === 0) {
        return { botTraffic: 0, humanTraffic: 0, botPercentage: 0, error: null };
      }

      const { data: clicks } = await supabase
        .from("click_events")
        .select("user_agent")
        .in("link_id", links.map(l => l.id));

      const totalClicks = clicks?.length || 0;
      const botClicks = clicks?.filter(c => {
        const ua = (c.user_agent || "").toLowerCase();
        return ua.includes("bot") || 
               ua.includes("crawler") || 
               ua.includes("spider") ||
               ua.includes("scraper");
      }).length || 0;

      return {
        botTraffic: botClicks,
        humanTraffic: totalClicks - botClicks,
        botPercentage: totalClicks > 0 ? (botClicks / totalClicks) * 100 : 0,
        error: null
      };
    } catch (err) {
      console.error("Bot detection error:", err);
      return { botTraffic: 0, humanTraffic: 0, botPercentage: 0, error: "Bot detection failed" };
    }
  },

  // Auto-block suspicious traffic based on real fraud alerts
  async autoBlockFraud(campaignId: string): Promise<{
    blocked: number;
    savedBudget: number;
    error: string | null;
  }> {
    try {
      const fraudResult = await this.detectFraud(campaignId);
      
      // Mark alerts as resolved (blocked)
      const { error } = await supabase
        .from("fraud_alerts")
        .update({ resolved: true })
        .eq("campaign_id", campaignId)
        .eq("resolved", false);

      if (error) {
        return { blocked: 0, savedBudget: 0, error: error.message };
      }

      return { 
        blocked: fraudResult.alerts.length, 
        savedBudget: fraudResult.totalLoss,
        error: null 
      };
    } catch (err) {
      console.error("Auto-block error:", err);
      return { blocked: 0, savedBudget: 0, error: "Auto-block failed" };
    }
  }
};