import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  RefreshCw,
  Zap,
  Shield,
  TrendingUp,
  Database,
  Link as LinkIcon
} from "lucide-react";

interface DiagnosticResult {
  test: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: any;
}

export default function SystemDiagnostics() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState("");
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [linkTests, setLinkTests] = useState<any[]>([]);
  const [repairResult, setRepairResult] = useState<any>(null);

  const runFullDiagnostics = async () => {
    setRunning(true);
    setProgress(0);
    setResults([]);
    setLinkTests([]);
    setRepairResult(null);

    const diagnostics: DiagnosticResult[] = [];

    try {
      // Test 1: Authentication
      setCurrentTest("Testing Authentication...");
      setProgress(10);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        diagnostics.push({
          test: "Authentication",
          status: "fail",
          message: "Not logged in"
        });
        setResults(diagnostics);
        setRunning(false);
        return;
      }

      diagnostics.push({
        test: "Authentication",
        status: "pass",
        message: `Logged in as: ${session.user.email}`
      });
      setResults([...diagnostics]);

      // Test 2: Database Connection
      setCurrentTest("Testing Database Connection...");
      setProgress(20);

      const { data: links, error: dbError } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", session.user.id)
        .limit(1);

      if (dbError) {
        diagnostics.push({
          test: "Database Connection",
          status: "fail",
          message: dbError.message
        });
      } else {
        diagnostics.push({
          test: "Database Connection",
          status: "pass",
          message: "Database connected successfully"
        });
      }
      setResults([...diagnostics]);

      // Test 3: Count and Analyze Links
      setCurrentTest("Analyzing Affiliate Links...");
      setProgress(30);

      const { data: allLinks, error: linksError } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", session.user.id);

      if (linksError) throw linksError;

      const activeLinks = allLinks?.filter(l => l.status === "active") || [];
      const pausedLinks = allLinks?.filter(l => l.status === "paused") || [];
      const temuLinks = activeLinks.filter(l => l.network?.toLowerCase().includes("temu"));
      const amazonLinks = activeLinks.filter(l => l.network?.toLowerCase().includes("amazon"));

      diagnostics.push({
        test: "Link Analysis",
        status: "pass",
        message: `Found ${allLinks?.length || 0} total links (${activeLinks.length} active, ${pausedLinks.length} paused)`,
        details: {
          total: allLinks?.length || 0,
          active: activeLinks.length,
          paused: pausedLinks.length,
          temu: temuLinks.length,
          amazon: amazonLinks.length
        }
      });
      setResults([...diagnostics]);

      // Test 4: Check Temu Links Structure
      setCurrentTest("Checking Temu Links...");
      setProgress(40);

      if (temuLinks.length > 0) {
        const temuAnalysis = temuLinks.map(link => {
          const hasGoodsId = link.original_url?.includes("goods_id=");
          const hasValidFormat = link.original_url?.startsWith("http");
          return {
            name: link.product_name,
            slug: link.slug,
            hasGoodsId,
            hasValidFormat,
            url: link.original_url
          };
        });

        const validTemu = temuAnalysis.filter(t => t.hasGoodsId && t.hasValidFormat);
        const invalidTemu = temuAnalysis.filter(t => !t.hasGoodsId || !t.hasValidFormat);

        diagnostics.push({
          test: "Temu Link Validation",
          status: invalidTemu.length > 0 ? "warning" : "pass",
          message: `${validTemu.length}/${temuLinks.length} Temu links have valid structure`,
          details: { valid: validTemu, invalid: invalidTemu }
        });
      } else {
        diagnostics.push({
          test: "Temu Link Validation",
          status: "warning",
          message: "No Temu links found"
        });
      }
      setResults([...diagnostics]);

      // Test 5: Test Smart Repair API
      setCurrentTest("Testing Smart Repair API...");
      setProgress(60);

      try {
        const repairResponse = await fetch("/api/smart-repair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id })
        });

        if (!repairResponse.ok) {
          const errorText = await repairResponse.text();
          throw new Error(`API returned ${repairResponse.status}: ${errorText.substring(0, 200)}`);
        }

        const repairData = await repairResponse.json();
        setRepairResult(repairData);

        diagnostics.push({
          test: "Smart Repair API",
          status: "pass",
          message: `API working! Checked ${repairData.totalChecked} links, removed ${repairData.deadRemoved}, replaced ${repairData.replaced}`,
          details: repairData
        });
      } catch (err: any) {
        diagnostics.push({
          test: "Smart Repair API",
          status: "fail",
          message: err.message,
          details: { error: err.message }
        });
      }
      setResults([...diagnostics]);

      // Test 6: Test Real Redirects
      setCurrentTest("Testing Link Redirects...");
      setProgress(80);

      const testLinks = activeLinks.slice(0, 10);
      const redirectTests = [];

      for (const link of testLinks) {
        try {
          const redirectUrl = `/go/${link.slug}`;
          const response = await fetch(redirectUrl, {
            method: "HEAD",
            redirect: "manual"
          });

          redirectTests.push({
            slug: link.slug,
            product: link.product_name,
            network: link.network,
            status: response.status,
            working: response.status === 302 || response.status === 307 || response.status === 301,
            url: redirectUrl
          });
        } catch (err: any) {
          redirectTests.push({
            slug: link.slug,
            product: link.product_name,
            network: link.network,
            status: 0,
            working: false,
            error: err.message
          });
        }
      }

      setLinkTests(redirectTests);
      const workingCount = redirectTests.filter(r => r.working).length;

      diagnostics.push({
        test: "Redirect System",
        status: workingCount > 0 ? "pass" : "fail",
        message: `${workingCount}/${redirectTests.length} redirects working`,
        details: redirectTests
      });
      setResults([...diagnostics]);

      setProgress(100);
      setCurrentTest("Diagnostics Complete!");

    } catch (err: any) {
      console.error("Diagnostic error:", err);
      diagnostics.push({
        test: "System Error",
        status: "fail",
        message: err.message
      });
      setResults(diagnostics);
    } finally {
      setRunning(false);
    }
  };

  const testSingleLink = (slug: string) => {
    window.open(`/go/${slug}`, "_blank");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "fail":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Complete System Diagnostics
            </CardTitle>
            <CardDescription>
              Deep testing of authentication, database, links, repair API, and redirect system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runFullDiagnostics} 
              disabled={running}
              size="lg"
              className="w-full"
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Diagnostics... {progress}%
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Run Complete Diagnostics
                </>
              )}
            </Button>

            {running && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{currentTest}</span>
                  <span className="font-bold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Diagnostic Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.map((result, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-semibold">{result.test}</div>
                      <div className="text-sm text-muted-foreground">{result.message}</div>
                      
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-primary cursor-pointer">View Details</summary>
                          <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-64">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <Badge variant={result.status === "pass" ? "default" : result.status === "fail" ? "destructive" : "secondary"}>
                      {result.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {repairResult && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                Smart Repair Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded">
                  <div className="text-3xl font-bold">{repairResult.totalChecked}</div>
                  <div className="text-sm text-muted-foreground">Checked</div>
                </div>
                <div className="text-center p-4 bg-red-500/5 rounded">
                  <div className="text-3xl font-bold text-red-500">{repairResult.deadRemoved}</div>
                  <div className="text-sm text-muted-foreground">Removed</div>
                </div>
                <div className="text-center p-4 bg-green-500/5 rounded">
                  <div className="text-3xl font-bold text-green-500">{repairResult.replaced}</div>
                  <div className="text-sm text-muted-foreground">Replaced</div>
                </div>
                <div className="text-center p-4 bg-blue-500/5 rounded">
                  <div className="text-3xl font-bold text-blue-500">
                    {repairResult.totalChecked - repairResult.deadRemoved}
                  </div>
                  <div className="text-sm text-muted-foreground">Healthy</div>
                </div>
              </div>

              {repairResult.deadLinks && repairResult.deadLinks.length > 0 && (
                <div className="mt-4 p-4 border rounded">
                  <h4 className="font-semibold mb-2">Removed Dead Links:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {repairResult.deadLinks.map((name: string, idx: number) => (
                      <li key={idx}>• {name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {linkTests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Redirect Tests (First 10 Links)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {linkTests.map((test, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{test.product}</span>
                      <Badge variant="outline" className="text-xs">{test.network}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{test.url}</div>
                    {test.error && (
                      <div className="text-xs text-red-500 mt-1">{test.error}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {test.working ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
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
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-lg">Understanding the Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-1">✅ What "Pass" Means:</p>
              <p className="text-muted-foreground">
                The system component is working correctly. Green checkmarks indicate healthy systems.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">⚠️ What "Warning" Means:</p>
              <p className="text-muted-foreground">
                The system works but has issues. Orange alerts indicate problems that need attention but aren't critical.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">❌ What "Fail" Means:</p>
              <p className="text-muted-foreground">
                The system component is broken and needs immediate fixing. Red X marks indicate critical failures.
              </p>
            </div>
            <div className="pt-3 border-t">
              <p className="font-semibold mb-1">About Temu Security Verification:</p>
              <p className="text-muted-foreground">
                Temu shows CAPTCHAs for affiliate redirects as anti-bot protection. This is normal. 
                The repair system validates URL structure (goods_id presence) but cannot bypass Temu's CAPTCHA.
                Users solve the puzzle once, then the link works normally.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}