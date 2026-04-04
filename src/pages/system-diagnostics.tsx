import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Database,
  Activity,
  Link,
  Zap,
  TrendingUp,
  Users,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { activityLogger } from "@/services/activityLogger";
import { campaignService } from "@/services/campaignService";
import { affiliateLinkService } from "@/services/affiliateLinkService";
import { realTimeAnalytics } from "@/services/realTimeAnalytics";
import { automationScheduler } from "@/services/automationScheduler";
import { freeTrafficEngine } from "@/services/freeTrafficEngine";

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "warning" | "pending";
  message: string;
  details?: any;
  timestamp: string;
}

export default function SystemDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runFullDiagnostics = async () => {
    setResults([]);
    setRunning(true);

    try {
      // 1. Database Connection Test
      await testDatabaseConnection();
      
      // 2. Authentication Test
      await testAuthentication();
      
      // 3. Activity Logger Test
      await testActivityLogger();
      
      // 4. Campaign Service Test
      await testCampaignService();
      
      // 5. Affiliate Link Service Test
      await testAffiliateLinkService();
      
      // 6. Real-Time Analytics Test
      await testRealTimeAnalytics();
      
      // 7. Automation Scheduler Test
      await testAutomationScheduler();
      
      // 8. Free Traffic Engine Test
      await testFreeTrafficEngine();
      
      // 9. Database Schema Verification
      await testDatabaseSchema();
      
      // 10. RLS Policies Test
      await testRLSPolicies();

    } catch (err) {
      addResult({
        name: "System Diagnostics",
        status: "error",
        message: "Fatal error during diagnostics",
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      });
    } finally {
      setRunning(false);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await (supabase as any).from("campaigns").select("count").limit(1);
      
      if (error) throw error;
      
      addResult({
        name: "Database Connection",
        status: "success",
        message: "Successfully connected to Supabase database",
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      addResult({
        name: "Database Connection",
        status: "error",
        message: "Failed to connect to database",
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      });
    }
  };

  const testAuthentication = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      if (!user) {
        addResult({
          name: "Authentication",
          status: "warning",
          message: "No user authenticated - some features may not work",
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      addResult({
        name: "Authentication",
        status: "success",
        message: `User authenticated: ${user.email}`,
        details: { userId: user.id, email: user.email },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      addResult({
        name: "Authentication",
        status: "error",
        message: "Authentication check failed",
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      });
    }
  };

  const testActivityLogger = async () => {
    try {
      // Test logging
      await activityLogger.log("diagnostic_test", "info", "Testing activity logger");
      
      // Test retrieval
      const logs = await activityLogger.getRecentActivity(5);
      
      addResult({
        name: "Activity Logger",
        status: "success",
        message: `Activity logger working - ${logs.length} recent logs found`,
        details: { recentLogs: logs.length },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      addResult({
        name: "Activity Logger",
        status: "error",
        message: "Activity logger test failed",
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      });
    }
  };

  const testCampaignService = async () => {
    try {
      const stats = await campaignService.getCampaignStats();
      const campaigns = await campaignService.listCampaigns();
      
      addResult({
        name: "Campaign Service",
        status: "success",
        message: `Campaign service operational - ${campaigns.length} campaigns found`,
        details: { 
          campaigns: campaigns.length,
          activeCampaigns: stats.activeCampaigns,
          totalRevenue: stats.totalRevenue
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      addResult({
        name: "Campaign Service",
        status: "error",
        message: "Campaign service test failed",
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      });
    }
  };

  const testAffiliateLinkService = async () => {
    try {
      const { links, error } = await affiliateLinkService.getUserLinks();
      
      if (error) throw new Error(error);
      
      addResult({
        name: "Affiliate Link Service",
        status: "success",
        message: `Affiliate link service working - ${links.length} links found`,
        details: { totalLinks: links.length },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      addResult({
        name: "Affiliate Link Service",
        status: "error",
        message: "Affiliate link service test failed",
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      });
    }
  };

  const testRealTimeAnalytics = async () => {
    try {
      const snapshot = await realTimeAnalytics.getPerformanceSnapshot();
      
      addResult({
        name: "Real-Time Analytics",
        status: "success",
        message: "Analytics service operational",
        details: {
          totalClicks: snapshot.totalClicks,
          totalConversions: snapshot.totalConversions,
          totalRevenue: snapshot.totalRevenue
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      addResult({
        name: "Real-Time Analytics",
        status: "error",
        message: "Analytics service test failed",
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      });
    }
  };

  const testAutomationScheduler = async () => {
    try {
      const isRunning = automationScheduler.isRunning;
      
      addResult({
        name: "Automation Scheduler",
        status: isRunning ? "success" : "warning",
        message: isRunning 
          ? "Automation scheduler is running" 
          : "Automation scheduler is not running - will start when campaigns are created",
        details: { isRunning },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      addResult({
        name: "Automation Scheduler",
        status: "error",
        message: "Automation scheduler test failed",
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      });
    }
  };

  const testFreeTrafficEngine = async () => {
    try {
      const stats = await freeTrafficEngine.getTrafficStats();
      
      addResult({
        name: "Free Traffic Engine",
        status: "success",
        message: "Traffic engine operational",
        details: {
          totalClicks: stats.totalClicks,
          totalConversions: stats.totalConversions,
          conversionRate: stats.conversionRate
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      addResult({
        name: "Free Traffic Engine",
        status: "error",
        message: "Traffic engine test failed",
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      });
    }
  };

  const testDatabaseSchema = async () => {
    try {
      const tables = [
        "campaigns",
        "affiliate_links",
        "activity_logs",
        "automation_metrics",
        "autopilot_tasks",
        "content_queue",
        "click_events",
        "conversion_events"
      ];

      const results = await Promise.all(
        tables.map(async (table) => {
          try {
            const { error } = await (supabase as any).from(table).select("*").limit(1);
            return { table, exists: !error, error };
          } catch {
            return { table, exists: false };
          }
        })
      );

      const missingTables = results.filter(r => !r.exists);
      
      if (missingTables.length > 0) {
        addResult({
          name: "Database Schema",
          status: "warning",
          message: `${missingTables.length} tables may be missing or inaccessible`,
          details: { missingTables: missingTables.map(t => t.table) },
          timestamp: new Date().toISOString()
        });
      } else {
        addResult({
          name: "Database Schema",
          status: "success",
          message: "All required tables exist and are accessible",
          details: { verifiedTables: tables.length },
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      addResult({
        name: "Database Schema",
        status: "error",
        message: "Schema verification failed",
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      });
    }
  };

  const testRLSPolicies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        addResult({
          name: "RLS Policies",
          status: "warning",
          message: "Cannot test RLS policies without authentication",
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Test write permissions
      const testData = {
        user_id: user.id,
        action: "rls_test",
        status: "info" as const,
        details: "Testing RLS policies"
      };

      const { error: insertError } = await supabase
        .from("activity_logs")
        .insert(testData);

      if (insertError) {
        addResult({
          name: "RLS Policies",
          status: "error",
          message: "RLS policies may be blocking legitimate operations",
          details: insertError,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Test read permissions
      const { data, error: selectError } = await supabase
        .from("activity_logs")
        .select("*")
        .limit(1);

      if (selectError) {
        addResult({
          name: "RLS Policies",
          status: "error",
          message: "Cannot read from database - RLS policies may be too restrictive",
          details: selectError,
          timestamp: new Date().toISOString()
        });
        return;
      }

      addResult({
        name: "RLS Policies",
        status: "success",
        message: "RLS policies are properly configured",
        details: { canRead: true, canWrite: true },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      addResult({
        name: "RLS Policies",
        status: "error",
        message: "RLS policy test failed",
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "default" as const,
      error: "destructive" as const,
      warning: "secondary" as const,
      pending: "outline" as const
    };
    return variants[status as keyof typeof variants] || "outline";
  };

  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;
  const warningCount = results.filter(r => r.status === "warning").length;

  return (
    <div className="container py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">System Diagnostics</h1>
        <p className="text-muted-foreground">
          Comprehensive health check of all system functions and integrations
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Run Diagnostics</CardTitle>
          <CardDescription>
            Test all system components and identify any issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={runFullDiagnostics} 
              disabled={running}
              size="lg"
            >
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Diagnostics...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Run Full Diagnostics
                </>
              )}
            </Button>
            
            {results.length > 0 && (
              <div className="flex items-center gap-3">
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {successCount} Passed
                </Badge>
                {warningCount > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {warningCount} Warnings
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {errorCount} Errors
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid gap-4">
              {results.map((result, idx) => (
                <Card key={idx} className={
                  result.status === "error" ? "border-red-200 bg-red-50/50" :
                  result.status === "warning" ? "border-orange-200 bg-orange-50/50" :
                  "border-green-200 bg-green-50/50"
                }>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {getStatusIcon(result.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{result.name}</h3>
                          <Badge variant={getStatusBadge(result.status)}>
                            {result.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {result.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(result.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4 mt-6">
            {results.map((result, idx) => (
              result.details && (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      {result.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )
            ))}
          </TabsContent>

          <TabsContent value="recommendations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {errorCount > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Critical Issues Found:</strong> {errorCount} component(s) are not functioning properly.
                      Please review the errors in the Details tab and address them immediately.
                    </AlertDescription>
                  </Alert>
                )}

                {warningCount > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warnings:</strong> {warningCount} component(s) have potential issues.
                      While not critical, these should be addressed for optimal performance.
                    </AlertDescription>
                  </Alert>
                )}

                {successCount === results.length && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <strong>All Systems Operational:</strong> All components passed diagnostic tests.
                      Your system is functioning properly.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3 pt-4">
                  <h4 className="font-semibold">Common Solutions:</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>If authentication fails, ensure you're logged in</li>
                    <li>If database connection fails, check your Supabase configuration</li>
                    <li>If RLS policies block access, verify your user has proper permissions</li>
                    <li>If services show no data, try creating test campaigns and links</li>
                    <li>If automation isn't running, create a campaign to trigger it</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}