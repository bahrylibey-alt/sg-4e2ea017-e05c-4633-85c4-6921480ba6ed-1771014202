import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Rocket, Zap, Target, TrendingUp, AlertCircle, CheckCircle, Loader2, Info, ExternalLink } from "lucide-react";
import { smartCampaignService } from "@/services/smartCampaignService";

export function CampaignBuilder({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [productUrls, setProductUrls] = useState("");
  const [customBudget, setCustomBudget] = useState<number | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<any>(null);

  const templates = smartCampaignService.getTemplates();

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setError(null);
    setValidationError(null);
  };

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

  const handleNextStep = () => {
    setError(null);
    setValidationError(null);

    if (step === 1 && !selectedTemplate) {
      setValidationError("Please select a campaign template to continue");
      return;
    }

    if (step === 2) {
      if (!campaignName.trim()) {
        setValidationError("Campaign name is required");
        return;
      }

      const urls = productUrls.split("\n").map(u => u.trim()).filter(Boolean);
      
      if (urls.length === 0) {
        setValidationError("Please enter at least one product URL");
        return;
      }

      for (let i = 0; i < urls.length; i++) {
        if (!validateUrl(urls[i])) {
          setValidationError(`Invalid URL on line ${i + 1}: "${urls[i]}". Please enter a valid website address.`);
          return;
        }
      }
    }

    setStep(step + 1);
  };

  const handleCreateCampaign = async () => {
    setIsCreating(true);
    setError(null);
    setValidationError(null);

    try {
      console.log("🚀 Creating campaign from builder...");
      
      const urls = productUrls
        .split("\n")
        .map(u => u.trim())
        .filter(Boolean)
        .map(normalizeUrl);

      console.log("📝 Normalized URLs:", urls);

      const template = selectedTemplate ? smartCampaignService.getTemplate(selectedTemplate) : null;

      const result = await smartCampaignService.createQuickCampaign({
        productUrls: urls,
        templateId: selectedTemplate || undefined,
        customGoal: template?.goal,
        customBudget: customBudget || template?.suggestedBudget
      });

      console.log("✅ Campaign result:", result);

      if (result.success && result.campaign) {
        setCreatedCampaign(result);
        setSuccess(true);
      } else {
        console.error("❌ Failed:", result.error);
        setError(result.error || "Failed to create campaign. Please try again.");
      }
    } catch (err) {
      console.error("💥 Error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedTemplate(null);
    setCampaignName("");
    setProductUrls("");
    setCustomBudget(undefined);
    setError(null);
    setValidationError(null);
    setSuccess(false);
    setCreatedCampaign(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Smart Campaign Builder</DialogTitle>
          <DialogDescription>
            Create automated affiliate campaigns with real traffic generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-24 h-1 mx-2 ${step > s ? "bg-blue-600" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          {/* Errors */}
          {(error || validationError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-red-700 text-sm mt-1">{error || validationError}</p>
                {error && error.includes("logged in") && (
                  <p className="text-red-600 text-xs mt-2">
                    💡 Please sign in using the navigation menu, then try again.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success */}
          {success && createdCampaign && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900 text-lg">Campaign Created Successfully!</p>
                  <p className="text-green-700 text-sm mt-1">{createdCampaign.campaign.name} is now live</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Affiliate Links</p>
                  <p className="text-2xl font-bold text-green-700">{createdCampaign.affiliateLinks?.length || 0}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Traffic Sources</p>
                  <p className="text-2xl font-bold text-green-700">{createdCampaign.trafficSources?.length || 0}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Est. Daily Reach</p>
                  <p className="text-2xl font-bold text-green-700">{(createdCampaign.estimatedReach || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  Close
                </Button>
                <Button onClick={() => window.location.href = "/dashboard"} className="flex-1">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* Step 1: Template Selection */}
          {step === 1 && !success && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Choose Campaign Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedTemplate === template.id ? "border-2 border-blue-600" : "border"
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {template.goal === "sales" && <Target className="w-5 h-5 text-blue-600" />}
                        {template.goal === "leads" && <Zap className="w-5 h-5 text-purple-600" />}
                        {template.goal === "traffic" && <TrendingUp className="w-5 h-5 text-green-600" />}
                        {template.goal === "awareness" && <Rocket className="w-5 h-5 text-orange-600" />}
                        <h4 className="font-semibold">{template.name}</h4>
                      </div>
                      <Badge variant="secondary">{template.goal}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>${template.suggestedBudget} budget</span>
                      <span>{template.suggestedDuration} days</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Campaign Details */}
          {step === 2 && !success && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Campaign Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="campaignName">Campaign Name *</Label>
                <Input
                  id="campaignName"
                  placeholder="e.g., Summer Product Launch"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productUrls">Product URLs * (one per line)</Label>
                <Textarea
                  id="productUrls"
                  placeholder="Enter product URLs, one per line:&#10;amazon.com/product1&#10;clickbank.com/product2&#10;yoursite.com/offer"
                  value={productUrls}
                  onChange={(e) => setProductUrls(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    Enter any affiliate product URLs from networks like Amazon Associates, ClickBank, ShareASale, CJ Affiliate, etc.
                    URLs will be automatically normalized.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget (USD) - Optional</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder={`Default: $${selectedTemplate ? smartCampaignService.getTemplate(selectedTemplate)?.suggestedBudget : 500}`}
                  value={customBudget || ""}
                  onChange={(e) => setCustomBudget(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Review & Launch */}
          {step === 3 && !success && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review & Launch</h3>
              
              <Card className="p-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Campaign Name</p>
                  <p className="font-semibold">{campaignName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Template</p>
                  <p className="font-semibold">
                    {selectedTemplate ? smartCampaignService.getTemplate(selectedTemplate)?.name : "None"}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Products</p>
                  <p className="font-semibold">
                    {productUrls.split("\n").filter(Boolean).length} product(s)
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="font-semibold">
                    ${customBudget || (selectedTemplate ? smartCampaignService.getTemplate(selectedTemplate)?.suggestedBudget : 500)}
                  </p>
                </div>
              </Card>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Ready to launch!</strong> This will create real affiliate tracking links and activate automated traffic sources.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!success && (
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  if (step === 1) {
                    handleClose();
                  } else {
                    setStep(step - 1);
                    setError(null);
                    setValidationError(null);
                  }
                }}
                disabled={isCreating}
              >
                {step === 1 ? "Cancel" : "Back"}
              </Button>

              {step < 3 ? (
                <Button onClick={handleNextStep}>
                  Next Step
                </Button>
              ) : (
                <Button 
                  onClick={handleCreateCampaign} 
                  disabled={isCreating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}