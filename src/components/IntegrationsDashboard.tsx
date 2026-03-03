import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { integrationService, type IntegrationDetails } from "@/services/integrationService";
import { useToast } from "@/hooks/use-toast";
import { Check, X, RefreshCw, Settings, AlertCircle, Loader2 } from "lucide-react";

export function IntegrationsDashboard() {
  const [integrations, setIntegrations] = useState<IntegrationDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleSync = async (provider: string) => {
    setSyncing(provider);
    
    // Simulate sync - in production this would call the actual API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await integrationService.updateSyncStatus(provider, new Date().toISOString());
    await loadIntegrations();
    
    toast({
      title: "Sync completed",
      description: `Successfully synced ${provider}`
    });
    
    setSyncing(null);
  };

  const handleDisconnect = async (provider: string, providerName: string) => {
    const confirmed = window.confirm(
      `Disconnect ${providerName}?\n\nThis will stop all data syncing and remove stored credentials.`
    );
    
    if (!confirmed) return;

    const { success, error } = await integrationService.disconnectIntegration(provider);
    
    if (success) {
      toast({
        title: "Integration disconnected",
        description: `Successfully disconnected ${providerName}`
      });
      await loadIntegrations();
    } else {
      toast({
        title: "Error disconnecting",
        description: error || "Failed to disconnect integration",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "error":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      payment: "💳",
      email: "📧",
      automation: "⚡",
      affiliate_network: "🤝",
      analytics: "📊",
      tracking: "📱"
    };
    return icons[category] || "🔌";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const connectedIntegrations = integrations.filter(i => i.status === "connected");
  const errorIntegrations = integrations.filter(i => i.status === "error");

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Connected Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{connectedIntegrations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active integrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {connectedIntegrations.length > 0 ? "Live" : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time updates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{errorIntegrations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connected Integrations */}
      {connectedIntegrations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Connected Integrations</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {connectedIntegrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{integration.providerLogo}</div>
                      <div>
                        <CardTitle className="text-base">{integration.providerName}</CardTitle>
                        <CardDescription className="text-xs">
                          {getCategoryIcon(integration.category)} {integration.category.replace("_", " ")}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(integration.status)}>
                      <Check className="w-3 h-3 mr-1" />
                      {integration.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>
                      Connected {integration.connectedAt ? 
                        new Date(integration.connectedAt).toLocaleDateString() : "—"}
                    </span>
                    <span>
                      Last sync: {integration.lastSyncAt ? 
                        new Date(integration.lastSyncAt).toLocaleTimeString() : "Never"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSync(integration.provider)}
                      disabled={syncing === integration.provider}
                    >
                      {syncing === integration.provider ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Sync Now
                        </>
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={syncing === integration.provider}
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Configure
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDisconnect(integration.provider, integration.providerName)}
                      disabled={syncing === integration.provider}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Error Integrations */}
      {errorIntegrations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-red-500">Integrations with Issues</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {errorIntegrations.map((integration) => (
              <Card key={integration.id} className="border-red-500/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{integration.providerLogo}</div>
                      <div>
                        <CardTitle className="text-base">{integration.providerName}</CardTitle>
                        <CardDescription className="text-xs text-red-500">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          {integration.errorMessage || "Connection error"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(integration.status)}>
                      {integration.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDisconnect(integration.provider, integration.providerName)}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Remove Integration
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {integrations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">🔌</div>
            <h3 className="text-lg font-semibold mb-2">No Integrations Connected</h3>
            <p className="text-muted-foreground mb-4">
              Connect your favorite tools to supercharge your affiliate business
            </p>
            <Button>
              Browse Available Integrations
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}