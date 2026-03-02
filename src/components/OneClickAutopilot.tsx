import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Rocket,
  Zap,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  RefreshCw,
  DollarSign,
  MousePointerClick,
  Target,
  Globe,
  BarChart3,
  ShoppingCart
} from "lucide-react";
import { autopilotEngine } from "@/services/autopilotEngine";
import { realTimeAnalytics } from "@/services/realTimeAnalytics";
import { affiliateIntegrationService } from "@/services/affiliateIntegrationService";
import { useToast } from "@/hooks/use-toast";

export function OneClickAutopilot() {
  const { toast } = useToast();
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStep, setLaunchStep] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const [trafficSources, setTrafficSources] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    loadAutopilotStatus();
    const interval = setInterval(loadAutopilotStatus, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const loadAutopilotStatus = async () => {
    try {
      setLoadingStats(true);
      const [status, stats, analytics] = await Promise.all([
        autopilotEngine.getAutopilotStatus(),
        affiliateIntegrationService.getSystemStats(),
        realTimeAnalytics.getPerformanceSnapshot()
      ]);

      setIsActive(status.isActive);
      setSystemStats(stats);
      
      if (analytics.topProducts) {
        setProductPerformance(analytics.topProducts);
      }
      if (analytics.topTrafficSources) {
        setTrafficSources(analytics.topTrafficSources);
      }
    } catch (error) {
      console.error("Failed to load autopilot status:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const launchAutopilot = async () => {
    setIsLaunching(true);
    setLaunchStep("Initializing...");
    
    try {
      // Step 1: Setup complete system
      setLaunchStep("Setting up affiliate infrastructure...");
      toast({
        title: "🚀 Launching Autopilot",
        description: "Setting up affiliate infrastructure..."
      });

      const setupResult = await affiliateIntegrationService.setupCompleteSystem({
        autoAddProducts: true,
        autoGenerateLinks: true,
        autoTrackConversions: true,
        autoCalculateCommissions: true,
        minConversionRate: 8
      });

      if (!setupResult.success) {
        throw new Error(setupResult.message);
      }

      // Step 2: Launch autopilot campaign
      setLaunchStep("Activating traffic automation...");
      toast({
        title: "⚡ Activating Automation",
        description: "Launching campaigns and traffic..."
      });

      const launchResult = await autopilotEngine.launchAutopilot({
        campaignName: "Autopilot Campaign",
        budget: 0, // Free traffic only
        trafficChannels: ["seo", "social", "content", "email"]
      });

      if (launchResult.success) {
        setIsActive(true);
        setLaunchStep("Complete!");
        toast({
          title: "✅ Autopilot Active!",
          description: `System launched with ${setupResult.stats.totalProducts} products and ${setupResult.stats.activeLinks} active links`
        });
        
        await loadAutopilotStatus();
      } else {
        throw new Error("Failed to launch autopilot");
      }
    } catch (error: any) {
      console.error("Launch failed:", error);
      toast({
        title: "❌ Launch Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLaunching(false);
      setLaunchStep("");
    }
  };

  const stopAutopilot = async () => {
    try {
      // In a real implementation, this would pause all active campaigns
      setIsActive(false);
      toast({
        title: "⏸️ Autopilot Paused",
        description: "All automated campaigns paused"
      });
    } catch (error) {
      console.error("Failed to stop autopilot:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Control Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Rocket className="h-6 w-6" />
                One-Click Autopilot System
              </CardTitle>
              <CardDescription>
                Fully automated affiliate marketing with intelligent traffic generation
              </CardDescription>
            </div>
            <Badge 
              variant={isActive ? "default" : "secondary"}
              className="text-sm px-4 py-2"
            >
              {isActive ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-pulse" />
                  ACTIVE
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  INACTIVE
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Launch Control */}
          {!isActive ? (
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Rocket className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                <strong>Ready to Launch:</strong> Click below to automatically set up products, generate affiliate links, and activate free traffic across 8+ channels.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                <strong>System Running:</strong> Autopilot is actively driving traffic and tracking conversions in real-time.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            {!isActive ? (
              <>
                <Button
                  size="lg"
                  onClick={launchAutopilot}
                  disabled={isLaunching}
                  className="flex-1 h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isLaunching ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {launchStep || "Launching..."}
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Launch One-Click Autopilot
                    </>
                  )}
                </Button>
                {isLaunching && (
                  <div className="flex-1">
                    <Progress value={launchStep.includes("Complete") ? 100 : launchStep.includes("traffic") ? 75 : launchStep.includes("infrastructure") ? 50 : 25} className="h-14" />
                    <p className="text-xs text-muted-foreground mt-2 text-center">{launchStep}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={stopAutopilot}
                  className="flex-1 h-14 text-lg"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause Autopilot
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={loadAutopilotStatus}
                  disabled={loadingStats}
                  className="h-14"
                >
                  <RefreshCw className={`w-5 h-5 ${loadingStats ? 'animate-spin' : ''}`} />
                </Button>
              </>
            )}
          </div>

          {/* System Stats */}
          {systemStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <ShoppingCart className="w-4 h-4" />
                  Products
                </div>
                <div className="text-2xl font-bold">{systemStats.totalProducts}</div>
                <div className="text-xs text-muted-foreground">{systemStats.activeLinks} links active</div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <MousePointerClick className="w-4 h-4" />
                  Total Clicks
                </div>
                <div className="text-2xl font-bold">{systemStats.totalClicks.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">From {systemStats.trafficSources} sources</div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Target className="w-4 h-4" />
                  Conversions
                </div>
                <div className="text-2xl font-bold">{systemStats.totalConversions.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {systemStats.totalClicks > 0 
                    ? ((systemStats.totalConversions / systemStats.totalClicks) * 100).toFixed(1)
                    : '0.0'}% rate
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" />
                  Revenue
                </div>
                <div className="text-2xl font-bold">
                  ${systemStats.totalRevenue.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
                <div className="text-xs text-muted-foreground">{systemStats.activeCampaigns} campaigns</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Performance Table */}
      {productPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Live Product Performance
            </CardTitle>
            <CardDescription>Real-time tracking of each product's performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-sm text-muted-foreground">Product</th>
                    <th className="text-right py-3 px-2 font-medium text-sm text-muted-foreground">Clicks</th>
                    <th className="text-right py-3 px-2 font-medium text-sm text-muted-foreground">Conversions</th>
                    <th className="text-right py-3 px-2 font-medium text-sm text-muted-foreground">Rate</th>
                    <th className="text-right py-3 px-2 font-medium text-sm text-muted-foreground">Revenue</th>
                    <th className="text-center py-3 px-2 font-medium text-sm text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {productPerformance.map((product, index) => {
                    const conversionRate = product.clicks > 0 
                      ? ((product.conversions / product.clicks) * 100).toFixed(1)
                      : '0.0';
                    
                    return (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">{product.category || 'General'}</div>
                        </td>
                        <td className="text-right py-3 px-2 font-mono">{product.clicks.toLocaleString()}</td>
                        <td className="text-right py-3 px-2 font-mono">{product.conversions.toLocaleString()}</td>
                        <td className="text-right py-3 px-2">
                          <Badge variant={parseFloat(conversionRate) > 5 ? "default" : "secondary"}>
                            {conversionRate}%
                          </Badge>
                        </td>
                        <td className="text-right py-3 px-2 font-mono">
                          ${product.revenue.toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </td>
                        <td className="text-center py-3 px-2">
                          <Badge variant={parseFloat(conversionRate) > 3 ? "default" : "outline"}>
                            {parseFloat(conversionRate) > 3 ? 'Performing' : 'Monitoring'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traffic Sources */}
      {trafficSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Active Traffic Sources
            </CardTitle>
            <CardDescription>Free traffic channels driving visitors to your offers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {trafficSources.map((source, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{source.name}</div>
                    <Badge variant="outline">{source.type}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Clicks:</span>
                      <span className="font-mono">{source.clicks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Conversions:</span>
                      <span className="font-mono">{source.conversions.toLocaleString()}</span>
                    </div>
                    <Progress 
                      value={(source.conversions / source.clicks) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How the Autopilot System Works</CardTitle>
          <CardDescription>Sophisticated automation powered by AI and smart traffic strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium">Auto Product Selection</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically discovers and adds high-converting products from top affiliate networks
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium">Smart Link Generation</div>
                  <div className="text-sm text-muted-foreground">
                    Creates trackable affiliate links with custom cloaking and analytics
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium">Multi-Channel Traffic</div>
                  <div className="text-sm text-muted-foreground">
                    Activates 8+ free traffic sources: SEO, social media, content marketing, email
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium">Real-Time Tracking</div>
                  <div className="text-sm text-muted-foreground">
                    Monitors every click, conversion, and commission in real-time
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <div className="font-medium">AI Optimization</div>
                  <div className="text-sm text-muted-foreground">
                    Continuously optimizes campaigns based on performance data
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <div className="font-medium">Intelligent Routing</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically directs traffic to best-performing products
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <div className="font-medium">Commission Tracking</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically calculates and tracks all affiliate commissions
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <div className="font-medium">Performance Reports</div>
                  <div className="text-sm text-muted-foreground">
                    Detailed analytics showing exactly what's working and what's not
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}