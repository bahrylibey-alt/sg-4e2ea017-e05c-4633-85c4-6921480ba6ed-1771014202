import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Rocket, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target,
  Eye,
  MousePointerClick,
  Calendar,
  Settings
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "completed";
  revenue: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  budget: number;
  spent: number;
  daysRemaining: number;
  products: number;
  channels: string[];
  performance: "excellent" | "good" | "average" | "poor";
}

export function CampaignMonitor() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const initialCampaigns: Campaign[] = [
      {
        id: "1",
        name: "Summer Product Launch 2026",
        status: "active",
        revenue: 12847,
        clicks: 3421,
        conversions: 247,
        conversionRate: 7.2,
        budget: 5000,
        spent: 3240,
        daysRemaining: 18,
        products: 4,
        channels: ["Blog", "Email", "Social"],
        performance: "excellent"
      },
      {
        id: "2",
        name: "Digital Marketing Course Promo",
        status: "active",
        revenue: 8934,
        clicks: 2156,
        conversions: 156,
        conversionRate: 7.2,
        budget: 3000,
        spent: 1890,
        daysRemaining: 12,
        products: 2,
        channels: ["YouTube", "Blog"],
        performance: "good"
      },
      {
        id: "3",
        name: "SEO Tools Bundle Campaign",
        status: "active",
        revenue: 5621,
        clicks: 1534,
        conversions: 89,
        conversionRate: 5.8,
        budget: 2000,
        spent: 1420,
        daysRemaining: 9,
        products: 3,
        channels: ["Email", "Paid Ads"],
        performance: "good"
      },
      {
        id: "4",
        name: "Fitness Program Q1 Push",
        status: "paused",
        revenue: 2341,
        clicks: 892,
        conversions: 34,
        conversionRate: 3.8,
        budget: 1500,
        spent: 1120,
        daysRemaining: 21,
        products: 2,
        channels: ["Social", "Influencer"],
        performance: "average"
      }
    ];
    
    setCampaigns(initialCampaigns);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      setCampaigns(prev => prev.map(campaign => {
        if (campaign.status !== "active") return campaign;
        
        const revenueIncrease = Math.random() * 100;
        const clicksIncrease = Math.floor(Math.random() * 10);
        const conversionsIncrease = Math.random() > 0.7 ? 1 : 0;
        
        return {
          ...campaign,
          revenue: campaign.revenue + revenueIncrease,
          clicks: campaign.clicks + clicksIncrease,
          conversions: campaign.conversions + conversionsIncrease,
          conversionRate: ((campaign.conversions + conversionsIncrease) / (campaign.clicks + clicksIncrease)) * 100
        };
      }));
    }, 20000); // Update every 20 seconds

    return () => clearInterval(interval);
  }, [mounted]);

  const getPerformanceBadge = (performance: Campaign["performance"]) => {
    const config = {
      excellent: { variant: "default" as const, className: "bg-green-500 hover:bg-green-600", label: "Excellent" },
      good: { variant: "secondary" as const, className: "bg-blue-500/10 text-blue-500", label: "Good" },
      average: { variant: "secondary" as const, className: "bg-yellow-500/10 text-yellow-500", label: "Average" },
      poor: { variant: "secondary" as const, className: "bg-red-500/10 text-red-500", label: "Needs Attention" }
    };
    
    return config[performance];
  };

  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "completed":
        return "bg-gray-500";
    }
  };

  if (!mounted) return null;

  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;

  return (
    <section className="py-24 px-6 bg-muted/30" data-section="campaigns">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <Badge variant="outline" className="text-primary border-primary/30">
            <Rocket className="w-3 h-3 mr-1" />
            Campaign Monitor
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Track Your <span className="text-primary">Active Campaigns</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Real-time performance monitoring and optimization suggestions
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +24% from last period
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Campaigns
              </CardTitle>
              <Target className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{activeCampaigns}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {campaigns.length - activeCampaigns} paused/completed
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Conversions
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalConversions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg. rate: {((totalConversions / campaigns.reduce((sum, c) => sum + c.clicks, 0)) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Cards */}
        <div className="space-y-6">
          {campaigns.map((campaign) => {
            const performanceBadge = getPerformanceBadge(campaign.performance);
            const budgetUsed = (campaign.spent / campaign.budget) * 100;
            
            return (
              <Card key={campaign.id} className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${getStatusColor(campaign.status)} ${campaign.status === 'active' ? 'animate-pulse' : ''}`} />
                      <div>
                        <CardTitle className="text-xl mb-1">{campaign.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {campaign.products} Products
                          </Badge>
                          {campaign.channels.map((channel, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {channel}
                            </Badge>
                          ))}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge {...performanceBadge}>
                      {performanceBadge.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <DollarSign className="w-4 h-4" />
                        Revenue
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        ${campaign.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <MousePointerClick className="w-4 h-4" />
                        Clicks
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {campaign.clicks.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Target className="w-4 h-4" />
                        Conversions
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {campaign.conversions}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <TrendingUp className="w-4 h-4" />
                        Conv. Rate
                      </div>
                      <div className="text-2xl font-bold text-green-500">
                        {campaign.conversionRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Budget Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Budget Used</span>
                      <span className="font-semibold">
                        ${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={budgetUsed} className="h-2" />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {campaign.daysRemaining} days remaining
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Optimize
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}