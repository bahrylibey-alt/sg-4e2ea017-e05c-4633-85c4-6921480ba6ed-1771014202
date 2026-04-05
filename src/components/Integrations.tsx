import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Loader2, Settings } from "lucide-react";
import { integrationService, type Integration, type IntegrationConfig } from "@/services/integrationService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedProviderKey, setSelectedProviderKey] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<IntegrationConfig>({});
  const { toast } = useToast();

  const templates = integrationService.getTemplates();
  const availableIntegrations = Object.entries(templates).map(([key, template]) => ({
    provider: key,
    ...template
  }));

  // Load integrations from database
  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const data = await integrationService.getUserIntegrations(user.id);
      setIntegrations(data);
    } catch (error: any) {
      toast({
        title: "Error loading integrations",
        description: error.message,
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const getIntegrationStatus = (provider: string): "connected" | "disconnected" => {
    const integration = integrations.find(i => i.provider === provider);
    return integration?.status === "connected" ? "connected" : "disconnected";
  };

  const handleConnect = (providerKey: string) => {
    setSelectedProviderKey(providerKey);
    const existing = integrations.find(i => i.provider === providerKey);
    setConfigValues(existing?.config || {});
    setConfigDialogOpen(true);
  };

  const handleDisconnect = async (provider: string) => {
    const template = templates[provider as keyof typeof templates];
    const confirmed = window.confirm(
      `Disconnect ${template?.name}?\n\nThis will remove all stored credentials and stop syncing data.`
    );
    
    if (!confirmed) return;

    setConnectingProvider(provider);
    const integration = integrations.find(i => i.provider === provider);
    
    if (integration) {
      try {
        await integrationService.deleteIntegration(integration.id);
        toast({
          title: "Integration disconnected",
          description: `Successfully disconnected ${template?.name}`
        });
        await loadIntegrations();
      } catch (error: any) {
        toast({
          title: "Error disconnecting",
          description: error.message || "Failed to disconnect integration",
          variant: "destructive"
        });
      }
    }
    
    setConnectingProvider(null);
  };

  const handleSaveConnection = async () => {
    if (!selectedProviderKey) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const template = templates[selectedProviderKey as keyof typeof templates];
    
    // Validate required fields
    const missingFields = template.fields.filter(
      field => field.required && !configValues[field.name]
    );

    if (missingFields.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill in: ${missingFields.map(f => f.label).join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    setConnectingProvider(selectedProviderKey);
    try {
      await integrationService.saveIntegration(user.id, selectedProviderKey, configValues);
      toast({
        title: "Integration connected",
        description: `Successfully connected ${template.name}`
      });
      setConfigDialogOpen(false);
      await loadIntegrations();
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect integration",
        variant: "destructive"
      });
    }

    setConnectingProvider(null);
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

  const selectedTemplate = selectedProviderKey ? templates[selectedProviderKey as keyof typeof templates] : null;

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
          {availableIntegrations.map((integration) => {
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
                    {integration.category.replace("_", " ")} integration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {integration.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Badge>
                    <div className="flex gap-2">
                      {isConnected && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleConnect(integration.provider)}
                          disabled={isLoading}
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant={isConnected ? "outline" : "default"}
                        onClick={() => isConnected ? handleDisconnect(integration.provider) : handleConnect(integration.provider)}
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
              {selectedTemplate?.logo} Connect {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Enter your credentials to connect this integration
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedTemplate?.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id={field.name}
                  type={field.type}
                  placeholder={`Enter your ${field.label.toLowerCase()}`}
                  value={configValues[field.name] || ""}
                  onChange={(e) => setConfigValues({
                    ...configValues,
                    [field.name]: e.target.value
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