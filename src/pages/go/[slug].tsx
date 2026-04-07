import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from "lucide-react";

export default function RedirectPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [error, setError] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;

    const trackAndRedirect = async () => {
      try {
        console.log("🔍 Looking for slug:", slug);

        // Query the database for this slug
        const { data: link, error: linkError } = await supabase
          .from('affiliate_links')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'active')
          .maybeSingle();

        console.log("📊 Query result:", { link, linkError });

        if (linkError) {
          console.error("❌ Database error:", linkError);
          setError("Database error occurred");
          return;
        }

        if (!link) {
          console.error("❌ Link not found for slug:", slug);
          setError("This link doesn't exist in our database");
          return;
        }

        setLinkData(link);

        // Track the click
        const { error: clickError } = await supabase
          .from('link_clicks')
          .insert({
            link_id: link.id,
            user_agent: navigator.userAgent,
            referrer: document.referrer || 'direct'
          });

        if (clickError) {
          console.error("⚠️ Click tracking failed:", clickError);
        }

        // Start countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              window.location.href = link.original_url;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (err) {
        console.error("💥 Redirect error:", err);
        setError("An error occurred");
      }
    };

    trackAndRedirect();
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h1 className="text-2xl font-bold mb-2">Link Error</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!linkData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Redirecting to Product</h1>
          <p className="text-lg font-semibold mb-4">{linkData.product_name}</p>
          <p className="text-sm text-muted-foreground mb-6">{linkData.network}</p>
          
          <div className="text-6xl font-bold text-primary mb-4">{countdown}</div>
          <p className="text-muted-foreground mb-6">You will be redirected in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
          
          <Button
            onClick={() => window.location.href = linkData.original_url}
            className="w-full"
            size="lg"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Go Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}