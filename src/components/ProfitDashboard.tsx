import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, DollarSign, MousePointerClick, Target, Award, BarChart3, AlertCircle } from "lucide-react";

interface ProfitMetrics {
  total_revenue: number;
  total_clicks: number;
  total_conversions: number;
  total_views: number;
  avg_ctr: number;
  avg_conversion_rate: number;
  best_platform: string;
  best_product: {
    name: string;
    revenue: number;
  };
  top_posts: Array<{
    id: string;
    caption: string;
    revenue: number;
    ctr: number;
    platform: string;
  }>;
}

export function ProfitDashboard() {
  const [metrics, setMetrics] = useState<ProfitMetrics>({
    total_revenue: 0,
    total_clicks: 0,
    total_conversions: 0,
    total_views: 0,
    avg_ctr: 0,
    avg_conversion_rate: 0,
    best_platform: 'N/A',
    best_product: { name: 'N/A', revenue: 0 },
    top_posts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get REAL system state
      const { data: systemState } = await supabase
        .from('system_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const realViews = systemState?.total_views || 0;
      const realClicks = systemState?.total_clicks || 0;
      const realRevenue = Number(systemState?.total_verified_revenue) || 0;
      const realConversions = systemState?.total_verified_conversions || 0;

      // Get post metrics
      const { data: posts } = await supabase
        .from('posted_content')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'posted');

      // Get product metrics
      const { data: products } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('user_id', user.id);

      if (!posts || !products) {
        setMetrics({
          total_revenue: realRevenue,
          total_clicks: realClicks,
          total_conversions: realConversions,
          total_views: realViews,
          avg_ctr: realViews > 0 ? (realClicks / realViews) * 100 : 0,
          avg_conversion_rate: realClicks > 0 ? (realConversions / realClicks) * 100 : 0,
          best_platform: 'N/A',
          best_product: { name: 'N/A', revenue: 0 },
          top_posts: []
        });
        setLoading(false);
        return;
      }

      const avg_ctr = realViews > 0 ? (realClicks / realViews) * 100 : 0;
      const avg_conversion_rate = realClicks > 0 ? (realConversions / realClicks) * 100 : 0;

      // Find best platform (from posts with views)
      const platformViews: Record<string, number> = {};
      posts.forEach(p => {
        const platform = p.platform || 'unknown';
        platformViews[platform] = (platformViews[platform] || 0) + (p.impressions || 0);
      });
      const best_platform = Object.entries(platformViews)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

      // Find best product (by actual clicks, not fake revenue)
      const productClicks: Record<string, { name: string; clicks: number }> = {};
      products.forEach(p => {
        productClicks[p.id] = {
          name: p.product_name || 'Unknown',
          clicks: p.clicks || 0
        };
      });
      const bestProductData = Object.values(productClicks)
        .sort((a, b) => b.clicks - a.clicks)[0] || { name: 'N/A', clicks: 0 };
      
      const best_product = { 
        name: bestProductData.name, 
        revenue: 0 // Will show 0 until verified conversion
      };

      // Get top 5 posts by real clicks
      const top_posts = posts
        .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          caption: p.caption || '',
          revenue: 0, // ZERO until verified
          ctr: p.ctr || 0,
          platform: p.platform || 'unknown'
        }));

      setMetrics({
        total_revenue: realRevenue,
        total_clicks: realClicks,
        total_conversions: realConversions,
        total_views: realViews,
        avg_ctr,
        avg_conversion_rate,
        best_platform,
        best_product,
        top_posts
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading profit metrics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading verified data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Truth Mode Alert */}
      {metrics.total_revenue === 0 && (
        <Card className="border-2 border-blue-500/50 bg-blue-50 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Truth Mode Active
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Revenue shows $0 until verified conversions arrive via webhook or API. No fake signals.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue - VERIFIED ONLY */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Verified Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${metrics.total_revenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.total_conversions > 0 ? `From ${metrics.total_conversions} verified conversions` : 'Awaiting verified conversions'}
            </p>
          </CardContent>
        </Card>

        {/* Real Views */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Real Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {metrics.total_views.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Tracked in view_events table
            </p>
          </CardContent>
        </Card>

        {/* Average CTR */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-violet-600" />
              Average CTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-600">
              {metrics.avg_ctr.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.total_clicks} real clicks
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-pink-600" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600">
              {metrics.avg_conversion_rate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.total_conversions} verified conversions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Best Platform */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-pink-600" />
              Best Performing Platform
            </CardTitle>
            <CardDescription>Highest view count</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="text-lg px-4 py-2 bg-pink-600">
              {metrics.best_platform}
            </Badge>
          </CardContent>
        </Card>

        {/* Best Product */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              Top Product
            </CardTitle>
            <CardDescription>Most clicked product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="font-semibold text-lg">{metrics.best_product.name}</div>
              <div className="text-sm text-muted-foreground">
                Revenue awaiting verification
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-600" />
            Top Performing Posts (by clicks)
          </CardTitle>
          <CardDescription>Real click data only</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.top_posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts yet</p>
            ) : (
              metrics.top_posts.map((post, i) => (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{i + 1}</Badge>
                      <Badge variant="secondary">{post.platform}</Badge>
                    </div>
                    <p className="text-sm line-clamp-1">{post.caption}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      CTR: {post.ctr.toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-bold text-green-600">
                      ${post.revenue.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Awaiting verification</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}