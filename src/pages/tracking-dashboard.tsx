import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  AlertCircle,
  BarChart3,
  TrendingDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";

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
  converted_at: string;
}

interface TrackingStats {
  totalViews: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  conversionRate: number;
  avgRevenuePerClick: number;
  avgRevenuePerConversion: number;
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
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchTrackingData = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to view tracking data');
        setLoading(false);
        setRefreshing(false);
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
        .limit(100);

      if (viewsError) {
        console.error('View events error:', viewsError);
      }

      // Fetch click events
      const { data: clicks, error: clicksError } = await supabase
        .from('click_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('clicked_at', startTime)
        .order('clicked_at', { ascending: false })
        .limit(100);

      if (clicksError) {
        console.error('Click events error:', clicksError);
      }

      // Fetch conversion events
      const { data: conversions, error: conversionsError } = await supabase
        .from('conversion_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startTime)
        .order('created_at', { ascending: false })
        .limit(100);

      if (conversionsError) {
        console.error('Conversion events error:', conversionsError);
      }

      // Calculate statistics
      const totalViews = views?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
      const totalClicks = clicks?.length || 0;
      const totalConversions = conversions?.length || 0;
      const totalRevenue = conversions?.reduce((sum, c) => sum + (Number(c.revenue) || 0), 0) || 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      const avgRevenuePerClick = totalClicks > 0 ? totalRevenue / totalClicks : 0;
      const avgRevenuePerConversion = totalConversions > 0 ? totalRevenue / totalConversions : 0;

      setViewEvents(views || []);
      setClickEvents(clicks || []);
      setConversionEvents(conversions || []);
      setStats({
        totalViews,
        totalClicks,
        totalConversions,
        totalRevenue,
        conversionRate,
        avgRevenuePerClick,
        avgRevenuePerConversion
      });

      setLastUpdate(new Date().toLocaleTimeString());

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <SEO title="Tracking Dashboard - Real-Time Analytics" />
        <Header />
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEO title="Tracking Dashboard - Real-Time Analytics" />
      <Header />
      
      <main className="container mx-auto py-24 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              <Activity className="w-8 h-8 text-primary" />
              Real-Time Tracking Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Live tracking events from your affiliate campaigns • Last updated: {lastUpdate}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-2 border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Views</p>
                  <p className="text-3xl font-bold text-blue-600">{stats?.totalViews.toLocaleString() || 0}</p>
                </div>
                <Eye className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Clicks</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.totalClicks.toLocaleString() || 0}</p>
                </div>
                <MousePointerClick className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-500/20 bg-orange-50/50 dark:bg-orange-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Conversions</p>
                  <p className="text-3xl font-bold text-orange-600">{stats?.totalConversions.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.conversionRate.toFixed(2)}% rate
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Revenue</p>
                  <p className="text-3xl font-bold text-purple-600">${stats?.totalRevenue.toFixed(2) || '0.00'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${stats?.avgRevenuePerClick.toFixed(2) || '0.00'}/click
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">{stats?.conversionRate.toFixed(2)}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-teal-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Revenue/Conversion</p>
                  <p className="text-2xl font-bold">${stats?.avgRevenuePerConversion.toFixed(2) || '0.00'}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Events</p>
                  <p className="text-2xl font-bold">{viewEvents.length + clickEvents.length + conversionEvents.length}</p>
                </div>
                <Activity className="w-8 h-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tracking Events Tabs */}
        <Tabs defaultValue="clicks" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="clicks">
              <MousePointerClick className="w-4 h-4 mr-2" />
              Clicks ({clickEvents.length})
            </TabsTrigger>
            <TabsTrigger value="conversions">
              <TrendingUp className="w-4 h-4 mr-2" />
              Conversions ({conversionEvents.length})
            </TabsTrigger>
            <TabsTrigger value="views">
              <Eye className="w-4 h-4 mr-2" />
              Views ({viewEvents.length})
            </TabsTrigger>
          </TabsList>

          {/* Click Events Tab */}
          <TabsContent value="clicks" className="space-y-3">
            {clickEvents.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground py-12">
                  <MousePointerClick className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">No click events yet</p>
                  <p className="text-sm">Clicks will appear here as visitors interact with your affiliate links</p>
                </CardContent>
              </Card>
            ) : (
              clickEvents.map((click) => (
                <Card key={click.id} className={click.converted ? "border-2 border-green-500/50 bg-green-50/30 dark:bg-green-950/10" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-lg ${click.converted ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'} flex items-center justify-center flex-shrink-0`}>
                          <MousePointerClick className={`w-5 h-5 ${click.converted ? 'text-green-600' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <p className="font-semibold text-sm">
                              Link: {click.link_id.substring(0, 12)}...
                            </p>
                            {click.converted && <Badge className="bg-green-500 text-white">✓ Converted</Badge>}
                            {click.is_bot && <Badge variant="destructive">🤖 Bot</Badge>}
                            <Badge variant="outline">{click.platform || 'Direct'}</Badge>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {click.country || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              {click.device_type === 'mobile' ? (
                                <Smartphone className="w-3 h-3" />
                              ) : (
                                <Monitor className="w-3 h-3" />
                              )}
                              {click.device_type || 'Unknown'}
                            </span>
                            {click.fraud_score > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Fraud: {(click.fraud_score * 100).toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                          
                          {click.referrer && (
                            <p className="text-xs text-muted-foreground mt-2 truncate">
                              Referrer: {click.referrer}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(click.clicked_at)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(click.clicked_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Conversion Events Tab */}
          <TabsContent value="conversions" className="space-y-3">
            {conversionEvents.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground py-12">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">No conversions yet</p>
                  <p className="text-sm">Conversions will appear here when clicks result in sales</p>
                </CardContent>
              </Card>
            ) : (
              conversionEvents.map((conversion) => (
                <Card key={conversion.id} className="border-2 border-green-500/50 bg-green-50/30 dark:bg-green-950/10">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <p className="font-bold text-lg text-green-600">
                              ${Number(conversion.revenue).toFixed(2)}
                            </p>
                            {conversion.verified ? (
                              <Badge className="bg-green-500 text-white">✓ Verified</Badge>
                            ) : (
                              <Badge variant="outline">⏳ Pending</Badge>
                            )}
                            <Badge variant="secondary">{conversion.source}</Badge>
                          </div>
                          
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Click ID: {conversion.click_id?.substring(0, 16) || 'N/A'}...</p>
                            {conversion.content_id && (
                              <p>Content: {conversion.content_id.substring(0, 16)}...</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(conversion.converted_at || conversion.created_at)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(conversion.converted_at || conversion.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* View Events Tab */}
          <TabsContent value="views" className="space-y-3">
            {viewEvents.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground py-12">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">No view events yet</p>
                  <p className="text-sm">Views will be tracked when your content is displayed on platforms</p>
                </CardContent>
              </Card>
            ) : (
              viewEvents.map((view) => (
                <Card key={view.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                          <Eye className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">
                              {view.views.toLocaleString()} {view.views === 1 ? 'view' : 'views'}
                            </p>
                            <Badge variant="secondary">{view.platform || 'Unknown'}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Content: {view.content_id.substring(0, 16)}...
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(view.tracked_at)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(view.tracked_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="mt-6 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              About Real-Time Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p><strong>Live Data:</strong> All metrics are fetched from your actual database and refresh automatically every 30 seconds</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p><strong>View Events:</strong> Tracked when your posted content gets impressions on social platforms</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p><strong>Click Events:</strong> Tracked with device type, location, and fraud detection when users click affiliate links</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p><strong>Conversions:</strong> Tracked when clicks result in actual sales with verified revenue attribution</p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}