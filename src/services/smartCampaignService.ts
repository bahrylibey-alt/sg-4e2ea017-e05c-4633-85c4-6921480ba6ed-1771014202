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
  error: string | null;
}

export const smartCampaignService = {
  // Pre-defined campaign templates
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
        { id: "paid-ads", name: "Paid Ads" }
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
        { id: "social", name: "Social Media" },
        { id: "seo", name: "SEO" }
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
      id: "brand-awareness",
      name: "Brand Builder",
      goal: "awareness" as const,
      description: "Establish brand presence and thought leadership",
      suggestedBudget: 600,
      suggestedDuration: 21,
      defaultChannels: [
        { id: "blog", name: "Content Marketing" },
        { id: "social", name: "Social Media" },
        { id: "youtube", name: "PR & Media" }
      ],
      contentStrategy: "Authority content, brand storytelling, educational series, and consistent messaging",
      targetAudience: "Industry professionals, potential partners, general public"
    },
    {
      id: "evergreen",
      name: "Evergreen Performer",
      goal: "sales" as const,
      description: "Sustainable long-term sales machine",
      suggestedBudget: 800,
      suggestedDuration: 30,
      defaultChannels: [
        { id: "email", name: "Email Marketing" },
        { id: "blog", name: "Content Marketing" },
        { id: "seo", name: "SEO" },
        { id: "social", name: "Social Media" }
      ],
      contentStrategy: "SEO-optimized content, email nurture sequences, retargeting campaigns, and value-first approach",
      targetAudience: "All funnel stages, recurring customers, organic traffic"
    }
  ] as CampaignTemplate[],

  // Get all templates
  getTemplates(): CampaignTemplate[] {
    return this.templates;
  },

  // Get template by ID
  getTemplate(templateId: string): CampaignTemplate | null {
    return this.templates.find(t => t.id === templateId) || null;
  },

  // Smart campaign suggestion based on product analysis
  suggestTemplate(productUrls: string[]): CampaignTemplate {
    if (productUrls.length === 1) {
      return this.templates[0]; // Quick sales for single product
    } else if (productUrls.length <= 3) {
      return this.templates[1]; // Lead generation for few products
    } else {
      return this.templates[4]; // Evergreen for multiple products
    }
  },

  // Generate smart campaign name
  generateCampaignName(productNames: string[], goal: string): string {
    const timestamp = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (productNames.length === 1) {
      return `${productNames[0]} ${goal.charAt(0).toUpperCase() + goal.slice(1)} - ${timestamp}`;
    } else if (productNames.length <= 3) {
      return `Multi-Product ${goal.charAt(0).toUpperCase() + goal.slice(1)} - ${timestamp}`;
    } else {
      return `${productNames.length} Products ${goal.charAt(0).toUpperCase() + goal.slice(1)} - ${timestamp}`;
    }
  },

  // Extract product name from URL
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
        .join(" ");
    } catch {
      return "Product";
    }
  },

  // REVOLUTIONARY ONE-CLICK AUTOMATED CAMPAIGN SYSTEM
  async createQuickCampaign(input: QuickCampaignInput): Promise<OneClickResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { 
          success: false, 
          campaign: null, 
          affiliateLinks: [], 
          trafficSources: [],
          estimatedReach: 0,
          optimizations: [],
          error: "User not authenticated" 
        };
      }

      // Step 1: Determine template
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

      // Step 2: Extract/use product names
      const productNames = input.productNames || input.productUrls.map(url => this.extractProductName(url));

      // Step 3: Generate campaign name
      const campaignName = this.generateCampaignName(productNames, input.customGoal || template.goal);

      // Step 4: Create affiliate links for all products
      const linkPromises = input.productUrls.map(async (url, index) => {
        const { link, error } = await affiliateLinkService.createLink({
          original_url: url,
          product_name: productNames[index],
          network: "auto-generated",
          commission_rate: 10
        });

        if (error || !link) {
          console.error(`Failed to create link for ${url}:`, error);
          return null;
        }

        return link;
      });

      const affiliateLinks = (await Promise.all(linkPromises)).filter(Boolean) as AffiliateLink[];

      if (affiliateLinks.length === 0) {
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

      // Step 5: Create campaign
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

      // Step 6: Launch automated traffic generation
      const trafficResult = await trafficAutomationService.launchAutomatedTraffic({
        campaignId: campaign.id,
        targetTraffic: 10000, // Daily target
        budget: Number(campaign.budget) || 500,
        channels: template.defaultChannels.map(c => c.id),
        optimization: "conversions",
        autoScale: true
      });

      // Step 7: Generate AI optimization insights
      const optimizationResult = await conversionOptimizationService.analyzeAndOptimize(campaign.id);

      return {
        success: true,
        campaign,
        affiliateLinks,
        trafficSources: trafficResult.trafficSources,
        estimatedReach: trafficResult.estimatedReach,
        optimizations: optimizationResult.insights.map(i => i.title),
        error: null
      };
    } catch (err) {
      console.error("Quick campaign creation error:", err);
      return {
        success: false,
        campaign: null,
        affiliateLinks: [],
        trafficSources: [],
        estimatedReach: 0,
        optimizations: [],
        error: "Unexpected error during campaign creation"
      };
    }
  },

  // Batch create campaigns from multiple products
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

      // Rate limiting: wait 500ms between campaigns
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  },

  // Auto-optimize existing campaign
  async optimizeCampaign(campaignId: string): Promise<{
    success: boolean;
    recommendations: string[];
    error: string | null;
  }> {
    try {
      const optimizationResult = await conversionOptimizationService.analyzeAndOptimize(campaignId);
      
      if (!optimizationResult.success) {
        return { 
          success: false, 
          recommendations: [], 
          error: optimizationResult.error 
        };
      }

      const recommendations = optimizationResult.insights.map(
        i => `${i.title}: ${i.description} (${i.impact}% impact)`
      );

      return {
        success: true,
        recommendations,
        error: null
      };
    } catch (err) {
      return {
        success: false,
        recommendations: [],
        error: "Failed to analyze campaign"
      };
    }
  },

  // SIMPLIFIED ONE-CLICK SETUP (For UI)
  async quickSetup(params: { 
    productUrl: string; 
    goal: "sales" | "leads" | "traffic" 
  }): Promise<OneClickResult> {
    return this.createQuickCampaign({
      productUrls: [params.productUrl],
      customGoal: params.goal
    });
  }
};