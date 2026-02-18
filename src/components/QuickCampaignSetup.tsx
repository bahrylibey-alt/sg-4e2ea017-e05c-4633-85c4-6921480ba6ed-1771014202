import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rocket, Link, Zap, Target, TrendingUp, Users, Sparkles, Plus, X, Check } from "lucide-react";
import { smartCampaignService, type CampaignTemplate } from "@/services/smartCampaignService";
import { useToast } from "@/hooks/use-toast";

export function QuickCampaignSetup() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [productUrls, setProductUrls] = useState<string[]>([""]);
  const [isCreating, setIsCreating] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<any>(null);

  const templates = smartCampaignService.getTemplates();

  const handleAddUrl = () => {
    setProductUrls([...productUrls, ""]);
  };

  const handleRemoveUrl = (index: number) => {
    setProductUrls(productUrls.filter((_, i) => i !== index));
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...productUrls];
    newUrls[index] = value;
    setProductUrls(newUrls);
  };

  const handleQuickSetup = async () => {
    const validUrls = productUrls.filter(url => url.trim() !== "");
    
    if (validUrls.length === 0) {
      toast({
        title: "No Products",
        description: "Please add at least one product URL",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      const result = await smartCampaignService.createQuickCampaign({
        productUrls: validUrls,
        templateId: selectedTemplate?.id
      });

      if (result.success && result.campaign) {
        setCreatedCampaign(result.campaign);
        toast({
          title: "🎉 Campaign Created!",
          description: `${result.campaign.name} is now live with ${result.affiliateLinks.length} affiliate links`,
        });
      } else {
        toast({
          title: "Campaign Creation Failed",
          description: result.error || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case "sales": return <TrendingUp className="h-4 w-4" />;
      case "leads": return <Users className="h-4 w-4" />;
      case "traffic": return <Target className="h-4 w-4" />;
      case "awareness": return <Sparkles className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  if (createdCampaign) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-2xl">Campaign Live!</CardTitle>
              <CardDescription>Your campaign is running successfully</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Campaign Name</span>
              <span className="font-medium">{createdCampaign.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Goal</span>
              <Badge>{createdCampaign.goal}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Budget</span>
              <span className="font-medium">${createdCampaign.budget}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="font-medium">{createdCampaign.duration_days} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="outline" className="border-green-500 text-green-500">Active</Badge>
            </div>
          </div>

          <Button 
            onClick={() => {
              setCreatedCampaign(null);
              setProductUrls([""]);
              setSelectedTemplate(null);
            }}
            className="w-full"
          >
            Create Another Campaign
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            One-Click Campaign Setup
          </CardTitle>
          <CardDescription>
            Create a complete affiliate campaign in seconds with smart automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="quick" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quick">Quick Setup</TabsTrigger>
              <TabsTrigger value="templates">Choose Template</TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="space-y-6 mt-6">
              <div className="space-y-4">
                <Label>Product URLs</Label>
                <p className="text-sm text-muted-foreground">
                  Add your affiliate product URLs. We'll automatically generate tracking links and create your campaign.
                </p>
                
                <div className="space-y-3">
                  {productUrls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="https://example.com/product"
                        value={url}
                        onChange={(e) => handleUrlChange(index, e.target.value)}
                        className="flex-1"
                      />
                      {productUrls.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveUrl(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={handleAddUrl}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Product
                </Button>
              </div>

              {selectedTemplate && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        {getGoalIcon(selectedTemplate.goal)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{selectedTemplate.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedTemplate.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="secondary">
                            ${selectedTemplate.suggestedBudget} budget
                          </Badge>
                          <Badge variant="secondary">
                            {selectedTemplate.suggestedDuration} days
                          </Badge>
                          <Badge variant="secondary">
                            {selectedTemplate.defaultChannels.length} channels
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleQuickSetup}
                disabled={isCreating || productUrls.every(url => !url.trim())}
                className="w-full"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                    Creating Campaign...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Launch Campaign Now
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4 mt-6">
              <p className="text-sm text-muted-foreground">
                Choose a pre-configured template optimized for your specific goal
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedTemplate?.id === template.id ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          {getGoalIcon(template.goal)}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Budget</span>
                          <span className="font-medium">${template.suggestedBudget}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-medium">{template.suggestedDuration} days</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Channels</span>
                          <span className="font-medium">{template.defaultChannels.length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedTemplate && (
                <Button
                  onClick={() => {
                    const tabTrigger = document.querySelector('[value="quick"]') as HTMLElement;
                    tabTrigger?.click();
                  }}
                  className="w-full"
                  size="lg"
                >
                  Continue with {selectedTemplate.name}
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}