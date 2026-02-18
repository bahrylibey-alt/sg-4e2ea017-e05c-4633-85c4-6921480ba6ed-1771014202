import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Zap, Sparkles, TrendingUp, Target, DollarSign, CheckCircle2, Loader2, ExternalLink, Copy, BarChart3 } from "lucide-react";
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

  const handleQuickSetup = async () => {
    if (!productUrl || !productUrl.startsWith("http")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid product URL starting with http:// or https://",
        variant: "destructive"
      });
      return;
    }

    setStep("processing");
    setProgress(0);

    const progressSteps = [
      { percent: 15, message: "🔍 Analyzing product URL and extracting data..." },
      { percent: 30, message: "🎯 Creating optimized campaign structure..." },
      { percent: 50, message: "🔗 Generating trackable affiliate links..." },
      { percent: 65, message: "📊 Setting up analytics and conversion tracking..." },
      { percent: 80, message: "🚀 Configuring automated traffic sources..." },
      { percent: 95, message: "✨ Activating AI optimization engine..." },
      { percent: 100, message: "✅ Campaign is live and running!" }
    ];

    for (const progressStep of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setProgress(progressStep.percent);
      setProgressMessage(progressStep.message);
    }

    try {
      const result = await smartCampaignService.quickSetup({
        productUrl,
        goal: campaignGoal
      });

      if (result.success && result.campaign) {
        setCampaignResult(result);
        setStep("success");
        toast({
          title: "🎉 Campaign Launched Successfully!",
          description: `${result.campaign.name} is now live and generating traffic.`
        });
      } else {
        toast({
          title: "Campaign Creation Failed",
          description: result.error || "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
        setStep("input");
        setProgress(0);
      }
    } catch (error) {
      console.error("Campaign creation error:", error);
      toast({
        title: "System Error",
        description: "Failed to create campaign. Please check your connection and try again.",
        variant: "destructive"
      });
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
            Revolutionary One-Click System
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Launch Your Campaign in <span className="text-primary">30 Seconds</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            AI-powered automation with real-time traffic generation & conversion optimization
          </p>
        </div>

        {step === "input" && (
          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="w-6 h-6 text-primary" />
                Smart Campaign Builder
              </CardTitle>
              <CardDescription>
                Enter your product URL and let our AI handle everything else
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="product-url" className="text-base">
                  Product or Affiliate URL *
                </Label>
                <Input
                  id="product-url"
                  placeholder="https://example.com/product-page"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="h-12 text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Enter any product URL from Amazon, ClickBank, ShareASale, or your own site
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal" className="text-base">
                  Primary Campaign Goal
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
                          <div className="text-xs text-muted-foreground">High-converting traffic to drive revenue</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="leads">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Generate Leads</div>
                          <div className="text-xs text-muted-foreground">Build email list and capture prospects</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="traffic">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Drive Traffic</div>
                          <div className="text-xs text-muted-foreground">Maximize visitors and brand exposure</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert className="bg-primary/5 border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <AlertDescription>
                  <strong>🤖 AI Autopilot Will Automatically:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Generate cloaked tracking links with conversion pixels</li>
                    <li>• Deploy traffic to 5+ high-converting channels</li>
                    <li>• Set up real-time analytics dashboard</li>
                    <li>• Activate retargeting campaigns</li>
                    <li>• Optimize budget allocation across channels</li>
                    <li>• Launch A/B tests for continuous improvement</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleQuickSetup}
                size="lg"
                className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                <Zap className="w-5 h-5 mr-2" />
                Launch Campaign Now
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                No credit card required • Free trial included
              </p>
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
                  <h3 className="text-2xl font-bold mb-2">Building Your Campaign</h3>
                  <p className="text-muted-foreground">{progressMessage}</p>
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-muted-foreground">{progress}% Complete</p>
                </div>
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto text-xs text-muted-foreground">
                  <div className={progress >= 30 ? "text-primary font-medium" : ""}>
                    ✓ Campaign Structure
                  </div>
                  <div className={progress >= 65 ? "text-primary font-medium" : ""}>
                    ✓ Tracking Setup
                  </div>
                  <div className={progress >= 100 ? "text-primary font-medium" : ""}>
                    ✓ Traffic Automation
                  </div>
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
                  <h3 className="text-3xl font-bold mb-2">🎉 Campaign Is Live!</h3>
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
                      <div className="text-sm text-muted-foreground">Tracking Links</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-accent/5">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-accent">
                        {campaignResult.trafficSources?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Traffic Channels</div>
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
                      <CardTitle className="text-lg">Your Tracking Links</CardTitle>
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

                {campaignResult.optimizations && campaignResult.optimizations.length > 0 && (
                  <Alert className="text-left max-w-2xl mx-auto">
                    <BarChart3 className="w-4 h-4" />
                    <AlertDescription>
                      <strong>🎯 AI Optimization Insights:</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        {campaignResult.optimizations.map((rec: string, idx: number) => (
                          <li key={idx}>• {rec}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4 justify-center flex-wrap">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Create Another Campaign
                  </Button>
                  <Button
                    onClick={() => window.location.href = "/dashboard"}
                    size="lg"
                    className="bg-primary"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics Dashboard
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
                Complete campaign launch faster than making coffee
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-accent" />
              <h3 className="font-semibold mb-2">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">
                Machine learning optimizes every aspect automatically
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Target className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">Real-Time Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor every click, conversion, and dollar earned
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}