import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Play,
  RefreshCw,
  Database,
  User,
  ShoppingCart,
  Link2,
  FileText,
  Send,
  Zap,
  BarChart3
} from "lucide-react";

export default function SystemTestDashboard() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [autoRun, setAutoRun] = useState(true);

  const runTests = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/test/end-to-end-complete', {
        method: 'POST'
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Test error:', error);
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (autoRun) {
      runTests();
      setAutoRun(false);
    }
  }, [autoRun]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    }
  };

  const getTestIcon = (testName: string) => {
    const icons: Record<string, any> = {
      database: Database,
      userProfile: User,
      productDiscovery: ShoppingCart,
      affiliateLinks: Link2,
      contentGeneration: FileText,
      contentPosting: Send,
      autopilotExecution: Zap,
      metricsTracking: BarChart3
    };
    const Icon = icons[testName] || CheckCircle2;
    return <Icon className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">System Test Dashboard</h1>
            <p className="text-muted-foreground">
              Complete end-to-end validation of all autonomous functions
            </p>
          </div>
          <Button
            onClick={runTests}
            disabled={testing}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                Run Tests
              </>
            )}
          </Button>
        </div>

        {/* Overall Status */}
        {results && (
          <Alert className={
            results.success 
              ? 'border-green-500 bg-green-50 dark:bg-green-950' 
              : 'border-red-500 bg-red-50 dark:bg-red-950'
          }>
            <AlertDescription className="flex items-center gap-2">
              {results.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900 dark:text-green-100">
                    {results.status}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-900 dark:text-red-100">
                    {results.status || 'System has failures'}
                  </span>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        {results?.results?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {results.results.summary.total}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Total Tests</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {results.results.summary.passed}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Passed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {results.results.summary.warnings}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Warnings</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {results.results.summary.failed}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Failed</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test Results */}
        {results?.results?.tests && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(results.results.tests).map(([testName, test]: [string, any]) => (
              <Card key={testName}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTestIcon(testName)}
                      <span className="text-base font-semibold">
                        {testName.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    {getStatusIcon(test.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {test.message}
                  </p>
                  {test.status === 'passed' && (
                    <Badge className="mt-2 bg-green-500">Passed</Badge>
                  )}
                  {test.status === 'warning' && (
                    <Badge className="mt-2 bg-yellow-500">Warning</Badge>
                  )}
                  {test.status === 'failed' && (
                    <Badge className="mt-2 bg-red-500">Failed</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Loading State */}
        {testing && !results && (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
              <h3 className="text-xl font-semibold">Running Complete System Test</h3>
              <p className="text-muted-foreground">
                Testing database, products, links, content, posting, autopilot, and metrics...
              </p>
            </div>
          </Card>
        )}

        {/* Error State */}
        {results?.error && (
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <XCircle className="h-6 w-6 text-red-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    Test Execution Failed
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {results.error}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How the System Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Autonomous Execution
                </h4>
                <p className="text-sm text-muted-foreground">
                  The autopilot runs every hour via Vercel Cron. It discovers products, generates content, and posts automatically.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  Self-Healing
                </h4>
                <p className="text-sm text-muted-foreground">
                  Each phase works independently. If one fails, others continue. Uses template fallbacks when AI unavailable.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Real Data Only
                </h4>
                <p className="text-sm text-muted-foreground">
                  All products from real APIs (Amazon, AliExpress, Google Trends). No mocks, no simulations.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  Multi-Platform Publishing
                </h4>
                <p className="text-sm text-muted-foreground">
                  Posts to Pinterest, Reddit, Medium, Twitter, Facebook. API integration ready when credentials added.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}