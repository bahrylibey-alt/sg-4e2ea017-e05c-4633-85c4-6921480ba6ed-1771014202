import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ExternalLink } from "lucide-react";
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
  const [status, setStatus] = useState<"loading" | "redirecting" | "error">("loading");
  const [link, setLink] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!slug || typeof slug !== "string") return;

    const trackAndRedirect = async () => {
      try {
        // Get the affiliate link
        const { data: linkData, error } = await supabase
          .from("affiliate_links")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (error || !linkData) {
          setStatus("error");
          return;
        }

        setLink(linkData);
        setStatus("redirecting");

        // Track the click via API
        await fetch("/api/click-tracker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            referrer: document.referrer,
            userAgent: navigator.userAgent
          })
        });

        // Countdown before redirect
        const interval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              // Redirect to affiliate URL
              window.location.href = linkData.original_url;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

      } catch (err) {
        console.error("Redirect error:", err);
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

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The product link you clicked is no longer available.
            </p>
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