import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Target, DollarSign, Sparkles, Zap, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";
import { aiOptimizationEngine } from "@/services/aiOptimizationEngine";
import { budgetOptimizationService } from "@/services/budgetOptimizationService";
import { useToast } from "@/hooks/use-toast";

export function SmartTools() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasActiveCampaigns, setHasActiveCampaigns] = useState(false);
  const [isCheckingCampaigns, setIsCheckingCampaigns] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingCampaigns(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      setIsAuthenticated(!!session);
      
      if (session) {
        // User is logged in - check for campaigns
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .limit(1);

        setHasActiveCampaigns(campaigns && campaigns.length > 0);
      } else {
        // User not logged in - don't show campaign errors
        setHasActiveCampaigns(false);
      }
      
      setIsCheckingCampaigns(false);
    };

    checkAuth();
  }, []);

  const handleProductDiscovery = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to use Smart Product Discovery",
        variant: "destructive"
      });
      return;
    }

    if (!hasActiveCampaigns) {
      toast({
        title: "No Active Campaigns",
        description: "Create a campaign on the dashboard first",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .limit(1);

      if (!campaigns || campaigns.length === 0) {
        toast({
          title: "No Campaigns Found",
          description: "Please create a campaign first",
          variant: "destructive"
        });
        return;
      }

      const result = await smartProductDiscovery.discoverProducts({
        campaignId: campaigns[0].id,
        niche: "trending",
        minCommission: 5,
        networks: ["Amazon Associates", "Temu Affiliate"]
      });

      toast({
        title: "Products Discovered!",
        description: `Found ${result.products?.length || 0} trending products`,
      });
    } catch (error: any) {
      console.error("Product discovery error:", error);
      toast({
        title: "Discovery Failed",
        description: error.message || "Failed to discover products",
        variant: "destructive"
      });
    }
  };

  const handleCampaignOptimizer = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to use AI Campaign Optimizer",
        variant: "destructive"
      });
      return;
    }

    if (!hasActiveCampaigns) {
      toast({
        title: "No Active Campaigns",
        description: "Create a campaign on the dashboard first",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .limit(1);

      if (!campaigns || campaigns.length === 0) {
        toast({
          title: "No Campaigns Found",
          description: "Please create a campaign first",
          variant: "destructive"
        });
        return;
      }

      const result = await aiOptimizationEngine.optimizeCampaign(campaigns[0].id);

      toast({
        title: "Campaign Optimized!",
        description: `Applied ${result.optimizationsApplied || 0} optimizations`,
      });
    } catch (error: any) {
      console.error("Optimization error:", error);
      toast({
        title: "Optimization Failed",
        description: error.message || "Failed to optimize campaign",
        variant: "destructive"
      });
    }
  };

  const handleRevenueMaximizer = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to use Revenue Maximizer",
        variant: "destructive"
      });
      return;
    }

    if (!hasActiveCampaigns) {
      toast({
        title: "No Active Campaigns",
        description: "Create a campaign on the dashboard first",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, budget')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .limit(1);

      if (!campaigns || campaigns.length === 0) {
        toast({
          title: "No Campaigns Found",
          description: "Please create a campaign first",
          variant: "destructive"
        });
        return;
      }

      const result = await budgetOptimizationService.optimizeBudget({
        campaignId: campaigns[0].id,
        totalBudget: campaigns[0].budget || 500,
        optimizationGoal: "revenue"
      });

      toast({
        title: "Budget Optimized!",
        description: `ROI improvement: +${result.improvement || 0}%`,
      });
    } catch (error: any) {
      console.error("Revenue optimization error:", error);
      toast({
        title: "Optimization Failed",
        description: error.message || "Failed to optimize revenue",
        variant: "destructive"
      });
    }
  };

  return (
    <section className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            AI-Powered Smart Tools
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Automated tools that work 24/7 to grow your affiliate revenue
          </p>
        </div>

        {!isCheckingCampaigns && isAuthenticated && !hasActiveCampaigns && (
          <Alert className="mb-8 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Get Started:</strong> Create your first campaign on the dashboard to unlock these smart tools.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Smart Product Discovery</CardTitle>
              <CardDescription>
                Find and add trending products automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li>✓ AI finds high-converting products</li>
                <li>✓ Analyzes market trends daily</li>
                <li>✓ Auto-adds to your campaigns</li>
                <li>✓ Filters by commission rate</li>
              </ul>
              <Button 
                onClick={handleProductDiscovery}
                className="w-full"
                disabled={!isAuthenticated || !hasActiveCampaigns}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Run Tool
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-primary/20">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>AI Campaign Optimizer</CardTitle>
              <CardDescription>
                Optimize campaigns for maximum revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li>✓ Analyzes performance data</li>
                <li>✓ Adjusts budgets automatically</li>
                <li>✓ A/B tests product pages</li>
                <li>✓ Improves conversion rates</li>
              </ul>
              <Button 
                onClick={handleCampaignOptimizer}
                className="w-full bg-accent hover:bg-accent/90"
                disabled={!isAuthenticated || !hasActiveCampaigns}
              >
                <Zap className="w-4 h-4 mr-2" />
                Run Tool
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Revenue Maximizer</CardTitle>
              <CardDescription>
                Maximize revenue across all campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li>✓ Smart budget allocation</li>
                <li>✓ ROI-based prioritization</li>
                <li>✓ Cross-campaign optimization</li>
                <li>✓ Profit margin analysis</li>
              </ul>
              <Button 
                onClick={handleRevenueMaximizer}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!isAuthenticated || !hasActiveCampaigns}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Run Tool
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}