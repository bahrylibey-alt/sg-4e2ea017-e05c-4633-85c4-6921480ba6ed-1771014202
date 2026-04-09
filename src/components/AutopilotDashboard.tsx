import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Zap, TrendingUp, DollarSign, Target, Activity, Settings, Play, Pause, RefreshCw } from "lucide-react";
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
    const interval = setInterval(loadAutopilotStatus, 5000); // Update every 5s
    return () => clearInterval(interval);
  }, []);

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

      // Load REAL stats from database
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user.id);

      if (!campaigns || campaigns.length === 0) {
        setStatus({
          active: isEnabled,
          products: 0,
          optimized: 0,
          content: 0,
          posts: 0,
          clicks: 0,
          revenue: 0
        });
        return;
      }

      const campaignIds = campaigns.map(c => c.id);

      // Get real product count from affiliate_links
      const { data: links } = await supabase
        .from('affiliate_links')
        .select('id, clicks, conversions, revenue')
        .in('campaign_id', campaignIds);

      const productsCount = links?.length || 0;
      const totalClicks = links?.reduce((sum, l) => sum + (l.clicks || 0), 0) || 0;
      const totalRevenue = links?.reduce((sum, l) => sum + (l.revenue || 0), 0) || 0;

      // Get real content count from generated_content
      const { data: content } = await supabase
        .from('generated_content')
        .select('id')
        .in('campaign_id', campaignIds);

      const contentCount = content?.length || 0;

      // Get real posts count from posted_content
      const { data: posts } = await (supabase as any)
        .from('posted_content')
        .select('id')
        .eq('user_id', user.id)
        .not('posted_at', 'is', null);

      const postsCount = posts?.length || 0;

      // Calculate optimization score (products with descriptions, images, etc.)
      const { data: optimizedLinks } = await (supabase as any)
        .from('affiliate_links')
        .select('id')
        .in('campaign_id', campaignIds)
        .not('product_name', 'is', null)
        .not('original_url', 'is', null);

      const optimizedCount = optimizedLinks?.length || 0;

      setStatus({
        active: isEnabled,
        products: productsCount,
        optimized: optimizedCount,
        content: contentCount,
        posts: postsCount,
        clicks: totalClicks,
        revenue: Math.round(totalRevenue * 100) / 100
      });

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
      localStorage.setItem('autopilot_active', newState ? 'true' : 'false');

      // Call edge function
      try {
        await supabase.functions.invoke('autopilot-engine', {
          body: { 
            action: newState ? 'start' : 'stop',
            user_id: user.id 
          }
        });
      } catch (fnError) {
        console.error("Edge function error (non-fatal):", fnError);
      }
      
      toast({
        title: newState ? "🚀 Autopilot Launched!" : "🛑 Autopilot Stopped",
        description: newState 
          ? "Engine running globally in the background." 
          : "Engine paused."
      });
      
      await loadAutopilotStatus();
    } catch (error: any) {
      toast({ title: `Error: ${error.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAutopilotStatus}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
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