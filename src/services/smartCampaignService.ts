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

  // Ensure user profile exists (CRITICAL FIX)
  async ensureProfileExists(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking profile:", checkError);
        return { success: false, error: "Failed to verify user profile" };
      }

      // Profile already exists
      if (existingProfile) {
        console.log("✅ Profile exists:", userId);
        return { success: true, error: null };
      }

      // Create profile if it doesn't exist
      console.log("📝 Creating profile for user:", userId);
      const { error: createError } = await supabase
        .from("profiles")
        .insert({ id: userId, email: null, full_name: null });

      if (createError) {
        console.error("Error creating profile:", createError);
        return { success: false, error: "Failed to create user profile" };
      }

      console.log("✅ Profile created successfully");
      return { success: true, error: null };
    } catch (err) {
      console.error("Unexpected error ensuring profile:", err);
      return { success: false, error: "Profile verification failed" };
    }
  },

  // REVOLUTIONARY ONE-CLICK AUTOMATED CAMPAIGN SYSTEM
  async createQuickCampaign(input: QuickCampaignInput): Promise<OneClickResult> {
    try {
      console.log("🚀 Starting campaign creation with input:", input);

      // Step 1: Verify authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("❌ Authentication failed:", authError);
        return { 
          success: false, 
          campaign: null, 
          affiliateLinks: [], 
          trafficSources: [],
          estimatedReach: 0,
          optimizations: [],
          error: "You must be logged in to create campaigns. Please sign in and try again." 
        };
      }

      console.log("✅ User authenticated:", user.id);

      // Step 1.5: ENSURE PROFILE EXISTS (CRITICAL FIX)
      const profileCheck = await this.ensureProfileExists(user.id);
      if (!profileCheck.success) {
        console.error("❌ Profile check failed:", profileCheck.error);
        return {
          success: false,
          campaign: null,
          affiliateLinks: [],
          trafficSources: [],
          estimatedReach: 0,
          optimizations: [],
          error: profileCheck.error || "Failed to verify user profile. Please contact support."
        };
      }

      // Step 2: Validate input
      if (!input.productUrls || input.productUrls.length === 0) {
        return {
          success: false,
          campaign: null,
          affiliateLinks: [],
          trafficSources: [],
          estimatedReach: 0,
          optimizations: [],
          error: "Please provide at least one product URL"
        };
      }

      console.log("✅ URLs validated:", input.productUrls);

      // Step 3: Determine template
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
          error: "Invalid campaign template selected" 
        };
      }

      console.log("✅ Template selected:", template.name);

      // Step 4: Extract/use product names
      const productNames = input.productNames || input.productUrls.map(url => this.extractProductName(url));
      console.log("✅ Product names:", productNames);

      // Step 5: Generate campaign name
      const campaignName = this.generateCampaignName(productNames, input.customGoal || template.goal);
      console.log("✅ Campaign name generated:", campaignName);

      // Step 6: Create campaign first
      console.log("📝 Creating campaign...");
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
          error: `Campaign creation failed: ${campaignError || "Unknown error"}. Please try again.` 
        };
      }

      console.log("✅ Campaign created successfully:", campaign.id);

      // Step 7: Create affiliate links for all products
      console.log("🔗 Creating affiliate links...");
      const linkPromises = input.productUrls.map(async (url, index) => {
        try {
          const { link, error } = await affiliateLinkService.createLink({
            original_url: url,
            product_name: productNames[index],
            network: "auto-generated",
            commission_rate: 10
          });

          if (error || !link) {
            console.error(`❌ Failed to create link for ${url}:`, error);
            return null;
          }

          console.log(`✅ Link created for ${productNames[index]}`);
          return link;
        } catch (err) {
          console.error(`❌ Exception creating link for ${url}:`, err);
          return null;
        }
      });

      const affiliateLinksResults = await Promise.all(linkPromises);
      const affiliateLinks = affiliateLinksResults.filter(Boolean) as AffiliateLink[];

      console.log(`✅ Created ${affiliateLinks.length}/${input.productUrls.length} affiliate links`);

      if (affiliateLinks.length === 0) {
        console.error("❌ No affiliate links were created");
        return { 
          success: false, 
          campaign: null, 
          affiliateLinks: [],
          trafficSources: [],
          estimatedReach: 0,
          optimizations: [],
          error: "Failed to create affiliate links. Please check your URLs and try again." 
        };
      }

      // Step 8: Launch traffic automation
      console.log("🚦 Launching traffic automation...");
      const trafficResult = await trafficAutomationService.launchAutomatedTraffic({
        campaignId: campaign.id,
        budget: campaign.budget * 0.4
      });

      if (!trafficResult.success) {
        console.warn("⚠️ Traffic automation warning:", trafficResult.error);
      } else {
        console.log("✅ Traffic sources activated:", trafficResult.sources?.length || 0);
      }

      // Step 9: Get optimization insights
      console.log("🔍 Analyzing optimization opportunities...");
      const optimizationResult = await conversionOptimizationService.analyzeAndOptimize(campaign.id);

      const optimizationInsights = optimizationResult.insights.map(i => ({
        title: i.type,
        description: i.suggestion,
        impact: i.impact
      }));

      console.log(`✅ Found ${optimizationInsights.length} optimization insights`);

      // Step 10: Success!
      console.log("🎉 Campaign creation completed successfully!");

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
      console.error("💥 Unexpected error in campaign creation:", err);
      return { 
        success: false, 
        campaign: null, 
        affiliateLinks: [],
        trafficSources: [], 
        estimatedReach: 0, 
        optimizations: [],
        optimizationInsights: [], 
        error: err instanceof Error ? err.message : "An unexpected error occurred. Please try again." 
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

  // Get Optimization Insights
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

  // SIMPLIFIED ONE-CLICK SETUP (For UI)
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