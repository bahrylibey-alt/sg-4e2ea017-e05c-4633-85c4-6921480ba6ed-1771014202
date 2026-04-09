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
  Plus
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  status: "available" | "connected";
  connected_at?: string;
  credentials?: {
    access_token?: string;
    page_id?: string;
    account_id?: string;
  };
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
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
  }
];

const MAX_CONNECTIONS = 5;

export default function IntegrationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>(AVAILABLE_INTEGRATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [connectDialog, setConnectDialog] = useState<{ open: boolean; integration?: Integration }>({ open: false });
  const [credentials, setCredentials] = useState({ pageId: "", accessToken: "" });

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

      const { data: connections } = await supabase
        .from('social_media_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (connections && connections.length > 0) {
        setIntegrations(integrations.map(i => {
          const conn = connections.find(c => c.platform === i.id);
          if (conn) {
            return {
              ...i,
              status: "connected" as const,
              connected_at: conn.created_at,
              credentials: {
                access_token: conn.access_token,
                page_id: conn.account_id || undefined,
                account_id: conn.account_id || undefined
              }
            };
          }
          return i;
        }));
      }
    } catch (error) {
      console.error("Failed to load connections:", error);
    }
  };

  const getConnectedCount = () => {
    return integrations.filter(i => i.status === "connected" && i.id !== "zapier").length;
  };

  const canConnect = () => {
    return getConnectedCount() < MAX_CONNECTIONS;
  };

  const openConnectDialog = (integration: Integration) => {
    setConnectDialog({ open: true, integration });
    setCredentials({ pageId: "", accessToken: "" });
  };

  const handleConnect = async () => {
    if (!connectDialog.integration || !userId) return;

    try {
      setIsLoading(true);

      // Save to database
      const { error } = await supabase
        .from('social_media_accounts')
        .upsert({
          user_id: userId,
          platform: connectDialog.integration.id,
          access_token: credentials.accessToken,
          account_id: credentials.pageId,
          is_active: true
        }, { onConflict: 'user_id,platform,account_id' });

      if (error) throw error;

      // Update local state
      setIntegrations(integrations.map(i => 
        i.id === connectDialog.integration?.id 
          ? { 
              ...i, 
              status: "connected" as const, 
              connected_at: new Date().toISOString(),
              credentials: {
                access_token: credentials.accessToken,
                page_id: credentials.pageId
              }
            }
          : i
      ));

      toast({
        title: "✅ Connected!",
        description: `${connectDialog.integration.name} is now active`
      });

      setConnectDialog({ open: false });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
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

      const { error } = await supabase
        .from('social_media_accounts')
        .delete()
        .eq('user_id', userId)
        .eq('platform', integrationId);

      if (error) throw error;

      setIntegrations(integrations.map(i => 
        i.id === integrationId 
          ? { ...i, status: "available" as const, connected_at: undefined, credentials: undefined }
          : i
      ));

      toast({
        title: "Disconnected",
        description: `${integrations.find(i => i.id === integrationId)?.name} has been disconnected`
      });
    } catch (error: any) {
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
      }
    };

    return instructions[platform] || { steps: [], note: "" };
  };

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
              Connect apps and automate your marketing
            </p>
            <div className="mt-4">
              <Badge variant="outline">
                {getConnectedCount()}/{MAX_CONNECTIONS} Apps Connected
              </Badge>
            </div>
          </div>

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
                    Connected {formatDate(integrations.find(i => i.id === "zapier")?.connected_at)}
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">📱 Social Media</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {integrations
                .filter(i => i.category === "social")
                .map((integration) => {
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
                              disabled={isLoading || !canConnect()}
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
              Enter your credentials to enable auto-posting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
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
            </div>

            {connectDialog.integration && (
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <p className="font-semibold text-sm">Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                  {getInstructions(connectDialog.integration.id).steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-3">
                  ⚠️ {getInstructions(connectDialog.integration.id).note}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialog({ open: false })}>
              Cancel
            </Button>
            <Button 
              onClick={handleConnect} 
              disabled={!credentials.pageId || !credentials.accessToken || isLoading}
            >
              {isLoading ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}