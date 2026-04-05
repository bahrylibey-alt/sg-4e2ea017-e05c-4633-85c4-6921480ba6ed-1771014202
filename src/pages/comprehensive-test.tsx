import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Database,
  Link as LinkIcon,
  Activity,
  Zap,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { linkHealthMonitor } from "@/services/linkHealthMonitor";
import { ultimateAutopilot } from "@/services/ultimateAutopilot";
import { Header } from "@/components/Header";

interface TestResult {
  name: string;
  status: "passed" | "failed" | "warning" | "running";
  message: string;
  details?: any;
}

export default function ComprehensiveTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  const updateProgress = (current: number, total: number) => {
    setProgress(Math.round((current / total) * 100));
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    const tests: Array<{ name: string; test: () => Promise<TestResult> }> = [
      {
        name: "Database Connection",
        test: async () => {
          try {
            const { data, error } = await supabase.from("affiliate_links").select("count");
            return {
              name: "Database Connection",
              status: error ? "failed" : "passed",
              message: error ? `❌ ${error.message}` : "✅ Database connected successfully",
              details: { error }
            };
          } catch (err: any) {
            return {
              name: "Database Connection",
              status: "failed",
              message: `❌ Connection failed: ${err.message}`
            };
          }
        }
      },
      {
        name: "Affiliate Links Count",
        test: async () => {
          const { data, error } = await supabase
            .from("affiliate_links")
            .select("*")
            .eq("status", "active");
          
          const count = data?.length || 0;
          return {
            name: "Affiliate Links Count",
            status: count > 0 ? "passed" : "warning",
            message: count > 0 
              ? `✅ Found ${count} active affiliate links` 
              : "⚠️ No active links found - run Auto-Discovery",
            details: { count, links: data }
          };
        }
      },
      {
        name: "Link Health Monitoring",
        test: async () => {
          try {
            const { data: campaign } = await supabase
              .from("campaigns")
              .select("id")
              .eq("status", "active")
              .limit(1)
              .single();

            if (!campaign) {
              return {
                name: "Link Health Monitoring",
                status: "warning",
                message: "⚠️ No active campaign found - deploy autopilot first"
              };
            }

            const health = await linkHealthMonitor.getHealthDashboard(campaign.id);
            return {
              name: "Link Health Monitoring",
              status: "passed",
              message: `✅ Health: ${health.healthScore}% (${health.totalLinks} links, ${health.invalidLinks} invalid)`,
              details: health
            };
          } catch (err: any) {
            return {
              name: "Link Health Monitoring",
              status: "failed",
              message: `❌ Health check failed: ${err.message}`
            };
          }
        }
      },
      {
        name: "Auto-Repair System",
        test: async () => {
          try {
            const { data: campaign } = await supabase
              .from("campaigns")
              .select("id, user_id")
              .eq("status", "active")
              .limit(1)
              .single();

            if (!campaign) {
              return {
                name: "Auto-Repair System",
                status: "warning",
                message: "⚠️ No campaign to repair - deploy autopilot first"
              };
            }

            const result = await linkHealthMonitor.oneClickAutoRepair(
              campaign.id,
              campaign.user_id
            );

            return {
              name: "Auto-Repair System",
              status: "passed",
              message: `✅ Auto-Repair: Checked ${result.totalChecked} links, Repaired ${result.repaired}, Removed ${result.removed}`,
              details: result
            };
          } catch (err: any) {
            return {
              name: "Auto-Repair System",
              status: "failed",
              message: `❌ Auto-repair failed: ${err.message}`
            };
          }
        }
      },
      {
        name: "Redirect System Test",
        test: async () => {
          const { data } = await supabase
            .from("affiliate_links")
            .select("slug, original_url, cloaked_url")
            .eq("status", "active")
            .limit(1)
            .single();

          if (!data) {
            return {
              name: "Redirect System Test",
              status: "warning",
              message: "⚠️ No links to test"
            };
          }

          return {
            name: "Redirect System Test",
            status: "passed",
            message: `✅ Test link: ${data.cloaked_url} → ${data.original_url}`,
            details: data
          };
        }
      },
      {
        name: "Traffic Tracking",
        test: async () => {
          const { data } = await supabase
            .from("affiliate_links")
            .select("clicks, conversions, revenue");

          const totalClicks = data?.reduce((sum, link) => sum + (link.clicks || 0), 0) || 0;
          const totalConversions = data?.reduce((sum, link) => sum + (link.conversions || 0), 0) || 0;
          const totalRevenue = data?.reduce((sum, link) => sum + (link.revenue || 0), 0) || 0;

          return {
            name: "Traffic Tracking",
            status: totalClicks > 0 ? "passed" : "warning",
            message: totalClicks > 0
              ? `✅ ${totalClicks} clicks, ${totalConversions} conversions, $${totalRevenue.toFixed(2)} revenue`
              : "⚠️ No traffic recorded yet",
            details: { totalClicks, totalConversions, totalRevenue }
          };
        }
      },
      {
        name: "Automation Tasks",
        test: async () => {
          const { data } = await supabase
            .from("autopilot_tasks")
            .select("*");

          const total = data?.length || 0;
          const pending = data?.filter(t => t.status === "pending").length || 0;
          const completed = data?.filter(t => t.status === "completed").length || 0;

          return {
            name: "Automation Tasks",
            status: total > 0 ? "passed" : "warning",
            message: total > 0
              ? `✅ ${total} tasks (${pending} pending, ${completed} completed)`
              : "⚠️ No automation tasks - deploy autopilot",
            details: { total, pending, completed }
          };
        }
      },
      {
        name: "System Performance",
        test: async () => {
          const { data: links } = await supabase
            .from("affiliate_links")
            .select("clicks, conversions")
            .eq("status", "active");

          const totalClicks = links?.reduce((sum, l) => sum + (l.clicks || 0), 0) || 0;
          const totalConversions = links?.reduce((sum, l) => sum + (l.conversions || 0), 0) || 0;
          const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

          return {
            name: "System Performance",
            status: conversionRate > 0 ? "passed" : "warning",
            message: `${conversionRate > 0 ? "✅" : "⚠️"} Conversion Rate: ${conversionRate.toFixed(2)}%`,
            details: { totalClicks, totalConversions, conversionRate }
          };
        }
      }
    ];

    // Run all tests
    for (let i = 0; i < tests.length; i++) {
      updateProgress(i, tests.length);
      
      const testResult = await tests[i].test();
      setResults(prev => [...prev, testResult]);
      
      // Small delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    updateProgress(tests.length, tests.length);
    
    // Get final system health
    const { data: healthData } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("status", "active");

    setSystemHealth({
      totalLinks: healthData?.length || 0,
      totalClicks: healthData?.reduce((sum, l) => sum + (l.clicks || 0), 0) || 0,
      totalConversions: healthData?.reduce((sum, l) => sum + (l.conversions || 0), 0) || 0,
      totalRevenue: healthData?.reduce((sum, l) => sum + (l.revenue || 0), 0) || 0,
    });

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      passed: "default",
      failed: "destructive",
      warning: "outline",
      running: "secondary"
    };
    return variants[status] || "default";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🧪 Comprehensive System Test</h1>
          <p className="text-muted-foreground">
            Complete audit of all system features and functionality
          </p>
        </div>

        <div className="grid gap-6">
          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Test Control Panel</CardTitle>
              <CardDescription>Run comprehensive system diagnostics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={runComprehensiveTest} 
                  disabled={isRunning}
                  className="w-full"
                  size="lg"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Running Tests... {progress}%
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Run Complete System Test
                    </>
                  )}
                </Button>

                {isRunning && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      Testing system components... {progress}%
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  {results.filter(r => r.status === "passed").length} passed, {" "}
                  {results.filter(r => r.status === "failed").length} failed, {" "}
                  {results.filter(r => r.status === "warning").length} warnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="font-medium mb-1">{result.name}</div>
                          <div className="text-sm text-muted-foreground">{result.message}</div>
                        </div>
                      </div>
                      <Badge variant={getStatusBadge(result.status)}>
                        {result.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Health Summary */}
          {systemHealth && (
            <Card>
              <CardHeader>
                <CardTitle>📊 System Health Summary</CardTitle>
                <CardDescription>Overall system performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Total Links</div>
                    <div className="text-2xl font-bold">{systemHealth.totalLinks}</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Total Clicks</div>
                    <div className="text-2xl font-bold">{systemHealth.totalClicks}</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Conversions</div>
                    <div className="text-2xl font-bold">{systemHealth.totalConversions}</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Revenue</div>
                    <div className="text-2xl font-bold">${systemHealth.totalRevenue.toFixed(2)}</div>
                  </div>
                </div>

                <Alert className="mt-6">
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    {systemHealth.totalLinks > 0 
                      ? "🟢 System is operational and tracking performance"
                      : "⚠️ Deploy Ultimate Autopilot to start generating revenue"}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}