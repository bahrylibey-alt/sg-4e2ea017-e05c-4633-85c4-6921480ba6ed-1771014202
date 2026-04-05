import { supabase } from "@/integrations/supabase/client";

/**
 * WEBHOOK SERVICE
 * Sends real-time notifications to connected services (Zapier, etc.)
 */

export interface WebhookEvent {
  event: string;
  data: Record<string, any>;
  timestamp: string;
}

export const webhookService = {
  /**
   * Send webhook to Zapier integration
   */
  async sendToZapier(userId: string, event: WebhookEvent): Promise<boolean> {
    try {
      // Get user's Zapier integration
      const { data: integration } = await supabase
        .from("integrations")
        .select("config")
        .eq("user_id", userId)
        .eq("provider", "zapier")
        .eq("status", "connected")
        .single();

      if (!integration?.config?.webhook_url) {
        console.log("Zapier not configured for user:", userId);
        return false;
      }

      // Send webhook
      const response = await fetch(integration.config.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      console.log("✅ Zapier webhook sent:", event.event);
      return true;
    } catch (error) {
      console.error("Zapier webhook error:", error);
      return false;
    }
  },

  /**
   * Send click event to webhooks
   */
  async notifyClick(userId: string, clickData: {
    product_name: string;
    network: string;
    cloaked_url: string;
  }): Promise<void> {
    await this.sendToZapier(userId, {
      event: "affiliate.click",
      data: clickData,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Send conversion event to webhooks
   */
  async notifyConversion(userId: string, conversionData: {
    product_name: string;
    network: string;
    amount: number;
    commission: number;
    transaction_id: string;
  }): Promise<void> {
    await this.sendToZapier(userId, {
      event: "affiliate.conversion",
      data: conversionData,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Send campaign launch event to webhooks
   */
  async notifyCampaignLaunched(userId: string, campaignData: {
    campaign_name: string;
    products_added: number;
    networks: string[];
  }): Promise<void> {
    await this.sendToZapier(userId, {
      event: "campaign.launched",
      data: campaignData,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Send revenue milestone event to webhooks
   */
  async notifyRevenueMilestone(userId: string, milestoneData: {
    milestone: number;
    total_revenue: number;
    campaign_name: string;
  }): Promise<void> {
    await this.sendToZapier(userId, {
      event: "revenue.milestone",
      data: milestoneData,
      timestamp: new Date().toISOString(),
    });
  },
};