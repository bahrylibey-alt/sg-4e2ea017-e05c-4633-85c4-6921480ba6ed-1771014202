import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  TrendingUp, 
  DollarSign, 
  MousePointerClick,
  ShoppingCart,
  Target,
  Users,
  ExternalLink,
  Radio
} from "lucide-react";
import { realTimeAnalytics } from "@/services/realTimeAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";

export function AdvancedAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [trafficSources, setTrafficSources] = useState<any[]>([]);
  const [recentConversions, setRecentConversions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
    
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(loadAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Load analytics snapshot
      const snapshot = await realTimeAnalytics.getPerformanceSnapshot();
      setAnalytics(snapshot);

      // Load product performance
      const productPerf = await realTimeAnalytics.getProductPerformance();
      setProducts(productPerf || []);

      // Load all affiliate links with full details
      const { data: linksData } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      setLinks(linksData || []);

      // Load traffic sources from all campaigns
      const { data: campaignsData } = await supabase
        .from("campaigns")
        .select("id")
        .eq("user_id", user.id);

      if (campaignsData && campaignsData.length > 0) {
        const { data: trafficData } = await supabase
          .from("traffic_sources")
          .select("*")
          .in("campaign_id", campaignsData.map(c => c.id))
          .order("total_clicks", { ascending: false });
        
        setTrafficSources(trafficData || []);
      }

      // Load recent conversions (commissions)
      const { data: commissionsData } = await supabase
        .from("commissions")
        .select(`
          *,
          affiliate_links (
            product_name,
            cloaked_url
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      setRecentConversions(commissionsData || []);

      setLoading(false);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
      setLoading(false);
    }
  };

  // Safe access helper function with default values
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    return typeof value === 'number' && !isNaN(value) ? value : defaultValue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <Activity className="h-12 w-12 animate-pulse mx-auto text-primary" />
          <p className="text-muted-foreground">Loading real-time analytics...</p>
        </div>
      </div>
    );
  }

  // Ensure analytics has default values
  const analyticsData = {
    clicks: safeNumber(analytics?.clicks),
    conversions: safeNumber(analytics?.conversions),
    revenue: safeNumber(analytics?.revenue),
    commissions: safeNumber(analytics?.commissions),
    conversionRate: safeNumber(analytics?.conversionRate),
    averageOrderValue: safeNumber(analytics?.averageOrderValue)
  };

  return (
    <div className="space-y-6">
      {/* Real-Time Status Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Analytics</h2>
          <p className="text-muted-foreground">Real-time performance tracking and insights</p>
        </div>
        <Badge variant="outline" className="animate-pulse">
          <Radio className="h-3 w-3 mr-1 text-green-500" />
          Live Updates
        </Badge>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.clicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {links.length} active links
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.conversions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.conversionRate.toFixed(2)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ${analyticsData.averageOrderValue.toFixed(2)} avg order value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${analyticsData.commissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {recentConversions.length} pending payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="links">Affiliate Links ({links.length})</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Sources ({trafficSources.length})</TabsTrigger>
          <TabsTrigger value="conversions">Recent Sales ({recentConversions.length})</TabsTrigger>
        </TabsList>

        {/* Products Performance Table */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Detailed metrics for each product</CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No products tracked yet. Launch an autopilot campaign to start!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Conv. Rate</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.productId || Math.random()}>
                        <TableCell className="font-medium">{product.productName || "Unknown"}</TableCell>
                        <TableCell className="text-right">{safeNumber(product.clicks).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{safeNumber(product.conversions).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={safeNumber(product.conversionRate) > 5 ? "default" : "secondary"}>
                            {safeNumber(product.conversionRate).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${safeNumber(product.revenue).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          ${safeNumber(product.commission).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{safeNumber(product.roi).toFixed(0)}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Affiliate Links Table */}
        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Links</CardTitle>
              <CardDescription>All generated affiliate links and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              {links.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ExternalLink className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No affiliate links generated yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Short Link</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">{link.product_name || "Unknown"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{link.network || "Direct"}</Badge>
                        </TableCell>
                        <TableCell>
                          <a 
                            href={link.cloaked_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {link.slug}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell className="text-right">{safeNumber(link.clicks)}</TableCell>
                        <TableCell className="text-right">{safeNumber(link.conversions)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${safeNumber(link.revenue).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={link.status === "active" ? "default" : "secondary"}>
                            {link.status || "unknown"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traffic Sources Table */}
        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Performance breakdown by traffic channel</CardDescription>
            </CardHeader>
            <CardContent>
              {trafficSources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No traffic sources active yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Conv. Rate</TableHead>
                      <TableHead className="text-right">Spend</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trafficSources.map((source) => {
                      const totalClicks = safeNumber(source.total_clicks);
                      const totalConversions = safeNumber(source.total_conversions);
                      const convRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
                      
                      return (
                        <TableRow key={source.id}>
                          <TableCell className="font-medium">{source.source_name || "Unknown"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{source.source_type || "unknown"}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{totalClicks}</TableCell>
                          <TableCell className="text-right">{totalConversions}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={convRate > 3 ? "default" : "secondary"}>
                              {convRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            ${safeNumber(source.total_spend).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={source.status === "active" ? "default" : "secondary"}>
                              {source.status || "unknown"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Conversions Table */}
        <TabsContent value="conversions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales & Commissions</CardTitle>
              <CardDescription>Latest conversion events and earnings</CardDescription>
            </CardHeader>
            <CardContent>
              {recentConversions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No conversions recorded yet. Keep promoting!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Sale Amount</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentConversions.map((conv) => {
                      const saleAmount = safeNumber(conv.sale_amount);
                      const commissionAmount = safeNumber(conv.amount);
                      const commissionRate = saleAmount > 0 ? (commissionAmount / saleAmount) * 100 : 0;
                      
                      return (
                        <TableRow key={conv.id}>
                          <TableCell>
                            {new Date(conv.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {conv.affiliate_links?.product_name || "Unknown Product"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${saleAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-bold">
                            ${commissionAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{commissionRate.toFixed(0)}%</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                conv.status === "paid" ? "default" : 
                                conv.status === "approved" ? "secondary" : 
                                "outline"
                              }
                            >
                              {conv.status || "pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Traffic Distribution Chart */}
      {trafficSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Traffic Distribution</CardTitle>
            <CardDescription>Visual breakdown of traffic sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trafficSources.slice(0, 5).map((source) => {
                const totalTraffic = trafficSources.reduce((sum, s) => sum + safeNumber(s.total_clicks), 0);
                const sourceClicks = safeNumber(source.total_clicks);
                const percentage = totalTraffic > 0 ? (sourceClicks / totalTraffic) * 100 : 0;
                
                return (
                  <div key={source.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{source.source_name || "Unknown"}</span>
                      <span className="text-muted-foreground">
                        {sourceClicks} clicks ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}