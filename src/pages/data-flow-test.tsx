import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedStatsService } from "@/services/unifiedStatsService";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function DataFlowTest() {
  const [loading, setLoading] = useState(false);
  const [directQuery, setDirectQuery] = useState<any>(null);
  const [serviceQuery, setServiceQuery] = useState<any>(null);
  const [error, setError] = useState("");

  const runTest = async () => {
    setLoading(true);
    setError("");
    setDirectQuery(null);
    setServiceQuery(null);

    try {
      // Test 1: Direct database queries
      console.log("🔍 Testing direct database queries...");
      const [products, articles, clicks, views, conversions] = await Promise.all([
        supabase.from('affiliate_links').select('id', { count: 'exact', head: true }),
        supabase.from('generated_content').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('click_events').select('id', { count: 'exact', head: true }),
        supabase.from('view_events').select('id', { count: 'exact', head: true }),
        supabase.from('conversion_events').select('revenue').eq('verified', true)
      ]);

      const revenue = conversions.data?.reduce((sum, c) => sum + (Number(c.revenue) || 0), 0) || 0;

      setDirectQuery({
        products: products.count || 0,
        articles: articles.count || 0,
        clicks: clicks.count || 0,
        views: views.count || 0,
        conversions: conversions.data?.length || 0,
        revenue: revenue,
        errors: {
          products: products.error,
          articles: articles.error,
          clicks: clicks.error,
          views: views.error,
          conversions: conversions.error
        }
      });

      console.log("✅ Direct query results:", {
        products: products.count,
        articles: articles.count,
        clicks: clicks.count,
        views: views.count,
        conversions: conversions.data?.length,
        revenue
      });

      // Test 2: UnifiedStatsService
      console.log("🔍 Testing UnifiedStatsService...");
      const stats = await UnifiedStatsService.getStats();
      console.log("✅ UnifiedStatsService results:", stats);
      setServiceQuery(stats);

    } catch (err: any) {
      console.error("❌ Test error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  return (
    <>
      <SEO title="Data Flow Test" description="Verify database connection and data flow" />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Data Flow Diagnostic Test</h1>
            <p className="text-muted-foreground">
              This page tests the complete data flow from database → service → UI
            </p>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Test Status</h2>
              <Button onClick={runTest} disabled={loading} size="sm" variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Re-run Test
              </Button>
            </div>

            {loading && (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-muted-foreground">Running diagnostic tests...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800 dark:text-red-200">Error</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {directQuery && (
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Test 1: Direct Database Queries
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">Products</p>
                      <p className="text-2xl font-bold">{directQuery.products}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">Articles</p>
                      <p className="text-2xl font-bold">{directQuery.articles}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">Clicks</p>
                      <p className="text-2xl font-bold">{directQuery.clicks}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">Views</p>
                      <p className="text-2xl font-bold">{directQuery.views}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">Conversions</p>
                      <p className="text-2xl font-bold">{directQuery.conversions}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold">${directQuery.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                  {Object.values(directQuery.errors).some(e => e) && (
                    <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Query Errors:</p>
                      <pre className="text-xs text-yellow-700 dark:text-yellow-300 overflow-auto">
                        {JSON.stringify(directQuery.errors, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Test 2: UnifiedStatsService
                  </h3>
                  {serviceQuery && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Products</p>
                        <p className="text-2xl font-bold">{serviceQuery.products}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Articles</p>
                        <p className="text-2xl font-bold">{serviceQuery.articles}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Clicks</p>
                        <p className="text-2xl font-bold">{serviceQuery.clicks}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Views</p>
                        <p className="text-2xl font-bold">{serviceQuery.views}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Conversions</p>
                        <p className="text-2xl font-bold">{serviceQuery.conversions}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-2xl font-bold">${serviceQuery.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold mb-2">Data Consistency Check</h3>
                  {directQuery && serviceQuery && (
                    <div className="space-y-2">
                      {directQuery.products === serviceQuery.products ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm">Products match ({directQuery.products})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">Products mismatch: Direct={directQuery.products} Service={serviceQuery.products}</span>
                        </div>
                      )}
                      {directQuery.articles === serviceQuery.articles ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm">Articles match ({directQuery.articles})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">Articles mismatch: Direct={directQuery.articles} Service={serviceQuery.articles}</span>
                        </div>
                      )}
                      {directQuery.clicks === serviceQuery.clicks ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm">Clicks match ({directQuery.clicks})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">Clicks mismatch: Direct={directQuery.clicks} Service={serviceQuery.clicks}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-800 dark:text-blue-200">Next Steps</p>
                      <ol className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1 list-decimal list-inside">
                        <li>Check browser console for logs starting with 🔍, 📊, ✅, or ❌</li>
                        <li>If both tests show real data above, the system is working</li>
                        <li>Go to /autopilot-center or /production-ready and refresh the page</li>
                        <li>Open browser DevTools (F12) → Console to see the logs</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-semibold mb-3">Expected Real Data (from database)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Products:</span>{" "}
                <span className="font-semibold">19</span>
              </div>
              <div>
                <span className="text-muted-foreground">Articles:</span>{" "}
                <span className="font-semibold">12</span>
              </div>
              <div>
                <span className="text-muted-foreground">Clicks:</span>{" "}
                <span className="font-semibold">71</span>
              </div>
              <div>
                <span className="text-muted-foreground">Views:</span>{" "}
                <span className="font-semibold">50</span>
              </div>
              <div>
                <span className="text-muted-foreground">Conversions:</span>{" "}
                <span className="font-semibold">24</span>
              </div>
              <div>
                <span className="text-muted-foreground">Revenue:</span>{" "}
                <span className="font-semibold">$881.01</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              If the numbers above match Test 1 and Test 2 results, your database is connected and working correctly.
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    </>
  );
}