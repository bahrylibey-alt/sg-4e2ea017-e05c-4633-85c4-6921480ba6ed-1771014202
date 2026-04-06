import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { affiliateIntegrationService } from "@/services/affiliateIntegrationService";
import { CheckCircle, XCircle, Loader2, RefreshCw, Zap, Database } from "lucide-react";

interface TestResult {
  test: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: any;
}

export default function TestIntegrations() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [networkStats, setNetworkStats] = useState<any>(null);

  const runFullTest = async () => {
    setRunning(true);
    setProgress(0);
    setResults([]);
    setNetworkStats(null);

    const testResults: TestResult[] = [];

    try {
      // Test 1: Check Authentication
      setProgress(10);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        testResults.push({
          test: "Authentication",
          status: "fail",
          message: "Not logged in"
        });
        setResults(testResults);
        setRunning(false);
        return;
      }

      testResults.push({
        test: "Authentication",
        status: "pass",
        message: `Logged in as ${session.user.email}`
      });
      setResults([...testResults]);

      // Test 2: Check Product Catalog
      setProgress(25);
      const { data: catalogProducts, error: catalogError } = await supabase
        .from('product_catalog')
        .select('*')
        .eq('status', 'active');

      if (catalogError) throw catalogError;

      const byNetwork = {
        Amazon: catalogProducts?.filter(p => p.network.includes('Amazon')).length || 0,
        Temu: catalogProducts?.filter(p => p.network.includes('Temu')).length || 0,
        AliExpress: catalogProducts?.filter(p => p.network.includes('AliExpress')).length || 0
      };

      setNetworkStats(byNetwork);

      testResults.push({
        test: "Product Catalog",
        status: "pass",
        message: `Found ${catalogProducts?.length || 0} products (Amazon: ${byNetwork.Amazon}, Temu: ${byNetwork.Temu}, AliExpress: ${byNetwork.AliExpress})`,
        details: byNetwork
      });
      setResults([...testResults]);

      // Test 3: Check Current Affiliate Links
      setProgress(40);
      const { data: affiliateLinks, error: linksError } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('user_id', session.user.id);

      if (linksError) throw linksError;

      const linksByNetwork = {
        Amazon: affiliateLinks?.filter(l => l.network.includes('Amazon')).length || 0,
        Temu: affiliateLinks?.filter(l => l.network.includes('Temu')).length || 0,
        AliExpress: affiliateLinks?.filter(l => l.network.includes('AliExpress')).length || 0
      };

      testResults.push({
        test: "Affiliate Links",
        status: "pass",
        message: `Current links: ${affiliateLinks?.length || 0} (Amazon: ${linksByNetwork.Amazon}, Temu: ${linksByNetwork.Temu}, AliExpress: ${linksByNetwork.AliExpress})`,
        details: linksByNetwork
      });
      setResults([...testResults]);

      // Test 4: Test Amazon Integration
      setProgress(55);
      if (byNetwork.Amazon > 0) {
        const amazonTest = await affiliateIntegrationService.testIntegration('Amazon Associates', 'test-key');
        testResults.push({
          test: "Amazon Integration",
          status: amazonTest.success ? "pass" : "fail",
          message: amazonTest.message
        });
      } else {
        testResults.push({
          test: "Amazon Integration",
          status: "warning",
          message: "No Amazon products in catalog"
        });
      }
      setResults([...testResults]);

      // Test 5: Test Temu Integration
      setProgress(70);
      if (byNetwork.Temu > 0) {
        const temuTest = await affiliateIntegrationService.testIntegration('Temu Affiliate', 'test-key');
        testResults.push({
          test: "Temu Integration",
          status: temuTest.success ? "pass" : "fail",
          message: temuTest.message
        });
      } else {
        testResults.push({
          test: "Temu Integration",
          status: "warning",
          message: "No Temu products in catalog"
        });
      }
      setResults([...testResults]);

      // Test 6: Test AliExpress Integration
      setProgress(85);
      if (byNetwork.AliExpress > 0) {
        const aliexpressTest = await affiliateIntegrationService.testIntegration('AliExpress Affiliate', 'test-key');
        testResults.push({
          test: "AliExpress Integration",
          status: aliexpressTest.success ? "pass" : "fail",
          message: aliexpressTest.message
        });
      } else {
        testResults.push({
          test: "AliExpress Integration",
          status: "warning",
          message: "No AliExpress products in catalog"
        });
      }
      setResults([...testResults]);

      setProgress(100);

    } catch (error: any) {
      testResults.push({
        test: "System Error",
        status: "fail",
        message: error.message
      });
      setResults(testResults);
    } finally {
      setRunning(false);
    }
  };

  const syncNetwork = async (network: string) => {
    try {
      const result = await affiliateIntegrationService.syncProducts(network);
      if (result.success) {
        alert(`✅ Synced ${result.productsAdded} products from ${network}!`);
        runFullTest(); // Re-run tests
      } else {
        alert(`❌ Sync failed: ${result.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "fail":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <RefreshCw className="w-5 h-5 text-orange-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              Integration Testing Suite
            </CardTitle>
            <CardDescription>
              Test all affiliate network integrations and product syncing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runFullTest} 
              disabled={running}
              size="lg"
              className="w-full"
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing... {progress}%
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Run Full Integration Test
                </>
              )}
            </Button>

            {running && (
              <Progress value={progress} className="h-2" />
            )}
          </CardContent>
        </Card>

        {networkStats && (
          <Card>
            <CardHeader>
              <CardTitle>Product Catalog Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded">
                  <div className="text-3xl font-bold text-orange-500">{networkStats.Amazon}</div>
                  <div className="text-sm text-muted-foreground">Amazon</div>
                  <Button
                    onClick={() => syncNetwork('Amazon Associates')}
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full"
                  >
                    Sync Amazon
                  </Button>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-3xl font-bold text-red-500">{networkStats.Temu}</div>
                  <div className="text-sm text-muted-foreground">Temu</div>
                  <Button
                    onClick={() => syncNetwork('Temu Affiliate')}
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full"
                  >
                    Sync Temu
                  </Button>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-3xl font-bold text-blue-500">{networkStats.AliExpress}</div>
                  <div className="text-sm text-muted-foreground">AliExpress</div>
                  <Button
                    onClick={() => syncNetwork('AliExpress Affiliate')}
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full"
                  >
                    Sync AliExpress
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.map((result, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-semibold">{result.test}</div>
                    <div className="text-sm text-muted-foreground">{result.message}</div>
                    {result.details && (
                      <pre className="mt-2 p-2 bg-muted rounded text-xs">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                  <Badge variant={result.status === "pass" ? "default" : result.status === "fail" ? "destructive" : "secondary"}>
                    {result.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-1">1. Run Full Test:</p>
              <p className="text-muted-foreground">
                Click the test button to check all integrations and see product counts.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">2. Sync Products:</p>
              <p className="text-muted-foreground">
                Click "Sync [Network]" buttons to import products from catalog to your affiliate links.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">3. Monitor Results:</p>
              <p className="text-muted-foreground">
                Green = working, Orange = needs attention, Red = broken. Fix issues before running campaigns.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}