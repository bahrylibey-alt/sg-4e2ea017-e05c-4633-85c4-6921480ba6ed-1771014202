import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ABTest = Database["public"]["Tables"]["ab_tests"]["Row"];
type ABTestInsert = Database["public"]["Tables"]["ab_tests"]["Insert"];
type ABTestVariant = Database["public"]["Tables"]["ab_test_variants"]["Row"];
type ABTestVariantInsert = Database["public"]["Tables"]["ab_test_variants"]["Insert"];

export interface ABTestResult {
  test: ABTest;
  variants: ABTestVariant[];
  winner?: ABTestVariant;
  confidence: number;
}

export const abTestingService = {
  // REAL: Create a new A/B test
  async createTest(data: {
    campaignId: string;
    testName: string;
    testType: "headline" | "cta" | "image" | "landing_page" | "offer";
    variants: Array<{ name: string; content: string }>;
    targetSampleSize?: number;
  }): Promise<{ test: ABTest | null; variants: ABTestVariant[]; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { test: null, variants: [], error: "User not authenticated" };
      }

      // Create test
      const testInsert: ABTestInsert = {
        campaign_id: data.campaignId,
        user_id: user.id,
        name: data.testName,
        test_type: data.testType,
        status: "running",
        target_sample_size: data.targetSampleSize || 1000
      };

      const { data: test, error: testError } = await supabase
        .from("ab_tests")
        .insert(testInsert)
        .select()
        .single();

      if (testError || !test) {
        return { test: null, variants: [], error: testError?.message || "Failed to create test" };
      }

      // Create variants
      const variantInserts: ABTestVariantInsert[] = data.variants.map((variant, idx) => ({
        test_id: test.id,
        name: variant.name,
        content: variant.content,
        traffic_split: Math.round(100 / data.variants.length),
        is_control: idx === 0
      }));

      const { data: variants, error: variantsError } = await supabase
        .from("ab_test_variants")
        .insert(variantInserts)
        .select();

      if (variantsError) {
        return { test, variants: [], error: variantsError.message };
      }

      return { test, variants: variants || [], error: null };
    } catch (err) {
      return { test: null, variants: [], error: "Failed to create A/B test" };
    }
  },

  // REAL: Get test results with statistical analysis
  async getTestResults(testId: string): Promise<ABTestResult | null> {
    try {
      const { data: test, error: testError } = await supabase
        .from("ab_tests")
        .select("*")
        .eq("id", testId)
        .single();

      if (testError || !test) return null;

      const { data: variants, error: variantsError } = await supabase
        .from("ab_test_variants")
        .select("*")
        .eq("test_id", testId);

      if (variantsError || !variants) return null;

      // Calculate statistical significance
      const control = variants.find(v => v.is_control);
      if (!control || !control.visitors || control.visitors === 0) {
        return { test, variants, confidence: 0 };
      }

      const controlRate = (control.conversions || 0) / control.visitors;
      let winner: ABTestVariant | undefined;
      let maxLift = 0;
      let confidence = 0;

      variants.forEach(variant => {
        if (variant.is_control || !variant.visitors) return;
        
        const variantRate = (variant.conversions || 0) / variant.visitors;
        const lift = ((variantRate - controlRate) / controlRate) * 100;

        // Simple z-test for statistical significance
        const n1 = control.visitors;
        const n2 = variant.visitors;
        const p1 = controlRate;
        const p2 = variantRate;
        
        const pooledP = ((control.conversions || 0) + (variant.conversions || 0)) / (n1 + n2);
        const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
        const zScore = (p2 - p1) / se;
        
        // Convert z-score to confidence (approximate)
        const variantConfidence = Math.min(99, Math.max(0, (1 - 1 / (1 + Math.abs(zScore))) * 100));

        if (lift > maxLift && variantConfidence > 90) {
          maxLift = lift;
          winner = variant;
          confidence = variantConfidence;
        }
      });

      return { test, variants, winner, confidence };
    } catch (err) {
      console.error("Get test results error:", err);
      return null;
    }
  },

  // REAL: Update variant metrics
  async recordVariantImpression(variantId: string, converted: boolean = false): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      const { data: variant } = await supabase
        .from("ab_test_variants")
        .select("*")
        .eq("id", variantId)
        .single();

      if (!variant) {
        return { success: false, error: "Variant not found" };
      }

      const updates = {
        visitors: (variant.visitors || 0) + 1,
        conversions: (variant.conversions || 0) + (converted ? 1 : 0)
      };

      const { error } = await supabase
        .from("ab_test_variants")
        .update(updates)
        .eq("id", variantId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Failed to record impression" };
    }
  },

  // REAL: Stop test and declare winner
  async stopTest(testId: string): Promise<{
    success: boolean;
    winner: string;
    scalingRecommendations: string[];
    error: string | null;
  }> {
    try {
      const result = await this.getTestResults(testId);
      
      if (!result) {
        return { success: false, winner: "", scalingRecommendations: [], error: "Test not found" };
      }

      const { error: updateError } = await supabase
        .from("ab_tests")
        .update({ 
          status: "completed",
          winner_variant_id: result.winner?.id || null,
          completed_at: new Date().toISOString()
        })
        .eq("id", testId);

      if (updateError) {
        return { success: false, winner: "", scalingRecommendations: [], error: updateError.message };
      }

      const recommendations = result.winner ? [
        `Scale ${result.winner.name} to 100% of traffic`,
        `Expected lift: ${result.confidence.toFixed(1)}% confidence`,
        `Update all campaigns with winning variant content`,
        `Monitor performance for next 7 days`
      ] : [
        "No statistically significant winner found",
        "Continue test or redesign variants",
        "Ensure sufficient sample size"
      ];

      return {
        success: true,
        winner: result.winner?.name || "No clear winner",
        scalingRecommendations: recommendations,
        error: null
      };
    } catch (err) {
      return { success: false, winner: "", scalingRecommendations: [], error: "Failed to stop test" };
    }
  },

  // REAL: Get all tests for a campaign
  async getCampaignTests(campaignId: string): Promise<{
    tests: ABTest[];
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from("ab_tests")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (error) {
        return { tests: [], error: error.message };
      }

      return { tests: data || [], error: null };
    } catch (err) {
      return { tests: [], error: "Failed to fetch tests" };
    }
  }
};