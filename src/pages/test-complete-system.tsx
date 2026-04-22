import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, CheckCircle, AlertCircle, Info, XCircle, Loader2 } from "lucide-react";

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'INFO';
  message: string;
  data?: any;
  action?: string;
}

export default function TestCompleteSystem() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    if (user) {
      runTests();
    }
  };

  const runTests = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/test-complete-system', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
      });
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAIL': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'WARN': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'INFO': return <Info className="h-5 w-5 text-blue-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      'PASS': 'default',
      'FAIL': 'destructive',
      'WARN': 'secondary',
      'INFO': 'outline'
    };
    return variants[status] || 'outline';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please log in to run system tests.</p>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Complete System Test</h1>
            <p className="text-muted-foreground">
              Validates entire autopilot flow: Traffic → Clicks → Conversions → Revenue
            </p>
          </div>
          <Button onClick={runTests} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Tests
              </>
            )}
          </Button>
        </div>

        {testResults && (
          <>
            <Alert variant={testResults.status === 'READY' || testResults.status === 'PASS' ? 'default' : 'destructive'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Status: {testResults.status || (testResults.error ? 'ERROR' : 'FINISHED')}</p>
                    <p className="text-sm">{testResults.message || testResults.error || 'System test execution completed.'}</p>
                  </div>
                  {testResults.summary && (
                    <Badge variant={testResults.status === 'READY' || testResults.status === 'PASS' ? 'default' : 'destructive'}>
                      {testResults.summary.passed} / {testResults.summary.total} PASSED
                    </Badge>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {testResults.summary && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{testResults.summary.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Passed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-green-500">
                      {testResults.summary.passed}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Failed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-red-500">
                      {testResults.summary.failed}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {testResults.results && Array.isArray(testResults.results) && (
              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {testResults.results.map((result: TestResult, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-4 rounded-lg border">
                        {getStatusIcon(result.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getStatusBadge(result.status)}>
                              {result.status}
                            </Badge>
                            <span className="font-medium">{result.step}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{result.message}</p>
                          {result.action && (
                            <p className="text-sm text-primary mt-2">→ {result.action}</p>
                          )}
                          {result.data && (
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {testResults.actions && testResults.actions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {testResults.actions.map((action: string, index: number) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card className="bg-muted">
              <CardHeader>
                <CardTitle>How the Autopilot Flow Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">1. Product Discovery</h3>
                  <p className="text-sm text-muted-foreground">
                    System discovers real products from connected affiliate networks (Amazon, AliExpress, etc.)
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">2. Traffic Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Creates campaigns and posts affiliate links to traffic sources (TikTok, Pinterest, Instagram)
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">3. Click Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Tracks every click on your affiliate links - source, product, timestamp, location
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">4. Conversion Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Receives postbacks from affiliate networks when purchases occur
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">5. Revenue Attribution</h3>
                  <p className="text-sm text-muted-foreground">
                    Matches conversions to original clicks and calculates commission
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">6. AI Optimization</h3>
                  <p className="text-sm text-muted-foreground">
                    Scores products (0.0-1.0) and automatically scales winners, pauses losers
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/integrations'}>
                Manage Integrations
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}