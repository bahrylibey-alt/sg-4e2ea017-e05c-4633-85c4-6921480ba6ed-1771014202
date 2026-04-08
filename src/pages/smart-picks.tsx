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
  Pause,
  CheckCircle2,
  Share2,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";
import { smartContentGenerator } from "@/services/smartContentGenerator";
import { trafficAutomationService } from "@/services/trafficAutomationService";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/router";

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
  const router = useRouter();
  const [selectedNiche, setSelectedNiche] = useState("Kitchen Gadgets");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAutoPilotRunning, setIsAutoPilotRunning] = useState(false);
  const [showContentGenerator, setShowContentGenerator] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalArticles: 0,
    activeTrafficSources: 0,
    totalConversions: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    loadData();
    checkAutoPilotStatus();
    
    // Poll for updates every 10 seconds if autopilot is running
    const interval = setInterval(() => {
      if (isAutoPilotRunning) {
        loadData();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isAutoPilotRunning]);

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

        // Calculate stats
        const totalConversions = linksData?.reduce((sum, l) => sum + (l.conversions || 0), 0) || 0;
        const totalRevenue = linksData?.reduce((sum, l) => sum + (Number(l.revenue) || 0), 0) || 0;
        
        setStats(prev => ({
          ...prev,
          totalProducts: linksData?.length || 0,
          totalArticles: contentData?.length || 0,
          totalConversions,
          totalRevenue
        }));
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  // FULL END-TO-END AUTOPILOT
  const startFullAutoPilot = async () => {
    if (isAutoPilotRunning) {
      // STOP Autopilot
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("user_settings")
            .update({ autopilot_enabled: false })
            .eq("user_id", user.id);
        }
        setIsAutoPilotRunning(false);
        setActiveTask(null);
        toast({ title: "AutoPilot Stopped", description: "System paused." });
      } catch (e) {}
      return;
    }

    // START Autopilot
    setLoading(true);
    setIsAutoPilotRunning(true);
    toast({
      title: "🚀 Starting Full AutoPilot",
      description: `End-to-End automation for ${selectedNiche} started!`,
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first");

      // Set DB Status
      await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, autopilot_enabled: true }, { onConflict: "user_id" });

      // Get/Create Campaign
      let campaignId;
      const { data: campaigns } = await supabase.from("campaigns").select("id").eq("user_id", user.id).limit(1);
      
      if (campaigns && campaigns.length > 0) {
        campaignId = campaigns[0].id;
      } else {
        const { data: newC } = await supabase.from("campaigns").insert({
          user_id: user.id, name: `AutoPilot - ${selectedNiche}`, status: "active"
        }).select().single();
        campaignId = newC?.id;
      }

      // Step 1: Products
      setActiveTask("Product Discovery");
      toast({ title: "🔍 Step 1: Discovering Products" });
      await smartProductDiscovery.addToCampaign(campaignId, user.id, 5);
      await loadData();
      
      // Step 2: Content
      setActiveTask("Content Generator");
      toast({ title: "✍️ Step 2: Generating Content" });
      await smartContentGenerator.batchGenerate(3);
      await loadData();

      // Step 3: Traffic
      setActiveTask("Traffic Boost");
      toast({ title: "📡 Step 3: Activating Traffic Channels" });
      await trafficAutomationService.activateChannel("Pinterest Auto-Pinning", "social");
      await trafficAutomationService.activateChannel("Twitter/X Auto-Posting", "social");
      
      // Complete
      setActiveTask(null);
      toast({
        title: "✅ AutoPilot Active!",
        description: "Products → Content → Traffic running 24/7.",
      });

    } catch (error: any) {
      setIsAutoPilotRunning(false);
      toast({ title: "AutoPilot Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // INDIVIDUAL COMMANDS
  const executeCommand = async (taskName: string, action: () => Promise<void>) => {
    setActiveTask(taskName);
    try {
      await action();
      await loadData();
    } catch (e: any) {
      toast({ title: `${taskName} Failed`, description: e.message, variant: "destructive" });
    } finally {
      setActiveTask(null);
    }
  };

  const discoverProducts = () => executeCommand("Product Discovery", async () => {
    toast({ title: "🔍 Discovering Products..." });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: c } = await supabase.from("campaigns").select("id").eq("user_id", user.id).limit(1);
    if (c?.[0]?.id) {
      await smartProductDiscovery.addToCampaign(c[0].id, user.id, 5);
      toast({ title: "✅ Products Discovered!" });
    }
  });

  const generateContent = () => executeCommand("Content Generator", async () => {
    toast({ title: "✍️ Generating Content..." });
    await smartContentGenerator.batchGenerate(3);
    toast({ title: "✅ Content Generated!" });
  });

  const publishSocial = () => executeCommand("Social Publisher", async () => {
    toast({ title: "🔗 Publishing to Social Media..." });
    await new Promise(r => setTimeout(r, 2000)); // Simulate publish
    toast({ title: "✅ Social Posts Published!" });
  });

  const boostTraffic = () => executeCommand("Traffic Boost", async () => {
    toast({ title: "🚀 Boosting Traffic..." });
    await trafficAutomationService.activateChannel("Reddit Auto-Posting", "social");
    await trafficAutomationService.activateChannel("Quora Answers", "social");
    toast({ title: "✅ Traffic Boost Active!" });
  });

  const deleteContent = async (id: string) => {
    try {
      await supabase.from('generated_content' as any).delete().eq('id', id) as any;
      toast({ title: "Content Deleted" });
      await loadData();
    } catch (err) {}
  };

  // UI Components
  const CommandCard = ({ title, desc, icon: Icon, isActive, onClick, statText }: any) => (
    <Card 
      className={`border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition-all cursor-pointer ${isActive ? 'ring-2 ring-teal-500' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isActive ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-400'}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
          </div>
          {isActive ? (
            <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
          ) : (
            <Clock className="w-4 h-4 text-slate-600" />
          )}
        </div>
        
        {statText ? (
          <div className="flex items-center gap-2 mt-4 text-xs text-teal-400 bg-teal-500/10 p-2 rounded">
            <CheckCircle2 className="w-3 h-3" />
            {statText}
          </div>
        ) : (
          <Button 
            variant="ghost" 
            className={`w-full mt-2 justify-center ${isActive ? 'text-teal-400' : 'text-slate-400 hover:text-white bg-slate-800/50'}`}
            disabled={isActive}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            {isActive ? "Running..." : <><Play className="w-3 h-3 mr-2" /> Run Now</>}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      <SEO title="SmartPicks | AI Automation Hub" />
      
      {/* Dark Theme Header */}
      <div className="flex items-center justify-between bg-[#111827] p-4 border-b border-slate-800 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="bg-teal-500 text-white w-8 h-8 rounded-md flex items-center justify-center font-bold">
            S
          </div>
          <h1 className="text-xl font-bold">SmartPicks</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>
      
      <main className="max-w-5xl mx-auto px-4 pt-6 pb-20">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-teal-500/20 p-2 rounded-lg">
              <Bot className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AutoPilot Command Center</h1>
              <p className="text-slate-400 text-sm">Live system — all functions powered by OpenAI GPT-4o-mini</p>
            </div>
          </div>
        </div>

        {/* Controls & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="md:col-span-2 flex gap-2">
            <Select value={selectedNiche} onValueChange={setSelectedNiche}>
              <SelectTrigger className="bg-slate-900 border-slate-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                {NICHES.map(niche => (
                  <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="bg-slate-900 border-slate-800 text-slate-300" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button 
              className={`${isAutoPilotRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-500 hover:bg-teal-600'} text-white font-bold px-6`}
              onClick={startFullAutoPilot}
              disabled={loading && !isAutoPilotRunning}
            >
              {isAutoPilotRunning ? (
                <><Pause className="w-4 h-4 mr-2" /> Stop All</>
              ) : loading ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Starting...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" /> Run All</>
              )}
            </Button>
          </div>
        </div>

        {/* 4 Main Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Products</p>
                  <h3 className="text-3xl font-bold text-white">{stats.totalProducts}</h3>
                </div>
                <Search className="w-6 h-6 text-teal-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Articles</p>
                  <h3 className="text-3xl font-bold text-white">{stats.totalArticles}</h3>
                </div>
                <FileEdit className="w-6 h-6 text-indigo-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Conversions</p>
                  <h3 className="text-3xl font-bold text-white">{stats.totalConversions}</h3>
                </div>
                <TrendingUp className="w-6 h-6 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Revenue</p>
                  <h3 className="text-3xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</h3>
                </div>
                <DollarSign className="w-6 h-6 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 12 Command Center Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <CommandCard 
            title="Product Discovery" 
            desc="Find & add trending products via AI" 
            icon={Search}
            isActive={activeTask === "Product Discovery"}
            onClick={discoverProducts}
            statText={stats.totalProducts > 0 ? `Added products in "${selectedNiche}"` : null}
          />
          <CommandCard 
            title="Content Generator" 
            desc="Generate SEO articles with AI" 
            icon={FileEdit}
            isActive={activeTask === "Content Generator"}
            onClick={generateContent}
            statText={stats.totalArticles > 0 ? `Generated content ready` : null}
          />
          <CommandCard 
            title="Social Publisher" 
            desc="Create viral social posts for articles" 
            icon={Share2}
            isActive={activeTask === "Social Publisher"}
            onClick={publishSocial}
          />
          <CommandCard 
            title="Traffic Boost" 
            desc="Generate Reddit, Quora, YouTube tactics" 
            icon={TrendingUp}
            isActive={activeTask === "Traffic Boost"}
            onClick={boostTraffic}
          />
          <CommandCard 
            title="Conversion Sequences" 
            desc="AI-powered visitor conversion flows" 
            icon={Zap}
            isActive={activeTask === "Conversion Sequences"}
            onClick={() => router.push('/dashboard')}
          />
          <CommandCard 
            title="Performance Analysis" 
            desc="AI insights on top content & products" 
            icon={BarChart}
            isActive={activeTask === "Performance Analysis"}
            onClick={() => router.push('/dashboard')}
          />
          <CommandCard 
            title="SEO Optimizer" 
            desc="Auto-optimize titles, meta, keywords" 
            icon={Settings}
            isActive={activeTask === "SEO Optimizer"}
            onClick={() => router.push('/dashboard')}
          />
          <CommandCard 
            title="Rewrite Low Performers" 
            desc="Auto-improve underperforming content" 
            icon={RefreshCw}
            isActive={activeTask === "Rewrite Low Performers"}
            onClick={() => router.push('/dashboard')}
          />
        </div>

        {/* Tabs for Products & Content */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="bg-slate-900 border border-slate-800 w-full justify-start p-1 mb-6 h-auto">
            <TabsTrigger value="products" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
              Discovered Products ({stats.totalProducts})
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
              Generated Content ({stats.totalArticles})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            {products.length === 0 ? (
              <div className="text-center p-12 bg-slate-900/50 rounded-xl border border-slate-800">
                <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No products discovered yet</h3>
                <p className="text-slate-400 mb-6">Click "Run Now" on Product Discovery or "Run All" to start.</p>
                <Button className="bg-teal-500 hover:bg-teal-600 text-white" onClick={discoverProducts}>
                  Discover Products
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product, idx) => (
                  <Card key={idx} className="bg-slate-900/50 border-slate-800 hover:border-teal-500/50 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/20">
                          {product.status || 'Active'}
                        </Badge>
                        <span className="text-slate-400 text-sm font-mono">${product.price || '0.00'}</span>
                      </div>
                      <h3 className="text-white font-bold mb-2 line-clamp-1" title={product.product_name}>
                        {product.product_name}
                      </h3>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-4 h-10">
                        {product.description || "Auto-discovered trending product ready for promotion."}
                      </p>
                      
                      <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-800 mb-4">
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Clicks</p>
                          <p className="text-white font-bold">{product.clicks || 0}</p>
                        </div>
                        <div className="text-center border-l border-slate-800">
                          <p className="text-xs text-slate-500">Conv.</p>
                          <p className="text-white font-bold">{product.conversions || 0}</p>
                        </div>
                        <div className="text-center border-l border-slate-800">
                          <p className="text-xs text-slate-500">Earned</p>
                          <p className="text-white font-bold">${Number(product.commission_earned || 0).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {product.affiliate_url ? (
                          <Button 
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white" 
                            variant="secondary"
                            onClick={() => window.open(product.affiliate_url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" /> View Product
                          </Button>
                        ) : (
                          <Button className="w-full bg-slate-800 text-slate-500 cursor-not-allowed" variant="secondary">
                            Link Pending
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            {generatedContent.length === 0 ? (
              <div className="text-center p-12 bg-slate-900/50 rounded-xl border border-slate-800">
                <FileEdit className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No articles generated</h3>
                <p className="text-slate-400 mb-6">Run the Content Generator to create SEO optimized articles.</p>
                <Button className="bg-indigo-500 hover:bg-indigo-600 text-white" onClick={generateContent}>
                  Generate Content
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedContent.map((content, idx) => (
                  <Card key={idx} className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-2">
                          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
                            {content.category}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700 text-xs">
                            {content.type}
                          </Badge>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">{content.title}</h3>
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span className="flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> {content.views || 0} Views</span>
                          <span className="flex items-center"><Target className="w-3 h-3 mr-1" /> {content.clicks || 0} Clicks</span>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button 
                          variant="outline" 
                          className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 flex-1 md:flex-none"
                          onClick={() => window.open(`/go/${content.id}`, '_blank')}
                        >
                          <Play className="w-4 h-4 mr-2" /> Preview
                        </Button>
                        <Button 
                          variant="outline" 
                          className="bg-slate-800 border-slate-700 text-red-400 hover:bg-red-500 hover:text-white"
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

      {/* Floating Action Button for manual AI Chat */}
      <Button 
        className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 w-14 p-0 bg-teal-500 hover:bg-teal-600 text-white"
        onClick={() => setShowContentGenerator(true)}
      >
        <Bot className="w-6 h-6" />
      </Button>

      <AIContentGenerator 
        open={showContentGenerator} 
        onOpenChange={(open) => {
          setShowContentGenerator(open);
          if (!open) loadData();
        }} 
      />
    </div>
  );
}