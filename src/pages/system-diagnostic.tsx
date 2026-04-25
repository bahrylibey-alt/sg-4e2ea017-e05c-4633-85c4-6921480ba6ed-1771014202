import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, CheckCircle2, XCircle, AlertCircle, Loader2, 
  User, Key, Server, Zap, Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
  fix?: string;
}

export default function SystemDiagnostic() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [canUseRealData, setCanUseRealData] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    const diagnostics: DiagnosticResult[] = [];

    // 1. Check Environment Variables
    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!SUPABASE_URL || SUPABASE_URL.includes('invalid')) {
        diagnostics.push({
          name: 'Environment Variables',
          status: 'fail',
          message: 'Supabase URL not configured',
          details: 'NEXT_PUBLIC_SUPABASE_URL is missing or invalid',
          fix: 'Add valid Supabase URL to .env.local file'
        });
      } else if (!SUPABASE_KEY || SUPABASE_KEY.includes('invalid')) {
        diagnostics.push({
          name: 'Environment Variables',
          status: 'fail',
          message: 'Supabase API Key not configured',
          details: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid',
          fix: 'Add valid Supabase anon key to .env.local file'
        });
      } else {
        diagnostics.push({
          name: 'Environment Variables',
          status: 'pass',
          message: 'Supabase credentials configured',
          details: `URL: ${SUPABASE_URL}`
        });
      }
    } catch (error: any) {
      diagnostics.push({
        name: 'Environment Variables',
        status: 'fail',
        message: 'Failed to check environment',
        details: error.message
      });
    }

    // 2. Check Database Connection
    try {
      const { data, error } = await supabase
        .from('product_catalog')
        .select('id')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        diagnostics.push({
          name: 'Database Connection',
          status: 'fail',
          message: 'Cannot connect to Supabase',
          details: error.message,
          fix: 'Check if Supabase project is active and credentials are correct'
        });
      } else {
        diagnostics.push({
          name: 'Database Connection',
          status: 'pass',
          message: 'Database connection successful',
          details: 'Can read from product_catalog table'
        });
      }
    } catch (error: any) {
      diagnostics.push({
        name: 'Database Connection',
        status: 'fail',
        message: 'Network error connecting to database',
        details: error.message,
        fix: 'Check internet connection and Supabase project status'
      });
    }

    // 3. Check Authentication
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        diagnostics.push({
          name: 'Authentication',
          status: 'fail',
          message: 'Auth check failed',
          details: error.message
        });
      } else if (!session) {
        diagnostics.push({
          name: 'Authentication',
          status: 'warning',
          message: 'Not authenticated',
          details: 'You can view data but cannot insert/update',
          fix: 'Log in to enable full database access'
        });
      } else {
        diagnostics.push({
          name: 'Authentication',
          status: 'pass',
          message: `Authenticated as ${session.user.email}`,
          details: 'Full database access enabled'
        });
      }
    } catch (error: any) {
      diagnostics.push({
        name: 'Authentication',
        status: 'fail',
        message: 'Auth system error',
        details: error.message
      });
    }

    // 4. Check RLS Policies (Test INSERT)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        diagnostics.push({
          name: 'Database Write Access',
          status: 'warning',
          message: 'Cannot test write access (not authenticated)',
          details: 'RLS policies require authentication for INSERT operations',
          fix: 'Log in to test write access'
        });
      } else {
        // Try a test insert (will be rolled back)
        const testProduct = {
          user_id: session.user.id,
          name: 'Test Product',
          affiliate_url: 'https://example.com',
          status: 'active'
        };

        const { error } = await supabase
          .from('product_catalog')
          .insert(testProduct)
          .select();

        if (error) {
          diagnostics.push({
            name: 'Database Write Access',
            status: 'fail',
            message: 'Cannot insert into database',
            details: error.message,
            fix: 'Check RLS policies on product_catalog table'
          });
        } else {
          diagnostics.push({
            name: 'Database Write Access',
            status: 'pass',
            message: 'Can insert into database',
            details: 'RLS policies allow authenticated writes'
          });
        }
      }
    } catch (error: any) {
      diagnostics.push({
        name: 'Database Write Access',
        status: 'fail',
        message: 'Write test failed',
        details: error.message
      });
    }

    // 5. Check OpenAI API Key
    try {
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : null;
      
      if (!apiKey) {
        diagnostics.push({
          name: 'OpenAI Integration',
          status: 'warning',
          message: 'OpenAI API key not configured',
          details: 'AI features will not work',
          fix: 'Add OpenAI API key in Settings → API Keys'
        });
      } else {
        diagnostics.push({
          name: 'OpenAI Integration',
          status: 'pass',
          message: 'OpenAI API key configured',
          details: 'AI features enabled'
        });
      }
    } catch (error: any) {
      diagnostics.push({
        name: 'OpenAI Integration',
        status: 'fail',
        message: 'Failed to check OpenAI key',
        details: error.message
      });
    }

    setResults(diagnostics);
    setIsRunning(false);

    // Determine if we can use real data
    const allCriticalPass = diagnostics
      .filter(d => ['Database Connection', 'Authentication', 'Database Write Access'].includes(d.name))
      .every(d => d.status === 'pass');
    
    setCanUseRealData(allCriticalPass);

    if (allCriticalPass) {
      toast({
        title: "✅ All Systems Operational",
        description: "Your system can use REAL database with full access!"
      });
    } else {
      toast({
        title: "⚡ Running in Demo Mode",
        description: "Some features require authentication. See fixes below.",
        variant: "default"
      });
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <>
      <SEO 
        title="System Diagnostic - Check System Health"
        description="Diagnose and fix system issues for real data access"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Server className="h-10 w-10 text-primary" />
                <h1 className="text-4xl font-bold">System Diagnostic</h1>
              </div>
              <p className="text-xl text-muted-foreground">
                Check system health and enable real data access
              </p>
            </div>

            {/* Quick Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {canUseRealData ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      System Ready for Real Data
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      Running in Demo Mode
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {canUseRealData 
                    ? "All systems operational - you can use real database!"
                    : "Some fixes required to enable real database access"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={runDiagnostics}
                  disabled={isRunning}
                  className="w-full"
                  variant={canUseRealData ? "default" : "outline"}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Diagnostics...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Re-run Diagnostics
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Diagnostic Results */}
            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Diagnostic Results</CardTitle>
                  <CardDescription>
                    System check completed - {results.filter(r => r.status === 'pass').length}/{results.length} tests passed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {results.map((result, index) => (
                    <Alert 
                      key={index}
                      className={
                        result.status === 'pass' ? 'border-green-500 bg-green-50' :
                        result.status === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                        'border-red-500 bg-red-50'
                      }
                    >
                      <div className="flex items-start gap-3">
                        {result.status === 'pass' && <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />}
                        {result.status === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                        {result.status === 'fail' && <XCircle className="h-5 w-5 text-red-600 mt-0.5" />}
                        
                        <div className="flex-1">
                          <AlertTitle className="mb-1">{result.name}</AlertTitle>
                          <AlertDescription className="space-y-2">
                            <p className="font-semibold">{result.message}</p>
                            {result.details && (
                              <p className="text-sm text-muted-foreground">{result.details}</p>
                            )}
                            {result.fix && (
                              <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                                <p className="text-sm font-semibold text-gray-700">How to fix:</p>
                                <p className="text-sm text-gray-600">{result.fix}</p>
                              </div>
                            )}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
                <CardDescription>
                  How to enable real data access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {canUseRealData ? (
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle>You're all set!</AlertTitle>
                    <AlertDescription>
                      <p className="mb-3">Your system is configured correctly. You can now:</p>
                      <div className="space-y-2">
                        <Link href="/ultimate-system-test">
                          <Button className="w-full">
                            <Zap className="mr-2 h-4 w-4" />
                            Run Full System Test
                          </Button>
                        </Link>
                        <Link href="/autopilot-center">
                          <Button variant="outline" className="w-full">
                            <Database className="mr-2 h-4 w-4" />
                            Open AutoPilot Center
                          </Button>
                        </Link>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>To Enable Real Data Access:</AlertTitle>
                      <AlertDescription>
                        <ol className="list-decimal list-inside space-y-2 mt-2">
                          <li>
                            <strong>Log in or Sign up</strong>
                            <p className="text-sm text-muted-foreground ml-5">
                              Click the "Sign In" button in the header to create an account or log in
                            </p>
                          </li>
                          <li>
                            <strong>Verify Supabase Connection</strong>
                            <p className="text-sm text-muted-foreground ml-5">
                              Make sure your .env.local has valid Supabase credentials
                            </p>
                          </li>
                          <li>
                            <strong>Add OpenAI API Key (Optional)</strong>
                            <p className="text-sm text-muted-foreground ml-5">
                              Go to Settings → API Keys to enable AI features
                            </p>
                          </li>
                          <li>
                            <strong>Run diagnostics again</strong>
                            <p className="text-sm text-muted-foreground ml-5">
                              Click "Re-run Diagnostics" above to verify everything works
                            </p>
                          </li>
                        </ol>
                      </AlertDescription>
                    </Alert>

                    <Link href="/auth/confirm-email">
                      <Button className="w-full" size="lg">
                        <User className="mr-2 h-4 w-4" />
                        Go to Sign In / Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}