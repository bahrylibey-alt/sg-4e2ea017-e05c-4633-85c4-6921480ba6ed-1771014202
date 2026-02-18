import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface EmailSequence {
  id: string;
  name: string;
  emails: Array<{
    dayDelay: number;
    subject: string;
    previewText: string;
    template: string;
  }>;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export const emailAutomationService = {
  // Create automated email sequences with REAL database storage
  async createSequence(campaignId: string, type: "welcome" | "abandoned_cart" | "nurture" | "winback"): Promise<{
    sequence: EmailSequence | null;
    error: string | null;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { sequence: null, error: "Not authenticated" };
      }

      // Email sequence templates
      const templates = {
        welcome: {
          name: "Welcome Series",
          emails: [
            { dayDelay: 0, subject: "Welcome! Here's your exclusive discount 🎉", previewText: "Get 20% off your first purchase today", template: "welcome_email_1" },
            { dayDelay: 3, subject: "Discover our best-selling products", previewText: "See what others are loving", template: "welcome_email_2" },
            { dayDelay: 7, subject: "Last chance for your welcome discount", previewText: "Don't miss out on 20% off", template: "welcome_email_3" }
          ]
        },
        abandoned_cart: {
          name: "Cart Recovery",
          emails: [
            { dayDelay: 0, subject: "You left something behind...", previewText: "Your cart is waiting for you", template: "cart_1" },
            { dayDelay: 1, subject: "Special discount: Complete your order now", previewText: "Here's 10% off to complete your purchase", template: "cart_2" },
            { dayDelay: 3, subject: "Last call: Your cart expires soon", previewText: "Don't lose your saved items", template: "cart_3" }
          ]
        },
        nurture: {
          name: "Lead Nurture",
          emails: [
            { dayDelay: 0, subject: "How to get the most out of [Product]", previewText: "Expert tips and tricks", template: "nurture_1" },
            { dayDelay: 5, subject: "Customer success story: Real results", previewText: "See real results from real customers", template: "nurture_2" },
            { dayDelay: 10, subject: "Ready to take the next step?", previewText: "Let's talk about your goals", template: "nurture_3" }
          ]
        },
        winback: {
          name: "Win-Back Campaign",
          emails: [
            { dayDelay: 0, subject: "We miss you! Here's what's new", previewText: "Come back and see what you've been missing", template: "winback_1" },
            { dayDelay: 3, subject: "Exclusive offer just for you", previewText: "25% off to welcome you back", template: "winback_2" },
            { dayDelay: 7, subject: "Before you go... one last offer", previewText: "We'd love to have you back", template: "winback_3" }
          ]
        }
      };

      const template = templates[type];

      // Create sequence in database
      const { data: sequence, error: seqError } = await supabase
        .from("email_sequences")
        .insert({
          campaign_id: campaignId,
          sequence_type: type,
          name: template.name,
          status: "active",
          open_rate: 0,
          click_rate: 0,
          conversion_rate: 0
        })
        .select()
        .single();

      if (seqError || !sequence) {
        return { sequence: null, error: seqError?.message || "Failed to create sequence" };
      }

      // Create email templates
      for (const email of template.emails) {
        await supabase.from("email_templates").insert({
          sequence_id: sequence.id,
          day_delay: email.dayDelay,
          subject: email.subject,
          preview_text: email.previewText,
          template_content: email.template,
          sent_count: 0,
          open_count: 0,
          click_count: 0
        });
      }

      // Get full sequence with templates
      const { data: templates_data } = await supabase
        .from("email_templates")
        .select("*")
        .eq("sequence_id", sequence.id)
        .order("day_delay", { ascending: true });

      return {
        sequence: {
          id: sequence.id,
          name: sequence.name,
          emails: (templates_data || []).map(t => ({
            dayDelay: t.day_delay,
            subject: t.subject,
            previewText: t.preview_text || "",
            template: t.template_content || ""
          })),
          openRate: sequence.open_rate || 0,
          clickRate: sequence.click_rate || 0,
          conversionRate: sequence.conversion_rate || 0
        },
        error: null
      };
    } catch (err) {
      console.error("Email sequence error:", err);
      return { sequence: null, error: "Failed to create email sequence" };
    }
  },

  // Get sequences for a campaign
  async getSequences(campaignId: string): Promise<{
    sequences: EmailSequence[];
    error: string | null;
  }> {
    try {
      const { data: sequences } = await supabase
        .from("email_sequences")
        .select("*")
        .eq("campaign_id", campaignId);

      if (!sequences) {
        return { sequences: [], error: null };
      }

      const fullSequences: EmailSequence[] = [];

      for (const seq of sequences) {
        const { data: templates } = await supabase
          .from("email_templates")
          .select("*")
          .eq("sequence_id", seq.id)
          .order("day_delay", { ascending: true });

        fullSequences.push({
          id: seq.id,
          name: seq.name,
          emails: (templates || []).map(t => ({
            dayDelay: t.day_delay,
            subject: t.subject,
            previewText: t.preview_text || "",
            template: t.template_content || ""
          })),
          openRate: seq.open_rate || 0,
          clickRate: seq.click_rate || 0,
          conversionRate: seq.conversion_rate || 0
        });
      }

      return { sequences: fullSequences, error: null };
    } catch (err) {
      return { sequences: [], error: "Failed to fetch sequences" };
    }
  },

  // Update sequence metrics (called when emails are sent/opened)
  async updateMetrics(sequenceId: string, metrics: {
    sentCount?: number;
    openCount?: number;
    clickCount?: number;
  }): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: templates } = await supabase
        .from("email_templates")
        .select("*")
        .eq("sequence_id", sequenceId);

      if (!templates || templates.length === 0) {
        return { success: false, error: "Sequence not found" };
      }

      const totalSent = templates.reduce((sum, t) => sum + (t.sent_count || 0), 0) + (metrics.sentCount || 0);
      const totalOpens = templates.reduce((sum, t) => sum + (t.open_count || 0), 0) + (metrics.openCount || 0);
      const totalClicks = templates.reduce((sum, t) => sum + (t.click_count || 0), 0) + (metrics.clickCount || 0);

      const openRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;

      const { error } = await supabase
        .from("email_sequences")
        .update({
          open_rate: openRate,
          click_rate: clickRate
        })
        .eq("id", sequenceId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Failed to update metrics" };
    }
  }
};