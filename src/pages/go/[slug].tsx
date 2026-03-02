import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { affiliateLinkService } from "@/services/affiliateLinkService";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RedirectPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    if (!slug || typeof slug !== "string") return;

    const handleRedirect = async () => {
      try {
        // Get user agent and referrer for tracking
        const metadata = {
          user_agent: window.navigator.userAgent,
          referrer: document.referrer,
          device_type: affiliateLinkService.detectDeviceType(window.navigator.userAgent)
        };

        // Track click and get redirect URL
        const result = await affiliateLinkService.trackClick(slug, metadata);

        if (result.success && result.redirect_url) {
          // Wait a moment for tracking to complete
          setTimeout(() => {
            window.location.href = result.redirect_url!;
          }, 500);
        } else {
          setError("This link is no longer available or has expired.");
          setRedirecting(false);
        }
      } catch (err) {
        console.error("Redirect error:", err);
        setError("An error occurred while processing your request.");
        setRedirecting(false);
      }
    };

    handleRedirect();
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <h1 className="text-2xl font-bold">Link Not Found</h1>
              <p className="text-muted-foreground">{error}</p>
              <div className="pt-4">
                <Link href="/">
                  <Button>Return to Homepage</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Redirecting...</h1>
            <p className="text-muted-foreground">
              Please wait while we redirect you to the product page.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ExternalLink className="w-4 h-4" />
              <span>Taking you to your destination</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}