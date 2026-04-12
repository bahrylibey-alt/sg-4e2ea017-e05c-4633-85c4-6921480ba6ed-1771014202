import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, MousePointerClick, Users, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function Analytics() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalClicks: 0,
    totalConversions: 0,
    activeCampaigns: 0
  });
  const [performance, setPerformance] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadRealData();
  }, []);

  const loadRealData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get REAL system state data
      const { data: systemState } = await supabase
        .from('system_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get REAL campaign data
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('user_id', user.id);

      // Get REAL posted content for performance breakdown
      const { data: posts } = await supabase
        .from('posted_content')
        .select(`
          platform, 
          impressions, 
          clicks, 
          conversions, 
          revenue,
          affiliate_links (product_name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'posted')
        .order('clicks', { ascending: false })
        .limit(10);

      // Aggregate by product
      const productPerformance: Record<string, any> = {};
      posts?.forEach((post: any) => {
        const product = post.affiliate_links?.product_name || post.platform || 'Unknown Product';
        if (!productPerformance[product]) {
          productPerformance[product] = {
            product,
            clicks: 0,
            conversions: 0,
            revenue: 0
          };
        }
        productPerformance[product].clicks += post.clicks || 0;
        productPerformance[product].conversions += post.conversions || 0;
        productPerformance[product].revenue += Number(post.revenue) || 0;
      });

      const performanceArray = Object.values(productPerformance)
        .sort((a: any, b: any) => b.clicks - a.clicks)
        .slice(0, 4)
        .map((item: any) => ({
          ...item,
          conversion_rate: item.clicks > 0 
            ? `${((item.conversions / item.clicks) * 100).toFixed(1)}%`
            : '0%'
        }));

      setMetrics({
        totalRevenue: systemState?.total_verified_revenue || 0,
        totalClicks: systemState?.total_clicks || 0,
        totalConversions: systemState?.total_verified_conversions || 0,
        activeCampaigns: campaigns?.filter(c => c.status === 'active').length || 0
      });

      setPerformance(performanceArray);
      setLastUpdated(new Date());

      console.log('✅ Real analytics loaded:', {
        revenue: systemState?.total_verified_revenue || 0,
        clicks: systemState?.total_clicks || 0,
        conversions: systemState?.total_verified_conversions || 0
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRealData();
    setIsRefreshing(false);
    
    toast({
      title: "✅ Analytics refreshed",
      description: "Latest verified data loaded from database"
    });
  };

  const handleExportData = () => {
    if (performance.length === 0) {
      toast({
        title: "No data to export",
        description: "Start generating traffic to see performance data",
        variant: "destructive"
      });
      return;
    }

    const csvContent = "Product,Clicks,Conversions,Revenue,Conversion Rate\n" +
      performance.map(item => 
        `"${item.product}",${item.clicks},${item.conversions},$${item.revenue.toFixed(2)},${item.conversion_rate}`
      ).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `affiliate-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "📊 Analytics exported",
      description: "Your performance data has been downloaded as CSV"
    });
  };

  if (!mounted) return null;

  return (
    <section className="py-24 px-6 bg-background" data-section="analytics">
      <div className="container">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="text-primary border-primary/30">
            Real Performance Analytics
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Track Every <span className="text-primary">Metric</span> That Matters
          </h2>
          <p className="text-lg text-muted-foreground">
            100% verified data - no simulations or estimates
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            <Button onClick={handleExportData} variant="outline" disabled={performance.length === 0}>
              Export CSV
            </Button>
            <span className="text-sm text-muted-foreground">
              Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verified Revenue
              </CardTitle>
              <DollarSign className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                ${metrics.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.totalRevenue === 0 ? 'Awaiting first conversion' : 'From verified sales'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Real Clicks
              </CardTitle>
              <MousePointerClick className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {metrics.totalClicks.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.totalClicks === 0 ? 'Waiting for traffic' : 'Tracked affiliate clicks'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Conversions
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {metrics.totalConversions}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.totalClicks > 0 
                  ? `${((metrics.totalConversions / metrics.totalClicks) * 100).toFixed(1)}% conversion rate`
                  : 'No conversions yet'
                }
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Campaigns
              </CardTitle>
              <Users className="w-5 h-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {metrics.activeCampaigns}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Running campaigns
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Top Performing Products</CardTitle>
            <CardDescription>
              {performance.length > 0 
                ? 'Your best converting products based on real data'
                : 'No performance data yet - start posting content to see results'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {performance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Product</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Clicks</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Conversions</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map((item, index) => (
                      <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4 font-medium text-foreground">{item.product}</td>
                        <td className="py-4 px-4 text-right text-muted-foreground">{item.clicks}</td>
                        <td className="py-4 px-4 text-right text-muted-foreground">{item.conversions}</td>
                        <td className="py-4 px-4 text-right font-semibold text-green-500">
                          ${item.revenue.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Badge variant="secondary">{item.conversion_rate}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-2">No performance data available yet</p>
                <p className="text-sm">Content needs to be posted and get clicks to show here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}