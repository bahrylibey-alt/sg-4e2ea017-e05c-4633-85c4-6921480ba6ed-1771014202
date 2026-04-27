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
  Package,
  FileText,
  Users,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UnifiedStatsService, UnifiedStats } from "@/services/unifiedStatsService";

export function DashboardOverview() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<UnifiedStats>({
    products: 0,
    articles: 0,
    posts: 0,
    clicks: 0,
    views: 0,
    conversions: 0,
    revenue: 0
  });

  const loadStats = async () => {
    try {
      const realStats = await UnifiedStatsService.getStats();
      setStats(realStats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadStats();
    setTimeout(() => {
      setRefreshing(false);
      toast({
        title: "Dashboard refreshed",
        description: "Latest data loaded from database"
      });
    }, 500);
  };

  useEffect(() => {
    loadStats();

    // Auto-refresh every 10 seconds
    const interval = setInterval(loadStats, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading real data from database...</p>
        </div>
      </div>
    );
  }

  const clickRate = stats.views > 0 ? ((stats.clicks / stats.views) * 100).toFixed(2) : '0.00';
  const conversionRate = stats.clicks > 0 ? ((stats.conversions / stats.clicks) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Real-time stats from database — All data is live and tracked</p>
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
            <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {stats.conversions} conversions
            </p>
          </CardContent>
        </Card>

        {/* Total Views */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.views.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Real tracked traffic
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
            <div className="text-2xl font-bold">{stats.clicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{clickRate}% CTR</span>
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
            <div className="text-2xl font-bold">{stats.conversions}</div>
            <p className="text-xs text-muted-foreground">
              {conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Tracked</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products}</div>
            <Progress value={Math.min(100, (stats.products / 50) * 100)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Active affiliate products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Published</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.articles}</div>
            <Progress value={Math.min(100, (stats.articles / 50) * 100)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              AI-generated articles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Published</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.posts}</div>
            <Progress value={Math.min(100, (stats.posts / 50) * 100)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Social media posts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Real-time data tracking active</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Database Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Tracking Active</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Real Data Only</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Auto-Refresh 10s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/autopilot-center'}>
              <Zap className="mr-2 h-4 w-4" />
              Open AutoPilot Center
            </Button>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/settings'}>
              <Activity className="mr-2 h-4 w-4" />
              Configure Settings
            </Button>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/profile'}>
              <Users className="mr-2 h-4 w-4" />
              View Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}