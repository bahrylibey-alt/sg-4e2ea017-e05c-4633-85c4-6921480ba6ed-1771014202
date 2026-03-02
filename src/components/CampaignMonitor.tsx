import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, Users, DollarSign, Eye, MousePointer, ShoppingCart, AlertTriangle, AlertCircle } from "lucide-react";
import { advancedAnalyticsService } from "@/services/advancedAnalyticsService";
import { fraudDetectionService } from "@/services/fraudDetectionService";
import { retargetingService } from "@/services/retargetingService";
import { campaignService } from "@/services/campaignService";

export function CampaignMonitor() {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realTimeData, setRealTimeData] = useState({
    activeVisitors: 0,
    clicksLastHour: 0,
    conversionsLastHour: 0,
    revenueLastHour: 0
  });
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  const [retargetingPool, setRetargetingPool] = useState(0);

  useEffect(() => {
    loadActiveCampaign();
  }, []);

  useEffect(() => {
    if (activeCampaignId) {
      loadRealTimeData();
      const interval = setInterval(loadRealTimeData, 30000);
      return () => clearInterval(interval);
    }
  }, [activeCampaignId]);

  const loadActiveCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("📊 Loading campaign monitor...");
      
      const campaigns = await campaignService.listCampaigns();
      console.log("📋 Campaigns found:", campaigns.length);
      
      if (campaigns.length > 0) {
        setActiveCampaignId(campaigns[0].id);
      }
    } catch (err) {
      console.error("❌ Failed to load campaigns:", err);
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeData = async () => {
    if (!activeCampaignId) return;

    try {
      console.log("📈 Loading real-time data for campaign:", activeCampaignId);
      
      const [analytics, fraud, retargeting] = await Promise.all([
        advancedAnalyticsService.getRealtimeMetrics(activeCampaignId).catch(() => null),
        fraudDetectionService.detectFraud(activeCampaignId).catch(() => null),
        retargetingService.getAudienceInsights(activeCampaignId).catch(() => null)
      ]);

      setRealTimeData({
        activeVisitors: analytics?.metrics?.activeUsers || 0,
        clicksLastHour: analytics?.metrics?.clicksPerMinute ? analytics.metrics.clicksPerMinute * 60 : 0,
        conversionsLastHour: analytics?.metrics?.conversionsPerHour || 0,
        revenueLastHour: analytics?.metrics?.revenueToday ? analytics.metrics.revenueToday / 24 : 0
      });

      if (fraud?.alerts) {
        setFraudAlerts(fraud.alerts.slice(0, 3));
      }

      if (retargeting) {
        setRetargetingPool(retargeting.totalReach || 0);
      }
    } catch (err) {
      console.error("❌ Failed to load real-time data:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 animate-spin text-primary" />
              <span>Loading campaign monitor...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Failed to Load Monitor</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <Button onClick={loadActiveCampaign} variant="outline" className="mt-4">
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeCampaignId) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Campaigns to Monitor</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Create your first campaign to start monitoring real-time performance metrics.
            </p>
            <Button className="mt-4">Create Campaign</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campaign Monitor</h2>
          <p className="text-muted-foreground">Real-time performance tracking and alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-500">Live</span>
          </div>
          <Button onClick={loadRealTimeData} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeData.activeVisitors}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently browsing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clicks (1h)</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeData.clicksLastHour}</div>
            <p className="text-xs text-muted-foreground mt-1">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversions (1h)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeData.conversionsLastHour}</div>
            <p className="text-xs text-muted-foreground mt-1">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue (1h)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${realTimeData.revenueLastHour.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Last hour</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="retargeting">Retargeting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Real-time campaign performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Active Visitors</p>
                    <p className="text-2xl font-bold">{realTimeData.activeVisitors}</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                    Live
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hourly Clicks</p>
                    <p className="text-2xl font-bold">{realTimeData.clicksLastHour}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Conversions</p>
                    <p className="text-2xl font-bold">{realTimeData.conversionsLastHour}</p>
                  </div>
                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-500">
                    Tracking
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Analysis</CardTitle>
              <CardDescription>Active traffic sources and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Traffic source analytics will appear here once campaigns generate traffic</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Fraud Detection
              </CardTitle>
              <CardDescription>Security monitoring and threat detection</CardDescription>
            </CardHeader>
            <CardContent>
              {fraudAlerts.length > 0 ? (
                <div className="space-y-3">
                  {fraudAlerts.map((alert, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-orange-500/20 bg-orange-500/5">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{alert.details}</p>
                          <p className="text-xs text-muted-foreground">
                            Estimated loss: ${alert.estimatedLoss?.toFixed(2) || "0.00"}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-orange-500 text-orange-500">
                          {alert.severity}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" className="mt-2">
                        {alert.recommended_action}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No fraud detected - System is secure!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retargeting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Retargeting Pool
              </CardTitle>
              <CardDescription>Visitors ready for retargeting campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-6 rounded-lg bg-muted/50">
                  <p className="text-4xl font-bold">{retargetingPool.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">Retargetable users</p>
                </div>
                {retargetingPool > 0 ? (
                  <Button className="w-full">
                    Launch Retargeting Campaign
                  </Button>
                ) : (
                  <p className="text-sm text-center text-muted-foreground">
                    Start generating traffic to build your retargeting audience
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}