import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { AIContentGenerator } from "@/components/AIContentGenerator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  ArrowLeft, 
  Menu, 
  Settings, 
  TrendingUp, 
  RefreshCw, 
  FileEdit, 
  Send,
  BarChart,
  Search,
  Sparkles,
  Target,
  Activity,
  FolderTree,
  DollarSign,
  Shield,
  Command,
  Zap,
  Clock,
  ExternalLink,
  Trash2,
  Play,
  Pause
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";
import { smartContentGenerator } from "@/services/smartContentGenerator";
import { trafficAutomationService } from "@/services/trafficAutomationService";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NICHES = [
  "Kitchen Gadgets",
  "Home Organization",
  "Car Accessories",
  "Pet Accessories",
  "Beauty Tools",
  "Phone & Tech Accessories",
  "Fitness at Home",
  "Tools & DIY",
  "Office & Desk Setup",
  "Travel Accessories"
];

export default function SmartPicksDashboard() {
  const { toast } = useToast();
  const [selectedNiche, setSelectedNiche] = useState("Kitchen Gadgets");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAutoPilotRunning, setIsAutoPilotRunning] = useState(false);
  const [showContentGenerator, setShowContentGenerator] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalArticles: 0,
    activeTrafficSources: 0,
    totalClicks: 0
  });

  useEffect(() => {
    loadData();
    checkAutoPilotStatus();
  }, []);

  const checkAutoPilotStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: settings } = await supabase
        .from("user_settings")
        .select("autopilot_enabled")
        .eq("user_id", user.id)
        .single();

      setIsAutoPilotRunning(settings?.autopilot_enabled || false);
    } catch (error) {
      console.error("Failed to check autopilot status:", error);
    }
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load generated content
      const { data: contentData } = await supabase
        .from('generated_content' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50) as any;

      if (contentData) {
        setGeneratedContent(contentData);
      }

      // Load products
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id")
        .eq("user_id", user.id);

      if (campaigns && campaigns.length > 0) {
        const campaignIds = campaigns.map(c => c.id);
        
        const { data: linksData } = await supabase
          .from("affiliate_links")
          .select("*")
          .in("campaign_id", campaignIds)
          .order("created_at", { ascending: false });

        if (linksData) {
          setProducts(linksData);
        }

        // Load traffic sources
        const { data: trafficData } = await supabase
          .from("traffic_sources")
          .select("*")
          .in("campaign_id", campaignIds)
          .eq("status", "active");

        // Calculate stats
        const totalClicks = linksData?.reduce((sum, l) => sum + (l.clicks || 0), 0) || 0;
        
        setStats({
          totalProducts: linksData?.length || 0,
          totalArticles: contentData?.length || 0,
          activeTrafficSources: trafficData?.length || 0,
          totalClicks
        });
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const startFullAutoPilot = async () => {
    setLoading(true);
    toast({
      title: "🚀 Starting Full AutoPilot",
      description: "Discovering products → Generating content → Activating traffic...",
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first");

      // Step 1: Get or create campaign
      let campaign;
      const { data: existingCampaigns } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_autopilot", true)
        .limit(1);

      if (existingCampaigns && existingCampaigns.length > 0) {
        campaign = existingCampaigns[0];
      } else {
        const { data: newCampaign } = await supabase
          .from("campaigns")
          .insert({
            user_id: user.id,
            name: `AutoPilot - ${selectedNiche}`,
            goal: "sales",
            status: "active",
            is_autopilot: true
          })
          .select()
          .single();
        campaign = newCampaign;
      }

      if (!campaign) throw new Error("Failed to create campaign");

      // Step 2: Discover trending products
      toast({
        title: "🔍 Discovering Products",
        description: `Finding trending ${selectedNiche} products...`,
      });
      
      await smartProductDiscovery.addToCampaign(campaign.id, user.id, 10);

      // Step 3: Generate content for products
      toast({
        title: "✍️ Generating Content",
        description: "Creating SEO-optimized articles...",
      });

      await smartContentGenerator.batchGenerate(5);

      // Step 4: Activate traffic sources
      toast({
        title: "📡 Activating Traffic",
        description: "Starting Pinterest, Twitter, YouTube channels...",
      });

      await trafficAutomationService.activateChannel("Pinterest Auto-Pinning", "social");
      await trafficAutomationService.activateChannel("Twitter/X Auto-Posting", "social");
      await trafficAutomationService.activateChannel("YouTube Community Posts", "video");

      // Step 5: Enable autopilot in database
      await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          autopilot_enabled: true,
          autopilot_started_at: new Date().toISOString()
        }, { onConflict: "user_id" });

      setIsAutoPilotRunning(true);

      // Reload data
      await loadData();

      toast({
        title: "✅ AutoPilot Active!",
        description: "System running 24/7. Products → Content → Traffic all automated!",
      });

    } catch (error: any) {
      toast({
        title: "Failed to start AutoPilot",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const stopAutoPilot = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_settings")
        .update({
          autopilot_enabled: false,
          autopilot_stopped_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      setIsAutoPilotRunning(false);

      toast({
        title: "AutoPilot Stopped",
        description: "You can restart it anytime",
      });
    } catch (error) {
      toast({
        title: "Failed to stop AutoPilot",
        variant: "destructive"
      });
    }
  };

  const discoverProductsOnly = async () => {
    setLoading(true);
    toast({
      title: "🔍 Product Discovery",
      description: `Finding trending ${selectedNiche} products...`,
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in");

      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      let campaignId = campaigns?.[0]?.id;

      if (!campaignId) {
        const { data: newCampaign } = await supabase
          .from("campaigns")
          .insert({
            user_id: user.id,
            name: `${selectedNiche} Campaign`,
            status: "active"
          })
          .select("id")
          .single();
        campaignId = newCampaign?.id;
      }

      if (!campaignId) throw new Error("Failed to create campaign");

      const result = await smartProductDiscovery.addToCampaign(campaignId, user.id, 10);

      await loadData();

      toast({
        title: "✅ Products Discovered!",
        description: `Added ${result.count} trending products to your campaign`,
      });

    } catch (error: any) {
      toast({
        title: "Discovery Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateContentOnly = async () => {
    setLoading(true);
    toast({
      title: "✍️ Generating Content",
      description: "Creating SEO articles for your products...",
    });

    try {
      await smartContentGenerator.batchGenerate(5);
      await loadData();

      toast({
        title: "✅ Content Generated!",
        description: "5 new articles created",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const viewProduct = (product: any) => {
    toast({
      title: product.product_name,
      description: `Price: $${product.price || 'N/A'} | Clicks: ${product.clicks || 0}`,
    });
  };

  const deleteContent = async (id: string) => {
    try {
      await supabase
        .from('generated_content' as any)
        .delete()
        .eq('id', id) as any;

      toast({
        title: "Content Deleted",
        description: "Article removed successfully",
      });
      
      await loadData();
    } catch (err) {
      toast({
        title: "Delete Failed",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <SEO title="SmartPicks | AI Automation Hub" />
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-20">
        {/* App Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-t-xl border-b mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="bg-teal-600 text-white w-8 h-8 rounded-md flex items-center justify-center font-bold">
              S
            </div>
            <h1 className="text-xl font-bold">SmartPicks Admin</h1>
          </div>
          <Button variant="ghost" size="icon">
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        {/* AutoPilot Status Card */}
        <Card className="mb-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Full AutoPilot System</h3>
                  <p className="text-sm text-slate-600">Products → Content → Traffic</p>
                </div>
              </div>
              <Badge variant={isAutoPilotRunning ? "default" : "secondary"} className={isAutoPilotRunning ? "bg-green-500 hover:bg-green-600" : ""}>
                {isAutoPilotRunning ? (
                  <><div className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />Running 24/7</>
                ) : (
                  "Stopped"
                )}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-teal-600">{stats.totalProducts}</div>
                <div className="text-sm text-slate-600">Products</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.totalArticles}</div>
                <div className="text-sm text-slate-600">Articles</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.activeTrafficSources}</div>
                <div className="text-sm text-slate-600">Traffic Channels</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.totalClicks}</div>
                <div className="text-sm text-slate-600">Total Clicks</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Niche</label>
              <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NICHES.map(niche => (
                    <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isAutoPilotRunning ? (
              <Button 
                onClick={startFullAutoPilot} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg"
              >
                {loading ? (
                  <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Starting...</>
                ) : (
                  <><Play className="w-5 h-5 mr-2" /> Start Full AutoPilot</>
                )}
              </Button>
            ) : (
              <Button 
                onClick={stopAutoPilot}
                variant="destructive"
                className="w-full py-6 text-lg"
              >
                <Pause className="w-5 h-5 mr-2" /> Stop AutoPilot
              </Button>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="quick" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick">Quick Actions</TabsTrigger>
            <TabsTrigger value="products">Products ({stats.totalProducts})</TabsTrigger>
            <TabsTrigger value="content">Content ({stats.totalArticles})</TabsTrigger>
          </TabsList>

          {/* Quick Actions Tab */}
          <TabsContent value="quick" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Run individual automation tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={discoverProductsOnly} 
                  disabled={loading}
                  className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Discover 10 Trending Products ({selectedNiche})
                </Button>
                
                <Button 
                  onClick={generateContentOnly}
                  disabled={loading}
                  className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate 5 SEO Articles
                </Button>
                
                <Link href="/traffic-channels" className="block">
                  <Button className="w-full justify-start bg-orange-600 hover:bg-orange-700 text-white">
                    <Send className="w-4 h-4 mr-2" />
                    Activate Traffic Sources
                  </Button>
                </Link>
                
                <Button 
                  onClick={() => setShowContentGenerator(true)}
                  className="w-full justify-start bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <FileEdit className="w-4 h-4 mr-2" />
                  Open AI Content Generator
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            {products.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600 mb-4">No products discovered yet</p>
                  <Button onClick={discoverProductsOnly} disabled={loading}>
                    <Search className="w-4 h-4 mr-2" />
                    Discover Products Now
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {products.map((product, idx) => (
                  <Card 
                    key={idx} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => viewProduct(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">{product.product_name}</h3>
                          <div className="flex gap-4 text-sm text-slate-600 mb-2">
                            <span>Price: ${product.price || 'N/A'}</span>
                            <span>Clicks: {product.clicks || 0}</span>
                            <span>Conversions: {product.conversions || 0}</span>
                          </div>
                          {product.affiliate_url && (
                            <a 
                              href={product.affiliate_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-teal-600 hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Product <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <Badge variant="secondary">{product.status || 'active'}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            {generatedContent.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600 mb-4">No content generated yet</p>
                  <Button onClick={generateContentOnly} disabled={loading}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Content Now
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {generatedContent.map((content, idx) => (
                  <Card key={idx} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-3">{content.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary">{content.category}</Badge>
                        <Badge variant="secondary">{content.type}</Badge>
                        <Badge className="bg-green-100 text-green-700">{content.status}</Badge>
                      </div>
                      <p className="text-slate-600 mb-4 line-clamp-2">
                        {content.meta_description || content.content?.substring(0, 150) + '...'}
                      </p>
                      <div className="flex gap-3">
                        <Button size="sm" variant="outline">
                          <ExternalLink className="w-4 h-4 mr-2" /> Preview
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => deleteContent(content.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <AIContentGenerator 
        open={showContentGenerator} 
        onOpenChange={(open) => {
          setShowContentGenerator(open);
          if (!open) loadData();
        }} 
      />
      
      <Footer />
    </div>
  );
}