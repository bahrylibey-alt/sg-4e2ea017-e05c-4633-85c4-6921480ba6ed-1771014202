import { supabase } from "@/integrations/supabase/client";
import { campaignService } from "./campaignService";
import { affiliateLinkService } from "./affiliateLinkService";
import { trafficAutomationService } from "./trafficAutomationService";
import { conversionOptimizationService } from "./conversionOptimizationService";
import type { Database } from "@/integrations/supabase/types";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type AffiliateLink = Database["public"]["Tables"]["affiliate_links"]["Row"];

export interface CampaignTemplate {
  id: string;
  name: string;
  goal: "sales" | "leads" | "traffic" | "awareness";
  description: string;
  suggestedBudget: number;
  suggestedDuration: number;
  defaultChannels: Array<{ id: string; name: string }>;
  contentStrategy: string;
  targetAudience: string;
}

export interface QuickCampaignInput {
  productUrls: string[];
  productNames?: string[];
  templateId?: string;
  customGoal?: "sales" | "leads" | "traffic" | "awareness";
  customBudget?: number;
}

export interface OneClickResult {
  success: boolean;
  campaign: Campaign | null;
  affiliateLinks: AffiliateLink[];
  trafficSources: any[];
  estimatedReach: number;
  optimizations: string[];
  optimizationInsights?: Array<{ title: string; description: string; impact: string }>;
  error: string | null;
}

