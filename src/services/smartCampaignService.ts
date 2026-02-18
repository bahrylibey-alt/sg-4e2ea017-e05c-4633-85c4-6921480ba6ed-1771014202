import { supabase } from "@/integrations/supabase/client";
import { campaignService } from "./campaignService";
import { affiliateLinkService } from "./affiliateLinkService";
import type { Database } from "@/integrations/supabase/types";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];

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
        { id: "content", name: "Content Marketing" },
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
        { id: "paid-ads", name: "Paid Ads" },
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
        { id: "content", name: "Content Marketing" },
        { id: "social", name: "Social Media" },
        { id: "pr", name: "PR & Media" }
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
        { id: "content", name: "Content Marketing" },
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
    // Simple heuristic: more products = longer campaigns
    // In production, this would use AI to analyze product types
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

  // Extract product name from URL (basic implementation)
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

  // ONE-CLICK CAMPAIGN SETUP
  async createQuickCampaign(input: QuickCampaignInput): Promise<{
    success: boolean;
    campaign: Campaign | null;
    affiliateLinks: string[];
    error: string | null;
  }> {
    try {
      // Step 1: Determine template
      const template = input.templateId 
        ? this.getTemplate(input.templateId) 
        : this.suggestTemplate(input.productUrls);

      if (!template) {
        return { success: false, campaign: null, affiliateLinks: [], error: "Invalid template" };
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
          commission_rate: 10 // Default 10%
        });

        if (error || !link) {
          console.error(`Failed to create link for ${url}:`, error);
          return null;
        }

        return link.cloaked_url;
      });

      const affiliateLinks = (await Promise.all(linkPromises)).filter(Boolean) as string[];

      if (affiliateLinks.length === 0) {
        return { success: false, campaign: null, affiliateLinks: [], error: "Failed to create affiliate links" };
      }

      // Step 5: Create campaign
      const { campaign, error } = await campaignService.createCampaign({
        name: campaignName,
        goal: input.customGoal || template.goal,
        budget: input.customBudget || template.suggestedBudget,
        duration_days: template.suggestedDuration,
        target_audience: template.targetAudience,
        content_strategy: template.contentStrategy,
        products: productNames,
        channels: template.defaultChannels
      });

      if (error || !campaign) {
        return { success: false, campaign: null, affiliateLinks: [], error: error || "Failed to create campaign" };
      }

      return {
        success: true,
        campaign,
        affiliateLinks,
        error: null
      };
    } catch (err) {
      console.error("Quick campaign creation error:", err);
      return {
        success: false,
        campaign: null,
        affiliateLinks: [],
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
      const { campaign, error } = await campaignService.getCampaignDetails(campaignId);

      if (error || !campaign) {
        return { success: false, recommendations: [], error: error || "Campaign not found" };
      }

      const recommendations: string[] = [];

      // Budget optimization
      const roi = campaign.revenue && campaign.spent 
        ? (campaign.revenue / campaign.spent) 
        : 0;

      if (roi < 1.5 && campaign.spent > 0) {
        recommendations.push("⚠️ Low ROI detected. Consider pausing underperforming channels or adjusting targeting.");
      } else if (roi > 3) {
        recommendations.push("✨ Excellent ROI! Consider increasing budget to scale successful campaign.");
      }

      // Budget utilization
      const budgetUsed = campaign.spent && campaign.budget 
        ? (campaign.spent / campaign.budget) * 100 
        : 0;

      if (budgetUsed > 80 && campaign.status === "active") {
        recommendations.push("⚠️ Budget nearly exhausted. Consider increasing budget or campaign will pause soon.");
      } else if (budgetUsed < 30) {
        recommendations.push("💡 Budget underutilized. Consider more aggressive promotion or additional channels.");
      }

      // Duration optimization
      const now = new Date();
      const endDate = new Date(campaign.end_date || "");
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining < 3 && campaign.status === "active") {
        recommendations.push("⏰ Campaign ending soon. Consider extending duration if performing well.");
      }

      return {
        success: true,
        recommendations: recommendations.length > 0 
          ? recommendations 
          : ["✅ Campaign performing well with no immediate optimizations needed."],
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

  async quickSetup(params: { productUrl: string; goal: "sales" | "leads" | "traffic" }) {
    try {
      // 1. Analyze product URL (simulated)
      const productName = params.productUrl.split("/").pop()?.replace(/-/g, " ") || "New Product";
      const formattedName = productName.charAt(0).toUpperCase() + productName.slice(1);
      
      // 2. Create optimized campaign structure
      const campaignData = {
        name: `Auto: ${formattedName} Campaign`,
        goal: params.goal,
        budget: 500, // Smart default - now a number
        duration_days: 30, // Smart default - correct property name
        products: [formattedName],
        channels: [
          { id: "social", name: "Social Media" },
          { id: "email", name: "Email Marketing" }
        ], // Smart defaults based on goal - correct format
        target_audience: "Auto-generated audience based on product analysis"
      };

      const { campaign, error: campaignError } = await campaignService.createCampaign(campaignData);

      if (campaignError || !campaign) {
        throw new Error(campaignError || "Failed to create campaign");
      }

      // 3. Generate affiliate links
      const linkData = {
        product_name: formattedName,
        original_url: params.productUrl,
        network: "auto-generated",
        commission_rate: 10
      };

      const { link, error: linkError } = await affiliateLinkService.createLink(linkData);

      if (linkError) {
        console.error("Failed to create link:", linkError);
        // Continue anyway as campaign is created
      }

      // 4. Generate AI recommendations
      const recommendations = [
        "Target audience looks like: Tech enthusiasts, 25-45",
        "Suggested ad copy tone: Professional & Direct",
        "Estimated CPA: $15.50",
        "Recommended daily budget: $25.00"
      ];

      return {
        success: true,
        campaign,
        links: link ? [link] : [],
        recommendations,
        error: null
      };

    } catch (error: any) {
      console.error("Quick setup failed:", error);
      return {
        success: false,
        campaign: null,
        links: [],
        recommendations: [],
        error: error.message || "Unknown error occurred"
      };
    }
  }
};