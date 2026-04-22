import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Zap, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AutopilotRunnerProps {
  onComplete?: () => void;
}

export function AutopilotRunner({ onComplete }: AutopilotRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const runEmergencyFix = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/emergency-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        toast({
          title: "✅ System Restored!",
          description: `Published ${data.stats?.draftsPublished || 0} stuck posts. Numbers will update in 5-10 minutes.`,
        });
      } else {
        toast({
          title: "Recovery Error",
          description: data.message || "Recovery failed",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        report: 'Failed to run emergency recovery'
      });
      toast({
        title: "Error",
        description: "Could not connect to recovery endpoint",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="border-2 border-orange-500/30 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              Emergency Restart
            </CardTitle>
            <CardDescription className="mt-2">
              If your system appears stuck (numbers not changing), use this to force the automation engine to restart immediately.
            </CardDescription>
          </div>
          <Button 
            onClick={runEmergencyFix} 
            disabled={isRunning}
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restarting...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Force Restart Now
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {result && (
        <CardContent>
          <Alert variant={result.success ? "default" : "destructive"}>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">
                  {result.success ? "✅ Success" : "❌ Failed"}
                </p>
                <p className="text-sm">{result.message}</p>
                {result.results && result.results.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {result.results.map((r: any, i: number) => (
                      <div key={i} className="text-xs bg-background/50 p-2 rounded">
                        <p><strong>User:</strong> {r.userId}</p>
                        <p><strong>Status:</strong> {r.success ? '✅ Success' : '❌ Failed'}</p>
                        {r.error && <p className="text-destructive"><strong>Error:</strong> {r.error}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
    </Card>
  );
}