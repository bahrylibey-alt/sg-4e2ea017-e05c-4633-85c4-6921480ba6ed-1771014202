import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, AlertTriangle, CheckCircle, RefreshCw, Wrench } from "lucide-react";

/**
 * AUTOPILOT RUNNER COMPONENT
 * 
 * One-click system repair and activation
 */
export function AutopilotRunner() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runSmartRepair = async () => {
    setRunning(true);
    setResult(null);

    try {
      const response = await fetch('/api/smart-repair');
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        systemStatus: 'CRITICAL'
      });
    } finally {
      setRunning(false);
    }
  };

  const runAutopilot = async () => {
    setRunning(true);
    try {
      const response = await fetch('/api/test-cron-autopilot');
      const data = await response.json();
      alert(data.success ? '✅ Autopilot executed successfully!' : '❌ Autopilot failed');
    } catch (error) {
      alert('❌ Error running autopilot');
    } finally {
      setRunning(false);
    }
  };

  const runProductDiscovery = async () => {
    setRunning(true);
    try {
      const response = await fetch('/api/test-cron-discovery');
      const data = await response.json();
      alert(data.success ? '✅ Product discovery executed!' : '❌ Discovery failed');
    } catch (error) {
      alert('❌ Error running discovery');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          System Auto-Fix & Runner
        </CardTitle>
        <CardDescription>
          Scan for problems and fix them automatically, or manually run autopilot tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto-Fix Button */}
        <div className="space-y-2">
          <Button 
            onClick={runSmartRepair}
            disabled={running}
            className="w-full"
            size="lg"
            variant="default"
          >
            {running ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Scanning & Fixing...
              </>
            ) : (
              <>
                <Wrench className="mr-2 h-4 w-4" />
                🔧 Auto-Fix All Problems
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Scans the system for issues and repairs them automatically
          </p>
        </div>

        {/* Manual Controls */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={runAutopilot}
            disabled={running}
            variant="outline"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Run Autopilot
          </Button>
          <Button 
            onClick={runProductDiscovery}
            disabled={running}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Find Products
          </Button>
        </div>

        {/* Results Display */}
        {result && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              {result.systemStatus === 'HEALTHY' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : result.systemStatus === 'DEGRADED' ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-semibold">
                System Status: {result.systemStatus}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-2xl font-bold">{result.totalIssues}</div>
                <div className="text-xs text-muted-foreground">Issues Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.issuesFixed}</div>
                <div className="text-xs text-muted-foreground">Fixed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{result.issuesFailed}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>

            {result.details && result.details.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold">Issues Detected:</div>
                {result.details.slice(0, 5).map((detail: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs border-l-2 pl-2" style={{
                    borderColor: detail.severity === 'CRITICAL' ? '#ef4444' : 
                                 detail.severity === 'HIGH' ? '#f59e0b' : '#10b981'
                  }}>
                    <Badge variant={detail.status === 'FIXED' ? 'default' : 'destructive'}>
                      {detail.status}
                    </Badge>
                    <div>
                      <div className="font-semibold">{detail.issue}</div>
                      <div className="text-muted-foreground">{detail.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm font-semibold">Recommendations:</div>
                {result.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="text-xs text-muted-foreground">• {rec}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}