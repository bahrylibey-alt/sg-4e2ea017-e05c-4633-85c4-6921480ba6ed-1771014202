import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  TrendingUp, 
  DollarSign, 
  MousePointerClick, 
  ShoppingCart,
  Radio,
  Rocket,
  CheckCircle2,
  Loader2,
  Activity,
  Target,
  Users
} from "lucide-react";
import { autopilotEngine } from "@/services/autopilotEngine";
import { productCatalogService } from "@/services/productCatalogService";
import { realTimeAnalytics } from "@/services/realTimeAnalytics";
import { intelligentTrafficRouter } from "@/services/intelligentTrafficRouter";
import { useToast } from "@/hooks/use-toast";

export function AutopilotControl() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
    loadAnalytics();
    
    // Refresh analytics every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await autopilotEngine.getAutopilotStats();
      setStats(data);
      setIsAutopilotActive(data?.activeCampaigns > 0);
    } catch (error) {
      console.error("Failed to load stats:", error);
      // Set default values on error
      setStats({
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        totalCommissions: 0,
        activeCampaigns: 0,
        activeLinks: 0,
        trafficSources: 0
      });
    }
  };

  const loadAnalytics = async () => {
    try {
      const [snapshot, products] = await Promise.all([
        realTimeAnalytics.getPerformanceSnapshot(),
        realTimeAnalytics.getProductPerformance()
      ]);
      setAnalytics(snapshot);
      setProductPerformance(Array.isArray(products) ? products : []);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      setAnalytics({
        totalClicks: 0,
        conversions: 0,
        revenue: 0,
        commissions: 0,
        conversionRate: 0,
        averageOrderValue: 0,
        topProducts: [],
        topTrafficSources: []
      });
    }
  };

  const launchAutopilot = async () => {
    setIsLaunching(true);
    try {
      // Get top converting products
      const products = productCatalogService.getHighConvertingProducts(10);
      const productUrls = products.slice(0, 5).map(p => p.url);

      // Launch autopilot campaign
      const result = await autopilotEngine.launchAutopilotCampaign({
        budget: 100,
        products: productUrls,
        targetAudience: "General audience interested in online shopping and deals",
        trafficChannels: ["SEO Content Marketing", "Social Media Automation", "Email Marketing", "YouTube Shorts & Reels"]
      });

      // Activate intelligent traffic routing
      if (result.campaign) {
        await intelligentTrafficRouter.distributeTraffic(result.campaign.id, productUrls);
      }

      toast({
        title: "🚀 Autopilot Launched Successfully!",
        description: `${result.links.length} products activated with 4 free traffic channels. Traffic generation starting now!`,
      });

      await loadStats();
      await loadAnalytics();
      setIsAutopilotActive(true);
    } catch (error: any) {
      toast({
        title: "Launch Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLaunching(false);
    }
  };

  // Safe number helper
  const safeNum = (val: any, def: number = 0): number => {
    return typeof val === 'number' && !isNaN(val) ? val : def;
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Safe stats with defaults
  const safeStats = {
    totalClicks: safeNum(stats?.totalClicks),
    totalConversions: safeNum(stats?.totalConversions),
    totalRevenue: safeNum(stats?.totalRevenue),
    totalCommissions: safeNum(stats?.totalCommissions),
    activeCampaigns: safeNum(stats?.activeCampaigns),
    activeLinks: safeNum(stats?.activeLinks),
    trafficSources: safeNum(stats?.trafficSources)
  };

  // Safe analytics with defaults
  const safeAnalytics = analytics ? {
    totalClicks: safeNum(analytics.totalClicks),
    conversions: safeNum(analytics.conversions),
    revenue: safeNum(analytics.revenue),
    commissions: safeNum(analytics.commissions),
    conversionRate: safeNum(analytics.conversionRate),
    averageOrderValue: safeNum(analytics.averageOrderValue),
    topProducts: Array.isArray(analytics.topProducts) ? analytics.topProducts : [],
    topTrafficSources: Array.isArray(analytics.topTrafficSources) ? analytics.topTrafficSources : []
  } : null;

  return (
    <div className="space-y-6">
      {/* Main Control Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                Autopilot Control Center
              </CardTitle>
              <CardDescription className="mt-2">
                One-click automated traffic generation and sales optimization
              </CardDescription>
            </div>
            <Badge variant={isAutopilotActive ? "default" : "secondary"} className="text-sm px-3 py-1">
              {isAutopilotActive ? (
                <><Radio className="h-3 w-3 mr-1 animate-pulse" /> ACTIVE</>
              ) : (
                <>INACTIVE</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <MousePointerClick className="h-4 w-4" />
                Total Clicks
              </div>
              <div className="text-2xl font-bold">{safeStats.totalClicks.toLocaleString()}</div>
            </div>

            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <ShoppingCart className="h-4 w-4" />
                Conversions
              </div>
              <div className="text-2xl font-bold">{safeStats.totalConversions.toLocaleString()}</div>
            </div>

            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <DollarSign className="h-4 w-4" />
                Revenue
              </div>
              <div className="text-2xl font-bold">${safeStats.totalRevenue.toFixed(2)}</div>
            </div>

            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="h-4 w-4" />
                Commissions
              </div>
              <div className="text-2xl font-bold text-green-600">${safeStats.totalCommissions.toFixed(2)}</div>
            </div>
          </div>

          {/* Active Resources */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-background rounded-lg border">
              <div className="text-2xl font-bold text-primary">{safeStats.activeCampaigns}</div>
              <div className="text-sm text-muted-foreground">Active Campaigns</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border">
              <div className="text-2xl font-bold text-primary">{safeStats.activeLinks}</div>
              <div className="text-sm text-muted-foreground">Active Links</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border">
              <div className="text-2xl font-bold text-primary">{safeStats.trafficSources}</div>
              <div className="text-sm text-muted-foreground">Traffic Sources</div>
            </div>
          </div>

          {/* Launch Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={launchAutopilot}
              disabled={isLaunching}
              size="lg"
              className="w-full text-lg h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Launching Autopilot...
                </>
              ) : isAutopilotActive ? (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Launch New Autopilot Campaign
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-5 w-5" />
                  Launch Autopilot (One-Click)
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Automatically generates affiliate links, activates traffic sources, and optimizes for conversions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Analytics */}
      {safeAnalytics && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Real-Time Performance Analytics
                </CardTitle>
                <CardDescription>Live tracking of all affiliate activity</CardDescription>
              </div>
              <Badge variant="outline" className="animate-pulse">
                <Radio className="h-3 w-3 mr-1 text-green-500" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-sm text-muted-foreground mb-1">Conversion Rate</div>
                <div className="text-2xl font-bold text-primary">{safeAnalytics.conversionRate.toFixed(2)}%</div>
              </div>
              <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-sm text-muted-foreground mb-1">Avg Order Value</div>
                <div className="text-2xl font-bold text-primary">${safeAnalytics.averageOrderValue.toFixed(2)}</div>
              </div>
              <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-sm text-muted-foreground mb-1">Active Products</div>
                <div className="text-2xl font-bold text-primary">{productPerformance.length}</div>
              </div>
              <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-sm text-muted-foreground mb-1">Traffic Sources</div>
                <div className="text-2xl font-bold text-primary">{safeAnalytics.topTrafficSources.length}</div>
              </div>
            </div>

            {/* Top Products Performance */}
            {productPerformance.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Top Performing Products
                </h4>
                <div className="space-y-2">
                  {productPerformance.slice(0, 5).map((product, index) => (
                    <div key={product.productId || index} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{product.productName || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">
                            {safeNum(product.clicks)} clicks • {safeNum(product.conversions)} sales
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="font-bold text-green-600">${safeNum(product.revenue).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{safeNum(product.conversionRate).toFixed(1)}% CR</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Traffic Sources */}
            {safeAnalytics.topTrafficSources.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Top Traffic Sources
                </h4>
                <div className="space-y-2">
                  {safeAnalytics.topTrafficSources.map((source: any, index: number) => {
                    const sourceClicks = safeNum(source.clicks);
                    const totalClicks = safeNum(safeAnalytics.totalClicks, 1); // Avoid division by zero
                    const percentage = (sourceClicks / totalClicks) * 100;
                    
                    return (
                      <div key={source.name || index} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{source.name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">
                              {sourceClicks} clicks • {safeNum(source.conversions)} conversions
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Progress 
                            value={percentage} 
                            className="w-24 h-2"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Autopilot Works</CardTitle>
          <CardDescription>Fully automated affiliate marketing on autopilot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
              <div>
                <h4 className="font-semibold">Auto-Select High-Converting Products</h4>
                <p className="text-sm text-muted-foreground">System automatically selects top-performing products from multiple affiliate networks</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
              <div>
                <h4 className="font-semibold">Generate Affiliate Links</h4>
                <p className="text-sm text-muted-foreground">Creates tracked affiliate links with analytics for each product</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
              <div>
                <h4 className="font-semibold">Activate Free Traffic Sources</h4>
                <p className="text-sm text-muted-foreground">Deploys SEO, social media, content marketing, and email campaigns</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">4</div>
              <div>
                <h4 className="font-semibold">Monitor & Optimize</h4>
                <p className="text-sm text-muted-foreground">AI continuously monitors performance and auto-adjusts for maximum ROI</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}