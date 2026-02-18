import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { smartCampaignService } from "@/services/smartCampaignService";
import { useToast } from "@/hooks/use-toast";

interface CampaignBuilderProps {
  onComplete?: () => void;
}

export function CampaignBuilder({ onComplete }: CampaignBuilderProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    goal: "sales" as "sales" | "leads" | "traffic" | "awareness",
    budget: "500",
    duration: "14",
    targetAudience: "",
    productUrls: "",
    channels: [] as string[]
  });

  const templates = smartCampaignService.getTemplates();

  const handleTemplateSelect = (templateId: string) => {
    const template = smartCampaignService.getTemplate(templateId);
    if (template) {
      setFormData({
        ...formData,
        goal: template.goal,
        budget: template.suggestedBudget.toString(),
        duration: template.suggestedDuration.toString(),
        targetAudience: template.targetAudience,
        channels: template.defaultChannels.map(c => c.id)
      });
      setStep(2);
    }
  };

  const handleCreateCampaign = async () => {
    if (!formData.name || !formData.productUrls) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const urls = formData.productUrls.split("\n").filter(url => url.trim());
      
      const result = await smartCampaignService.createQuickCampaign({
        productUrls: urls,
        customGoal: formData.goal,
        customBudget: parseFloat(formData.budget)
      });

      if (result.success) {
        toast({
          title: "Campaign Created!",
          description: "Your automated campaign is now live"
        });
        setStep(4);
        onComplete?.();
      } else {
        throw new Error(result.error || "Failed to create campaign");
      }
    } catch (err) {
      toast({
        title: "Creation Failed",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Smart Campaign Builder</h2>
          <p className="text-muted-foreground">Create optimized campaigns with AI assistance</p>
          
          <div className="mt-6">
            <Progress value={(step / 4) * 100} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span className={step >= 1 ? "text-primary font-medium" : ""}>1. Template</span>
              <span className={step >= 2 ? "text-primary font-medium" : ""}>2. Details</span>
              <span className={step >= 3 ? "text-primary font-medium" : ""}>3. Configure</span>
              <span className={step >= 4 ? "text-primary font-medium" : ""}>4. Launch</span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Campaign Template</CardTitle>
              <CardDescription>Select a pre-optimized template or start from scratch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <Card 
                    key={template.id}
                    className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge>{template.goal}</Badge>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Budget</span>
                          <span className="font-medium">${template.suggestedBudget}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-medium">{template.suggestedDuration} days</span>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          {template.defaultChannels.slice(0, 3).map((channel, idx) => (
                            <Badge key={idx} variant="outline">{channel.name}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4" onClick={nextStep}>
                Start from Scratch
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Basic information about your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Sale 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goal">Campaign Goal</Label>
                  <select
                    id="goal"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value as any })}
                  >
                    <option value="sales">Maximize Sales</option>
                    <option value="leads">Generate Leads</option>
                    <option value="traffic">Drive Traffic</option>
                    <option value="awareness">Brand Awareness</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget ($)</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="productUrls">Product URLs * (one per line)</Label>
                <Textarea
                  id="productUrls"
                  placeholder="https://example.com/product1&#10;https://example.com/product2"
                  rows={4}
                  value={formData.productUrls}
                  onChange={(e) => setFormData({ ...formData, productUrls: e.target.value })}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  Back
                </Button>
                <Button onClick={nextStep} className="flex-1">
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
              <CardDescription>Customize your campaign settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Campaign Duration (days)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="duration"
                    type="number"
                    className="pl-9"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Textarea
                  id="audience"
                  placeholder="e.g., Young professionals aged 25-40, interested in fitness and wellness"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Traffic Channels</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "social", name: "Social Media" },
                    { id: "email", name: "Email Marketing" },
                    { id: "paid-ads", name: "Paid Ads" },
                    { id: "seo", name: "SEO" },
                    { id: "influencer", name: "Influencers" },
                    { id: "blog", name: "Content" }
                  ].map((channel) => (
                    <label key={channel.id} className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes(channel.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, channels: [...formData.channels, channel.id] });
                          } else {
                            setFormData({ ...formData, channels: formData.channels.filter(c => c !== channel.id) });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{channel.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleCreateCampaign} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Launch Campaign
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Campaign Successfully Launched!
              </CardTitle>
              <CardDescription>Your automated system is now live and generating results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-background border text-center">
                  <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">Active</p>
                  <p className="text-xs text-muted-foreground">Campaign Status</p>
                </div>
                <div className="p-4 rounded-lg bg-background border text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">5.2K+</p>
                  <p className="text-xs text-muted-foreground">Est. Daily Traffic</p>
                </div>
                <div className="p-4 rounded-lg bg-background border text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">24/7</p>
                  <p className="text-xs text-muted-foreground">AI Optimization</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold mb-2">Automated Features Active:</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Traffic generation across all channels
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Real-time budget optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Conversion tracking and analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Fraud detection and prevention
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    A/B testing and optimization
                  </li>
                </ul>
              </div>

              <Button onClick={() => window.location.reload()} className="w-full" size="lg">
                View Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}