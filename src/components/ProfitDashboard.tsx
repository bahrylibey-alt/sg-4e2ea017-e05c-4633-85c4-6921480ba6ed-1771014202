import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, DollarSign, MousePointerClick, Target, Award, BarChart3 } from "lucide-react";

interface ProfitMetrics {
  total_revenue: number;
  total_clicks: number;
  total_conversions: number;
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

      if (!posts || !products) return;

      // Calculate totals
      const total_revenue = posts.reduce((sum, p) => sum + (p.revenue || 0), 0);
      const total_clicks = posts.reduce((sum, p) => sum + (p.clicks || 0), 0);
      const total_conversions = posts.reduce((sum, p) => sum + (p.conversions || 0), 0);
      const total_impressions = posts.reduce((sum, p) => sum + (p.impressions || 0), 0);

      const avg_ctr = total_impressions > 0 ? (total_clicks / total_impressions) * 100 : 0;
      const avg_conversion_rate = total_clicks > 0 ? (total_conversions / total_clicks) * 100 : 0;

      // Find best platform
      const platformRevenue: Record<string, number> = {};
      posts.forEach(p => {
        const platform = p.platform || 'unknown';
        platformRevenue[platform] = (platformRevenue[platform] || 0) + (p.revenue || 0);
      });
      const best_platform = Object.entries(platformRevenue)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

      // Find best product
      const productRevenue: Record<string, { name: string; revenue: number }> = {};
      products.forEach(p => {
        productRevenue[p.id] = {
          name: p.product_name || 'Unknown',
          revenue: p.revenue || 0
        };
      });
      const best_product = Object.values(productRevenue)
        .sort((a, b) => b.revenue - a.revenue)[0] || { name: 'N/A', revenue: 0 };

      // Get top 5 posts
      const top_posts = posts
        .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          caption: p.caption || '',
          revenue: p.revenue || 0,
          ctr: p.ctr || 0,
          platform: p.platform || 'unknown'
        }));

      setMetrics({
        total_revenue,
        total_clicks,
        total_conversions,
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
    return <div className="flex items-center justify-center p-8">Loading profit data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${metrics.total_revenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {metrics.total_conversions} conversions
            </p>
          </CardContent>
        </Card>

        {/* Average CTR */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-blue-600" />
              Average CTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {metrics.avg_ctr.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.total_clicks} total clicks
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-violet-600" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-600">
              {metrics.avg_conversion_rate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.total_conversions} conversions
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
            <CardDescription>Highest revenue source</CardDescription>
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
            <CardDescription>Best revenue generator</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="font-semibold text-lg">{metrics.best_product.name}</div>
              <div className="text-2xl font-bold text-amber-600">
                ${metrics.best_product.revenue.toFixed(2)}
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
            Top Performing Posts
          </CardTitle>
          <CardDescription>Highest revenue posts</CardDescription>
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