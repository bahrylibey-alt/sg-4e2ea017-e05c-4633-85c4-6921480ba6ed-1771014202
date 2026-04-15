import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Eye, 
  MousePointerClick, 
  TrendingUp, 
  Activity, 
  Loader2, 
  RefreshCw,
  DollarSign,
  Globe,
  Smartphone,
  Monitor,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";

interface ViewEvent {
  id: string;
  content_id: string;
  platform: string;
  views: number;
  tracked_at: string;
  created_at: string;
}

interface ClickEvent {
  id: string;
  link_id: string;
  content_id: string;
  platform: string;
  country: string;
  device_type: string;
  converted: boolean;
  clicked_at: string;
  is_bot: boolean;
  fraud_score: number;
  referrer: string;
}

interface ConversionEvent {
  id: string;
  click_id: string;
  content_id: string;
  revenue: number;
  source: string;
  verified: boolean;
  created_at: string;
}

interface TrackingStats {
  totalViews: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  conversionRate: number;
  avgRevenuePerClick: number;
}

export default function TrackingDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [viewEvents, setViewEvents] = useState<ViewEvent[]>([]);
  const [clickEvents, setClickEvents] = useState<ClickEvent[]>([]);
  const [conversionEvents, setConversionEvents] = useState<ConversionEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const fetchTrackingData = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to view tracking data');
        return;
      }

      // Calculate time range
      const now = new Date();
      const timeRanges = {
        '1h': 1,
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30
      };
      const hoursAgo = timeRanges[timeRange];
      const startTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();

      // Fetch view events
      const { data: views, error: viewsError } = await supabase
        .from('view_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('tracked_at', startTime)
        .order('tracked_at', { ascending: false })
        .limit(50);

      if (viewsError) throw viewsError;

      // Fetch click events
      const { data: clicks, error: clicksError } = await supabase
        .from('click_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('clicked_at', startTime)
        .order('clicked_at', { ascending: false })
        .limit(50);

      if (clicksError) throw clicksError;

      // Fetch conversion events
      const { data: conversions, error: conversionsError } = await supabase
        .from('conversion_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startTime)
        .order('created_at', { ascending: false })
        .limit(50);

      if (conversionsError) throw conversionsError;

      // Calculate statistics
      const totalViews = views?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
      const totalClicks = clicks?.length || 0;
      const totalConversions = conversions?.length || 0;
      const totalRevenue = conversions?.reduce((sum, c) => sum + (Number(c.revenue) || 0), 0) || 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      const avgRevenuePerClick = totalClicks > 0 ? totalRevenue / totalClicks : 0;

      setViewEvents(views || []);
      setClickEvents(clicks || []);
      setConversionEvents(conversions || []);
      setStats({
        totalViews,
        totalClicks,
        totalConversions,
        totalRevenue,
        conversionRate,
        avgRevenuePerClick
      });

    } catch (err: any) {
      console.error('Error fetching tracking data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTrackingData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            Tracking Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time tracking events from your affiliate campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button
            onClick={fetchTrackingData}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats?.totalViews.toLocaleString() || 0}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{stats?.totalClicks.toLocaleString() || 0}</p>
              </div>
              <MousePointerClick className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{stats?.totalConversions.toLocaleString() || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${stats?.totalRevenue.toFixed(2) || '0.00'}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conv. Rate</p>
                <p className="text-2xl font-bold">{stats?.conversionRate.toFixed(1) || '0.0'}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-teal-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg $/Click</p>
                <p className="text-2xl font-bold">${stats?.avgRevenuePerClick.toFixed(2) || '0.00'}</p>
              </div>
              <Activity className="w-8 h-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tracking Events Tabs */}
      <Tabs defaultValue="views" className="space-y-4">
        <TabsList>
          <TabsTrigger value="views">
            <Eye className="w-4 h-4 mr-2" />
            Views ({viewEvents.length})
          </TabsTrigger>
          <TabsTrigger value="clicks">
            <MousePointerClick className="w-4 h-4 mr-2" />
            Clicks ({clickEvents.length})
          </TabsTrigger>
          <TabsTrigger value="conversions">
            <TrendingUp className="w-4 h-4 mr-2" />
            Conversions ({conversionEvents.length})
          </TabsTrigger>
        </TabsList>

        {/* View Events Tab */}
        <TabsContent value="views" className="space-y-4">
          {viewEvents.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No view events in the selected time range
              </CardContent>
            </Card>
          ) : (
            viewEvents.map((view) => (
              <Card key={view.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Eye className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-semibold">
                          {view.views} {view.views === 1 ? 'view' : 'views'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Content ID: {view.content_id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{view.platform}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(view.tracked_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Click Events Tab */}
        <TabsContent value="clicks" className="space-y-4">
          {clickEvents.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No click events in the selected time range
              </CardContent>
            </Card>
          ) : (
            clickEvents.map((click) => (
              <Card key={click.id} className={click.converted ? "border-green-500/50" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <MousePointerClick className={`w-5 h-5 ${click.converted ? 'text-green-500' : 'text-gray-500'}`} />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">
                            Link ID: {click.link_id.substring(0, 8)}...
                          </p>
                          {click.converted && <Badge className="bg-green-500">Converted</Badge>}
                          {click.is_bot && <Badge variant="destructive">Bot</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          <span>{click.country || 'Unknown'}</span>
                          {click.device_type === 'mobile' ? (
                            <Smartphone className="w-3 h-3 ml-2" />
                          ) : (
                            <Monitor className="w-3 h-3 ml-2" />
                          )}
                          <span>{click.device_type || 'Unknown'}</span>
                        </div>
                        {click.referrer && (
                          <p className="text-xs text-muted-foreground mt-1">
                            From: {click.referrer}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{click.platform}</Badge>
                      {click.fraud_score > 0 && (
                        <Badge variant="outline" className="ml-2">
                          Fraud: {(click.fraud_score * 100).toFixed(0)}%
                        </Badge>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(click.clicked_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Conversion Events Tab */}
        <TabsContent value="conversions" className="space-y-4">
          {conversionEvents.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No conversion events in the selected time range
              </CardContent>
            </Card>
          ) : (
            conversionEvents.map((conversion) => (
              <Card key={conversion.id} className="border-green-500/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-green-600">
                            ${Number(conversion.revenue).toFixed(2)} Revenue
                          </p>
                          {conversion.verified ? (
                            <Badge className="bg-green-500">Verified</Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Click ID: {conversion.click_id?.substring(0, 12) || 'N/A'}...</span>
                          <span>•</span>
                          <span>Source: {conversion.source}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Content ID: {conversion.content_id?.substring(0, 8) || 'N/A'}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(conversion.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">About This Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Real-Time Tracking:</strong> This dashboard shows actual tracking events from your database. Data refreshes automatically every 30 seconds.
          </p>
          <p>
            <strong>View Events:</strong> Tracked when your content is viewed on social media platforms
          </p>
          <p>
            <strong>Click Events:</strong> Tracked when users click your affiliate links
          </p>
          <p>
            <strong>Conversion Events:</strong> Tracked when clicks result in actual sales/commissions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}