import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DashboardOverview } from "@/components/DashboardOverview";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, Sparkles, TrendingUp, Zap, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [isLaunching, setIsLaunching] = useState(false);
  const [autopilotStatus, setAutopilotStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAutopilotStatus();
    
    // Auto-refresh status every 30 seconds
    const interval = setInterval(loadAutopilotStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAutopilotStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const response = await supabase.functions.invoke('autopilot-engine', {
        body: { action: 'status', user_id: user.id }
      });

      if (response.data) {
        setAutopilotStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading autopilot status:', error);
    } finally {
      setLoading(false);
    }
  };

  const launchAutopilot = async () => {
    setIsLaunching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to launch autopilot",
          variant: "destructive"
        });
        return;
      }

      const response = await supabase.functions.invoke('autopilot-engine', {
        body: { action: 'start', user_id: user.id }
      });

      if (response.error) throw response.error;

      toast({
        title: "🚀 Autopilot Launched!",
        description: "AI automation is now running 24/7 in the background",
      });

      await loadAutopilotStatus();
    } catch (error: any) {
      toast({
        title: "Launch Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLaunching(false);
    }
  };

  const stopAutopilot = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.functions.invoke('autopilot-engine', {
        body: { action: 'stop', user_id: user.id }
      });

      toast({
        title: "Autopilot Stopped",
        description: "AI automation has been paused",
      });

      await loadAutopilotStatus();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const stats = autopilotStatus?.stats || {};
  const isRunning = autopilotStatus?.is_running || false;

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Dashboard | AffiliatePro"
        description="Your affiliate marketing command center"
      />
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome Back! 👋</h1>
          <p className="text-muted-foreground">Your affiliate marketing command center</p>
        </div>

        {/* AI Automation Hub Card */}
        <Card className="mb-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">AI Automation Hub</h2>
                    <p className="text-sm text-muted-foreground">
                      Your complete affiliate marketing system runs on autopilot—products, content, optimization, and tracking all managed by AI
                    </p>
                  </div>
                </div>

                {isRunning && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border">
                      <div className="text-3xl font-bold text-purple-600">{stats.products_discovered || 0}</div>
                      <div className="text-sm text-muted-foreground">Products Discovered</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border">
                      <div className="text-3xl font-bold text-blue-600">{stats.products_optimized || 0}</div>
                      <div className="text-sm text-muted-foreground">Products Optimized</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border">
                      <div className="text-3xl font-bold text-green-600">{stats.posts_published || 0}</div>
                      <div className="text-sm text-muted-foreground">Posts Published</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border">
                      <div className="text-3xl font-bold text-orange-600">{stats.cycles_completed || 0}</div>
                      <div className="text-sm text-muted-foreground">Cycles Completed</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 min-w-[200px]">
                {loading ? (
                  <Button disabled className="w-full">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </Button>
                ) : isRunning ? (
                  <>
                    <Badge variant="default" className="bg-green-600 text-white justify-center py-2">
                      <div className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
                      Running 24/7
                    </Badge>
                    <Button variant="outline" onClick={stopAutopilot}>
                      Stop Autopilot
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href="/smart-picks">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Open Dashboard
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={launchAutopilot} 
                    disabled={isLaunching}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {isLaunching ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Launching...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Launch Autopilot
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/smart-picks" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-600" />
                  SmartPicks Hub
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  AI automation dashboard with 12 admin tools and scheduled automations
                </p>
                <Badge variant="secondary">12 Tools Available</Badge>
              </CardContent>
            </Card>
          </Link>

          <Link href="/social-connect" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Social Connect
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect social media once, post automatically forever
                </p>
                <Badge variant="secondary">5 Platforms</Badge>
              </CardContent>
            </Card>
          </Link>

          <Link href="/magic-tools" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-600" />
                  Magic Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  7 revolutionary AI tools never built before
                </p>
                <Badge variant="secondary">7 Magic Tools</Badge>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Alert based on autopilot status */}
        {!isRunning && !loading && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <strong>Autopilot is not running.</strong> Click "Launch Autopilot" above to activate 24/7 automation.
            </AlertDescription>
          </Alert>
        )}

        {isRunning && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Autopilot is active!</strong> Your AI is discovering products, optimizing performance, and publishing posts automatically.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard Content */}
        <DashboardOverview />
      </main>

      <Footer />
    </div>
  );
}