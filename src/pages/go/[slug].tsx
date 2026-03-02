import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ExternalLink, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { smartLinkRouter } from "@/services/smartLinkRouter";

export default function RedirectPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [isSmartRouting, setIsSmartRouting] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!slug || typeof slug !== "string") {
        console.error("❌ Invalid slug:", slug);
        setError("Invalid link - no slug provided");
        setDebugInfo(`Slug type: ${typeof slug}, Value: ${JSON.stringify(slug)}`);
        return;
      }

      console.log("🔗 Smart Link Router: Looking up slug:", slug);
      setIsSmartRouting(true);

      try {
        // Step 1: Smart link lookup (with caching, fuzzy matching, fallback)
        const lookupResult = await smartLinkRouter.findLink(slug);

        if (!lookupResult.found) {
          console.error("❌ Link not found:", slug);
          setError(lookupResult.error || "This affiliate link was not found");
          setDebugInfo(`No link found with slug: ${slug}\nTried: direct lookup, fuzzy matching, inactive links`);
          setIsSmartRouting(false);
          return;
        }

        const link = lookupResult.link;
        console.log("✅ Link found:", {
          id: link.id,
          product_name: link.product_name,
          slug: link.slug,
          clicks: link.click_count
        });

        // Step 2: Gather metadata for smart routing
        const metadata: any = {};
        if (typeof window !== 'undefined') {
          metadata.userAgent = navigator.userAgent || undefined;
          metadata.referrer = document.referrer || undefined;
          metadata.deviceType = /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
          
          // Try to detect country (would need IP geolocation API in production)
          // For now, we'll use browser language as a proxy
          const language = navigator.language || "en-US";
          metadata.country = language.split('-')[1] || "US";
        }

        // Step 3: Get smart destination (A/B testing, geo-routing)
        console.log("🎯 Getting smart destination with A/B testing & geo-routing...");
        const destinationUrl = await smartLinkRouter.getSmartDestination(
          link.id,
          metadata
        ) || link.original_url;

        if (!destinationUrl || destinationUrl.trim() === "") {
          console.error("❌ No destination URL configured");
          setError("This link is not configured properly - missing destination URL");
          setDebugInfo(`Link ID: ${link.id}\nProduct: ${link.product_name}\nDestination URL is empty`);
          setIsSmartRouting(false);
          return;
        }

        // Step 4: Track click with advanced metadata (bot detection, fraud scoring)
        console.log("📊 Tracking click with bot detection & fraud prevention...");
        await smartLinkRouter.trackSmartClick(link.id, link.user_id, metadata);

        // Step 5: Redirect to destination
        console.log("🚀 Smart routing complete. Redirecting to:", destinationUrl);
        window.location.href = destinationUrl;
        
      } catch (error: any) {
        console.error("💥 Smart router error:", error);
        setError("An unexpected error occurred during smart routing");
        setDebugInfo(`Error: ${error.message}\nStack: ${error.stack}`);
        setIsSmartRouting(false);
      }
    };

    handleRedirect();
  }, [slug]);

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