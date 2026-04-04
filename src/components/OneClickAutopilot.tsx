import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ShoppingCart,
  Terminal
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { autopilotEngine } from "@/services/autopilotEngine";
import { realTimeAnalytics } from "@/services/realTimeAnalytics";
import { affiliateIntegrationService } from "@/services/affiliateIntegrationService";
import { activityLogger, type ActivityLog } from "@/services/activityLogger";
import { useToast } from "@/hooks/use-toast";

export function OneClickAutopilot() {
  const { toast } = useToast();
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [launchStep, setLaunchStep] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const [trafficSources, setTrafficSources] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    loadAutopilotStatus();
    loadActivityLogs();
    const interval = setInterval(() => {
      loadAutopilotStatus();
      if (showLogs) {
        loadActivityLogs();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [showLogs]);

  const loadActivityLogs = async () => {
    const logs = activityLogger.getLogs();
    setActivityLogs(logs.slice(-20));
  };

  const loadAutopilotStatus = async () => {
    try {
      setLoadingStats(true);
      
      // Check user authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user authenticated");
        setIsActive(false);
        return;
      }

      // Check if autopilot campaigns are active
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("is_autopilot", true)
        .eq("status", "active");

      const hasActiveCampaigns = (campaigns?.length || 0) > 0;

      // Check user settings
      const { data: settings } = await supabase
        .from("user_settings")
        .select("autopilot_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      const settingsEnabled = settings?.autopilot_enabled || false;

      // Autopilot is active if BOTH conditions are true
      const isAutopilotActive = hasActiveCampaigns && settingsEnabled;
      
      console.log("📊 Autopilot Status Check:", {
        hasActiveCampaigns,
        settingsEnabled,
        isAutopilotActive
      });

      setIsActive(isAutopilotActive);

      // Load stats
      const [stats, analytics] = await Promise.all([
        affiliateIntegrationService.getSystemStats(),
        realTimeAnalytics.getPerformanceSnapshot()
      ]);

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
    console.log("🚀 User clicked Launch Autopilot");
    setIsLaunching(true);
    setLaunchStep("Initializing...");

    try {
      // Get user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to launch autopilot");

      console.log("✅ User authenticated:", user.id);

      // Check if there are paused campaigns to resume
      const { data: pausedCampaigns } = await supabase
        .from("campaigns")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("is_autopilot", true)
        .eq("status", "paused");

      console.log("📊 Found paused campaigns:", pausedCampaigns?.length || 0);

      let result;
      
      if (pausedCampaigns && pausedCampaigns.length > 0) {
        // Resume existing campaigns
        console.log("▶️ Resuming paused campaigns...");
        setLaunchStep("Resuming paused campaigns...");
        
        result = await autopilotEngine.resumeAutopilot();
        console.log("Resume result:", result);
      } else {
        // Launch new campaign
        console.log("🚀 Launching new autopilot campaign...");
        
        // 1. Setup products/links first
        setLaunchStep("Syncing product catalog...");
        console.log("📦 Setting up complete system...");
        
        const setupResult = await affiliateIntegrationService.setupCompleteSystem({
          autoAddProducts: true,
          autoGenerateLinks: true,
          autoTrackConversions: true
        });
        
        console.log("Setup result:", setupResult);
        
        if (!setupResult.success) {
          throw new Error(setupResult.message || "Failed to setup system");
        }
        
        // 2. Launch engine
        setLaunchStep("Activating autopilot engine...");
        console.log("🎯 Launching autopilot engine...");
        
        result = await autopilotEngine.oneClickLaunch();
        console.log("Launch result:", result);
      }

      if (result.success) {
        console.log("✅ Autopilot launch successful!");
        
        toast({
          title: "✅ Autopilot Active",
          description: result.message || "System is running and generating traffic.",
        });
        
        // CRITICAL: Wait for database to commit changes
        console.log("⏳ Waiting for database commit...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force immediate status refresh
        console.log("🔄 Refreshing status...");
        setIsActive(true); // Set state immediately for instant UI feedback
        await loadAutopilotStatus(); // Then load full stats
        await loadActivityLogs(); // Refresh logs
        
        console.log("✅ Status refresh complete");
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error("❌ Launch error:", error);
      toast({
        title: "❌ Launch Failed",
        description: error.message || "Could not start autopilot",
        variant: "destructive"
      });
    } finally {
      setIsLaunching(false);
      setLaunchStep("");
    }
  };

  const stopAutopilot = async () => {
    try {
      console.log("⏸️ User clicked Pause Autopilot");
      setIsLaunching(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "❌ Authentication Error",
          description: "Please log in to control autopilot",
          variant: "destructive"
        });
        return;
      }

      console.log("👤 User:", user.id);

      // 1. Pause all active autopilot campaigns
      console.log("⏸️ Pausing campaigns...");
      const { data: pausedCampaigns, error: campaignError } = await supabase
        .from("campaigns")
        .update({ status: "paused" })
        .eq("user_id", user.id)
        .eq("is_autopilot", true)
        .eq("status", "active")
        .select();

      if (campaignError) {
        console.error("❌ Failed to pause campaigns:", campaignError);
        throw new Error(campaignError.message);
      }

      console.log(`✅ Paused ${pausedCampaigns?.length || 0} campaigns`);

      // 2. Disable autopilot in settings
      console.log("⚙️ Updating user settings...");
      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          autopilot_enabled: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (settingsError) {
        console.error("❌ Failed to update settings:", settingsError);
        throw new Error(settingsError.message);
      }

      console.log("✅ Settings updated");

      // CRITICAL: Wait for database to commit changes
      console.log("⏳ Waiting for database commit...");
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update UI state
      console.log("🔄 Updating UI state...");
      setIsActive(false);
      
      toast({
        title: "⏸️ Autopilot Paused",
        description: "All automated campaigns have been paused"
      });

      console.log("✅ Autopilot paused successfully");

      // Refresh status and logs
      await loadAutopilotStatus();
      await loadActivityLogs();
      
    } catch (error: any) {
      console.error("❌ Failed to stop autopilot:", error);
      
      toast({
        title: "❌ Error",
        description: error.message || "Failed to stop autopilot",
        variant: "destructive"
      });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Activity Log Section */}
      {showLogs && activityLogs.length > 0 && (
        <Card className="border-blue-500/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Activity Log
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogs(false)}
              >
                Hide
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="space-y-2">
                {activityLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm font-mono">
                    <span className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={
                      log.status === "success" ? "text-green-500" :
                      log.status === "error" ? "text-red-500" :
                      log.status === "started" ? "text-blue-500" :
                      "text-muted-foreground"
                    }>
                      [{log.status.toUpperCase()}]
                    </span>
                    <span className="flex-1">{log.action}: {log.details}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

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
              <div className="flex-1 space-y-3">
                <Button
                  size="lg"
                  onClick={launchAutopilot}
                  disabled={isLaunching}
                  className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
                  <div>
                    <Progress value={launchProgress} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {launchProgress}% - {launchStep}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={stopAutopilot}
                  disabled={isLaunching}
                  className="flex-1 h-14 text-lg"
                >
                  {isLaunching ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Pausing...
                    </>
                  ) : (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause Autopilot
                    </>
                  )}
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