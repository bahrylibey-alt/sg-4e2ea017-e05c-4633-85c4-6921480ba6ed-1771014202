import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Activity, AlertCircle, CheckCircle, Play, Zap, Loader2, Package, Wrench } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SystemStatus {
  status: 'READY' | 'NOT_READY' | 'PARTIAL';
  message: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  results: Array<{
    step: string;
    status: 'PASS' | 'FAIL' | 'WARN' | 'INFO';
    message: string;
    action?: string;
  }>;
  actions: string[];
}

export function AutopilotDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Auto-refresh status every 30 seconds
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  const checkStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/diagnose-system");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to check status:", error);
      toast({
        title: "Status Check Failed",
        description: "Could not retrieve system status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runQuickFix = async () => {
    try {
      setIsLoading(true);
      toast({
        title: "Running Quick Fix",
        description: "Automatically configuring your system...",
      });

      const response = await fetch("/api/quick-fix", { method: "POST" });
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Quick Fix Complete",
          description: `Fixed ${result.summary.fixed} issues`,
        });
        await checkStatus(); // Refresh status
      } else {
        toast({
          title: "Quick Fix Partial",
          description: `Fixed ${result.summary.fixed}, failed ${result.summary.failed}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Quick fix failed:", error);
      toast({
        title: "Quick Fix Failed",
        description: "Could not run automatic fixes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    if (!userId) {
      toast({ title: "Error", description: "Please log in first", variant: "destructive" });
      return;
    }

    setIsRunning(true);

    try {
      console.log(`${enabled ? 'STARTING' : 'STOPPING'} autopilot...`);

      const { error } = await supabase
        .from('user_settings')
        .update({ autopilot_enabled: enabled })
        .eq('user_id', userId);

      if (error) {
        console.error('Settings update error:', error);
        toast({
          title: "Error",
          description: "Failed to update autopilot status",
          variant: "destructive"
        });
        return;
      }

      setIsEnabled(enabled);
      
      toast({
        title: enabled ? "🚀 Autopilot Started" : "⏸️ Autopilot Stopped",
        description: enabled 
          ? "System will run automatically every 30 seconds" 
          : "All automation has been stopped",
      });

      if (enabled) {
        handleRunNow();
      }
    } catch (error: any) {
      console.error('Autopilot toggle error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to toggle autopilot",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunNow = async () => {
    if (!userId) {
      toast({ title: "Error", description: "Please log in first", variant: "destructive" });
      return;
    }

    setIsRunning(true);

    try {
      toast({
        title: "⚡ Running Autopilot Cycle",
        description: "Processing products, scoring, and making decisions...",
      });

      const response = await fetch('/api/autopilot/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run autopilot');
      }

      console.log('Autopilot result:', data);

      toast({
        title: "✅ Autopilot Cycle Complete!",
        description: `Processed successfully`,
      });

      await checkSystemStatus();
    } catch (error: any) {
      console.error('Run now error:', error);
      toast({
        title: "Autopilot Error",
        description: error.message || "Failed to run cycle",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleFindProducts = async () => {
    if (!userId) {
      toast({ title: "Error", description: "Please log in first", variant: "destructive" });
      return;
    }

    setIsRunning(true);

    try {
      toast({
        title: "🔍 Finding Products",
        description: "Discovering products from connected affiliate networks...",
      });

      const response = await fetch(`/api/run-product-discovery?userId=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to discover products');
      }

      console.log('Discovery result:', data);

      toast({
        title: data.success ? "✅ Products Found!" : "⚠️ No Products Found",
        description: data.message,
      });

      await checkSystemStatus();
    } catch (error: any) {
      console.error('Product discovery error:', error);
      toast({
        title: "Discovery Error",
        description: error.message || "Failed to find products",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: 'PASS' | 'FAIL' | 'WARN' | 'INFO') => {
    switch (status) {
      case 'PASS': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAIL': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'WARN': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: 'PASS' | 'FAIL' | 'WARN' | 'INFO') => {
    const variants = {
      'PASS': 'default',
      'FAIL': 'destructive',
      'WARN': 'secondary',
      'INFO': 'outline'
    };
    return variants[status] as any;
  };

  if (!userId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Please log in to access autopilot</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Activity className={`h-6 w-6 ${isEnabled ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                AI Autopilot System
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Scans the system for issues and repairs them automatically
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border-2">
                <Switch
                  id="autopilot-toggle"
                  checked={isEnabled}
                  onCheckedChange={handleToggle}
                  disabled={isRunning}
                  className="data-[state=checked]:bg-green-500"
                />
                <Label htmlFor="autopilot-toggle" className="font-bold text-base cursor-pointer">
                  {isEnabled ? '🟢 RUNNING' : '⚪ STOPPED'}
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={handleRunNow}
          disabled={isRunning || isLoading}
          size="lg"
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Autopilot
            </>
          )}
        </Button>

        <Button
          onClick={handleFindProducts}
          disabled={isDiscovering || isLoading}
          size="lg"
          variant="outline"
          className="w-full"
        >
          {isDiscovering ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Discovering...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Find Products
            </>
          )}
        </Button>

        <Button
          onClick={runQuickFix}
          disabled={isLoading}
          size="lg"
          variant="secondary"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fixing...
            </>
          ) : (
            <>
              <Wrench className="mr-2 h-4 w-4" />
              Quick Fix
            </>
          )}
        </Button>
      </div>

      {/* System Status */}
      {systemStatus && (
        <>
          {/* Status Alert */}
          <Alert variant={systemStatus.status === 'READY' ? 'default' : 'destructive'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">System Status: {systemStatus.status}</p>
                  <p className="text-sm">{systemStatus.message}</p>
                </div>
                <Badge variant={systemStatus.status === 'READY' ? 'default' : 'destructive'}>
                  {systemStatus.summary.passed} / {systemStatus.summary.total} PASSED
                </Badge>
              </div>
            </AlertDescription>
          </Alert>

          {/* Status Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-red-500">
                  {systemStatus.summary.failed}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Fixed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-500">
                  {systemStatus.summary.passed}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>

          {/* Issues Detected */}
          <Card>
            <CardHeader>
              <CardTitle>Issues Detected:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemStatus.results.map((result, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getStatusBadge(result.status)}>
                          {result.status}
                        </Badge>
                        <span className="font-medium">{result.step}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                      {result.action && (
                        <p className="text-sm text-primary mt-1">{result.action}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {systemStatus.actions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations:</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {systemStatus.actions.map((action, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={checkSystemStatus}
          disabled={isChecking}
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </>
          )}
        </Button>
      </div>
    </div>
  );
}