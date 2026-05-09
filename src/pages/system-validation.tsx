import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertCircle,
  Play,
  Database,
  TrendingUp,
  Link2,
  Radio,
  Zap,
  BarChart3,
  Target,
  Settings
} from "lucide-react";

interface TestResult {
  test: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message?: string;
  details?: any;
  duration?: number;
}

export default function SystemValidation() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const runCompleteValidation = async () => {
    setRunning(true);
    setProgress(0);
    setResults([]);
    setSummary(null);

    const tests: TestResult[] = [
      { test: 'Database Connection', status: 'pending' },
      { test: '2026 Product Discovery', status: 'pending' },
      { test: 'Affiliate Link Generation', status: 'pending' },
      { test: 'Traffic Sources (12 Channels)', status: 'pending' },
      { test: 'AI Content Generator', status: 'pending' },
      { test: 'Viral Engine System', status: 'pending' },
      { test: 'Click Tracking', status: 'pending' },
      { test: 'Conversion Tracking', status: 'pending' },
      { test: 'Autopilot Engine', status: 'pending' },
      { test: 'System Health', status: 'pending' }
    ];

    setResults([...tests]);

    try {
      const response = await fetch('/api/test/complete-system-validation', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        const updatedResults = tests.map((test, index) => {
          const testData = data.results[index];
          if (!testData) return { ...test, status: 'warning' as const };

          return {
            test: test.test,
            status: testData.status === 'PASSED' ? 'passed' as const : 
                   testData.status === 'FAILED' ? 'failed' as const : 'warning' as const,
            message: testData.message,
            details: testData.details,
            duration: testData.duration
          };
        });

        setResults(updatedResults);
        setSummary(data.summary);
        setProgress(100);
      } else {
        setResults(tests.map(t => ({ ...t, status: 'failed' as const, message: data.error })));
      }
    } catch (error) {
      setResults(tests.map(t => ({ 
        ...t, 
        status: 'failed' as const, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      })));
    } finally {
      setRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-600">PASSED</Badge>;
      case 'failed':
        return <Badge variant="destructive">FAILED</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-600">WARNING</Badge>;
      case 'running':
        return <Badge className="bg-blue-600">RUNNING</Badge>;
      default:
        return <Badge variant="outline">PENDING</Badge>;
    }
  };

  const getTestIcon = (testName: string) => {
    if (testName.includes('Database')) return <Database className="h-4 w-4" />;
    if (testName.includes('Product')) return <TrendingUp className="h-4 w-4" />;
    if (testName.includes('Link')) return <Link2 className="h-4 w-4" />;
    if (testName.includes('Traffic')) return <Radio className="h-4 w-4" />;
    if (testName.includes('AI') || testName.includes('Viral')) return <Zap className="h-4 w-4" />;
    if (testName.includes('Tracking')) return <BarChart3 className="h-4 w-4" />;
    if (testName.includes('Conversion')) return <Target className="h-4 w-4" />;
    if (testName.includes('Autopilot') || testName.includes('Health')) return <Settings className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Complete System Validation</h1>
          <p className="text-xl text-muted-foreground">
            End-to-end testing of all features and strategies
          </p>
          
          <Button
            size="lg"
            onClick={runCompleteValidation}
            disabled={running}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {running ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Run Complete Validation
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        {running && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Testing Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {summary && (
          <Alert className={summary.passed === summary.total ? "border-green-600 bg-green-50" : "border-yellow-600 bg-yellow-50"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold text-lg">
                Test Results: {summary.passed}/{summary.total} Passed
              </div>
              <div className="mt-2 text-sm">
                {summary.failed > 0 && <div>❌ Failed: {summary.failed}</div>}
                {summary.warnings > 0 && <div>⚠️ Warnings: {summary.warnings}</div>}
                {summary.duration && <div>⏱️ Duration: {summary.duration}ms</div>}
              </div>
              {summary.recommendations && summary.recommendations.length > 0 && (
                <div className="mt-4">
                  <div className="font-semibold">Recommendations:</div>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {summary.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Test Results */}
        {results.length > 0 && (
          <div className="grid gap-4">
            {results.map((result, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTestIcon(result.test)}
                      <CardTitle className="text-lg">{result.test}</CardTitle>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 space-y-2">
                      {result.message && (
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                      )}
                      {result.details && (
                        <div className="bg-muted p-3 rounded text-xs font-mono">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </div>
                      )}
                      {result.duration && (
                        <p className="text-xs text-muted-foreground">
                          Duration: {result.duration}ms
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Current configuration and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Product Filter</div>
                <div className="text-lg font-semibold">2026 Only</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Traffic Sources</div>
                <div className="text-lg font-semibold">12 Channels</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Viral Engines</div>
                <div className="text-lg font-semibold">3 Active</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Real Data</div>
                <div className="text-lg font-semibold text-green-600">100%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}