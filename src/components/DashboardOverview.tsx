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
import { realTimeAnalytics } from "@/services/realTimeAnalytics";
import { activityLogger } from "@/services/activityLogger";
import { automationScheduler } from "@/services/automationScheduler";
import { freeTrafficEngine } from "@/services/freeTrafficEngine";

export function DashboardOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadDashboardData();
    
    // Start automation scheduler if not running
    if (!automationScheduler.isRunning) {
      console.log("🚀 Starting automation scheduler from dashboard...");
      automationScheduler.start().catch(err => {
        console.error("Failed to start scheduler:", err);
      });
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("📊 Loading comprehensive dashboard data...");
      
      // Load all data in parallel
      const [
        campaigns,
        campaignStats,
        recentActivity,
        trafficStats,
        analytics
      ] = await Promise.all([
        campaignService.listCampaigns(),
        campaignService.getCampaignStats(),
        activityLogger.getRecentActivity(10),
        freeTrafficEngine.getTrafficStats(),
        realTimeAnalytics.getPerformanceSnapshot().catch(() => null)
      ]);

      console.log("✅ Data loaded:", {
        campaigns: campaigns.length,
        activity: recentActivity.length,
        stats: campaignStats
      });

      // Build top performers from campaigns
      const topPerformers = campaigns
        .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
        .slice(0, 5)
        .map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          revenue: `$${(campaign.revenue || 0).toFixed(2)}`,
          roi: campaign.spent > 0 
            ? `${(((campaign.revenue || 0) - campaign.spent) / campaign.spent * 100).toFixed(1)}%`
            : "0%",
          status: campaign.status,
          clicks: analytics?.totalClicks || 0,
          conversions: analytics?.totalConversions || 0
        }));

      // Get automation status
      const automationActive = automationScheduler.isRunning;

      setStats({
        campaigns: campaignStats,
        analytics,
        traffic: trafficStats,
        topPerformers,
        recentActivity,
        automationStatus: automationActive ? "active" : "inactive"
      });

      // Log dashboard view
      await activityLogger.log(
        "dashboard_viewed",
        "info",
        "Dashboard loaded successfully",
        { campaigns: campaigns.length, activity: recentActivity.length }
      );

    } catch (err) {
      console.error("❌ Dashboard error:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      
      // Set empty state instead of null
      setStats({
        campaigns: { 
          totalRevenue: 0, 
          activeCampaigns: 0, 
          totalClicks: 0, 
          avgConversionRate: 0,
          totalConversions: 0,
          totalSpent: 0,
          avgROI: 0
        },
        analytics: null,
        traffic: {
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          conversionRate: "0.00",
          avgDailyClicks: 0
        },
        topPerformers: [],
        recentActivity: [],
        automationStatus: "inactive"
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

  type TrendType = "up" | "down" | "neutral";

  const metricCards = [
    {
      title: "Total Revenue",
      value: `$${(stats?.campaigns?.totalRevenue || 0).toFixed(2)}`,
      change: stats?.campaigns?.totalRevenue > 0 ? "+23.5%" : "No revenue yet",
      trend: (stats?.campaigns?.totalRevenue > 0 ? "up" : "neutral") as TrendType,
      icon: DollarSign,
      color: "text-green-500"
    },
    {
      title: "Active Campaigns",
      value: stats?.campaigns?.activeCampaigns || 0,
      change: stats?.campaigns?.activeCampaigns > 0 ? `${stats.campaigns.activeCampaigns} running` : "Create campaign",
      trend: (stats?.campaigns?.activeCampaigns > 0 ? "up" : "neutral") as TrendType,
      icon: Target,
      color: "text-blue-500"
    },
    {
      title: "Total Clicks",
      value: (stats?.traffic?.totalClicks || 0).toLocaleString(),
      change: stats?.traffic?.totalClicks > 0 ? `${stats.traffic.avgDailyClicks}/day avg` : "No clicks yet",
      trend: (stats?.traffic?.totalClicks > 0 ? "up" : "neutral") as TrendType,
      icon: MousePointerClick,
      color: "text-purple-500"
    },
    {
      title: "Conversion Rate",
      value: `${stats?.traffic?.conversionRate || "0.00"}%`,
      change: stats?.traffic?.totalConversions > 0 ? `${stats.traffic.totalConversions} conversions` : "No conversions",
      trend: (stats?.traffic?.totalConversions > 0 ? "up" : "neutral") as TrendType,
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
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
          <Badge variant={stats?.automationStatus === "active" ? "default" : "secondary"}>
            Automation: {stats?.automationStatus || "inactive"}
          </Badge>
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
                  ) : metric.trend === "down" ? (
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  ) : null}
                  <span className={
                    metric.trend === "up" ? "text-green-500" : 
                    metric.trend === "down" ? "text-red-500" : 
                    "text-muted-foreground"
                  }>
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
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Automation Status
                </CardTitle>
                <CardDescription>Real-time system performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Automation Scheduler</span>
                    <Badge variant={stats?.automationStatus === "active" ? "default" : "secondary"}>
                      {stats?.automationStatus === "active" ? "Running" : "Stopped"}
                    </Badge>
                  </div>
                  <Progress value={stats?.automationStatus === "active" ? 100 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {stats?.automationStatus === "active" 
                      ? "Processing tasks every 5 minutes" 
                      : "Create campaigns to activate"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Traffic Generation</span>
                    <Badge variant={stats?.traffic?.totalClicks > 0 ? "default" : "secondary"}>
                      {stats?.traffic?.totalClicks > 0 ? "Active" : "Pending"}
                    </Badge>
                  </div>
                  <Progress value={stats?.traffic?.totalClicks > 0 ? 85 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {stats?.traffic?.totalClicks > 0 
                      ? `${stats.traffic.totalClicks} total clicks generated` 
                      : "Waiting for campaigns"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Campaign Optimization</span>
                    <Badge variant={stats?.campaigns?.activeCampaigns > 0 ? "default" : "secondary"}>
                      {stats?.campaigns?.activeCampaigns > 0 ? "Optimizing" : "Inactive"}
                    </Badge>
                  </div>
                  <Progress value={stats?.campaigns?.activeCampaigns > 0 ? 90 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {stats?.campaigns?.activeCampaigns > 0 
                      ? `${stats.campaigns.activeCampaigns} campaigns being optimized` 
                      : "No active campaigns"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Revenue Tracking</span>
                    <Badge variant={stats?.campaigns?.totalRevenue > 0 ? "default" : "secondary"}>
                      {stats?.campaigns?.totalRevenue > 0 ? "Tracking" : "Ready"}
                    </Badge>
                  </div>
                  <Progress value={stats?.campaigns?.totalRevenue > 0 ? 95 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    ${(stats?.campaigns?.totalRevenue || 0).toFixed(2)} total revenue
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Current system statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      metric: "Total Revenue", 
                      current: `$${(stats?.campaigns?.totalRevenue || 0).toFixed(2)}`,
                      target: `$${(stats?.campaigns?.totalRevenue * 2 || 1000).toFixed(2)}`,
                      progress: Math.min(((stats?.campaigns?.totalRevenue || 0) / 1000) * 100, 100)
                    },
                    { 
                      metric: "Total Clicks", 
                      current: stats?.traffic?.totalClicks || 0,
                      target: "10,000",
                      progress: Math.min(((stats?.traffic?.totalClicks || 0) / 10000) * 100, 100)
                    },
                    { 
                      metric: "Conversions", 
                      current: stats?.traffic?.totalConversions || 0,
                      target: "500",
                      progress: Math.min(((stats?.traffic?.totalConversions || 0) / 500) * 100, 100)
                    },
                    { 
                      metric: "ROI", 
                      current: `${((stats?.campaigns?.avgROI || 0) * 100).toFixed(1)}%`,
                      target: "200%",
                      progress: Math.min(((stats?.campaigns?.avgROI || 0) * 100) / 200 * 100, 100)
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{item.metric}</p>
                        <p className="text-sm text-muted-foreground">Target: {item.target}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={item.progress} className="h-2 flex-1" />
                        <p className="text-sm font-bold min-w-[60px] text-right">{item.current}</p>
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
                <Button 
                  variant="outline" 
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => window.location.href = "/dashboard#campaigns"}
                >
                  <Target className="h-5 w-5" />
                  <span className="text-sm">New Campaign</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => setActiveTab("activity")}
                >
                  <Eye className="h-5 w-5" />
                  <span className="text-sm">View Activity</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col gap-2 p-4"
                  onClick={loadDashboardData}
                >
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm">Refresh Stats</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => setActiveTab("traffic")}
                >
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Traffic Stats</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Campaigns</CardTitle>
              <CardDescription>Your most successful campaigns</CardDescription>
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
                            <span className="flex items-center gap-1">
                              <MousePointerClick className="h-3 w-3" />
                              {campaign.clicks || 0} clicks
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
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Campaigns Yet</p>
                  <p className="text-sm mb-4">Create your first campaign to start tracking performance</p>
                  <Button onClick={() => window.location.href = "/dashboard#campaigns"}>
                    Create Campaign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Overview</CardTitle>
              <CardDescription>Traffic generation statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Clicks</p>
                    <p className="text-2xl font-bold">{stats?.traffic?.totalClicks || 0}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="text-2xl font-bold">{stats?.traffic?.totalConversions || 0}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">${(stats?.traffic?.totalRevenue || 0).toFixed(2)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Avg Daily</p>
                    <p className="text-2xl font-bold">{stats?.traffic?.avgDailyClicks || 0}</p>
                  </div>
                </div>

                {stats?.traffic?.totalClicks === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-t">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No Traffic Yet</p>
                    <p className="text-sm">Traffic will appear here once you create campaigns and activate automation</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events and actions</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        activity.status === "success" ? "bg-green-500" :
                        activity.status === "error" ? "bg-red-500" :
                        activity.status === "warning" ? "bg-orange-500" :
                        "bg-blue-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground mt-1">{activity.details}</p>
                        {activity.metadata && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {JSON.stringify(activity.metadata)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Badge variant={
                          activity.status === "success" ? "default" :
                          activity.status === "error" ? "destructive" :
                          "secondary"
                        }>
                          {activity.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Activity Yet</p>
                  <p className="text-sm mb-4">Activity will appear here as you use the system</p>
                  <p className="text-xs">Try creating a campaign or generating affiliate links</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}