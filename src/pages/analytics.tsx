import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  MousePointerClick,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Zap,
  Target,
  Loader2,
  RefreshCw,
  Brain,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductPerformance {
  id: string;
  name: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversion_rate: number;
  status: 'hot' | 'warm' | 'cold';
}

interface TrafficPerformance {
  source: string;
  clicks: number;
  conversions: number;
  revenue: number;
  roi: number;
  status: 'excellent' | 'good' | 'poor';
}

interface AutoDetection {
  type: 'opportunity' | 'warning' | 'insight';
  title: string;
  description: string;
  action?: string;
  impact: 'high' | 'medium' | 'low';
}

export default function ProfessionalAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalClicks: 0,
    totalConversions: 0,
    avgConversionRate: 0,
    revenueGrowth: 0,
    clickGrowth: 0
  });

  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [topTraffic, setTopTraffic] = useState<TrafficPerformance[]>([]);
  const [autoDetections, setAutoDetections] = useState<AutoDetection[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      let currentUserId = user?.id;
      
      if (!currentUserId) {
        const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
        if (profiles && profiles.length > 0) {
          currentUserId = profiles[0].id;
        }
      }
      
      setUserId(currentUserId || null);
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      // Get all data
      const [clicksRes, conversionsRes, productsRes, trafficSourcesRes] = await Promise.all([
        (supabase as any).from('click_events').select('*').eq('user_id', currentUserId),
        (supabase as any).from('conversion_events').select('*').eq('user_id', currentUserId),
        (supabase as any).from('product_catalog').select('id, name').eq('user_id', currentUserId),
        (supabase as any).from('traffic_sources').select('*').eq('user_id', currentUserId)
      ]);

      const clicksData: any[] = clicksRes.data || [];
      const conversionsData: any[] = conversionsRes.data || [];
      const productsData: any[] = productsRes.data || [];
      const trafficSourcesData: any[] = trafficSourcesRes.data || [];

      // Calculate metrics
      const totalRevenue = conversionsData.reduce((sum: number, c: any) => sum + (Number(c.revenue) || 0), 0) || 0;
      const totalClicks = clicksData.length || 0;
      const totalConversions = conversionsData.length || 0;
      const avgConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      // Calculate growth (last 7 days vs previous 7 days)
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const recentClicks = clicksData.filter((c: any) => new Date(c.created_at || now) > last7Days).length || 0;
      const previousClicks = clicksData.filter((c: any) => {
        const date = new Date(c.created_at || now);
        return date > previous7Days && date <= last7Days;
      }).length || 0;

      const recentRevenue = conversionsData.filter((c: any) => new Date(c.created_at || now) > last7Days)
        .reduce((sum: number, c: any) => sum + (Number(c.revenue) || 0), 0) || 0;
      const previousRevenue = conversionsData.filter((c: any) => {
        const date = new Date(c.created_at || now);
        return date > previous7Days && date <= last7Days;
      }).reduce((sum: number, c: any) => sum + (Number(c.revenue) || 0), 0) || 0;

      const clickGrowth = previousClicks > 0 ? ((recentClicks - previousClicks) / previousClicks) * 100 : 0;
      const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      setMetrics({
        totalRevenue,
        totalClicks,
        totalConversions,
        avgConversionRate,
        revenueGrowth,
        clickGrowth
      });

      // Analyze product performance
      const productPerformance: ProductPerformance[] = [];
      for (const product of productsData) {
        const productClicks = clicksData.filter((c: any) => c.product_id === product.id).length || 0;
        const productConversions = conversionsData.filter((c: any) => c.product_id === product.id) || [];
        const productRevenue = productConversions.reduce((sum: number, c: any) => sum + (Number(c.revenue) || 0), 0);
        const conversionRate = productClicks > 0 ? (productConversions.length / productClicks) * 100 : 0;

        let status: 'hot' | 'warm' | 'cold' = 'cold';
        if (conversionRate > 5 && productRevenue > 100) status = 'hot';
        else if (conversionRate > 2 || productRevenue > 50) status = 'warm';

        productPerformance.push({
          id: product.id,
          name: product.name,
          clicks: productClicks,
          conversions: productConversions.length,
          revenue: productRevenue,
          conversion_rate: conversionRate,
          status
        });
      }

      // Sort and get top 10
      productPerformance.sort((a, b) => b.revenue - a.revenue);
      setTopProducts(productPerformance.slice(0, 10));

      // Analyze traffic source performance
      const trafficPerformance: TrafficPerformance[] = [];
      for (const source of trafficSourcesData) {
        const sourceClicks = clicksData.filter((c: any) => c.traffic_source === source.source_name).length || 0;
        const sourceConversions = conversionsData.filter((c: any) => c.traffic_source === source.source_name) || [];
        const sourceRevenue = sourceConversions.reduce((sum: number, c: any) => sum + (Number(c.revenue) || 0), 0);
        const roi = sourceRevenue; // Simplified - in production, factor in costs

        let status: 'excellent' | 'good' | 'poor' = 'poor';
        if (roi > 500 && sourceClicks > 100) status = 'excellent';
        else if (roi > 100 || sourceClicks > 50) status = 'good';

        trafficPerformance.push({
          source: source.source_name,
          clicks: sourceClicks,
          conversions: sourceConversions.length,
          revenue: sourceRevenue,
          roi,
          status
        });
      }

      trafficPerformance.sort((a, b) => b.revenue - a.revenue);
      setTopTraffic(trafficPerformance.slice(0, 10));

      // Run auto-detection
      runAutoDetection(productPerformance, trafficPerformance, metrics);

    } catch (error: any) {
      console.error('Analytics error:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runAutoDetection = (
    products: ProductPerformance[],
    traffic: TrafficPerformance[],
    currentMetrics: typeof metrics
  ) => {
    const detections: AutoDetection[] = [];

    // Detect hot products
    const hotProducts = products.filter(p => p.status === 'hot');
    if (hotProducts.length > 0) {
      detections.push({
        type: 'opportunity',
        title: `${hotProducts.length} Hot Products Detected`,
        description: `${hotProducts[0].name} is performing exceptionally well with ${hotProducts[0].conversion_rate.toFixed(1)}% conversion rate`,
        action: 'Increase traffic allocation to these products',
        impact: 'high'
      });
    }

    // Detect cold products
    const coldProducts = products.filter(p => p.status === 'cold' && p.clicks > 50);
    if (coldProducts.length > 0) {
      detections.push({
        type: 'warning',
        title: `${coldProducts.length} Underperforming Products`,
        description: `Products with high traffic but low conversions detected`,
        action: 'Consider replacing or optimizing these products',
        impact: 'medium'
      });
    }

    // Detect excellent traffic sources
    const excellentSources = traffic.filter(s => s.status === 'excellent');
    if (excellentSources.length > 0) {
      detections.push({
        type: 'opportunity',
        title: 'High-Performing Traffic Sources',
        description: `${excellentSources[0].source} generating $${excellentSources[0].revenue.toFixed(2)} in revenue`,
        action: 'Scale up these traffic channels',
        impact: 'high'
      });
    }

    // Detect poor traffic sources
    const poorSources = traffic.filter(s => s.status === 'poor' && s.clicks > 20);
    if (poorSources.length > 0) {
      detections.push({
        type: 'warning',
        title: 'Low ROI Traffic Sources',
        description: `${poorSources.length} traffic sources with poor performance`,
        action: 'Pause or optimize these channels',
        impact: 'medium'
      });
    }

    // Detect growth trends
    if (currentMetrics.revenueGrowth > 20) {
      detections.push({
        type: 'insight',
        title: 'Strong Revenue Growth',
        description: `Revenue up ${currentMetrics.revenueGrowth.toFixed(1)}% over last 7 days`,
        action: 'System is performing well - continue current strategy',
        impact: 'high'
      });
    }

    if (currentMetrics.revenueGrowth < -10) {
      detections.push({
        type: 'warning',
        title: 'Revenue Declining',
        description: `Revenue down ${Math.abs(currentMetrics.revenueGrowth).toFixed(1)}% over last 7 days`,
        action: 'Review product mix and traffic allocation',
        impact: 'high'
      });
    }

    // Detect conversion rate issues
    if (currentMetrics.avgConversionRate < 1 && currentMetrics.totalClicks > 100) {
      detections.push({
        type: 'warning',
        title: 'Low Conversion Rate',
        description: `Overall conversion rate at ${currentMetrics.avgConversionRate.toFixed(2)}%`,
        action: 'Review product quality and landing page optimization',
        impact: 'high'
      });
    }

    setAutoDetections(detections);
  };

  const refreshAnalytics = async () => {
    setAnalyzing(true);
    await loadAnalytics();
    setAnalyzing(false);
    toast({
      title: "Analytics Refreshed",
      description: "All data has been updated with latest insights"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Analyzing performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="h-10 w-10 text-blue-600" />
              Professional Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">AI-powered auto-detection & performance insights</p>
          </div>
          <Button onClick={refreshAnalytics} disabled={analyzing} size="lg">
            {analyzing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-5 w-5" />
            )}
            Refresh Analytics
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">
                ${metrics.totalRevenue.toFixed(2)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {metrics.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={metrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(metrics.revenueGrowth).toFixed(1)}% vs last week
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MousePointerClick className="h-4 w-4" />
                Total Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{metrics.totalClicks}</div>
              <div className="flex items-center gap-2 mt-2">
                {metrics.clickGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={metrics.clickGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(metrics.clickGrowth).toFixed(1)}% vs last week
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">
                {metrics.avgConversionRate.toFixed(2)}%
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {metrics.totalConversions} conversions
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auto-Detection Insights */}
        <Card className="border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-600" />
              AI Auto-Detection Insights
              <Badge variant="secondary" className="ml-2">Live</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {autoDetections.length === 0 ? (
              <p className="text-gray-600">Analyzing data... Insights will appear here.</p>
            ) : (
              <div className="space-y-4">
                {autoDetections.map((detection, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 bg-white rounded-lg border-l-4"
                    style={{
                      borderLeftColor: 
                        detection.type === 'opportunity' ? '#10b981' :
                        detection.type === 'warning' ? '#f59e0b' : '#3b82f6'
                    }}
                  >
                    <div>
                      {detection.type === 'opportunity' && <CheckCircle className="h-6 w-6 text-green-600" />}
                      {detection.type === 'warning' && <AlertTriangle className="h-6 w-6 text-yellow-600" />}
                      {detection.type === 'insight' && <Zap className="h-6 w-6 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{detection.title}</h3>
                        <Badge variant={detection.impact === 'high' ? 'destructive' : 'secondary'}>
                          {detection.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{detection.description}</p>
                      {detection.action && (
                        <p className="text-sm text-blue-600 mt-2 font-medium">
                          💡 Recommendation: {detection.action}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              Top Performing Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-gray-600">No product data available yet</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>{product.clicks} clicks</span>
                          <span>{product.conversions} conversions</span>
                          <span>{product.conversion_rate.toFixed(1)}% CR</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        ${product.revenue.toFixed(2)}
                      </div>
                      <Badge 
                        variant={
                          product.status === 'hot' ? 'default' :
                          product.status === 'warm' ? 'secondary' : 'outline'
                        }
                        className="mt-1"
                      >
                        {product.status === 'hot' && '🔥 Hot'}
                        {product.status === 'warm' && '⚡ Warm'}
                        {product.status === 'cold' && '❄️ Cold'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-purple-600" />
              Top Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topTraffic.length === 0 ? (
              <p className="text-gray-600">No traffic data available yet</p>
            ) : (
              <div className="space-y-3">
                {topTraffic.map((source, index) => (
                  <div key={source.source} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{source.source}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>{source.clicks} clicks</span>
                          <span>{source.conversions} conversions</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        ${source.revenue.toFixed(2)}
                      </div>
                      <Badge 
                        variant={
                          source.status === 'excellent' ? 'default' :
                          source.status === 'good' ? 'secondary' : 'outline'
                        }
                        className="mt-1"
                      >
                        {source.status === 'excellent' && '⭐ Excellent'}
                        {source.status === 'good' && '✓ Good'}
                        {source.status === 'poor' && '⚠️ Poor'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}