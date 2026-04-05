import { supabase } from "@/integrations/supabase/client";

/**
 * INTEGRATION MANAGEMENT SERVICE
 * Manages all third-party integrations: affiliate networks, social APIs, analytics
 */

export interface Integration {
  id: string;
  user_id: string;
  provider: string;
  provider_name: string;
  provider_logo?: string;
  category: string;
  status: "connected" | "disconnected" | "error" | "pending";
  connected_at?: string;
  last_sync_at?: string;
  config: Record<string, any>;
  error_message?: string;
}

export interface IntegrationConfig {
  // Affiliate Networks
  affiliate_id?: string;
  tracking_id?: string;
  api_key?: string;
  api_secret?: string;
  
  // Social Media APIs
  access_token?: string;
  refresh_token?: string;
  page_id?: string;
  channel_id?: string;
  
  // Custom settings
  [key: string]: any;
}

export interface IntegrationTemplate {
  name: string;
  provider: string;
  logo: string;
  category: string;
  fields: {
    name: string;
    label: string;
    type: string;
    required: boolean;
  }[];
}

const INTEGRATION_TEMPLATES: Record<string, IntegrationTemplate> = {
  // Affiliate Networks
  amazon_associates: {
    name: "Amazon Associates",
    provider: "amazon_associates",
    logo: "🛍️",
    category: "affiliate_network",
    fields: [
      { name: "affiliate_tag", label: "Affiliate Tag", type: "text", required: true },
      { name: "access_key", label: "Access Key ID", type: "text", required: false },
      { name: "secret_key", label: "Secret Access Key", type: "password", required: false }
    ]
  },

  temu_affiliate: {
    name: "Temu Affiliate Program",
    provider: "temu_affiliate",
    logo: "🎁",
    category: "affiliate_network",
    fields: [
      { name: "affiliate_id", label: "Affiliate ID", type: "text", required: true },
      { name: "tracking_id", label: "Tracking ID", type: "text", required: true }
    ]
  },

  // Analytics & Tracking
  google_analytics: {
    name: "Google Analytics",
    provider: "google_analytics",
    logo: "📊",
    category: "analytics",
    fields: [
      { name: "measurement_id", label: "GA4 Measurement ID", type: "text", required: true },
      { name: "api_secret", label: "API Secret (Optional)", type: "password", required: false }
    ]
  },

  // Payment Processing
  stripe: {
    name: "Stripe",
    provider: "stripe",
    logo: "💳",
    category: "payment",
    fields: [
      { name: "publishable_key", label: "Publishable Key", type: "text", required: true },
      { name: "test_secret_key", label: "Test Secret Key", type: "password", required: false },
      { name: "live_secret_key", label: "Live Secret Key", type: "password", required: false }
    ]
  },

  // Automation & Webhooks
  zapier: {
    name: "Zapier",
    provider: "zapier",
    logo: "⚡",
    category: "automation",
    fields: [
      { name: "webhook_url", label: "Webhook URL", type: "text", required: true }
    ]
  },

  // Traffic Sources (existing ones)
  aliexpress_affiliate: {
    name: "AliExpress Affiliate",
    logo: "🛒",
    category: "affiliate_network",
    fields: [
      { name: "app_key", label: "App Key", type: "text", required: true },
      { name: "app_secret", label: "App Secret", type: "password", required: true },
      { name: "tracking_id", label: "Tracking ID", type: "text", required: true },
    ]
  },
  ebay_partner_network: {
    name: "eBay Partner Network",
    logo: "🏪",
    category: "affiliate_network",
    fields: [
      { name: "campaign_id", label: "Campaign ID", type: "text", required: true },
      { name: "affiliate_id", label: "Affiliate ID", type: "text", required: true },
    ]
  },
  clickbank: {
    name: "ClickBank",
    logo: "💳",
    category: "affiliate_network",
    fields: [
      { name: "nickname", label: "Account Nickname", type: "text", required: true },
      { name: "api_key", label: "Developer API Key", type: "password", required: false },
    ]
  },
  shareasale: {
    name: "ShareASale",
    logo: "🤝",
    category: "affiliate_network",
    fields: [
      { name: "affiliate_id", label: "Affiliate ID", type: "text", required: true },
      { name: "api_token", label: "API Token", type: "password", required: false },
      { name: "api_secret", label: "API Secret", type: "password", required: false },
    ]
  },
  
  // Social Media Traffic Sources
  facebook_api: {
    name: "Facebook for Business",
    logo: "📘",
    category: "traffic_source",
    fields: [
      { name: "app_id", label: "App ID", type: "text", required: true },
      { name: "app_secret", label: "App Secret", type: "password", required: true },
      { name: "access_token", label: "Page Access Token", type: "password", required: true },
      { name: "page_id", label: "Page ID", type: "text", required: false },
    ]
  },
  twitter_api: {
    name: "Twitter / X API",
    logo: "🐦",
    category: "traffic_source",
    fields: [
      { name: "api_key", label: "API Key", type: "text", required: true },
      { name: "api_secret", label: "API Secret", type: "password", required: true },
      { name: "access_token", label: "Access Token", type: "password", required: true },
      { name: "access_token_secret", label: "Access Token Secret", type: "password", required: true },
    ]
  },
  reddit_api: {
    name: "Reddit API",
    logo: "🤖",
    category: "traffic_source",
    fields: [
      { name: "client_id", label: "Client ID", type: "text", required: true },
      { name: "client_secret", label: "Client Secret", type: "password", required: true },
      { name: "username", label: "Reddit Username", type: "text", required: true },
      { name: "password", label: "Reddit Password", type: "password", required: true },
    ]
  },
  pinterest_api: {
    name: "Pinterest API",
    logo: "📌",
    category: "traffic_source",
    fields: [
      { name: "access_token", label: "Access Token", type: "password", required: true },
      { name: "board_id", label: "Default Board ID", type: "text", required: false },
    ]
  },
  tiktok_api: {
    name: "TikTok for Business",
    logo: "🎵",
    category: "traffic_source",
    fields: [
      { name: "app_id", label: "App ID", type: "text", required: true },
      { name: "app_secret", label: "App Secret", type: "password", required: true },
      { name: "access_token", label: "Access Token", type: "password", required: true },
    ]
  },
  instagram_api: {
    name: "Instagram Graph API",
    logo: "📸",
    category: "traffic_source",
    fields: [
      { name: "access_token", label: "Access Token", type: "password", required: true },
      { name: "account_id", label: "Instagram Business Account ID", type: "text", required: true },
    ]
  },
  youtube_api: {
    name: "YouTube Data API",
    logo: "▶️",
    category: "traffic_source",
    fields: [
      { name: "api_key", label: "API Key", type: "text", required: true },
      { name: "channel_id", label: "Channel ID", type: "text", required: false },
    ]
  },
};

