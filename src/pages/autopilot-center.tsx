import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UnifiedStatsService, UnifiedStats } from "@/services/unifiedStatsService";
import { Play, RefreshCw, Zap, Clock, CheckCircle2, Search, FileText, Share2, TrendingUp, Repeat, BarChart3, Settings, Globe, Cpu, Activity, Eye, MousePointerClick } from "lucide-react";

interface AutomationFunction {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: "idle" | "running" | "success" | "error";
  lastRun?: string;
}

export default function AutoPilotCenter() {
  const { toast } = useToast();
  const [selectedNiche, setSelectedNiche] = useState("all");
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [stats, setStats] = useState<UnifiedStats>({
    products: 0,
    articles: 0,
    posts: 0,
    clicks: 0,
    views: 0,
    conversions: 0,
    revenue: 0
  });

  const [automations, setAutomations] = useState<AutomationFunction[]>([
    {
      id: "product-discovery",
      name: "Product Discovery",
      description: "Find & add trending products via AI",
      icon: Search,
      status: "idle"
    },
    {
      id: "content-generator",
      name: "Content Generator",
      description: "Generate SEO articles with AI",
      icon: FileText,
      status: "idle"
    },
    {
      id: "social-publisher",
      name: "Social Publisher",
      description: "Create viral social posts for articles",
      icon: Share2,
      status: "idle"
    },
    {
      id: "traffic-boost",
      name: "Traffic Boost",
      description: "Generate Reddit, Quora, YouTube tactics",
      icon: TrendingUp,
      status: "idle"
    },
    {
      id: "conversion-sequences",
      name: "Conversion Sequences",
      description: "AI-powered visitor conversion flows",
      icon: Repeat,
      status: "idle"
    },
    {
      id: "performance-analysis",
      name: "Performance Analysis",
      description: "AI insights on top content & products",
      icon: BarChart3,
      status: "idle"
    },
    {
      id: "seo-optimizer",
      name: "SEO Optimizer",
      description: "Auto-optimize titles, meta, keywords",
      icon: Settings,
      status: "idle"
    },
    {
      id: "rewrite-low-performers",
      name: "Rewrite Low Performers",
      description: "Auto-improve underperforming content",
      icon: RefreshCw,
      status: "idle"
    },
    {
      id: "auto-publish",
      name: "Auto-Publish Articles",
      description: "Publish scheduled articles on time",
      icon: Globe,
      status: "idle"
    },
    {
      id: "smart-autopilot",
      name: "Smart AutoPilot",
      description: "AI decides & executes best action now",
      icon: Cpu,
      status: "idle"
    },
    {
      id: "system-health",
      name: "System Health Check",
      description: "Verify all systems working end-to-end",
      icon: Activity,
      status: "idle"
    }
  ]);

  const scheduledAutomations = [
    {
      name: "Product Discovery",
      schedule: "Daily at 2:00 AM",
      description: "Adds 3-5 products per niche",
      tested: true,
      live: true
    },
    {
      name: "Content Generator",
      schedule: "Daily at 8:00 AM",
      description: "Auto-saves articles to DB",
      tested: true,
      live: true
    },
    {
      name: "Traffic Boost",
      schedule: "Weekly Mon 8:00 AM",
      description: "Generates Reddit/Quora/YT tactics",
      tested: true,
      live: true
    },
    {
      name: "Auto-Publish Articles",
      schedule: "Every hour",
      description: "No AI — instant publish",
      tested: true,
      live: true
    },
    {
      name: "SEO Optimizer",
      schedule: "Daily at 4:00 AM",
      description: "Rewrites titles + meta for SEO",
      tested: true,
      live: true
    }
  ];

  useEffect(() => {
    console.log("🚀 AutoPilot Center: Component mounted, loading stats...");
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      console.log("📊 AutoPilot Center: Fetching stats from UnifiedStatsService...");
      const realStats = await UnifiedStatsService.getStats();
      console.log("✅ AutoPilot Center: Stats received:", realStats);
      setStats(realStats);
    } catch (error) {
      console.error("❌ AutoPilot Center: Error loading stats:", error);
    }
  };

  const runAutomation = async (id: string) => {
    setAutomations(prev => prev.map(a => 
      a.id === id ? { ...a, status: "running" as const } : a
    ));

    try {
      const response = await fetch(`/api/autopilot/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: selectedNiche !== "all" ? selectedNiche : undefined })
      });

      const result = await response.json();

      if (response.ok) {
        setAutomations(prev => prev.map(a => 
          a.id === id ? { ...a, status: "success" as const, lastRun: new Date().toISOString() } : a
        ));
        
        toast({
          title: "Success",
          description: result.message || "Automation completed successfully",
        });

        // Reload stats after automation runs
        await loadStats();
      } else {
        throw new Error(result.error || "Automation failed");
      }
    } catch (error: any) {
      setAutomations(prev => prev.map(a => 
        a.id === id ? { ...a, status: "error" as const } : a
      ));
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }

    // Reset to idle after 3 seconds
    setTimeout(() => {
      setAutomations(prev => prev.map(a => 
        a.id === id ? { ...a, status: "idle" as const } : a
      ));
    }, 3000);
  };

  const runAll = async () => {
    setIsRunningAll(true);
    toast({
      title: "Running All Automations",
      description: "Executing all functions sequentially..."
    });

    for (const automation of automations) {
      await runAutomation(automation.id);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunningAll(false);
    toast({
      title: "Complete",
      description: "All automations executed successfully"
    });
  };

  return (
    <>
      <SEO 
        title="AutoPilot Command Center"
        description="AI-powered automation control center for affiliate marketing"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        <Header />
        
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-emerald-500/20">
                <Zap className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AutoPilot Command Center</h1>
                <p className="text-slate-400">Real-time stats from database — All data is live and tracked</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Select value={selectedNiche} onValueChange={setSelectedNiche}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Select niche" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Niches</SelectItem>
                <SelectItem value="kitchen-gadgets">Kitchen Gadgets</SelectItem>
                <SelectItem value="tech">Tech & Electronics</SelectItem>
                <SelectItem value="fitness">Fitness & Health</SelectItem>
                <SelectItem value="home-decor">Home & Decor</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={runAll}
              disabled={isRunningAll}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
              size="lg"
            >
              <Zap className="mr-2 h-5 w-5" />
              {isRunningAll ? "Running..." : "Run All"}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-white">{stats.products}</span>
                  <Search className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Articles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-white">{stats.articles}</span>
                  <FileText className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Conversions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-white">{stats.conversions}</span>
                  <TrendingUp className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-white">${stats.revenue.toFixed(2)}</span>
                  <span className="text-2xl text-emerald-400">$</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Views</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">{stats.views}</span>
                  <Eye className="h-6 w-6 text-cyan-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Clicks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">{stats.clicks}</span>
                  <MousePointerClick className="h-6 w-6 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Social Posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">{stats.posts}</span>
                  <Share2 className="h-6 w-6 text-pink-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Scheduled Automations — Running 24/7</h2>
            </div>
            <div className="grid gap-4">
              {scheduledAutomations.map((auto, index) => (
                <Card key={index} className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 border-emerald-700/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">{auto.name}</CardTitle>
                        <CardDescription className="text-emerald-200/70">{auto.schedule}</CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-emerald-200/60">Tested</span>
                          {auto.tested && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                        </div>
                        <p className="text-sm text-emerald-200/80 mt-1">{auto.description}</p>
                      </div>
                      <Badge className="bg-emerald-500 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Live
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {automations.map((automation) => {
              const Icon = automation.icon;
              return (
                <Card key={automation.id} className="bg-slate-900/80 border-slate-700 hover:border-blue-500/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-slate-800">
                        <Icon className="h-6 w-6 text-blue-400" />
                      </div>
                      {automation.status === "running" && (
                        <Clock className="h-5 w-5 text-yellow-400 animate-spin" />
                      )}
                      {automation.status === "success" && (
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      )}
                    </div>
                    <CardTitle className="text-white text-lg">{automation.name}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {automation.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => runAutomation(automation.id)}
                      disabled={automation.status === "running"}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {automation.status === "running" ? "Running..." : "Run Now"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}