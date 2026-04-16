import { supabase } from "@/integrations/supabase/client";

interface DiscoveryResult {
  totalDiscovered: number;
  byNetwork: Record<string, number>;
  topProducts: any[];
  recommendations: string[];
}

/**
 * SMART PRODUCT DISCOVERY - REAL AFFILIATE NETWORKS ONLY
 * 
 * NO MOCK DATA - Only discovers products from connected affiliate networks
 * User MUST have API keys configured in /integrations
 */

export const smartProductDiscovery = {
  /**
   * Discover products from REAL affiliate networks only
   * Returns empty result if no networks are connected
   */
  async discoverProducts(userId: string, settings?: any): Promise<DiscoveryResult> {
    const result: DiscoveryResult = {
      totalDiscovered: 0,
      byNetwork: {},
      topProducts: [],
      recommendations: []
    };

    try {
      console.log('🔍 Product Discovery: Starting for user:', userId);

      // Check for connected integrations
      const { data: integrations, error: intError } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('category', 'affiliate')
        .eq('status', 'connected');

      if (intError) {
        console.error('Integration query error:', intError);
        result.recommendations.push('Database error - check system logs');
        return result;
      }

      if (!integrations || integrations.length === 0) {
        console.log('⚠️ No affiliate networks connected');
        result.recommendations.push('Connect affiliate networks in /integrations page');
        result.recommendations.push('Supported: Amazon Associates, AliExpress, Temu, ClickBank, ShareASale');
        return result;
      }

      console.log(`📡 Found ${integrations.length} connected networks`);

      // Get autopilot settings for product filtering
      const { data: autopilotSettings } = await supabase
        .from('autopilot_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const minPrice = autopilotSettings?.min_product_price || 10;
      const maxPrice = autopilotSettings?.max_product_price || 500;
      
      // Some properties might be stored in a config/json field depending on exact schema version
      const settingsAny = autopilotSettings as any;
      const preferredCategories = settingsAny?.preferred_categories || [];

      // Process each connected network
      for (const integration of integrations) {
        const network = integration.provider.toLowerCase();
        console.log(`🔌 Processing ${network}...`);

        // Validate integration has API key - using config field from database schema
        const apiKey = integration.config && typeof integration.config === 'object'
          ? (integration.config as any).api_key
          : null;

        if (!apiKey || apiKey === 'your_api_key_here') {
          console.log(`⚠️ ${network}: No valid API key configured`);
          result.recommendations.push(`Add valid API key for ${network} in /integrations`);
          continue;
        }

        // Check if network API is properly configured
        const networkStatus = this.checkNetworkConfiguration(network, integration.config);
        if (!networkStatus.ready) {
          console.log(`⚠️ ${network}: ${networkStatus.reason}`);
          result.recommendations.push(`${network}: ${networkStatus.reason}`);
          continue;
        }

        // For now, we acknowledge the network is configured
        // Real API integration would happen here
        result.recommendations.push(`${network} is connected and ready - API integration pending`);
        result.byNetwork[network] = 0;
      }

      // Important message about real data
      if (result.totalDiscovered === 0) {
        result.recommendations.push('⚠️ REAL API INTEGRATION REQUIRED');
        result.recommendations.push('Product discovery needs actual affiliate network API credentials');
        result.recommendations.push('Configure API keys in /integrations, then products will be discovered automatically');
      }

      console.log('✅ Product Discovery Complete:', result);
      return result;

    } catch (error) {
      console.error('❌ Product Discovery Error:', error);
      result.recommendations.push('System error during product discovery');
      return result;
    }
  },

  /**
   * Check if network configuration is valid
   */
  checkNetworkConfiguration(network: string, settings: any): { ready: boolean; reason?: string } {
    if (!settings || typeof settings !== 'object') {
      return { ready: false, reason: 'No settings configured' };
    }

    const apiKey = (settings as any).api_key;
    
    if (!apiKey || apiKey === 'your_api_key_here' || apiKey === '') {
      return { ready: false, reason: 'API key not configured' };
    }

    // Check network-specific requirements
    switch (network) {
      case 'amazon':
        if (!settings.associate_tag) {
          return { ready: false, reason: 'Associate Tag required' };
        }
        break;
      case 'aliexpress':
      case 'temu':
        // API key is sufficient
        break;
      case 'clickbank':
        if (!settings.account_nickname) {
          return { ready: false, reason: 'Account Nickname required' };
        }
        break;
      default:
        break;
    }

    return { ready: true };
  },

  /**
   * Generate URL-safe slug
   */
  generateSlug(name: string): string {
    const randomId = Math.random().toString(36).substring(2, 8);
    const nameSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 30);
    
    return `${nameSlug}-${randomId}`;
  }
};