import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";
import { linkHealthMonitor } from "@/services/linkHealthMonitor";
import { ultimateAutopilot } from "@/services/ultimateAutopilot";
import { CheckCircle2, XCircle, AlertCircle, Play, RefreshCw } from "lucide-react";

export default function SystemStatus() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  const checkSystemStatus = async () => {
    setLoading(true);
    const results: any[] = [];

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        results.push({
          test: "User Authentication",
          status: "fail",
          message: "No user logged in"
        });
        setTestResults(results);
        setLoading(false);
        return;
      }

      results.push({
        test: "User Authentication",
        status: "pass",
        message: `Logged in as ${session.user.email}`
      });

      // Check integrations
      const { data: integrations, error: intError } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", session.user.id);

      if (intError) {
        results.push({
          test: "Integrations Check",
          status: "fail",
          message: intError.message
        });
      } else {
        const temuIntegration = integrations?.find(i => i.provider === "temu_affiliate");
        const amazonIntegration = integrations?.find(i => i.provider === "amazon_associates");

        results.push({
          test: "Temu Integration",
          status: temuIntegration ? "pass" : "warn",
          message: temuIntegration 
            ? `✅ Connected (ID: ${temuIntegration.config?.affiliate_id})`
            : "❌ Not connected"
        });

        results.push({
          test: "Amazon Integration",
          status: amazonIntegration ? "pass" : "warn",
          message: amazonIntegration 
            ? `✅ Connected (ID: ${amazonIntegration.config?.tracking_id})`
            : "❌ Not connected"
        });
      }

      // Check affiliate links
      const { data: links, error: linksError } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", session.user.id);

      if (linksError) {
        results.push({
          test: "Affiliate Links",
          status: "fail",
          message: linksError.message
        });
      } else {
        const temuLinks = links?.filter(l => l.network === "Temu Affiliate") || [];
        const amazonLinks = links?.filter(l => l.network === "Amazon Associates") || [];

        results.push({
          test: "Total Products",
          status: links && links.length > 0 ? "pass" : "warn",
          message: `${links?.length || 0} products total`
        });

        results.push({
          test: "Temu Products",
          status: temuLinks.length > 0 ? "pass" : "warn",
          message: `${temuLinks.length} Temu products (20% commission)`
        });

        results.push({
          test: "Amazon Products",
          status: amazonLinks.length > 0 ? "pass" : "warn",
          message: `${amazonLinks.length} Amazon products`
        });

        // Show sample products
        if (temuLinks.length > 0) {
          results.push({
            test: "Sample Temu Product",
            status: "info",
            message: `"${temuLinks[0].product_name}" - ${temuLinks[0].commission_rate}% commission`
          });
        }
      }

      // Check campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", session.user.id);

      if (!campaignsError && campaigns) {
        results.push({
          test: "Active Campaigns",
          status: campaigns.length > 0 ? "pass" : "warn",
          message: `${campaigns.length} campaign(s) active`
        });
      }

      setStatus({
        integrations: integrations || [],
        links: links || [],
        campaigns: campaigns || []
      });

    } catch (error: any) {
      results.push({
        test: "System Check",
        status: "fail",
        message: error.message
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  const testAddTemuProducts = async () => {
    setLoading(true);
    const results = [...testResults];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        results.push({
          test: "Add Temu Products",
          status: "fail",
          message: "No user logged in"
        });
        setTestResults(results);
        setLoading(false);
        return;
      }

      // Get or create campaign
      let campaignId: string;
      const { data: existingCampaigns } = await supabase
        .from("campaigns")
        .select("id")
        .eq("user_id", session.user.id)
        .limit(1);

      if (existingCampaigns && existingCampaigns.length > 0) {
        campaignId = existingCampaigns[0].id;
      } else {
        const { data: newCampaign, error } = await supabase
          .from("campaigns")
          .insert({
            user_id: session.user.id,
            name: "Test Campaign",
            status: "active"
          })
          .select()
          .single();

        if (error) throw error;
        campaignId = newCampaign.id;
      }

      results.push({
        test: "Campaign Ready",
        status: "pass",
        message: `Using campaign: ${campaignId}`
      });

      // Add products
      const result = await smartProductDiscovery.addToCampaign(campaignId, session.user.id, 10);

      results.push({
        test: "Add Products",
        status: result.success ? "pass" : "fail",
        message: result.success 
          ? `✅ Added ${result.added} products from multiple networks`
          : `❌ Failed: ${result.error}`
      });

      if (result.products) {
        const temuCount = result.products.filter((p: any) => p.network === "Temu Affiliate").length;
        const amazonCount = result.products.filter((p: any) => p.network === "Amazon Associates").length;

        results.push({
          test: "Network Distribution",
          status: "info",
          message: `Temu: ${temuCount} | Amazon: ${amazonCount}`
        });
      }

      // Refresh status
      await checkSystemStatus();

    } catch (error: any) {
      results.push({
        test: "Add Products",
        status: "fail",
        message: error.message
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  const testAutoRepair = async () => {
    setLoading(true);
    const results = [...testResults];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        results.push({
          test: "Auto-Repair",
          status: "fail",
          message: "No user logged in"
        });
        setTestResults(results);
        setLoading(false);
        return;
      }

      results.push({
        test: "Starting Auto-Repair",
        status: "info",
        message: "Running multi-network link validation..."
      });

      const result = await linkHealthMonitor.oneClickAutoRepair(undefined, session.user.id);

      results.push({
        test: "Auto-Repair Complete",
        status: result.success ? "pass" : "fail",
        message: result.success
          ? `✅ Checked: ${result.totalChecked} | Duplicates removed: ${result.duplicatesRemoved} | Invalid removed: ${result.invalidRemoved} | Replaced: ${result.replaced}`
          : "❌ Repair failed"
      });

      // Refresh status
      await checkSystemStatus();

    } catch (error: any) {
      results.push({
        test: "Auto-Repair",
        status: "fail",
        message: error.message
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "fail":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warn":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pass: "default",
      fail: "destructive",
      warn: "secondary",
      info: "outline"
    };
    return variants[status] || "outline";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">🔍 System Status & Testing</h1>
          <p className="text-slate-600">
            Real-time monitoring of your affiliate marketing system
          </p>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Test system functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={checkSystemStatus} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button onClick={testAddTemuProducts} disabled={loading} variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Test Add Products (Multi-Network)
            </Button>
            <Button onClick={testAutoRepair} disabled={loading} variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Test Auto-Repair
            </Button>
          </CardContent>
        </Card>

        {/* System Overview */}
        {status && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {status.integrations.length}
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Connected networks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {status.links.length}
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Active affiliate links
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {status.campaigns.length}
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Active campaigns
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {loading ? "Running tests..." : `${testResults.length} tests completed`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && testResults.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Running system checks...
              </div>
            ) : (
              <div className="space-y-3">
                {testResults.map((result, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{result.test}</span>
                        <Badge variant={getStatusBadge(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{result.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Network Breakdown */}
        {status && status.links.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Network Breakdown</CardTitle>
              <CardDescription>
                Products by affiliate network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(
                  status.links.reduce((acc: any, link: any) => {
                    acc[link.network] = (acc[link.network] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([network, count]: any) => (
                  <div key={network}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{network}</span>
                      <span className="text-sm text-slate-600">{count} products</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500"
                        style={{ 
                          width: `${(count / status.links.length) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>📋 How to Use This Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium mb-1">1. Check System Status</h4>
              <p className="text-sm text-slate-600">
                Click "Refresh Status" to see current integrations and products
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">2. Test Add Products</h4>
              <p className="text-sm text-slate-600">
                Click "Test Add Products" to add 10 products from all connected networks (Temu + Amazon)
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">3. Test Auto-Repair</h4>
              <p className="text-sm text-slate-600">
                Click "Test Auto-Repair" to validate all links, remove duplicates, and replace broken products
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">4. Check Results</h4>
              <p className="text-sm text-slate-600">
                Green checkmarks = success, Red X = failed, Yellow triangle = warning, Blue dot = info
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}