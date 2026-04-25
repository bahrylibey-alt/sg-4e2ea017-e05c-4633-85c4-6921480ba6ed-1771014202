import { useState } from "react";
import { X, Mail, Lock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockAuthService } from "@/services/mockAuthService";
import { useRouter } from "next/router";

interface SimplifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SimplifiedAuthModal({ isOpen, onClose, onSuccess }: SimplifiedAuthModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!loginEmail.trim()) {
        setError("Please enter your email");
        setLoading(false);
        return;
      }

      // Use mock auth service - instant login, no email confirmation
      const result = await mockAuthService.signIn(loginEmail.trim(), loginPassword || 'demo123');

      if (result.error || !result.session) {
        setError(result.error?.message || result.error || "Login failed");
        setLoading(false);
        return;
      }

      setSuccess("✅ Login successful! Redirecting...");
      
      // Clear form
      setLoginEmail("");
      setLoginPassword("");
      
      // Wait a moment for user to see success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
        // Redirect to working demo page
        router.push('/working-autopilot-demo');
      }, 1000);

    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login");
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!signupName.trim() || !signupEmail.trim()) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      if (signupPassword.length < 6) {
        setError("Password must be at least 6 characters long");
        setLoading(false);
        return;
      }

      // Use mock auth service - instant signup, no email confirmation
      const result = await mockAuthService.signUp(
        signupEmail.trim(),
        signupPassword
      );

      // Update name after signup
      if (result.session) {
        await mockAuthService.updateProfile({ full_name: signupName.trim() });
      }

      if (result.error || !result.session) {
        setError(result.error?.message || result.error || "Signup failed");
        setLoading(false);
        return;
      }

      setSuccess("✅ Account created successfully! Redirecting...");
      
      // Clear form
      setSignupName("");
      setSignupEmail("");
      setSignupPassword("");
      
      // Wait a moment for user to see success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
        // Redirect to working demo page
        router.push('/working-autopilot-demo');
      }, 1000);

    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "An error occurred during signup");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Welcome to AffiliatePro</h2>
            <p className="text-muted-foreground">
              Sign in or create an account to continue
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
            </div>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

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
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password (optional for demo)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave blank to use demo password
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="pl-10"
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
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="pl-10"
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
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <p className="text-xs text-center text-muted-foreground">
                ✨ No email confirmation required - instant access!
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}