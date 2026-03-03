import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ExternalLink, AlertCircle, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { affiliateLinkService } from "@/services/affiliateLinkService";

export default function RedirectPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Initializing...");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [linkDetails, setLinkDetails] = useState<any>(null);

  // Helper to add debug info
  const addDebug = (message: string) => {
    console.log(`🔍 ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const handleRedirect = async () => {
      if (!router.isReady || !slug) {
        addDebug("⏳ Waiting for router to be ready...");
        return;
      }

      addDebug(`🚀 Starting redirect for slug: ${slug}`);
      setStatus("Looking up affiliate link...");

      try {
        // Step 1: Get visitor metadata
        const metadata = {
          user_agent: navigator.userAgent,
          referrer: document.referrer || "Direct",
          device_type: /mobile/i.test(navigator.userAgent) ? "mobile" : "desktop"
        };

        addDebug(`📱 Device: ${metadata.device_type}`);
        addDebug(`🔗 Referrer: ${metadata.referrer}`);

        // Step 2: Track click and get redirect URL
        setStatus("Tracking click...");
        addDebug("📊 Calling trackClick service...");
        
        const result = await affiliateLinkService.trackClick(slug as string, metadata);

        addDebug(`✅ trackClick result: ${JSON.stringify(result)}`);

        // Step 3: Validate result
        if (!result.success) {
          addDebug("❌ trackClick returned success=false");
          throw new Error("Link not found or inactive");
        }

        if (!result.redirect_url) {
          addDebug("❌ No redirect_url in result");
          throw new Error("No destination URL found");
        }

        // Step 4: Validate destination URL
        addDebug(`🎯 Destination URL: ${result.redirect_url}`);
        
        try {
          const urlTest = new URL(result.redirect_url);
          addDebug(`✅ URL is valid: ${urlTest.hostname}`);
          
          // Check for common invalid patterns
          const invalidPatterns = [
            "example.com",
            "placeholder",
            "test.com",
            "localhost",
            "salemakseb.com" // Don't redirect to ourselves
          ];
          
          const isInvalid = invalidPatterns.some(pattern => 
            result.redirect_url!.toLowerCase().includes(pattern)
          );
          
          if (isInvalid) {
            addDebug(`❌ Invalid URL pattern detected: ${result.redirect_url}`);
            throw new Error("This affiliate link has an invalid destination URL");
          }
        } catch (urlError) {
          addDebug(`❌ URL validation failed: ${urlError}`);
          throw new Error("Invalid destination URL format");
        }

        // Step 5: Set redirect URL and prepare to redirect
        setRedirectUrl(result.redirect_url);
        setStatus("Click tracked! Redirecting...");
        addDebug("✅ Click tracked successfully");
        addDebug(`🚀 Redirecting to: ${result.redirect_url}`);

        // Step 6: Wait a moment to show the loading screen, then redirect
        await new Promise(resolve => setTimeout(resolve, 1000));

        addDebug("🎯 Executing redirect NOW...");
        window.location.href = result.redirect_url;

      } catch (err: any) {
        console.error("💥 Redirect error:", err);
        addDebug(`💥 ERROR: ${err.message}`);
        addDebug(`💥 Stack: ${err.stack}`);
        
        setError(err.message || "Failed to process redirect");
        setStatus("Error");
      }
    };

    handleRedirect();
  }, [router.isReady, slug]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
        <Card className="max-w-md w-full border-destructive/20 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto animate-pulse" />
              <h1 className="text-2xl font-bold text-foreground">Link Error</h1>
              <p className="text-muted-foreground">{error}</p>
              
              <div className="bg-muted/50 p-4 rounded-lg border border-border text-left">
                <p className="text-sm font-semibold mb-2">Possible causes:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• The affiliate link has expired or been deactivated</li>
                  <li>• The destination URL is invalid or no longer exists</li>
                  <li>• The product has been removed from the affiliate network</li>
                </ul>
              </div>

              {debugInfo.length > 0 && (
                <details className="text-left text-xs text-muted-foreground bg-muted/50 p-4 rounded-lg border border-border">
                  <summary className="cursor-pointer font-semibold mb-2 hover:text-foreground transition-colors">
                    🔍 Debug Log (click to expand)
                  </summary>
                  <div className="space-y-1 font-mono max-h-60 overflow-y-auto">
                    {debugInfo.map((info, i) => (
                      <div key={i}>{info}</div>
                    ))}
                  </div>
                </details>
              )}

              <div className="pt-4 space-y-2">
                <Link href="/dashboard">
                  <Button className="w-full">Go to Dashboard</Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
      <Card className="max-w-md w-full border-primary/20 shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
              <Zap className="w-6 h-6 text-yellow-500 absolute top-0 right-1/3 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Smart Affiliate Link
              </h1>
              <p className="text-muted-foreground">
                {status}
              </p>
            </div>

            {redirectUrl && (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Click tracked successfully!</span>
              </div>
            )}

            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <span>Click tracking & analytics</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Commission calculation</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
                <span>Real-time monitoring</span>
              </div>
            </div>

            {debugInfo.length > 0 && (
              <details className="text-left text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border">
                <summary className="cursor-pointer font-semibold mb-2">
                  Activity Log
                </summary>
                <div className="space-y-1 font-mono max-h-40 overflow-y-auto">
                  {debugInfo.slice(-5).map((info, i) => (
                    <div key={i}>{info}</div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}