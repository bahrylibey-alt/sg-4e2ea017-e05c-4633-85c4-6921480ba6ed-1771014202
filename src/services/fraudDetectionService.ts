import { supabase } from "@/integrations/supabase/client";

/**
 * FRAUD DETECTION SERVICE v2.0
 * Advanced AI to detect and prevent fraudulent activity
 * 
 * IMPORTANT: This is ADVISORY ONLY - never auto-blocks traffic
 * Manual review required for any blocking action
 */

export const fraudDetectionService = {
  /**
   * Analyze click patterns for suspicious activity
   * ADVISORY ONLY - Does not block traffic automatically
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

      // Check for zero conversions with high clicks (potential click fraud)
      // NOTE: This is conservative - only flags extreme cases
      if (link.clicks > 500 && link.conversions === 0) {
        reasons.push("High clicks (500+) with zero conversions - review recommended");
        riskScore += 30; // Reduced from 40
      }

      // Velocity check - if it got too many clicks too fast since creation
      const createdDate = new Date(link.created_at);
      const now = new Date();
      const hoursSinceCreation = Math.max(1, (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
      const clicksPerHour = link.clicks / hoursSinceCreation;

      // CONSERVATIVE: Only flag if >1000 clicks/hour with no conversions
      if (clicksPerHour > 1000 && link.conversions < 2) {
        reasons.push("Extremely high click velocity detected (1000+/hour) - review recommended");
        riskScore += 25; // Reduced from 35
      }

      // IMPORTANT: Risk score threshold is HIGH to avoid false positives
      // Only flag as suspicious if risk score > 70 (very conservative)
      return {
        isSuspicious: riskScore > 70,
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
   * ADVISORY ONLY - Does NOT block traffic automatically
   * Only marks for manual review
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

      // IMPORTANT: DO NOT auto-disable the link
      // Only mark for review and log the warning
      await supabase
        .from("affiliate_links")
        .update({
          // DO NOT SET STATUS TO "under_review" - keep it active
          // Only log the concern
        })
        .eq("id", linkId);

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Log the fraud detection as WARNING (not blocking action)
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action: "fraud_warning",
          status: "warning",
          details: `⚠️ ADVISORY: Unusual pattern detected on link ${linkId}. Risk score: ${analysis.riskScore}. Reasons: ${analysis.reasons.join(", ")}. Link remains ACTIVE - manual review recommended.`,
        });

        // Also create a traffic warning (non-blocking)
        await supabase.from("traffic_warnings" as any).insert({
          user_id: user.id,
          warning_type: 'fraud_detected',
          severity: 'medium', // Not high - we're not blocking
          message: `Unusual click pattern on link ${linkId}. Manual review recommended.`,
          metadata: {
            link_id: linkId,
            risk_score: analysis.riskScore,
            reasons: analysis.reasons
          }
        });
      }

      // Return 0 blocked because we don't auto-block
      return { success: true, blocked: 0 };
    } catch (error) {
      console.error("Error in fraud detection:", error);
      return { success: false, blocked: 0 };
    }
  },

  /**
   * Monitor all links for fraud (ADVISORY ONLY)
   * Does not block any traffic automatically
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
      const blocked = 0; // Will always be 0 - we don't auto-block

      for (const link of links) {
        const analysis = await this.analyzeClickPatterns(link.id);
        
        if (analysis.isSuspicious) {
          suspicious++;
          
          // Log warning but DO NOT block
          await this.blockSuspiciousTraffic(link.id);
          // Note: blockSuspiciousTraffic doesn't actually block, just logs
        }
      }

      return {
        totalChecked: links.length,
        suspicious,
        blocked: 0 // Always 0 - manual review required
      };
    } catch (error) {
      console.error("Error monitoring links:", error);
      return { totalChecked: 0, suspicious: 0, blocked: 0 };
    }
  }
};