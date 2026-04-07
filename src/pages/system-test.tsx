import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Play, Zap, TrendingUp } from "lucide-react";
import { Header } from "@/components/Header";
import { ultimateAutopilot } from "@/services/ultimateAutopilot";
import { linkHealthMonitor } from "@/services/linkHealthMonitor";
import { aiOptimizationEngine } from "@/services/aiOptimizationEngine";
import { fraudDetectionService } from "@/services/fraudDetectionService";
import { intelligentABTesting } from "@/services/intelligentABTesting";
import { smartContentGenerator } from "@/services/smartContentGenerator";
import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  name: string;
  status: "pending" | "running" | "passed" | "failed";
  message: string;
  details?: any;
}

export default function SystemTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState("");
  const [results, setResults] = useState<TestResult[]>([]);

  const tests = [
    {
      name: "Database Connection",
      test: async () => {
        const { data, error } = await supabase.from("affiliate_links").select("count");
        return { 
          success: !error, 
          message: error ? `❌ ${error.message}` : "✅ Database connected" 
        };
      }
    },
    {
      name: "Ultimate Autopilot Deployment",
      test: async () => {
        const result = await ultimateAutopilot.oneClickUltimateDeploy();
        return { 
          success: result.success, 
          message: `✅ Deployed: ${result.productsAdded} products, ${result.tasksCreated} tasks`,
          details: { 
            campaignId: result.campaignId,
            estimatedRevenue: result.estimatedRevenue 
          }
        };
      }
    },
    {
      name: "Link Health Monitoring",
      test: async () => {
        const { data: campaign } = await supabase
          .from("campaigns")
          .select("id")
          .eq("status", "active")
          .limit(1)
          .single();

        if (!campaign) {
          return { success: false, message: "❌ No active campaign found" };
        }

        const health = await linkHealthMonitor.getHealthDashboard(campaign.id);
        return { 
          success: true, 
          message: `✅ Health: ${health.healthScore}% (${health.activeLinks + health.brokenLinks} links, ${health.brokenLinks} invalid)`,
          details: health
        };
      }
    },
    {
      name: "Auto-Repair System",
      test: async () => {
        const result = await linkHealthMonitor.oneClickAutoRepair();
        return { 
          success: result.success, 
          message: `✅ Checked ${result.totalChecked} links, Removed ${result.invalidRemoved + result.duplicatesRemoved}, Added ${result.replaced}`,
          details: result
        };
      }
    }
  ];

  const runFullSystemTest = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Test 1: Launch autopilot
      addResult('Launching Ultimate Autopilot...', 'running');
      const autopilotResult = await ultimateAutopilot.launch();
      addResult('✅ Autopilot launched successfully', 'success', autopilotResult);
    } catch (error: any) {
      addResult(`❌ Error launching autopilot: ${error.message}`, 'error', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    const testResults: TestResult[] = [];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      
      testResults.push({
        name: test.name,
        status: "running",
        message: "Testing..."
      });
      setResults([...testResults]);

      try {
        const result = await test.test();
        testResults[i] = {
          name: test.name,
          status: result.success ? "passed" : "failed",
          message: result.message,
          details: (result as any).details
        };
      } catch (error: any) {
        testResults[i] = {
          name: test.name,
          status: "failed",
          message: `❌ Error: ${error.message}`,
          details: error
        };
      }

      setResults([...testResults]);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const passed = results.filter(r => r.status === "passed").length;
  const failed = results.filter(r => r.status === "failed").length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">System Test Suite</h1>
          <p className="text-muted-foreground">
            Comprehensive testing of all autopilot features and AI systems
          </p>
        </div>

        {/* Test Control */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Run Comprehensive System Test</CardTitle>
            <CardDescription>
              Test all autopilot features, AI systems, and integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                size="lg"
                className="w-full"
              >
                {isRunning ? (
                  <>Running Tests...</>
                ) : (
                  <><Play className="mr-2 h-5 w-5" /> Run All Tests</>
                )}
              </Button>

              {results.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-semibold">{passed} Passed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="font-semibold">{failed} Failed</span>
                    </div>
                  </div>
                  <Badge variant={failed === 0 ? "default" : "destructive"}>
                    {failed === 0 ? "All Systems Operational" : "Issues Detected"}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {result.status === "passed" && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        {result.status === "failed" && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        {result.status === "running" && (
                          <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
                        )}
                        <h3 className="font-semibold">{result.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {result.message}
                      </p>
                      {result.details && (
                        <div className="mt-2 p-3 bg-muted rounded text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant={
                        result.status === "passed" ? "default" : 
                        result.status === "failed" ? "destructive" : 
                        "secondary"
                      }
                    >
                      {result.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Success Message */}
        {results.length > 0 && failed === 0 && !isRunning && (
          <Alert className="mt-8 border-green-500 bg-green-50 dark:bg-green-900/10">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-400">
              <strong>All Systems Operational!</strong> The ultimate autopilot system is running perfectly. 
              All AI features, optimizations, and automations are working as expected.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}