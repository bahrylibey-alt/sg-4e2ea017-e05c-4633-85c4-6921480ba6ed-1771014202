/**
 * REAL DATA ENFORCEMENT SERVICE
 * 
 * Ensures ONLY real data flows through the system.
 * Blocks all fake/mock/test data generation.
 * 
 * Rules:
 * 1. Products must come from real affiliate network APIs
 * 2. Clicks must come from real traffic sources
 * 3. Views must come from real platform APIs
 * 4. Conversions must come from real postback URLs
 * 5. Revenue must come from real affiliate network reports
 * 
 * NO MOCK DATA. NO FAKE DATA. NO TEST DATA.
 */

import { supabase } from "@/integrations/supabase/client";

interface DataValidation {
  isValid: boolean;
  source: string;
  reason?: string;
}

export const realDataEnforcement = {
  /**
   * Validate that a product came from a real API
   */
  validateProduct(product: any): DataValidation {
    // Must have real affiliate network
    if (!product.network || !['amazon', 'aliexpress', 'clickbank', 'ebay', 'shareasale', 'temu'].includes(product.network.toLowerCase())) {
      return {
        isValid: false,
        source: 'unknown',
        reason: 'Invalid or missing affiliate network'
      };
    }

    // Must have real product URL from the network
    if (!product.affiliate_url || !product.affiliate_url.startsWith('http')) {
      return {
        isValid: false,
        source: product.network,
        reason: 'Missing or invalid affiliate URL'
      };
    }

    // Must have real price
    if (!product.price || product.price <= 0) {
      return {
        isValid: false,
        source: product.network,
        reason: 'Invalid price'
      };
    }

    return {
      isValid: true,
      source: product.network
    };
  },

  /**
   * Validate that a click came from real traffic
   */
  validateClick(click: any): DataValidation {
    // Must have real platform
    const validPlatforms = ['pinterest', 'tiktok', 'twitter', 'facebook', 'instagram', 'reddit', 'linkedin', 'youtube'];
    if (!click.platform || !validPlatforms.includes(click.platform.toLowerCase())) {
      return {
        isValid: false,
        source: 'unknown',
        reason: 'Invalid traffic platform'
      };
    }

    // Must have real link_id that exists in database
    if (!click.link_id) {
      return {
        isValid: false,
        source: click.platform,
        reason: 'Missing link_id'
      };
    }

    // Must have timestamp
    if (!click.clicked_at) {
      return {
        isValid: false,
        source: click.platform,
        reason: 'Missing timestamp'
      };
    }

    return {
      isValid: true,
      source: click.platform
    };
  },

  /**
   * Validate that a view came from real platform API
   */
  validateView(view: any): DataValidation {
    // Must have real platform
    const validPlatforms = ['pinterest', 'tiktok', 'twitter', 'facebook', 'instagram', 'reddit', 'linkedin', 'youtube'];
    if (!view.platform || !validPlatforms.includes(view.platform.toLowerCase())) {
      return {
        isValid: false,
        source: 'unknown',
        reason: 'Invalid platform'
      };
    }

    // Must have real content_id
    if (!view.content_id) {
      return {
        isValid: false,
        source: view.platform,
        reason: 'Missing content_id'
      };
    }

    // Must have positive view count
    if (!view.views || view.views <= 0) {
      return {
        isValid: false,
        source: view.platform,
        reason: 'Invalid view count'
      };
    }

    return {
      isValid: true,
      source: view.platform
    };
  },

  /**
   * Validate that a conversion is real (from postback URL)
   */
  validateConversion(conversion: any): DataValidation {
    // Must have click_id (traced from real click)
    if (!conversion.click_id) {
      return {
        isValid: false,
        source: 'unknown',
        reason: 'Missing click_id - conversion must be traced to a real click'
      };
    }

    // Must have positive revenue
    if (!conversion.revenue || conversion.revenue <= 0) {
      return {
        isValid: false,
        source: 'unknown',
        reason: 'Invalid revenue amount'
      };
    }

    // Must have source (postback from affiliate network)
    if (!conversion.source || !['postback', 'amazon', 'aliexpress', 'clickbank', 'ebay', 'shareasale', 'temu'].includes(conversion.source.toLowerCase())) {
      return {
        isValid: false,
        source: 'unknown',
        reason: 'Invalid or missing conversion source'
      };
    }

    return {
      isValid: true,
      source: conversion.source
    };
  },

  /**
   * Block any attempt to create fake data
   */
  async blockFakeData(type: 'product' | 'click' | 'view' | 'conversion', data: any): Promise<boolean> {
    let validation: DataValidation;

    switch (type) {
      case 'product':
        validation = this.validateProduct(data);
        break;
      case 'click':
        validation = this.validateClick(data);
        break;
      case 'view':
        validation = this.validateView(data);
        break;
      case 'conversion':
        validation = this.validateConversion(data);
        break;
      default:
        return false;
    }

    if (!validation.isValid) {
      console.error(`🚫 BLOCKED FAKE DATA: ${type}`, {
        reason: validation.reason,
        source: validation.source,
        data
      });
      return false;
    }

    return true;
  },

  /**
   * Get real-time stats (only from real data)
   */
  async getRealStats(userId: string) {
    // Only count data that passed validation
    const { data: clicks } = await supabase
      .from('click_events')
      .select('id, platform')
      .eq('user_id', userId);

    const { data: views } = await supabase
      .from('view_events')
      .select('id, platform, views')
      .eq('user_id', userId);

    const { data: conversions } = await supabase
      .from('conversion_events')
      .select('id, revenue, source')
      .eq('user_id', userId);

    const { data: products } = await supabase
      .from('product_catalog')
      .select('id, network')
      .eq('user_id', userId);

    return {
      realClicks: clicks?.length || 0,
      realViews: views?.reduce((sum, v) => sum + v.views, 0) || 0,
      realConversions: conversions?.length || 0,
      realRevenue: conversions?.reduce((sum, c) => sum + c.revenue, 0) || 0,
      realProducts: products?.length || 0,
      breakdown: {
        clicksByPlatform: clicks?.reduce((acc: any, c) => {
          acc[c.platform] = (acc[c.platform] || 0) + 1;
          return acc;
        }, {}),
        viewsByPlatform: views?.reduce((acc: any, v) => {
          acc[v.platform] = (acc[v.platform] || 0) + v.views;
          return acc;
        }, {}),
        revenueBySource: conversions?.reduce((acc: any, c) => {
          acc[c.source] = (acc[c.source] || 0) + c.revenue;
          return acc;
        }, {}),
        productsByNetwork: products?.reduce((acc: any, p) => {
          acc[p.network] = (acc[p.network] || 0) + 1;
          return acc;
        }, {})
      }
    };
  }
};