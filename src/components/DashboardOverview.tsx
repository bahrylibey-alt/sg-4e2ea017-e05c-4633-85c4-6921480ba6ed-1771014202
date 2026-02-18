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
  Sparkles
} from "lucide-react";
import { campaignService } from "@/services/campaignService";
import { advancedAnalyticsService } from "@/services/advancedAnalyticsService";
import { trafficAutomationService } from "@/services/trafficAutomationService";

export function DashboardOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [campaignStats, predictions, trafficStatus] = await Promise.all([
        campaignService.getCampaignStats(),
        advancedAnalyticsService.predictPerformance("sample-campaign", 30),
        trafficAutomationService.getTrafficStatus()
      ]);

      setStats({
        campaigns: campaignStats,
        predictions,
        traffic: trafficStatus
      });
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const metricCards = [
    {
      title: "Total Revenue",
      value: "$48,392",
      change: "+23.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-500"
    },
    {
      title: "Active Campaigns",
      value: "12",
      change: "+3 this week",
      trend: "up",
      icon: Target,
      color: "text-blue-500"
    },
    {
      title: "Total Traffic",
      value: "156.2K",
      change: "+18.3%",
      trend: "up",
      icon: Users,
      color: "text-purple-500"
    },
    {
      title: "Conversion Rate",
      value: "4.8%",
      change: "+1.2%",
      trend: "up",
      icon: TrendingUp,
      color: "text-orange-500"
    }
  ];

  const recentActivity = [
    { action: "Campaign 'Summer Sale' optimized", time: "2 min ago", type: "success" },
    { action: "Traffic surge detected (+340%)", time: "5 min ago", type: "info" },
    { action: "Budget reallocated for better ROI", time: "12 min ago", type: "success" },
    { action: "New A/B test started", time: "18 min ago", type: "info" },
    { action: "Fraud detected and blocked (124 clicks)", time: "23 min ago", type: "warning" }
  ];

  const topPerformers = [
    { name: "Summer Electronics Sale", revenue: "$12,450", roi: "385%", status: "active" },
    { name: "Fashion Week Promo", revenue: "$9,820", roi: "312%", status: "active" },
    { name: "Home Essentials Deal", revenue: "$7,340", roi: "278%", status: "active" }
  ];

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-spin" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

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
                    <Badge variant="default">Active</Badge>
                  </div>
                  <Progress value={92} className="h-2" />
                  <p className="text-xs text-muted-foreground">92% of traffic fully automated</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Budget Optimization</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <Progress value={87} className="h-2" />
                  <p className="text-xs text-muted-foreground">$4,230 saved this month</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Conversion Optimization</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <Progress value={95} className="h-2" />
                  <p className="text-xs text-muted-foreground">+45% improvement detected</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Fraud Detection</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-xs text-muted-foreground">1,247 threats blocked today</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
                <CardDescription>Last 30 days comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { metric: "Revenue", current: "$48,392", previous: "$39,240", change: "+23.5%" },
                    { metric: "Conversions", current: "2,847", previous: "2,210", change: "+28.8%" },
                    { metric: "ROI", current: "342%", previous: "278%", change: "+64pts" },
                    { metric: "Traffic", current: "156.2K", previous: "132.1K", change: "+18.3%" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{item.metric}</p>
                        <p className="text-xs text-muted-foreground">Current: {item.current}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-500">{item.change}</p>
                        <p className="text-xs text-muted-foreground">vs {item.previous}</p>
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
              <CardTitle>Top Performing Campaigns</CardTitle>
              <CardDescription>Based on ROI and revenue generated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((campaign, idx) => (
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Distribution</CardTitle>
                <CardDescription>By channel and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { channel: "Google Ads", traffic: "45.2K", conversion: "5.2%", progress: 45 },
                    { channel: "Facebook", traffic: "38.7K", conversion: "4.8%", progress: 38 },
                    { channel: "Email", traffic: "28.3K", conversion: "6.1%", progress: 28 },
                    { channel: "Organic", traffic: "24.1K", conversion: "3.9%", progress: 24 },
                    { channel: "Direct", traffic: "19.9K", conversion: "4.3%", progress: 20 }
                  ].map((source, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{source.channel}</span>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>{source.traffic}</span>
                          <Badge variant="outline">{source.conversion}</Badge>
                        </div>
                      </div>
                      <Progress value={source.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automated Traffic Actions</CardTitle>
                <CardDescription>Real-time optimizations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: "Scaled Google Ads budget", impact: "+$2.4K revenue", time: "5 min" },
                    { action: "Paused underperforming ad", impact: "-$340 waste", time: "12 min" },
                    { action: "Shifted traffic to peak hours", impact: "+18% conversions", time: "28 min" },
                    { action: "Blocked fraudulent traffic", impact: "$890 saved", time: "35 min" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                      <Zap className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.action}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-green-500 font-medium">{item.impact}</p>
                          <p className="text-xs text-muted-foreground">{item.time} ago</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent System Activity</CardTitle>
              <CardDescription>Live feed of automated actions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, idx) => (
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}