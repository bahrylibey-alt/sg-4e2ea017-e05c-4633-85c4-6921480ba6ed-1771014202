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
  TrendingUp
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: "automation" | "social" | "affiliate";
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

  // AFFILIATE NETWORKS
  {
    id: "amazon-associates",
    name: "Amazon Associates",
    description: "World's largest affiliate program - millions of products",
    icon: ShoppingCart,
    category: "affiliate",
    status: "available"
  },
  {
    id: "shareasale",
    name: "ShareASale",
    description: "4,500+ merchants - fashion, home, tech",
    icon: Link2,
    category: "affiliate",
    status: "available"
  },
  {
    id: "clickbank",
    name: "ClickBank",
    description: "Digital products - high commissions (50-75%)",
    icon: DollarSign,
    category: "affiliate",
    status: "available"
  },
  {
    id: "impact",
    name: "Impact",
    description: "Premium brands - Uber, Airbnb, Shopify",
    icon: TrendingUp,
    category: "affiliate",
    status: "available"
  },
  {
    id: "awin",
    name: "Awin",
    description: "15,000+ advertisers - global network",
    icon: Link2,
    category: "affiliate",
    status: "available"
  },
  {
    id: "rakuten",
    name: "Rakuten Advertising",
    description: "1,000+ top brands - Walmart, Macy's, Best Buy",
    icon: ShoppingCart,
    category: "affiliate",
    status: "available"
  },
  {
    id: "cj",
    name: "CJ Affiliate",
    description: "3,000+ brands - enterprise-level tracking",
    icon: TrendingUp,
    category: "affiliate",
    status: "available"
  },
  {
    id: "pepperjam",
    name: "Pepperjam",
    description: "Performance marketing - quality brands",
    icon: DollarSign,
    category: "affiliate",
    status: "available"
  },
  {
    id: "flexoffers",
    name: "FlexOffers",
    description: "12,000+ programs - diverse categories",
    icon: Link2,
    category: "affiliate",
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
      if (integration.category === "affiliate" || integration.category === "automation") {
        // AFFILIATE & AUTOMATION → integrations table
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
              config: {
                api_key: credentials.apiKey || undefined,
                account_id: credentials.pageId || undefined
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
              category: integration.category,
              config: {
                api_key: credentials.apiKey || undefined,
                account_id: credentials.pageId || undefined
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getInstructions = (platform: string) => {
    const instructions: Record<string, { steps: string[]; note: string }> = {
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
      "amazon-associates": {
        steps: [
          "Sign up at affiliate-program.amazon.com",
          "Complete your profile and website info",
          "Get approved (usually within 24 hours)",
          "Copy your Associate ID from the dashboard"
        ],
        note: "You need a website or social media presence"
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
  const affiliateIntegrations = integrations.filter(i => i.category === "affiliate");
  const automationIntegrations = integrations.filter(i => i.category === "automation");

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
              Connect affiliate networks and automate your marketing
            </p>
            <div className="mt-4 flex gap-2">
              <Badge variant="outline">
                {getSocialConnectedCount()}/{MAX_SOCIAL_CONNECTIONS} Social Media Connected
              </Badge>
              <Badge variant="outline">
                {affiliateIntegrations.filter(i => i.status === "connected").length}/{affiliateIntegrations.length} Affiliate Networks Connected
              </Badge>
            </div>
          </div>

          {/* Core Automation */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">🚀 Core Automation</h2>
            <Card className="border-2 border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>Zapier</CardTitle>
                      <Badge className="bg-green-500">
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">
                      Connect to 5000+ apps including Facebook, YouTube, Instagram
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Connected {formatDate(automationIntegrations[0]?.connected_at)}
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Affiliate Networks */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">💰 Affiliate Networks</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your affiliate network accounts to discover and promote products
            </p>

            {affiliateIntegrations.filter(i => i.status === "connected").length === 0 && (
              <Alert className="mb-4 border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <strong>No affiliate networks connected yet.</strong> Connect at least one network to start discovering products.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {affiliateIntegrations.map((integration) => {
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

          {/* Social Media */}
          <div>
            <h2 className="text-2xl font-bold mb-4">📱 Social Media</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Connect up to {MAX_SOCIAL_CONNECTIONS} social media accounts for automated posting
            </p>

            {socialIntegrations.filter(i => i.status === "connected").length === 0 && (
              <Alert className="mb-4 border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <strong>No social media connected yet.</strong> Connect platforms to enable automated traffic generation.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {socialIntegrations.map((integration) => {
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
                            disabled={isLoading || !canConnectSocial()}
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
        </main>
      </div>

      <Dialog open={connectDialog.open} onOpenChange={(open) => setConnectDialog({ open })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Connect {connectDialog.integration?.name}</DialogTitle>
            <DialogDescription>
              {connectDialog.integration?.category === "affiliate" 
                ? "Enter your affiliate account details"
                : "Enter your credentials to enable auto-posting"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              {connectDialog.integration?.category === "affiliate" ? (
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
              ) : (
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
                (connectDialog.integration?.category === "affiliate" && !credentials.pageId) ||
                (connectDialog.integration?.category !== "affiliate" && (!credentials.pageId || !credentials.accessToken)) ||
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