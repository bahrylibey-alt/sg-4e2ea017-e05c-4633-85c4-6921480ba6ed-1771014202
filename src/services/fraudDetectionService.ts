import { supabase } from "@/integrations/supabase/client";

/**
 * FRAUD DETECTION SERVICE
 * Advanced AI to detect and prevent fraudulent activity
 */

export const fraudDetectionService = {
  /**
   * Analyze click patterns for suspicious activity
   */
  async analyzeClickPatterns(linkId: string): Promise<{
    isSuspicious: boolean;
    riskScore: number;
    reasons: string[];
  }> {
    try {
      // Get activity logs for this link
      const { data: activities } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("link_id", linkId)
        .order("timestamp", { ascending: false })
        .limit(100);

      if (!activities || activities.length === 0) {
        return { isSuspicious: false, riskScore: 0, reasons: [] };
      }

      const reasons: string[] = [];
      let riskScore = 0;

      // Check for click flooding (too many clicks in short time)
      const last5MinClicks = activities.filter((a) => {
        const timestamp = new Date(a.timestamp);
        const now = new Date();
        return now.getTime() - timestamp.getTime() < 5 * 60 * 1000;
      }).length;

      if (last5MinClicks > 50) {
        reasons.push("Unusual click volume in last 5 minutes");
        riskScore += 40;
      }

      // Check for same IP patterns
      const ipCounts: Record<string, number> = {};
      activities.forEach((a) => {
        const ip = a.metadata?.ip || "unknown";
        ipCounts[ip] = (ipCounts[ip] || 0) + 1;
      });

      const maxSameIP = Math.max(...Object.values(ipCounts));
      if (maxSameIP > 20) {
        reasons.push("High number of clicks from same IP");
        riskScore += 30;
      }

      // Check for bot-like patterns (exact timing intervals)
      const intervals: number[] = [];
      for (let i = 1; i < Math.min(activities.length, 20); i++) {
        const t1 = new Date(activities[i - 1].timestamp).getTime();
        const t2 = new Date(activities[i].timestamp).getTime();
        intervals.push(Math.abs(t1 - t2));
      }

      if (intervals.length > 0) {
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
        
        // Low variance = bot-like behavior
        if (variance < 1000 && avgInterval < 60000) {
          reasons.push("Bot-like click pattern detected");
          riskScore += 25;
        }
      }

      // Check for zero conversions with high clicks (click fraud)
      const { data: link } = await supabase
        .from("affiliate_links")
        .select("clicks, conversions")
        .eq("id", linkId)
        .single();

      if (link && link.clicks > 100 && link.conversions === 0) {
        reasons.push("High clicks with zero conversions");
        riskScore += 20;
      }

      return {
        isSuspicious: riskScore > 50,
        riskScore: Math.min(100, riskScore),
        reasons,
      };
    } catch (error) {
      console.error("Error analyzing click patterns:", error);
      return { isSuspicious: false, riskScore: 0, reasons: [] };
    }
  },

  /**
   * Block suspicious traffic
   */
  async blockSuspiciousTraffic(linkId: string): Promise<{
    success: boolean;
    blocked: number;
  }> {
    try {
      const analysis = await this.analyzeClickPatterns(linkId);

      if (!analysis.isSuspicious) {
        return { success: true, blocked: 0 };
      }

      // Mark link for review
      await supabase
        .from("affiliate_links")
        .update({
          status: "under_review",
        })
        .eq("id", linkId);

      // Log the fraud detection
      await supabase.from("activity_logs").insert({
        link_id: linkId,
        action: "fraud_detected",
        status: "warning",
        details: `Fraud detected: ${analysis.reasons.join(", ")}`,
      });

      return { success: true, blocked: 1 };
    } catch (error) {
      console.error("Error blocking traffic:", error);
      return { success: false, blocked: 0 };
    }
  },

  /**
   * Monitor all links for fraud
   */
  async monitorAllLinks(campaignId?: string): Promise<{
    totalChecked: number;
    suspicious: number;
    blocked: number;
  }> {
    try {
      let query = supabase
        .from("affiliate_links")
        .select("*")
        .eq("status", "active");

      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }

      const { data: links } = await query;

      if (!links || links.length === 0) {
        return { totalChecked: 0, suspicious: 0, blocked: 0 };
      }

      let suspicious = 0;
      let blocked = 0;

      for (const link of links) {
        const analysis = await this.analyzeClickPatterns(link.id);
        
        if (analysis.isSuspicious) {
          suspicious++;
          
          if (analysis.riskScore > 70) {
            const blockResult = await this.blockSuspiciousTraffic(link.id);
            if (blockResult.success) blocked++;
          }
        }
      }

      return {
        totalChecked: links.length,
        suspicious,
        blocked,
      };
    } catch (error) {
      console.error("Error monitoring links:", error);
      return { totalChecked: 0, suspicious: 0, blocked: 0 };
    }
  },
};