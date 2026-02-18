import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Zap, Sparkles, TrendingUp, Target, DollarSign, CheckCircle2, Loader2 } from "lucide-react";
import { smartCampaignService } from "@/services/smartCampaignService";

export function OneClickCampaign() {
  const [step, setStep] = useState<"input" | "processing" | "success">("input");
  const [productUrl, setProductUrl] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("sales");
  const [progress, setProgress] = useState(0);
  const [campaignResult, setCampaignResult] = useState<any>(null);

  const handleQuickSetup = async () => {
    if (!productUrl) {
      alert("Please enter a product URL");
      return;
    }

    setStep("processing");
    setProgress(0);

    // Simulate progress steps
    const progressSteps = [
      { percent: 20, message: "Analyzing product..." },
      { percent: 40, message: "Creating campaign structure..." },
      { percent: 60, message: "Generating affiliate links..." },
      { percent: 80, message: "Setting up tracking..." },
      { percent: 100, message: "Campaign ready!" }
    ];

    for (const progressStep of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(progressStep.percent);
    }

    // Create the campaign
    const result = await smartCampaignService.quickSetup({
      productUrl,
      goal: campaignGoal as any
    });

    if (result.success) {
      setCampaignResult(result);
      setStep("success");
    } else {
      alert("Failed to create campaign: " + result.error);
      setStep("input");
      setProgress(0);
    }
  };

  const handleReset = () => {
    setStep("input");
    setProductUrl("");
    setCampaignGoal("sales");
    setProgress(0);
    setCampaignResult(null);
  };

  return (
    <div className="container py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-primary to-accent text-white">
            <Zap className="w-3 h-3 mr-1" />
            One-Click Autopilot
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Launch Your Campaign in <span className="text-primary">30 Seconds</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            AI-powered campaign setup with automated optimization
          </p>
        </div>

        {step === "input" && (
          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="w-6 h-6 text-primary" />
                Quick Campaign Setup
              </CardTitle>
              <CardDescription>
                Just paste your product URL and let AI handle the rest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="product-url" className="text-base">
                  Product or Affiliate URL
                </Label>
                <Input
                  id="product-url"
                  placeholder="https://example.com/product"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal" className="text-base">
                  Campaign Goal
                </Label>
                <Select value={campaignGoal} onValueChange={setCampaignGoal}>
                  <SelectTrigger id="goal" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Maximize Sales
                      </div>
                    </SelectItem>
                    <SelectItem value="leads">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Generate Leads
                      </div>
                    </SelectItem>
                    <SelectItem value="traffic">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Drive Traffic
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert className="bg-primary/5 border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <AlertDescription>
                  <strong>AI will automatically:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Create optimized campaign structure</li>
                    <li>• Generate cloaked affiliate links</li>
                    <li>• Set up conversion tracking</li>
                    <li>• Recommend best channels & budget</li>
                    <li>• Configure automated optimization</li>
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
                    <Sparkles className="w-8 h-8 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Setting Up Your Campaign</h3>
                  <p className="text-muted-foreground">AI is working its magic...</p>
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
                  <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-2">Campaign Launched! 🎉</h3>
                  <p className="text-xl text-muted-foreground">
                    {campaignResult.campaign.name}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-primary">
                        {campaignResult.links?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Links Created</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-accent">
                        ${campaignResult.campaign.budget || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Budget</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-green-500">
                        {campaignResult.campaign.duration || 30}d
                      </div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                    </CardContent>
                  </Card>
                </div>

                {campaignResult.recommendations && campaignResult.recommendations.length > 0 && (
                  <Alert className="text-left max-w-2xl mx-auto">
                    <Sparkles className="w-4 h-4" />
                    <AlertDescription>
                      <strong>AI Recommendations:</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        {campaignResult.recommendations.map((rec: string, idx: number) => (
                          <li key={idx}>• {rec}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                  >
                    Create Another
                  </Button>
                  <Button
                    onClick={() => window.location.href = "/dashboard"}
                    size="lg"
                    className="bg-primary"
                  >
                    View Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Complete campaign setup in under 30 seconds
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-accent" />
              <h3 className="font-semibold mb-2">AI-Optimized</h3>
              <p className="text-sm text-muted-foreground">
                Smart recommendations based on data analysis
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Target className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">Auto-Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Real-time conversion tracking enabled automatically
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}