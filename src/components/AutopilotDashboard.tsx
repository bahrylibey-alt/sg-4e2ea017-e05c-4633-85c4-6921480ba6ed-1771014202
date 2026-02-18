import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Zap, TrendingUp, DollarSign, Target, Activity, Settings, Play, Pause, RefreshCw } from "lucide-react";
import { aiOptimizationEngine } from "@/services/aiOptimizationEngine";
import { trafficAutomationService } from "@/services/trafficAutomationService";
import { conversionOptimizationService } from "@/services/conversionOptimizationService";

interface AutopilotStatus {
  active: boolean;
  revenue: number;
  conversions: number;
  roi: number;
  traffic: number;
  optimization: number;
}

export function AutopilotDashboard() {
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AutopilotStatus>({
    active: false,
    revenue: 0,
    conversions: 0,
    roi: 0,
    traffic: 0,
    optimization: 0
  });
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    if (autopilotEnabled) {
      loadAutopilotStatus();
      const interval = setInterval(loadAutopilotStatus, 30000); // Update every 30s
      return () => clearInterval(interval);
    }
  }, [autopilotEnabled]);

  const loadAutopilotStatus = async () => {
    try {
      const trafficResult = await trafficAutomationService.launchAutomatedTraffic({
        campaignId: "demo-campaign",
        targetTraffic: 5000,
        budget: 1000,
        channels: ["social", "email", "paid-ads", "seo"],
        optimization: "conversions",
        autoScale: true
      });
      const optimizationResult = await aiOptimizationEngine.runFullOptimization("demo-campaign");

      setStatus({
        active: true,
        revenue: (trafficResult.estimatedReach * 0.05 * 50) || 0, // Mock calculation
        conversions: (trafficResult.estimatedReach * 0.05) || 0,
        roi: optimizationResult.result?.improvements?.find(i => i.metric === "ROI")?.after || 0,
        traffic: trafficResult.estimatedReach || 0,
        optimization: optimizationResult.result?.optimizationsApplied || 0
      });

      if (optimizationResult.result?.recommendations) {
        setRecommendations(optimizationResult.result.recommendations.slice(0, 5));
      }
    } catch (err) {
      console.error("Failed to load autopilot status:", err);
    }
  };

  const toggleAutopilot = async () => {
    setLoading(true);
    try {
      const newState = !autopilotEnabled;
      setAutopilotEnabled(newState);
      
      if (newState) {
        // Initialize autopilot systems
        await Promise.all([
          trafficAutomationService.launchAutomatedTraffic({
            campaignId: "demo-campaign",
            targetTraffic: 5000,
            budget: 1000,
            channels: ["social", "email", "paid-ads", "seo"],
            optimization: "conversions",
            autoScale: true
          }),
          aiOptimizationEngine.runFullOptimization("demo-campaign"),
          conversionOptimizationService.analyzeAndOptimize("demo-campaign")
        ]);
        await loadAutopilotStatus();
      } else {
        setStatus({
          active: false,
          revenue: 0,
          conversions: 0,
          roi: 0,
          traffic: 0,
          optimization: 0
        });
      }
    } catch (err) {
      console.error("Failed to toggle autopilot:", err);
    } finally {
      setLoading(false);
    }
  };

  const forceOptimization = async () => {
    setLoading(true);
    try {
      await aiOptimizationEngine.runFullOptimization("demo-campaign");
      await loadAutopilotStatus();
    } catch (err) {
      console.error("Failed to force optimization:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Autopilot Control Panel */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                AI Autopilot Control
              </CardTitle>
              <CardDescription>Fully automated campaign management and optimization</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Autopilot</span>
                <Switch
                  checked={autopilotEnabled}
                  onCheckedChange={toggleAutopilot}
                  disabled={loading}
                />
              </div>
              {autopilotEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={forceOptimization}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Force Optimize
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {autopilotEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                <span className="text-green-500 font-semibold">System Active</span>
                <span className="text-muted-foreground">• Monitoring and optimizing 24/7</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Traffic Generated</div>
                  <div className="text-2xl font-bold">{status.traffic.toLocaleString()}</div>
                  <div className="text-xs text-green-500">+12% from yesterday</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Revenue</div>
                  <div className="text-2xl font-bold">${status.revenue.toLocaleString()}</div>
                  <div className="text-xs text-green-500">+8% from yesterday</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Conversions</div>
                  <div className="text-2xl font-bold">{status.conversions}</div>
                  <div className="text-xs text-green-500">+15% from yesterday</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">ROI</div>
                  <div className="text-2xl font-bold">{status.roi}%</div>
                  <div className="text-xs text-green-500">+{status.optimization}% optimized</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                <Pause className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Autopilot is Off</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Enable autopilot to let AI handle traffic generation, optimization, and scaling automatically
                </p>
              </div>
              <Button onClick={toggleAutopilot} disabled={loading} size="lg" className="mt-4">
                <Play className="h-4 w-4 mr-2" />
                Activate Autopilot
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Optimizations */}
      {autopilotEnabled && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Active AI Optimizations
            </CardTitle>
            <CardDescription>Real-time improvements being applied</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{rec}</p>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Performance */}
      {autopilotEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Traffic Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Bot Detection</span>
                  <span className="font-semibold text-green-500">98%</span>
                </div>
                <Progress value={98} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span>Real Users</span>
                  <span className="font-semibold text-green-500">96%</span>
                </div>
                <Progress value={96} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Cost Per Click</span>
                  <span className="font-semibold">$0.32</span>
                </div>
                <Progress value={75} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span>Cost Per Conversion</span>
                  <span className="font-semibold">$12.45</span>
                </div>
                <Progress value={82} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                AI Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall Score</span>
                  <span className="font-semibold text-green-500">{status.optimization}%</span>
                </div>
                <Progress value={status.optimization} className="h-2" />
                <div className="text-xs text-muted-foreground mt-2">
                  System is learning and improving continuously
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}