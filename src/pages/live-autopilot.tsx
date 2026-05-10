import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  Link2,
  FileText,
  Send,
  BarChart3,
  Clock,
  Zap
} from "lucide-react";

export default function LiveAutopilot() {
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [results, setResults] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh stats every 10 seconds
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadStats, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/autopilot/execute-now', {
        method: 'GET'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.currentStats);
      }
    } catch (error) {
      console.error('Stats load error:', error);
    }
  };

  const executeNow = async () => {
    setExecuting(true);
    setProgress(0);
    setPhase('Initializing...');
    setResults(null);

    try {
      // Start execution (returns immediately)
      const response = await fetch('/api/autopilot/execute-now', {
        method: 'POST'
      });

      const data = await response.json();

      if (!data.success || !data.jobId) {
        throw new Error(data.error || 'Failed to start execution');
      }

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/autopilot/execute-now?jobId=${data.jobId}`);
          const statusData = await statusResponse.json();

          if (statusData.job) {
            const job = statusData.job;
            setProgress(job.progress || 0);
            setPhase(job.phase || '');

            if (job.status === 'completed') {
              clearInterval(pollInterval);
              setProgress(100);
              setResults({
                success: true,
                summary: job.results?.summary,
                execution: job.results?.execution,
                currentStats: job.currentStats
              });
              setStats(job.currentStats);
              setExecuting(false);
            } else if (job.status === 'failed') {
              clearInterval(pollInterval);
              setResults({
                success: false,
                error: job.error
              });
              setExecuting(false);
            }
          }
        } catch (error) {
          console.error('Poll error:', error);
        }
      }, 2000); // Poll every 2 seconds

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (executing) {
          setResults({
            success: false,
            error: 'Execution timed out'
          });
          setExecuting(false);
        }
      }, 120000);

    } catch (error) {
      console.error('Execution error:', error);
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed'
      });
      setExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Live Autonomous Autopilot</h1>
          <p className="text-muted-foreground">
            Execute the complete autopilot cycle immediately and see real-time results
          </p>
        </div>

        {/* Execute Button */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2 border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Run Autopilot Now</h3>
                <p className="text-sm text-muted-foreground">
                  Discovers products, generates content, creates links, and posts to all platforms
                </p>
                {phase && (
                  <p className="text-sm font-medium text-primary">
                    {phase}
                  </p>
                )}
              </div>
              <Button
                onClick={executeNow}
                disabled={executing}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8"
              >
                {executing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Execute Now
                  </>
                )}
              </Button>
            </div>

            {executing && (
              <div className="mt-4">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {progress}% complete
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Real trending items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Affiliate Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalLinks || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active tracking links</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Generated Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalContent || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Ready to publish</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Published Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalPosts || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Live on platforms</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Execution Results */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Execution Successful
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    Execution Completed with Errors
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Products Discovered</p>
                    <p className="text-2xl font-bold">{results.summary.productsDiscovered || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Links Created</p>
                    <p className="text-2xl font-bold">{results.summary.linksCreated || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Content Generated</p>
                    <p className="text-2xl font-bold">{results.summary.contentGenerated || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Posts Published</p>
                    <p className="text-2xl font-bold">{results.summary.postsPublished || 0}</p>
                  </div>
                </div>
              )}

              {results.execution?.phases && (
                <div className="space-y-3 mt-6">
                  <h4 className="font-semibold">Execution Phases:</h4>
                  {Object.entries(results.execution.phases).map(([phase, data]: [string, any]) => (
                    <div key={phase} className="flex items-center gap-3 p-3 border rounded-lg">
                      {data.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : data.status === 'partial' ? (
                        <XCircle className="h-5 w-5 text-yellow-500" />
                      ) : data.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium capitalize">{phase.replace(/_/g, ' ')}</p>
                        {data.error && (
                          <p className="text-sm text-red-500">{data.error}</p>
                        )}
                      </div>
                      <Badge variant={
                        data.status === 'success' ? 'default' : 
                        data.status === 'partial' ? 'secondary' : 
                        'destructive'
                      }>
                        {data.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">1. Product Discovery</h4>
                <p className="text-sm text-muted-foreground">
                  Scans Amazon, AliExpress, and Google Trends for 2026 trending products. Finds 15-20 real products with affiliate links.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">2. Link Creation</h4>
                <p className="text-sm text-muted-foreground">
                  Creates trackable short links for each product. Monitors clicks, conversions, and revenue automatically.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">3. Content Generation</h4>
                <p className="text-sm text-muted-foreground">
                  Uses OpenAI to write platform-specific posts (Pinterest, Reddit, Medium, Twitter, Facebook). Falls back to templates if API unavailable.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">4. Multi-Platform Publishing</h4>
                <p className="text-sm text-muted-foreground">
                  Posts content to all platforms. Tracks views, clicks, and engagement. Posts are stored with URLs for verification.
                </p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold mb-2">Automatic Execution</h4>
              <p className="text-sm text-muted-foreground">
                The autopilot runs automatically every hour via Vercel Cron. Use this page to execute immediately without waiting.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}