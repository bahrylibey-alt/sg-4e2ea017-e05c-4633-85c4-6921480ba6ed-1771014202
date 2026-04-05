import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, CheckCircle2, XCircle, Loader2, 
  Globe, TrendingUp, Share2, Search, Eye, Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * FINAL COMPLETE SYSTEM TEST
 * 
 * Tests EVERYTHING including:
 * - Real traffic tracking
 * - SEO optimization
 * - Social media integration
 * - Click tracking
 * - Commission tracking
 * - Product links
 * - Database integrity
 */

interface TestResult {
  name: string;
  status: "pending" | "running" | "pass" | "fail";
  message: string;
  details?: any;
}

export default function FinalSystemTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testPhase, setTestPhase] = useState<string>("");

  const updateResult = (name: string, status: TestResult["status"], message: string, details?: any) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { name, status, message, details } : r);
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const runCompleteTest = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // PHASE 1: INFRASTRUCTURE TESTS
      setTestPhase("Infrastructure & Database");
      
      // Test 1: Database Connection
      updateResult("Database Connection", "running", "Connecting to Supabase...");
      const { data: dbTest, error: dbError } = await supabase.from("campaigns").select("count").limit(1);
      if (dbError) {
        updateResult("Database Connection", "fail", `❌ ${dbError.message}`);
        setIsRunning(false);
        return;
      }
      updateResult("Database Connection", "pass", "✅ Connected to Supabase successfully");

      // Test 2: User Authentication
      updateResult("User Authentication", "running", "Checking session...");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        updateResult("User Authentication", "fail", "❌ No active session - please login");
        setIsRunning(false);
        return;
      }
      updateResult("User Authentication", "pass", `✅ Logged in as ${session.user.email}`);

      // Test 3: Affiliate Integrations
      updateResult("Affiliate Integrations", "running", "Checking connected networks...");
      const { data: integrations } = await supabase
        .from("integrations")
        .select("provider, status")
        .eq("user_id", session.user.id);

      const temu = integrations?.find(i => i.provider === "temu_affiliate");
      const amazon = integrations?.find(i => i.provider === "amazon_associates");
      
      if (!temu && !amazon) {
        updateResult("Affiliate Integrations", "fail", "❌ No affiliate networks connected");
      } else {
        const connected = [
          temu && "Temu (20% commission)",
          amazon && "Amazon (3-6% commission)"
        ].filter(Boolean).join(", ");
        updateResult("Affiliate Integrations", "pass", `✅ Connected: ${connected}`);
      }

      // PHASE 2: TRAFFIC & SEO TESTS
      setTestPhase("Traffic & SEO Integration");

      // Test 4: SEO Meta Tags
      updateResult("SEO Meta Tags", "running", "Checking page metadata...");
      const metaTags = {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
        ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href')
      };

      if (metaTags.title && metaTags.description) {
        updateResult("SEO Meta Tags", "pass", `✅ SEO configured: "${metaTags.title}"`, metaTags);
      } else {
        updateResult("SEO Meta Tags", "fail", "❌ Missing SEO meta tags");
      }

      // Test 5: Traffic Tracking API
      updateResult("Traffic Tracking API", "running", "Testing visitor tracking...");
      try {
        const trackTest = await fetch("/api/track-visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: "test",
            page: "/final-system-test"
          })
        });

        if (trackTest.ok) {
          const trackData = await trackTest.json();
          updateResult("Traffic Tracking API", "pass", `✅ Tracking works! Source: ${trackData.source}`, trackData);
        } else {
          updateResult("Traffic Tracking API", "fail", "❌ Tracking API failed");
        }
      } catch (error: any) {
        updateResult("Traffic Tracking API", "fail", `❌ Error: ${error.message}`);
      }

      // Test 6: Real Traffic Detection
      updateResult("Real Traffic Detection", "running", "Analyzing traffic sources...");
      const { data: trafficSources } = await supabase
        .from("traffic_sources")
        .select("source_name, total_clicks, source_type")
        .eq("status", "active")
        .order("total_clicks", { ascending: false });

      if (trafficSources && trafficSources.length > 0) {
        const totalClicks = trafficSources.reduce((sum, s) => sum + (s.total_clicks || 0), 0);
        const topSource = trafficSources[0];
        updateResult(
          "Real Traffic Detection", 
          "pass", 
          `✅ ${totalClicks} real visitors from ${trafficSources.length} sources. Top: ${topSource.source_name}`,
          trafficSources
        );
      } else {
        updateResult("Real Traffic Detection", "fail", "❌ No traffic detected yet - share your links to get visitors!");
      }

      // PHASE 3: PRODUCT & LINK TESTS
      setTestPhase("Products & Affiliate Links");

      // Test 7: Product Database
      updateResult("Product Database", "running", "Checking products...");
      const { data: products, count: productCount } = await supabase
        .from("affiliate_links")
        .select("*", { count: "exact" })
        .eq("user_id", session.user.id);

      if (productCount && productCount > 0) {
        const temuCount = products?.filter(p => p.network === "Temu Affiliate").length || 0;
        const amazonCount = products?.filter(p => p.network === "Amazon Associates").length || 0;
        updateResult(
          "Product Database",
          "pass",
          `✅ ${productCount} products loaded: Temu (${temuCount}), Amazon (${amazonCount})`
        );
      } else {
        updateResult("Product Database", "fail", "❌ No products found - launch autopilot to add products");
      }

      // Test 8: Link Click Tracking
      if (products && products.length > 0) {
        updateResult("Link Click Tracking", "running", "Testing click API...");
        const testProduct = products[0];
        
        try {
          const clickTest = await fetch("/api/click-tracker", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug: testProduct.cloaked_url?.split("/").pop() || "test"
            })
          });

          if (clickTest.ok) {
            const clickData = await clickTest.json();
            updateResult("Link Click Tracking", "pass", `✅ Click tracking works! Product: ${testProduct.product_name}`, clickData);
          } else {
            updateResult("Link Click Tracking", "fail", "❌ Click tracking failed");
          }
        } catch (error: any) {
          updateResult("Link Click Tracking", "fail", `❌ Error: ${error.message}`);
        }
      }

      // Test 9: Commission Postback API
      if (products && products.length > 0) {
        updateResult("Commission Postback", "running", "Simulating purchase...");
        const testProduct = products[0];
        
        try {
          const postbackTest = await fetch("/api/postback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              network: testProduct.network === "Temu Affiliate" ? "temu_affiliate" : "amazon_associates",
              click_id: testProduct.cloaked_url?.split("/").pop() || "test",
              transaction_id: `TEST-${Date.now()}`,
              amount: 24.99,
              commission: testProduct.network === "Temu Affiliate" ? 4.99 : 1.25,
              status: "approved",
              product_id: testProduct.product_name
            })
          });

          if (postbackTest.ok) {
            const postbackData = await postbackTest.json();
            updateResult("Commission Postback", "pass", `✅ Commission recorded! Amount: $${postbackData.commission}`, postbackData);
          } else {
            updateResult("Commission Postback", "fail", "❌ Postback API failed");
          }
        } catch (error: any) {
          updateResult("Commission Postback", "fail", `❌ Error: ${error.message}`);
        }
      }

      // Test 10: Product Link Validity
      if (products && products.length > 0) {
        updateResult("Product Link Validity", "running", "Validating affiliate URLs...");
        const temuLinks = products.filter(p => p.network === "Temu Affiliate");
        const amazonLinks = products.filter(p => p.network === "Amazon Associates");

        let validTemu = 0;
        let validAmazon = 0;

        temuLinks.forEach(link => {
          if (link.original_url?.includes("temu.to") || link.original_url?.includes("temu.com")) {
            validTemu++;
          }
        });

        amazonLinks.forEach(link => {
          if (link.original_url?.includes("amazon.com/dp/")) {
            validAmazon++;
          }
        });

        const totalValid = validTemu + validAmazon;
        const totalProducts = temuLinks.length + amazonLinks.length;

        if (totalValid === totalProducts) {
          updateResult("Product Link Validity", "pass", `✅ All ${totalProducts} links valid (Temu: ${validTemu}, Amazon: ${validAmazon})`);
        } else {
          updateResult("Product Link Validity", "fail", `⚠️ ${totalProducts - totalValid} invalid links found`);
        }
      }

      // PHASE 4: CAMPAIGN PERFORMANCE
      setTestPhase("Campaign Performance");

      // Test 11: Campaign Stats
      updateResult("Campaign Stats", "running", "Checking campaign performance...");
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (campaigns && campaigns.length > 0) {
        const activeCampaigns = campaigns.filter(c => c.status === "active");
        const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
        
        updateResult(
          "Campaign Stats",
          "pass",
          `✅ ${campaigns.length} campaigns (${activeCampaigns.length} active). Total revenue: $${totalRevenue.toFixed(2)}`
        );
      } else {
        updateResult("Campaign Stats", "fail", "❌ No campaigns found - create one to start earning");
      }

      // PHASE 5: SOCIAL INTEGRATION
      setTestPhase("Social Media Integration");

      // Test 12: Social Share Capability
      updateResult("Social Share Capability", "running", "Testing share functionality...");
      const shareData = {
        title: "Check out this amazing product!",
        text: "I found this great deal on Temu",
        url: window.location.origin + "/go/test-product"
      };

      if (navigator.share) {
        updateResult("Social Share Capability", "pass", "✅ Native sharing enabled (mobile-ready)");
      } else if (navigator.clipboard) {
        updateResult("Social Share Capability", "pass", "✅ Clipboard API enabled (desktop copy-paste)");
      } else {
        updateResult("Social Share Capability", "fail", "⚠️ Limited share capabilities");
      }

      setTestPhase("Complete");

    } catch (error: any) {
      console.error("Test suite error:", error);
      updateResult("System Error", "fail", `❌ Critical error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const passed = results.filter(r => r.status === "pass").length;
  const failed = results.filter(r => r.status === "fail").length;
  const total = results.length;
  const score = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Activity className="h-10 w-10 text-blue-600" />
            Complete System Test
          </h1>
          <p className="text-muted-foreground">
            Full end-to-end verification of all traffic, SEO, and affiliate integrations
          </p>
        </div>

        {/* Test Control */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>System Test Suite</CardTitle>
            <CardDescription>
              Tests 12 critical components including traffic tracking, SEO, affiliate links, and commission tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runCompleteTest}
              disabled={isRunning}
              size="lg"
              className="w-full"
            >
              {isRunning ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Running Tests...</>
              ) : (
                <><Activity className="mr-2 h-5 w-5" /> Run Complete System Test</>
              )}
            </Button>

            {testPhase && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Current Phase: <span className="font-semibold">{testPhase}</span>
              </div>
            )}

            {total > 0 && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-600">{passed}</div>
                    <div className="text-sm text-green-700 dark:text-green-400">Passed</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-red-600">{failed}</div>
                    <div className="text-sm text-red-700 dark:text-red-400">Failed</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-600">{score}%</div>
                    <div className="text-sm text-blue-700 dark:text-blue-400">Score</div>
                  </div>
                </div>

                {/* Overall Status */}
                {!isRunning && (
                  <div className={`p-4 rounded-lg text-center font-semibold ${
                    score === 100 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                    score >= 80 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {score === 100 ? "🎉 ALL TESTS PASSED - SYSTEM FULLY OPERATIONAL!" :
                     score >= 80 ? "⚠️ MOSTLY WORKING - CHECK FAILED TESTS" :
                     "❌ CRITICAL ISSUES FOUND - FIX BEFORE GOING LIVE"}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">Test Results</h2>
            {results.map((result, index) => (
              <Card key={index} className={
                result.status === "pass" ? "border-green-200 bg-green-50/50 dark:bg-green-900/10" :
                result.status === "fail" ? "border-red-200 bg-red-50/50 dark:bg-red-900/10" :
                ""
              }>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {result.status === "pass" && <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />}
                      {result.status === "fail" && <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />}
                      {result.status === "running" && <Loader2 className="h-5 w-5 text-blue-500 animate-spin mt-0.5 flex-shrink-0" />}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1">{result.name}</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.message}</p>
                        
                        {result.details && (
                          <details className="mt-3">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              View technical details
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-48">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant={
                        result.status === "pass" ? "default" : 
                        result.status === "fail" ? "destructive" : 
                        "secondary"
                      }
                      className="ml-4 flex-shrink-0"
                    >
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Success Summary */}
        {!isRunning && total > 0 && score === 100 && (
          <Alert className="mt-8 border-green-500 bg-green-50 dark:bg-green-900/10">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-400">
              <strong>🎉 PERFECT SCORE!</strong> Your affiliate system is fully operational:
              <ul className="mt-3 space-y-1 text-sm">
                <li>✅ Real traffic tracking enabled</li>
                <li>✅ SEO optimized for organic visitors</li>
                <li>✅ Affiliate networks connected</li>
                <li>✅ Click tracking functional</li>
                <li>✅ Commission recording works</li>
                <li>✅ Product links validated</li>
                <li>✅ Social sharing ready</li>
              </ul>
              <p className="mt-4 font-semibold">
                🚀 Your system is LIVE and ready to earn commissions!
              </p>
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}