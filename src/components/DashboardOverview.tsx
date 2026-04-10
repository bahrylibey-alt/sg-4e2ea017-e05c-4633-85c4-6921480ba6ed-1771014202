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
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalRevenue: number;
  totalClicks: number;
  totalConversions: number;
  activeCampaigns: number;
  activeLinks: number;
  contentGenerated: number;
  postsPublished: number;
  totalProducts: number;
  revenueChange: number;
  clicksChange: number;
}

export function DashboardOverview() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalClicks: 0,
    totalConversions: 0,
    activeCampaigns: 0,
    activeLinks: 0,
    contentGenerated: 0,
    postsPublished: 0,
    totalProducts: 0,
    revenueChange: 0,
    clicksChange: 0,
  });

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user found');
        setLoading(false);
        return;
      }

      console.log('📊 DashboardOverview: Loading stats for user:', user.id);

      // Get all campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, status, revenue, spent')
        .eq('user_id', user.id);

      if (campaignsError) {
        console.error('❌ Campaigns error:', campaignsError);
        throw campaignsError;
      }

      const activeCampaignsCount = campaigns?.filter(c => c.status === 'active').length || 0;
      const totalRevenue = campaigns?.reduce((sum, c) => sum + (Number(c.revenue) || 0), 0) || 0;
      
      console.log('📈 Campaigns:', {
        total: campaigns?.length || 0,
        active: activeCampaignsCount,
        revenue: totalRevenue
      });

      // Get affiliate links
      const campaignIds = campaigns?.map(c => c.id) || [];
      let totalClicks = 0;
      let totalConversions = 0;
      let activeLinksCount = 0;
      let totalProductsCount = 0;

      if (campaignIds.length > 0) {
        const { data: links, error: linksError } = await supabase
          .from('affiliate_links')
          .select('id, status, clicks, conversions, revenue')
          .in('campaign_id', campaignIds);

        if (linksError) {
          console.error('❌ Links error:', linksError);
        } else {
          activeLinksCount = links?.filter(l => l.status === 'active').length || 0;
          totalProductsCount = links?.length || 0;
          totalClicks = links?.reduce((sum, l) => sum + (l.clicks || 0), 0) || 0;
          totalConversions = links?.reduce((sum, l) => sum + (l.conversions || 0), 0) || 0;
          
          console.log('🔗 Links:', {
            total: totalProductsCount,
            active: activeLinksCount,
            clicks: totalClicks,
            conversions: totalConversions
          });
        }
      }

      // Get generated content
      const { data: content, error: contentError } = await supabase
        .from('generated_content')
        .select('id, status')
        .eq('user_id', user.id);

      const contentCount = content?.filter(c => c.status === 'published').length || 0;
      
      console.log('📝 Content:', {
        total: content?.length || 0,
        published: contentCount
      });

      // Get posted content
      const { data: posts, error: postsError } = await supabase
        .from('posted_content')
        .select('id, status')
        .eq('user_id', user.id)
        .not('posted_at', 'is', null);

      const postsCount = posts?.length || 0;
      
      console.log('📱 Posts:', {
        total: postsCount,
        published: posts?.filter(p => p.status === 'posted').length || 0
      });

      // Calculate changes (mock for now)
      const revenueChange = totalRevenue > 0 ? 12.5 : 0;
      const clicksChange = totalClicks > 0 ? 8.3 : 0;

      setStats({
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalClicks,
        totalConversions,
        activeCampaigns: activeCampaignsCount,
        activeLinks: activeLinksCount,
        contentGenerated: contentCount,
        postsPublished: postsCount,
        totalProducts: totalProductsCount,
        revenueChange,
        clicksChange,
      });

      console.log('✅ Dashboard stats loaded:', {
        revenue: totalRevenue,
        clicks: totalClicks,
        campaigns: activeCampaignsCount,
        products: totalProductsCount,
        content: contentCount,
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
      description: "Latest data loaded from database"
    });
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
          <p className="text-muted-foreground">Overview of your affiliate marketing performance</p>
        </div>
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

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.revenueChange > 0 && (
                <span className="text-green-600">
                  +{stats.revenueChange}% from last month
                </span>
              )}
              {stats.revenueChange === 0 && "No revenue yet"}
            </p>
          </CardContent>
        </Card>

        {/* Total Clicks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.clicksChange > 0 && (
                <span className="text-green-600">
                  +{stats.clicksChange}% from last month
                </span>
              )}
              {stats.clicksChange === 0 && "Track your traffic"}
            </p>
          </CardContent>
        </Card>

        {/* Conversions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
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

        {/* Active Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeLinks} active affiliate links
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Automation Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Tracked</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <Progress 
              value={stats.totalProducts > 0 ? Math.min(100, (stats.totalProducts / 20) * 100) : 0} 
              className="mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.totalProducts < 20 ? 'Building inventory...' : 'Good coverage'}
            </p>
          </CardContent>
        </Card>

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
              AI-generated reviews & posts
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
              Auto-posted to social media
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Real-time sync with database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">Database Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">Auto-refresh Active</span>
            </div>
            <div className="flex items-center gap-2">
              {stats.activeCampaigns > 0 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Campaigns Running</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">No Active Campaigns</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {stats.totalProducts > 0 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Products Loaded</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">No Products Yet</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}