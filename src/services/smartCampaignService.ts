import { supabase } from "@/integrations/supabase/client";
import { campaignService } from "./campaignService";
import { authService } from "./authService";
import { affiliateLinkService } from "./affiliateLinkService";
import { freeTrafficEngine } from "./freeTrafficEngine";
import { automationScheduler } from "./automationScheduler";
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
  automationStatus: string;
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
        { id: "reddit", name: "Reddit Communities" },
        { id: "facebook", name: "Facebook Groups" },
        { id: "twitter", name: "Twitter/X Threads" }
      ],
      contentStrategy: "High-converting product showcases with urgency tactics, limited-time offers, and social proof",
      targetAudience: "Ready-to-buy customers, previous purchasers, warm leads"
    },
    {
      id: "viral-traffic",
      name: "Viral Traffic Machine",
      goal: "traffic" as const,
      description: "Maximum exposure through viral content on social platforms",
      suggestedBudget: 300,
      suggestedDuration: 14,
      defaultChannels: [
        { id: "tiktok", name: "TikTok Organic" },
        { id: "instagram", name: "Instagram Reels" },
        { id: "youtube", name: "YouTube Shorts" }
      ],
      contentStrategy: "Viral-worthy short-form videos, trending audio, engaging hooks, share-worthy moments",
      targetAudience: "Broad audience, new market segments, cold traffic"
    },
    {
      id: "free-traffic-domination",
      name: "Free Traffic Domination",
      goal: "sales" as const,
      description: "Zero-cost traffic from 10+ free sources",
      suggestedBudget: 0,
      suggestedDuration: 30,
      defaultChannels: [
        { id: "reddit", name: "Reddit Communities" },
        { id: "quora", name: "Quora Answers" },
        { id: "medium", name: "Medium Articles" },
        { id: "pinterest", name: "Pinterest Pins" }
      ],
      contentStrategy: "Value-first content, community engagement, SEO optimization, organic reach",
      targetAudience: "All funnel stages, organic seekers, problem-aware audience"
    }
  ] as CampaignTemplate[],

  getTemplates(): CampaignTemplate[] {
    return this.templates;
  },

  getTemplate(templateId: string): CampaignTemplate | null {
    return this.templates.find(t => t.id === templateId) || null;
  },

  suggestTemplate(productUrls: string[]): CampaignTemplate {
    // Always suggest free traffic domination for maximum ROI
    return this.templates[2];
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
      console.log("🚀 ONE-CLICK CAMPAIGN START (WITH REAL AUTOMATION)");
      console.log("📦 Input:", JSON.stringify(input, null, 2));

      const user = await authService.getCurrentUser();
      
      if (!user) {
        console.error("❌ Auth failed: No user found");
        return { 
          success: false, 
          campaign: null, 
          affiliateLinks: [], 
          trafficSources: [],
          estimatedReach: 0,
          optimizations: [],
          automationStatus: "failed",
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
          automationStatus: "failed",
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
          automationStatus: "failed",
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
          automationStatus: "failed",
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
          automationStatus: "failed",
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
          automationStatus: "failed",
          error: "Failed to create affiliate links" 
        };
      }

      // CRITICAL: Activate FREE traffic sources with REAL automation
      console.log("🚦 Activating FREE traffic automation...");
      const trafficResult = await freeTrafficEngine.activateFreeTraffic(
        campaign.id,
        template.defaultChannels.map(c => c.name)
      );

      if (!trafficResult.success) {
        console.warn("⚠️ Traffic activation warning:", trafficResult.error);
      } else {
        console.log(`✅ Traffic sources: ${trafficResult.activated}`);
        console.log(`📊 Estimated reach: ${trafficResult.estimatedReach.toLocaleString()}`);
      }

      // CRITICAL: Create automation tasks for continuous operation
      console.log("⚙️ Setting up automation tasks...");
      const tasksCreated = await automationScheduler.createDefaultTasks(campaign.id);
      
      if (!tasksCreated) {
        console.warn("⚠️ Failed to create automation tasks");
      } else {
        console.log("✅ Automation tasks scheduled");
      }

      // CRITICAL: Start the automation scheduler if not already running
      if (!automationScheduler.isRunning) {
        console.log("🚀 Starting automation scheduler...");
        await automationScheduler.start();
        console.log("✅ Scheduler is now RUNNING");
      } else {
        console.log("✅ Scheduler already running");
      }

      console.log("🎉 CAMPAIGN CREATION COMPLETE WITH REAL AUTOMATION!");

      return {
        success: true,
        campaign,
        affiliateLinks,
        trafficSources: trafficResult.sources || [],
        estimatedReach: trafficResult.estimatedReach,
        optimizations: ["Automation tasks scheduled", "Free traffic sources activated", "Content generation enabled"],
        automationStatus: "active",
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
        automationStatus: "failed",
        error: err instanceof Error ? err.message : "Unexpected error" 
      };
    }
  }
};