export const smartCampaignService = {
  templates: [
    {
      id: "quick-sales",
      name: "Quick Sales Boost",
      goal: "sales" as const,
      description: "Fast-track sales campaign with aggressive promotion",
      suggestedBudget: 500,
      suggestedDuration: 7,
      defaultChannels: [
        { id: "email", name: "Email Marketing" },
        { id: "social", name: "Social Media" },
        { id: "paid", name: "Paid Ads" }
      ],
      contentStrategy: "High-converting product showcases with urgency tactics, limited-time offers, and social proof",
      targetAudience: "Ready-to-buy customers, previous purchasers, warm leads"
    },
    {
      id: "lead-generation",
      name: "Lead Magnet Campaign",
      goal: "leads" as const,
      description: "Build email list with valuable content offers",
      suggestedBudget: 300,
      suggestedDuration: 14,
      defaultChannels: [
        { id: "blog", name: "Content Marketing" },
        { id: "social", name: "Social Media" }
      ],
      contentStrategy: "Educational content, free resources, webinars, and lead magnets to capture emails",
      targetAudience: "Problem-aware audience, information seekers, early-stage buyers"
    },
    {
      id: "traffic-boost",
      name: "Traffic Amplifier",
      goal: "traffic" as const,
      description: "Maximize website visitors and brand exposure",
      suggestedBudget: 400,
      suggestedDuration: 10,
      defaultChannels: [
        { id: "social", name: "Social Media" },
        { id: "paid", name: "Paid Ads" },
        { id: "influencer", name: "Influencer Marketing" }
      ],
      contentStrategy: "Viral-worthy content, engaging visuals, trending topics, and shareable posts",
      targetAudience: "Broad audience, new market segments, cold traffic"
    },
    {
      id: "evergreen",
      name: "Evergreen Sales System",
      goal: "sales" as const,
      description: "Sustainable long-term automated sales funnel",
      suggestedBudget: 800,
      suggestedDuration: 30,
      defaultChannels: [
        { id: "email", name: "Email Marketing" },
        { id: "blog", name: "Content Marketing" },
        { id: "social", name: "Social Media" }
      ],
      contentStrategy: "SEO-optimized content, email nurture sequences, retargeting campaigns, and value-first approach",
      targetAudience: "All funnel stages, recurring customers, organic traffic"
    }
  ] as CampaignTemplate[],

  getTemplates(): CampaignTemplate[] {
    return this.templates;
  },

  getTemplate(templateId: string): CampaignTemplate | null {
    return this.templates.find(t => t.id === templateId) || null;
  },

  suggestTemplate(productUrls: string[]): CampaignTemplate {
    if (productUrls.length === 1) {
      return this.templates[0];
    } else if (productUrls.length <= 3) {
      return this.templates[1];
    } else {
      return this.templates[3];
    }
  },

  generateCampaignName(productNames: string[], goal: string): string {
    const timestamp = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (productNames.length === 1) {
      return `${productNames[0]} ${goal.charAt(0).toUpperCase() + goal.slice(1)} - ${timestamp}`;
    } else if (productNames.length <= 3) {
      return `Multi-Product ${goal.charAt(0).toUpperCase() + goal.slice(1)} - ${timestamp}`;
    } else {
      return `${productNames.length} Products Campaign - ${timestamp}`;
    }
  },

  extractProductName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1] || "Product";
      return lastPart
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
        .slice(0, 50);
    } catch {
      return "Product";
    }
  },

  async ensureProfileExists(userId: string, userEmail: string | null): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log("🔍 Verifying profile for user:", userId);

      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", userId)
        .maybeSingle();

      if (fetchError) {
        console.error("❌ Profile fetch error:", fetchError);
        return { 
          success: false, 
          error: `Database error: ${fetchError.message}` 
        };
      }

      if (existingProfile) {
        console.log("✅ Profile exists");
        return { success: true, error: null };
      }

      console.log("📝 Creating profile...");
      
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: userEmail,
          full_name: null,
          avatar_url: null
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ Profile creation error:", createError);
        
        if (createError.code === "23503") {
          return {
            success: false,
            error: "Session expired. Please sign out and sign in again."
          };
        }

        if (createError.code === "23505") {
          console.log("ℹ️ Profile exists (race condition)");
          return { success: true, error: null };
        }

        return {
          success: false,
          error: `Profile creation failed: ${createError.message}`
        };
      }

      console.log("✅ Profile created:", newProfile.id);
      return { success: true, error: null };

    } catch (err) {
      console.error("💥 Profile verification error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Profile verification failed"
      };
    }
  },

  async createQuickCampaign(input: QuickCampaignInput): Promise<OneClickResult> {
    try {
      console.log("🚀 ONE-CLICK CAMPAIGN START");
      console.log("📦 Input:", JSON.stringify(input, null, 2));

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("❌ Auth failed:", authError);
        return { 
          success: false, 
          campaign: null, 
          affiliateLinks: [], 
          trafficSources: [],
          estimatedReach: 0,
          optimizations: [],
          error: "You must be logged in. Please sign in and try again." 
        };
      }

      console.log("✅ User authenticated:", user.id);

      const profileCheck = await this.ensureProfileExists(user.id, user.email || null);
      
      if (!profileCheck.success) {
        console.error("❌ Profile check failed:", profileCheck.error);
        return {
          success: false,
          campaign: null,
          affiliateLinks: [],
          trafficSources: [],
          estimatedReach: 0,
          optimizations: [],
          error: profileCheck.error || "Profile verification failed"
        };
      }

      console.log("✅ Profile verified");

      if (!input.productUrls || input.productUrls.length === 0) {
        return {
          success: false,
          campaign: null,
          affiliateLinks: [],
          trafficSources: [],
          estimatedReach: 0,
          optimizations: [],
          error: "At least one product URL is required"
        };
      }

      console.log("✅ Input validated");

      const template = input.templateId 
        ? this.getTemplate(input.templateId) 
        : this.suggestTemplate(input.productUrls);

      if (!template) {
        return { 
          success: false, 
          campaign: null, 
          affiliateLinks: [],
          trafficSources: [],
          estimatedReach: 0,
          optimizations: [],
          error: "Invalid template" 
        };
      }

      console.log("✅ Template:", template.name);

      const productNames = input.productNames || input.productUrls.map(url => this.extractProductName(url));
      const campaignName = this.generateCampaignName(productNames, input.customGoal || template.goal);

      console.log("✅ Campaign name:", campaignName);
      console.log("📝 Creating campaign in database...");

      const { campaign, error: campaignError } = await campaignService.createCampaign({
        name: campaignName,
        goal: input.customGoal || template.goal,
        budget: input.customBudget || template.suggestedBudget,
        duration_days: template.suggestedDuration,
        target_audience: template.targetAudience,
        content_strategy: template.contentStrategy,
        products: productNames,
        channels: template.defaultChannels
      });

      if (campaignError || !campaign) {
        console.error("❌ Campaign creation failed:", campaignError);
        return { 
          success: false, 
          campaign: null, 
          affiliateLinks: [],
          trafficSources: [],
          estimatedReach: 0,
          optimizations: [],
          error: campaignError || "Failed to create campaign" 
        };
      }

      console.log("✅ Campaign created:", campaign.id);
      console.log("🔗 Creating affiliate links...");

      const linkPromises = input.productUrls.map(async (url, index) => {
        try {
          const { link, error } = await affiliateLinkService.createLink({
            original_url: url,
            product_name: productNames[index],
            network: "direct",
            commission_rate: 10
          });

          if (error || !link) {
            console.error(`❌ Link creation failed for ${url}:`, error);
            return null;
          }

          console.log(`✅ Link created: ${link.slug}`);
          return link;
        } catch (err) {
          console.error(`❌ Link exception for ${url}:`, err);
          return null;
        }
      });

      const affiliateLinksResults = await Promise.all(linkPromises);
      const affiliateLinks = affiliateLinksResults.filter(Boolean) as AffiliateLink[];

      console.log(`✅ Created ${affiliateLinks.length}/${input.productUrls.length} links`);

      if (affiliateLinks.length === 0) {
        console.error("❌ No links created");
        return { 
          success: false, 
          campaign: null, 
          affiliateLinks: [],
          trafficSources: [],
          estimatedReach: 0,
          optimizations: [],
          error: "Failed to create affiliate links" 
        };
      }

      console.log("🚦 Launching traffic automation...");
      const trafficResult = await trafficAutomationService.launchAutomatedTraffic({
        campaignId: campaign.id,
        budget: campaign.budget * 0.4
      });

      if (!trafficResult.success) {
        console.warn("⚠️ Traffic automation warning:", trafficResult.error);
      } else {
        console.log("✅ Traffic sources:", trafficResult.sources?.length || 0);
      }

      console.log("🔍 Getting optimization insights...");
      const optimizationResult = await conversionOptimizationService.analyzeAndOptimize(campaign.id);

      const optimizationInsights = optimizationResult.insights.map(i => ({
        title: i.type,
        description: i.suggestion,
        impact: i.impact
      }));

      console.log(`✅ Insights: ${optimizationInsights.length}`);
      console.log("🎉 CAMPAIGN CREATION COMPLETE!");

      return {
        success: true,
        campaign,
        affiliateLinks,
        trafficSources: trafficResult.sources || [],
        estimatedReach: (trafficResult.sources?.length || 3) * 1500,
        optimizations: [],
        optimizationInsights,
        error: null
      };
    } catch (err) {
      console.error("💥 Unexpected error:", err);
      return { 
        success: false, 
        campaign: null, 
        affiliateLinks: [],
        trafficSources: [], 
        estimatedReach: 0, 
        optimizations: [],
        optimizationInsights: [], 
        error: err instanceof Error ? err.message : "Unexpected error" 
      };
    }
  },

  async createBatchCampaigns(productGroups: Array<{
    urls: string[];
    names?: string[];
    templateId?: string;
  }>): Promise<{
    successful: number;
    failed: number;
    campaigns: Campaign[];
    errors: string[];
  }> {
    const results = {
      successful: 0,
      failed: 0,
      campaigns: [] as Campaign[],
      errors: [] as string[]
    };

    for (const group of productGroups) {
      const result = await this.createQuickCampaign({
        productUrls: group.urls,
        productNames: group.names,
        templateId: group.templateId
      });

      if (result.success && result.campaign) {
        results.successful++;
        results.campaigns.push(result.campaign);
      } else {
        results.failed++;
        results.errors.push(result.error || "Unknown error");
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  },

  async getOptimizationInsights(campaignId: string): Promise<{
    insights: Array<{ title: string; description: string; impact: string }>;
    error: string | null;
  }> {
    const result = await conversionOptimizationService.analyzeAndOptimize(campaignId);
    
    return {
      insights: result.insights.map(i => ({
        title: i.type,
        description: i.suggestion,
        impact: i.impact
      })),
      error: result.error
    };
  },

  async quickSetup(params: { 
    productUrl: string; 
    budget?: number;
    goal: "sales" | "leads" | "traffic" 
  }): Promise<OneClickResult> {
    return this.createQuickCampaign({
      productUrls: [params.productUrl],
      customGoal: params.goal,
      customBudget: params.budget
    });
  }
};