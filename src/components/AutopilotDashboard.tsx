import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Activity, AlertCircle, CheckCircle, Play, Loader2, Wrench } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SystemStatus {
  status: 'READY' | 'NOT_READY' | 'PARTIAL' | 'CRITICAL';
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
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        const { data } = await supabase
          .from('user_settings')
          .select('autopilot_enabled')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (data && data.autopilot_enabled !== undefined) {
          setIsEnabled(data.autopilot_enabled);
        }
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      setIsChecking(true);
      const response = await fetch("/api/diagnose-system");
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error("Failed to check status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const runQuickFix = async () => {
    try {
      setIsChecking(true);
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
        await checkSystemStatus();
      } else {
        toast({
          title: "Quick Fix Partial",
          description: `Fixed ${result.summary?.fixed || 0}, failed ${result.summary?.failed || 0}`,
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
      setIsChecking(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (!userId) return;
    
    try {
      setIsEnabled(checked);
      await supabase
        .from('user_settings')
        .update({ autopilot_enabled: checked })
        .eq('user_id', userId);
        
      toast({
        title: checked ? "Autopilot Enabled" : "Autopilot Disabled",
        description: checked ? "System is now running automatically" : "Automation paused",
      });
    } catch (error) {
      console.error("Toggle error:", error);
    }
  };

  const runAutopilot = async () => {
    if (!userId) return;
    setIsRunning(true);
    try {
      toast({ title: "Running Autopilot", description: "Processing products and campaigns..." });
      const response = await fetch('/api/autopilot/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to run autopilot');
      toast({ title: "Success", description: "Autopilot cycle completed" });
      await checkSystemStatus();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  };

  const discoverProducts = async () => {
    if (!userId) return;
    setIsDiscovering(true);
    try {
      toast({ title: "Finding Products", description: "Discovering from connected networks..." });
      const response = await fetch(`/api/run-product-discovery?userId=${userId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to discover products');
      toast({ title: "Success", description: data.message });
      await checkSystemStatus();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsDiscovering(false);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button onClick={runAutopilot} disabled={isRunning || isChecking} size="lg" className="w-full">
          {isRunning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...</> : <><Play className="mr-2 h-4 w-4" /> Run Autopilot</>}
        </Button>
        <Button onClick={discoverProducts} disabled={isDiscovering || isChecking} size="lg" variant="outline" className="w-full">
          {isDiscovering ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Discovering...</> : <><RefreshCw className="mr-2 h-4 w-4" /> Find Products</>}
        </Button>
        <Button onClick={runQuickFix} disabled={isChecking} size="lg" variant="secondary" className="w-full">
          {isChecking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fixing...</> : <><Wrench className="mr-2 h-4 w-4" /> Quick Fix</>}
        </Button>
      </div>

      {systemStatus && (
        <>
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

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Issues Found</CardTitle></CardHeader>
              <CardContent><div className="text-4xl font-bold text-red-500">{systemStatus.summary.failed + systemStatus.summary.warnings}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Fixed</CardTitle></CardHeader>
              <CardContent><div className="text-4xl font-bold text-green-500">{systemStatus.summary.passed}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Failed</CardTitle></CardHeader>
              <CardContent><div className="text-4xl font-bold">{systemStatus.summary.failed}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>System Diagnostics:</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemStatus.results.map((result, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getStatusBadge(result.status)}>{result.status}</Badge>
                        <span className="font-medium">{result.step}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                      {result.action && <p className="text-sm text-primary mt-1">{result.action}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {systemStatus.actions.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Recommendations:</CardTitle></CardHeader>
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

      <div className="flex justify-center">
        <Button variant="outline" onClick={checkSystemStatus} disabled={isChecking}>
          {isChecking ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking...</> : <><RefreshCw className="h-4 w-4 mr-2" /> Refresh Status</>}
        </Button>
      </div>
    </div>
  );
}