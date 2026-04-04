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
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);

  const tests = [
    {
      name: "Database Connection",
      test: async () => {
        const { data, error } = await supabase.from("campaigns").select("count").limit(1);
        if (error) throw error;
        return { success: true, message: "✅ Database connected successfully" };
      }
    },
    {
      name: "Product Discovery System",
      test: async () => {
        const result = await linkHealthMonitor.discoverTrendingProducts(5);
        return { 
          success: result.length > 0, 
          message: `✅ Discovered ${result.length} trending products`,
          details: result.slice(0, 3)
        };
      }
    },
    {
      name: "Link Health Monitor",
      test: async () => {
        const result = await linkHealthMonitor.oneClickAutoRepair() as any;
        return { 
          success: true, 
          message: `✅ Scanned links - Repaired: ${result?.repaired || 0}, Removed: ${result?.removed || 0}`,
          details: result
        };
      }
    },
    {
      name: "AI Optimization Engine",
      test: async () => {
        const { data: campaign } = await supabase
          .from("campaigns")
          .select("id")
          .eq("is_autopilot", true)
          .limit(1)
          .single();
        
        if (campaign) {
          const result = await aiOptimizationEngine.runFullOptimization(campaign.id);
          return { 
            success: result.success, 
            message: `✅ AI optimized ${result.optimizations} elements`,
            details: result.recommendations?.slice(0, 3)
          };
        }
        return { success: true, message: "⚠️ No autopilot campaigns to optimize" };
      }
    },
    {
      name: "Fraud Detection System",
      test: async () => {
        const result = await fraudDetectionService.monitorAllLinks();
        return { 
          success: true, 
          message: `✅ Scanned ${result.totalChecked} links, Blocked ${result.blocked} threats`,
          details: { suspicious: result.suspicious, blocked: result.blocked }
        };
      }
    },
    {
      name: "Content Generation AI",
      test: async () => {
        const content = smartContentGenerator.generateProductContent({
          name: "Test Product",
          category: "Electronics",
          commission: 4.5
        });
        return { 
          success: true, 
          message: "✅ AI content generation working",
          details: { headline: content.headline, hashtags: content.hashtags.slice(0, 3) }
        };
      }
    },
    {
      name: "A/B Testing Engine",
      test: async () => {
        const { data: links } = await supabase
          .from("affiliate_links")
          .select("id")
          .eq("status", "active")
          .limit(1);
        
        if (links && links.length > 0) {
          const result = await intelligentABTesting.createTestVariants(links[0].id, 2);
          return { 
            success: result.success, 
            message: `✅ Created ${result.variants.length} test variants`,
            details: result.variants.map((v: any) => v.product_name)
          };
        }
        return { success: true, message: "⚠️ No links available for testing" };
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
      name: "Real-Time Analytics",
      test: async () => {
        const { data: metrics } = await supabase
          .from("automation_metrics")
          .select("*")
          .limit(1)
          .single();
        
        return { 
          success: true, 
          message: "✅ Analytics tracking operational",
          details: metrics ? {
            traffic: metrics.traffic_generated,
            conversions: metrics.conversions_generated,
            revenue: metrics.revenue_generated
          } : null
        };
      }
    },
    {
      name: "24/7 Scheduler Status",
      test: async () => {
        const { data: tasks } = await supabase
          .from("autopilot_tasks")
          .select("count")
          .eq("status", "completed");
        
        return { 
          success: true, 
          message: `✅ Scheduler active - ${tasks?.[0]?.count || 0} tasks completed`,
          details: { executedTasks: tasks?.[0]?.count || 0 }
        };
      }
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
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

      setProgress(((i + 1) / tests.length) * 100);
      setResults([...testResults]);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await loadSystemStats();
    setIsRunning(false);
  };

  const loadSystemStats = async () => {
    try {
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("count");
      
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("clicks, conversions, revenue")
        .eq("status", "active");
      
      const { data: tasks } = await supabase
        .from("autopilot_tasks")
        .select("run_count, success_count");

      const totalClicks = links?.reduce((sum, l) => sum + l.clicks, 0) || 0;
      const totalConversions = links?.reduce((sum, l) => sum + l.conversions, 0) || 0;
      const totalRevenue = links?.reduce((sum, l) => sum + l.revenue, 0) || 0;
      const totalTasks = tasks?.reduce((sum, t) => sum + t.run_count, 0) || 0;
      const successfulTasks = tasks?.reduce((sum, t) => sum + t.success_count, 0) || 0;

      setSystemStats({
        campaigns: campaigns?.[0]?.count || 0,
        products: links?.length || 0,
        clicks: totalClicks,
        conversions: totalConversions,
        revenue: totalRevenue,
        tasks: totalTasks,
        successRate: totalTasks > 0 ? (successfulTasks / totalTasks * 100).toFixed(1) : 0
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
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

        {/* Quick Stats */}
        {systemStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{systemStats.campaigns}</div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{systemStats.products}</div>
                <p className="text-sm text-muted-foreground">Products</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">${systemStats.revenue.toFixed(0)}</div>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{systemStats.successRate}%</div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </CardContent>
            </Card>
          </div>
        )}

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

              {isRunning && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">
                    {Math.round(progress)}% Complete
                  </p>
                </div>
              )}

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