export const integrationService = {
  /**
   * Get all integration templates
   */
  getTemplates() {
    return INTEGRATION_TEMPLATES;
  },

  /**
   * Get user's integrations
   */
  async getUserIntegrations(userId: string) {
    const { data, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", userId)
      .order("provider_name");

    if (error) {
      console.error("Error fetching integrations:", error);
      return [];
    }

    return data as Integration[];
  },

  /**
   * Connect/Update integration
   */
  async saveIntegration(
    userId: string,
    provider: string,
    config: IntegrationConfig
  ) {
    const template = INTEGRATION_TEMPLATES[provider as keyof typeof INTEGRATION_TEMPLATES];
    if (!template) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    // Check if integration exists
    const { data: existing } = await supabase
      .from("integrations")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", provider)
      .single();

    const integrationData = {
      user_id: userId,
      provider,
      provider_name: template.name,
      provider_logo: template.logo,
      category: template.category,
      status: "connected" as const,
      connected_at: new Date().toISOString(),
      config,
    };

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("integrations")
        .update(integrationData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from("integrations")
        .insert(integrationData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  /**
   * Disconnect integration
   */
  async disconnectIntegration(integrationId: string) {
    const { error } = await supabase
      .from("integrations")
      .update({
        status: "disconnected",
        config: {},
      })
      .eq("id", integrationId);

    if (error) throw error;
  },

  /**
   * Delete integration
   */
  async deleteIntegration(integrationId: string) {
    const { error } = await supabase
      .from("integrations")
      .delete()
      .eq("id", integrationId);

    if (error) throw error;
  },

  /**
   * Test integration connection
   */
  async testConnection(provider: string, config: IntegrationConfig) {
    // This would make actual API calls to test the credentials
    // For now, we'll just validate that required fields are present
    const template = INTEGRATION_TEMPLATES[provider as keyof typeof INTEGRATION_TEMPLATES];
    if (!template) return false;

    const requiredFields = template.fields
      .filter(f => f.required)
      .map(f => f.name);

    return requiredFields.every(field => config[field]);
  },

  /**
   * Get connected integrations by category
   */
  async getIntegrationsByCategory(userId: string, category: string) {
    const { data, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .eq("status", "connected");

    if (error) {
      console.error("Error fetching integrations:", error);
      return [];
    }

    return data as Integration[];
  },

  /**
   * Get specific integration config
   */
  async getIntegrationConfig(userId: string, provider: string) {
    const { data, error } = await supabase
      .from("integrations")
      .select("config")
      .eq("user_id", userId)
      .eq("provider", provider)
      .eq("status", "connected")
      .single();

    if (error || !data) return null;
    return data.config as IntegrationConfig;
  },
};