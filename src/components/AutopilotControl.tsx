import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  TrendingUp, 
  DollarSign, 
  MousePointerClick, 
  ShoppingCart,
  Link as LinkIcon,
  Radio,
  Rocket,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { autopilotEngine } from "@/services/autopilotEngine";
import { productCatalogService } from "@/services/productCatalogService";
import { useToast } from "@/hooks/use-toast";

export function AutopilotControl() {
  const [stats, setStats] = useState<any>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await autopilotEngine.getAutopilotStats();
      setStats(data);
      setIsAutopilotActive(data.activeCampaigns > 0);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const launchAutopilot = async () => {
    setIsLaunching(true);
    try {
      // Get top converting products
      const products = productCatalogService.getHighConvertingProducts(10);
      const productUrls = products.slice(0, 5).map(p => p.url);

      const result = await autopilotEngine.launchAutopilotCampaign({
        budget: 100,
        products: productUrls,
        targetAudience: "General audience interested in online shopping and deals",
        trafficChannels: ["SEO", "Social Media", "Email Marketing", "Blog Content"]
      });

      toast({
        title: "🚀 Autopilot Launched!",
        description: result.message,
      });

      await loadStats();
      setIsAutopilotActive(true);
    } catch (error: any) {
      toast({
        title: "Launch Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLaunching(false);
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Control Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                Autopilot Control Center
              </CardTitle>
              <CardDescription className="mt-2">
                One-click automated traffic generation and sales optimization
              </CardDescription>
            </div>
            <Badge variant={isAutopilotActive ? "default" : "secondary"} className="text-sm px-3 py-1">
              {isAutopilotActive ? (
                <><Radio className="h-3 w-3 mr-1 animate-pulse" /> ACTIVE</>
              ) : (
                <>INACTIVE</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <MousePointerClick className="h-4 w-4" />
                Total Clicks
              </div>
              <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            </div>

            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <ShoppingCart className="h-4 w-4" />
                Conversions
              </div>
              <div className="text-2xl font-bold">{stats.totalConversions.toLocaleString()}</div>
            </div>

            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <DollarSign className="h-4 w-4" />
                Revenue
              </div>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            </div>

            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="h-4 w-4" />
                Commissions
              </div>
              <div className="text-2xl font-bold text-green-600">${stats.totalCommissions.toFixed(2)}</div>
            </div>
          </div>

          {/* Active Resources */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-background rounded-lg border">
              <div className="text-2xl font-bold text-primary">{stats.activeCampaigns}</div>
              <div className="text-sm text-muted-foreground">Active Campaigns</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border">
              <div className="text-2xl font-bold text-primary">{stats.activeLinks}</div>
              <div className="text-sm text-muted-foreground">Active Links</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border">
              <div className="text-2xl font-bold text-primary">{stats.trafficSources}</div>
              <div className="text-sm text-muted-foreground">Traffic Sources</div>
            </div>
          </div>

          {/* Launch Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={launchAutopilot}
              disabled={isLaunching}
              size="lg"
              className="w-full text-lg h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Launching Autopilot...
                </>
              ) : isAutopilotActive ? (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Launch New Autopilot Campaign
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-5 w-5" />
                  Launch Autopilot (One-Click)
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Automatically generates affiliate links, activates traffic sources, and optimizes for conversions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Autopilot Works</CardTitle>
          <CardDescription>Fully automated affiliate marketing on autopilot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
              <div>
                <h4 className="font-semibold">Auto-Select High-Converting Products</h4>
                <p className="text-sm text-muted-foreground">System automatically selects top-performing products from multiple affiliate networks</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
              <div>
                <h4 className="font-semibold">Generate Affiliate Links</h4>
                <p className="text-sm text-muted-foreground">Creates tracked affiliate links with analytics for each product</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
              <div>
                <h4 className="font-semibold">Activate Free Traffic Sources</h4>
                <p className="text-sm text-muted-foreground">Deploys SEO, social media, content marketing, and email campaigns</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">4</div>
              <div>
                <h4 className="font-semibold">Monitor & Optimize</h4>
                <p className="text-sm text-muted-foreground">AI continuously monitors performance and auto-adjusts for maximum ROI</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}