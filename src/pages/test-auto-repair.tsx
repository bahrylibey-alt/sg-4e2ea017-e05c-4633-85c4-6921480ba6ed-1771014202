import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { linkHealthMonitor } from "@/services/linkHealthMonitor";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";

export default function TestAutoRepair() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runAutoRepair = async () => {
    setIsRunning(true);
    setProgress(0);
    setResult(null);
    setLogs([]);

    addLog("🔧 Starting Auto-Repair test...");
    setProgress(10);

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    addLog(`✅ User ID: ${user?.id || 'Not logged in'}`);
    setProgress(20);

    // Get campaign
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, name")
      .eq("status", "active")
      .limit(1)
      .single();
    
    addLog(`✅ Campaign: ${campaign?.name || 'None found'} (${campaign?.id || 'N/A'})`);
    setProgress(30);

    // Get links before
    const { data: linksBefore } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("status", "active");
    
    addLog(`📊 Active links before: ${linksBefore?.length || 0}`);
    setProgress(40);

    // Run auto-repair
    addLog("🔄 Running auto-repair with REAL URL testing...");
    setProgress(50);

    const repairResult = await linkHealthMonitor.oneClickAutoRepair();
    
    addLog(`📊 Total checked: ${repairResult.totalChecked}`);
    addLog(`🔴 Removed: ${repairResult.removed}`);
    addLog(`✅ Replaced: ${repairResult.replaced}`);
    setProgress(80);

    // Get links after
    const { data: linksAfter } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("status", "active");
    
    addLog(`📊 Active links after: ${linksAfter?.length || 0}`);
    setProgress(90);

    setResult(repairResult);
    setProgress(100);
    addLog("✅ Auto-repair complete!");
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🧪 Auto-Repair System Test</h1>
          <p className="text-muted-foreground">
            Test the link repair system with REAL URL validation
          </p>
        </div>

        <div className="grid gap-6">
          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Test Control</CardTitle>
              <CardDescription>Run auto-repair with detailed logging</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runAutoRepair} 
                disabled={isRunning}
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Testing Auto-Repair... {progress}%
                  </>
                ) : (
                  "🧪 Run Auto-Repair Test"
                )}
              </Button>

              {isRunning && (
                <div className="mt-4">
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  {result.success ? "✅ Test completed successfully" : "❌ Test failed"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Total Checked</div>
                    <div className="text-2xl font-bold">{result.totalChecked}</div>
                  </div>
                  <div className="bg-red-500/10 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Removed</div>
                    <div className="text-2xl font-bold text-red-500">{result.removed}</div>
                  </div>
                  <div className="bg-green-500/10 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Replaced</div>
                    <div className="text-2xl font-bold text-green-500">{result.replaced}</div>
                  </div>
                  <div className="bg-blue-500/10 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Repaired</div>
                    <div className="text-2xl font-bold text-blue-500">{result.repaired}</div>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    {result.removed > 0 
                      ? `✅ Successfully removed ${result.removed} broken links and added ${result.replaced} fresh products!`
                      : "ℹ️ No broken links found. All links are working!"}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Logs</CardTitle>
                <CardDescription>Detailed execution log</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
                  {logs.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>How this test works:</strong><br/>
              1. Fetches all active affiliate links from database<br/>
              2. Tests each URL with REAL HTTP requests<br/>
              3. Identifies links that return 404 errors<br/>
              4. Removes broken links from database<br/>
              5. Adds fresh verified products as replacements<br/>
              6. Shows detailed results and logs
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  );
}