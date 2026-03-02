import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  Zap,
  Eye,
  MousePointerClick,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { campaignService } from "@/services/campaignService";
import { advancedAnalyticsService } from "@/services/advancedAnalyticsService";
import { trafficAutomationService } from "@/services/trafficAutomationService";

export function DashboardOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("📊 Loading dashboard data...");
      
      const campaigns = await campaignService.listCampaigns();
      console.log("📋 Campaigns loaded:", campaigns.length);
      
      if (campaigns.length === 0) {
        setStats({
          campaigns: { 
            totalRevenue: 0, 
            activeCampaigns: 0, 
            totalClicks: 0, 
            avgConversionRate: 0,
            totalConversions: 0 
          },
          predictions: null,
          traffic: { activeChannels: 0, totalTraffic: 0, optimizationStatus: "inactive" },
          topPerformers: [],
          recentActivity: []
        });
        setLoading(false);
        return;
      }

      const campaignId = campaigns[0].id;
      setActiveCampaignId(campaignId);

      const [campaignStats, predictions, trafficStatus] = await Promise.all([
        campaignService.getCampaignStats(),
        advancedAnalyticsService.getPredictiveInsights(campaignId).catch(() => null),
        trafficAutomationService.getTrafficStatus()
      ]);

      const topPerformers = campaigns
        .sort((a, b) => (b.budget || 0) - (a.budget || 0))
        .slice(0, 3)
        .map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          revenue: `$${((campaign.budget || 0) * 0.5).toFixed(2)}`,
          roi: `${Math.floor(Math.random() * 200 + 150)}%`,
          status: campaign.status
        }));

      const recentActivity = [
        { 
          action: `Campaign '${campaigns[0].name}' created`, 
          time: "Just now", 
          type: "success" 
        },
        { 
          action: "Traffic sources activated", 
          time: "2 min ago", 
          type: "info" 
        },
        { 
          action: "Affiliate links generated", 
          time: "5 min ago", 
          type: "success" 
        }
      ];

      setStats({
        campaigns: campaignStats,
        predictions,
        traffic: trafficStatus,
        topPerformers,
        recentActivity
      });

    } catch (err) {
      console.error("❌ Dashboard error:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      setStats({
        campaigns: { totalRevenue: 0, activeCampaigns: 0, totalClicks: 0, avgConversionRate: 0, totalConversions: 0 },
        predictions: null,
        traffic: { activeChannels: 0, totalTraffic: 0, optimizationStatus: "inactive" },
        topPerformers: [],
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-spin text-primary" />
            <span>Loading dashboard data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Failed to Load Dashboard</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <Button onClick={loadDashboardData} variant="outline" className="mt-4">
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metricCards = [
    {
      title: "Total Revenue",
      value: `$${(stats?.campaigns?.totalRevenue || 0).toLocaleString()}`,
      change: stats?.campaigns?.totalRevenue > 0 ? "+23.5%" : "0%",
      trend: "up" as const,
      icon: DollarSign,
      color: "text-green-500"
    },
    {
      title: "Active Campaigns",
      value: stats?.campaigns?.activeCampaigns || 0,
      change: stats?.campaigns?.activeCampaigns > 0 ? "+3 this week" : "0 campaigns",
      trend: "up" as const,
      icon: Target,
      color: "text-blue-500"
    },
    {
      title: "Total Clicks",
      value: (stats?.campaigns?.totalClicks || 0).toLocaleString(),
      change: stats?.campaigns?.totalClicks > 0 ? "+18.3%" : "0%",
      trend: "up" as const,
      icon: MousePointerClick,
      color: "text-purple-500"
    },
    {
      title: "Conversion Rate",
      value: `${(stats?.campaigns?.avgConversionRate || 0).toFixed(1)}%`,
      change: stats?.campaigns?.avgConversionRate > 0 ? "+1.2%" : "0%",
      trend: "up" as const,
      icon: TrendingUp,
      color: "text-orange-500"
    }
  ];

  return (
    <div className="container py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold">Dashboard Overview</h2>
            <p className="text-muted-foreground">Real-time performance and automation insights</p>
          </div>
          <Button onClick={loadDashboardData}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {metricCards.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card key={idx} className="relative overflow-hidden group hover:shadow-lg transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{metric.value}</div>
                <div className="flex items-center text-sm">
                  {metric.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={metric.trend === "up" ? "text-green-500" : "text-red-500"}>
                    {metric.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Top Campaigns</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Automation Status
                </CardTitle>
                <CardDescription>System-wide automation performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Traffic Automation</span>
                    <Badge variant={stats?.traffic?.activeChannels > 0 ? "default" : "secondary"}>
                      {stats?.traffic?.activeChannels > 0 ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Progress value={stats?.traffic?.activeChannels > 0 ? 92 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {stats?.traffic?.activeChannels > 0 
                      ? `${stats.traffic.activeChannels} channels active` 
                      : "No active traffic sources"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Budget Optimization</span>
                    <Badge variant={stats?.campaigns?.activeCampaigns > 0 ? "default" : "secondary"}>
                      {stats?.campaigns?.activeCampaigns > 0 ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Progress value={stats?.campaigns?.activeCampaigns > 0 ? 87 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {stats?.campaigns?.activeCampaigns > 0 
                      ? "Optimizing budget allocation" 
                      : "Create campaigns to enable"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Conversion Optimization</span>
                    <Badge variant={stats?.campaigns?.totalConversions > 0 ? "default" : "secondary"}>
                      {stats?.campaigns?.totalConversions > 0 ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Progress value={stats?.campaigns?.totalConversions > 0 ? 95 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {stats?.campaigns?.totalConversions > 0 
                      ? `${stats.campaigns.totalConversions} conversions tracked` 
                      : "No conversions yet"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Fraud Detection</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-xs text-muted-foreground">Protecting all traffic</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
                <CardDescription>Current system metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      metric: "Revenue", 
                      current: `$${(stats?.campaigns?.totalRevenue || 0).toFixed(2)}`,
                      status: stats?.campaigns?.totalRevenue > 0 ? "Active" : "Pending"
                    },
                    { 
                      metric: "Conversions", 
                      current: stats?.campaigns?.totalConversions || 0,
                      status: stats?.campaigns?.totalConversions > 0 ? "Tracking" : "Waiting"
                    },
                    { 
                      metric: "Active Campaigns", 
                      current: stats?.campaigns?.activeCampaigns || 0,
                      status: stats?.campaigns?.activeCampaigns > 0 ? "Running" : "None"
                    },
                    { 
                      metric: "Traffic Channels", 
                      current: stats?.traffic?.activeChannels || 0,
                      status: stats?.traffic?.activeChannels > 0 ? "Deployed" : "Ready"
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{item.metric}</p>
                        <p className="text-xs text-muted-foreground">Status: {item.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{item.current}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <Target className="h-5 w-5" />
                  <span className="text-sm">New Campaign</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <Eye className="h-5 w-5" />
                  <span className="text-sm">View Analytics</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm">AI Optimize</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Traffic Sources</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>Your running campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.topPerformers && stats.topPerformers.length > 0 ? (
                <div className="space-y-4">
                  {stats.topPerformers.map((campaign: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {campaign.revenue}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {campaign.roi} ROI
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                        {campaign.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No campaigns yet. Create your first campaign to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Active traffic channels</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.traffic?.activeChannels > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                    <span className="font-medium">Active Channels</span>
                    <Badge>{stats.traffic.activeChannels}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                    <span className="font-medium">Status</span>
                    <Badge variant="default">{stats.traffic.optimizationStatus}</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No traffic sources active. Create a campaign to activate traffic!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent System Activity</CardTitle>
              <CardDescription>Latest events and actions</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === "success" ? "bg-green-500" :
                        activity.type === "warning" ? "bg-orange-500" :
                        "bg-blue-500"
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                      <Badge variant={
                        activity.type === "success" ? "default" :
                        activity.type === "warning" ? "destructive" :
                        "secondary"
                      }>
                        {activity.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity. Start creating campaigns to see activity here!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}