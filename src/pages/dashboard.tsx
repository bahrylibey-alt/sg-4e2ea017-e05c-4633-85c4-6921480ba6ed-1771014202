import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  MousePointerClick, 
  Plus,
  ExternalLink,
  Calendar,
  BarChart3,
  Settings,
  Loader2,
  AlertCircle,
  Zap,
  Target,
  Activity,
  LogOut
} from "lucide-react";
import { authService } from "@/services/authService";
import { campaignService } from "@/services/campaignService";
import { CampaignBuilder } from "@/components/CampaignBuilder";
import { AutopilotControl } from "@/components/AutopilotControl";
import { AdvancedAnalyticsDashboard } from "@/components/AdvancedAnalyticsDashboard";
import { OneClickAutopilot } from "@/components/OneClickAutopilot";

interface Campaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
  goal: string;
  budget: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
  affiliateLinks?: number;
  trafficSources?: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0,
    activeCampaigns: 0
  });
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const session = await authService.getCurrentSession();
    
    if (!session) {
      router.push("/?auth=login");
      return;
    }

    setIsAuthenticated(true);
    await loadDashboardData();
    setLoading(false);
  };

  const loadDashboardData = async () => {
    try {
      // Fetch user's campaigns
      const campaignsResult = await campaignService.getUserCampaigns();
      
      if (campaignsResult.campaigns) {
        // Cast to local Campaign type to handle optional extended properties
        const typedCampaigns = campaignsResult.campaigns as unknown as Campaign[];
        setCampaigns(typedCampaigns);
        
        // Calculate aggregate stats
        const totalClicks = typedCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
        const totalConversions = typedCampaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
        const totalRevenue = typedCampaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
        const activeCampaigns = typedCampaigns.filter(c => c.status === "active").length;
        
        setStats({
          totalClicks,
          totalConversions,
          totalRevenue,
          activeCampaigns
        });
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  const handleCampaignCreated = () => {
    setShowCampaignBuilder(false);
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Dashboard - AffiliatePro" description="Manage your affiliate campaigns and track performance" />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container py-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back! Here's your affiliate performance overview.</p>
            </div>
            <Button 
              size="lg" 
              onClick={() => setShowCampaignBuilder(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Campaign
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Across all campaigns</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalConversions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalClicks > 0 
                    ? `${((stats.totalConversions / stats.totalClicks) * 100).toFixed(2)}% conversion rate`
                    : "No data yet"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">Commission earnings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
                <p className="text-xs text-muted-foreground">Out of {campaigns.length} total</p>
              </CardContent>
            </Card>
          </div>

          {/* One-Click Autopilot */}
          <OneClickAutopilot />

          {/* Advanced Analytics Dashboard */}
          <div className="mt-8">
            <AdvancedAnalyticsDashboard />
          </div>
        </main>

        <Footer />
        
        <CampaignBuilder 
          open={showCampaignBuilder} 
          onOpenChange={setShowCampaignBuilder}
        />
      </div>
    </>
  );
}