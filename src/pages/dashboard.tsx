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
  Activity
} from "lucide-react";
import { authService } from "@/services/authService";
import { campaignService } from "@/services/smartCampaignService";
import { CampaignBuilder } from "@/components/CampaignBuilder";

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
        setCampaigns(campaignsResult.campaigns);
        
        // Calculate aggregate stats
        const totalClicks = campaignsResult.campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
        const totalConversions = campaignsResult.campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
        const totalRevenue = campaignsResult.campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
        const activeCampaigns = campaignsResult.campaigns.filter(c => c.status === "active").length;
        
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

          {/* Campaigns Section */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Campaigns</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="paused">Paused</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {campaigns.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Zap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
                    <p className="text-muted-foreground mb-6">Create your first campaign to start earning affiliate commissions</p>
                    <Button onClick={() => setShowCampaignBuilder(true)} size="lg">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Campaign
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {campaigns.map((campaign) => (
                    <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2 text-xs">
                          <Calendar className="w-3 h-3" />
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Clicks</p>
                            <p className="font-semibold">{campaign.clicks?.toLocaleString() || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Conversions</p>
                            <p className="font-semibold">{campaign.conversions?.toLocaleString() || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Revenue</p>
                            <p className="font-semibold">${campaign.revenue?.toFixed(2) || "0.00"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Budget</p>
                            <p className="font-semibold">${campaign.budget?.toLocaleString() || 0}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Badge variant="outline" className="text-xs">
                            {campaign.affiliateLinks || 0} Links
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {campaign.trafficSources || 0} Sources
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Analytics
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Settings className="w-4 h-4 mr-1" />
                            Settings
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.filter(c => c.status === "active").map((campaign) => (
                  <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Clicks:</span>
                          <span className="font-semibold">{campaign.clicks?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Revenue:</span>
                          <span className="font-semibold">${campaign.revenue?.toFixed(2) || "0.00"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="paused" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.filter(c => c.status === "paused").map((campaign) => (
                  <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <Badge variant="secondary">Paused</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm" className="w-full">
                        Resume Campaign
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
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