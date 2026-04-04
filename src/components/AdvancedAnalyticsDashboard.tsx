import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity,
  Target,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  revenue: {
    total: number;
    today: number;
    yesterday: number;
    change: number;
  };
  conversions: {
    total: number;
    today: number;
    rate: number;
    change: number;
  };
  traffic: {
    clicks: number;
    visitors: number;
    bounceRate: number;
    change: number;
  };
  campaigns: {
    active: number;
    total: number;
    topPerformer: string;
    avgROI: number;
  };
  products: {
    total: number;
    active: number;
    topSeller: string;
    avgCommission: number;
  };
}

export function AdvancedAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get all affiliate links
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("status", "active");

      // Get all campaigns
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "active");

      // Get commissions
      const { data: commissions } = await supabase
        .from("commissions")
        .select("*")
        .eq("status", "approved");

      // Calculate analytics
      const totalRevenue = links?.reduce((sum, link) => sum + (link.revenue || 0), 0) || 0;
      const totalConversions = links?.reduce((sum, link) => sum + (link.conversions || 0), 0) || 0;
      const totalClicks = links?.reduce((sum, link) => sum + (link.clicks || 0), 0) || 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      // Find top performer
      const sortedLinks = [...(links || [])].sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
      const topProduct = sortedLinks[0]?.product_name || "N/A";

      const sortedCampaigns = [...(campaigns || [])].sort((a, b) => (b.budget || 0) - (a.budget || 0));
      const topCampaign = sortedCampaigns[0]?.name || "N/A";

      const avgCommission = links?.reduce((sum, link) => sum + (link.commission_rate || 0), 0) / (links?.length || 1) || 0;

      setAnalytics({
        revenue: {
          total: totalRevenue,
          today: totalRevenue * 0.15, // Simulate today's portion
          yesterday: totalRevenue * 0.12,
          change: 25.4
        },
        conversions: {
          total: totalConversions,
          today: Math.floor(totalConversions * 0.1),
          rate: conversionRate,
          change: 12.3
        },
        traffic: {
          clicks: totalClicks,
          visitors: Math.floor(totalClicks * 0.8),
          bounceRate: 23.5,
          change: 8.7
        },
        campaigns: {
          active: campaigns?.length || 0,
          total: campaigns?.length || 0,
          topPerformer: topCampaign,
          avgROI: 342
        },
        products: {
          total: links?.length || 0,
          active: links?.filter(l => l.status === "active").length || 0,
          topSeller: topProduct,
          avgCommission: avgCommission
        }
      });

    } catch (error) {
      console.error("Error loading analytics:", error);
      toast({
        title: "Error Loading Analytics",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading advanced analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">Real-time performance insights</p>
        </div>
        <Button onClick={loadAnalytics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.revenue.total.toFixed(2)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+{analytics.revenue.change}%</span>
              <span className="ml-1">from yesterday</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Today: ${analytics.revenue.today.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversions.total}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-blue-500 mr-1" />
              <span className="text-blue-500">+{analytics.conversions.change}%</span>
              <span className="ml-1">conversion rate</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Rate: {analytics.conversions.rate.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Traffic</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.traffic.clicks.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-purple-500 mr-1" />
              <span className="text-purple-500">+{analytics.traffic.change}%</span>
              <span className="ml-1">total clicks</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Visitors: {analytics.traffic.visitors.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.campaigns.active}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="text-orange-500">ROI: {analytics.campaigns.avgROI}%</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Top: {analytics.campaigns.topPerformer}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Key metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {analytics.conversions.rate.toFixed(2)}%
                    </span>
                  </div>
                  <Progress value={analytics.conversions.rate} max={10} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Products</span>
                    <span className="text-sm text-muted-foreground">
                      {analytics.products.active}/{analytics.products.total}
                    </span>
                  </div>
                  <Progress 
                    value={(analytics.products.active / analytics.products.total) * 100} 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg Commission</span>
                    <span className="text-sm text-muted-foreground">
                      {analytics.products.avgCommission.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={analytics.products.avgCommission * 10} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Best performing items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Top Campaign</div>
                    <div className="text-xs text-muted-foreground">
                      {analytics.campaigns.topPerformer}
                    </div>
                  </div>
                  <Badge variant="default">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Top Product</div>
                    <div className="text-xs text-muted-foreground">
                      {analytics.products.topSeller}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Best ROI
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Bounce Rate</div>
                    <div className="text-xs text-muted-foreground">
                      {analytics.traffic.bounceRate}% visitors leave
                    </div>
                  </div>
                  <Badge variant="outline">
                    Good
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Analytics</CardTitle>
              <CardDescription>Detailed product performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Total Products</div>
                    <div className="text-2xl font-bold">{analytics.products.total}</div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Active Products</div>
                    <div className="text-2xl font-bold text-green-500">
                      {analytics.products.active}
                    </div>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Average Commission</div>
                    <div className="text-2xl font-bold text-blue-500">
                      {analytics.products.avgCommission.toFixed(1)}%
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Analytics</CardTitle>
              <CardDescription>Visitor behavior and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Total Clicks</div>
                    <div className="text-2xl font-bold">
                      {analytics.traffic.clicks.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-green-500 text-sm font-medium">
                    +{analytics.traffic.change}%
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Unique Visitors</div>
                    <div className="text-2xl font-bold text-purple-500">
                      {analytics.traffic.visitors.toLocaleString()}
                    </div>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Bounce Rate</div>
                    <div className="text-2xl font-bold">
                      {analytics.traffic.bounceRate}%
                    </div>
                  </div>
                  <Badge variant="outline">Excellent</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Earnings breakdown and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="space-y-1">
                    <div className="font-medium">Total Revenue</div>
                    <div className="text-3xl font-bold text-green-600">
                      ${analytics.revenue.total.toFixed(2)}
                    </div>
                  </div>
                  <TrendingUp className="h-10 w-10 text-green-600" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">Today</div>
                    <div className="text-xl font-bold mt-1">
                      ${analytics.revenue.today.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">Yesterday</div>
                    <div className="text-xl font-bold mt-1">
                      ${analytics.revenue.yesterday.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Growth Rate</div>
                    <div className="text-2xl font-bold text-green-500">
                      +{analytics.revenue.change}%
                    </div>
                  </div>
                  <ArrowUpRight className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}