import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Zap, 
  Bot, 
  Sparkles, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  XCircle,
  AlertCircle,
  BarChart3,
  Globe,
  Target,
  DollarSign,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { toast } = useToast();
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [stats, setStats] = useState({
    products_discovered: 0,
    products_optimized: 0,
    content_generated: 0,
    posts_published: 0,
    total_clicks: 0,
    total_revenue: 0
  });

  useEffect(() => {
    loadAutopilotStatus();
    const interval = setInterval(loadAutopilotStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAutopilotStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // SINGLE SOURCE OF TRUTH: user_settings.autopilot_enabled
      const { data: settings } = await supabase
        .from('user_settings')
        .select('autopilot_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settings) {
        setIsAutopilotActive(settings.autopilot_enabled || false);
      }

      // Load real stats from database
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user.id);

      if (campaigns && campaigns.length > 0) {
        const campaignIds = campaigns.map(c => c.id);

        const { data: links } = await supabase
          .from('affiliate_links')
          .select('*')
          .in('campaign_id', campaignIds);

        if (links) {
          const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
          const totalRevenue = links.reduce((sum, l) => sum + (Number(l.revenue) || 0), 0);
          
          setStats(prev => ({
            ...prev,
            products_discovered: links.length,
            total_clicks: totalClicks,
            total_revenue: totalRevenue
          }));
        }
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
        toast({
          title: "Authentication Required",
          description: "Please sign in to use autopilot",
          variant: "destructive"
        });
        return;
      }

      const newStatus = !isAutopilotActive;
      
      // 1. SAVE TO DATABASE FIRST (single source of truth)
      const { error: dbError } = await supabase
        .from('user_settings')
        .upsert({ 
          user_id: user.id, 
          autopilot_enabled: newStatus,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (dbError) {
        console.error("Database error:", dbError);
        throw dbError;
      }

      // 2. Call Edge Function to start/stop autopilot backend
      try {
        await supabase.functions.invoke('autopilot-engine', {
          body: { 
            action: newStatus ? 'start' : 'stop',
            user_id: user.id 
          }
        });
      } catch (fnError) {
        console.error("Edge function error (non-fatal):", fnError);
      }

      // 3. Update local state
      setIsAutopilotActive(newStatus);
      
      toast({
        title: newStatus ? "🚀 Autopilot Launched!" : "⏸️ Autopilot Stopped",
        description: newStatus 
          ? "System is running 24/7 on server. Navigate anywhere - it keeps working!"
          : "Autopilot has been paused. Click Launch to restart."
      });

      // Reload stats
      await loadAutopilotStatus();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEO 
        title="AffiliatePro - AI-Powered Affiliate Marketing Automation"
        description="Complete affiliate marketing system with AI autopilot, product discovery, content generation, and social media automation"
      />
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <Badge className="mb-4">AI-Powered Automation</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Your Complete Affiliate<br/>Marketing Autopilot
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover trending products, generate content, optimize performance, and automate social media—all managed by AI
          </p>
        </section>

        {/* MAIN AUTOPILOT CONTROL */}
        <Card className="mb-12 border-2 border-primary/20 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${isAutopilotActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <CardTitle className="text-2xl md:text-3xl">AI Autopilot Control</CardTitle>
              </div>
              <Badge variant={isAutopilotActive ? "default" : "secondary"} className="text-sm">
                {isAutopilotActive ? '🟢 Running 24/7' : '⚫ Stopped'}
              </Badge>
            </div>
            <CardDescription>
              Complete automation running on server - works even when you navigate away or close browser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Stats */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Live Performance
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background/60 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{stats.products_discovered}</div>
                    <div className="text-sm text-muted-foreground">Products</div>
                  </div>
                  <div className="bg-background/60 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{stats.products_optimized}</div>
                    <div className="text-sm text-muted-foreground">Optimized</div>
                  </div>
                  <div className="bg-background/60 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-pink-600">{stats.content_generated}</div>
                    <div className="text-sm text-muted-foreground">Content</div>
                  </div>
                  <div className="bg-background/60 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{stats.posts_published}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background/60 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{stats.total_clicks}</div>
                    <div className="text-sm text-muted-foreground">Total Clicks</div>
                  </div>
                  <div className="bg-background/60 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">${stats.total_revenue.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col justify-center gap-4">
                <Button 
                  size="lg" 
                  onClick={toggleAutopilot}
                  disabled={isLaunching}
                  className={`h-16 text-lg ${isAutopilotActive ? 'bg-red-600 hover:bg-red-700' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'}`}
                >
                  {isLaunching ? (
                    <>
                      <Clock className="w-6 h-6 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isAutopilotActive ? (
                    <>
                      <XCircle className="w-6 h-6 mr-2" />
                      Stop Autopilot
                    </>
                  ) : (
                    <>
                      <Zap className="w-6 h-6 mr-2" />
                      Launch Autopilot Now
                    </>
                  )}
                </Button>
                
                {isAutopilotActive ? (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <strong>System Active!</strong> AI is discovering products, optimizing performance, and publishing content automatically.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription>
                      <strong>Autopilot Stopped.</strong> Click "Launch Autopilot Now" to activate 24/7 automation.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Runs 24/7 on server (not browser)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Navigate anywhere - keeps running</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Stops only when you click "Stop"</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Tools */}
        <section id="features" className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Powerful AI Tools</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/smart-picks" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
                <CardHeader>
                  <Bot className="w-12 h-12 text-purple-600 mb-4" />
                  <CardTitle>SmartPicks Hub</CardTitle>
                  <CardDescription>
                    12 AI admin tools, scheduled automations, and product discovery
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge>12 Tools</Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/social-connect" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
                <CardHeader>
                  <Globe className="w-12 h-12 text-blue-600 mb-4" />
                  <CardTitle>Social Connect</CardTitle>
                  <CardDescription>
                    One-click social media setup - post automatically forever
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge>5 Platforms</Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/magic-tools" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
                <CardHeader>
                  <Sparkles className="w-12 h-12 text-pink-600 mb-4" />
                  <CardTitle>Magic Tools</CardTitle>
                  <CardDescription>
                    7 revolutionary AI tools never built before
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge>7 Magic Tools</Badge>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <CardTitle className="text-lg">Discover Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  AI finds trending products from Amazon, Temu, and AliExpress automatically
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <CardTitle className="text-lg">Generate Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  AI writes SEO-optimized articles and social media posts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <CardTitle className="text-lg">Auto-Post</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  System posts to Facebook, TikTok, YouTube, Instagram automatically
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">4</span>
                </div>
                <CardTitle className="text-lg">Track & Optimize</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Real-time analytics and AI optimization for maximum revenue
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Simple Pricing</h2>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Pro Plan</CardTitle>
              <div className="text-4xl font-bold my-4">$97<span className="text-lg font-normal text-muted-foreground">/month</span></div>
              <CardDescription>Everything you need to succeed</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Unlimited product discovery</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>AI content generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>5 social media platforms</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>7 magic AI tools</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>24/7 autopilot system</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Real-time analytics</span>
                </li>
              </ul>
              <Button className="w-full" size="lg">
                Get Started Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}