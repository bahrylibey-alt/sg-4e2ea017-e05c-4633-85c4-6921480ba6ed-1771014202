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
import { useRouter } from "next/navigation";

interface TestResult {
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'skipped';
  message: string;
  timestamp: string;
}

export default function SupabaseConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: Environment Variables
    await runTest(
      'Environment Variables',
      'Check if NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set',
      async () => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
        if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
        
        return `Environment variables are set correctly\n\nURL: ${url}\nKey Length: ${key.length} characters`;
      }
    );

    // Test 2: Network Connection
    await runTest(
      'Network Connection',
      'Test network connectivity to Supabase servers',
      async () => {
        const startTime = Date.now();
        const { error } = await supabase.auth.getSession();
        const responseTime = Date.now() - startTime;
        
        if (error) throw error;
        
        return `Successfully connected to Supabase\n\nResponse time: ${responseTime}ms`;
      }
    );

    // Test 3: Authentication Service
    await runTest(
      'Authentication Service',
      'Verify Supabase Auth is working',
      async () => {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (data.session) {
          return `Auth service is working\n\nLogged in as: ${data.session.user.email}`;
        } else {
          return `Auth service is working\n\nNot logged in (anonymous access available)`;
        }
      }
    );

    // Test 4: Database Access (only if user is logged in)
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData.session) {
      await runTest(
        'Database Access',
        'Test database query execution',
        async () => {
          const { data, error, count } = await supabase
            .from('affiliate_links')
            .select('id', { count: 'exact', head: true });
          
          if (error) throw error;
          
          return `Database query successful\n\nTable accessible: affiliate_links\nRow count: ${count || 0}`;
        }
      );
    } else {
      // Skip database test if not logged in
      setResults(prev => [...prev, {
        name: 'Database Access',
        description: 'Test database query execution',
        status: 'skipped',
        message: 'Skipped - Please sign in to test database access\n\nDatabase queries require authentication due to Row Level Security (RLS) policies.',
        timestamp: new Date().toISOString()
      }]);
    }

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

            {/* User Status */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <div>
                        <h3 className="font-semibold">Signed In</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-6 w-6 text-yellow-500" />
                      <div>
                        <h3 className="font-semibold">Not Signed In</h3>
                        <p className="text-sm text-muted-foreground">Sign in to test database access</p>
                      </div>
                    </>
                  )}
                </div>
                {!user && (
                  <Button onClick={() => router.push('/')} variant="outline">
                    Go to Sign In
                  </Button>
                )}
              </div>
            </Card>

            {/* Test Controls */}

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
                    {results.find(r => r.name === 'Environment Variables')?.status && getStatusBadge(results.find(r => r.name === 'Environment Variables')?.status)}
                  </CardTitle>
                  <CardDescription>
                    Check if NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.find(r => r.name === 'Environment Variables') ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(results.find(r => r.name === 'Environment Variables')?.status || 'unknown')}
                        <span>{results.find(r => r.name === 'Environment Variables')?.message}</span>
                      </div>
                      {results.find(r => r.name === 'Environment Variables')?.details && (
                        <div className="bg-muted p-3 rounded-lg text-sm font-mono">
                          <div>URL: {results.find(r => r.name === 'Environment Variables')?.details.url}</div>
                          <div>Key Length: {results.find(r => r.name === 'Environment Variables')?.details.keyLength} characters</div>
                        </div>
                      )}
                      {results.find(r => r.name === 'Environment Variables')?.error && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-800 dark:text-red-200">
                          {results.find(r => r.name === 'Environment Variables')?.error}
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
                    {results.find(r => r.name === 'Network Connection')?.status && getStatusBadge(results.find(r => r.name === 'Network Connection')?.status)}
                  </CardTitle>
                  <CardDescription>
                    Test network connectivity to Supabase servers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.find(r => r.name === 'Network Connection') ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(results.find(r => r.name === 'Network Connection')?.status || 'unknown')}
                        <span>{results.find(r => r.name === 'Network Connection')?.message}</span>
                      </div>
                      {results.find(r => r.name === 'Network Connection')?.duration && (
                        <div className="text-sm text-muted-foreground">
                          Response time: {results.find(r => r.name === 'Network Connection')?.duration}ms
                        </div>
                      )}
                      {results.find(r => r.name === 'Network Connection')?.error && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-800 dark:text-red-200">
                          {results.find(r => r.name === 'Network Connection')?.error}
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
                    {results.find(r => r.name === 'Authentication Service')?.status && getStatusBadge(results.find(r => r.name === 'Authentication Service')?.status)}
                  </CardTitle>
                  <CardDescription>
                    Verify Supabase Auth is working
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.find(r => r.name === 'Authentication Service') ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(results.find(r => r.name === 'Authentication Service')?.status || 'unknown')}
                        <span>{results.find(r => r.name === 'Authentication Service')?.message}</span>
                      </div>
                      {results.find(r => r.name === 'Authentication Service')?.user && (
                        <div className="text-sm text-muted-foreground">
                          {results.find(r => r.name === 'Authentication Service')?.user}
                        </div>
                      )}
                      {results.find(r => r.name === 'Authentication Service')?.error && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-800 dark:text-red-200">
                          {results.find(r => r.name === 'Authentication Service')?.error}
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
                    {results.find(r => r.name === 'Database Access')?.status && getStatusBadge(results.find(r => r.name === 'Database Access')?.status)}
                  </CardTitle>
                  <CardDescription>
                    Test database query execution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.find(r => r.name === 'Database Access') ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(results.find(r => r.name === 'Database Access')?.status || 'unknown')}
                        <span>{results.find(r => r.name === 'Database Access')?.message}</span>
                      </div>
                      {results.find(r => r.name === 'Database Access')?.count !== undefined && (
                        <div className="text-sm text-muted-foreground">
                          Found {results.find(r => r.name === 'Database Access')?.count} records in affiliate_links table
                        </div>
                      )}
                      {results.find(r => r.name === 'Database Access')?.error && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-800 dark:text-red-200">
                          {results.find(r => r.name === 'Database Access')?.error}
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
            {results.find(r => r.name === 'Environment Variables')?.status === 'success' && 
             results.find(r => r.name === 'Network Connection')?.status === 'success' && 
             results.find(r => r.name === 'Authentication Service')?.status === 'success' && 
             results.find(r => r.name === 'Database Access')?.status === 'success' ? (
              <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <span className="text-green-700 dark:text-green-300">All Tests Passed!</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-700 dark:text-green-300">
                    Your Supabase connection is working perfectly! You can now use authentication and database features.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-red-500 bg-red-50 dark:bg-red-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-6 w-6 text-red-500" />
                    <span className="text-red-700 dark:text-red-300">Some Tests Failed</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}

            {results.map((result, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {result.status === 'pass' ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : result.status === 'skipped' ? (
                      <AlertCircle className="h-6 w-6 text-yellow-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{result.name}</h3>
                      <p className="text-sm text-muted-foreground">{result.description}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={result.status === 'pass' ? 'default' : result.status === 'skipped' ? 'secondary' : 'destructive'}
                    className="text-sm"
                  >
                    {result.status === 'pass' ? 'PASS' : result.status === 'skipped' ? 'SKIPPED' : 'FAIL'}
                  </Badge>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  result.status === 'pass' 
                    ? 'bg-green-500/10 border border-green-500/20' 
                    : result.status === 'skipped'
                    ? 'bg-yellow-500/10 border border-yellow-500/20'
                    : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  {result.status === 'pass' && (
                    <div className="flex items-start gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <pre className="text-sm font-mono whitespace-pre-wrap break-all">{result.message}</pre>
                    </div>
                  )}
                  {result.status === 'skipped' && (
                    <div className="flex items-start gap-2 text-yellow-700 dark:text-yellow-400">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <pre className="text-sm font-mono whitespace-pre-wrap break-all">{result.message}</pre>
                    </div>
                  )}
                  {result.status === 'fail' && (
                    <div className="flex items-start gap-2 text-red-700 dark:text-red-400">
                      <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <pre className="text-sm font-mono whitespace-pre-wrap break-all">{result.message}</pre>
                    </div>
                  )}
                </div>
              </Card>
            ))}

          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}