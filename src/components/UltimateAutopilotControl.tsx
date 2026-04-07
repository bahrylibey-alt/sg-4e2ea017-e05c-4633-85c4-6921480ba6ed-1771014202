import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Rocket, 
  Zap, 
  Search, 
  TrendingUp, 
  FileEdit, 
  Send,
  CheckCircle2,
  Clock,
  Settings,
  Play,
  Pause
} from "lucide-react";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";
import { taskExecutor } from "@/services/taskExecutor";
import { supabase } from "@/integrations/supabase/client";

interface AutomationStatus {
  productDiscovery: boolean;
  performanceOptimization: boolean;
  seoRewriter: boolean;
  scheduledPosts: boolean;
}

export function UltimateAutopilotControl() {
  const [isRunning, setIsRunning] = useState(false);
  const [automations, setAutomations] = useState<AutomationStatus>({
    productDiscovery: true,
    performanceOptimization: true,
    seoRewriter: true,
    scheduledPosts: true
  });
  const [stats, setStats] = useState({
    productsDiscovered: 0,
    productsOptimized: 0,
    postsPublished: 0,
    lastRun: null as string | null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAutopilotStatus();
    loadStats();
  }, []);

  const loadAutopilotStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: config } = await supabase
        .from('ai_tools_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (config) {
        setIsRunning(config.is_active || false);
        if (config.settings) {
          setAutomations(config.settings as AutomationStatus);
        }
      }
    } catch (error) {
      console.error("Error loading autopilot status:", error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: logs } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('action', ['auto_product_discovery', 'auto_optimize_product', 'auto_post_success'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (logs) {
        setStats({
          productsDiscovered: logs.filter(l => l.action === 'auto_product_discovery').length,
          productsOptimized: logs.filter(l => l.action === 'auto_optimize_product').length,
          postsPublished: logs.filter(l => l.action === 'auto_post_success').length,
          lastRun: logs[0]?.created_at || null
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const toggleAutopilot = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newStatus = !isRunning;

      await supabase.from('ai_tools_config').upsert({
        user_id: user.id,
        tool_name: 'ultimate_autopilot',
        is_active: newStatus,
        settings: automations,
        updated_at: new Date().toISOString()
      });

      setIsRunning(newStatus);

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: newStatus ? 'autopilot_started' : 'autopilot_stopped',
        details: `Autopilot ${newStatus ? 'activated' : 'deactivated'}`,
        status: 'success'
      });

      if (newStatus) {
        // Run initial tasks
        await runNow();
      }
    } catch (error: any) {
      console.error("Error toggling autopilot:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async (key: keyof AutomationStatus) => {
    const newAutomations = {
      ...automations,
      [key]: !automations[key]
    };
    setAutomations(newAutomations);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('ai_tools_config').upsert({
        user_id: user.id,
        tool_name: 'ultimate_autopilot',
        is_active: isRunning,
        settings: newAutomations,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating automation:", error);
    }
  };

  const runNow = async () => {
    setLoading(true);
    try {
      // Run all enabled tasks
      if (automations.productDiscovery) {
        await smartProductDiscovery.discoverTrendingProducts();
      }

      if (automations.performanceOptimization) {
        await taskExecutor.optimizePerformance();
      }

      if (automations.seoRewriter) {
        await taskExecutor.rewriteSEOContent();
      }

      if (automations.scheduledPosts) {
        await taskExecutor.publishScheduledPosts();
      }

      // Reload stats
      await loadStats();
    } catch (error: any) {
      console.error("Error running tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const automationCards = [
    {
      key: 'productDiscovery' as keyof AutomationStatus,
      icon: Search,
      title: "Auto Product Discovery",
      description: "AI finds trending products and adds them automatically",
      features: ["Web search", "Smart categorization", "Affiliate link generation"],
      schedule: "3:00 AM Daily"
    },
    {
      key: 'performanceOptimization' as keyof AutomationStatus,
      icon: TrendingUp,
      title: "Performance Optimization",
      description: "Optimize top 5 underperforming products automatically",
      features: ["Title optimization", "Price adjustments", "Feature enhancement"],
      schedule: "9:00 AM Daily"
    },
    {
      key: 'seoRewriter' as keyof AutomationStatus,
      icon: FileEdit,
      title: "SEO Content Rewriter",
      description: "Rewrite low-traffic articles for better rankings",
      features: ["Keyword optimization", "Meta tags", "Content enhancement"],
      schedule: "Weekly"
    },
    {
      key: 'scheduledPosts' as keyof AutomationStatus,
      icon: Send,
      title: "Publish Scheduled Posts",
      description: "Auto-publish articles when scheduled time arrives",
      features: ["Social sharing", "Email campaigns", "Multi-platform"],
      schedule: "Every 2 Hours"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Rocket className="w-10 h-10" />
              <div>
                <CardTitle className="text-3xl">AI Automation Hub</CardTitle>
                <CardDescription className="text-white/80">
                  Your complete affiliate marketing system runs on autopilot—products, content, optimization, and tracking all managed by AI
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={isRunning ? "bg-green-500" : "bg-gray-500"}>
                {isRunning ? "Running" : "Stopped"}
              </Badge>
              <Button
                variant={isRunning ? "secondary" : "default"}
                size="lg"
                onClick={toggleAutopilot}
                disabled={loading}
                className="min-w-[150px]"
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Autopilot
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Launch Autopilot Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{stats.productsDiscovered}</div>
            <div className="text-sm text-muted-foreground">Products Discovered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{stats.productsOptimized}</div>
            <div className="text-sm text-muted-foreground">Products Optimized</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{stats.postsPublished}</div>
            <div className="text-sm text-muted-foreground">Posts Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {stats.lastRun ? new Date(stats.lastRun).toLocaleDateString() : "Never"}
            </div>
            <div className="text-sm text-muted-foreground">Last Run</div>
          </CardContent>
        </Card>
      </div>

      {/* Active AI Systems */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              <CardTitle>Active AI Systems</CardTitle>
            </div>
            <Button onClick={runNow} disabled={loading || !isRunning} size="sm">
              <Rocket className="w-4 h-4 mr-2" />
              Run All Now
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          {automationCards.map((automation) => (
            <Card key={automation.key} className={!automations[automation.key] ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <automation.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{automation.title}</CardTitle>
                      <CardDescription>{automation.description}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={automations[automation.key]}
                    onCheckedChange={() => toggleAutomation(automation.key)}
                    disabled={!isRunning}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {automation.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                    <Clock className="w-4 h-4" />
                    <span>Schedule: {automation.schedule}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <CardTitle>How It Works</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 list-decimal list-inside">
            <li className="text-sm">Click "Launch Autopilot Now" to start the AI automation engine</li>
            <li className="text-sm">Enable/disable specific automations using the toggles</li>
            <li className="text-sm">AI runs scheduled tasks automatically (Daily at 3 AM, 9 AM, Weekly on Monday)</li>
            <li className="text-sm">Click "Run All Now" to execute all enabled tasks immediately</li>
            <li className="text-sm">Monitor stats above to track automation performance</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}