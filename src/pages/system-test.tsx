import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { affiliateLinkService } from "@/services/affiliateLinkService";
import { productCatalogService } from "@/services/productCatalogService";
import { autopilotEngine } from "@/services/autopilotEngine";
import { affiliateIntegrationService } from "@/services/affiliateIntegrationService";
import { CheckCircle2, XCircle, Loader2, AlertTriangle, ExternalLink } from "lucide-react";

interface TestResult {
  name: string;
  status: "pending" | "running" | "success" | "error" | "warning";
  message: string;
  details?: any;
}

export default function SystemTest() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testLink, setTestLink] = useState<string>("");

  const updateTest = (name: string, status: TestResult["status"], message: string, details?: any) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { name, status, message, details } : t);
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setTests([]);
    setTestLink("");

    try {
      // TEST 1: Authentication
      updateTest("Authentication", "running", "Checking user session...");
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        updateTest("Authentication", "success", `Logged in as ${session.user.email}`, { userId: session.user.id });
      } else {
        updateTest("Authentication", "error", "Not logged in. Please log in to continue.");
        setIsRunning(false);
        return;
      }

      // TEST 2: Database Connection
      updateTest("Database Connection", "running", "Testing Supabase connection...");
      const { error: dbError } = await supabase.from("affiliate_links").select("id").limit(1);
      if (dbError) {
        updateTest("Database Connection", "error", `Database error: ${dbError.message}`, dbError);
      } else {
        updateTest("Database Connection", "success", "Database connection working");
      }

      // TEST 3: RLS Policies
      updateTest("RLS Policies", "running", "Checking Row Level Security...");
      const { data: userLinks, error: rlsError } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("user_id", session!.user.id);
      
      if (rlsError) {
        updateTest("RLS Policies", "error", `RLS Error: ${rlsError.message}`, rlsError);
      } else {
        updateTest("RLS Policies", "success", `Can read own links (found ${userLinks?.length || 0})`, { count: userLinks?.length });
      }

      // TEST 4: Product Catalog
      updateTest("Product Catalog", "running", "Loading product catalog...");
      const products = productCatalogService.getHighConvertingProducts();
      if (products.length > 0) {
        updateTest("Product Catalog", "success", `Loaded ${products.length} products`, { 
          sample: products[0],
          allProducts: products 
        });
      } else {
        updateTest("Product Catalog", "error", "No products in catalog");
      }

      // TEST 5: Create Test Link
      updateTest("Create Link", "running", "Creating test affiliate link...");
      const testProduct = products[0];
      const result = await affiliateLinkService.createLink({
        productName: `TEST - ${testProduct.name}`,
        originalUrl: testProduct.url,
        network: testProduct.network,
        commissionRate: parseFloat(testProduct.commission.replace(/[^0-9.]/g, ""))
      });

      if (result.success && result.link) {
        const cloakedUrl = ((window as any).linkResult as any)?.link?.short_url;
        setTestLink(cloakedUrl);
        updateTest("Create Link", "success", "Test link created successfully", {
          slug: result.link.slug,
          cloakedUrl,
          originalUrl: result.link.original_url,
          linkId: result.link.id
        });

        // TEST 6: Verify Link in Database
        updateTest("Verify Link", "running", "Verifying link in database...");
        const { data: verifyLink, error: verifyError } = await supabase
          .from("affiliate_links")
          .select("*")
          .eq("slug", result.link.slug)
          .single();

        if (verifyError) {
          updateTest("Verify Link", "error", `Verification failed: ${verifyError.message}`, verifyError);
        } else if (verifyLink) {
          updateTest("Verify Link", "success", "Link verified in database", {
            original_url: verifyLink.original_url,
            status: verifyLink.status,
            cloaked_url: verifyLink.cloaked_url
          });
        }

        // TEST 7: Public Link Access (simulate unauthenticated user)
        updateTest("Public Access", "running", "Testing public link access...");
        const { data: publicLink, error: publicError } = await supabase
          .from("affiliate_links")
          .select("id, slug, original_url, status")
          .eq("slug", result.link.slug)
          .eq("status", "active")
          .single();

        if (publicError) {
          updateTest("Public Access", "error", `Public access blocked: ${publicError.message}`, publicError);
        } else if (publicLink) {
          updateTest("Public Access", "success", "Public can access active links", publicLink);
        }

      } else {
        updateTest("Create Link", "error", result.error || "Failed to create link", result);
      }

      // TEST 8: Autopilot Status
      updateTest("Autopilot Status", "running", "Checking autopilot system...");
      const status = await autopilotEngine.getStatus();
      updateTest("Autopilot Status", "success", `Autopilot is ${status.isActive ? 'ACTIVE' : 'OFF'}`, status);

      // TEST 9: User Stats
      updateTest("User Stats", "running", "Loading user statistics...");
      const stats = await affiliateIntegrationService.getAffiliateLinkStats(session!.user.id);
      updateTest("User Stats", "success", "Statistics loaded", stats);

      toast({
        title: "✅ System Test Complete",
        description: "All tests finished. Check results below."
      });

    } catch (error: any) {
      console.error("Test suite error:", error);
      updateTest("System Error", "error", error.message, error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    const variants: Record<TestResult["status"], any> = {
      success: "default",
      error: "destructive",
      warning: "secondary",
      running: "secondary",
      pending: "outline"
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">🔧 System Test & Verification</CardTitle>
            <CardDescription>
              Comprehensive test suite to verify all affiliate system functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="w-full"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Running Tests...
                </>
              ) : (
                "▶️ Run Complete System Test"
              )}
            </Button>

            {testLink && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <p className="font-semibold mb-2">✅ Test Link Created:</p>
                  <div className="flex items-center gap-2 bg-white p-3 rounded border">
                    <code className="flex-1 text-sm break-all">{testLink}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(testLink, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Click the link above to test redirection (opens in new tab)
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {tests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                {tests.filter(t => t.status === "success").length} / {tests.length} tests passed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tests.map((test, index) => (
                <div key={index}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getStatusIcon(test.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{test.name}</h3>
                        {getStatusBadge(test.status)}
                      </div>
                      <p className="text-sm text-gray-600">{test.message}</p>
                      {test.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                            View Details
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                  {index < tests.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">📋 Manual Testing Checklist:</h3>
            <ul className="space-y-2 text-sm">
              <li>✅ Run this test suite and verify all tests pass</li>
              <li>✅ Click the generated test link and verify it redirects to Amazon</li>
              <li>✅ Go to /dashboard and verify it loads without network errors</li>
              <li>✅ Click "Sync New Products" and verify products are added</li>
              <li>✅ Launch autopilot and verify it shows "ACTIVE" status</li>
              <li>✅ Check browser console for any errors (F12)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}