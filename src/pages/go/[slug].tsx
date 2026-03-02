import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";

export default function RedirectPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    const handleRedirect = async () => {
      if (!slug || typeof slug !== "string") {
        console.error("❌ Invalid slug:", slug);
        setError("Invalid link - no slug provided");
        setDebugInfo(`Slug type: ${typeof slug}, Value: ${JSON.stringify(slug)}`);
        return;
      }

      console.log("🔗 Looking up affiliate link for slug:", slug);

      try {
        // Step 1: Look up the affiliate link by slug
        const { data: link, error: linkError } = await supabase
          .from("affiliate_links")
          .select("*")
          .eq("slug", slug)
          .eq("status", "active")
          .maybeSingle();

        if (linkError) {
          console.error("❌ Database query error:", linkError);
          setError("Database error while looking up link");
          setDebugInfo(`Error: ${linkError.message}\nCode: ${linkError.code}`);
          return;
        }

        if (!link) {
          console.error("❌ Link not found for slug:", slug);
          
          // Debug: Check if link exists with different status
          const { data: anyLink } = await supabase
            .from("affiliate_links")
            .select("slug, status")
            .eq("slug", slug)
            .maybeSingle();
          
          if (anyLink) {
            setError(`This link is ${anyLink.status} and cannot be used`);
            setDebugInfo(`Slug found but status is: ${anyLink.status}`);
          } else {
            setError("This affiliate link was not found");
            setDebugInfo(`No link found with slug: ${slug}\nPlease check if the link was created correctly.`);
          }
          return;
        }

        console.log("✅ Link found:", {
          id: link.id,
          product_name: link.product_name,
          original_url: link.original_url,
          clicks: link.clicks,
          click_count: link.click_count
        });

        // Step 2: Validate destination URL
        if (!link.original_url || link.original_url.trim() === "") {
          console.error("❌ Link has no destination URL:", link);
          setError("This link is not configured properly - missing destination URL");
          setDebugInfo(`Link ID: ${link.id}\nProduct: ${link.product_name}\nDestination URL is empty or null`);
          return;
        }

        // Step 3: Track the click in click_events table
        const clickData: any = {
          link_id: link.id,
          user_id: link.user_id,
          clicked_at: new Date().toISOString()
        };

        // Add browser metadata if available
        if (typeof window !== 'undefined') {
          clickData.referrer = document.referrer || null;
          clickData.user_agent = navigator.userAgent || null;
          clickData.device_type = /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
        }

        console.log("📊 Recording click event...");
        const { error: clickError } = await supabase
          .from("click_events")
          .insert(clickData);

        if (clickError) {
          console.error("⚠️  Failed to track click (non-blocking):", clickError);
          // Don't block redirect if tracking fails
        } else {
          console.log("✅ Click tracked successfully");
        }

        // Step 4: Update click counters on the link (both fields for compatibility)
        console.log("📈 Updating click counters...");
        const { error: updateError } = await supabase
          .from("affiliate_links")
          .update({ 
            click_count: (link.click_count || 0) + 1,
            clicks: (link.clicks || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq("id", link.id);

        if (updateError) {
          console.error("⚠️  Failed to update click count (non-blocking):", updateError);
        } else {
          console.log("✅ Click count updated");
        }

        // Step 5: Redirect to the destination
        console.log("🚀 Redirecting to:", link.original_url);
        window.location.href = link.original_url;
        
      } catch (error: any) {
        console.error("💥 Unexpected error during redirect:", error);
        setError("An unexpected error occurred");
        setDebugInfo(`Error: ${error.message}\nStack: ${error.stack}`);
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
              {debugInfo && (
                <details className="text-left text-xs text-muted-foreground bg-muted p-4 rounded">
                  <summary className="cursor-pointer font-semibold mb-2">Debug Info (click to expand)</summary>
                  <pre className="whitespace-pre-wrap">{debugInfo}</pre>
                </details>
              )}
              <div className="pt-4">
                <Link href="/dashboard">
                  <Button>Go to Dashboard</Button>
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