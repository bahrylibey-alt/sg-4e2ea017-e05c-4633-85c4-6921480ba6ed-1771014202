import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Zap, TrendingUp, DollarSign, Target, Activity, Settings, Play, Pause, RefreshCw, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AutopilotStatus {
  active: boolean;
  products: number;
  optimized: number;
  content: number;
  posts: number;
  clicks: number;
  revenue: number;
}

export function AutopilotDashboard() {
  const { toast } = useToast();
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastCycleResult, setLastCycleResult] = useState<any>(null);
  const [status, setStatus] = useState<AutopilotStatus>({
    active: false,
    products: 0,
    optimized: 0,
    content: 0,
    posts: 0,
    clicks: 0,
    revenue: 0
  });

  useEffect(() => {
    loadAutopilotStatus();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('📊 AutopilotDashboard: Loading stats for user:', user.id);

        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('user_id', user.id);

        if (!campaigns || campaigns.length === 0) {
          console.log('⚠️ AutopilotDashboard: No campaigns found');
          return;
        }

        const campaignIds = campaigns.map(c => c.id);
        console.log('📋 AutopilotDashboard: Found campaigns:', campaignIds.length);

        // Get products count
        const { data: products } = await supabase
          .from('affiliate_links')
          .select('id, clicks, conversions, revenue')
          .in('campaign_id', campaignIds);

        const productsCount = products?.length || 0;
        const totalClicks = products?.reduce((sum, l) => sum + (l.clicks || 0), 0) || 0;
        const totalRevenue = products?.reduce((sum, l) => sum + (l.revenue || 0), 0) || 0;
        console.log('🛍️ Products:', productsCount, 'Clicks:', totalClicks, 'Revenue:', totalRevenue);

        // Get content count
        const { data: content } = await supabase
          .from('generated_content')
          .select('id')
          .in('campaign_id', campaignIds);

        const contentCount = content?.length || 0;
        console.log('📝 Content:', contentCount);

        // Get posts count
        const { data: posts } = await (supabase as any)
          .from('posted_content')
          .select('id')
          .eq('user_id', user.id)
          .not('posted_at', 'is', null);

        const postsCount = posts?.length || 0;
        console.log('📮 Posts:', postsCount);

        // Get optimized count
        const { data: optimizedLinks } = await (supabase as any)
          .from('affiliate_links')
          .select('id')
          .in('campaign_id', campaignIds)
          .not('product_name', 'is', null)
          .not('original_url', 'is', null);

        const optimizedCount = optimizedLinks?.length || 0;

        setStatus(prev => ({
          ...prev,
          products: productsCount,
          optimized: optimizedCount,
          content: contentCount,
          posts: postsCount,
          clicks: totalClicks,
          revenue: Math.round(totalRevenue * 100) / 100
        }));

        console.log('✅ AutopilotDashboard: Stats updated:', {
          products: productsCount,
          content: contentCount,
          posts: postsCount,
          clicks: totalClicks,
          revenue: totalRevenue
        });
      } catch (error) {
        console.error('❌ AutopilotDashboard: Error loading stats:', error);
      }
    };

    // Load immediately
    loadStats();

    // Refresh every 5 seconds when autopilot is active
    if (autopilotEnabled) {
      const interval = setInterval(() => {
        console.log('🔄 AutopilotDashboard: Auto-refresh triggered');
        loadStats();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [autopilotEnabled]);

  const loadAutopilotStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if autopilot is enabled
      const { data: settings } = await supabase
        .from('user_settings')
        .select('autopilot_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      const isEnabled = settings?.autopilot_enabled || false;
      setAutopilotEnabled(isEnabled);
      setStatus(prev => ({ ...prev, active: isEnabled }));
    } catch (err) {
      console.error("Failed to load autopilot status:", err);
    }
  };

  const toggleAutopilot = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please sign in to use autopilot", variant: "destructive" });
        setLoading(false);
        return;
      }

      const newState = !autopilotEnabled;
      
      // Save to database
      const { error: dbError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          autopilot_enabled: newState,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (dbError) throw dbError;

      setAutopilotEnabled(newState);
      setStatus(prev => ({ ...prev, active: newState }));

      // Call edge function to start/stop
      try {
        const { data, error } = await supabase.functions.invoke('autopilot-engine', {
          body: { 
            action: newState ? 'start' : 'stop',
            user_id: user.id 
          }
        });

        if (error) throw error;
        
        console.log('✅ Autopilot edge function response:', data);
        
        if (newState && data?.results) {
          setLastCycleResult(data.results);
          toast({
            title: "🚀 Autopilot Launched!",
            description: `Discovered ${data.results.products_discovered} products, generated ${data.results.content_generated} content pieces`
          });
        } else {
          toast({
            title: newState ? "🚀 Autopilot Started" : "🛑 Autopilot Stopped",
            description: newState 
              ? "Automation engine is now running. Check back in a few minutes for results." 
              : "Automation paused."
          });
        }
      } catch (fnError: any) {
        console.error("Edge function error:", fnError);
        toast({ 
          title: "Autopilot status updated", 
          description: "Background processes will continue automatically"
        });
      }
      
      await loadAutopilotStatus();
    } catch (error: any) {
      toast({ title: `Error: ${error.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const runCycleNow = async () => {
    setRunning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please sign in", variant: "destructive" });
        return;
      }

      console.log('🚀 Running autopilot cycle NOW...');

      const { data, error } = await supabase.functions.invoke('autopilot-engine', {
        body: { 
          action: 'run_cycle',
          user_id: user.id 
        }
      });

      if (error) throw error;

      console.log('✅ Cycle completed:', data);
      setLastCycleResult(data?.results);

      toast({
        title: "✅ Cycle Complete!",
        description: `Discovered ${data?.results?.products_discovered || 0} products, generated ${data?.results?.content_generated || 0} content, published ${data?.results?.posts_published || 0} posts`,
        duration: 5000
      });

      // Refresh stats immediately after cycle
      await loadAutopilotStatus();
      
    } catch (error: any) {
      console.error('❌ Cycle error:', error);
      toast({ 
        title: "Cycle Error", 
        description: error.message || "Failed to run cycle",
        variant: "destructive" 
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Autopilot Control Panel */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                AI Autopilot Control
              </CardTitle>
              <CardDescription>Fully automated campaign management and optimization</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Autopilot</span>
                <Switch
                  checked={autopilotEnabled}
                  onCheckedChange={toggleAutopilot}
                  disabled={loading}
                />
              </div>
              {autopilotEnabled && (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={runCycleNow}
                    disabled={running}
                  >
                    <Rocket className={`h-4 w-4 mr-2 ${running ? "animate-bounce" : ""}`} />
                    {running ? "Running..." : "Run Now"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAutopilotStatus}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {autopilotEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                <span className="text-green-500 font-semibold">System Active</span>
                <span className="text-muted-foreground">• Real-time data from database</span>
              </div>

              {lastCycleResult && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
                  <div className="font-semibold mb-1">Last Cycle Results:</div>
                  <div className="text-muted-foreground space-y-1">
                    <div>✅ Products Discovered: {lastCycleResult.products_discovered || 0}</div>
                    <div>📝 Content Generated: {lastCycleResult.content_generated || 0}</div>
                    <div>📱 Posts Published: {lastCycleResult.posts_published || 0}</div>
                    {lastCycleResult.errors && lastCycleResult.errors.length > 0 && (
                      <div className="text-destructive">⚠️ Errors: {lastCycleResult.errors.join(', ')}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Products Found</div>
                  <div className="text-2xl font-bold">{status.products}</div>
                  <div className="text-xs text-muted-foreground">From affiliate_links table</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Optimized</div>
                  <div className="text-2xl font-bold">{status.optimized}</div>
                  <div className="text-xs text-muted-foreground">Complete product data</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Content Generated</div>
                  <div className="text-2xl font-bold">{status.content}</div>
                  <div className="text-xs text-muted-foreground">From generated_content</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Posts Published</div>
                  <div className="text-2xl font-bold">{status.posts}</div>
                  <div className="text-xs text-muted-foreground">From posted_content</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Total Clicks</div>
                  <div className="text-2xl font-bold">{status.clicks}</div>
                  <div className="text-xs text-muted-foreground">Real click tracking</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Revenue</div>
                  <div className="text-2xl font-bold">${status.revenue.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">From conversions</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                <Pause className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Autopilot is Off</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Enable autopilot to let AI handle traffic generation, optimization, and scaling automatically
                </p>
              </div>
              <Button onClick={toggleAutopilot} disabled={loading} size="lg" className="mt-4">
                <Play className="h-4 w-4 mr-2" />
                Activate Autopilot
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Performance */}
      {autopilotEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Discovery Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Products Found</span>
                  <span className="font-semibold">{status.products}</span>
                </div>
                <Progress value={Math.min(100, (status.products / 10) * 100)} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {status.products < 10 ? 'Discovering more...' : 'Target reached'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Total Revenue</span>
                  <span className="font-semibold">${status.revenue.toFixed(2)}</span>
                </div>
                <Progress value={Math.min(100, (status.revenue / 100) * 100)} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  From {status.clicks} total clicks
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                AI Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Optimization Rate</span>
                  <span className="font-semibold">
                    {status.products > 0 ? Math.round((status.optimized / status.products) * 100) : 0}%
                  </span>
                </div>
                <Progress 
                  value={status.products > 0 ? (status.optimized / status.products) * 100 : 0} 
                  className="h-2" 
                />
                <div className="text-xs text-muted-foreground">
                  {status.optimized} of {status.products} optimized
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}