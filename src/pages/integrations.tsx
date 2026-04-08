import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  Facebook, 
  Youtube, 
  Instagram, 
  Twitter, 
  Linkedin,
  Settings,
  RefreshCw,
  X,
  Check,
  AlertCircle
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  status: "available" | "connected";
  connected_at?: string;
  last_sync?: string;
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: "zapier",
    name: "Zapier",
    description: "Automate workflows - connect to 5000+ apps",
    icon: Zap,
    category: "automation",
    status: "connected",
    connected_at: "2026-04-08T16:00:00Z",
    last_sync: new Date().toISOString()
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

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }
    setUserId(user.id);
  };

  const getConnectedCount = () => {
    return integrations.filter(i => i.status === "connected" && i.id !== "zapier").length;
  };

  const canConnect = () => {
    return getConnectedCount() < MAX_CONNECTIONS;
  };

  const handleConnect = async (integrationId: string) => {
    if (!canConnect() && integrationId !== "zapier") {
      toast({
        title: "Connection Limit Reached",
        description: `You can connect up to ${MAX_CONNECTIONS} social media apps.`,
        variant: "destructive"
      });
      return;
    }

    setIntegrations(integrations.map(i => 
      i.id === integrationId 
        ? { ...i, status: "connected" as const, connected_at: new Date().toISOString(), last_sync: new Date().toISOString() }
        : i
    ));

    toast({
      title: `✅ Connected!`,
      description: `${integrations.find(i => i.id === integrationId)?.name} is now active`
    });
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

    setIntegrations(integrations.map(i => 
      i.id === integrationId 
        ? { ...i, status: "available" as const, connected_at: undefined, last_sync: undefined }
        : i
    ));

    toast({
      title: "Disconnected",
      description: `${integrations.find(i => i.id === integrationId)?.name} has been disconnected`
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
                              onClick={() => handleConnect(integration.id)}
                              disabled={isLoading}
                            >
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
    </>
  );
}