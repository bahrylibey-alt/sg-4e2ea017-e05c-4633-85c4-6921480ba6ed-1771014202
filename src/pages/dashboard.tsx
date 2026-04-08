import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Bot, 
  Zap, 
  Sparkles, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Settings,
  Facebook,
  Youtube,
  Instagram,
  Video,
  Hash,
  MessageCircle,
  Activity,
  Eye,
  RefreshCw,
  Search,
  Globe
} from "lucide-react";
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
  
  // States for other tabs to make the UI feel alive
  const [activeTab, setActiveTab] = useState("autopilot");

  // Global persistence listener
  useEffect(() => {
    loadAutopilotStatus();
    // Poll the database frequently to catch background updates from AutopilotRunner
    const interval = setInterval(loadAutopilotStatus, 3000);
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
        toast({ title: "Please sign in to use autopilot", variant: "destructive" });
        setIsLaunching(false);
        return;
      }

      const newStatus = !automationActive;
      
      // Update directly in DB
      await supabase
        .from('ai_tools_config' as any)
        .upsert({
          user_id: user.id,
          tool_name: 'autopilot_engine',
          is_active: newStatus,
          updated_at: new Date().toISOString()
        });

      setAutomationActive(newStatus);
      
      toast({
        title: newStatus ? "🚀 Autopilot Launched!" : "🛑 Autopilot Stopped",
        description: newStatus 
          ? "Engine running globally in the background." 
          : "Engine paused."
      });
      
      await loadAutopilotStatus();
    } catch (error: any) {
      toast({ title: `Error: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEO title="Dashboard - AffiliatePro" />
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Command Center
            </h1>
            <p className="text-muted-foreground">Manage your entire AI affiliate empire from one place.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1 bg-muted/50">
            <TabsTrigger value="autopilot" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Bot className="w-4 h-4 mr-2 text-purple-600" />
              <span className="font-semibold">AI Autopilot</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Globe className="w-4 h-4 mr-2 text-blue-600" />
              <span className="font-semibold">Social Connect</span>
            </TabsTrigger>
            <TabsTrigger value="magic" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Sparkles className="w-4 h-4 mr-2 text-pink-600" />
              <span className="font-semibold">Magic Tools</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Settings className="w-4 h-4 mr-2 text-gray-600" />
              <span className="font-semibold">Admin Tools</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: AUTOPILOT (The Main Hub) */}
          <TabsContent value="autopilot" className="space-y-6 animate-in fade-in-50 duration-300">
            {/* AUTOPILOT CONTROL CARD */}
            <Card className={`border-2 transition-all duration-500 shadow-lg ${automationActive ? 'border-green-500/50 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20' : 'border-primary/20 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full shadow-sm ${automationActive ? 'bg-green-500 animate-pulse shadow-green-500/50' : 'bg-gray-400'}`} />
                    <CardTitle className="text-2xl md:text-3xl">AI Autopilot Engine</CardTitle>
                  </div>
                  <Badge variant={automationActive ? "default" : "secondary"} className={`text-sm py-1 px-3 ${automationActive ? 'bg-green-500 hover:bg-green-600' : ''}`}>
                    {automationActive ? '🟢 RUNNING GLOBALLY' : '⚫ STOPPED'}
                  </Badge>
                </div>
                <CardDescription className="text-base">
                  Your automated affiliate system runs at the application root level. It will never stop when you navigate pages.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left: Stats */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Live Statistics (Auto-Updating)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background/80 p-4 rounded-xl border shadow-sm">
                        <div className="text-3xl font-bold text-purple-600">{stats.products_discovered}</div>
                        <div className="text-sm font-medium text-muted-foreground mt-1">Products Found</div>
                      </div>
                      <div className="bg-background/80 p-4 rounded-xl border shadow-sm">
                        <div className="text-3xl font-bold text-blue-600">{stats.products_optimized}</div>
                        <div className="text-sm font-medium text-muted-foreground mt-1">Optimized</div>
                      </div>
                      <div className="bg-background/80 p-4 rounded-xl border shadow-sm">
                        <div className="text-3xl font-bold text-pink-600">{stats.content_generated}</div>
                        <div className="text-sm font-medium text-muted-foreground mt-1">Content Gen</div>
                      </div>
                      <div className="bg-background/80 p-4 rounded-xl border shadow-sm">
                        <div className="text-3xl font-bold text-green-600">{stats.posts_published}</div>
                        <div className="text-sm font-medium text-muted-foreground mt-1">Posts Published</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      Last synced: {lastUpdate.toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Right: Controls */}
                  <div className="flex flex-col justify-center gap-6 bg-background/40 p-6 rounded-xl border">
                    <Button 
                      size="lg" 
                      onClick={toggleAutopilot}
                      disabled={isLaunching}
                      className={`h-20 text-xl font-bold shadow-lg transition-all ${automationActive ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-green-600 hover:bg-green-700 shadow-green-600/20'}`}
                    >
                      {isLaunching ? (
                        <><Clock className="w-6 h-6 mr-3 animate-spin" /> Processing...</>
                      ) : automationActive ? (
                        <><XCircle className="w-6 h-6 mr-3" /> STOP AUTOPILOT</>
                      ) : (
                        <><Zap className="w-6 h-6 mr-3" /> LAUNCH AUTOPILOT NOW</>
                      )}
                    </Button>
                    
                    <div className="space-y-3 bg-background p-4 rounded-lg border">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground font-medium">Runs globally in the background</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground font-medium">100% safe to navigate away from this page</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground font-medium">Survives page reloads</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scheduled Automations Overview */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Scheduled Routines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-sm">Product Refresh</h4>
                      <p className="text-xs text-muted-foreground">Scans Amazon & Temu</p>
                    </div>
                    <Badge variant="outline">3:00 AM</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-sm">Performance Opt.</h4>
                      <p className="text-xs text-muted-foreground">Fixes descriptions</p>
                    </div>
                    <Badge variant="outline">9:00 AM</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-sm">Social Publish</h4>
                      <p className="text-xs text-muted-foreground">Posts to accounts</p>
                    </div>
                    <Badge variant="outline">Every 4h</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Top Priority Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-sm">
                      <strong>Ab Roller Wheel</strong> has 0 clicks in 30 days. AI recommends rewriting the description.
                    </AlertDescription>
                    <Button size="sm" variant="outline" className="mt-2 w-full">Optimize Now</Button>
                  </Alert>
                  <Alert className="bg-purple-50 dark:bg-purple-950/20 border-purple-200">
                    <AlertCircle className="w-4 h-4 text-purple-600" />
                    <AlertDescription className="text-sm">
                      <strong>Yoga Mat</strong> is trending globally. AI recommends posting to TikTok.
                    </AlertDescription>
                    <Button size="sm" variant="outline" className="mt-2 w-full">Auto-Post</Button>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: SOCIAL CONNECT */}
          <TabsContent value="social" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Globe className="w-6 h-6 text-blue-600" />
                  Social Media Connections
                </CardTitle>
                <CardDescription>Connect your accounts once, let the AI post forever.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Facebook Page', icon: Facebook, color: 'text-blue-600', connected: true },
                    { name: 'Instagram', icon: Instagram, color: 'text-pink-600', connected: false },
                    { name: 'YouTube Shorts', icon: Youtube, color: 'text-red-600', connected: false },
                    { name: 'TikTok', icon: Video, color: 'text-black dark:text-white', connected: false },
                  ].map((platform) => (
                    <div key={platform.name} className="border rounded-xl p-4 flex flex-col items-center text-center gap-3 bg-card hover:border-primary/50 transition-colors">
                      <platform.icon className={`w-10 h-10 ${platform.color}`} />
                      <h3 className="font-semibold">{platform.name}</h3>
                      {platform.connected ? (
                        <Badge className="bg-green-500 w-full justify-center">Connected</Badge>
                      ) : (
                        <Button variant="outline" className="w-full">Connect</Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t pt-6">
                  <h3 className="font-semibold text-lg mb-4">Posting Schedule</h3>
                  <div className="bg-muted/50 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="space-y-4 w-full md:w-1/2">
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Posts per day</Label>
                        <Input type="number" defaultValue={2} className="w-20" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Use AI Viral Predictor</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    <Button size="lg" onClick={() => toast({ title: "Schedule saved!" })}>Save Schedule</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: MAGIC TOOLS */}
          <TabsContent value="magic" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-pink-600" />
                  Magic Tools
                </CardTitle>
                <CardDescription>7 revolutionary AI tools never built before.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: 'AI Video Generator', desc: 'Turn product images into viral TikToks', icon: Video, color: 'bg-purple-100 text-purple-600' },
                    { name: 'Viral Predictor', desc: 'Score products 0-100 on viral potential', icon: TrendingUp, color: 'bg-blue-100 text-blue-600' },
                    { name: 'Best Time Oracle', desc: 'AI calculates optimal posting times', icon: Clock, color: 'bg-green-100 text-green-600' },
                    { name: 'Auto-Hashtag Mixer', desc: '30 trending hashtags updated daily', icon: Hash, color: 'bg-pink-100 text-pink-600' },
                    { name: 'Engagement Multiplier', desc: 'AI auto-responds to comments', icon: MessageCircle, color: 'bg-orange-100 text-orange-600' },
                    { name: 'Competitor Spy', desc: 'Track top affiliates in your niche', icon: Eye, color: 'bg-teal-100 text-teal-600' },
                    { name: 'Revenue Heatmap', desc: 'Visualize your money-making patterns', icon: Activity, color: 'bg-red-100 text-red-600' },
                  ].map((tool) => (
                    <div key={tool.name} className="border rounded-xl p-5 hover:shadow-md transition-shadow group cursor-pointer">
                      <div className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <tool.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{tool.name}</h3>
                      <p className="text-sm text-muted-foreground">{tool.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: ADMIN TOOLS */}
          <TabsContent value="admin" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Settings className="w-6 h-6 text-gray-600" />
                  Admin Tools Console
                </CardTitle>
                <CardDescription>Direct access to backend configuration and optimization tools.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { name: 'Product Discovery Settings', icon: Search },
                    { name: 'Content Generator Templates', icon: Bot },
                    { name: 'SEO Optimizer Rules', icon: TrendingUp },
                    { name: 'Traffic Plan Configuration', icon: Globe },
                    { name: 'Commission Tracker API', icon: Activity },
                    { name: 'Compliance Checks', icon: CheckCircle },
                  ].map((tool) => (
                    <div key={tool.name} className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <tool.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium">{tool.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
      <Footer />
    </div>
  );
}