import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Activity, TrendingUp, FileText, Share2, Play, Loader2, Zap, Target, AlertCircle } from "lucide-react";

export function AutopilotDashboard() {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [systemState, setSystemState] = useState<{
    state: string;
    total_views: number;
    total_clicks: number;
    total_verified_revenue: number;
  }>({
    state: 'NO_TRAFFIC',
    total_views: 0,
    total_clicks: 0,
    total_verified_revenue: 0
  });
  const [stats, setStats] = useState({
    products: 0,
    content: 0,
    posts: 0,
    lastSync: new Date().toISOString()
  });

  // Load autopilot status and stats on mount
  useEffect(() => {
    loadAutopilotStatus();
    loadStats();
    loadSystemState();
    const interval = setInterval(() => {
      loadStats();
      loadSystemState();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: state } = await supabase
        .from('system_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (state) {
        setSystemState({
          state: state.state || 'NO_TRAFFIC',
          total_views: state.total_views || 0,
          total_clicks: state.total_clicks || 0,
          total_verified_revenue: Number(state.total_verified_revenue) || 0
        });
      }
    } catch (error) {
      console.error('Error loading system state:', error);
    }
  };

  const loadAutopilotStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: settings } = await supabase
        .from('user_settings')
        .select('autopilot_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settings) {
        setIsEnabled(settings.autopilot_enabled || false);
      }
    } catch (error) {
      console.error('Error loading autopilot status:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [productsResult, contentResult, postsResult] = await Promise.all([
        supabase.from('affiliate_links').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('generated_content').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('posted_content').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      ]);

      setStats({
        products: productsResult.count || 0,
        content: contentResult.count || 0,
        posts: postsResult.count || 0,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    setIsEnabled(enabled);
    setIsRunning(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "Please log in first", variant: "destructive" });
        setIsEnabled(false);
        setIsRunning(false);
        return;
      }

      // Update user settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .update({ autopilot_enabled: enabled })
        .eq('user_id', user.id);

      if (settingsError) {
        console.error('Settings update error:', settingsError);
      }

      toast({
        title: enabled ? "🚀 Autopilot Started" : "⏸️ Autopilot Stopped",
        description: enabled ? "Running continuously every 30 seconds" : "System stopped",
      });

      if (enabled) {
        handleRunNow();
      }
    } catch (error: any) {
      console.error('Autopilot toggle error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to toggle autopilot",
        variant: "destructive"
      });
      setIsEnabled(!enabled);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunNow = async () => {
    setIsRunning(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "Please log in first", variant: "destructive" });
        return;
      }

      toast({
        title: "⚡ Running Intelligence Cycle",
        description: "Scoring posts, making decisions, creating content...",
      });

      const { data, error } = await supabase.functions.invoke('autopilot-engine', {
        body: { userId: user.id }
      });

      if (error) {
        console.error('Autopilot error:', error);
        throw error;
      }

      console.log('Autopilot cycle result:', data);

      const results = data?.results || {};
      toast({
        title: "✅ Intelligence Cycle Complete!",
        description: `${results.posts_scored || 0} posts scored, ${results.decisions_applied || 0} decisions made, ${results.products_discovered || 0} products, ${results.content_generated || 0} content, ${results.posts_published || 0} posts`,
      });

      await loadStats();
      await loadSystemState();
    } catch (error: any) {
      console.error('Run now error:', error);
      toast({
        title: "Autopilot Error",
        description: error.message || "Failed to run cycle",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'NO_TRAFFIC': return 'bg-yellow-500';
      case 'LOW_SIGNAL': return 'bg-orange-500';
      case 'TESTING': return 'bg-blue-500';
      case 'SCALING': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStateMessage = (state: string) => {
    switch (state) {
      case 'NO_TRAFFIC': return '⚠️ No traffic yet — optimizing reach';
      case 'LOW_SIGNAL': return '📊 Low signal — collecting data';
      case 'TESTING': return '🧪 Testing content performance';
      case 'SCALING': return '🚀 Scaling winners';
      default: return 'Initializing...';
    }
  };

  return (
    <div className="space-y-6">
      {/* System State Alert */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${getStateColor(systemState.state)} animate-pulse`} />
              <div>
                <p className="font-semibold text-lg">{getStateMessage(systemState.state)}</p>
                <p className="text-sm text-muted-foreground">
                  {systemState.total_views} views · {systemState.total_clicks} clicks · ${systemState.total_verified_revenue.toFixed(2)} verified revenue
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-base px-4 py-2">
              {systemState.state}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Activity className="h-6 w-6 text-primary animate-pulse" />
                AI Autopilot Intelligence
              </CardTitle>
              <CardDescription className="mt-2">
                Profit-seeking system: Track → Score → Decide → Scale
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border-2">
                <Switch
                  id="autopilot-toggle"
                  checked={isEnabled}
                  onCheckedChange={handleToggle}
                  disabled={isRunning}
                  className="data-[state=checked]:bg-green-500"
                />
                <Label htmlFor="autopilot-toggle" className="font-bold text-base cursor-pointer">
                  {isEnabled ? '🟢 RUNNING' : 'Enable Autopilot'}
                </Label>
              </div>
              {isEnabled && (
                <Badge variant="default" className="bg-green-500 animate-pulse px-4 py-2 text-sm">
                  ⚡ ACTIVE
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Products Discovered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary">{stats.products}</div>
                <p className="text-xs text-muted-foreground mt-1">Being scored & evaluated</p>
              </CardContent>
            </Card>

            <Card className="border-pink-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-pink-600" />
                  Content Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-pink-600">{stats.content}</div>
                <p className="text-xs text-muted-foreground mt-1">AI-powered with DNA tracking</p>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-blue-600" />
                  Posts Published
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600">{stats.posts}</div>
                <p className="text-xs text-muted-foreground mt-1">Priority queue based</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>Last synced: {new Date(stats.lastSync).toLocaleTimeString()}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadStats}
                disabled={isRunning}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleRunNow}
                disabled={isRunning}
                className="bg-primary hover:bg-primary/90"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Run Cycle Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEnabled && (
        <Card className="border-2 border-green-500/20 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Target className="h-6 w-6 text-green-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-base font-semibold text-green-900 dark:text-green-100">
                  Intelligence Layer Active
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  System is scoring posts, making decisions (scale/kill), prioritizing winners, and running continuously every 30 seconds. Navigate anywhere - it keeps running until you stop it.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}