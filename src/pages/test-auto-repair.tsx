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
  TrendingUp
} from "lucide-react";

interface TestResult {
  stage: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: any;
}

export default function TestAutoRepair() {
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  const [results, setResults] = useState<TestResult[]>([]);
  const [repairResult, setRepairResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runComprehensiveTest = async () => {
    setTesting(true);
    setError(null);
    setResults([]);
    setRepairResult(null);
    setProgress(0);

    const testResults: TestResult[] = [];

    try {
      // Stage 1: Authentication Check
      setCurrentStage("Checking Authentication...");
      setProgress(10);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        testResults.push({
          stage: "Authentication",
          status: "error",
          message: "Not logged in. Please log in first."
        });
        setResults(testResults);
        setTesting(false);
        return;
      }

      testResults.push({
        stage: "Authentication",
        status: "success",
        message: `✅ Authenticated as: ${session.user.email}`
      });
      setResults([...testResults]);

      // Stage 2: Database Links Check
      setCurrentStage("Checking Database Links...");
      setProgress(25);

      const { data: links, error: linksError } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (linksError) throw linksError;

      const activeLinks = links?.filter(l => l.status === "active") || [];
      const temuLinks = activeLinks.filter(l => l.network?.includes("Temu"));
      const amazonLinks = activeLinks.filter(l => l.network?.includes("Amazon"));
      const aliexpressLinks = activeLinks.filter(l => l.network?.includes("AliExpress"));

      testResults.push({
        stage: "Database Check",
        status: "success",
        message: `✅ Found ${links?.length || 0} total links (${activeLinks.length} active)`,
        details: {
          total: links?.length || 0,
          active: activeLinks.length,
          temu: temuLinks.length,
          amazon: amazonLinks.length,
          aliexpress: aliexpressLinks.length
        }
      });
      setResults([...testResults]);

      // Stage 3: Test Smart Repair API
      setCurrentStage("Testing Smart Repair API...");
      setProgress(50);

      console.log("🔧 Calling Smart Repair API...");
      const repairResponse = await fetch("/api/smart-repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: session.user.id,
          testMode: true // Don't actually delete anything in test mode
        })
      });

      if (!repairResponse.ok) {
        const errorText = await repairResponse.text();
        throw new Error(`API returned ${repairResponse.status}: ${errorText.substring(0, 200)}`);
      }

      const repairData = await repairResponse.json();
      console.log("✅ Smart Repair Result:", repairData);
      setRepairResult(repairData);

      testResults.push({
        stage: "Smart Repair API",
        status: "success",
        message: `✅ API working! Checked ${repairData.totalChecked} links, found ${repairData.invalidLinks?.length || 0} issues`,
        details: repairData
      });
      setResults([...testResults]);

      // Stage 4: Test Actual Redirects
      setCurrentStage("Testing Link Redirects...");
      setProgress(75);

      const testLinks = activeLinks.slice(0, 5); // Test first 5 links
      const redirectResults = [];

      for (const link of testLinks) {
        try {
          const redirectUrl = `/go/${link.slug}`;
          const response = await fetch(redirectUrl, {
            method: "HEAD",
            redirect: "manual"
          });

          redirectResults.push({
            slug: link.slug,
            product: link.product_name,
            network: link.network,
            status: response.status,
            working: response.status === 302 || response.status === 307
          });
        } catch (err: any) {
          redirectResults.push({
            slug: link.slug,
            product: link.product_name,
            network: link.network,
            status: 0,
            working: false,
            error: err.message
          });
        }
      }

      const workingRedirects = redirectResults.filter(r => r.working).length;
      testResults.push({
        stage: "Redirect Tests",
        status: workingRedirects > 0 ? "success" : "error",
        message: `${workingRedirects}/${redirectResults.length} redirects working`,
        details: redirectResults
      });
      setResults([...testResults]);

      // Stage 5: Temu Link Analysis
      if (temuLinks.length > 0) {
        setCurrentStage("Analyzing Temu Links...");
        setProgress(90);

        const temuAnalysis = temuLinks.map(link => ({
          name: link.product_name,
          url: link.original_url,
          hasGoodsId: link.original_url?.includes("goods_id="),
          slug: link.slug,
          status: link.status
        }));

        const validTemu = temuAnalysis.filter(t => t.hasGoodsId);
        testResults.push({
          stage: "Temu Analysis",
          status: validTemu.length > 0 ? "success" : "warning",
          message: `${validTemu.length}/${temuLinks.length} Temu links have valid goods_id`,
          details: temuAnalysis
        });
        setResults([...testResults]);
      }

      setProgress(100);
      setCurrentStage("Test Complete!");

    } catch (err: any) {
      console.error("❌ Test Failed:", err);
      setError(err.message);
      testResults.push({
        stage: "System Error",
        status: "error",
        message: err.message
      });
      setResults(testResults);
    } finally {
      setTesting(false);
    }
  };

  const runActualRepair = async () => {
    if (!confirm("This will actually remove broken links and add new ones. Continue?")) {
      return;
    }

    setTesting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Please log in first");
        setTesting(false);
        return;
      }

      const response = await fetch("/api/smart-repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: session.user.id,
          testMode: false // Actually repair
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      setRepairResult(result);
      
      alert(`Repair Complete!\n\nChecked: ${result.totalChecked}\nRemoved: ${result.deadRemoved}\nAdded: ${result.replaced}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Smart Auto-Repair System - Deep Test
            </CardTitle>
            <CardDescription>
              Comprehensive testing of link validation, repair API, and redirect system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button 
                onClick={runComprehensiveTest} 
                disabled={testing}
                size="lg"
                className="flex-1"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing... {progress}%
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Run Deep Test (Safe - No Changes)
                  </>
                )}
              </Button>

              <Button 
                onClick={runActualRepair}
                disabled={testing}
                size="lg"
                variant="destructive"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Actual Repair (Will Modify Links!)
              </Button>
            </div>

            {testing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{currentStage}</span>
                  <span className="font-bold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((result, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {result.status === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {result.status === "error" && <XCircle className="w-5 h-5 text-red-500" />}
                    {result.status === "warning" && <AlertCircle className="w-5 h-5 text-orange-500" />}
                    <div>
                      <div className="font-semibold">{result.stage}</div>
                      <div className="text-sm text-muted-foreground">{result.message}</div>
                    </div>
                  </div>

                  {result.details && (
                    <div className="mt-3 p-3 bg-muted rounded text-xs font-mono">
                      <pre className="overflow-auto max-h-64">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {repairResult && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Repair Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded">
                  <div className="text-3xl font-bold">{repairResult.totalChecked}</div>
                  <div className="text-sm text-muted-foreground">Links Checked</div>
                </div>
                <div className="text-center p-4 bg-red-500/5 rounded">
                  <div className="text-3xl font-bold text-red-500">{repairResult.deadRemoved}</div>
                  <div className="text-sm text-muted-foreground">Removed</div>
                </div>
                <div className="text-center p-4 bg-green-500/5 rounded">
                  <div className="text-3xl font-bold text-green-500">{repairResult.replaced}</div>
                  <div className="text-sm text-muted-foreground">Added Fresh</div>
                </div>
                <div className="text-center p-4 bg-orange-500/5 rounded">
                  <div className="text-3xl font-bold text-orange-500">
                    {repairResult.invalidLinks?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Issues Found</div>
                </div>
              </div>

              {repairResult.invalidLinks && repairResult.invalidLinks.length > 0 && (
                <div className="mt-4 p-4 border rounded">
                  <h4 className="font-semibold mb-2">Invalid Links Detected:</h4>
                  <ul className="space-y-1 text-sm">
                    {repairResult.invalidLinks.map((link: any, idx: number) => (
                      <li key={idx} className="text-muted-foreground">
                        • {link.product_name} ({link.network}) - {link.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-lg">About Temu Security Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>Why does Temu show a CAPTCHA?</strong>
            </p>
            <p className="text-muted-foreground">
              Temu's anti-bot system detects affiliate redirects and requires human verification. 
              This is normal and expected behavior for affiliate marketing.
            </p>
            <div className="p-3 bg-background rounded border">
              <p className="font-semibold mb-2">What This System Does:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>✓ Validates Temu URLs have correct goods_id format</li>
                <li>✓ Removes links with missing or invalid product IDs</li>
                <li>✓ Replaces broken links with fresh verified products</li>
                <li>✓ Tracks click failures automatically</li>
              </ul>
            </div>
            <p className="text-muted-foreground">
              Users will see the CAPTCHA once, solve it, then the link works normally. 
              This is standard for affiliate marketing and cannot be completely avoided.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}