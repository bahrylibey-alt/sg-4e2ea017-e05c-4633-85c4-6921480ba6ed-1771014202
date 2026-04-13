import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Loader2, ExternalLink, PlayCircle, Database, Activity, Trash2, WrenchIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkAllLinksHealth, removeAllBrokenLinks, autoRepairLinks } from "@/services/linkHealthMonitor";

export default function TrafficTest() {
  const [testing, setTesting] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [autoRepairing, setAutoRepairing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);

  const runHealthCheck = async () => {
    setTesting(true);
    setProgress(0);
    setResults(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please log in first');
      }

      setProgress(10);

      // Run comprehensive health check
      const healthResults = await checkAllLinksHealth(user.id);

      setProgress(100);

      setResults({
        type: 'health_check',
        totalLinks: healthResults.totalChecked,
        working: healthResults.working,
        broken: healthResults.broken,
        removed: healthResults.removed,
        links: healthResults.results.slice(0, 20) // Show first 20
      });

    } catch (error: any) {
      console.error('Health check failed:', error);
      setResults({
        type: 'error',
        error: error.message
      });
    } finally {
      setTesting(false);
      setProgress(0);
    }
  };

  const removeAllBroken = async () => {
    setCleaning(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please log in first');
      }

      const removed = await removeAllBrokenLinks(user.id);

      setResults({
        type: 'cleanup',
        removed,
        message: `Successfully removed ${removed} broken links from database`
      });

    } catch (error: any) {
      console.error('Cleanup failed:', error);
      setResults({
        type: 'error',
        error: error.message
      });
    } finally {
      setCleaning(false);
    }
  };

  const runAutoRepair = async () => {
    setAutoRepairing(true);
    setProgress(0);
    setResults(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please log in first');
      }

      setProgress(20);

      const repairResults = await autoRepairLinks(user.id);

      setProgress(100);

      setResults({
        type: 'auto_repair',
        repaired: repairResults.repaired,
        removed: repairResults.removed,
        report: repairResults.report
      });

    } catch (error: any) {
      console.error('Auto-repair failed:', error);
      setResults({
        type: 'error',
        error: error.message
      });
    } finally {
      setAutoRepairing(false);
      setProgress(0);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            🔍 Link Health Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
            <AlertDescription>
              <strong>Real Link Validation:</strong> This tool checks if Amazon/Temu products still exist, not just redirect URLs. 
              Broken products are automatically marked and can be removed with one click.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-3 gap-4">
            <Button 
              onClick={runHealthCheck} 
              disabled={testing || cleaning || autoRepairing} 
              size="lg" 
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Check All Links
                </>
              )}
            </Button>

            <Button 
              onClick={removeAllBroken} 
              disabled={testing || cleaning || autoRepairing}
              size="lg" 
              variant="destructive"
              className="w-full"
            >
              {cleaning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Broken
                </>
              )}
            </Button>

            <Button 
              onClick={runAutoRepair} 
              disabled={testing || cleaning || autoRepairing}
              size="lg" 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {autoRepairing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Repairing...
                </>
              ) : (
                <>
                  <WrenchIcon className="w-4 h-4 mr-2" />
                  Auto-Repair
                </>
              )}
            </Button>
          </div>

          {(testing || autoRepairing) && progress > 0 && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                {progress}% complete...
              </p>
            </div>
          )}

          {/* Results Display */}
          {results && (
            <div className="space-y-4">
              {results.type === 'health_check' && (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold">{results.totalLinks}</p>
                        <p className="text-sm text-muted-foreground">Total Links</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-green-600">{results.working}</p>
                        <p className="text-sm text-muted-foreground">Working</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-orange-600">{results.broken}</p>
                        <p className="text-sm text-muted-foreground">Broken</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-red-600">{results.removed}</p>
                        <p className="text-sm text-muted-foreground">Removed</p>
                      </CardContent>
                    </Card>
                  </div>

                  {results.removed > 0 && (
                    <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        <strong>⚠️ {results.removed} links removed</strong> - These products no longer exist on Amazon/Temu after 3 failed checks.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <h3 className="font-semibold">Link Details (First 20):</h3>
                    {results.links.map((link: any, idx: number) => (
                      <Card key={idx} className={link.isWorking ? "border-green-500/50" : "border-red-500/50"}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {link.isWorking ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                )}
                                <p className="font-semibold">{link.productName}</p>
                                <Badge variant="secondary">{link.network}</Badge>
                                {link.isWorking && <Badge className="bg-green-500">WORKING</Badge>}
                                {!link.isWorking && <Badge variant="destructive">BROKEN</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Slug: <code className="bg-muted px-1 rounded">{link.slug}</code>
                              </p>
                              <p className="text-xs text-muted-foreground break-all">
                                URL: {link.originalUrl}
                              </p>
                              {link.error && (
                                <p className="text-sm text-red-600 mt-2">Error: {link.error}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(link.originalUrl, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {results.type === 'cleanup' && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>✅ Cleanup Complete!</strong><br/>
                    {results.message}
                  </AlertDescription>
                </Alert>
              )}

              {results.type === 'auto_repair' && (
                <Card className="border-2 border-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Auto-Repair Complete!
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                      {results.report}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {results.type === 'error' && (
                <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {results.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <strong>1. Check All Links</strong>
            <p className="text-muted-foreground">
              Validates ACTUAL Amazon/Temu product pages (not just redirect URLs). 
              Marks broken products and counts failures.
            </p>
          </div>
          <div>
            <strong>2. Remove Broken</strong>
            <p className="text-muted-foreground">
              Deletes links with 3+ consecutive failures from database. 
              Clean slate for real products only.
            </p>
          </div>
          <div>
            <strong>3. Auto-Repair</strong>
            <p className="text-muted-foreground">
              Runs full health check + removes all broken links in one click. 
              Your database will only contain working products.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}