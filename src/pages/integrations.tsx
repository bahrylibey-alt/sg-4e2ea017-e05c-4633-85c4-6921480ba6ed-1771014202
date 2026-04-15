import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";
import { 
  Zap, 
  Facebook, 
  Youtube, 
  Instagram, 
  Twitter,
  Settings,
  X,
  Check,
  Plus,
  AlertCircle,
  Link2,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Mail,
  BarChart3,
  Webhook,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: "automation" | "social" | "affiliate_network" | "payment" | "email" | "analytics";
  status: "available" | "connected";
  connected_at?: string;
  credentials?: {
    access_token?: string;
    page_id?: string;
    account_id?: string;
    api_key?: string;
  };
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
  // AUTOMATION
  {
    id: "zapier",
    name: "Zapier",
    description: "Automate workflows - connect to 5000+ apps",
    icon: Zap,
    category: "automation",
    status: "connected",
    connected_at: "2026-04-08T16:00:00Z"
  },
  {
    id: "webhooks",
    name: "Webhooks",
    description: "Custom webhook integrations for real-time events",
    icon: Webhook,
    category: "automation",
    status: "available"
  },
  
  // PAYMENT PROCESSORS
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept payments - credit cards, subscriptions, invoicing",
    icon: CreditCard,
    category: "payment",
    status: "available"
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Global payment processing and payouts",
    icon: DollarSign,
    category: "payment",
    status: "available"
  },

  // EMAIL MARKETING
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Email marketing automation and campaigns",
    icon: Mail,
    category: "email",
    status: "available"
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Transactional and marketing email delivery",
    icon: Mail,
    category: "email",
    status: "available"
  },
  {
    id: "convertkit",
    name: "ConvertKit",
    description: "Email marketing for creators",
    icon: Mail,
    category: "email",
    status: "available"
  },

  // ANALYTICS & TRACKING
  {
    id: "google_analytics",
    name: "Google Analytics",
    description: "Track website traffic and user behavior",
    icon: BarChart3,
    category: "analytics",
    status: "available"
  },
  {
    id: "facebook_pixel",
    name: "Facebook Pixel",
    description: "Track conversions from Facebook ads",
    icon: BarChart3,
    category: "analytics",
    status: "available"
  },
  {
    id: "tiktok_pixel",
    name: "TikTok Pixel",
    description: "Track conversions from TikTok ads",
    icon: BarChart3,
    category: "analytics",
    status: "available"
  },
  {
    id: "google_tag_manager",
    name: "Google Tag Manager",
    description: "Manage marketing tags without code changes",
    icon: BarChart3,
    category: "analytics",
    status: "available"
  },
  
  // SOCIAL MEDIA
  {
    id: "facebook",
    name: "Facebook",
    description: "Auto-post to Facebook Pages and Groups",
    icon: Facebook,
    category: "social",
    status: "available"
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Auto-post Community posts and video descriptions",
    icon: Youtube,
    category: "social",
    status: "available"
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Auto-post Stories and Feed posts",
    icon: Instagram,
    category: "social",
    status: "available"
  },
  {
    id: "twitter",
    name: "Twitter/X",
    description: "Auto-post tweets and threads",
    icon: Twitter,
    category: "social",
    status: "available"
  },

  // AFFILIATE NETWORKS - FIXED: IDs use underscores to match database, category is "affiliate_network"
  {
    id: "amazon_associates",
    name: "Amazon Associates",
    description: "World's largest affiliate program - millions of products",
    icon: ShoppingCart,
    category: "affiliate_network",
    status: "available"
  },
  {
    id: "aliexpress_affiliate",
    name: "AliExpress Affiliate",
    description: "Global marketplace - competitive commissions up to 50%",
    icon: TrendingUp,
    category: "affiliate_network",
    status: "available"
  },
  {
    id: "temu_affiliate",
    name: "Temu Affiliate",
    description: "Fast-growing marketplace - competitive commissions",
    icon: TrendingUp,
    category: "affiliate_network",
    status: "available"
  },
  {
    id: "shareasale",
    name: "ShareASale",
    description: "4,500+ merchants - fashion, home, tech",
    icon: Link2,
    category: "affiliate_network",
    status: "available"
  },
  {
    id: "clickbank",
    name: "ClickBank",
    description: "Digital products - high commissions (50-75%)",
    icon: DollarSign,
    category: "affiliate_network",
    status: "available"
  },
  {
    id: "impact",
    name: "Impact",
    description: "Premium brands - Uber, Airbnb, Shopify",
    icon: TrendingUp,
    category: "affiliate_network",
    status: "available"
  },
  {
    id: "awin",
    name: "Awin",
    description: "15,000+ advertisers - global network",
    icon: Link2,
    category: "affiliate_network",
    status: "available"
  },
  {
    id: "rakuten",
    name: "Rakuten Advertising",
    description: "1,000+ top brands - Walmart, Macy's, Best Buy",
    icon: ShoppingCart,
    category: "affiliate_network",
    status: "available"
  },
  {
    id: "cj_affiliate",
    name: "CJ Affiliate",
    description: "3,000+ brands - enterprise-level tracking",
    icon: TrendingUp,
    category: "affiliate_network",
    status: "available"
  },
  {
    id: "pepperjam",
    name: "Pepperjam",
    description: "Performance marketing - quality brands",
    icon: DollarSign,
    category: "affiliate_network",
    status: "available"
  },
  {
    id: "flexoffers",
    name: "FlexOffers",
    description: "12,000+ programs - diverse categories",
    icon: Link2,
    category: "affiliate_network",
    status: "available"
  }
];

