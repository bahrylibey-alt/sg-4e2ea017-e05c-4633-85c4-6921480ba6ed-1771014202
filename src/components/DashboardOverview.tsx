import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  DollarSign, 
  MousePointerClick, 
  Eye,
  Target,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Brain,
  Zap,
  Package
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { unifiedTrackingService } from "@/services/unifiedTrackingService";

interface DashboardStats {
  totalRevenue: number;
  totalClicks: number;
  totalConversions: number;
  totalViews: number;
  activeCampaigns: number;
  activeLinks: number;
  contentGenerated: number;
  postsPublished: number;
  totalProducts: number;
  systemState: string;
}

export function DashboardOverview() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalViews: 0,
    activeCampaigns: 0,
    activeLinks: 0,
    contentGenerated: 0,
    postsPublished: 0,
    totalProducts: 0,
    systemState: 'NO_TRAFFIC'
  });

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user found');
        setLoading(false);
        return;
      }
      
      setCurrentUserId(user.id);

      console.log('📊 DashboardOverview: Loading stats for user:', user.id);

      // Get system state (REAL DATA - auto-synced via triggers)
      const { data: systemState } = await supabase
        .from('system_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const realViews = systemState?.total_views || 0;
      const realClicks = systemState?.total_clicks || 0;
      const realRevenue = Number(systemState?.total_verified_revenue) || 0;
      const realConversions = systemState?.total_verified_conversions || 0;
      const currentState = systemState?.state || 'NO_TRAFFIC';

      console.log('✅ System state loaded:', {
        views: realViews,
        clicks: realClicks,
        revenue: realRevenue,
        conversions: realConversions,
        state: currentState
      });

      // Get campaigns count
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('user_id', user.id);

      const activeCampaignsCount = campaigns?.filter(c => c.status === 'active').length || 0;

      // Get product count from BOTH tables (show total unique products)
      const { data: affiliateLinks } = await supabase
        .from('affiliate_links')
        .select('id, status')
        .eq('user_id', user.id);

      const { data: catalogProducts } = await supabase
        .from('product_catalog')
        .select('id, status')
        .eq('user_id', user.id);

      const totalProductsCount = Math.max(
        affiliateLinks?.length || 0,
        catalogProducts?.length || 0
      );

      const activeLinksCount = affiliateLinks?.filter(l => l.status === 'active').length || 0;

      console.log('🔗 Products:', {
        affiliate_links: affiliateLinks?.length || 0,
        product_catalog: catalogProducts?.length || 0,
        total_shown: totalProductsCount,
        active: activeLinksCount
      });

      // Get generated content
      const { data: content } = await supabase
        .from('generated_content')
        .select('id, status')
        .eq('user_id', user.id);

      const contentCount = content?.filter(c => c.status === 'published').length || 0;

      // Get posted content
      const { data: posts } = await supabase
        .from('posted_content')
        .select('id, status, posted_at')
        .eq('user_id', user.id)
        .not('posted_at', 'is', null);

      const postsCount = posts?.length || 0;

      console.log('📝 Content:', {
        generated: contentCount,
        posted: postsCount
      });

      setStats({
        totalRevenue: Math.round(realRevenue * 100) / 100,
        totalClicks: realClicks,
        totalConversions: realConversions,
        totalViews: realViews,
        activeCampaigns: activeCampaignsCount,
        activeLinks: activeLinksCount,
        contentGenerated: contentCount,
        postsPublished: postsCount,
        totalProducts: totalProductsCount,
        systemState: currentState
      });

      console.log('✅ Dashboard stats loaded:', {
        products: totalProductsCount,
        revenue: realRevenue,
        clicks: realClicks,
        views: realViews,
        conversions: realConversions,
        posts: postsCount
      });

    } catch (error: any) {
      console.error('❌ Dashboard stats error:', error);
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadStats();
    toast({
      title: "Dashboard refreshed",
      description: "Latest verified data loaded"
    });
  };

  const manualSync = async () => {
    setSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          variant: "destructive"
        });
        return;
      }

      const success = await unifiedTrackingService.manualSync(user.id);
      
      if (success) {
        await loadStats();
        toast({
          title: "✅ Sync Complete",
          description: "All stats updated from posted content"
        });
      } else {
        toast({
          title: "Sync failed",
          description: "Please try again",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Sync error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadStats();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh dashboard stats');
      loadStats();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Real verified performance data - auto-synced</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={manualSync}
            disabled={syncing}
          >
            <Zap className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Force Sync'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs for Overview vs AI Insights */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="w-4 h-4 mr-2" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Truth Mode Banner */}
          {stats.systemState === 'NO_TRAFFIC' && (
            <Card className="border-2 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                      No Traffic Detected
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      System is focusing on reach optimization. Revenue will show $0 until verified conversions arrive.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Revenue - VERIFIED ONLY */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalRevenue === 0 ? (
                    <span className="text-yellow-600">Awaiting verified conversions</span>
                  ) : (
                    <span className="text-green-600">From webhook/API only</span>
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Total Views - REAL ONLY */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Real Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalViews < 100 ? (
                    <span className="text-yellow-600">Need 100+ for decisions</span>
                  ) : (
                    <span className="text-green-600">Sufficient data</span>
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Total Clicks - REAL ONLY */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Real Clicks</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalClicks < 10 ? (
                    <span className="text-yellow-600">Need 10+ for decisions</span>
                  ) : (
                    <span className="text-green-600">
                      {((stats.totalClicks / Math.max(stats.totalViews, 1)) * 100).toFixed(2)}% CTR
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Conversions - VERIFIED ONLY */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Conversions</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalConversions}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalClicks > 0 
                    ? `${((stats.totalConversions / stats.totalClicks) * 100).toFixed(2)}% conversion rate`
                    : "No conversions yet"
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Automation Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Generated</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.contentGenerated}</div>
                <Progress 
                  value={stats.contentGenerated > 0 ? Math.min(100, (stats.contentGenerated / 15) * 100) : 0} 
                  className="mt-2" 
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Quality-scored content
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Posts Published</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.postsPublished}</div>
                <Progress 
                  value={stats.postsPublished > 0 ? Math.min(100, (stats.postsPublished / 10) * 100) : 0} 
                  className="mt-2" 
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Max 20/day limit
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Products Tracked */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products Tracked</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalProducts === 0 ? 'No products yet' : `${stats.activeLinks} active links`}
              </p>
            </CardContent>
          </Card>

          {/* Quick Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status - Truth Mode</CardTitle>
              <CardDescription>Only verified real data displayed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Real Data Enforcement</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Safety Controls Active</span>
                </div>
                <div className="flex items-center gap-2">
                  {stats.systemState === 'SCALING' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">System Scaling</span>
                    </>
                  ) : stats.systemState === 'TESTING' ? (
                    <>
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">System Testing</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{stats.systemState.replace('_', ' ')}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{stats.systemState}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <AIInsightsPanel userId={currentUserId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}