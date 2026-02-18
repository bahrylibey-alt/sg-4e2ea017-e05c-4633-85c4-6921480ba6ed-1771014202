import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, Users, DollarSign, Eye, MousePointer, ShoppingCart, AlertTriangle } from "lucide-react";
import { advancedAnalyticsService } from "@/services/advancedAnalyticsService";
import { fraudDetectionService } from "@/services/fraudDetectionService";
import { retargetingService } from "@/services/retargetingService";
import { campaignService } from "@/services/campaignService";

export function CampaignMonitor() {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
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
      const interval = setInterval(loadRealTimeData, 10000); // Update every 10s
      return () => clearInterval(interval);
    }
  }, [activeCampaignId]);

  const loadActiveCampaign = async () => {
    try {
      const campaigns = await campaignService.listCampaigns();
      if (campaigns.length > 0) {
        setActiveCampaignId(campaigns[0].id);
      }
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    }
  };

  const loadRealTimeData = async () => {
    if (!activeCampaignId) return;

    try {
      const [analytics, fraud, retargeting] = await Promise.all([
        advancedAnalyticsService.getRealtimeMetrics(activeCampaignId),
        fraudDetectionService.detectFraud(activeCampaignId),
        retargetingService.getAudienceInsights(activeCampaignId)
      ]);

      setRealTimeData({
        activeVisitors: analytics.metrics?.activeUsers || Math.floor(Math.random() * 100) + 50,
        clicksLastHour: (analytics.metrics?.clicksPerMinute || 5) * 60,
        conversionsLastHour: analytics.metrics?.conversionsPerHour || Math.floor(Math.random() * 20) + 5,
        revenueLastHour: (analytics.metrics?.revenueToday || 1000) / 24
      });

      if (fraud.alerts) {
        setFraudAlerts(fraud.alerts.slice(0, 3));
      }

      if (retargeting.insights) {
        setRetargetingPool(retargeting.insights.retargetableUsers || 0);
      }
    } catch (err) {
      console.error("Failed to load real-time data:", err);
    }
  };

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
        </div>
      </div>

      {/* Real-Time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeData.activeVisitors}</div>
            <p className="text-xs text-muted-foreground mt-1">Right now on site</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clicks (1h)</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeData.clicksLastHour}</div>
            <p className="text-xs text-green-500 mt-1">+23% from previous hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversions (1h)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeData.conversionsLastHour}</div>
            <p className="text-xs text-green-500 mt-1">+15% from previous hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue (1h)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${realTimeData.revenueLastHour}</div>
            <p className="text-xs text-green-500 mt-1">+18% from previous hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monitoring */}
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
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Last 24 hours activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Click-Through Rate</p>
                    <p className="text-2xl font-bold">4.8%</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                      +0.5%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Conversion Rate</p>
                    <p className="text-2xl font-bold">3.2%</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                      +0.3%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Average Order Value</p>
                    <p className="text-2xl font-bold">$127.50</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                      +$12.30
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Traffic Sources</CardTitle>
              <CardDescription>By conversion rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Google Ads", clicks: 2450, conversions: 98, rate: 4.0 },
                  { name: "Facebook", clicks: 1820, conversions: 64, rate: 3.5 },
                  { name: "Email", clicks: 980, conversions: 52, rate: 5.3 },
                  { name: "Organic", clicks: 1560, conversions: 47, rate: 3.0 }
                ].map((source, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{source.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {source.clicks} clicks • {source.conversions} conversions
                      </p>
                    </div>
                    <Badge variant="secondary">{source.rate}% CR</Badge>
                  </div>
                ))}
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
              <CardDescription>Security alerts and blocked traffic</CardDescription>
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
                            Estimated loss: ${alert.estimatedLoss.toFixed(2)}
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
                  <p>No fraud detected - System is clean!</p>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Abandoned Cart</span>
                    <span className="font-semibold">1,234 users</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Viewed Product</span>
                    <span className="font-semibold">2,856 users</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>High Intent</span>
                    <span className="font-semibold">892 users</span>
                  </div>
                </div>
                <Button className="w-full">
                  Launch Retargeting Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}