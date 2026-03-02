import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Zap, Sparkles, TrendingUp, Target, DollarSign, CheckCircle2, Loader2, ExternalLink, Copy, BarChart3, AlertCircle } from "lucide-react";
import { smartCampaignService } from "@/services/smartCampaignService";
import { useToast } from "@/hooks/use-toast";

export function OneClickCampaign() {
  const { toast } = useToast();
  const [step, setStep] = useState<"input" | "processing" | "success">("input");
  const [productUrl, setProductUrl] = useState("");
  const [campaignGoal, setCampaignGoal] = useState<"sales" | "leads" | "traffic">("sales");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [campaignResult, setCampaignResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

    if (!productUrl.trim()) {
      setError("Please enter a product URL");
      return;
    }

    if (!validateUrl(productUrl)) {
      setError("Please enter a valid URL (e.g., amazon.com/product or https://yoursite.com/offer)");
      return;
    }

    setStep("processing");
    setProgress(0);

    const progressSteps = [
      { percent: 15, message: "🔍 Analyzing product and creating campaign structure..." },
      { percent: 30, message: "🔗 Generating trackable affiliate links..." },
      { percent: 50, message: "🚀 Setting up automated traffic sources..." },
      { percent: 70, message: "📊 Configuring analytics and tracking..." },
      { percent: 90, message: "✨ Activating AI optimization..." },
      { percent: 100, message: "✅ Campaign is live!" }
    ];

    for (const progressStep of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(progressStep.percent);
      setProgressMessage(progressStep.message);
    }

    try {
      const normalizedUrl = normalizeUrl(productUrl);
      console.log("🚀 Creating campaign with URL:", normalizedUrl);

      const result = await smartCampaignService.quickSetup({
        productUrl: normalizedUrl,
        goal: campaignGoal
      });

      console.log("✅ Campaign result:", result);

      if (result.success && result.campaign) {
        setCampaignResult(result);
        setStep("success");
        toast({
          title: "🎉 Campaign Live!",
          description: `${result.campaign.name} is generating traffic`
        });
      } else {
        console.error("❌ Failed:", result.error);
        setError(result.error || "Failed to create campaign");
        setStep("input");
        setProgress(0);
      }
    } catch (err) {
      console.error("💥 Error:", err);
      setError("System error. Please try again.");
      setStep("input");
      setProgress(0);
    }
  };

  const handleReset = () => {
    setStep("input");
    setProductUrl("");
    setCampaignGoal("sales");
    setProgress(0);
    setProgressMessage("");
    setCampaignResult(null);
    setError(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard"
    });
  };

  return (
    <div className="container py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-primary to-accent text-white">
            <Zap className="w-3 h-3 mr-1" />
            One-Click Automation
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Launch in <span className="text-primary">30 Seconds</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Real traffic generation & conversion tracking
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
              {error.includes("logged in") && (
                <span className="block mt-2 text-sm">💡 Please sign in first, then try again.</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {step === "input" && (
          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="w-6 h-6 text-primary" />
                Quick Campaign Setup
              </CardTitle>
              <CardDescription>
                Enter your affiliate product URL and launch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="product-url" className="text-base">
                  Product or Affiliate URL *
                </Label>
                <Input
                  id="product-url"
                  placeholder="amazon.com/dp/B123 or https://yoursite.com/product"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="h-12 text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Works with Amazon, ClickBank, ShareASale, CJ, or any affiliate URL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal" className="text-base">
                  Campaign Goal
                </Label>
                <Select value={campaignGoal} onValueChange={(value: any) => setCampaignGoal(value)}>
                  <SelectTrigger id="goal" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Maximize Sales</div>
                          <div className="text-xs text-muted-foreground">High-converting traffic</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="leads">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Generate Leads</div>
                          <div className="text-xs text-muted-foreground">Build email list</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="traffic">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Drive Traffic</div>
                          <div className="text-xs text-muted-foreground">Maximum visitors</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert className="bg-primary/5 border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <AlertDescription>
                  <strong>🤖 Automated System Will:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Generate trackable affiliate links</li>
                    <li>• Deploy traffic to multiple channels</li>
                    <li>• Set up conversion tracking</li>
                    <li>• Activate real-time analytics</li>
                    <li>• Optimize budget automatically</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleQuickSetup}
                size="lg"
                className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <Zap className="w-5 h-5 mr-2" />
                Launch Campaign Now
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "processing" && (
          <Card className="shadow-xl border-2">
            <CardContent className="py-16">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    <Sparkles className="w-8 h-8 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Building Campaign</h3>
                  <p className="text-muted-foreground">{progressMessage}</p>
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-muted-foreground">{progress}% Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "success" && campaignResult && (
          <Card className="shadow-xl border-2 border-green-500">
            <CardContent className="py-12">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-2">🎉 Campaign Live!</h3>
                  <p className="text-xl text-muted-foreground">
                    {campaignResult.campaign?.name || "Your Campaign"}
                  </p>
                </div>

                <div className="grid md:grid-cols-4 gap-4 max-w-lg mx-auto">
                  <Card className="bg-primary/5">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-primary">
                        {campaignResult.affiliateLinks?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Links</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-accent/5">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-accent">
                        {campaignResult.trafficSources?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Channels</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-500/5">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-green-500">
                        {campaignResult.estimatedReach?.toLocaleString() || "0"}
                      </div>
                      <div className="text-sm text-muted-foreground">Daily Reach</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-500/5">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-blue-500">
                        ${campaignResult.campaign?.budget || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Budget</div>
                    </CardContent>
                  </Card>
                </div>

                {campaignResult.affiliateLinks && campaignResult.affiliateLinks.length > 0 && (
                  <Card className="text-left max-w-2xl mx-auto">
                    <CardHeader>
                      <CardTitle className="text-lg">Tracking Links</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {campaignResult.affiliateLinks.map((link: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <div className="flex-1 truncate">
                            <div className="font-medium text-sm">{link.product_name}</div>
                            <div className="text-xs text-muted-foreground font-mono truncate">
                              {link.cloaked_url}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(link.cloaked_url)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(link.cloaked_url, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-4 justify-center flex-wrap">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Create Another
                  </Button>
                  <Button
                    onClick={() => window.location.href = "/dashboard"}
                    size="lg"
                    className="bg-primary"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">30-Second Setup</h3>
              <p className="text-sm text-muted-foreground">
                Fastest campaign launch in the industry
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-accent" />
              <h3 className="font-semibold mb-2">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">
                Automated optimization & traffic routing
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Target className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">Real Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor clicks, conversions & earnings
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}