import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Activity, TrendingUp, FileText, Share2, Play, Loader2 } from "lucide-react";

export function AutopilotDashboard() {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState({
    products: 0,
    content: 0,
    posts: 0,
    lastSync: new Date().toISOString()
  });

  // Load stats on mount and set up auto-refresh
  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get real counts from database
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
        return;
      }

      const { data, error } = await supabase.functions.invoke('autopilot-engine', {
        body: { 
          action: enabled ? 'start' : 'stop',
          user_id: user.id
        }
      });

      if (error) throw error;

      toast({
        title: enabled ? "Autopilot Started" : "Autopilot Stopped",
        description: data?.message || (enabled ? "Running in the background" : "System stopped"),
      });

      if (enabled) {
        await loadStats();
      }
    } catch (error: any) {
      console.error('Autopilot error:', error);
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
        title: "Running Autopilot Cycle",
        description: "Creating products, content, and posts...",
      });

      const { data, error } = await supabase.functions.invoke('autopilot-engine', {
        body: { 
          action: 'run_cycle',
          user_id: user.id
        }
      });

      if (error) throw error;

      console.log('Autopilot cycle result:', data);

      toast({
        title: "✅ Cycle Complete!",
        description: `${data?.results?.products_discovered || 0} products, ${data?.results?.content_generated || 0} content, ${data?.results?.posts_published || 0} posts created`,
      });

      // Refresh stats immediately
      await loadStats();
    } catch (error: any) {
      console.error('Run now error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to run cycle",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-violet-600" />
                AI Autopilot Engine
              </CardTitle>
              <CardDescription>
                Live statistics from your database - updates every 5 seconds
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="autopilot-toggle"
                  checked={isEnabled}
                  onCheckedChange={handleToggle}
                  disabled={isRunning}
                />
                <Label htmlFor="autopilot-toggle" className="font-semibold">
                  {isEnabled ? 'RUNNING GLOBALLY' : 'Enable Autopilot'}
                </Label>
              </div>
              {isEnabled && (
                <Badge variant="default" className="bg-green-500 animate-pulse">
                  ⚡ Active
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                  Products Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-violet-600">{stats.products}</div>
                <p className="text-xs text-muted-foreground">Total products discovered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-pink-600" />
                  Content Gen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-pink-600">{stats.content}</div>
                <p className="text-xs text-muted-foreground">AI-generated content pieces</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-blue-600" />
                  Posts Published
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.posts}</div>
                <p className="text-xs text-muted-foreground">Social media posts created</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
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
                className="bg-violet-600 hover:bg-violet-700"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEnabled && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-violet-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-violet-900">
                Autopilot is Running
              </p>
              <p className="text-sm text-violet-700">
                The system will automatically discover products, generate content, and publish posts every 2 minutes. 
                Click "Run Now" to trigger an immediate cycle.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}