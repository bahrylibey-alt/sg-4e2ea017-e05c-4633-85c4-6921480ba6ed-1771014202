import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function TestAuthSystemPage() {
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    setDiagnostics([]);

    try {
      const response = await fetch("/api/auth/diagnose");
      const data = await response.json();

      setDiagnostics(data.diagnostics || []);

      if (!data.success) {
        setError(data.error || "Diagnostics failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run diagnostics");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status.includes("✅")) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (status.includes("❌")) return <XCircle className="h-5 w-5 text-red-600" />;
    if (status.includes("⚠️")) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
  };

  return (
    <>
      <SEO title="Test Auth System - AffiliatePro" />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Auth System Diagnostics</h1>
              <p className="text-muted-foreground mt-2">
                Test the complete authentication system to identify any issues
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Run Diagnostics</CardTitle>
                <CardDescription>
                  This will test environment variables, database connection, and auth admin access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={runDiagnostics} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Diagnostics...
                    </>
                  ) : (
                    "Run Diagnostics"
                  )}
                </Button>
              </CardContent>
            </Card>

            {diagnostics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Diagnostic Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {diagnostics.map((diagnostic, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(diagnostic.status)}
                        <div className="flex-1">
                          <h3 className="font-semibold">{diagnostic.test}</h3>
                          <p className="text-sm text-muted-foreground">{diagnostic.status}</p>
                        </div>
                      </div>

                      {diagnostic.error && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                          <p className="text-sm text-red-800 font-medium">Error:</p>
                          <p className="text-sm text-red-700">{diagnostic.error}</p>
                        </div>
                      )}

                      {diagnostic.details && typeof diagnostic.details === "object" && (
                        <div className="bg-muted rounded p-3 mt-2">
                          <p className="text-sm font-medium mb-2">Details:</p>
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(diagnostic.details, null, 2)}
                          </pre>
                        </div>
                      )}

                      {diagnostic.details && typeof diagnostic.details === "string" && (
                        <p className="text-sm text-muted-foreground mt-2">{diagnostic.details}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>What This Tests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <h4 className="font-medium">1. Environment Variables</h4>
                  <p className="text-sm text-muted-foreground">
                    Checks if SUPABASE_URL, ANON_KEY, and SERVICE_ROLE_KEY are set
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">2. Admin Client Creation</h4>
                  <p className="text-sm text-muted-foreground">
                    Tests if Supabase admin client can be initialized
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">3. Database Connection</h4>
                  <p className="text-sm text-muted-foreground">
                    Verifies connection to Supabase database
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">4. Auth Admin Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Tests if admin can access user management functions
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">5. Profile Table Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Checks if the profiles table exists and is accessible
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>If all tests pass ✅: The auth system is configured correctly.</p>
                <p>If tests fail ❌: Check the error details above for specific issues.</p>
                <p className="text-muted-foreground mt-4">
                  Common fixes:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Verify .env.local has correct Supabase credentials</li>
                  <li>Check Supabase project is active and accessible</li>
                  <li>Ensure SERVICE_ROLE_KEY has admin permissions</li>
                  <li>Verify profiles table exists in database</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}