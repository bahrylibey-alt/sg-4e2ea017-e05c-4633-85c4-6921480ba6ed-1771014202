import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Rocket, Target, DollarSign, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

interface CampaignBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignBuilder({ open, onOpenChange }: CampaignBuilderProps) {
  const [step, setStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: "",
    goal: "sales",
    products: [] as string[],
    budget: "",
    duration: "30",
    targetAudience: "",
    channels: [] as string[],
    contentStrategy: ""
  });

  const [isCreating, setIsCreating] = useState(false);
  const [campaignCreated, setCampaignCreated] = useState(false);

  const productOptions = [
    "Premium WordPress Theme Bundle",
    "Complete Digital Marketing Course",
    "SEO Tools Suite",
    "E-commerce Starter Pack",
    "Fitness & Nutrition Program",
    "Photography Presets Collection"
  ];

  const channelOptions = [
    { id: "blog", name: "Blog Posts", icon: "📝" },
    { id: "email", name: "Email Marketing", icon: "📧" },
    { id: "social", name: "Social Media", icon: "📱" },
    { id: "youtube", name: "YouTube", icon: "🎥" },
    { id: "paid", name: "Paid Ads", icon: "💰" },
    { id: "influencer", name: "Influencer Marketing", icon: "⭐" }
  ];

  const handleProductToggle = (product: string) => {
    setCampaignData(prev => ({
      ...prev,
      products: prev.products.includes(product)
        ? prev.products.filter(p => p !== product)
        : [...prev.products, product]
    }));
  };

  const handleChannelToggle = (channelId: string) => {
    setCampaignData(prev => ({
      ...prev,
      channels: prev.channels.includes(channelId)
        ? prev.channels.filter(c => c !== channelId)
        : [...prev.channels, channelId]
    }));
  };

  const handleCreateCampaign = () => {
    setIsCreating(true);
    
    setTimeout(() => {
      setIsCreating(false);
      setCampaignCreated(true);
      
      setTimeout(() => {
        alert(
          `🎉 Campaign Created Successfully!\n\n` +
          `Campaign: ${campaignData.name}\n` +
          `Products: ${campaignData.products.length} selected\n` +
          `Channels: ${campaignData.channels.length} active\n` +
          `Budget: $${campaignData.budget}\n` +
          `Duration: ${campaignData.duration} days\n\n` +
          `Your campaign is now live and tracking conversions!`
        );
        
        onOpenChange(false);
        setCampaignCreated(false);
        setStep(1);
        setCampaignData({
          name: "",
          goal: "sales",
          products: [],
          budget: "",
          duration: "30",
          targetAudience: "",
          channels: [],
          contentStrategy: ""
        });
      }, 2000);
    }, 2000);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return campaignData.name && campaignData.goal;
      case 2:
        return campaignData.products.length > 0;
      case 3:
        return campaignData.channels.length > 0 && campaignData.targetAudience;
      case 4:
        return campaignData.budget && campaignData.duration;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Rocket className="w-6 h-6 text-primary" />
            Smart Campaign Builder
          </DialogTitle>
          <DialogDescription>
            Create a high-converting affiliate campaign in minutes with AI-powered recommendations
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                s < step ? "bg-green-500 text-white" :
                s === step ? "bg-primary text-white" :
                "bg-muted text-muted-foreground"
              }`}>
                {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 4 && <div className={`flex-1 h-1 mx-2 ${s < step ? "bg-green-500" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {/* Step 1: Campaign Basics */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Campaign Basics</h3>
                <p className="text-muted-foreground">Set up the foundation of your campaign</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  placeholder="e.g., Summer Product Launch 2026"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Primary Goal</Label>
                <Select value={campaignData.goal} onValueChange={(value) => setCampaignData(prev => ({ ...prev, goal: value }))}>
                  <SelectTrigger id="goal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Maximize Sales</SelectItem>
                    <SelectItem value="leads">Generate Leads</SelectItem>
                    <SelectItem value="traffic">Drive Traffic</SelectItem>
                    <SelectItem value="awareness">Build Awareness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Product Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Select Products</h3>
                <p className="text-muted-foreground">Choose which products to promote in this campaign</p>
              </div>

              <div className="grid gap-3">
                {productOptions.map((product) => (
                  <Card
                    key={product}
                    className={`cursor-pointer transition-all ${
                      campaignData.products.includes(product)
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => handleProductToggle(product)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          campaignData.products.includes(product)
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}>
                          {campaignData.products.includes(product) && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="font-medium">{product}</span>
                      </div>
                      <Badge variant="secondary">High Conv.</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Channels & Audience */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Marketing Channels</h3>
                <p className="text-muted-foreground">Select where you'll promote your products</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {channelOptions.map((channel) => (
                  <Card
                    key={channel.id}
                    className={`cursor-pointer transition-all ${
                      campaignData.channels.includes(channel.id)
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => handleChannelToggle(channel.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        campaignData.channels.includes(channel.id)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}>
                        {campaignData.channels.includes(channel.id) && (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-2xl">{channel.icon}</span>
                      <span className="font-medium text-sm">{channel.name}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="target-audience">Target Audience</Label>
                <Textarea
                  id="target-audience"
                  placeholder="Describe your target audience (e.g., young professionals interested in digital marketing, age 25-35)"
                  value={campaignData.targetAudience}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 4: Budget & Timeline */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Budget & Timeline</h3>
                <p className="text-muted-foreground">Set your investment and campaign duration</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Campaign Budget (USD)
                  </Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="5000"
                    value={campaignData.budget}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, budget: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Duration (days)
                  </Label>
                  <Select value={campaignData.duration} onValueChange={(value) => setCampaignData(prev => ({ ...prev, duration: value }))}>
                    <SelectTrigger id="duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="14">14 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="60">60 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content-strategy">Content Strategy (Optional)</Label>
                <Textarea
                  id="content-strategy"
                  placeholder="Describe your content approach (e.g., 3 blog posts per week, daily social media updates)"
                  value={campaignData.contentStrategy}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, contentStrategy: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* AI Recommendations */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <Target className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm mb-1">AI Recommendations</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Expected ROI: 250-350% based on similar campaigns</li>
                        <li>• Recommended: Increase budget to ${parseInt(campaignData.budget || "0") * 1.5} for optimal results</li>
                        <li>• Best performing time: Weekday mornings (9-11 AM)</li>
                        <li>• Suggested: Add email marketing channel (+40% conversion)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Campaign Created Success */}
          {campaignCreated && (
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Campaign Created!</h3>
                <p className="text-muted-foreground">Setting up tracking and generating affiliate links...</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || isCreating}
          >
            Back
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="bg-primary"
            >
              Next Step
            </Button>
          ) : (
            <Button
              onClick={handleCreateCampaign}
              disabled={!canProceed() || isCreating}
              className="bg-gradient-to-r from-primary to-accent"
            >
              {isCreating ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Launch Campaign
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}