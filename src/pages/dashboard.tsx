import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DashboardOverview } from "@/components/DashboardOverview";
import { AutopilotDashboard } from "@/components/AutopilotDashboard";
import { 
  TrendingUp, 
  MousePointerClick, 
  DollarSign, 
  BarChart3,
  Zap,
  RefreshCw,
  PlayCircle,
  PauseCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalRevenue: 0,
    activeLinks: 0,
    conversionRate: 0,
    products: 0,
    content: 0,
    posts: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);

  useEffect(() => {
    checkAuth();
    loadDashboardData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadDashboardData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/");
      return;
    }
    setUser(session.user);
  };

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      // Get all stats in parallel
      const [linksData, contentData, postsData] = await Promise.all([
        supabase
          .from("affiliate_links")
          .select("clicks, revenue, conversions, status")
          .eq("user_id", userId),
        supabase
          .from("generated_content")
          .select("id")
          .eq("user_id", userId),
        supabase
          .from("posted_content")
          .select("id")
          .eq("user_id", userId)
      ]);

      const links = linksData.data || [];
      const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
      const totalRevenue = links.reduce((sum, link) => sum + (link.revenue || 0), 0);
      const totalConversions = links.reduce((sum, link) => sum + (link.conversions || 0), 0);
      const activeLinks = links.filter(link => link.status === "active").length;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      setStats({
        totalClicks,
        totalRevenue,
        activeLinks,
        conversionRate,
        products: links.length,
        content: contentData.data?.length || 0,
        posts: postsData.data?.length || 0
      });

      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    toast({
      title: "Dashboard Refreshed",
      description: "All stats have been updated.",
    });
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleTestAutopilot = async () => {
    try {
      setRefreshing(true);
      toast({
        title: "Testing Autopilot",
        description: "Triggering autopilot cycle...",
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("autopilot-engine", {
        body: { action: "run_cycle", user_id: session.user.id }
      });

      if (error) throw error;

      console.log("Autopilot result:", data);

      toast({
        title: "Autopilot Test Complete",
        description: data.message || "Cycle completed successfully",
      });

      // Refresh dashboard to show new data
      await loadDashboardData();
    } catch (error) {
      console.error("Autopilot test error:", error);
      toast({
        title: "Autopilot Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button 
              onClick={handleTestAutopilot}
              disabled={refreshing}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Zap className="w-4 h-4 mr-2" />
              Test Autopilot
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.products}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeLinks} active links
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClicks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.conversionRate.toFixed(1)}% conversion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From {stats.activeLinks} active links
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content & Posts</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.content + stats.posts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.content} content, {stats.posts} posts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="autopilot">
              <Zap className="w-4 h-4 mr-2" />
              AI Autopilot
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="autopilot" className="space-y-4">
            <AutopilotDashboard />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}