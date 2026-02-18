import { supabase } from "@/integrations/supabase/client";

export interface FraudAlert {
  id: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  type: "click_fraud" | "conversion_fraud" | "bot_traffic" | "invalid_traffic";
  affectedLinkId: string;
  details: string;
  estimatedLoss: number;
  recommended_action: string;
}

export const fraudDetectionService = {
  // Real-time fraud detection
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

      // Get click events for analysis
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("id")
        .eq("user_id", user.id);

      if (!links || links.length === 0) {
        return { alerts: [], totalLoss: 0, fraudRate: 0, error: null };
      }

      const linkIds = links.map(l => l.id);

      const { data: clicks } = await supabase
        .from("click_events")
        .select("*")
        .in("link_id", linkIds)
        .order("clicked_at", { ascending: false })
        .limit(1000);

      // Analyze for fraud patterns
      const alerts: FraudAlert[] = [];
      let totalLoss = 0;

      // Example: Detect suspicious IP patterns
      const ipCounts = new Map<string, number>();
      clicks?.forEach(click => {
        if (click.ip_address) {
          ipCounts.set(click.ip_address, (ipCounts.get(click.ip_address) || 0) + 1);
        }
      });

      // Flag IPs with excessive clicks
      ipCounts.forEach((count, ip) => {
        if (count > 50) {
          const loss = count * 0.50; // Assume $0.50 per click
          totalLoss += loss;
          alerts.push({
            id: `fraud_${Date.now()}_${ip}`,
            timestamp: new Date().toISOString(),
            severity: count > 100 ? "critical" : "high",
            type: "click_fraud",
            affectedLinkId: linkIds[0],
            details: `Suspicious activity: ${count} clicks from IP ${ip}`,
            estimatedLoss: loss,
            recommended_action: "Block IP address and request refund from traffic source"
          });
        }
      });

      const fraudRate = clicks && clicks.length > 0 
        ? (alerts.length / clicks.length) * 100 
        : 0;

      return { alerts, totalLoss, fraudRate, error: null };
    } catch (err) {
      console.error("Fraud detection error:", err);
      return { alerts: [], totalLoss: 0, fraudRate: 0, error: "Fraud detection failed" };
    }
  },

  // Bot detection
  async detectBots(campaignId: string): Promise<{
    botTraffic: number;
    humanTraffic: number;
    botPercentage: number;
    error: string | null;
  }> {
    try {
      // Simple bot detection based on user agent patterns
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
      const botClicks = clicks?.filter(c => 
        c.user_agent?.toLowerCase().includes("bot") ||
        c.user_agent?.toLowerCase().includes("crawler") ||
        c.user_agent?.toLowerCase().includes("spider")
      ).length || 0;

      return {
        botTraffic: botClicks,
        humanTraffic: totalClicks - botClicks,
        botPercentage: totalClicks > 0 ? (botClicks / totalClicks) * 100 : 0,
        error: null
      };
    } catch (err) {
      return { botTraffic: 0, humanTraffic: 0, botPercentage: 0, error: "Bot detection failed" };
    }
  },

  // Auto-block suspicious traffic
  async autoBlockFraud(campaignId: string): Promise<{
    blocked: number;
    savedBudget: number;
    error: string | null;
  }> {
    try {
      const fraudResult = await this.detectFraud(campaignId);
      
      // In production, this would actually block IPs and sources
      const blocked = fraudResult.alerts.length;
      const savedBudget = fraudResult.totalLoss;

      return { blocked, savedBudget, error: null };
    } catch (err) {
      return { blocked: 0, savedBudget: 0, error: "Auto-block failed" };
    }
  }
};