import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * REAL AFFILIATE LINK REDIRECT PAGE
 * 
 * This page handles all /go/[slug] redirects
 * It tracks the click before redirecting to the affiliate URL
 * 
 * Flow:
 * 1. User clicks product link → lands here
 * 2. We track the click via API
 * 3. Redirect to affiliate network
 * 4. User makes purchase
 * 5. Network sends postback to /api/postback
 * 6. We record the commission
 */

export default function RedirectPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [status, setStatus] = useState<"loading" | "redirecting" | "error" | "paused">("loading");
  const [link, setLink] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!slug || typeof slug !== "string") return;

    const trackAndRedirect = async () => {
      try {
        console.log("🔍 Looking up link:", slug);

        // Get the affiliate link by SLUG
        const { data: linkData, error } = await supabase
          .from("affiliate_links")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (error) {
          console.error("Database error:", error);
          setErrorMessage(`Database error: ${error.message}`);
          setStatus("error");
          return;
        }

        if (!linkData) {
          console.error("Link not found:", slug);
          setErrorMessage("This link doesn't exist in our database");
          setStatus("error");
          return;
        }

        console.log("✅ Found link:", {
          product: linkData.product_name,
          network: linkData.network,
          status: linkData.status,
          url: linkData.original_url
        });

        // Check if link is paused
        if (linkData.status === "paused") {
          setLink(linkData);
          setErrorMessage("This link is currently paused");
          setStatus("paused");
          return;
        }

        setLink(linkData);
        setStatus("redirecting");

        // Track the click via API (don't wait for it)
        fetch("/api/click-tracker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            referrer: document.referrer,
            userAgent: navigator.userAgent
          })
        }).catch(err => console.error("Click tracking failed:", err));

        // Countdown before redirect
        const interval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              
              // CRITICAL: Direct redirect to original URL
              console.log("🚀 Redirecting to:", linkData.original_url);
              window.location.href = linkData.original_url;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

      } catch (err: any) {
        console.error("Redirect error:", err);
        setErrorMessage(err.message || "Unknown error occurred");
        setStatus("error");
      }
    };

    trackAndRedirect();
  }, [slug]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
            <h2 className="text-xl font-semibold mb-2">Loading product...</h2>
            <p className="text-muted-foreground">Please wait</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "paused") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-semibold mb-2">Link Paused</h2>
            {link && (
              <div className="mb-4">
                <p className="font-medium text-lg">{link.product_name}</p>
                <p className="text-sm text-muted-foreground">{link.network}</p>
              </div>
            )}
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
              {link && (
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = link.original_url}
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit Product Anyway
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Link Error</h2>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            <Button onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold mb-2">Redirecting to Product</h2>
          {link && (
            <div className="mb-4">
              <p className="font-medium text-lg">{link.product_name}</p>
              <p className="text-sm text-muted-foreground">{link.network}</p>
            </div>
          )}
          <div className="text-4xl font-bold text-purple-600 mb-4">{countdown}</div>
          <p className="text-muted-foreground mb-4">
            You will be redirected in {countdown} second{countdown !== 1 ? "s" : ""}...
          </p>
          {link && (
            <Button 
              onClick={() => window.location.href = link.original_url}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Go Now
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}