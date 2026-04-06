import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, ExternalLink, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function RealLinkTest() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [repairLoading, setRepairLoading] = useState(false);
  const [repairResults, setRepairResults] = useState<any>(null);

  const runTest = async () => {
    setLoading(true);
    setResults(null);

    try {
      // Fetch all active links
      const { data: links, error } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by network
      const byNetwork = {
        temu: links?.filter(l => l.network.includes('Temu')) || [],
        amazon: links?.filter(l => l.network.includes('Amazon')) || [],
        aliexpress: links?.filter(l => l.network.includes('AliExpress')) || []
      };

      setResults({
        total: links?.length || 0,
        byNetwork,
        links: links || []
      });

      toast({
        title: "Test Complete",
        description: `Found ${links?.length || 0} active links`
      });
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runRepair = async () => {
    setRepairLoading(true);
    setRepairResults(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch("/api/smart-repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id })
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Repair failed");

      setRepairResults(result);

      toast({
        title: "Repair Complete",
        description: `Checked ${result.totalChecked} links, removed ${result.invalidRemoved + result.duplicatesRemoved}, replaced ${result.replaced}`
      });

      // Refresh results after repair
      await runTest();
    } catch (error: any) {
      toast({
        title: "Repair Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRepairLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Real Link Test</h1>
            <p className="text-muted-foreground">Test your actual affiliate links from the database</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={runTest} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <RefreshCw className="w-4 h-4 mr-2" />
              Test Links
            </Button>
            <Button onClick={runRepair} disabled={repairLoading} variant="outline">
              {repairLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Run Smart Repair
            </Button>
          </div>
        </div>

        {repairResults && (
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              <strong>Smart Repair Results:</strong>
              <ul className="mt-2 space-y-1">
                <li>✅ Total Checked: {repairResults.totalChecked}</li>
                <li>🗑️ Invalid Removed: {repairResults.invalidRemoved}</li>
                <li>🗑️ Duplicates Removed: {repairResults.duplicatesRemoved}</li>
                <li>✨ Replaced: {repairResults.replaced}</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {results && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Link Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold">{results.total}</div>
                    <div className="text-sm text-muted-foreground">Total Links</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold">{results.byNetwork.temu.length}</div>
                    <div className="text-sm text-muted-foreground">Temu Links</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold">{results.byNetwork.amazon.length}</div>
                    <div className="text-sm text-muted-foreground">Amazon Links</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Active Links ({results.links.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.links.map((link: any) => (
                    <div key={link.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{link.product_name}</h3>
                          <Badge>{link.network}</Badge>
                          <p className="text-sm text-muted-foreground">
                            Commission: {link.commission_rate}%
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.open(link.cloaked_url || `/go/${link.slug}`, '_blank');
                            toast({
                              title: "Testing Link",
                              description: `Opening ${link.product_name}`
                            });
                          }}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Test Link
                        </Button>
                      </div>
                      <div className="text-xs font-mono bg-muted p-2 rounded">
                        {link.cloaked_url || `/go/${link.slug}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Original: {link.original_url.substring(0, 60)}...
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!results && !loading && (
          <Alert>
            <AlertDescription>
              Click "Test Links" to fetch and display your current affiliate links from the database.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}