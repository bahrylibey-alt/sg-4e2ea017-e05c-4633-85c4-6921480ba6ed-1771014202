import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'INFO';
  message: string;
  action?: string;
  data?: any;
}

export default function TestCompletePage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<'READY' | 'NOT_READY' | 'PARTIAL' | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  const runCompleteTest = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setTestResults([]);

    try {
      const response = await fetch(`/api/test-autopilot-complete?userId=${userId}`);
      const data = await response.json();

      setTestResults(data.results || []);
      setOverallStatus(data.status);

      toast({
        title: data.status === 'READY' ? "✅ System Ready!" : "⚠️ Issues Found",
        description: data.message,
        variant: data.status === 'READY' ? 'default' : 'destructive'
      });

    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runProductDiscovery = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/run-product-discovery?userId=${userId}`);
      const data = await response.json();

      toast({
        title: data.success ? "✅ Products Discovered!" : "⚠️ No Products",
        description: data.message,
      });

      // Re-run test after discovery
      await runCompleteTest();

    } catch (error: any) {
      toast({
        title: "Discovery Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAutopilot = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/autopilot/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run autopilot');
      }

      toast({
        title: "✅ Autopilot Complete!",
        description: "Cycle finished successfully",
      });

      // Re-run test
      await runCompleteTest();

    } catch (error: any) {
      toast({
        title: "Autopilot Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAIL': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'WARN': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default: return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  if (!userId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Please log in to run system tests</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Complete System Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This page tests all autopilot components end-to-end with REAL data only.
            </p>

            <div className="grid gap-3 md:grid-cols-3">
              <Button
                onClick={runCompleteTest}
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Complete Test
                  </>
                )}
              </Button>

              <Button
                onClick={runProductDiscovery}
                disabled={isLoading}
                size="lg"
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Finding...
                  </>
                ) : (
                  <>
                    Find Products
                  </>
                )}
              </Button>

              <Button
                onClick={triggerAutopilot}
                disabled={isLoading}
                size="lg"
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    Trigger Autopilot
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {overallStatus && (
        <Card>
          <CardHeader>
            <CardTitle>
              Overall Status: <Badge variant={overallStatus === 'READY' ? 'default' : 'destructive'}>
                {overallStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={result.status === 'PASS' ? 'default' : result.status === 'FAIL' ? 'destructive' : 'secondary'}>
                        {result.status}
                      </Badge>
                      <span className="font-medium">{result.step}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.action && (
                      <p className="text-sm text-primary mt-1">→ {result.action}</p>
                    )}
                    {result.data && (
                      <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li>1. Connect affiliate networks in /integrations (Amazon, AliExpress, etc.)</li>
            <li>2. Add valid API keys for each network</li>
            <li>3. Click "Find Products" to discover products</li>
            <li>4. Configure autopilot settings in /settings</li>
            <li>5. Enable autopilot and let it run automatically</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}