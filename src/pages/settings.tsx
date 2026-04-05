import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { integrationService, Integration } from "@/services/integrationService";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Link, Zap, BarChart3, CheckCircle2, XCircle, Loader2, Plus, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    const data = await integrationService.getUserIntegrations(user.id);
    setIntegrations(data);
    setLoading(false);
  }

  async function handleSaveIntegration() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedProvider) return;

    setSaving(true);
    try {
      await integrationService.saveIntegration(user.id, selectedProvider, formData);
      toast({
        title: "✅ Integration Connected",
        description: "Your integration has been saved successfully.",
      });
      await loadIntegrations();
      setSelectedProvider(null);
      setFormData({});
    } catch (error: any) {
      toast({
        title: "❌ Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect(id: string) {
    try {
      await integrationService.deleteIntegration(id);
      toast({
        title: "Disconnected",
        description: "Integration has been removed.",
      });
      await loadIntegrations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  const templates = integrationService.getTemplates();
  const affiliateNetworks = Object.entries(templates).filter(([_, t]) => t.category === "affiliate_network");
  const trafficSources = Object.entries(templates).filter(([_, t]) => t.category === "traffic_source");

  const connectedProviders = new Set(integrations.map(i => i.provider));

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold">Settings & Integrations</h1>
          </div>
          <p className="text-slate-600 text-lg">
            Connect affiliate networks and configure traffic sources for automated campaigns
          </p>
        </div>

        <Tabs defaultValue="affiliate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-4xl">
            <TabsTrigger value="affiliate" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Affiliate
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Automation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="affiliate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Affiliate Networks</CardTitle>
                <CardDescription>
                  Add your affiliate network credentials to start promoting products
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {affiliateNetworks.map(([provider, template]) => {
                      const connected = connectedProviders.has(provider);
                      const integration = integrations.find(i => i.provider === provider);

                      return (
                        <Card key={provider} className={connected ? "border-green-500" : ""}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{template.logo}</span>
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                              </div>
                              {connected ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-slate-300" />
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {connected ? (
                              <>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Connected
                                </Badge>
                                <div className="flex gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => {
                                          setSelectedProvider(provider);
                                          setFormData(integration?.config || {});
                                        }}
                                      >
                                        Edit
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit {template.name}</DialogTitle>
                                        <DialogDescription>
                                          Update your connection settings
                                        </DialogDescription>
                                      </DialogHeader>
                                      <IntegrationForm
                                        template={template}
                                        formData={formData}
                                        setFormData={setFormData}
                                        onSave={handleSaveIntegration}
                                        saving={saving}
                                      />
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => integration && handleDisconnect(integration.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    className="w-full"
                                    onClick={() => {
                                      setSelectedProvider(provider);
                                      setFormData({});
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Connect
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Connect {template.name}</DialogTitle>
                                    <DialogDescription>
                                      Enter your {template.name} credentials
                                    </DialogDescription>
                                  </DialogHeader>
                                  <IntegrationForm
                                    template={template}
                                    formData={formData}
                                    setFormData={setFormData}
                                    onSave={handleSaveIntegration}
                                    saving={saving}
                                  />
                                </DialogContent>
                              </Dialog>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Tracking</CardTitle>
                <CardDescription>
                  Connect analytics tools to track visitor behavior and conversions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <IntegrationGrid 
                    category="analytics"
                    integrations={integrations}
                    templates={templates}
                    connectedProviders={connectedProviders}
                    onEdit={(provider, config) => {
                      setSelectedProvider(provider);
                      setFormData(config);
                    }}
                    onDisconnect={handleDisconnect}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Processing</CardTitle>
                <CardDescription>
                  Configure payment gateways to accept subscriptions and payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <IntegrationGrid 
                    category="payment"
                    integrations={integrations}
                    templates={templates}
                    connectedProviders={connectedProviders}
                    onEdit={(provider, config) => {
                      setSelectedProvider(provider);
                      setFormData(config);
                    }}
                    onDisconnect={handleDisconnect}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automation & Webhooks</CardTitle>
                <CardDescription>
                  Connect automation tools like Zapier for real-time notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <IntegrationGrid 
                    category="automation"
                    integrations={integrations}
                    templates={templates}
                    connectedProviders={connectedProviders}
                    onEdit={(provider, config) => {
                      setSelectedProvider(provider);
                      setFormData(config);
                    }}
                    onDisconnect={handleDisconnect}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Source APIs</CardTitle>
                <CardDescription>
                  Configure social media and platform APIs for automated content posting
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {trafficSources.map(([provider, template]) => {
                      const connected = connectedProviders.has(provider);
                      const integration = integrations.find(i => i.provider === provider);

                      return (
                        <Card key={provider} className={connected ? "border-green-500" : ""}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{template.logo}</span>
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                              </div>
                              {connected ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-slate-300" />
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {connected ? (
                              <>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Connected
                                </Badge>
                                <div className="flex gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => {
                                          setSelectedProvider(provider);
                                          setFormData(integration?.config || {});
                                        }}
                                      >
                                        Edit
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit {template.name}</DialogTitle>
                                        <DialogDescription>
                                          Update your API credentials
                                        </DialogDescription>
                                      </DialogHeader>
                                      <IntegrationForm
                                        template={template}
                                        formData={formData}
                                        setFormData={setFormData}
                                        onSave={handleSaveIntegration}
                                        saving={saving}
                                      />
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => integration && handleDisconnect(integration.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    className="w-full"
                                    onClick={() => {
                                      setSelectedProvider(provider);
                                      setFormData({});
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Connect
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Connect {template.name}</DialogTitle>
                                    <DialogDescription>
                                      Enter your API credentials to enable automated posting
                                    </DialogDescription>
                                  </DialogHeader>
                                  <IntegrationForm
                                    template={template}
                                    formData={formData}
                                    setFormData={setFormData}
                                    onSave={handleSaveIntegration}
                                    saving={saving}
                                  />
                                </DialogContent>
                              </Dialog>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}

function IntegrationForm({ template, formData, setFormData, onSave, saving }: any) {
  return (
    <div className="space-y-4">
      {template.fields.map((field: any) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id={field.name}
            type={field.type}
            value={formData[field.name] || ""}
            onChange={(e) =>
              setFormData({ ...formData, [field.name]: e.target.value })
            }
            placeholder={field.label}
            required={field.required}
          />
        </div>
      ))}
      <Button onClick={onSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Integration"
        )}
      </Button>
    </div>
  );
}

function IntegrationGrid({ category, integrations, templates, connectedProviders, onEdit, onDisconnect }: any) {
  const categoryIntegrations = Object.entries(templates).filter(([_, t]: any) => t.category === category);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categoryIntegrations.map(([provider, template]: any) => {
        const connected = connectedProviders.has(provider);
        const integration = integrations.find((i: any) => i.provider === provider);

        return (
          <Card key={provider} className={connected ? "border-green-500" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{template.logo}</span>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                {connected ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-slate-300" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {connected ? (
                <>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Connected
                  </Badge>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => onEdit(provider, integration?.config || {})}
                        >
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit {template.name}</DialogTitle>
                          <DialogDescription>Update your connection settings</DialogDescription>
                        </DialogHeader>
                        <IntegrationForm
                          template={template}
                          formData={integration?.config || {}}
                          setFormData={() => {}}
                          onSave={() => {}}
                          saving={false}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => integration && onDisconnect(integration.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      onClick={() => onEdit(provider, {})}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Connect {template.name}</DialogTitle>
                      <DialogDescription>Enter your credentials</DialogDescription>
                    </DialogHeader>
                    <IntegrationForm
                      template={template}
                      formData={{}}
                      setFormData={() => {}}
                      onSave={() => {}}
                      saving={false}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}