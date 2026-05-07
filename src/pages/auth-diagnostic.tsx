import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw } from "lucide-react";

export default function AuthDiagnostic() {
  const [status, setStatus] = useState<any>({
    supabase: { status: "checking", message: "Checking connection..." },
    auth: { status: "checking", message: "Checking auth service..." },
    database: { status: "checking", message: "Checking database..." }
  });

  const [testEmail, setTestEmail] = useState("test@example.com");
  const [testPassword, setTestPassword] = useState("test123");
  const [loginResult, setLoginResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    console.log("🔍 Starting diagnostics...");
    
    // Test 1: Supabase Client
    try {
      const url = supabase.supabaseUrl;
      setStatus((prev: any) => ({
        ...prev,
        supabase: { 
          status: "success", 
          message: `Connected to: ${url}` 
        }
      }));
      console.log("✅ Supabase client OK");
    } catch (err: any) {
      setStatus((prev: any) => ({
        ...prev,
        supabase: { 
          status: "error", 
          message: `Error: ${err.message}` 
        }
      }));
      console.error("❌ Supabase client error:", err);
    }

    // Test 2: Auth Service
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      setStatus((prev: any) => ({
        ...prev,
        auth: { 
          status: "success", 
          message: session ? `Logged in as: ${session.user.email}` : "Auth service OK (not logged in)" 
        }
      }));
      
      setCurrentUser(session?.user || null);
      console.log("✅ Auth service OK", session);
    } catch (err: any) {
      setStatus((prev: any) => ({
        ...prev,
        auth: { 
          status: "error", 
          message: `Error: ${err.message}` 
        }
      }));
      console.error("❌ Auth service error:", err);
    }

    // Test 3: Database Query
    try {
      const { data, error } = await supabase
        .from('products')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      setStatus((prev: any) => ({
        ...prev,
        database: { 
          status: "success", 
          message: "Database queries working" 
        }
      }));
      console.log("✅ Database OK");
    } catch (err: any) {
      setStatus((prev: any) => ({
        ...prev,
        database: { 
          status: "error", 
          message: `Error: ${err.message}` 
        }
      }));
      console.error("❌ Database error:", err);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setLoginResult(null);
    
    try {
      console.log("🔐 Testing login with:", testEmail);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      console.log("Login result:", { data, error });

      if (error) {
        setLoginResult({
          success: false,
          message: error.message,
          details: error
        });
        console.error("❌ Login failed:", error);
      } else {
        setLoginResult({
          success: true,
          message: `Successfully logged in as ${data.user?.email}`,
          user: data.user
        });
        setCurrentUser(data.user);
        console.log("✅ Login successful:", data.user);
        
        // Refresh diagnostics after login
        setTimeout(runDiagnostics, 1000);
      }
    } catch (err: any) {
      setLoginResult({
        success: false,
        message: `Exception: ${err.message}`,
        details: err
      });
      console.error("❌ Login exception:", err);
    } finally {
      setLoading(false);
    }
  };

  const testSignup = async () => {
    setLoading(true);
    setLoginResult(null);
    
    try {
      console.log("📝 Testing signup with:", testEmail);
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      console.log("Signup result:", { data, error });

      if (error) {
        setLoginResult({
          success: false,
          message: error.message,
          details: error
        });
        console.error("❌ Signup failed:", error);
      } else {
        setLoginResult({
          success: true,
          message: `Successfully created account for ${data.user?.email}`,
          user: data.user
        });
        setCurrentUser(data.user);
        console.log("✅ Signup successful:", data.user);
        
        // Refresh diagnostics after signup
        setTimeout(runDiagnostics, 1000);
      }
    } catch (err: any) {
      setLoginResult({
        success: false,
        message: `Exception: ${err.message}`,
        details: err
      });
      console.error("❌ Signup exception:", err);
    } finally {
      setLoading(false);
    }
  };

  const testLogout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setLoginResult({
        success: true,
        message: "Successfully logged out"
      });
      setTimeout(runDiagnostics, 1000);
    } catch (err: any) {
      setLoginResult({
        success: false,
        message: `Logout failed: ${err.message}`
      });
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "checking") return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    if (status === "success") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">🔍 Authentication Diagnostic</h1>
          <p className="text-muted-foreground">
            Testing Supabase connection and authentication
          </p>
        </div>

        {/* Current User Status */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Current Status
          </h2>
          {currentUser ? (
            <div className="space-y-2">
              <Badge className="text-base">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Logged In
              </Badge>
              <div className="text-sm">
                <strong>Email:</strong> {currentUser.email}
              </div>
              <div className="text-sm">
                <strong>User ID:</strong> {currentUser.id}
              </div>
              <Button onClick={testLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          ) : (
            <div>
              <Badge variant="secondary" className="text-base">
                <XCircle className="h-4 w-4 mr-2" />
                Not Logged In
              </Badge>
            </div>
          )}
        </Card>

        {/* System Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">System Status</h2>
            <Button onClick={runDiagnostics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="space-y-4">
            {Object.entries(status).map(([key, value]: [string, any]) => (
              <div key={key} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <StatusIcon status={value.status} />
                <div className="flex-1">
                  <div className="font-semibold capitalize">{key}</div>
                  <div className="text-sm text-muted-foreground">{value.message}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Test Login */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Test Authentication</h2>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="test123"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={testLogin} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Login"
                )}
              </Button>
              <Button onClick={testSignup} disabled={loading} variant="outline">
                Test Signup
              </Button>
            </div>

            {loginResult && (
              <div className={`p-4 rounded-lg ${loginResult.success ? "bg-green-50 dark:bg-green-900/20 border border-green-200" : "bg-red-50 dark:bg-red-900/20 border border-red-200"}`}>
                <div className="font-semibold mb-2">
                  {loginResult.success ? "✅ Success" : "❌ Failed"}
                </div>
                <div className="text-sm">{loginResult.message}</div>
                {loginResult.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">Show Details</summary>
                    <pre className="text-xs mt-2 overflow-auto">
                      {JSON.stringify(loginResult.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Environment Info */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Environment Info</h2>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Supabase URL:</strong> {supabase.supabaseUrl}
            </div>
            <div>
              <strong>Has Anon Key:</strong> {supabase.supabaseKey ? "✅ Yes" : "❌ No"}
            </div>
            <div>
              <strong>Browser:</strong> {typeof window !== "undefined" ? navigator.userAgent : "Server"}
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <h2 className="text-xl font-bold mb-4">📋 How to Use This Page</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Check if all system statuses show ✅ green checkmarks</li>
            <li>Try logging in with the test credentials above</li>
            <li>If login fails, read the error message carefully</li>
            <li>Open your browser's console (F12) to see detailed logs</li>
            <li>If all tests pass, try logging in from the main page</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}