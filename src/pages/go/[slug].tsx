import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ExternalLink, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { smartLinkRouter } from "@/services/smartLinkRouter";
import { affiliateLinkService } from "@/services/affiliateLinkService";

export default function RedirectPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Initializing...");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [isSmartRouting, setIsSmartRouting] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!router.isReady || !slug) {
        console.log("⏳ Router not ready yet or no slug");
        return;
      }

      console.log("🔍 Redirect page loaded for slug:", slug);
      setStatus("Verifying link...");

      try {
        // Get visitor metadata
        const metadata = {
          user_agent: navigator.userAgent,
          referrer: document.referrer,
          device_type: /mobile/i.test(navigator.userAgent) ? "mobile" : "desktop"
        };

        console.log("📱 Visitor metadata:", metadata);
        console.log("🔗 Looking up link in database...");

        // Track click and get redirect URL
        const result = await affiliateLinkService.trackClick(slug as string, metadata);

        console.log("📊 Track click result:", result);

        if (result.success && result.redirect_url) {
          console.log("✅ Link found! Redirecting to:", result.redirect_url);
          setStatus("Redirecting...");
          setRedirectUrl(result.redirect_url);

          // Add small delay to show the loading screen
          await new Promise(resolve => setTimeout(resolve, 800));

          console.log("🚀 Executing redirect now...");
          window.location.href = result.redirect_url;
        } else {
          console.error("❌ Link not found for slug:", slug);
          console.error("❌ Result:", result);
          setError("Link not found or expired");
          setStatus("Error");
        }
      } catch (err: any) {
        console.error("💥 Redirect error:", err);
        console.error("💥 Stack trace:", err.stack);
        setError(err.message || "Failed to process redirect");
        setStatus("Error");
      }
    };

    handleRedirect();
  }, [router.isReady, slug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="max-w-md w-full border-destructive/20 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto animate-pulse" />
              <h1 className="text-2xl font-bold text-foreground">Link Not Found</h1>
              <p className="text-muted-foreground">{error}</p>
              {debugInfo && (
                <details className="text-left text-xs text-muted-foreground bg-muted/50 p-4 rounded-lg border border-border">
                  <summary className="cursor-pointer font-semibold mb-2 hover:text-foreground transition-colors">
                    🔍 Debug Info (click to expand)
                  </summary>
                  <pre className="whitespace-pre-wrap font-mono">{debugInfo}</pre>
                </details>
              )}
              <div className="pt-4">
                <Link href="/dashboard">
                  <Button className="w-full">Go to Dashboard</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
      <Card className="max-w-md w-full border-primary/20 shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
              {isSmartRouting && (
                <Zap className="w-6 h-6 text-yellow-500 absolute top-0 right-1/3 animate-pulse" />
              )}
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Smart Routing Active
              </h1>
              <p className="text-muted-foreground">
                Optimizing your destination with AI-powered routing...
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <span>Bot detection & fraud prevention</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>A/B testing & geo-routing</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
                <span>Real-time analytics tracking</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}