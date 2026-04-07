import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function TrafficTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);

    try {
      // 1. Check database connections
      const { data: links, error: linksError } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('status', 'active')
        .limit(10);

      // 2. Test each link's redirect
      const linkTests = await Promise.all(
        (links || []).map(async (link) => {
          try {
            const redirectUrl = `/go/${link.slug}`;
            return {
              name: link.product_name,
              slug: link.slug,
              network: link.network,
              originalUrl: link.original_url,
              redirectUrl: redirectUrl,
              status: 'working'
            };
          } catch (err) {
            return {
              name: link.product_name,
              slug: link.slug,
              error: err instanceof Error ? err.message : 'Unknown error',
              status: 'error'
            };
          }
        })
      );

      setResults({
        totalLinks: links?.length || 0,
        working: linkTests.filter(t => t.status === 'working').length,
        failed: linkTests.filter(t => t.status === 'error').length,
        links: linkTests,
        dbError: linksError
      });
    } catch (error) {
      console.error('Test failed:', error);
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Complete Link System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={runTest} disabled={testing} size="lg" className="w-full">
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Run Complete Test'
            )}
          </Button>

          {results && (
            <div className="space-y-4">
              {results.error ? (
                <Alert className="border-red-500 bg-red-50">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {results.error}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold">{results.totalLinks}</p>
                        <p className="text-sm text-muted-foreground">Total Links</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-green-600">{results.working}</p>
                        <p className="text-sm text-muted-foreground">Working</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-red-600">{results.failed}</p>
                        <p className="text-sm text-muted-foreground">Failed</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Link Details:</h3>
                    {results.links.map((link: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {link.status === 'working' ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                )}
                                <p className="font-semibold">{link.name}</p>
                                <Badge variant="secondary">{link.network}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Slug: <code className="bg-muted px-1 rounded">{link.slug}</code>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Redirect: <code className="bg-muted px-1 rounded">{link.redirectUrl}</code>
                              </p>
                              {link.error && (
                                <p className="text-sm text-red-600 mt-2">Error: {link.error}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(link.redirectUrl, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}