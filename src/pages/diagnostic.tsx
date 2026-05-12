import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, PlayCircle, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function DiagnosticPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [workflowResults, setWorkflowResults] = useState<any>(null);
  const [quickCheck, setQuickCheck] = useState<any>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/elite-diagnostic');
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runCompleteWorkflow = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/run-complete-workflow', {
        method: 'POST'
      });
      const data = await response.json();
      setWorkflowResults(data);
    } catch (error) {
      console.error('Workflow failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runQuickCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/diagnose-system');
      const data = await response.json();
      setQuickCheck(data);
    } catch (error) {
      console.error('Quick check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="System Diagnostic - Sale Makseb"
        description="Comprehensive system testing and diagnostics"
      />
      
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">System Diagnostic Center</h1>
            <p className="text-muted-foreground">
              Test every function and find exactly what's working and what's broken
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              onClick={runQuickCheck} 
              disabled={loading}
              size="lg"
              className="h-24 flex-col gap-2"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <PlayCircle className="h-6 w-6" />}
              <span className="font-bold">Quick Health Check</span>
              <span className="text-xs">Fast overview of all systems</span>
            </Button>

            <Button 
              onClick={runDiagnostic} 
              disabled={loading}
              size="lg"
              variant="outline"
              className="h-24 flex-col gap-2"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <PlayCircle className="h-6 w-6" />}
              <span className="font-bold">Full Diagnostic</span>
              <span className="text-xs">Test every function step-by-step</span>
            </Button>

            <Button 
              onClick={runCompleteWorkflow} 
              disabled={loading}
              size="lg"
              variant="default"
              className="h-24 flex-col gap-2 bg-green-600 hover:bg-green-700"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <PlayCircle className="h-6 w-6" />}
              <span className="font-bold">Run Complete Workflow</span>
              <span className="text-xs">Actually execute and create real data</span>
            </Button>
          </div>

          {/* Quick Check Results */}
          {quickCheck && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {quickCheck.status === 'HEALTHY' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  Quick Health Check Results
                </CardTitle>
                <CardDescription>
                  Status: <Badge variant={quickCheck.status === 'HEALTHY' ? 'default' : 'destructive'}>
                    {quickCheck.status}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(quickCheck.checks).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="flex items-center gap-2">
                        {typeof value === 'string' ? (
                          <Badge variant={value === 'OK' ? 'default' : 'destructive'}>
                            {value}
                          </Badge>
                        ) : (
                          <>
                            <Badge variant={value.status === 'OK' ? 'default' : 'destructive'}>
                              {value.status}
                            </Badge>
                            {value.count !== undefined && (
                              <Badge variant="outline">{value.count} items</Badge>
                            )}
                            {value.state && (
                              <Badge variant="outline">{value.state}</Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {quickCheck.recommendations && quickCheck.recommendations.length > 0 && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      <p className="font-semibold mb-2">Recommendations:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {quickCheck.recommendations.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Full Diagnostic Results */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {results.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Full Diagnostic Results
                </CardTitle>
                <CardDescription>
                  {results.message}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.results?.tests?.map((test: any, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <span className="font-medium">{test.name}</span>
                      <div className="flex items-center gap-2">
                        {test.status === 'PASSED' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <Badge variant={test.status === 'PASSED' ? 'default' : 'destructive'}>
                          {test.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {results.results?.summary && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="font-semibold">
                      Summary: {results.results.summary.passed}/{results.results.summary.total} tests passed
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Workflow Results */}
          {workflowResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {workflowResults.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Complete Workflow Results
                </CardTitle>
                <CardDescription>
                  {workflowResults.success ? 'Workflow executed successfully' : 'Workflow encountered errors'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Metrics */}
                {workflowResults.metrics && (
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="p-4 border rounded-lg">
                      <div className="text-3xl font-bold">{workflowResults.metrics.productsCreated}</div>
                      <div className="text-sm text-muted-foreground">Products Created</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-3xl font-bold">{workflowResults.metrics.bridgePagesCreated}</div>
                      <div className="text-sm text-muted-foreground">Bridge Pages</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-3xl font-bold">{workflowResults.metrics.contentGenerated}</div>
                      <div className="text-sm text-muted-foreground">Content Generated</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-3xl font-bold">{workflowResults.metrics.postsCreated}</div>
                      <div className="text-sm text-muted-foreground">Posts Created</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-3xl font-bold">{workflowResults.metrics.pixelsInstalled}</div>
                      <div className="text-sm text-muted-foreground">Pixels Installed</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-3xl font-bold">{workflowResults.metrics.viralMechanics}</div>
                      <div className="text-sm text-muted-foreground">Viral Mechanics</div>
                    </div>
                  </div>
                )}

                {/* Summary */}
                {workflowResults.summary && (
                  <Alert className="mb-6">
                    <AlertDescription>
                      <p className="font-semibold mb-2">Summary:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {Object.entries(workflowResults.summary).map(([key, value]) => (
                          <li key={key}>
                            <span className="font-medium capitalize">{key}:</span> {value as string}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Execution Log */}
                {workflowResults.log && workflowResults.log.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted">
                    <p className="font-semibold mb-2">Execution Log:</p>
                    <div className="space-y-1 text-sm font-mono max-h-96 overflow-y-auto">
                      {workflowResults.log.map((line: string, i: number) => (
                        <div key={i} className={
                          line.includes('✓') ? 'text-green-600' :
                          line.includes('✗') ? 'text-red-600' :
                          line.includes('STEP') ? 'font-bold text-blue-600' :
                          ''
                        }>
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Use This Diagnostic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">1. Quick Health Check</h4>
                  <p className="text-sm text-muted-foreground">
                    Fast overview to see if tables exist and have data. Run this first.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">2. Full Diagnostic</h4>
                  <p className="text-sm text-muted-foreground">
                    Tests every single function step-by-step. Shows exactly what works and what fails.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">3. Run Complete Workflow</h4>
                  <p className="text-sm text-muted-foreground">
                    Actually executes the entire system - creates products, bridge pages, content, posts, everything.
                    This is the real test that creates actual data in your database.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}