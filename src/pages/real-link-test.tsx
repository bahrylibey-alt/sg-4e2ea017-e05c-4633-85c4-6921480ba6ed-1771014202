import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface LinkTestResult {
  id: string;
  slug: string;
  product_name: string;
  network: string;
  original_url: string;
  test_status: "pending" | "testing" | "success" | "failed" | "timeout" | "captcha";
  redirect_url?: string;
  error_message?: string;
  response_time?: number;
}

export default function RealLinkTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<LinkTestResult[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    success: 0,
    failed: 0,
    timeout: 0,
    captcha: 0
  });

  const testSingleLink = async (link: any): Promise<LinkTestResult> => {
    const startTime = Date.now();
    const testUrl = `${window.location.origin}/go/${link.slug}`;

    try {
      // Test 1: Try to fetch the redirect (will fail if CAPTCHA/timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(testUrl, {
        method: "HEAD",
        redirect: "manual", // Don't follow redirects
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      // Check response
      if (response.status === 302 || response.status === 301) {
        const redirectUrl = response.headers.get("location");
        
        // Test 2: Check if redirect URL is valid
        if (redirectUrl) {
          // For Temu links, check if we get CAPTCHA
          if (link.network === "Temu Affiliate" && redirectUrl.includes("temu.com")) {
            try {
              const temuCheck = await fetch(redirectUrl, {
                method: "HEAD",
                signal: AbortSignal.timeout(3000)
              });
              
              // If we get a CAPTCHA page (usually returns HTML with "security verification")
              if (temuCheck.headers.get("content-type")?.includes("text/html")) {
                return {
                  ...link,
                  test_status: "captcha",
                  redirect_url: redirectUrl,
                  error_message: "Temu CAPTCHA/Security Verification Detected",
                  response_time: responseTime
                };
              }
            } catch (err: any) {
              if (err.name === "AbortError" || err.message?.includes("timeout")) {
                return {
                  ...link,
                  test_status: "timeout",
                  redirect_url: redirectUrl,
                  error_message: "Temu link timeout (possible rate limiting)",
                  response_time: responseTime
                };
              }
            }
          }

          return {
            ...link,
            test_status: "success",
            redirect_url: redirectUrl,
            response_time: responseTime
          };
        }
      }

      return {
        ...link,
        test_status: "failed",
        error_message: `Unexpected status: ${response.status}`,
        response_time: responseTime
      };

    } catch (err: any) {
      const responseTime = Date.now() - startTime;
      
      if (err.name === "AbortError") {
        return {
          ...link,
          test_status: "timeout",
          error_message: "Request timeout (5s)",
          response_time: responseTime
        };
      }

      return {
        ...link,
        test_status: "failed",
        error_message: err.message || "Unknown error",
        response_time: responseTime
      };
    }
  };

  const runComprehensiveTest = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      // Get all links from database
      const { data: links, error } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!links || links.length === 0) {
        alert("No links found in database");
        setTesting(false);
        return;
      }

      console.log(`🧪 Testing ${links.length} links...`);

      const testResults: LinkTestResult[] = [];
      let successCount = 0;
      let failedCount = 0;
      let timeoutCount = 0;
      let captchaCount = 0;

      // Test links in batches of 3 to avoid overwhelming the system
      for (let i = 0; i < links.length; i += 3) {
        const batch = links.slice(i, i + 3);
        const batchResults = await Promise.all(
          batch.map(link => testSingleLink(link))
        );

        batchResults.forEach(result => {
          testResults.push(result);
          
          if (result.test_status === "success") successCount++;
          else if (result.test_status === "failed") failedCount++;
          else if (result.test_status === "timeout") timeoutCount++;
          else if (result.test_status === "captcha") captchaCount++;
        });

        // Update results progressively
        setResults([...testResults]);
        setSummary({
          total: testResults.length,
          success: successCount,
          failed: failedCount,
          timeout: timeoutCount,
          captcha: captchaCount
        });

        // Wait 1 second between batches to avoid rate limiting
        if (i + 3 < links.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log("✅ Test complete", {
        total: testResults.length,
        success: successCount,
        failed: failedCount,
        timeout: timeoutCount,
        captcha: captchaCount
      });

    } catch (error: any) {
      console.error("Test failed:", error);
      alert(`Test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = (status: LinkTestResult["test_status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Working</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case "timeout":
        return <Badge className="bg-orange-500"><AlertTriangle className="w-3 h-3 mr-1" /> Timeout</Badge>;
      case "captcha":
        return <Badge className="bg-red-600"><AlertTriangle className="w-3 h-3 mr-1" /> CAPTCHA</Badge>;
      case "testing":
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Testing...</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Real Link Testing System</h1>
          <p className="text-muted-foreground mt-2">
            Tests actual link redirects and detects CAPTCHA, timeouts, and failures
          </p>
        </div>

        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={runComprehensiveTest}
              disabled={testing}
              size="lg"
              className="w-full"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testing Links... ({results.length} tested)
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Run Comprehensive Link Test
                </>
              )}
            </Button>

            {results.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold">{summary.total}</div>
                  <div className="text-sm text-muted-foreground">Total Tested</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-3xl font-bold text-green-600">{summary.success}</div>
                  <div className="text-sm text-muted-foreground">Working</div>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="text-3xl font-bold text-red-600">{summary.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="text-3xl font-bold text-orange-600">{summary.timeout}</div>
                  <div className="text-sm text-muted-foreground">Timeout</div>
                </div>
                <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-3xl font-bold text-purple-600">{summary.captcha}</div>
                  <div className="text-sm text-muted-foreground">CAPTCHA</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(result.test_status)}
                        <span className="font-medium">{result.product_name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {result.network}
                          </Badge>
                          <span className="font-mono text-xs">/go/{result.slug}</span>
                          {result.response_time && (
                            <span className="text-xs">
                              ({result.response_time}ms)
                            </span>
                          )}
                        </div>
                      </div>
                      {result.error_message && (
                        <div className="text-xs text-red-500 font-mono mt-1">
                          ❌ {result.error_message}
                        </div>
                      )}
                      {result.redirect_url && (
                        <div className="text-xs text-muted-foreground font-mono mt-1 truncate">
                          → {result.redirect_url}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground font-mono mt-1 truncate">
                        Original: {result.original_url}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/go/${result.slug}`, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>What This Test Does</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>✅ Tests actual /go/[slug] redirects</p>
            <p>✅ Detects Temu CAPTCHA/Security Verification</p>
            <p>✅ Detects timeout issues (5s limit)</p>
            <p>✅ Measures response times</p>
            <p>✅ Shows redirect destinations</p>
            <p>✅ Tests in batches to avoid rate limiting</p>
            <p className="text-orange-600 font-medium mt-4">
              ⚠️ This test will show you exactly which links are broken and why!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}