import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Play, RefreshCw } from "lucide-react";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "SKIP" | "WARN";
  details: any;
}

interface TestResults {
  timestamp: string;
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped?: number;
  };
}

export default function TestAutoPilot() {
  const [results, setResults] = useState<TestResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  async function runTests() {
    setIsRunning(true);
    setResults(null);

    try {
      const response = await fetch("/api/test-autopilot-functions");
      const data = await response.json();
      
      if (data.results) {
        setResults(data.results);
      }
    } catch (error) {
      console.error("Test error:", error);
    } finally {
      setIsRunning(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "PASS":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "FAIL":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "WARN":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "SKIP":
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  }

  function getStatusBadge(status: string) {
    const variants: any = {
      PASS: "bg-green-500",
      FAIL: "bg-red-500",
      WARN: "bg-yellow-500",
      SKIP: "bg-gray-500"
    };

    return (
      <Badge className={`${variants[status]} text-white`}>
        {status}
      </Badge>
    );
  }

  return (
    <>
      <SEO 
        title="AutoPilot System Test"
        description="Test all autopilot functions and verify system health"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        <Header />
        
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">AutoPilot System Test</h1>
            <p className="text-slate-400">Verify all functions work with your existing data</p>
          </div>

          <div className="mb-8">
            <Button 
              onClick={runTests}
              disabled={isRunning}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
              size="lg"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Run All Tests
                </>
              )}
            </Button>
          </div>

          {results && (
            <>
              <Card className="bg-slate-900/50 border-slate-700 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Test Summary</CardTitle>
                  <CardDescription className="text-slate-400">
                    Completed at {new Date(results.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-white">{results.summary.total}</div>
                      <div className="text-sm text-slate-400">Total Tests</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-500">{results.summary.passed}</div>
                      <div className="text-sm text-slate-400">Passed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-500">{results.summary.failed}</div>
                      <div className="text-sm text-slate-400">Failed</div>
                    </div>
                    {results.summary.skipped !== undefined && (
                      <div>
                        <div className="text-2xl font-bold text-gray-500">{results.summary.skipped}</div>
                        <div className="text-sm text-slate-400">Skipped</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {results.tests.map((test, index) => (
                  <Card key={index} className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(test.status)}
                          <div>
                            <CardTitle className="text-white text-lg">{test.name}</CardTitle>
                          </div>
                        </div>
                        {getStatusBadge(test.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <pre className="text-sm text-slate-300 overflow-x-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {!results && !isRunning && (
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">Click "Run All Tests" to verify your AutoPilot system</p>
              </CardContent>
            </Card>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}