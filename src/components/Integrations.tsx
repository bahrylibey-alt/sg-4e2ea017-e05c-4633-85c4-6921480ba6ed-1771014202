import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Loader2, Settings } from "lucide-react";
import { integrationService, type IntegrationDetails, type IntegrationConfig } from "@/services/integrationService";
import { useToast } from "@/hooks/use-toast";

const AVAILABLE_INTEGRATIONS = [
  {
    provider: "amazon_associates",
    name: "Amazon Associates",
    description: "Connect your Amazon affiliate account and start promoting millions of products",
    logo: "🛒",
    category: "E-commerce",
    requiredFields: ["trackingCode", "affiliateId"] as const
  },
  {
    provider: "clickbank",
    name: "ClickBank",
    description: "Access thousands of digital products with high commission rates",
    logo: "💳",
    category: "Digital Products",
    requiredFields: ["apiKey"] as const
  },
  {
    provider: "shareasale",
    name: "ShareASale",
    description: "Join one of the largest affiliate networks with premium brands",
    logo: "🤝",
    category: "Affiliate Network",
    requiredFields: ["affiliateId", "apiKey"] as const
  },
  {
    provider: "cj_affiliate",
    name: "CJ Affiliate",
    description: "Partner with top brands and access exclusive offers",
    logo: "🎯",
    category: "Affiliate Network",
    requiredFields: ["apiKey"] as const
  },
  {
    provider: "mailchimp",
    name: "Mailchimp",
    description: "Automate email campaigns and build your subscriber list",
    logo: "📧",
    category: "Email Marketing",
    requiredFields: ["apiKey", "listId"] as const
  },
  {
    provider: "google_analytics",
    name: "Google Analytics",
    description: "Track detailed visitor behavior and conversion data",
    logo: "📊",
    category: "Analytics",
    requiredFields: ["trackingId"] as const
  },
  {
    provider: "stripe",
    name: "Stripe",
    description: "Accept payments and manage subscriptions seamlessly",
    logo: "💰",
    category: "Payments",
    requiredFields: ["stripePublishableKey", "stripeSecretKey"] as const
  },
  {
    provider: "zapier",
    name: "Zapier",
    description: "Connect 5,000+ apps and automate workflows",
    logo: "⚡",
    category: "Automation",
    requiredFields: ["webhookUrl"] as const
  }
];

export function Integrations() {
  const [integrations, setIntegrations] = useState<IntegrationDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<typeof AVAILABLE_INTEGRATIONS[0] | null>(null);
  const [configValues, setConfigValues] = useState<IntegrationConfig>({});
  const { toast } = useToast();

  // Load integrations from database
  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    const { integrations: data, error } = await integrationService.getUserIntegrations();
    
    if (error) {
      toast({
        title: "Error loading integrations",
        description: error,
        variant: "destructive"
      });
    } else {
      setIntegrations(data);
    }
    
    setLoading(false);
  };

  const getIntegrationStatus = (provider: string): "connected" | "disconnected" => {
    const integration = integrations.find(i => i.provider === provider);
    return integration?.status === "connected" ? "connected" : "disconnected";
  };

  const handleConnect = (provider: typeof AVAILABLE_INTEGRATIONS[0]) => {
    setSelectedProvider(provider);
    setConfigValues({});
    setConfigDialogOpen(true);
  };

  const handleDisconnect = async (provider: string) => {
    const confirmed = window.confirm(
      `Disconnect ${AVAILABLE_INTEGRATIONS.find(i => i.provider === provider)?.name}?\n\nThis will remove all stored credentials and stop syncing data.`
    );
    
    if (!confirmed) return;

    setConnectingProvider(provider);
    const { success, error } = await integrationService.disconnectIntegration(provider);
    
    if (success) {
      toast({
        title: "Integration disconnected",
        description: `Successfully disconnected ${AVAILABLE_INTEGRATIONS.find(i => i.provider === provider)?.name}`
      });
      await loadIntegrations();
    } else {
      toast({
        title: "Error disconnecting",
        description: error || "Failed to disconnect integration",
        variant: "destructive"
      });
    }
    
    setConnectingProvider(null);
  };

  const handleSaveConnection = async () => {
    if (!selectedProvider) return;

    // Validate required fields
    const missingFields = selectedProvider.requiredFields.filter(
      field => !configValues[field as keyof IntegrationConfig]
    );

    if (missingFields.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    setConnectingProvider(selectedProvider.provider);
    const { success, error } = await integrationService.connectIntegration(
      selectedProvider.provider,
      configValues
    );

    if (success) {
      toast({
        title: "Integration connected",
        description: `Successfully connected ${selectedProvider.name}`
      });
      setConfigDialogOpen(false);
      await loadIntegrations();
    } else {
      toast({
        title: "Connection failed",
        description: error || "Failed to connect integration",
        variant: "destructive"
      });
    }

    setConnectingProvider(null);
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      trackingCode: "Tracking Code",
      affiliateId: "Affiliate ID",
      apiKey: "API Key",
      listId: "List ID",
      stripePublishableKey: "Publishable Key",
      stripeSecretKey: "Secret Key",
      trackingId: "Tracking ID",
      webhookUrl: "Webhook URL"
    };
    return labels[field] || field;
  };

  const handleRequestIntegration = () => {
    const integrationName = prompt("Which integration would you like us to add?\n\nEnter the platform name:");
    
    if (integrationName && integrationName.trim()) {
      toast({
        title: "Request submitted",
        description: `We'll review your request for ${integrationName} integration`
      });
    }
  };

  if (loading) {
    return (
      <section className="py-24 px-6 bg-muted/30" data-section="integrations">
        <div className="container flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-6 bg-muted/30" data-section="integrations">
      <div className="container">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="text-accent border-accent/30">
            Integrations
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Connect With Your <span className="text-accent">Favorite Tools</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Seamlessly integrate with 50+ platforms and services to supercharge your affiliate business
          </p>
        </div>

        {/* Integrations grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AVAILABLE_INTEGRATIONS.map((integration) => {
            const status = getIntegrationStatus(integration.provider);
            const isConnected = status === "connected";
            const isLoading = connectingProvider === integration.provider;

            return (
              <Card 
                key={integration.provider}
                className="hover:shadow-lg hover:border-primary/30 transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-4xl">{integration.logo}</div>
                    {isConnected ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Available
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{integration.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {integration.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {integration.category}
                    </Badge>
                    <div className="flex gap-2">
                      {isConnected && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleConnect(integration)}
                          disabled={isLoading}
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant={isConnected ? "outline" : "default"}
                        onClick={() => isConnected ? handleDisconnect(integration.provider) : handleConnect(integration)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : isConnected ? (
                          "Disconnect"
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Need a custom integration? We can build it for you.
          </p>
          <Button 
            size="lg" 
            variant="outline"
            onClick={handleRequestIntegration}
          >
            Request Integration
          </Button>
        </div>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedProvider?.logo} Connect {selectedProvider?.name}
            </DialogTitle>
            <DialogDescription>
              Enter your credentials to connect this integration
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedProvider?.requiredFields.map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{getFieldLabel(field)}</Label>
                <Input
                  id={field}
                  type={field.includes("secret") || field.includes("Secret") ? "password" : "text"}
                  placeholder={`Enter your ${getFieldLabel(field).toLowerCase()}`}
                  value={configValues[field as keyof IntegrationConfig] || ""}
                  onChange={(e) => setConfigValues({
                    ...configValues,
                    [field]: e.target.value
                  })}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfigDialogOpen(false)}
              disabled={!!connectingProvider}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveConnection}
              disabled={!!connectingProvider}
            >
              {connectingProvider ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}