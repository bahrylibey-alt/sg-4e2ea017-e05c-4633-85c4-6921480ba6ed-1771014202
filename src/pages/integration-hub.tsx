import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  Facebook, 
  Youtube, 
  Instagram, 
  Twitter,
  Check,
  X,
  Plus,
  Search,
  Link2,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Globe,
  Mail,
  MessageSquare,
  Linkedin
} from "lucide-react";
import Link from "next/link";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "automation" | "social" | "affiliate" | "email" | "analytics";
  icon: any;
  status: "connected" | "available";
  quickConnect?: boolean;
}

const ALL_INTEGRATIONS: Integration[] = [
  // Core Automation
  { id: "zapier", name: "Zapier", description: "5000+ app connections", category: "automation", icon: Zap, status: "connected" },
  
  // Social Media
  { id: "facebook", name: "Facebook", description: "Pages & Groups auto-posting", category: "social", icon: Facebook, status: "available", quickConnect: true },
  { id: "instagram", name: "Instagram", description: "Stories & Feed automation", category: "social", icon: Instagram, status: "available", quickConnect: true },
  { id: "twitter", name: "Twitter/X", description: "Tweet automation", category: "social", icon: Twitter, status: "available", quickConnect: true },
  { id: "linkedin", name: "LinkedIn", description: "Article publishing", category: "social", icon: Linkedin, status: "available", quickConnect: true },
  { id: "youtube", name: "YouTube", description: "Community posts", category: "social", icon: Youtube, status: "available" },
  { id: "pinterest", name: "Pinterest", description: "Auto-pinning system", category: "social", icon: Globe, status: "available" },
  { id: "reddit", name: "Reddit", description: "Subreddit posting", category: "social", icon: MessageSquare, status: "available" },
  
  // Affiliate Networks
  { id: "shareasale", name: "ShareASale", description: "4,500+ merchants", category: "affiliate", icon: Link2, status: "available", quickConnect: true },
  { id: "clickbank", name: "ClickBank", description: "50-75% commissions", category: "affiliate", icon: DollarSign, status: "available", quickConnect: true },
  { id: "impact", name: "Impact", description: "Premium brands", category: "affiliate", icon: TrendingUp, status: "available", quickConnect: true },
  { id: "awin", name: "Awin", description: "15K+ advertisers", category: "affiliate", icon: Link2, status: "available" },
  { id: "rakuten", name: "Rakuten", description: "Top brands", category: "affiliate", icon: ShoppingCart, status: "available" },
  { id: "cj", name: "CJ Affiliate", description: "Enterprise tracking", category: "affiliate", icon: TrendingUp, status: "available" },
  
  // Email
  { id: "mailchimp", name: "Mailchimp", description: "Email campaigns", category: "email", icon: Mail, status: "available" },
  { id: "sendgrid", name: "SendGrid", description: "Transactional email", category: "email", icon: Mail, status: "available" }
];

export default function IntegrationHub() {
  const router = useRouter();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>(ALL_INTEGRATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [userId, setUserId] = useState<string | null>(null);

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
        .select('platform')
        .eq('user_id', user.id);

      if (connections && connections.length > 0) {
        setIntegrations(integrations.map(i => {
          const isConnected = connections.some(c => c.platform === i.id);
          return isConnected ? { ...i, status: "connected" as const } : i;
        }));
      }
    } catch (error) {
      console.error("Failed to load connections:", error);
    }
  };

  const handleQuickConnect = (integration: Integration) => {
    router.push(`/integrations?connect=${integration.id}`);
  };

  const filteredIntegrations = integrations.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         i.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeTab === "all" || i.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const connectedCount = integrations.filter(i => i.status === "connected").length;
  const availableCount = integrations.filter(i => i.status === "available").length;

  return (
    <>
      <Head>
        <title>Integration Hub - AffiliatePro</title>
      </Head>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Integration Hub</h1>
            <p className="text-muted-foreground text-lg">
              All your integrations in one place - connect with one click
            </p>
            <div className="mt-4 flex gap-2">
              <Badge variant="default" className="bg-green-500">
                {connectedCount} Connected
              </Badge>
              <Badge variant="outline">
                {availableCount} Available
              </Badge>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid grid-cols-6 w-full max-w-3xl">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="affiliate">Affiliate</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Quick Actions */}
          <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Quick Connect</h3>
                  <p className="text-muted-foreground">
                    Connect the most popular integrations with one click
                  </p>
                </div>
                <div className="flex gap-2">
                  {integrations
                    .filter(i => i.quickConnect && i.status === "available")
                    .slice(0, 3)
                    .map(integration => {
                      const Icon = integration.icon;
                      return (
                        <Button
                          key={integration.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickConnect(integration)}
                          className="gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {integration.name}
                        </Button>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integrations Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrations.map((integration) => {
              const Icon = integration.icon;
              const isConnected = integration.status === "connected";

              return (
                <Card key={integration.id} className={`hover:shadow-lg transition-all ${isConnected ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isConnected ? 'bg-green-500/10' : 'bg-muted'}`}>
                          <Icon className={`w-6 h-6 ${isConnected ? 'text-green-600' : ''}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            {isConnected && (
                              <Badge variant="outline" className="text-xs bg-green-500 text-white border-green-500">
                                <Check className="w-3 h-3 mr-1" />
                                Connected
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {integration.description}
                          </CardDescription>
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {integration.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isConnected ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          Configure
                        </Button>
                        <Button variant="outline" size="sm">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => handleQuickConnect(integration)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Connect Now
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredIntegrations.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No integrations found matching your search.</p>
            </Card>
          )}

          {/* CTA */}
          <Card className="mt-12 bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/20">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Need a Custom Integration?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Contact our team to request custom integrations for your specific needs
              </p>
              <Button size="lg">
                Request Integration
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}