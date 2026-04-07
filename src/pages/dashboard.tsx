import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DashboardOverview } from "@/components/DashboardOverview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bot, 
  Zap, 
  Sparkles, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

export default function Dashboard() {
  const { toast } = useToast();
  const [automationActive, setAutomationActive] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [stats, setStats] = useState({
    products_discovered: 0,
    products_optimized: 0,
    content_generated: 0,
    posts_published: 0
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadAutopilotStatus();
    const interval = setInterval(loadAutopilotStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAutopilotStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: config } = await supabase
        .from('ai_tools_config' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('tool_name', 'autopilot_engine')
        .maybeSingle();

      if (config) {
        const conf = config as any;
        setAutomationActive(conf.is_active || false);
        if (conf.stats) {
          setStats(conf.stats);
        }
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error loading autopilot status:', error);
    }
  };

  const toggleAutopilot = async () => {
    setIsLaunching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in to use autopilot');
        setIsLaunching(false);
        return;
      }

      const newStatus = !automationActive;
      
      const { data, error } = await supabase.functions.invoke('autopilot-engine', {
        body: { 
          action: newStatus ? 'start' : 'stop',
          user_id: user.id 
        }
      });

      if (error) throw error;

      setAutomationActive(newStatus);
      await loadAutopilotStatus();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLaunching(false);
    }
  };

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

        {/* AUTOPILOT CONTROL - PROMINENT AT TOP */}
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${automationActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <CardTitle className="text-2xl">AI Autopilot Control</CardTitle>
              </div>
              <Badge variant={automationActive ? "default" : "secondary"} className="text-sm">
                {automationActive ? '🟢 Running 24/7' : '⚫ Stopped'}
              </Badge>
            </div>
            <CardDescription>
              Your complete affiliate marketing system runs on autopilot—products, content, optimization, and tracking all managed by AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Stats */}
              <div className="space-y-3">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Live Statistics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background/60 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.products_discovered}</div>
                    <div className="text-xs text-muted-foreground">Products Discovered</div>
                  </div>
                  <div className="bg-background/60 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.products_optimized}</div>
                    <div className="text-xs text-muted-foreground">Products Optimized</div>
                  </div>
                  <div className="bg-background/60 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-pink-600">{stats.content_generated}</div>
                    <div className="text-xs text-muted-foreground">Content Generated</div>
                  </div>
                  <div className="bg-background/60 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.posts_published}</div>
                    <div className="text-xs text-muted-foreground">Posts Published</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
              </div>

              {/* Right: Controls */}
              <div className="flex flex-col justify-center gap-4">
                <Button 
                  size="lg" 
                  onClick={toggleAutopilot}
                  disabled={isLaunching}
                  className={automationActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                >
                  {isLaunching ? (
                    <>
                      <Clock className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : automationActive ? (
                    <>
                      <XCircle className="w-5 h-5 mr-2" />
                      Stop Autopilot
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Launch Autopilot
                    </>
                  )}
                </Button>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Runs 24/7 on server (not in browser)</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Navigate anywhere - keeps running</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Stops only when you click "Stop"</span>
                  </div>
                </div>
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
        {!automationActive && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <strong>Autopilot is not running.</strong> Click "Launch Autopilot" above to activate 24/7 automation.
            </AlertDescription>
          </Alert>
        )}

        {automationActive && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
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