import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function EmergencyRecoveryPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [healthCheck, setHealthCheck] = useState<any>(null);

  const runEmergencyFix = async () => {
    setRunning(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/run-emergency-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        report: 'Failed to run emergency recovery'
      });
    } finally {
      setRunning(false);
    }
  };

  const runHealthCheck = async () => {
    setHealthCheck(null);
    
    try {
      const response = await fetch('/api/test-system-health');
      const data = await response.json();
      setHealthCheck(data);
    } catch (error: any) {
      setHealthCheck({
        success: false,
        error: error.message
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">🚨 Emergency System Recovery</h1>
            <p className="text-muted-foreground text-lg">
              Clear stuck backlog and restore system to working state
            </p>
          </div>

          <Card className="border-orange-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Current Issues Detected
              </CardTitle>
              <CardDescription>
                System has 1000+ drafts stuck since April 13th. Last successful publishing was April 10th (12 days ago).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="font-semibold">What this will fix:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Publish all 1000+ stuck drafts from past 12 days</li>
                  <li>Delete mock/fake products (Auto Product XXX)</li>
                  <li>Reset autopilot to working state</li>
                  <li>Clear stale content queue</li>
                  <li>Fix link routing for published content</li>
                </ul>
              </div>

              <Button
                onClick={runEmergencyFix}
                disabled={running}
                size="lg"
                className="w-full"
                variant="destructive"
              >
                {running ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Emergency Recovery...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Run Emergency Recovery
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card className={result.success ? "border-green-500/50" : "border-red-500/50"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Recovery Complete
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Recovery Failed
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.report && (
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                    {result.report}
                  </pre>
                )}
                {result.stats && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{result.stats.draftsPublished}</div>
                      <div className="text-xs text-muted-foreground">Drafts Published</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{result.stats.mockProductsDeleted}</div>
                      <div className="text-xs text-muted-foreground">Mocks Deleted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{result.stats.queueCleared}</div>
                      <div className="text-xs text-muted-foreground">Queue Cleared</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>System Health Check</CardTitle>
              <CardDescription>
                Verify system status after recovery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={runHealthCheck}
                variant="outline"
                className="w-full"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Run Health Check
              </Button>

              {healthCheck && (
                <div>
                  {healthCheck.report && (
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                      {healthCheck.report}
                    </pre>
                  )}
                  {healthCheck.stats && (
                    <div className="mt-4 grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{healthCheck.stats.published}</div>
                        <div className="text-xs text-muted-foreground">Published</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{healthCheck.stats.drafts}</div>
                        <div className="text-xs text-muted-foreground">Drafts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{healthCheck.stats.products}</div>
                        <div className="text-xs text-muted-foreground">Products</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{healthCheck.stats.integrations}</div>
                        <div className="text-xs text-muted-foreground">Integrations</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardHeader>
              <CardTitle>Next Steps After Recovery</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click any published link in <strong>/content-manager</strong> - it should open correctly</li>
                <li>Go to <strong>/integrations</strong> - connect real affiliate networks (Amazon, ClickBank, etc.)</li>
                <li>Autopilot will start publishing daily automatically (scheduled 12:00 UTC)</li>
                <li>Product discovery runs daily at 8:00 UTC to find trending products</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}