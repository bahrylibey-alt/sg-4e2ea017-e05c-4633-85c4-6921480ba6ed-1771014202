// @ts-nocheck
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
      const { data: link } = await supabase
        .from("affiliate_links")
        .select("clicks, conversions, created_at")
        .eq("id", linkId)
        .single();

      if (!link) {
        return { isSuspicious: false, riskScore: 0, reasons: [] };
      }

      const reasons: string[] = [];
      let riskScore = 0;

      // Check for zero conversions with high clicks (click fraud)
      if (link.clicks > 150 && link.conversions === 0) {
        reasons.push("High clicks with zero conversions");
        riskScore += 40;
      }

      // Velocity check - if it got too many clicks too fast since creation
      const createdDate = new Date(link.created_at);
      const now = new Date();
      const hoursSinceCreation = Math.max(1, (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
      const clicksPerHour = link.clicks / hoursSinceCreation;

      if (clicksPerHour > 500 && link.conversions < 2) {
        reasons.push("Unnatural click velocity detected");
        riskScore += 35;
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
   * Alias for backwards compatibility with CampaignMonitor
   */
  async detectFraud(linkId: string): Promise<{
    isSuspicious: boolean;
    riskScore: number;
    reasons: string[];
  }> {
    return this.analyzeClickPatterns(linkId);
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

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Log the fraud detection using correct activity_logs schema
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action: "fraud_detected",
          status: "warning",
          details: `Fraud detected on link ${linkId}: ${analysis.reasons.join(", ")}`,
        });
      }

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
  }
};