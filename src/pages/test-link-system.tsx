import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function TestLinkSystem() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);

    try {
      // 1. Get all links
      const { data: links, error: linksError } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('status', 'active');

      if (linksError) throw linksError;

      // 2. Get all products
      const { data: products, error: productsError } = await supabase
        .from('product_catalog')
        .select('*')
        .eq('status', 'active');

      if (productsError) throw productsError;

      // 3. Test each link format
      const linkTests = (links || []).map(link => {
        const hasSlug = !!link.slug;
        const hasCloakedUrl = !!link.cloaked_url;
        const hasOriginalUrl = !!link.original_url;
        const urlValid = link.original_url?.startsWith('http');

        return {
          name: link.product_name,
          network: link.network,
          slug: link.slug,
          status: hasSlug && hasCloakedUrl && hasOriginalUrl && urlValid ? 'valid' : 'invalid',
          issues: [
            !hasSlug && 'Missing slug',
            !hasCloakedUrl && 'Missing cloaked_url',
            !hasOriginalUrl && 'Missing original_url',
            !urlValid && 'Invalid URL format'
          ].filter(Boolean)
        };
      });

      const validLinks = linkTests.filter(t => t.status === 'valid').length;
      const invalidLinks = linkTests.filter(t => t.status === 'invalid').length;

      setResults({
        totalProducts: products?.length || 0,
        totalLinks: links?.length || 0,
        validLinks,
        invalidLinks,
        linkTests,
        products: products || [],
        summary: {
          productsOk: (products?.length || 0) > 0,
          linksOk: validLinks === links?.length && links?.length > 0,
          networkDistribution: links?.reduce((acc: any, link) => {
            acc[link.network] = (acc[link.network] || 0) + 1;
            return acc;
          }, {})
        }
      });
    } catch (error: any) {
      console.error('Test error:', error);
      setResults({
        error: error.message,
        totalProducts: 0,
        totalLinks: 0,
        validLinks: 0,
        invalidLinks: 0
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Link System Test</CardTitle>
            <CardDescription>
              Test your affiliate links and product catalog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runTest} disabled={testing} size="lg" className="w-full">
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing System...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Complete Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {results && !results.error && (
          <>
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {results.totalProducts}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Products Available
                    </div>
                    {results.summary.productsOk ? (
                      <CheckCircle className="w-5 h-5 mx-auto mt-2 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 mx-auto mt-2 text-red-500" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {results.validLinks}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Valid Links
                    </div>
                    <CheckCircle className="w-5 h-5 mx-auto mt-2 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {results.invalidLinks}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Invalid Links
                    </div>
                    {results.invalidLinks > 0 ? (
                      <XCircle className="w-5 h-5 mx-auto mt-2 text-red-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 mx-auto mt-2 text-green-500" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {results.totalLinks}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Total Links
                    </div>
                    {results.summary.linksOk ? (
                      <CheckCircle className="w-5 h-5 mx-auto mt-2 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 mx-auto mt-2 text-red-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Network Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(results.summary.networkDistribution || {}).map(([network, count]: any) => (
                    <div key={network} className="flex items-center justify-between p-3 bg-muted rounded">
                      <span className="font-medium">{network}</span>
                      <Badge variant="secondary">{count} links</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Link Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.linkTests.map((test: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        test.status === 'valid'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{test.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {test.network} • /go/{test.slug}
                          </div>
                          {test.issues.length > 0 && (
                            <div className="mt-2 text-sm text-red-600">
                              Issues: {test.issues.join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {test.status === 'valid' ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/go/${test.slug}`, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Catalog</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.products.map((product: any) => (
                    <div key={product.id} className="p-3 bg-muted rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.network}</div>
                      </div>
                      <Badge variant="secondary">{product.commission_rate}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {results?.error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Test failed: {results.error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}