const MAX_SOCIAL_CONNECTIONS = 5;

export default function IntegrationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>(AVAILABLE_INTEGRATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [connectDialog, setConnectDialog] = useState<{ open: boolean; integration?: Integration }>({ open: false });
  const [credentials, setCredentials] = useState({ pageId: "", accessToken: "", apiKey: "" });

  useEffect(() => {
    loadUser();
    loadConnections();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }
    setUserId(user.id);
  };

  const loadConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load social media connections from social_media_accounts table
      const { data: socialConnections } = await supabase
        .from('social_media_accounts')
        .select('*')
        .eq('user_id', user.id);

      // Load affiliate/other integrations from integrations table
      const { data: affiliateConnections } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id);

      console.log('✅ Connections loaded:', { 
        social: socialConnections?.length || 0, 
        affiliate: affiliateConnections?.length || 0 
      });

      setIntegrations(integrations.map(i => {
        // Check social connections
        const socialConn = socialConnections?.find(c => c.platform === i.id);
        if (socialConn) {
          return {
            ...i,
            status: "connected" as const,
            connected_at: socialConn.created_at,
            credentials: {
              access_token: socialConn.access_token,
              page_id: socialConn.account_id || undefined,
              account_id: socialConn.account_id || undefined
            }
          };
        }

        // Check affiliate/other integrations
        const affiliateConn = affiliateConnections?.find(c => c.provider === i.id);
        if (affiliateConn) {
          return {
            ...i,
            status: "connected" as const,
            connected_at: affiliateConn.connected_at,
            credentials: (affiliateConn.config || {}) as any
          };
        }

        return i;
      }));
    } catch (error) {
      console.error("Failed to load connections:", error);
    }
  };

  const getSocialConnectedCount = () => {
    return integrations.filter(i => i.status === "connected" && i.category === "social").length;
  };

  const canConnectSocial = () => {
    return getSocialConnectedCount() < MAX_SOCIAL_CONNECTIONS;
  };

  const openConnectDialog = (integration: Integration) => {
    setConnectDialog({ open: true, integration });
    setCredentials({ pageId: "", accessToken: "", apiKey: "" });
  };

  const handleConnect = async () => {
    if (!connectDialog.integration || !userId) return;

    try {
      setIsLoading(true);

      const integration = connectDialog.integration;

      console.log(`🔌 Connecting ${integration.name} (${integration.category})...`);

      // CRITICAL FIX: Use correct table based on integration type
      if (integration.category === "affiliate_network" || integration.category === "automation" || integration.category === "payment" || integration.category === "email" || integration.category === "analytics") {
        // AFFILIATE & OTHERS → integrations table
        // First check if exists since we might not know the exact unique constraint name
        const { data: existing } = await supabase
          .from('integrations')
          .select('id')
          .eq('user_id', userId)
          .eq('provider', integration.id)
          .maybeSingle();

        let error;
        if (existing) {
          const { error: updateError } = await supabase
            .from('integrations')
            .update({
              category: integration.category,
              provider_name: integration.name,
              config: {
                api_key: credentials.apiKey || undefined,
                account_id: credentials.pageId || undefined,
                access_token: credentials.accessToken || undefined
              },
              status: 'connected',
              last_sync_at: new Date().toISOString()
            })
            .eq('id', existing.id);
          error = updateError;
        } else {
          const { error: insertError } = await supabase
            .from('integrations')
            .insert({
              user_id: userId,
              provider: integration.id,
              provider_name: integration.name,
              category: integration.category,
              config: {
                api_key: credentials.apiKey || undefined,
                account_id: credentials.pageId || undefined,
                access_token: credentials.accessToken || undefined
              },
              status: 'connected',
              connected_at: new Date().toISOString()
            });
          error = insertError;
        }

        if (error) {
          console.error('❌ Integrations table error:', error);
          throw error;
        }

        console.log(`✅ ${integration.name} connected via integrations table`);

      } else if (integration.category === "social") {
        // SOCIAL MEDIA → social_media_accounts table
        if (!credentials.accessToken) {
          toast({
            title: "Missing Access Token",
            description: "Please provide an access token",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        const { error } = await supabase
          .from('social_media_accounts')
          .upsert({
            user_id: userId,
            platform: integration.id,
            access_token: credentials.accessToken,
            account_id: credentials.pageId || null,
            is_active: true
          }, { onConflict: 'user_id,platform,account_id' });

        if (error) {
          console.error('❌ Social media accounts table error:', error);
          throw error;
        }

        console.log(`✅ ${integration.name} connected via social_media_accounts table`);
      }

      // Update local state
      setIntegrations(integrations.map(i => 
        i.id === integration.id 
          ? { 
              ...i, 
              status: "connected" as const, 
              connected_at: new Date().toISOString(),
              credentials: {
                api_key: credentials.apiKey,
                access_token: credentials.accessToken,
                page_id: credentials.pageId
              }
            }
          : i
      ));

      toast({
        title: "✅ Connected!",
        description: `${integration.name} is now active`
      });

      setConnectDialog({ open: false });
      setCredentials({ pageId: "", accessToken: "", apiKey: "" });

    } catch (error: any) {
      console.error('❌ Connection error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect integration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (integrationId === "zapier") {
      toast({
        title: "Cannot Disconnect Zapier",
        description: "Zapier is the core automation engine",
        variant: "destructive"
      });
      return;
    }

    if (!userId) return;

    try {
      setIsLoading(true);

      const integration = integrations.find(i => i.id === integrationId);
      if (!integration) return;

      console.log(`🔌 Disconnecting ${integration.name} (${integration.category})...`);

      // Use correct table based on category
      if (integration.category === "social") {
        const { error } = await supabase
          .from('social_media_accounts')
          .delete()
          .eq('user_id', userId)
          .eq('platform', integrationId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integrations')
          .delete()
          .eq('user_id', userId)
          .eq('provider', integrationId);

        if (error) throw error;
      }

      setIntegrations(integrations.map(i => 
        i.id === integrationId 
          ? { ...i, status: "available" as const, connected_at: undefined, credentials: undefined }
          : i
      ));

      toast({
        title: "Disconnected",
        description: `${integration.name} has been disconnected`
      });
    } catch (error: any) {
      console.error('❌ Disconnect error:', error);
      toast({
        title: "Disconnect Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncProducts = async (integrationId: string, providerName: string) => {
    if (!userId) return;

    try {
      setIsLoading(true);

      toast({
        title: "Syncing Products",
        description: `Discovering products from ${providerName}...`,
      });

      console.log(`🔄 Starting product sync for ${providerName}...`);

      // Trigger product discovery
      const result = await smartProductDiscovery.discoverProducts(userId, 20);

      console.log('✅ Product sync complete:', result);

      toast({
        title: "Manual Sync Complete",
        description: `Discovered ${result.data?.discovery?.totalDiscovered || 0} new products across ${Object.keys(result.data?.discovery?.byNetwork || {}).length} networks.`,
      });

      // Refresh integrations list
      await loadConnections();

    } catch (error: any) {
      console.error('❌ Product sync failed:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getInstructions = (platform: string) => {
    const instructions: Record<string, { steps: string[]; note: string }> = {
      // Payment
      stripe: {
        steps: [
          "Sign up at stripe.com",
          "Go to Developers → API Keys",
          "Copy Publishable Key and Secret Key",
          "Enable webhook endpoint for payment events"
        ],
        note: "Use test keys for development, live keys for production"
      },
      paypal: {
        steps: [
          "Sign up at paypal.com/business",
          "Go to Account Settings → API Access",
          "Generate API credentials",
          "Copy Client ID and Secret"
        ],
        note: "Requires Business account for API access"
      },

      // Email
      mailchimp: {
        steps: [
          "Sign up at mailchimp.com",
          "Go to Account → Extras → API Keys",
          "Generate new API key",
          "Copy API key and select audience"
        ],
        note: "Free tier includes 500 contacts"
      },
      sendgrid: {
        steps: [
          "Sign up at sendgrid.com",
          "Go to Settings → API Keys",
          "Create API key with Full Access",
          "Copy and save the key (shown once)"
        ],
        note: "Free tier includes 100 emails/day"
      },
      convertkit: {
        steps: [
          "Sign up at convertkit.com",
          "Go to Settings → Advanced → API",
          "Copy API Key and API Secret",
          "Enable webhooks for subscriber events"
        ],
        note: "Creator-focused email platform"
      },

      // Analytics
      google_analytics: {
        steps: [
          "Go to analytics.google.com",
          "Create GA4 property",
          "Copy Measurement ID (G-XXXXXXXXXX)",
          "Optional: Generate API Secret for server-side tracking"
        ],
        note: "GA4 is the current Google Analytics version"
      },
      facebook_pixel: {
        steps: [
          "Go to Facebook Events Manager",
          "Create new pixel",
          "Copy Pixel ID",
          "Add to your website header"
        ],
        note: "Required for Facebook ad conversion tracking"
      },
      tiktok_pixel: {
        steps: [
          "Go to TikTok Ads Manager",
          "Navigate to Assets → Events",
          "Create pixel and copy Pixel ID",
          "Install on your website"
        ],
        note: "Track TikTok ad performance"
      },
      google_tag_manager: {
        steps: [
          "Go to tagmanager.google.com",
          "Create account and container",
          "Copy Container ID (GTM-XXXXXXX)",
          "Install container code on website"
        ],
        note: "Centralized tag management"
      },

      // Automation
      webhooks: {
        steps: [
          "Enter your webhook endpoint URL",
          "Select events to trigger",
          "Configure authentication if needed",
          "Test webhook delivery"
        ],
        note: "Receive real-time notifications for events"
      },

      facebook: {
        steps: [
          "Go to Facebook Business Settings",
          "Navigate to System Users → Add",
          "Generate Access Token with pages_manage_posts permission",
          "Copy Page ID from your Facebook Page settings"
        ],
        note: "Access tokens expire - you'll need to regenerate periodically"
      },
      instagram: {
        steps: [
          "Connect your Instagram Business Account to Facebook",
          "Use the same Facebook access token",
          "Get your Instagram Business Account ID from Facebook Graph API"
        ],
        note: "Requires Instagram Business or Creator account"
      },
      youtube: {
        steps: [
          "Go to Google Cloud Console",
          "Create OAuth 2.0 credentials",
          "Enable YouTube Data API v3",
          "Copy Client ID and Secret"
        ],
        note: "Community posts require YouTube Partner Program"
      },
      twitter: {
        steps: [
          "Go to Twitter Developer Portal",
          "Create a new app",
          "Generate OAuth 2.0 Bearer Token",
          "Enable Read and Write permissions"
        ],
        note: "Free tier limited to 1,500 tweets/month"
      },
      amazon_associates: {
        steps: [
          "Sign up at affiliate-program.amazon.com",
          "Complete your profile and website info",
          "Get approved (usually within 24 hours)",
          "Copy your Associate ID from the dashboard"
        ],
        note: "You need a website or social media presence"
      },
      temu_affiliate: {
        steps: [
          "Sign up at Temu Affiliate Program",
          "Complete application with your promotion channels",
          "Get approved (1-2 days)",
          "Copy your Affiliate ID from the dashboard"
        ],
        note: "Competitive commissions on trending products"
      },
      aliexpress_affiliate: {
        steps: [
          "Sign up at portals.aliexpress.com",
          "Complete publisher application",
          "Get approved (usually 1-2 days)",
          "Go to Tools → API → Get your App Key and App Secret",
          "Copy your Tracking ID from Account Settings"
        ],
        note: "Commissions up to 50% on trending products"
      },
      shareasale: {
        steps: [
          "Sign up at shareasale.com/signup.cfm",
          "Fill out publisher application",
          "Get approved (1-2 days)",
          "Copy Affiliate ID and API Token from Account Settings"
        ],
        note: "Need to apply to individual merchants"
      },
      clickbank: {
        steps: [
          "Create account at clickbank.com",
          "Go to Account Settings",
          "Generate API Key under Developer API",
          "Copy your Account Nickname (your affiliate ID)"
        ],
        note: "Instant approval - start promoting immediately"
      },
      impact: {
        steps: [
          "Sign up at impact.com",
          "Complete publisher application",
          "Get approved by Impact team",
          "Copy API key from Settings → Developer"
        ],
        note: "Premium network - higher approval standards"
      },
      awin: {
        steps: [
          "Sign up at awin.com/gb/affiliates",
          "Complete publisher questionnaire",
          "Verification usually takes 48 hours",
          "Get API credentials from Settings"
        ],
        note: "Global network with 200+ countries"
      },
      rakuten: {
        steps: [
          "Apply at rakutenadvertising.com/publisher",
          "Complete application with website info",
          "Wait for approval (3-5 days)",
          "Get API token from Account Settings"
        ],
        note: "Top-tier brands - quality traffic required"
      },
      cj: {
        steps: [
          "Sign up at cj.com/signup/publisher",
          "Submit publisher application",
          "Get approved (2-3 days)",
          "Copy API credentials from Account → Web Services"
        ],
        note: "Previously Commission Junction - enterprise-level"
      }
    };

    return instructions[platform] || { steps: [], note: "" };
  };

  const socialIntegrations = integrations.filter(i => i.category === "social");
  const affiliateIntegrations = integrations.filter(i => i.category === "affiliate_network");
  const automationIntegrations = integrations.filter(i => i.category === "automation");
  const paymentIntegrations = integrations.filter(i => i.category === "payment");
  const emailIntegrations = integrations.filter(i => i.category === "email");
  const analyticsIntegrations = integrations.filter(i => i.category === "analytics");

  return (
    <>
      <Head>
        <title>Integrations - AffiliatePro</title>
      </Head>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Integrations</h1>
            <p className="text-muted-foreground text-lg">
              Connect your tools and automate your affiliate marketing
            </p>
            <div className="mt-4 flex gap-2 flex-wrap">
              <Badge variant="outline">
                {automationIntegrations.filter(i => i.status === "connected").length}/{automationIntegrations.length} Automation
              </Badge>
              <Badge variant="outline">
                {paymentIntegrations.filter(i => i.status === "connected").length}/{paymentIntegrations.length} Payment
              </Badge>
              <Badge variant="outline">
                {emailIntegrations.filter(i => i.status === "connected").length}/{emailIntegrations.length} Email
              </Badge>
              <Badge variant="outline">
                {analyticsIntegrations.filter(i => i.status === "connected").length}/{analyticsIntegrations.length} Analytics
              </Badge>
              <Badge variant="outline">
                {getSocialConnectedCount()}/{MAX_SOCIAL_CONNECTIONS} Social Media
              </Badge>
              <Badge variant="outline">
                {affiliateIntegrations.filter(i => i.status === "connected").length}/{affiliateIntegrations.length} Affiliate Networks
              </Badge>
            </div>
          </div>

          {/* Core Automation */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">🚀 Automation</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {automationIntegrations.map((integration) => {
                const Icon = integration.icon;
                const isConnected = integration.status === "connected";

                return (
                  <Card key={integration.id} className={isConnected ? "border-green-500/50" : ""}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            {isConnected && (
                              <Badge className="bg-green-500">
                                <Check className="w-3 h-3 mr-1" />
                                Connected
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {isConnected ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDisconnect(integration.id)}
                              disabled={integration.id === "zapier" || isLoading}
                            >
                              <X className="w-4 h-4 mr-2" />
                              {integration.id === "zapier" ? "Core System" : "Disconnect"}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="flex-1"
                            onClick={() => openConnectDialog(integration)}
                            disabled={isLoading}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Payment Processors */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">💳 Payment Processing</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Accept payments and manage payouts
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {paymentIntegrations.map((integration) => {
                const Icon = integration.icon;
                const isConnected = integration.status === "connected";

                return (
                  <Card key={integration.id} className={isConnected ? "border-green-500/50" : ""}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            {isConnected && (
                              <Badge variant="outline" className="text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Connected
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {isConnected ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDisconnect(integration.id)}
                              disabled={isLoading}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Disconnect
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="flex-1"
                            onClick={() => openConnectDialog(integration)}
                            disabled={isLoading}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Email Marketing */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">📧 Email Marketing</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Build email lists and automate campaigns
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {emailIntegrations.map((integration) => {
                const Icon = integration.icon;
                const isConnected = integration.status === "connected";

                return (
                  <Card key={integration.id} className={isConnected ? "border-green-500/50" : ""}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            {isConnected && (
                              <Badge variant="outline" className="text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Connected
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {isConnected ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDisconnect(integration.id)}
                              disabled={isLoading}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Disconnect
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="flex-1"
                            onClick={() => openConnectDialog(integration)}
                            disabled={isLoading}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Analytics & Tracking */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">📊 Analytics & Tracking</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Track performance and optimize conversions
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {analyticsIntegrations.map((integration) => {
                const Icon = integration.icon;
                const isConnected = integration.status === "connected";

                return (
                  <Card key={integration.id} className={isConnected ? "border-green-500/50" : ""}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            {isConnected && (
                              <Badge variant="outline" className="text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Connected
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {isConnected ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDisconnect(integration.id)}
                              disabled={isLoading}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Disconnect
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="flex-1"
                            onClick={() => openConnectDialog(integration)}
                            disabled={isLoading}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Affiliate Networks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">💰 Affiliate Networks</h2>
                <p className="text-sm text-muted-foreground">Connect your affiliate network accounts to discover and promote products</p>
              </div>
              {affiliateIntegrations.some(i => i.status === "connected") && (
                <Button
                  onClick={() => {
                    const connectedAffiliate = affiliateIntegrations.find(i => i.status === "connected");
                    if (connectedAffiliate) {
                      handleSyncProducts(connectedAffiliate.id, "All Networks");
                    }
                  }}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-primary to-purple-600"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Sync All Products
                </Button>
              )}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {affiliateIntegrations.map((integration) => {
                const Icon = integration.icon;
                const isConnected = integration.status === "connected";
                const isAffiliate = integration.category === "affiliate_network";

                return (
                  <Card key={integration.id} className={isConnected ? "border-green-500/50" : ""}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            {isConnected && (
                              <Badge variant="outline" className="text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Connected
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {isConnected ? (
                          <>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDisconnect(integration.id)}
                              disabled={isLoading}
                              className="flex-1"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Disconnect
                            </Button>
                            {isAffiliate && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSyncProducts(integration.id, integration.name)}
                                disabled={isLoading}
                                className="flex-1 border-primary text-primary hover:bg-primary hover:text-white"
                              >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Sync Products
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button
                            onClick={() => setConnectDialog({ open: true, integration })}
                            disabled={isLoading}
                            size="sm"
                            className="w-full"
                          >
                            <Link2 className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      <Dialog open={connectDialog.open} onOpenChange={(open) => setConnectDialog({ open })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Connect {connectDialog.integration?.name}</DialogTitle>
            <DialogDescription>
              {connectDialog.integration?.category === "affiliate_network" 
                ? "Enter your affiliate account details"
                : "Enter your credentials to enable auto-posting"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              {connectDialog.integration?.category === "affiliate_network" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pageId">Account ID / Affiliate ID</Label>
                    <Input
                      id="pageId"
                      placeholder="Enter your affiliate account ID"
                      value={credentials.pageId}
                      onChange={(e) => setCredentials({ ...credentials, pageId: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key (Optional)</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter API key if available"
                      value={credentials.apiKey}
                      onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                    />
                  </div>
                </>
              ) : connectDialog.integration?.category === "social" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pageId">Page/Account ID</Label>
                    <Input
                      id="pageId"
                      placeholder="Enter your page or account ID"
                      value={credentials.pageId}
                      onChange={(e) => setCredentials({ ...credentials, pageId: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accessToken">Access Token</Label>
                    <Input
                      id="accessToken"
                      type="password"
                      placeholder="Enter your access token"
                      value={credentials.accessToken}
                      onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
                    />
                  </div>
                </>
              ) : connectDialog.integration?.category === "payment" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">
                      {connectDialog.integration.id === "stripe" ? "Publishable Key" : "Client ID"}
                    </Label>
                    <Input
                      id="apiKey"
                      placeholder={connectDialog.integration.id === "stripe" ? "pk_..." : "Enter Client ID"}
                      value={credentials.apiKey}
                      onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accessToken">
                      {connectDialog.integration.id === "stripe" ? "Secret Key" : "Secret"}
                    </Label>
                    <Input
                      id="accessToken"
                      type="password"
                      placeholder={connectDialog.integration.id === "stripe" ? "sk_..." : "Enter secret"}
                      value={credentials.accessToken}
                      onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
                    />
                  </div>
                </>
              ) : connectDialog.integration?.category === "analytics" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pageId">
                      {connectDialog.integration.id === "google_analytics" ? "Measurement ID" : 
                       connectDialog.integration.id === "google_tag_manager" ? "Container ID" : "Pixel ID"}
                    </Label>
                    <Input
                      id="pageId"
                      placeholder={
                        connectDialog.integration.id === "google_analytics" ? "G-XXXXXXXXXX" :
                        connectDialog.integration.id === "google_tag_manager" ? "GTM-XXXXXXX" : 
                        "Enter Pixel ID"
                      }
                      value={credentials.pageId}
                      onChange={(e) => setCredentials({ ...credentials, pageId: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Secret (Optional)</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="For server-side tracking"
                      value={credentials.apiKey}
                      onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter your API key"
                      value={credentials.apiKey}
                      onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pageId">Account/Project ID (Optional)</Label>
                    <Input
                      id="pageId"
                      placeholder="Enter account or project ID"
                      value={credentials.pageId}
                      onChange={(e) => setCredentials({ ...credentials, pageId: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            {connectDialog.integration && (
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <p className="font-semibold text-sm">Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                  {getInstructions(connectDialog.integration.id).steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
                {getInstructions(connectDialog.integration.id).note && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-3">
                    ⚠️ {getInstructions(connectDialog.integration.id).note}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialog({ open: false })}>
              Cancel
            </Button>
            <Button 
              onClick={handleConnect} 
              disabled={
                (connectDialog.integration?.category === "affiliate_network" && !credentials.pageId) ||
                (connectDialog.integration?.category !== "affiliate_network" && (!credentials.pageId || !credentials.accessToken)) ||
                isLoading
              }
            >
              {isLoading ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}