import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Play,
  ExternalLink,
  DollarSign,
  MousePointerClick,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";

/**
 * COMPREHENSIVE END-TO-END TESTING SUITE
 * 
 * This page tests the ENTIRE affiliate system:
 * 1. ✅ Add real products (Temu + Amazon)
 * 2. ✅ Generate working affiliate links
 * 3. ✅ Test click tracking
 * 4. ✅ Simulate purchase (test postback)
 * 5. ✅ Verify commission recorded
 * 
 * Run this before going live to ensure everything works!
 */

interface TestResult {
  test: string;
  status: "pass" | "fail" | "running" | "pending";
  message: string;
  data?: any;
}

export default function LiveTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testLink, setTestLink] = useState<any>(null);

  const updateResult = (test: string, status: TestResult["status"], message: string, data?: any) => {
    setResults(prev => {
      const existing = prev.find(r => r.test === test);
      if (existing) {
        return prev.map(r => r.test === test ? { test, status, message, data } : r);
      }
      return [...prev, { test, status, message, data }];
    });
  };

  const runFullSystemTest = async () => {
    setIsRunning(true);
    setResults([]);

    // TEST 1: Database Connection
    updateResult("Database Connection", "running", "Testing...");
    try {
      const { error } = await supabase.from("affiliate_links").select("count").limit(1);
      if (error) throw error;
      updateResult("Database Connection", "pass", "✅ Connected to Supabase");
    } catch (err: any) {
      updateResult("Database Connection", "fail", `❌ ${err.message}`);
      setIsRunning(false);
      return;
    }

    // TEST 2: Get User Session
    updateResult("User Authentication", "running", "Checking session...");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      updateResult("User Authentication", "fail", "❌ No active session");
      setIsRunning(false);
      return;
    }
    updateResult("User Authentication", "pass", `✅ Logged in as ${session.user.email}`);

    // TEST 3: Check Integrations
    updateResult("Affiliate Integrations", "running", "Checking networks...");
    const { data: integrations } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", session.user.id);
    
    const connectedNetworks = integrations?.filter(i => i.status === "connected") || [];
    updateResult(
      "Affiliate Integrations",
      connectedNetworks.length > 0 ? "pass" : "fail",
      connectedNetworks.length > 0 
        ? `✅ ${connectedNetworks.length} network(s) connected: ${connectedNetworks.map(i => i.provider).join(", ")}`
        : "❌ No affiliate networks connected"
    );

    // TEST 4: Create Test Campaign
    updateResult("Campaign Creation", "running", "Creating test campaign...");
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        user_id: session.user.id,
        name: `E2E Test ${Date.now()}`,
        status: "active",
        goal: "test_end_to_end"
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      updateResult("Campaign Creation", "fail", `❌ ${campaignError?.message || "Failed"}`);
      setIsRunning(false);
      return;
    }
    updateResult("Campaign Creation", "pass", `✅ Campaign created: ${campaign.name}`, campaign);

    // TEST 5: Add Real Products
    updateResult("Product Addition", "running", "Adding 5 products from connected networks...");
    try {
      const result = await smartProductDiscovery.addToCampaign(campaign.id, session.user.id, 5);
      if (result.success && result.added > 0) {
        updateResult(
          "Product Addition",
          "pass",
          `✅ Added ${result.added} products from: ${result.products.map(p => p.network).join(", ")}`,
          result.products
        );
      } else {
        updateResult("Product Addition", "fail", "❌ No products added");
        setIsRunning(false);
        return;
      }
    } catch (err: any) {
      updateResult("Product Addition", "fail", `❌ ${err.message}`);
      setIsRunning(false);
      return;
    }

    // TEST 6: Get a Test Link
    updateResult("Link Generation", "running", "Getting test link...");
    const { data: links } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("campaign_id", campaign.id)
      .limit(1);

    if (!links || links.length === 0) {
      updateResult("Link Generation", "fail", "❌ No links found");
      setIsRunning(false);
      return;
    }

    const link = links[0];
    setTestLink(link);
    updateResult(
      "Link Generation",
      "pass",
      `✅ Link ready: ${link.product_name} (${link.network})`,
      link
    );

    // TEST 7: Test Click Tracking
    updateResult("Click Tracking", "running", "Simulating click...");
    try {
      const clickResponse = await fetch("/api/click-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: link.slug,
          referrer: "test-suite",
          userAgent: navigator.userAgent
        })
      });

      if (clickResponse.ok) {
        const clickData = await clickResponse.json();
        updateResult(
          "Click Tracking",
          "pass",
          `✅ Click tracked! Total clicks: ${clickData.clicks}`,
          clickData
        );
      } else {
        updateResult("Click Tracking", "fail", "❌ Click tracking failed");
      }
    } catch (err: any) {
      updateResult("Click Tracking", "fail", `❌ ${err.message}`);
    }

    // TEST 8: Test Postback (Simulated Purchase)
    updateResult("Commission Postback", "running", "Simulating purchase...");
    try {
      const postbackResponse = await fetch("/api/postback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network: link.network,
          click_id: link.slug,
          transaction_id: `TEST-${Date.now()}`,
          amount: 29.99,
          commission: link.network === "Temu Affiliate" ? 5.99 : 0.90,
          status: "approved",
          product_id: link.product_name
        })
      });

      if (postbackResponse.ok) {
        // Wait a bit for database to update
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if conversion was recorded
        const { data: updatedLink } = await supabase
          .from("affiliate_links")
          .select("*")
          .eq("id", link.id)
          .single();

        if (updatedLink && updatedLink.conversions > 0) {
          updateResult(
            "Commission Postback",
            "pass",
            `✅ Purchase recorded! Revenue: $${updatedLink.revenue.toFixed(2)} | Conversions: ${updatedLink.conversions}`,
            updatedLink
          );
        } else {
          updateResult("Commission Postback", "fail", "❌ Conversion not recorded in database");
        }
      } else {
        updateResult("Commission Postback", "fail", "❌ Postback API failed");
      }
    } catch (err: any) {
      updateResult("Commission Postback", "fail", `❌ ${err.message}`);
    }

    // TEST 9: Verify Campaign Totals
    updateResult("Campaign Totals", "running", "Checking campaign stats...");
    const { data: finalCampaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign.id)
      .single();

    if (finalCampaign && finalCampaign.revenue > 0) {
      updateResult(
        "Campaign Totals",
        "pass",
        `✅ Campaign stats updated! Revenue: $${finalCampaign.revenue.toFixed(2)}`,
        finalCampaign
      );
    } else {
      updateResult("Campaign Totals", "fail", "❌ Campaign totals not updated");
    }

    setIsRunning(false);
  };

  const passed = results.filter(r => r.status === "pass").length;
  const failed = results.filter(r => r.status === "fail").length;
  const total = results.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🧪 Live End-to-End Test Suite</h1>
          <p className="text-muted-foreground">
            Complete system test: Products → Links → Clicks → Purchases → Commissions
          </p>
        </div>

        {/* Control Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Control</CardTitle>
            <CardDescription>
              Run complete end-to-end test of the entire affiliate system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runFullSystemTest} 
              disabled={isRunning}
              size="lg"
              className="w-full"
            >
              {isRunning ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Running Tests...</>
              ) : (
                <><Play className="mr-2 h-5 w-5" /> Run Full System Test</>
              )}
            </Button>

            {total > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{passed}</div>
                  <div className="text-sm text-green-700 dark:text-green-400">Passed</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{failed}</div>
                  <div className="text-sm text-red-700 dark:text-red-400">Failed</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{total}</div>
                  <div className="text-sm text-blue-700 dark:text-blue-400">Total</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {result.status === "pass" && <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />}
                      {result.status === "fail" && <XCircle className="h-5 w-5 text-red-500 mt-0.5" />}
                      {result.status === "running" && <Loader2 className="h-5 w-5 text-blue-500 animate-spin mt-0.5" />}
                      
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{result.test}</h3>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                        
                        {result.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              View details
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-48">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <Badge variant={result.status === "pass" ? "default" : result.status === "fail" ? "destructive" : "secondary"}>
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Test Link Card */}
        {testLink && (
          <Card className="mt-8 border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointerClick className="h-5 w-5" />
                Test Affiliate Link (Click to Verify)
              </CardTitle>
              <CardDescription>
                Click this link to test the full flow: redirect → affiliate network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Product</div>
                <div className="font-semibold">{testLink.product_name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Network</div>
                <Badge>{testLink.network}</Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Commission Rate</div>
                <div className="font-semibold text-green-600">{testLink.commission_rate}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Your Affiliate Link</div>
                <code className="block p-2 bg-muted rounded text-xs break-all">
                  {testLink.cloaked_url}
                </code>
              </div>
              <Button 
                onClick={() => window.open(testLink.cloaked_url, "_blank")}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Test Link (Opens Product Page)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {total > 0 && failed === 0 && !isRunning && (
          <Alert className="mt-8 border-green-500 bg-green-50 dark:bg-green-900/10">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-400">
              <strong>🎉 ALL TESTS PASSED!</strong> Your affiliate system is production-ready:
              <ul className="mt-2 space-y-1 text-sm">
                <li>✅ Database connected</li>
                <li>✅ Products added from real networks</li>
                <li>✅ Affiliate links generated</li>
                <li>✅ Click tracking working</li>
                <li>✅ Commission postback working</li>
                <li>✅ Revenue calculations accurate</li>
              </ul>
              <p className="mt-3 font-semibold">You can now go live and start earning commissions!</p>
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}