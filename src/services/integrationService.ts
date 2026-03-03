import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Integration = Database["public"]["Tables"]["integrations"]["Row"];
type IntegrationInsert = Database["public"]["Tables"]["integrations"]["Insert"];
type IntegrationUpdate = Database["public"]["Tables"]["integrations"]["Update"];

export interface IntegrationConfig {
  // Stripe
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  
  // Email (Mailchimp, SendGrid)
  apiKey?: string;
  listId?: string;
  audienceId?: string;
  
  // Automation (Zapier, Make)
  webhookUrl?: string;
  apiKey?: string;
  
  // Affiliate Networks
  affiliateId?: string;
  trackingCode?: string;
  apiKey?: string;
  siteId?: string;
  
  // Analytics
  trackingId?: string;
  pixelId?: string;
  measurementId?: string;
}

export interface IntegrationDetails {
  id: string;
  provider: string;
  providerName: string;
  providerLogo: string;
  category: string;
  status: "connected" | "disconnected" | "error" | "pending";
  connectedAt: string | null;
  lastSyncAt: string | null;
  config: IntegrationConfig;
  errorMessage: string | null;
}

/**
 * Integration Service - Manages third-party service connections
 */
export const integrationService = {
  /**
   * Get all integrations for current user
   */
  async getUserIntegrations(): Promise<{
    integrations: IntegrationDetails[];
    error: string | null;
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { integrations: [], error: "Not authenticated" };
      }

      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching integrations:", error);
        return { integrations: [], error: error.message };
      }

      const integrations: IntegrationDetails[] = (data || []).map(item => ({
        id: item.id,
        provider: item.provider,
        providerName: item.provider_name,
        providerLogo: item.provider_logo || "🔌",
        category: item.category,
        status: item.status as "connected" | "disconnected" | "error" | "pending",
        connectedAt: item.connected_at,
        lastSyncAt: item.last_sync_at,
        config: (item.config as IntegrationConfig) || {},
        errorMessage: item.error_message
      }));

      return { integrations, error: null };
    } catch (err: any) {
      console.error("❌ Error in getUserIntegrations:", err);
      return { integrations: [], error: err.message };
    }
  },

  /**
   * Connect a new integration
   */
  async connectIntegration(
    provider: string,
    config: IntegrationConfig
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      // Validate provider-specific configuration
      const validationError = this.validateConfig(provider, config);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Test the connection with provider API
      const testResult = await this.testConnection(provider, config);
      if (!testResult.success) {
        return { success: false, error: testResult.error || "Connection test failed" };
      }

      // Get integration metadata
      const metadata = this.getIntegrationMetadata(provider);

      // Upsert integration record
      const { error } = await supabase
        .from("integrations")
        .upsert({
          user_id: session.user.id,
          provider: provider,
          provider_name: metadata.name,
          provider_logo: metadata.logo,
          category: metadata.category,
          status: "connected",
          connected_at: new Date().toISOString(),
          config: config as any,
          error_message: null
        }, {
          onConflict: "user_id,provider"
        });

      if (error) {
        console.error("❌ Error saving integration:", error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Successfully connected ${provider}`);
      return { success: true, error: null };
    } catch (err: any) {
      console.error("❌ Error in connectIntegration:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Disconnect an integration
   */
  async disconnectIntegration(
    provider: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const { error } = await supabase
        .from("integrations")
        .update({
          status: "disconnected",
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
          config: {},
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", session.user.id)
        .eq("provider", provider);

      if (error) {
        console.error("❌ Error disconnecting integration:", error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Successfully disconnected ${provider}`);
      return { success: true, error: null };
    } catch (err: any) {
      console.error("❌ Error in disconnectIntegration:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Test connection to provider API
   */
  async testConnection(
    provider: string,
    config: IntegrationConfig
  ): Promise<{ success: boolean; error: string | null }> {
    // In production, this would make actual API calls to test the connection
    // For now, we'll simulate testing
    
    console.log(`🧪 Testing ${provider} connection...`);

    switch (provider) {
      case "stripe":
        if (!config.stripePublishableKey || !config.stripeSecretKey) {
          return { success: false, error: "Stripe API keys are required" };
        }
        // In production: Test Stripe API with the provided keys
        break;

      case "mailchimp":
        if (!config.apiKey) {
          return { success: false, error: "Mailchimp API key is required" };
        }
        // In production: Test Mailchimp API
        break;

      case "amazon_associates":
        if (!config.trackingCode || !config.affiliateId) {
          return { success: false, error: "Amazon Associates tracking code and affiliate ID are required" };
        }
        // In production: Verify Amazon Associates account
        break;

      default:
        break;
    }

    return { success: true, error: null };
  },

  /**
   * Validate integration configuration
   */
  validateConfig(provider: string, config: IntegrationConfig): string | null {
    switch (provider) {
      case "stripe":
        if (!config.stripePublishableKey) {
          return "Stripe publishable key is required";
        }
        if (!config.stripeSecretKey) {
          return "Stripe secret key is required";
        }
        break;

      case "mailchimp":
        if (!config.apiKey) {
          return "Mailchimp API key is required";
        }
        break;

      case "amazon_associates":
        if (!config.trackingCode) {
          return "Amazon tracking code is required";
        }
        break;
    }

    return null;
  },

  /**
   * Get integration metadata
   */
  getIntegrationMetadata(provider: string): {
    name: string;
    logo: string;
    category: string;
    description: string;
  } {
    const metadata: Record<string, any> = {
      stripe: {
        name: "Stripe",
        logo: "💳",
        category: "payment",
        description: "Accept payments and manage subscriptions"
      },
      paypal: {
        name: "PayPal",
        logo: "💰",
        category: "payment",
        description: "Alternative payment processing"
      },
      mailchimp: {
        name: "Mailchimp",
        logo: "📧",
        category: "email",
        description: "Email marketing and automation"
      },
      zapier: {
        name: "Zapier",
        logo: "⚡",
        category: "automation",
        description: "Connect your apps and automate workflows"
      },
      amazon_associates: {
        name: "Amazon Associates",
        logo: "📦",
        category: "affiliate_network",
        description: "Amazon affiliate marketing program"
      },
      clickbank: {
        name: "ClickBank",
        logo: "🏦",
        category: "affiliate_network",
        description: "Digital product affiliate network"
      },
      google_analytics: {
        name: "Google Analytics",
        logo: "📊",
        category: "analytics",
        description: "Track website traffic and user behavior"
      },
      facebook_pixel: {
        name: "Facebook Pixel",
        logo: "📱",
        category: "tracking",
        description: "Track conversions and optimize Facebook ads"
      }
    };

    return metadata[provider] || {
      name: provider,
      logo: "🔌",
      category: "other",
      description: "Third-party integration"
    };
  },

  /**
   * Get integration by provider
   */
  async getIntegration(provider: string): Promise<{
    integration: IntegrationDetails | null;
    error: string | null;
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { integration: null, error: "Not authenticated" };
      }

      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("provider", provider)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return { integration: null, error: null }; // Not found is OK
        }
        console.error("❌ Error fetching integration:", error);
        return { integration: null, error: error.message };
      }

      const integration: IntegrationDetails = {
        id: data.id,
        provider: data.provider,
        providerName: data.provider_name,
        providerLogo: data.provider_logo || "🔌",
        category: data.category,
        status: data.status as "connected" | "disconnected" | "error" | "pending",
        connectedAt: data.connected_at,
        lastSyncAt: data.last_sync_at,
        config: (data.config as IntegrationConfig) || {},
        errorMessage: data.error_message
      };

      return { integration, error: null };
    } catch (err: any) {
      console.error("❌ Error in getIntegration:", err);
      return { integration: null, error: err.message };
    }
  },

  /**
   * Update integration sync status
   */
  async updateSyncStatus(
    provider: string,
    lastSyncAt: string
  ): Promise<{ success: boolean }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return { success: false };

      await supabase
        .from("integrations")
        .update({ last_sync_at: lastSyncAt })
        .eq("user_id", session.user.id)
        .eq("provider", provider);

      return { success: true };
    } catch {
      return { success: false };
    }
  }
};