import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function DataDiagnostic() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  async function runDiagnostic() {
    setLoading(true);
    try {
      const response = await fetch("/api/diagnose-data");
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Diagnostic failed:", error);
      setResults({ error: "Failed to run diagnostic" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SEO 
        title="Data Diagnostic - AffiliatePro"
        description="Check database status and existing data"
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">Data Diagnostic Tool</h1>
              <p className="text-muted-foreground">
                Check what data exists in your database tables
              </p>
            </div>

            <Card className="p-6 mb-6">
              <Button 
                onClick={runDiagnostic} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Running Diagnostic...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-5 w-5" />
                    Run Full Database Diagnostic
                  </>
                )}
              </Button>
            </Card>

            {results && (
              <div className="space-y-4">
                {results.success && (
                  <>
                    <Card className="p-6 bg-primary/5 border-primary">
                      <h2 className="text-xl font-bold mb-4">Summary</h2>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Tables Checked</div>
                          <div className="text-2xl font-bold">{results.summary.total_tables_checked}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">With Data</div>
                          <div className="text-2xl font-bold text-green-600">{results.summary.tables_with_data}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Empty</div>
                          <div className="text-2xl font-bold text-gray-400">{results.summary.tables_empty}</div>
                        </div>
                      </div>
                    </Card>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Table Details</h2>
                    {Object.entries(results.results).map(([table, data]: [string, any]) => (
                      <Card key={table} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {data.has_data ? (
                              <CheckCircle2 className="h-6 w-6 text-green-600" />
                            ) : (
                              <XCircle className="h-6 w-6 text-gray-400" />
                            )}
                            <div>
                              <h3 className="text-lg font-bold">{table}</h3>
                              <p className="text-sm text-muted-foreground">
                                {data.count} rows
                              </p>
                            </div>
                          </div>
                        </div>

                        {data.error && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 text-red-800">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Error: {data.error}</span>
                            </div>
                          </div>
                        )}

                        {data.has_data && data.sample_data && (
                          <div className="mt-4">
                            <div className="text-sm font-medium mb-2">Sample Data (first {data.sample_data.length} rows):</div>
                            <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                              <pre className="text-xs">
                                {JSON.stringify(data.sample_data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </>
                )}

                {results.error && (
                  <Card className="p-6 bg-red-50 border-red-200">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Error: {results.error}</span>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}