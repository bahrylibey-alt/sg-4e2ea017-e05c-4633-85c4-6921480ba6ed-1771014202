import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Zap, 
  Target, 
  DollarSign, 
  Clock,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Users,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { smartCampaignService } from "@/services/smartCampaignService";
import { useToast } from "@/hooks/use-toast";

export function QuickCampaignSetup() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "processing" | "complete">("input");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productUrl: "",
    budget: "500",
    goal: "sales" as "sales" | "leads" | "traffic"
  });
  const [campaignResult, setCampaignResult] = useState<any>(null);

  const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return "";
    
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    
    const withoutWww = trimmed.startsWith("www.") ? trimmed.substring(4) : trimmed;
    return `https://${withoutWww}`;
  };

  const validateUrl = (url: string): boolean => {
    try {
      const normalized = normalizeUrl(url);
      const urlObj = new URL(normalized);
      return urlObj.hostname.length > 0 && urlObj.hostname.includes(".");
    } catch {
      return false;
    }
  };

  const handleQuickSetup = async () => {
    setError(null);

    if (!formData.productUrl.trim()) {
      setError("Please enter a product URL");
      return;
    }

    if (!validateUrl(formData.productUrl)) {
      setError("Please enter a valid URL (e.g., amazon.com/product or https://yoursite.com/offer)");
      return;
    }

    setLoading(true);
    setStep("processing");
    setProgress(0);

    const progressSteps = [
      { percent: 20, message: "🔍 Analyzing product..." },
      { percent: 40, message: "🔗 Creating affiliate links..." },
      { percent: 60, message: "🚀 Setting up traffic sources..." },
      { percent: 80, message: "📊 Configuring tracking..." },
      { percent: 100, message: "✅ Campaign live!" }
    ];

    try {
      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 400));
        setProgress(step.percent);
      }

      const normalizedUrl = normalizeUrl(formData.productUrl);
      console.log("🚀 Creating quick campaign:", normalizedUrl);

      const result = await smartCampaignService.quickSetup({
        productUrl: normalizedUrl,
        budget: parseFloat(formData.budget),
        goal: formData.goal
      });

      console.log("✅ Campaign result:", result);

      if (result.success && result.campaign) {
        setCampaignResult(result);
        setStep("complete");
        toast({
          title: "🎉 Campaign Live!",
          description: `${result.campaign.name} is now generating traffic`
        });
      } else {
        console.error("❌ Failed:", result.error);
        setError(result.error || "Failed to create campaign");
        setStep("input");
        setProgress(0);
      }
    } catch (err) {
      console.error("💥 Error:", err);
      setError(err instanceof Error ? err.message : "System error. Please try again.");
      setStep("input");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const resetSetup = () => {
    setStep("input");
    setProgress(0);
    setError(null);
    setFormData({ productUrl: "", budget: "500", goal: "sales" });
    setCampaignResult(null);
  };

  if (step === "processing") {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            Building Your Campaign...
          </CardTitle>
          <CardDescription>AI is configuring everything automatically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
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
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 animate-pulse" />
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
          <CardDescription>{campaignResult.campaign?.name || "Your campaign"} is now active</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Active Links</span>
              </div>
              <p className="text-2xl font-bold">{campaignResult.affiliateLinks?.length || 0}</p>
            </div>

            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-accent" />
                <span className="text-sm text-muted-foreground">Traffic Channels</span>
              </div>
              <p className="text-2xl font-bold">{campaignResult.trafficSources?.length || 0}</p>
            </div>

            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Daily Budget</span>
              </div>
              <p className="text-2xl font-bold">${campaignResult.campaign?.budget || 0}</p>
            </div>

            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Est. Daily Reach</span>
              </div>
              <p className="text-2xl font-bold">{(campaignResult.estimatedReach || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Automated Features Active
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
            <Button onClick={() => window.location.href = "/dashboard"} className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
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
            <CardDescription>Launch automated campaigns in 60 seconds</CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            ~1 min
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
              {error.includes("logged in") && (
                <span className="block mt-2 text-sm">💡 Please sign in first, then try again.</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="productUrl">Product/Affiliate URL *</Label>
          <Input
            id="productUrl"
            placeholder="amazon.com/product or https://yoursite.com/offer"
            value={formData.productUrl}
            onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Works with any affiliate network: Amazon, ClickBank, ShareASale, CJ, etc.
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
              onChange={(e) => setFormData({ ...formData, goal: e.target.value as "sales" | "leads" | "traffic" })}
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