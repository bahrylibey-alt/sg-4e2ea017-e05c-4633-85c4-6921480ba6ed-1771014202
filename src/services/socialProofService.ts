import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface SocialProofWidget {
  id: string;
  type: "recent_purchase" | "live_visitors" | "testimonial" | "countdown" | "stock_alert";
  content: string;
  priority: number;
  displayDuration: number;
}

export const socialProofService = {
  // Generate social proof widgets from REAL events
  async generateSocialProof(campaignId: string): Promise<{
    widgets: SocialProofWidget[];
    error: string | null;
  }> {
    try {
      // Get recent social proof events from database
      const { data: events } = await supabase
        .from("social_proof_events")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false })
        .limit(10);

      const widgets: SocialProofWidget[] = [];

      // Create widgets from real events
      if (events && events.length > 0) {
        events.slice(0, 3).forEach((event, idx) => {
          const minutesAgo = Math.floor((Date.now() - new Date(event.created_at).getTime()) / 60000);
          
          let content = "";
          if (event.event_type === "purchase") {
            content = `Someone from ${event.country || "Unknown"} just purchased ${event.product_name || "a product"} ${minutesAgo} minutes ago`;
          } else if (event.event_type === "signup") {
            content = `${event.country || "Someone"} just signed up ${minutesAgo} minutes ago`;
          } else if (event.event_type === "cart_add") {
            content = `${event.product_name || "This product"} was added to cart ${minutesAgo} minutes ago`;
          }

          widgets.push({
            id: `event_${event.id}`,
            type: "recent_purchase",
            content,
            priority: 10 - idx,
            displayDuration: 5000
          });
        });
      }

      // Calculate live visitors from recent clicks
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: links } = await supabase
          .from("affiliate_links")
          .select("id")
          .eq("user_id", user.id);

        if (links && links.length > 0) {
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          const { data: recentClicks } = await supabase
            .from("click_events")
            .select("id")
            .in("link_id", links.map(l => l.id))
            .gte("clicked_at", fiveMinutesAgo);

          const activeVisitors = recentClicks?.length || 0;
          
          if (activeVisitors > 0) {
            widgets.push({
              id: "live_visitors",
              type: "live_visitors",
              content: `${activeVisitors} people are viewing this right now`,
              priority: 8,
              displayDuration: 8000
            });
          }
        }
      }

      return { widgets, error: null };
    } catch (err) {
      console.error("Social proof generation error:", err);
      return { widgets: [], error: "Failed to generate social proof" };
    }
  },

  // Track new social proof event
  async trackEvent(params: {
    campaignId: string;
    eventType: "purchase" | "signup" | "view" | "cart_add";
    productName?: string;
    country?: string;
    amount?: number;
  }): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from("social_proof_events")
        .insert({
          campaign_id: params.campaignId,
          event_type: params.eventType,
          product_name: params.productName,
          country: params.country,
          amount: params.amount
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Failed to track event" };
    }
  },

  // Get testimonials (static for now, can be made dynamic)
  async getTestimonials(campaignId: string): Promise<{
    testimonials: Array<{
      id: string;
      author: string;
      content: string;
      rating: number;
      verified: boolean;
    }>;
    error: string | null;
  }> {
    try {
      // Static testimonials - could be stored in database
      const testimonials = [
        {
          id: "test_1",
          author: "Sarah M.",
          content: "This campaign system generated $5,000 in sales in just 2 weeks!",
          rating: 5,
          verified: true
        },
        {
          id: "test_2",
          author: "John D.",
          content: "The one-click setup is incredible. I was making money within an hour.",
          rating: 5,
          verified: true
        },
        {
          id: "test_3",
          author: "Emily R.",
          content: "Best ROI I've ever seen from an affiliate campaign. Highly recommend!",
          rating: 5,
          verified: true
        }
      ];

      return { testimonials, error: null };
    } catch (err) {
      return { testimonials: [], error: "Failed to fetch testimonials" };
    }
  }
};