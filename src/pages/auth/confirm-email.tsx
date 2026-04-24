import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ConfirmEmail() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check if there's a hash in the URL (email confirmation token)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (type === "signup" && accessToken && refreshToken) {
          // Set the session with the tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            setStatus("error");
            setMessage(error.message);
            return;
          }

          setStatus("success");
          setMessage("Email confirmed successfully! Redirecting to dashboard...");
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        } else {
          // No confirmation token found
          setStatus("error");
          setMessage("Invalid confirmation link. Please check your email and try again.");
        }
      } catch (error) {
        console.error("Email confirmation error:", error);
        setStatus("error");
        setMessage("Failed to confirm email. Please try again.");
      }
    };

    handleEmailConfirmation();
  }, [router]);

  return (
    <>
      <SEO
        title="Confirm Email - AffiliatePro"
        description="Confirm your email address"
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                  {status === "loading" && (
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  )}
                  {status === "success" && (
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  )}
                  {status === "error" && (
                    <XCircle className="h-12 w-12 text-red-600" />
                  )}
                </div>
                <CardTitle>
                  {status === "loading" && "Confirming Email..."}
                  {status === "success" && "Email Confirmed!"}
                  {status === "error" && "Confirmation Failed"}
                </CardTitle>
                <CardDescription>
                  {status === "loading" && "Please wait while we confirm your email address"}
                  {status === "success" && message}
                  {status === "error" && message}
                </CardDescription>
              </CardHeader>

              {status === "error" && (
                <CardContent className="space-y-4">
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Please check your email inbox for the confirmation link. 
                      Don't forget to check your spam folder.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push("/")}
                    >
                      Go Home
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => router.push("/dashboard")}
                    >
                      Try Dashboard
                    </Button>
                  </div>
                </CardContent>
              )}

              {status === "success" && (
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => router.push("/dashboard")}
                  >
                    Go to Dashboard
                  </Button>
                </CardContent>
              )}
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}