import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { authService } from "@/services/authService";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "signup";
  onSuccess?: () => void;
}

export function AuthModal({ open, onOpenChange, defaultTab = "login", onSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showTestResults, setShowTestResults] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resetForm = () => {
    setLoginEmail("");
    setLoginPassword("");
    setSignupEmail("");
    setSignupPassword("");
    setSignupName("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
    setLoading(false);
    setTestResults([]);
    setShowTestResults(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
  };

  const handleDirectLogin = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/complete-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, action: "login" })
      });

      const data = await response.json();
      setTestResults(data.results || []);

      if (!data.success) {
        setError(data.error || "Login failed");
        setShowTestResults(true);
        return false;
      }

      // Store user in localStorage for session persistence
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("authenticated", "true");
      }

      return true;
    } catch (err) {
      console.error("Direct login error:", err);
      setError("Login failed. Please try again.");
      return false;
    }
  };

  const handleDirectSignup = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch("/api/auth/complete-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, action: "signup" })
      });

      const data = await response.json();
      setTestResults(data.results || []);

      if (!data.success) {
        setError(data.error || "Signup failed");
        setShowTestResults(true);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Direct signup error:", err);
      setError("Signup failed. Please try again.");
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowTestResults(false);

    try {
      if (!loginEmail.trim() || !loginPassword.trim()) {
        setError("Please enter both email and password");
        setLoading(false);
        return;
      }

      // Try Supabase login first
      const result = await authService.signIn(loginEmail.trim(), loginPassword);

      if (result.error) {
        // If Supabase fails, try direct login
        console.log("Supabase login failed, trying direct login...");
        const directSuccess = await handleDirectLogin(loginEmail.trim(), loginPassword);
        
        if (!directSuccess) {
          setLoading(false);
          return;
        }

        setSuccess("Login successful! Redirecting...");
        
        if (onSuccess) {
          onSuccess();
        }

        setTimeout(() => {
          handleClose();
          window.location.reload();
        }, 1500);
        return;
      }

      // Supabase login succeeded
      localStorage.setItem("authenticated", "true");
      setSuccess("Login successful! Redirecting...");
      
      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        handleClose();
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please check your credentials and try again.");
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowTestResults(false);

    try {
      if (!signupEmail.trim() || !signupPassword.trim() || !signupName.trim()) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      if (signupPassword !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      if (signupPassword.length < 6) {
        setError("Password must be at least 6 characters long");
        setLoading(false);
        return;
      }

      // Try Supabase signup first
      const result = await authService.signUp(
        signupEmail.trim(),
        signupPassword,
        { full_name: signupName.trim() }
      );

      if (result.error) {
        // If Supabase fails, try direct signup
        console.log("Supabase signup failed, trying direct signup...");
        const directSuccess = await handleDirectSignup(
          signupEmail.trim(),
          signupPassword,
          signupName.trim()
        );
        
        if (!directSuccess) {
          setLoading(false);
          return;
        }

        setSuccess("Account created successfully! You can now log in.");
        
        setTimeout(() => {
          setActiveTab("login");
          setLoginEmail(signupEmail);
          setSuccess(null);
          setSignupEmail("");
          setSignupPassword("");
          setSignupName("");
          setConfirmPassword("");
          setLoading(false);
        }, 2000);
        return;
      }

      // Supabase signup succeeded
      setSuccess("Account created! Please check your email to verify your account before signing in.");
      
      setTimeout(() => {
        setActiveTab("login");
        setSuccess(null);
        setSignupEmail("");
        setSignupPassword("");
        setSignupName("");
        setConfirmPassword("");
        setLoading(false);
      }, 3000);
    } catch (err) {
      console.error("Signup error:", err);
      setError("Signup failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Welcome to AffiliatePro</DialogTitle>
          <DialogDescription className="text-center">
            Sign in to access your dashboard and campaigns
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Test Results */}
          {showTestResults && testResults.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Diagnostic Results:</h4>
              {testResults.map((result, index) => (
                <div key={index} className="text-xs">
                  <span className="font-medium">{result.test}:</span> {result.status}
                  {result.details && <div className="text-muted-foreground ml-4">{result.details}</div>}
                  {result.error && <div className="text-destructive ml-4">{result.error}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("signup")}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </div>
            </form>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground">At least 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}