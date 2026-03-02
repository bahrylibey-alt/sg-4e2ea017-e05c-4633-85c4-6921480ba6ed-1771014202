 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ab_test_variants: {
        Row: {
          content: string | null
          conversions: number | null
          created_at: string | null
          id: string
          is_control: boolean | null
          name: string
          revenue: number | null
          test_id: string
          traffic_percentage: number | null
          visitors: number | null
        }
        Insert: {
          content?: string | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          is_control?: boolean | null
          name: string
          revenue?: number | null
          test_id: string
          traffic_percentage?: number | null
          visitors?: number | null
        }
        Update: {
          content?: string | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          is_control?: boolean | null
          name?: string
          revenue?: number | null
          test_id?: string
          traffic_percentage?: number | null
          visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_variants_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_tests: {
        Row: {
          campaign_id: string
          completed_at: string | null
          confidence_level: number | null
          created_at: string | null
          id: string
          name: string
          status: string
          target_sample_size: number | null
          test_type: string | null
          user_id: string
          winner_variant_id: string | null
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          name: string
          status?: string
          target_sample_size?: number | null
          test_type?: string | null
          user_id: string
          winner_variant_id?: string | null
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          name?: string
          status?: string
          target_sample_size?: number | null
          test_type?: string | null
          user_id?: string
          winner_variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_tests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          click_count: number | null
          clicks: number | null
          cloaked_url: string
          commission_earned: number | null
          commission_rate: number | null
          conversion_count: number | null
          conversions: number | null
          created_at: string | null
          id: string
          network: string | null
          original_url: string
          product_name: string | null
          revenue: number | null
          short_code: string | null
          slug: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          click_count?: number | null
          clicks?: number | null
          cloaked_url: string
          commission_earned?: number | null
          commission_rate?: number | null
          conversion_count?: number | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          network?: string | null
          original_url: string
          product_name?: string | null
          revenue?: number | null
          short_code?: string | null
          slug: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          click_count?: number | null
          clicks?: number | null
          cloaked_url?: string
          commission_earned?: number | null
          commission_rate?: number | null
          conversion_count?: number | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          network?: string | null
          original_url?: string
          product_name?: string | null
          revenue?: number | null
          short_code?: string | null
          slug?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_content: {
        Row: {
          content: string
          content_type: string
          created_at: string | null
          id: string
          length: string | null
          product_name: string | null
          status: string | null
          title: string | null
          tone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          content_type: string
          created_at?: string | null
          id?: string
          length?: string | null
          product_name?: string | null
          status?: string | null
          title?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string | null
          id?: string
          length?: string | null
          product_name?: string | null
          status?: string | null
          title?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_allocations: {
        Row: {
          allocated_budget: number | null
          campaign_id: string
          channel_name: string
          created_at: string | null
          id: string
          revenue: number | null
          roi: number | null
          spent: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allocated_budget?: number | null
          campaign_id: string
          channel_name: string
          created_at?: string | null
          id?: string
          revenue?: number | null
          roi?: number | null
          spent?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allocated_budget?: number | null
          campaign_id?: string
          channel_name?: string
          created_at?: string | null
          id?: string
          revenue?: number | null
          roi?: number | null
          spent?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_allocations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_allocations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_channels: {
        Row: {
          campaign_id: string
          channel_id: string
          channel_name: string
          created_at: string | null
          id: string
        }
        Insert: {
          campaign_id: string
          channel_id: string
          channel_name: string
          created_at?: string | null
          id?: string
        }
        Update: {
          campaign_id?: string
          channel_id?: string
          channel_name?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_channels_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_performance: {
        Row: {
          campaign_id: string
          clicks: number | null
          conversions: number | null
          created_at: string | null
          date: string
          id: string
          impressions: number | null
          revenue: number | null
          spent: number | null
        }
        Insert: {
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          date: string
          id?: string
          impressions?: number | null
          revenue?: number | null
          spent?: number | null
        }
        Update: {
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          date?: string
          id?: string
          impressions?: number | null
          revenue?: number | null
          spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_performance_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_products: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          product_name: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          product_name: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          product_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_products_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          content_strategy: string | null
          created_at: string | null
          duration_days: number | null
          end_date: string | null
          goal: string
          id: string
          name: string
          revenue: number | null
          spent: number | null
          start_date: string | null
          status: string | null
          target_audience: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget?: number | null
          content_strategy?: string | null
          created_at?: string | null
          duration_days?: number | null
          end_date?: string | null
          goal: string
          id?: string
          name: string
          revenue?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          target_audience?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget?: number | null
          content_strategy?: string | null
          created_at?: string | null
          duration_days?: number | null
          end_date?: string | null
          goal?: string
          id?: string
          name?: string
          revenue?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          target_audience?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      click_events: {
        Row: {
          clicked_at: string | null
          converted: boolean | null
          country: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          link_id: string
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          converted?: boolean | null
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          link_id: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          converted?: boolean | null
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "click_events_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "click_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          campaign_id: string | null
          commission_rate: number | null
          created_at: string | null
          customer_id: string | null
          id: string
          link_id: string | null
          network: string | null
          order_date: string | null
          paid_date: string | null
          product_name: string | null
          status: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          commission_rate?: number | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          link_id?: string | null
          network?: string | null
          order_date?: string | null
          paid_date?: string | null
          product_name?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          commission_rate?: number | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          link_id?: string | null
          network?: string | null
          order_date?: string | null
          paid_date?: string | null
          product_name?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          campaign_id: string
          click_rate: number | null
          conversion_rate: number | null
          created_at: string | null
          id: string
          name: string
          open_rate: number | null
          sequence_type: string
          status: string | null
        }
        Insert: {
          campaign_id: string
          click_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          name: string
          open_rate?: number | null
          sequence_type: string
          status?: string | null
        }
        Update: {
          campaign_id?: string
          click_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          name?: string
          open_rate?: number | null
          sequence_type?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          click_count: number | null
          created_at: string | null
          day_delay: number
          id: string
          open_count: number | null
          preview_text: string | null
          sent_count: number | null
          sequence_id: string
          subject: string
          template_content: string | null
        }
        Insert: {
          click_count?: number | null
          created_at?: string | null
          day_delay: number
          id?: string
          open_count?: number | null
          preview_text?: string | null
          sent_count?: number | null
          sequence_id: string
          subject: string
          template_content?: string | null
        }
        Update: {
          click_count?: number | null
          created_at?: string | null
          day_delay?: number
          id?: string
          open_count?: number | null
          preview_text?: string | null
          sent_count?: number | null
          sequence_id?: string
          subject?: string
          template_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_alerts: {
        Row: {
          alert_type: string
          campaign_id: string
          created_at: string | null
          details: string | null
          estimated_loss: number | null
          id: string
          ip_address: string | null
          resolved: boolean | null
          severity: string
        }
        Insert: {
          alert_type: string
          campaign_id: string
          created_at?: string | null
          details?: string | null
          estimated_loss?: number | null
          id?: string
          ip_address?: string | null
          resolved?: boolean | null
          severity: string
        }
        Update: {
          alert_type?: string
          campaign_id?: string
          created_at?: string | null
          details?: string | null
          estimated_loss?: number | null
          id?: string
          ip_address?: string | null
          resolved?: boolean | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_alerts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_stages: {
        Row: {
          avg_time_seconds: number | null
          campaign_id: string
          created_at: string | null
          drop_off: number | null
          id: string
          stage_name: string
          stage_order: number
          visitors: number | null
        }
        Insert: {
          avg_time_seconds?: number | null
          campaign_id: string
          created_at?: string | null
          drop_off?: number | null
          id?: string
          stage_name: string
          stage_order: number
          visitors?: number | null
        }
        Update: {
          avg_time_seconds?: number | null
          campaign_id?: string
          created_at?: string | null
          drop_off?: number | null
          id?: string
          stage_name?: string
          stage_order?: number
          visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_stages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_insights: {
        Row: {
          applied_at: string | null
          campaign_id: string
          created_at: string | null
          description: string
          id: string
          impact_score: number | null
          insight_type: string
          results_after: Json | null
          results_before: Json | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          campaign_id: string
          created_at?: string | null
          description: string
          id?: string
          impact_score?: number | null
          insight_type: string
          results_after?: Json | null
          results_before?: Json | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          campaign_id?: string
          created_at?: string | null
          description?: string
          id?: string
          impact_score?: number | null
          insight_type?: string
          results_after?: Json | null
          results_before?: Json | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimization_insights_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimization_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_logs: {
        Row: {
          action_type: string
          campaign_id: string
          created_at: string | null
          description: string | null
          id: string
          impact_score: string | null
        }
        Insert: {
          action_type: string
          campaign_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          impact_score?: string | null
        }
        Update: {
          action_type?: string
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          impact_score?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "optimization_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_history: {
        Row: {
          applied_at: string | null
          campaign_id: string
          id: string
          optimized_price: number
          original_price: number
          price_elasticity: number | null
          product_url: string
          revenue_impact: number | null
        }
        Insert: {
          applied_at?: string | null
          campaign_id: string
          id?: string
          optimized_price: number
          original_price: number
          price_elasticity?: number | null
          product_url: string
          revenue_impact?: number | null
        }
        Update: {
          applied_at?: string | null
          campaign_id?: string
          id?: string
          optimized_price?: number
          original_price?: number
          price_elasticity?: number | null
          product_url?: string
          revenue_impact?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_history_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      retargeting_audiences: {
        Row: {
          audience_type: string
          campaign_id: string
          created_at: string | null
          engagement_score: number | null
          id: string
          name: string
          recency_days: number | null
          size: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audience_type: string
          campaign_id: string
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          name: string
          recency_days?: number | null
          size?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audience_type?: string
          campaign_id?: string
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          name?: string
          recency_days?: number | null
          size?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retargeting_audiences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retargeting_audiences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      retargeting_campaigns: {
        Row: {
          ad_content: string | null
          audience_id: string
          budget: number | null
          campaign_id: string
          clicks: number | null
          conversions: number | null
          created_at: string | null
          frequency_cap: number | null
          id: string
          impressions: number | null
          spent: number | null
          status: string
          user_id: string
        }
        Insert: {
          ad_content?: string | null
          audience_id: string
          budget?: number | null
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          frequency_cap?: number | null
          id?: string
          impressions?: number | null
          spent?: number | null
          status?: string
          user_id: string
        }
        Update: {
          ad_content?: string | null
          audience_id?: string
          budget?: number | null
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          frequency_cap?: number | null
          id?: string
          impressions?: number | null
          spent?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retargeting_campaigns_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "retargeting_audiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retargeting_campaigns_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retargeting_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_proof_events: {
        Row: {
          amount: number | null
          campaign_id: string
          country: string | null
          created_at: string | null
          event_type: string
          id: string
          product_name: string | null
        }
        Insert: {
          amount?: number | null
          campaign_id: string
          country?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          product_name?: string | null
        }
        Update: {
          amount?: number | null
          campaign_id?: string
          country?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          product_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_proof_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      traffic_sources: {
        Row: {
          automation_enabled: boolean | null
          campaign_id: string
          conversion_rate: number | null
          cpc: number | null
          created_at: string | null
          ctr: number | null
          daily_budget: number | null
          id: string
          source_name: string
          source_type: string
          status: string
          total_clicks: number | null
          total_conversions: number | null
          total_revenue: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          automation_enabled?: boolean | null
          campaign_id: string
          conversion_rate?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          daily_budget?: number | null
          id?: string
          source_name: string
          source_type: string
          status?: string
          total_clicks?: number | null
          total_conversions?: number | null
          total_revenue?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          automation_enabled?: boolean | null
          campaign_id?: string
          conversion_rate?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          daily_budget?: number | null
          id?: string
          source_name?: string
          source_type?: string
          status?: string
          total_clicks?: number | null
          total_conversions?: number | null
          total_revenue?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traffic_sources_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          autopilot_enabled: boolean | null
          created_at: string | null
          currency: string | null
          notification_email: boolean | null
          notification_push: boolean | null
          payout_email: string | null
          payout_method: string | null
          payout_minimum: number | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          autopilot_enabled?: boolean | null
          created_at?: string | null
          currency?: string | null
          notification_email?: boolean | null
          notification_push?: boolean | null
          payout_email?: string | null
          payout_method?: string | null
          payout_minimum?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          autopilot_enabled?: boolean | null
          created_at?: string | null
          currency?: string | null
          notification_email?: boolean | null
          notification_push?: boolean | null
          payout_email?: string | null
          payout_method?: string | null
          payout_minimum?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
