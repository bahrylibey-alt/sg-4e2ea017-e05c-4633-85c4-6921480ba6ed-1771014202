import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, XCircle, Loader2, ExternalLink, RefreshCw } from "lucide-react";

export default function TrafficTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testFullSystem = async () => {
    setTesting(true);
    setError(null);
    setResults(null);

    try {
      console.log("🚀 Starting Full System Test...");

      // Step 1: Get session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Please log in first");
        setTesting(false);
        return;
      }

      const userId = session.user.id;
      console.log("✅ User authenticated:", userId);

      // Step 2: Get all affiliate links
      const { data: links, error: linksError } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (linksError) throw linksError;

      console.log(`📊 Found ${links?.length || 0} links`);

      // Step 3: Test each link by trying to redirect
      const linkTests = [];
      const maxTests = 10; // Test first 10 links

      for (const link of (links || []).slice(0, maxTests)) {
        console.log(`Testing link: ${link.slug}`);
        
        const testResult = {
          slug: link.slug,
          productName: link.product_name,
          network: link.network,
          status: link.status,
          originalUrl: link.original_url,
          redirectTest: "not_tested",
          redirectError: null
        };

        try {
          // Try to fetch the redirect endpoint
          const redirectResponse = await fetch(`/go/${link.slug}`, {
            method: "HEAD",
            redirect: "manual"
          });

          if (redirectResponse.status === 302 || redirectResponse.status === 307) {
            testResult.redirectTest = "success";
          } else {
            testResult.redirectTest = "failed";
            testResult.redirectError = `HTTP ${redirectResponse.status}`;
          }
        } catch (err: any) {
          testResult.redirectTest = "error";
          testResult.redirectError = err.message;
        }

        linkTests.push(testResult);
      }

      // Step 4: Test Smart Repair API
      console.log("🔧 Testing Smart Repair API...");
      let repairResult = null;
      try {
        const repairResponse = await fetch("/api/smart-repair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId })
        });

        if (repairResponse.ok) {
          repairResult = await repairResponse.json();
          console.log("✅ Smart Repair Result:", repairResult);
        } else {
          const errorText = await repairResponse.text();
          console.error("❌ Smart Repair Failed:", errorText);
          repairResult = { error: errorText.substring(0, 200) };
        }
      } catch (err: any) {
        console.error("❌ Smart Repair Error:", err);
        repairResult = { error: err.message };
      }

      // Step 5: Get campaign info
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1);

      setResults({
        totalLinks: links?.length || 0,
        activeLinks: links?.filter(l => l.status === "active").length || 0,
        pausedLinks: links?.filter(l => l.status === "paused").length || 0,
        linkTests,
        repairResult,
        campaign: campaigns?.[0] || null,
        networks: {
          amazon: links?.filter(l => l.network?.includes("Amazon")).length || 0,
          temu: links?.filter(l => l.network?.includes("Temu")).length || 0,
          aliexpress: links?.filter(l => l.network?.includes("AliExpress")).length || 0
        }
      });

      console.log("✅ Full System Test Complete");
    } catch (err: any) {
      console.error("❌ Test Failed:", err);
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const testSingleLink = async (slug: string) => {
    try {
      console.log(`Testing single link: ${slug}`);
      
      // Open in new tab to see what happens
      window.open(`/go/${slug}`, "_blank");
    } catch (err: any) {
      console.error("Error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Complete Traffic & Link System Test</CardTitle>
            <CardDescription>
              Test your entire affiliate link system end-to-end with real database queries and API calls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testFullSystem} 
              disabled={testing}
              size="lg"
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Complete System Test...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Full System Test
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {results && (
          <>
            {/* Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle>📊 System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Links</p>
                    <p className="text-2xl font-bold">{results.totalLinks}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Active Links</p>
                    <p className="text-2xl font-bold text-green-500">{results.activeLinks}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Paused Links</p>
                    <p className="text-2xl font-bold text-orange-500">{results.pausedLinks}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Campaign</p>
                    <p className="text-2xl font-bold">
                      {results.campaign ? "✓" : "✗"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-semibold mb-2">Networks:</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Amazon: {results.networks.amazon}</Badge>
                    <Badge variant="secondary">Temu: {results.networks.temu}</Badge>
                    <Badge variant="secondary">AliExpress: {results.networks.aliexpress}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Smart Repair Results */}
            {results.repairResult && (
              <Card>
                <CardHeader>
                  <CardTitle>🔧 Smart Repair API Test</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.repairResult.error ? (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        API Error: {results.repairResult.error}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Smart Repair API is working correctly
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Links Checked</p>
                          <p className="text-2xl font-bold">{results.repairResult.totalChecked}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Dead Removed</p>
                          <p className="text-2xl font-bold text-red-500">{results.repairResult.deadRemoved}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Replaced</p>
                          <p className="text-2xl font-bold text-green-500">{results.repairResult.replaced}</p>
                        </div>
                      </div>

                      {results.repairResult.deadLinks?.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-semibold mb-2">Removed Dead Links:</p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {results.repairResult.deadLinks.map((name: string, i: number) => (
                              <li key={i}>{name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Link Redirect Tests */}
            <Card>
              <CardHeader>
                <CardTitle>🔗 Link Redirect Tests (First 10)</CardTitle>
                <CardDescription>
                  Testing actual redirect functionality for each link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.linkTests.map((test: any, index: number) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{test.productName}</p>
                          <Badge variant={test.status === "active" ? "default" : "secondary"}>
                            {test.status}
                          </Badge>
                          <Badge variant="outline">{test.network}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">/go/{test.slug}</p>
                        {test.redirectError && (
                          <p className="text-xs text-red-500">Error: {test.redirectError}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {test.redirectTest === "success" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : test.redirectTest === "failed" ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-orange-500" />
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => testSingleLink(test.slug)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!results && !testing && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Click "Run Full System Test" to start testing your link system</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}