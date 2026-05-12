import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Rocket, 
  Activity, 
  TrendingUp, 
  Users, 
  Mail, 
  Target, 
  Zap,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Play,
  Loader2
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EliteStats {
  products: number;
  bridgePages: number;
  leads: number;
  emailSequences: number;
  posts: number;
  phase: string;
  lastUpdate?: string;
}

export function AutopilotDashboard() {
  const [stats, setStats] = useState<EliteStats | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadStats(user.id);
        
        const { data } = await supabase
          .from('user_settings')
          .select('autopilot_enabled')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) setIsEnabled(data.autopilot_enabled || false);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const loadStats = async (uid: string) => {
    try {
      const response = await fetch(`/api/autopilot/elite-stats?userId=${uid}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (!userId) return;
    
    try {
      setIsEnabled(checked);
      await supabase
        .from('user_settings')
        .upsert({ 
          user_id: userId, 
          autopilot_enabled: checked,
          updated_at: new Date().toISOString()
        });
      
      toast({
        title: checked ? "🚀 Elite Mode Activated" : "⏸️ Paused",
        description: checked 
          ? "Advanced affiliate system now running" 
          : "System paused - activate when ready",
      });
    } catch (error) {
      console.error("Toggle error:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    }
  };

  const runEliteWorkflow = async () => {
    if (!userId) return;
    
    setIsRunning(true);
    try {
      toast({ 
        title: "🚀 Launching Elite Workflow", 
        description: "Building sophisticated marketing funnels..." 
      });
      
      const response = await fetch('/api/autopilot/run-elite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Workflow failed');
      
      toast({ 
        title: "✅ Elite Workflow Complete", 
        description: `Created ${data.bridgePages} funnels, ${data.content} pieces of content` 
      });
      
      await loadStats(userId);
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!userId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Please log in to access Elite Autopilot</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Rocket className={`h-8 w-8 ${isEnabled ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <CardTitle className="text-3xl">Elite Autopilot System</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Advanced affiliate marketing automation with proven strategies
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Pre-Sell Bridge Pages
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Email List Building
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Story-Based Content
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Viral Loop Mechanics
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> AI Optimization
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-background p-4 rounded-lg border-2">
                <Switch
                  id="elite-toggle"
                  checked={isEnabled}
                  onCheckedChange={handleToggle}
                  disabled={isRunning}
                  className="data-[state=checked]:bg-green-500"
                />
                <Label htmlFor="elite-toggle" className="font-bold text-lg cursor-pointer">
                  {isEnabled ? '🟢 ACTIVE' : '⚪ INACTIVE'}
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Button 
          onClick={runEliteWorkflow} 
          disabled={isRunning} 
          size="lg" 
          className="h-16 text-lg gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> 
              Building Funnels...
            </>
          ) : (
            <>
              <Play className="h-5 w-5" /> 
              Launch Elite Workflow
            </>
          )}
        </Button>

        <Button 
          variant="outline" 
          size="lg" 
          className="h-16 text-lg gap-2"
          onClick={() => loadStats(userId)}
        >
          <Activity className="h-5 w-5" /> 
          Refresh Stats
        </Button>
      </div>

      {/* System Status */}
      <Alert variant={stats?.phase === 'ELITE_RUNNING' ? 'default' : 'destructive'}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">System Status: {stats?.phase || 'INACTIVE'}</p>
              <p className="text-sm">
                {stats?.phase === 'ELITE_RUNNING' 
                  ? 'All systems operational - funnels active' 
                  : 'Click "Launch Elite Workflow" to begin'}
              </p>
            </div>
            {stats?.lastUpdate && (
              <Badge variant="outline" className="text-xs">
                Updated: {new Date(stats.lastUpdate).toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Winning Products</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.products || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">AI-scored for performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Bridge Pages</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.bridgePages || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Pre-sell funnels active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Email Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.leads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Subscribers captured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Email Sequences</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.emailSequences || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Automated follow-ups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Content Posted</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.posts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Multi-platform distribution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Optimization</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">AI</div>
            <p className="text-xs text-muted-foreground mt-1">Auto-optimizing 24/7</p>
          </CardContent>
        </Card>
      </div>

      {/* Features Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Features</CardTitle>
          <CardDescription>
            What makes this system elite
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Pre-Sell Bridge Pages
              </h4>
              <p className="text-sm text-muted-foreground">
                Emotional storytelling pages that warm up traffic before the offer
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Email List Building
              </h4>
              <p className="text-sm text-muted-foreground">
                Automated lead magnets with 3-email nurture sequences
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Viral Loop Mechanics
              </h4>
              <p className="text-sm text-muted-foreground">
                Referral systems and share incentives for exponential growth
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                AI Optimization
              </h4>
              <p className="text-sm text-muted-foreground">
                Continuous A/B testing and traffic routing for maximum conversions
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Retargeting Pixels
              </h4>
              <p className="text-sm text-muted-foreground">
                Facebook, Google, and TikTok pixels for advanced remarketing
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Story-Based Content
              </h4>
              <p className="text-sm text-muted-foreground">
                Platform-optimized content with emotional hooks and social proof
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}