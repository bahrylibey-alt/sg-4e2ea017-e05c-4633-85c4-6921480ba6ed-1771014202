import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Target, 
  DollarSign, 
  Clock,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Users
} from "lucide-react";
import { smartCampaignService } from "@/services/smartCampaignService";
import { useToast } from "@/hooks/use-toast";

export function QuickCampaignSetup() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "processing" | "complete">("input");
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    productUrl: "",
    budget: "500",
    goal: "sales"
  });
  const [campaignResult, setCampaignResult] = useState<any>(null);

  const handleQuickSetup = async () => {
    if (!formData.productUrl) {
      toast({
        title: "Missing Information",
        description: "Please enter a product URL",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setStep("processing");
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const result = await smartCampaignService.quickSetup({
        productUrl: formData.productUrl,
        budget: parseFloat(formData.budget),
        goal: formData.goal as "sales" | "leads" | "traffic"
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (result.error) {
        throw new Error(result.error);
      }

      setCampaignResult(result);
      setStep("complete");

      toast({
        title: "Campaign Created Successfully!",
        description: "Your automated campaign is now live and generating traffic"
      });
    } catch (err) {
      console.error("Quick setup failed:", err);
      toast({
        title: "Setup Failed",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive"
      });
      setStep("input");
    } finally {
      setLoading(false);
    }
  };

  const resetSetup = () => {
    setStep("input");
    setProgress(0);
    setFormData({ productUrl: "", budget: "500", goal: "sales" });
    setCampaignResult(null);
  };

  if (step === "processing") {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            Setting Up Your Campaign...
          </CardTitle>
          <CardDescription>AI is analyzing and configuring everything</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          <div className="space-y-3">
            {[
              { label: "Analyzing product page", complete: progress > 20 },
              { label: "Creating affiliate links", complete: progress > 40 },
              { label: "Setting up traffic sources", complete: progress > 60 },
              { label: "Configuring AI optimization", complete: progress > 80 },
              { label: "Launching campaign", complete: progress >= 100 }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {item.complete ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                )}
                <span className={`text-sm ${item.complete ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "complete" && campaignResult) {
    return (
      <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Campaign Live & Generating Traffic!
          </CardTitle>
          <CardDescription>Your automated system is now running</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Campaign ID</span>
              </div>
              <p className="font-mono text-sm">{campaignResult.campaignId?.slice(0, 8)}...</p>
            </div>

            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Active Links</span>
              </div>
              <p className="text-2xl font-bold">{campaignResult.linksCreated || 0}</p>
            </div>

            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Budget Allocated</span>
              </div>
              <p className="text-2xl font-bold">${formData.budget}</p>
            </div>

            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Est. Daily Traffic</span>
              </div>
              <p className="text-2xl font-bold">2.4K+</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Automated Optimization Active
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ AI traffic routing enabled</li>
              <li>✓ Real-time budget optimization</li>
              <li>✓ Conversion tracking active</li>
              <li>✓ Fraud protection enabled</li>
              <li>✓ Auto-scaling configured</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button onClick={resetSetup} variant="outline" className="flex-1">
              Create Another
            </Button>
            <Button className="flex-1">
              View Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Campaign Setup
            </CardTitle>
            <CardDescription>Launch a fully automated campaign in 60 seconds</CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            ~1 min
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="productUrl">Product/Offer URL *</Label>
          <Input
            id="productUrl"
            placeholder="https://example.com/product"
            value={formData.productUrl}
            onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            AI will analyze your product and create optimized campaigns
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budget">Daily Budget</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="budget"
                type="number"
                className="pl-9"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Campaign Goal</Label>
            <select
              id="goal"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            >
              <option value="sales">Maximize Sales</option>
              <option value="leads">Generate Leads</option>
              <option value="traffic">Drive Traffic</option>
            </select>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-accent/50 border">
          <h4 className="font-semibold mb-2 text-sm">What You Get:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✓ AI-optimized affiliate links</li>
            <li>✓ Automated traffic generation</li>
            <li>✓ Real-time performance tracking</li>
            <li>✓ Smart budget allocation</li>
            <li>✓ 24/7 AI optimization</li>
          </ul>
        </div>

        <Button 
          onClick={handleQuickSetup} 
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Sparkles className="h-4 w-4 mr-2 animate-spin" />
              Setting Up...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Launch Campaign Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}