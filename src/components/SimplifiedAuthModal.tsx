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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SimplifiedAuthModal({ open, onOpenChange }: SimplifiedAuthModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
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

  if (!open) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Add timeout to prevent infinite loading
      const loginTimeout = setTimeout(() => {
        setLoading(false);
        setError("Login timeout - please try again");
      }, 15000); // 15 second timeout

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      clearTimeout(loginTimeout);

      if (signInError) throw signInError;

      if (data.user) {
        console.log("✅ Sign in successful:", data.user.email);
        
        try {
          // Load user settings from Supabase (including OpenAI API key)
          const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', data.user.id)
            .maybeSingle();

          if (!settingsError && settings) {
            console.log("✅ Loaded user settings from Supabase");
            
            // Save API key to localStorage for this device
            if (settings.openai_api_key) {
              localStorage.setItem('openai_api_key', settings.openai_api_key);
              console.log("✅ API key synced to this device");
            }
            
            // Save other settings if needed
            if (settings.autopilot_settings) {
              localStorage.setItem('autopilot_settings', JSON.stringify(settings.autopilot_settings));
            }
          } else {
            console.log("ℹ️ No existing settings found - new user or first sign in");
          }
        } catch (settingsErr) {
          console.warn("Settings load failed, continuing anyway:", settingsErr);
          // Don't block login if settings fail to load
        }

        // Success toast
        toast({
          title: "Welcome back!",
          description: "Signed in successfully",
        });

        // Force close modal FIRST
        setLoading(false);
        onOpenChange(false);
        
        // Small delay to ensure modal closes before redirect
        setTimeout(() => {
          console.log("🔄 Redirecting to autopilot-center...");
          router.push('/autopilot-center');
        }, 300);
      }
    } catch (err: any) {
      console.error("❌ Sign in error:", err);
      setError(err.message || "Failed to sign in");
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Add timeout to prevent infinite loading
      const signupTimeout = setTimeout(() => {
        setLoading(false);
        setError("Signup timeout - please try again");
      }, 15000); // 15 second timeout

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: signupName,
          },
        },
      });

      clearTimeout(signupTimeout);

      if (signUpError) throw signUpError;

      if (data.user) {
        console.log("✅ Account created:", data.user.email);

        toast({
          title: "Account created!",
          description: "Welcome to AffiliatePro",
        });

        // Force close modal FIRST
        setLoading(false);
        onOpenChange(false);
        
        // Small delay before redirect
        setTimeout(() => {
          console.log("🔄 Redirecting to settings...");
          router.push('/settings?tab=api-keys');
        }, 300);
      }
    } catch (err: any) {
      console.error("❌ Sign up error:", err);
      setError(err.message || "Failed to create account");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md relative">
        <button
          onClick={() => onOpenChange(false)}
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