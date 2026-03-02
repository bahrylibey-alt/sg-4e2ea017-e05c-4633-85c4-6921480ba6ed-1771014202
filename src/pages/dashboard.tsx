import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  DollarSign, 
  MousePointerClick, 
  Plus,
  Target,
  Activity,
  Loader2,
  Zap,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { authService } from "@/services/authService";
import { campaignService } from "@/services/campaignService";
import { realTimeAnalytics } from "@/services/realTimeAnalytics";
import { affiliateIntegrationService } from "@/services/affiliateIntegrationService";
import { CampaignBuilder } from "@/components/CampaignBuilder";
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
    activeCampaigns: 0,
    totalCommissions: 0,
    activeLinks: 0
  });
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{
    autopilotActive: boolean;
    productsCount: number;
    linksCount: number;
  }>({
    autopilotActive: false,
    productsCount: 0,
    linksCount: 0
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;

    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, isAuthenticated]);

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

  const loadDashboardData = async (isRefresh = false) => {
    try {
      const [campaignsResult, analyticsSnapshot, systemHealth] = await Promise.all([
        campaignService.getUserCampaigns(),
        realTimeAnalytics.getPerformanceSnapshot(),
        getSystemHealth()
      ]);
      
      if (campaignsResult.campaigns) {
        const typedCampaigns = campaignsResult.campaigns as unknown as Campaign[];
        setCampaigns(typedCampaigns);
        
        const totalClicks = typedCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
        const totalConversions = typedCampaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
        const totalRevenue = typedCampaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
        const activeCampaigns = typedCampaigns.filter(c => c.status === "active").length;
        
        setStats({
          totalClicks: analyticsSnapshot?.totalClicks || totalClicks,
          totalConversions: analyticsSnapshot?.totalConversions || totalConversions,
          totalRevenue: analyticsSnapshot?.totalRevenue || totalRevenue,
          activeCampaigns,
          totalCommissions: analyticsSnapshot?.totalCommissions || 0,
          activeLinks: analyticsSnapshot?.activeLinks || 0
        });
      }

      setSystemStatus(systemHealth);
      
      if (isRefresh) {
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  const getSystemHealth = async () => {
    try {
      const session = await authService.getCurrentSession();
      if (!session?.user?.id) {
        return {
          autopilotActive: false,
          productsCount: 0,
          linksCount: 0
        };
      }

      const [campaignsData, productsData, linksData] = await Promise.all([
        campaignService.getUserCampaigns(),
        affiliateIntegrationService.getProductCatalog(),
        affiliateIntegrationService.getAffiliateLinkStats(session.user.id)
      ]);

      const hasAutopilot = campaignsData.campaigns?.some(c => 
        c.status === "active" && (c as any).autopilot_enabled
      ) || false;

      return {
        autopilotActive: hasAutopilot,
        productsCount: productsData.products?.length || 0,
        linksCount: linksData.totalLinks || 0
      };
    } catch (error) {
      console.error("Error checking system health:", error);
      return {
        autopilotActive: false,
        productsCount: 0,
        linksCount: 0
      };
    }
  };

  const handleAutoProductSync = async () => {
    setSyncingProducts(true);
    try {
      const result = await affiliateIntegrationService.autoDiscoverProducts({
        category: "general",
        minCommissionRate: 5,
        autoGenerateLinks: true
      });

      if (result.success) {
        await loadDashboardData();
        alert(`Successfully added ${result.addedCount} new products!`);
      } else {
        alert("Failed to sync products. Please try again.");
      }
    } catch (error) {
      console.error("Error syncing products:", error);
      alert("An error occurred while syncing products.");
    } finally {
      setSyncingProducts(false);
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

  const conversionRate = stats.totalClicks > 0 
    ? ((stats.totalConversions / stats.totalClicks) * 100).toFixed(2)
    : "0.00";

  return (
    <>
      <SEO title="Dashboard - Sale Makseb" description="Manage your affiliate campaigns and track performance" />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">
                Real-time affiliate performance • Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => loadDashboardData(true)}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                size="lg" 
                onClick={() => setShowCampaignBuilder(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Campaign
              </Button>
            </div>
          </div>

          {systemStatus.autopilotActive && (
            <Alert className="mb-6 border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                <strong>Autopilot Active:</strong> Your affiliate system is running automatically with {systemStatus.productsCount} products and {systemStatus.linksCount} active links.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <MousePointerClick className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeLinks} active links
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                <Target className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalConversions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {conversionRate}% conversion rate
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${stats.totalCommissions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in commissions
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Activity className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Out of {campaigns.length} total
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">System Status</CardTitle>
                    <CardDescription>Auto-sync and monitoring</CardDescription>
                  </div>
                  <Badge variant={systemStatus.autopilotActive ? "default" : "secondary"}>
                    {systemStatus.autopilotActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Product Catalog</p>
                      <p className="text-sm text-muted-foreground">{systemStatus.productsCount} products available</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleAutoProductSync}
                    disabled={syncingProducts}
                  >
                    {syncingProducts ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync New
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Autopilot System</p>
                      <p className="text-sm text-muted-foreground">
                        {systemStatus.autopilotActive ? 'Running automated campaigns' : 'Ready to launch'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={systemStatus.autopilotActive ? "default" : "outline"}>
                    {systemStatus.autopilotActive ? 'ON' : 'OFF'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Real-time Tracking</p>
                      <p className="text-sm text-muted-foreground">
                        Auto-refresh: {autoRefresh ? 'Every 30s' : 'Off'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant={autoRefresh ? "default" : "outline"}
                    onClick={() => setAutoRefresh(!autoRefresh)}
                  >
                    {autoRefresh ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
                <CardDescription>Launch campaigns and optimize performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowCampaignBuilder(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Campaign
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleAutoProductSync}
                  disabled={syncingProducts}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Discover New Products
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => loadDashboardData(true)}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>

          <OneClickAutopilot />

          <div className="mt-8">
            <AdvancedAnalyticsDashboard />
          </div>
        </main>

        <Footer />
        
        <CampaignBuilder 
          open={showCampaignBuilder} 
          onOpenChange={setShowCampaignBuilder}
          onCampaignCreated={handleCampaignCreated}
        />
      </div>
    </>
  );
}