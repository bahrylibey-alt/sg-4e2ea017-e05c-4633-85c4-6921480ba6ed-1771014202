import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, TestTube, Zap } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  // Zapier Integration State
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState("");
  const [zapierEnabled, setZapierEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load Zapier integration
      const { data: zapierIntegration } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", user.id)
        .eq("provider", "zapier")
        .maybeSingle();

      if (zapierIntegration) {
        setZapierEnabled(zapierIntegration.status === "connected");
        setZapierWebhookUrl((zapierIntegration.config as any)?.webhook_url || "");
      }

      setLoading(false);
    } catch (error: any) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const saveZapierSettings = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate webhook URL
      if (zapierEnabled && !zapierWebhookUrl.includes("hooks.zapier.com")) {
        toast({
          title: "Invalid Webhook URL",
          description: "Please use a valid Zapier webhook URL (https://hooks.zapier.com/hooks/catch/...)",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // Upsert integration
      const { error } = await supabase
        .from("integrations")
        .upsert({
          user_id: user.id,
          provider: "zapier",
          provider_name: "Zapier",
          category: "automation",
          status: zapierEnabled ? "connected" : "disconnected",
          config: {
            webhook_url: zapierWebhookUrl
          }
        }, {
          onConflict: "user_id,provider"
        });

      if (error) throw error;

      toast({
        title: "✅ Saved!",
        description: "Zapier integration updated successfully",
      });
      setSaving(false);
    } catch (error: any) {
      console.error("Error saving Zapier settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  const testZapierWebhook = async () => {
    try {
      setTesting(true);

      if (!zapierWebhookUrl.includes("hooks.zapier.com")) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid Zapier webhook URL first",
          variant: "destructive",
        });
        setTesting(false);
        return;
      }

      // Send test webhook
      const testData = {
        event: "test.connection",
        data: {
          message: "Test webhook from your affiliate app",
          timestamp: new Date().toISOString(),
          test: true
        },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(zapierWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        toast({
          title: "✅ Connection Successful!",
          description: "Test webhook sent to Zapier. Check your Zap history.",
        });
      } else {
        toast({
          title: "⚠️ Connection Failed",
          description: `Webhook returned status: ${response.status}`,
          variant: "destructive",
        });
      }

      setTesting(false);
    } catch (error: any) {
      console.error("Error testing webhook:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test webhook",
        variant: "destructive",
      });
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and integration settings</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-6">
            {/* Zapier Integration Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Zap className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Zapier Integration</CardTitle>
                    <CardDescription>
                      Connect to Zapier to automatically post content to social media
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="zapier-enabled" className="text-base">Enable Zapier</Label>
                    <p className="text-sm text-muted-foreground">
                      Send autopilot posts to Zapier for distribution
                    </p>
                  </div>
                  <Switch
                    id="zapier-enabled"
                    checked={zapierEnabled}
                    onCheckedChange={setZapierEnabled}
                  />
                </div>

                {zapierEnabled && (
                  <>
                    {/* Webhook URL Input */}
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">Zapier Webhook URL</Label>
                      <Input
                        id="webhook-url"
                        type="url"
                        placeholder="https://hooks.zapier.com/hooks/catch/12345/abcde/"
                        value={zapierWebhookUrl}
                        onChange={(e) => setZapierWebhookUrl(e.target.value)}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Get this from your Zapier Zap → Webhooks by Zapier → Catch Hook trigger
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={saveZapierSettings}
                        disabled={saving || !zapierWebhookUrl}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Settings
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={testZapierWebhook}
                        disabled={testing || !zapierWebhookUrl}
                      >
                        {testing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <TestTube className="mr-2 h-4 w-4" />
                            Test Connection
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Setup Guide */}
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <p className="font-semibold text-sm">📋 Quick Setup Guide:</p>
                      <ol className="text-sm space-y-1 ml-4 list-decimal">
                        <li>Go to <a href="https://zapier.com" target="_blank" rel="noopener" className="text-primary hover:underline">Zapier.com</a> → Create new Zap</li>
                        <li>Trigger: "Webhooks by Zapier" → Event: "Catch Hook"</li>
                        <li>Copy the webhook URL and paste it above</li>
                        <li>Add Actions: "Create Facebook Post", "Create Instagram Post", etc.</li>
                        <li>Turn your Zap ON</li>
                      </ol>
                      <p className="text-xs text-muted-foreground mt-2">
                        Once connected, autopilot will send posts to Zapier every 30 seconds for distribution to your social media accounts.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Other integrations can be added here */}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}