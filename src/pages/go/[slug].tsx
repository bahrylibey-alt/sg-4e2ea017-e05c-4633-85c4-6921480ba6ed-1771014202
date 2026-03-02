import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { affiliateLinkService } from "@/services/affiliateLinkService";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";

export default function RedirectPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!slug || typeof slug !== "string") {
        setError("Invalid link");
        return;
      }

      try {
        // Look up the affiliate link by slug
        const { data: link, error: linkError } = await supabase
          .from("affiliate_links")
          .select("*")
          .eq("slug", slug)
          .eq("status", "active")
          .single();

        if (linkError || !link) {
          console.error("Link not found:", linkError);
          setError("This affiliate link was not found or is no longer active");
          setRedirecting(false);
          return;
        }

        // Check if we have a valid destination URL
        if (!link.original_url) {
          console.error("Link has no destination URL:", link);
          setError("This link is not configured properly");
          setRedirecting(false);
          return;
        }

        // Track the click
        const clickData: any = {
          link_id: link.id,
          user_id: link.user_id,
          clicked_at: new Date().toISOString()
        };

        // Add optional tracking data if available
        if (typeof window !== 'undefined') {
          clickData.referrer = document.referrer || null;
          clickData.user_agent = navigator.userAgent || null;
        }

        // Record the click in the database using the CORRECT table name
        const { error: clickError } = await supabase
          .from("click_events") // Changed from "link_clicks" to "click_events"
          .insert(clickData);

        if (clickError) {
          console.error("Failed to track click:", clickError);
          // Don't block redirect if tracking fails
        }

        // Update click count on the link
        // Use click_count which seems to be the preferred column based on schema
        await supabase
          .from("affiliate_links")
          .update({ 
            click_count: (link.click_count || 0) + 1,
            clicks: (link.clicks || 0) + 1, // Update both for compatibility
            updated_at: new Date().toISOString() // Correct column name based on schema context
          })
          .eq("id", link.id);

        // Redirect to the actual product URL
        console.log("Redirecting to:", link.original_url);
        window.location.href = link.original_url;
        
      } catch (error) {
        console.error("Redirect error:", error);
        setError("An error occurred while processing this link");
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