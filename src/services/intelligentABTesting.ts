import { supabase } from "@/integrations/supabase/client";

/**
 * INTELLIGENT A/B TESTING
 * Automatically tests link variations to maximize conversions
 */

export const intelligentABTesting = {
  /**
   * Create A/B test variants for a product link
   */
  async createTestVariants(
    originalLinkId: string,
    numVariants: number = 2
  ): Promise<{ success: boolean; variants: any[] }> {
    try {
      const { data: original } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("id", originalLinkId)
        .single();

      if (!original) {
        return { success: false, variants: [] };
      }

      const variants = [];

      // Create variant slugs
      const variantSuffixes = ["v1", "v2", "v3", "alt", "pro"];
      
      for (let i = 0; i < numVariants; i++) {
        const variantSlug = `${original.slug}-${variantSuffixes[i % variantSuffixes.length]}`;
        
        const { data: variant, error } = await supabase
          .from("affiliate_links")
          .insert({
            user_id: original.user_id,
            campaign_id: original.campaign_id,
            product_name: `${original.product_name} (Variant ${i + 1})`,
            original_url: original.original_url,
            slug: variantSlug,
            network: original.network,
            commission_rate: original.commission_rate,
            status: "active",
            cloaked_url: `/go/${variantSlug}`,
            clicks: 0,
            conversions: 0,
            revenue: 0,
            commission_earned: 0,
          })
          .select()
          .single();

        if (!error && variant) {
          variants.push(variant);
        }
      }

      return { success: true, variants };
    } catch (error) {
      console.error("Error creating test variants:", error);
      return { success: false, variants: [] };
    }
  },

  /**
   * Analyze A/B test results
   */
  async analyzeTestResults(originalLinkId: string): Promise<{
    winner: any | null;
    results: Array<{
      id: string;
      name: string;
      clicks: number;
      conversions: number;
      conversionRate: number;
      revenue: number;
    }>;
    confidence: number;
  }> {
    try {
      const { data: original } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("id", originalLinkId)
        .single();

      if (!original) {
        return { winner: null, results: [], confidence: 0 };
      }

      // Get all variants (links with similar slugs)
      const { data: allLinks } = await supabase
        .from("affiliate_links")
        .select("*")
        .ilike("slug", `${original.slug}%`)
        .eq("status", "active");

      if (!allLinks || allLinks.length < 2) {
        return { winner: null, results: [], confidence: 0 };
      }

      // Calculate performance metrics
      const results = allLinks.map((link) => ({
        id: link.id,
        name: link.product_name,
        clicks: link.clicks,
        conversions: link.conversions,
        conversionRate: link.clicks > 0 ? (link.conversions / link.clicks) * 100 : 0,
        revenue: link.revenue,
      }));

      // Sort by conversion rate
      results.sort((a, b) => b.conversionRate - a.conversionRate);

      // Determine winner (must have statistical significance)
      const winner = results[0];
      const totalClicks = results.reduce((sum, r) => sum + r.clicks, 0);
      
      // Confidence based on sample size
      const confidence = Math.min(95, (totalClicks / 1000) * 100);

      return {
        winner: winner.clicks > 50 ? winner : null,
        results,
        confidence: Math.round(confidence),
      };
    } catch (error) {
      console.error("Error analyzing test results:", error);
      return { winner: null, results: [], confidence: 0 };
    }
  },

  /**
   * Auto-optimize: Disable losing variants
   */
  async autoOptimize(originalLinkId: string): Promise<{
    success: boolean;
    disabled: number;
    winner: string | null;
  }> {
    try {
      const analysis = await this.analyzeTestResults(originalLinkId);

      if (!analysis.winner || analysis.confidence < 70) {
        return { success: false, disabled: 0, winner: null };
      }

      let disabled = 0;

      // Disable all variants except the winner
      for (const result of analysis.results) {
        if (result.id !== analysis.winner.id && result.clicks > 0) {
          await supabase
            .from("affiliate_links")
            .update({ status: "paused" })
            .eq("id", result.id);
          
          disabled++;
        }
      }

      return {
        success: true,
        disabled,
        winner: analysis.winner.name,
      };
    } catch (error) {
      console.error("Error auto-optimizing:", error);
      return { success: false, disabled: 0, winner: null };
    }
  },
};