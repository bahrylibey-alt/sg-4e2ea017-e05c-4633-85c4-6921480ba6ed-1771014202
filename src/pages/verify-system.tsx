import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifySystem() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);

    try {
      // Execute autopilot
      const response = await fetch('/api/autopilot/execute-now', {
        method: 'POST'
      });

      const data = await response.json();

      if (!data.success) {
        setResults({
          success: false,
          error: data.error
        });
        setTesting(false);
        return;
      }

      // Poll for results
      const jobId = data.jobId;
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes

      const pollInterval = setInterval(async () => {
        attempts++;

        if (attempts > maxAttempts) {
          clearInterval(pollInterval);
          setResults({
            success: false,
            error: 'Test timed out after 2 minutes'
          });
          setTesting(false);
          return;
        }

        try {
          const statusResponse = await fetch(`/api/autopilot/execute-now?jobId=${jobId}`);
          const statusData = await statusResponse.json();

          if (statusData.job) {
            const job = statusData.job;

            if (job.status === 'completed') {
              clearInterval(pollInterval);
              setResults({
                success: true,
                job
              });
              setTesting(false);
            } else if (job.status === 'failed') {
              clearInterval(pollInterval);
              setResults({
                success: false,
                error: job.error,
                job
              });
              setTesting(false);
            }
          }
        } catch (error) {
          console.error('Poll error:', error);
        }
      }, 2000);

    } catch (error) {
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">System Verification</h1>
          <p className="text-muted-foreground">
            Complete end-to-end test of all autopilot functions
          </p>
          <Button
            onClick={runTest}
            disabled={testing}
            size="lg"
            className="mt-4"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Run Complete System Test'
            )}
          </Button>
        </div>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Test Passed
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    Test Failed
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {results.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-semibold">Error:</p>
                  <p className="text-red-600 text-sm mt-1">{results.error}</p>
                </div>
              )}

              {results.job && results.job.results && (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">
                            {results.job.results.summary?.productsDiscovered || 0}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Products
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">
                            {results.job.results.summary?.linksCreated || 0}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Links
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600">
                            {results.job.results.summary?.contentGenerated || 0}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Content
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-orange-600">
                            {results.job.results.summary?.postsPublished || 0}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Posts
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Phase Details */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Phase Details:</h3>
                    
                    {Object.entries(results.job.results.execution?.phases || {}).map(([phase, data]: [string, any]) => (
                      <div key={phase} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{phase}</span>
                          <Badge variant={
                            data.status === 'success' ? 'default' :
                            data.status === 'failed' ? 'destructive' :
                            data.status === 'partial' ? 'secondary' :
                            'outline'
                          }>
                            {data.status}
                          </Badge>
                        </div>
                        
                        {data.error && (
                          <p className="text-sm text-red-600 mt-1">Error: {data.error}</p>
                        )}
                        
                        {data.data && (
                          <div className="text-sm text-muted-foreground mt-2">
                            <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                              {JSON.stringify(data.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Errors */}
                  {results.job.results.summary?.errors && results.job.results.summary.errors.length > 0 && (
                    <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
                      <p className="font-semibold text-yellow-800">Warnings:</p>
                      <ul className="mt-2 space-y-1">
                        {results.job.results.summary.errors.map((err: string, i: number) => (
                          <li key={i} className="text-sm text-yellow-700">• {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Current Stats */}
                  {results.job.currentStats && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Database Totals:</h3>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">{results.job.currentStats.totalProducts}</div>
                          <div className="text-xs text-muted-foreground">Total Products</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{results.job.currentStats.totalLinks}</div>
                          <div className="text-xs text-muted-foreground">Total Links</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{results.job.currentStats.totalContent}</div>
                          <div className="text-xs text-muted-foreground">Total Content</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{results.job.currentStats.totalPosts}</div>
                          <div className="text-xs text-muted-foreground">Total Posts</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}