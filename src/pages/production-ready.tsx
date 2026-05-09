import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trash2,
  TrendingUp,
  Link,
  FileText,
  Radio
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProductionReady() {
  const [transforming, setTransforming] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const transformToRealSystem = async () => {
    try {
      setTransforming(true);
      setResults(null);

      // PHASE 1: Purge all mock data
      setCurrentPhase('Purging all mock/fake data...');
      const purgeResponse = await fetch('/api/system/purge-mock-data', {
        method: 'POST'
      });
      const purgeData = await purgeResponse.json();

      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      // PHASE 2: Rebuild with real data
      setCurrentPhase('Discovering real 2026 products and generating content...');
      const testResponse = await fetch('/api/system-test', {
        method: 'POST'
      });
      const testData = await testResponse.json();

      setResults({
        purge: purgeData,
        rebuild: testData.results,
        summary: testData.results?.summary
      });

      if (testData.success) {
        toast({
          title: "✅ System Transformed!",
          description: testData.results.summary.status,
        });
      } else {
        toast({
          title: "⚠️ Transformation Incomplete",
          description: "Some phases need API configuration. See results below.",
          variant: "destructive"
        });
      }

    } catch (error) {
      toast({
        title: "❌ Transformation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setTransforming(false);
      setCurrentPhase('');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Production Ready System</h1>
          <p className="text-xl text-muted-foreground">
            Transform your system to 100% real data - No mocks, no simulations
          </p>
        </div>

        {/* Main Action */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">System Transformation</CardTitle>
            <CardDescription>
              This will purge ALL mock data and rebuild with real 2026 trending products, 
              real AI-generated content, and real traffic sources.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>What happens:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Delete all mock products, clicks, and simulated data</li>
                  <li>Discover 15-20 real trending products from Amazon, AliExpress, Google Trends</li>
                  <li>Generate real AI content with OpenAI</li>
                  <li>Create real affiliate links</li>
                  <li>Setup 5 real traffic sources (Pinterest, Reddit, Medium, Twitter, Facebook)</li>
                </ul>
              </AlertDescription>
            </Alert>

            {transforming && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">{currentPhase}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            )}

            <Button
              size="lg"
              onClick={transformToRealSystem}
              disabled={transforming}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 text-lg"
            >
              {transforming ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Transforming System...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Transform to 100% Real System
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            {/* Summary Status */}
            <Card className={results.summary?.status?.includes('100%') ? 'border-green-500 border-2' : 'border-yellow-500 border-2'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {results.summary?.status?.includes('100%') ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                  )}
                  {results.summary?.status || 'Transformation Complete'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <Trash2 className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <div className="text-2xl font-bold">{results.summary?.mockDataRemoved || 0}</div>
                    <div className="text-sm text-muted-foreground">Mock Deleted</div>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{results.summary?.realProductsAdded || 0}</div>
                    <div className="text-sm text-muted-foreground">Real Products</div>
                  </div>
                  <div className="text-center">
                    <Link className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold">{results.summary?.affiliateLinksCreated || 0}</div>
                    <div className="text-sm text-muted-foreground">Affiliate Links</div>
                  </div>
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{results.summary?.realContentGenerated || 0}</div>
                    <div className="text-sm text-muted-foreground">AI Content</div>
                  </div>
                  <div className="text-center">
                    <Radio className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <div className="text-2xl font-bold">{results.summary?.trafficSourcesSetup || 0}</div>
                    <div className="text-sm text-muted-foreground">Traffic Sources</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phase Results */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Phase 1: Purge */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {results.purge?.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Phase 1: Purge Mock Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Deleted:</span>
                      <Badge variant="destructive">{results.purge?.totalDeleted || 0}</Badge>
                    </div>
                    {results.purge?.purged && Object.entries(results.purge.purged).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between text-muted-foreground">
                        <span>{key.replace(/_/g, ' ')}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Phase 2: Discovery */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {results.rebuild?.phase2_discovery?.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Phase 2: Product Discovery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Products Found:</span>
                      <Badge variant="default">{results.rebuild?.phase2_discovery?.productsFound || 0}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Networks:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {results.rebuild?.phase2_discovery?.realNetworks?.map((network: string) => (
                          <Badge key={network} variant="outline">{network}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Phase 3: Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {results.rebuild?.phase3_links?.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Phase 3: Affiliate Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Links Created:</span>
                      <Badge variant="default">{results.rebuild?.phase3_links?.linksCreated || 0}</Badge>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Products Processed:</span>
                      <span>{results.rebuild?.phase3_links?.productsProcessed || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Phase 4: Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {results.rebuild?.phase4_content?.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Phase 4: AI Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Content Generated:</span>
                      <Badge variant="default">{results.rebuild?.phase4_content?.contentGenerated || 0}</Badge>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Products Processed:</span>
                      <span>{results.rebuild?.phase4_content?.productsProcessed || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Next Steps */}
            {results.summary?.nextSteps && results.summary.nextSteps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.summary.nextSteps.map((step: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 text-yellow-500" />
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}