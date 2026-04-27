import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Database, Wifi, Key } from "lucide-react";

export default function SupabaseConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>({
    envVars: null,
    connection: null,
    auth: null,
    database: null
  });

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    setTesting(true);
    const newResults: any = {
      envVars: null,
      connection: null,
      auth: null,
      database: null
    };

    // Test 1: Environment Variables
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        newResults.envVars = {
          status: 'success',
          message: 'Environment variables are set correctly',
          details: {
            url: supabaseUrl,
            keyLength: supabaseKey.length
          }
        };
      } else {
        newResults.envVars = {
          status: 'error',
          message: 'Missing environment variables',
          details: {
            url: supabaseUrl || 'MISSING',
            key: supabaseKey ? 'SET' : 'MISSING'
          }
        };
      }
    } catch (error: any) {
      newResults.envVars = {
        status: 'error',
        message: 'Failed to check environment variables',
        error: error.message
      };
    }

    // Test 2: Connection Test
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.auth.getSession();
      const duration = Date.now() - startTime;
      
      if (error) {
        newResults.connection = {
          status: 'error',
          message: 'Connection failed',
          error: error.message,
          duration
        };
      } else {
        newResults.connection = {
          status: 'success',
          message: 'Successfully connected to Supabase',
          duration,
          hasSession: !!data.session
        };
      }
    } catch (error: any) {
      newResults.connection = {
        status: 'error',
        message: 'Network error - cannot reach Supabase',
        error: error.message
      };
    }

    // Test 3: Auth Service
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error && error.message !== 'Auth session missing!') {
        newResults.auth = {
          status: 'error',
          message: 'Auth service error',
          error: error.message
        };
      } else {
        newResults.auth = {
          status: 'success',
          message: 'Auth service is working',
          user: data.user ? `Logged in as ${data.user.email}` : 'Not logged in'
        };
      }
    } catch (error: any) {
      newResults.auth = {
        status: 'error',
        message: 'Auth service failed',
        error: error.message
      };
    }

    // Test 4: Database Query
    try {
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('id', { count: 'exact', head: true });
      
      if (error) {
        newResults.database = {
          status: 'error',
          message: 'Database query failed',
          error: error.message
        };
      } else {
        newResults.database = {
          status: 'success',
          message: 'Database is accessible',
          count: data || 0
        };
      }
    } catch (error: any) {
      newResults.database = {
        status: 'error',
        message: 'Database connection failed',
        error: error.message
      };
    }

    setResults(newResults);
    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">PASS</Badge>;
      case 'error':
        return <Badge variant="destructive">FAIL</Badge>;
      default:
        return <Badge variant="outline">UNKNOWN</Badge>;
    }
  };

  return (
    <>
      <SEO 
        title="Supabase Connection Test"
        description="Test Supabase connection and diagnose issues"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Database className="h-8 w-8 text-primary" />
                  Supabase Connection Test
                </h1>
                <p className="text-muted-foreground mt-2">
                  Diagnose connection issues and verify Supabase setup
                </p>
              </div>
              <Button onClick={runTests} disabled={testing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Testing...' : 'Retest'}
              </Button>
            </div>

            {/* Environment Setup Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Production Deployment:</strong> If tests fail, you need to set environment variables in Vercel.
                See <code>VERCEL_ENVIRONMENT_SETUP.md</code> for detailed instructions.
              </AlertDescription>
            </Alert>

            {/* Test Results */}
            <div className="grid gap-4">
              
              {/* Test 1: Environment Variables */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Environment Variables
                    </div>
                    {results.envVars && getStatusBadge(results.envVars.status)}
                  </CardTitle>
                  <CardDescription>
                    Check if NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.envVars ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(results.envVars.status)}
                        <span>{results.envVars.message}</span>
                      </div>
                      {results.envVars.details && (
                        <div className="bg-muted p-3 rounded-lg text-sm font-mono">
                          <div>URL: {results.envVars.details.url}</div>
                          <div>Key Length: {results.envVars.details.keyLength} characters</div>
                        </div>
                      )}
                      {results.envVars.error && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-800 dark:text-red-200">
                          {results.envVars.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">Waiting for test...</div>
                  )}
                </CardContent>
              </Card>

              {/* Test 2: Connection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-5 w-5" />
                      Network Connection
                    </div>
                    {results.connection && getStatusBadge(results.connection.status)}
                  </CardTitle>
                  <CardDescription>
                    Test network connectivity to Supabase servers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.connection ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(results.connection.status)}
                        <span>{results.connection.message}</span>
                      </div>
                      {results.connection.duration && (
                        <div className="text-sm text-muted-foreground">
                          Response time: {results.connection.duration}ms
                        </div>
                      )}
                      {results.connection.error && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-800 dark:text-red-200">
                          {results.connection.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">Waiting for test...</div>
                  )}
                </CardContent>
              </Card>

              {/* Test 3: Auth Service */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Authentication Service
                    </div>
                    {results.auth && getStatusBadge(results.auth.status)}
                  </CardTitle>
                  <CardDescription>
                    Verify Supabase Auth is working
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.auth ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(results.auth.status)}
                        <span>{results.auth.message}</span>
                      </div>
                      {results.auth.user && (
                        <div className="text-sm text-muted-foreground">
                          {results.auth.user}
                        </div>
                      )}
                      {results.auth.error && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-800 dark:text-red-200">
                          {results.auth.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">Waiting for test...</div>
                  )}
                </CardContent>
              </Card>

              {/* Test 4: Database */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Database Access
                    </div>
                    {results.database && getStatusBadge(results.database.status)}
                  </CardTitle>
                  <CardDescription>
                    Test database query execution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.database ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(results.database.status)}
                        <span>{results.database.message}</span>
                      </div>
                      {results.database.count !== undefined && (
                        <div className="text-sm text-muted-foreground">
                          Found {results.database.count} records in affiliate_links table
                        </div>
                      )}
                      {results.database.error && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-800 dark:text-red-200">
                          {results.database.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">Waiting for test...</div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Overall Status */}
            {results.envVars && results.connection && results.auth && results.database && (
              <Card className={
                results.envVars.status === 'success' && 
                results.connection.status === 'success' && 
                results.auth.status === 'success' && 
                results.database.status === 'success'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-red-500 bg-red-50 dark:bg-red-900/20'
              }>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {results.envVars.status === 'success' && 
                     results.connection.status === 'success' && 
                     results.auth.status === 'success' && 
                     results.database.status === 'success' ? (
                      <>
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                        <span className="text-green-700 dark:text-green-300">All Tests Passed!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-6 w-6 text-red-500" />
                        <span className="text-red-700 dark:text-red-300">Some Tests Failed</span>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.envVars.status === 'success' && 
                   results.connection.status === 'success' && 
                   results.auth.status === 'success' && 
                   results.database.status === 'success' ? (
                    <p className="text-green-700 dark:text-green-300">
                      Your Supabase connection is working perfectly! You can now use authentication and database features.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-red-700 dark:text-red-300">
                        Some tests failed. Please check the errors above and follow the setup guide.
                      </p>
                      <Button asChild variant="outline">
                        <a href="/VERCEL_ENVIRONMENT_SETUP.md" target="_blank">
                          View Setup Guide
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}