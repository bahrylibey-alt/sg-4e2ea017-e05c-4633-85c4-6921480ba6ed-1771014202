import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Target, 
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Rocket,
  AlertCircle
} from "lucide-react";
import { smartCampaignService } from "@/services/smartCampaignService";
import { useToast } from "@/hooks/use-toast";

interface CampaignBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function CampaignBuilder({ open, onOpenChange, onComplete }: CampaignBuilderProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
      setStep(2);
    }
  };

  const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return "";
    
    // If already has protocol, return as is
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    
    // Add https:// by default
    return `https://${trimmed}`;
  };

  const validateUrls = (urls: string[]): { valid: boolean; errors: string[]; normalizedUrls: string[] } => {
    const errors: string[] = [];
    const normalizedUrls: string[] = [];
    
    if (urls.length === 0) {
      errors.push("Please provide at least one product URL");
      return { valid: false, errors, normalizedUrls };
    }

    urls.forEach((url, index) => {
      if (!url.trim()) {
        errors.push(`Line ${index + 1}: Empty URL`);
        return;
      }

      const normalized = normalizeUrl(url);
      
      try {
        const urlObj = new URL(normalized);
        
        // Check if it's a valid domain
        if (!urlObj.hostname || urlObj.hostname.length < 3 || !urlObj.hostname.includes(".")) {
          errors.push(`Line ${index + 1}: Invalid domain - "${url.trim()}"`);
          return;
        }
        
        normalizedUrls.push(normalized);
      } catch {
        errors.push(`Line ${index + 1}: Invalid URL format - "${url.trim()}". Example: amazon.com/product or https://example.com/item`);
      }
    });

    return { valid: errors.length === 0, errors, normalizedUrls };
  };

  const handleCreateCampaign = async () => {
    setError(null);
    
    // Validation
    if (!formData.name || formData.name.trim().length === 0) {
      setError("Campaign name is required");
      toast({
        title: "Missing Information",
        description: "Please provide a campaign name",
        variant: "destructive"
      });
      return;
    }

    if (!formData.productUrls || formData.productUrls.trim().length === 0) {
      setError("Product URLs are required");
      toast({
        title: "Missing Information",
        description: "Please provide at least one product URL",
        variant: "destructive"
      });
      return;
    }

    const urls = formData.productUrls
      .split("\n")
      .map(url => url.trim())
      .filter(url => url.length > 0);

    const validation = validateUrls(urls);
    if (!validation.valid) {
      const errorMsg = validation.errors.join("\n");
      setError(errorMsg);
      toast({
        title: "Invalid URLs",
        description: "Please fix the URL errors and try again",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log("🚀 Creating campaign with normalized URLs:", validation.normalizedUrls);
      
      const result = await smartCampaignService.createQuickCampaign({
        productUrls: validation.normalizedUrls,
        customGoal: formData.goal,
        customBudget: parseFloat(formData.budget)
      });

      console.log("📊 Campaign result:", result);

      if (result.success && result.campaign) {
        toast({
          title: "Campaign Created Successfully!",
          description: `${result.affiliateLinks.length} affiliate links created. Traffic automation is now active.`
        });
        setError(null);
        setStep(4);
        onComplete?.();
      } else {
        throw new Error(result.error || "Failed to create campaign");
      }
    } catch (err) {
      console.error("❌ Campaign creation error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Campaign Creation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setError(null);
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  const resetAndClose = () => {
    setStep(1);
    setError(null);
    setFormData({
      name: "",
      goal: "sales",
      budget: "500",
      duration: "14",
      targetAudience: "",
      productUrls: "",
      channels: []
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            Smart Campaign Builder
          </DialogTitle>
          <DialogDescription>
            Launch optimized campaigns across multiple channels with AI assistance
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="mb-6">
            <Progress value={(step / 4) * 100} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground uppercase tracking-wider">
              <span className={step >= 1 ? "text-primary font-bold" : ""}>Template</span>
              <span className={step >= 2 ? "text-primary font-bold" : ""}>Details</span>
              <span className={step >= 3 ? "text-primary font-bold" : ""}>Configure</span>
              <span className={step >= 4 ? "text-primary font-bold" : ""}>Launch</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <Card 
                    key={template.id}
                    className="cursor-pointer hover:border-primary transition-all hover:shadow-md group relative overflow-hidden"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="secondary">{template.goal}</Badge>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="text-muted-foreground">Est. Budget</span>
                          <span className="font-medium">${template.suggestedBudget}</span>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-medium">{template.suggestedDuration} days</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {template.defaultChannels.slice(0, 3).map((channel, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{channel.name}</Badge>
                          ))}
                          {template.defaultChannels.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{template.defaultChannels.length - 3}</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary" onClick={nextStep}>
                Skip templates and start from scratch
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid gap-4">
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
                    placeholder="amazon.com/product1&#10;example.com/product2&#10;https://shop.com/item"
                    rows={5}
                    value={formData.productUrls}
                    onChange={(e) => setFormData({ ...formData, productUrls: e.target.value })}
                  />
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 mt-2">
                    <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">💡 URL Tips:</p>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• You can paste URLs with or without http:// or https://</li>
                      <li>• Examples: "amazon.com/dp/B08X123" or "https://shop.com/product"</li>
                      <li>• The system will automatically add https:// if needed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={prevStep}>Back</Button>
                <Button onClick={nextStep}>
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
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
                  <Label htmlFor="audience">Target Audience Description</Label>
                  <Textarea
                    id="audience"
                    placeholder="e.g., Young professionals aged 25-40, interested in fitness and wellness"
                    rows={3}
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">AI uses this to find the right people across networks.</p>
                </div>

                <div className="space-y-2">
                  <Label>Active Traffic Channels</Label>
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
                          className="rounded border-primary text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium">{channel.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={prevStep}>Back</Button>
                <Button onClick={handleCreateCampaign} disabled={loading} size="lg" className="bg-primary hover:bg-primary/90">
                  {loading ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Creating Campaign...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Launch Campaign
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-green-700">Campaign Launched Successfully!</h3>
                <p className="text-muted-foreground mt-2">Your automated system is now live. First results expected in ~15 mins.</p>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="p-4 rounded-lg bg-secondary/20 border">
                  <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xl font-bold">Active</p>
                  <p className="text-xs text-muted-foreground">Status</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/20 border">
                  <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xl font-bold">~5.2K</p>
                  <p className="text-xs text-muted-foreground">Daily Traffic</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/20 border">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xl font-bold">24/7</p>
                  <p className="text-xs text-muted-foreground">Optimizing</p>
                </div>
              </div>

              <Button onClick={resetAndClose} size="lg" className="w-full max-w-md">
                Return to Dashboard
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}