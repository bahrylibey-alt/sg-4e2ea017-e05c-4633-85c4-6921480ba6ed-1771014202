import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  TrendingUp, 
  Zap, 
  Activity, 
  DollarSign, 
  BarChart3, 
  Play, 
  Pause,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Radio
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trendingProductDiscovery } from "@/services/trendingProductDiscovery";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [activatingAutopilot, setActivatingAutopilot] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeLinks: 0,
    activeTraffic: 0,
    totalClicks: 0,
    totalRevenue: 0,
    contentGenerated: 0,
    autopilotEnabled: false,
    lastAutopilotRun: null as string | null,
    recentProducts: 0
  });
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Get user
      let currentUserId = null;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
        if (profiles && profiles.length > 0) {
          currentUserId = profiles[0].id;
        }
      } else {
        currentUserId = user.id;
      }
      
      setUserId(currentUserId);

      if (!currentUserId) {
        setLoading(false);
        return;
      }

      // Get all stats
      const [products, links, campaigns, clicks, conversions, content, settings] = await Promise.all([
        supabase.from('product_catalog').select('id, created_at', { count: 'exact' }).eq('user_id', currentUserId),
        supabase.from('affiliate_links').select('id', { count: 'exact' }).eq('user_id', currentUserId).eq('status', 'active'),
        supabase.from('campaigns').select('id').eq('user_id', currentUserId),
        supabase.from('click_events').select('id', { count: 'exact' }).eq('user_id', currentUserId),
        supabase.from('conversion_events').select('revenue').eq('user_id', currentUserId),
        supabase.from('generated_content').select('id', { count: 'exact' }).eq('user_id', currentUserId),
        supabase.from('user_settings').select('autopilot_enabled, last_autopilot_run').eq('user_id', currentUserId).maybeSingle()
      ]);

      const campaignIds = campaigns.data?.map(c => c.id) || [];
      let activeTrafficCount = 0;
      
      if (campaignIds.length > 0) {
        const { count } = await supabase
          .from('traffic_sources')
          .select('*', { count: 'exact', head: true })
          .in('campaign_id', campaignIds)
          .eq('status', 'active');
        activeTrafficCount = count || 0;
      }

      const recentProducts = products.data?.filter(p => {
        const created = new Date(p.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return created > weekAgo;
      }).length || 0;

      const totalRevenue = conversions.data?.reduce((sum, c) => sum + (Number(c.revenue) || 0), 0) || 0;

      setStats({
        totalProducts: products.count || 0,
        activeLinks: links.count || 0,
        activeTraffic: activeTrafficCount,
        totalClicks: clicks.count || 0,
        totalRevenue,
        contentGenerated: content.count || 0,
        autopilotEnabled: settings.data?.autopilot_enabled || false,
        lastAutopilotRun: settings.data?.last_autopilot_run || null,
        recentProducts
      });

    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const discoverProducts = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive"
      });
      return;
    }

    setDiscovering(true);
    try {
      const result = await trendingProductDiscovery.discoverAllTrendingProducts(userId);
      
      toast({
        title: "Products Discovered!",
        description: `Found ${result.total_found} trending products, saved top ${result.top_products.length}`,
      });

      await loadDashboard();
    } catch (error: any) {
      toast({
        title: "Discovery Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDiscovering(false);
    }
  };

  const toggleAutopilot = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive"
      });
      return;
    }

    setActivatingAutopilot(true);
    try {
      const newStatus = !stats.autopilotEnabled;
      
      // Update settings
      await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          autopilot_enabled: newStatus,
          last_autopilot_run: newStatus ? new Date().toISOString() : stats.lastAutopilotRun
        });

      if (newStatus) {
        // Trigger autopilot run
        await fetch('/api/cron/autopilot', { method: 'POST' });
      }

      toast({
        title: newStatus ? "Autopilot Activated!" : "Autopilot Paused",
        description: newStatus ? "System is now running autonomously" : "Autopilot has been paused",
      });

      await loadDashboard();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setActivatingAutopilot(false);
    }
  };

  const runFullSystem = async () => {
    if (!userId) return;

    toast({
      title: "Starting Full System...",
      description: "This will take a few moments",
    });

    try {
      // Run discovery
      await discoverProducts();
      
      // Activate autopilot
      if (!stats.autopilotEnabled) {
        await toggleAutopilot();
      }

      // Trigger cron jobs
      await Promise.all([
        fetch('/api/cron/discover-products', { method: 'POST' }),
        fetch('/api/cron/autopilot', { method: 'POST' })
      ]);

      toast({
        title: "System Activated!",
        description: "All components are now running",
      });

      await loadDashboard();
    } catch (error: any) {
      toast({
        title: "Activation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  const autopilotStatus = stats.autopilotEnabled ? "RUNNING" : "PAUSED";
  const autopilotColor = stats.autopilotEnabled ? "text-green-600" : "text-gray-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold text-gray-900">Autonomous Affiliate Dashboard</h1>
          <p className="text-xl text-gray-600">All key controls in one place - Traffic, Autopilot, Products</p>
        </div>

        {/* System Status */}
        <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-3">
                <Radio className={`h-8 w-8 ${autopilotColor} ${stats.autopilotEnabled ? 'animate-pulse' : ''}`} />
                Autopilot Status: <span className={autopilotColor}>{autopilotStatus}</span>
              </CardTitle>
              <div className="flex gap-3">
                <Button 
                  onClick={toggleAutopilot} 
                  disabled={activatingAutopilot}
                  variant={stats.autopilotEnabled ? "destructive" : "default"}
                  size="lg"
                >
                  {activatingAutopilot ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : stats.autopilotEnabled ? (
                    <Pause className="mr-2 h-5 w-5" />
                  ) : (
                    <Play className="mr-2 h-5 w-5" />
                  )}
                  {stats.autopilotEnabled ? 'Pause' : 'Start'} Autopilot
                </Button>
                <Button 
                  onClick={runFullSystem}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  Run Full System
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {stats.lastAutopilotRun ? (
                <>Last run: {new Date(stats.lastAutopilotRun).toLocaleString()}</>
              ) : (
                <>Never run - Click "Start Autopilot" to begin</>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{stats.totalProducts}</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.recentProducts} new this week
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Active Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{stats.activeLinks}</div>
              <div className="text-xs text-gray-500 mt-1">Tracking clicks</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Traffic Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">{stats.activeTraffic}</div>
              <div className="text-xs text-gray-500 mt-1">Active channels</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-600">
                ${stats.totalRevenue.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.totalClicks} total clicks
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Discovery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
                Trending Product Discovery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Automatically find hot-selling products from Amazon, AliExpress, and viral social media trends
              </p>
              <Button 
                onClick={discoverProducts} 
                disabled={discovering}
                className="w-full"
                size="lg"
              >
                {discovering ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Discovering Products...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Discover Trending Products
                  </>
                )}
              </Button>
              {stats.recentProducts > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {stats.recentProducts} products discovered this week
                </div>
              )}
            </CardContent>
          </Card>

          {/* Traffic Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-blue-600" />
                Traffic Channel Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Manage 12 advanced traffic sources - Pinterest, Reddit, Medium, TikTok, and more
              </p>
              <Button 
                onClick={() => window.location.href = '/traffic-channels'}
                className="w-full"
                size="lg"
                variant="outline"
              >
                <Activity className="mr-2 h-5 w-5" />
                Manage Traffic Sources
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {stats.activeTraffic > 0 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">{stats.activeTraffic} active sources</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-600">No active traffic sources</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-gray-600">Products</span>
                <Badge variant={stats.totalProducts > 0 ? "default" : "secondary"}>
                  {stats.totalProducts > 0 ? "✅ Active" : "⚠️ Setup Needed"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-gray-600">Traffic</span>
                <Badge variant={stats.activeTraffic > 0 ? "default" : "secondary"}>
                  {stats.activeTraffic > 0 ? "✅ Active" : "⚠️ Setup Needed"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-gray-600">Autopilot</span>
                <Badge variant={stats.autopilotEnabled ? "default" : "secondary"}>
                  {stats.autopilotEnabled ? "✅ Running" : "⏸️ Paused"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-3">
              <Button variant="outline" onClick={() => window.location.href = '/traffic-channels'}>
                Traffic Channels
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/autopilot-center'}>
                Autopilot Center
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/analytics'}>
                Analytics
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/settings'}>
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}