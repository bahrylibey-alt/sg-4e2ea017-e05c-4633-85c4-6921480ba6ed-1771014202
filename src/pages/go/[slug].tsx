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
    if (!slug || typeof slug !== 'string') {
      return;
    }

    const trackAndRedirect = async () => {
      try {
        console.log(`🔍 [TRACKING] Starting for slug: ${slug}`);

        // Get the affiliate link
        const { data: link, error: linkError } = await supabase
          .from('affiliate_links')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'active')
          .maybeSingle();

        if (linkError || !link) {
          console.error("❌ Link not found:", linkError);
          setError("This link doesn't exist");
          return;
        }

        console.log(`✅ Link found: ${link.product_name}`);
        setLinkData(link);

        // STEP 1: Update affiliate link click count
        const newClicks = (link.clicks || 0) + 1;
        const { error: clickError } = await supabase
          .from('affiliate_links')
          .update({ 
            clicks: newClicks,
            click_count: newClicks,
            updated_at: new Date().toISOString()
          })
          .eq('id', link.id);

        if (clickError) {
          console.error("❌ Click count update failed:", clickError);
        } else {
          console.log(`✅ Affiliate link clicks: ${link.clicks || 0} → ${newClicks}`);
        }

        // STEP 2: Detect platform from referrer
        const referrer = document.referrer.toLowerCase();
        let platform = null;
        if (referrer.includes('twitter.com') || referrer.includes('t.co')) platform = 'twitter';
        else if (referrer.includes('facebook.com') || referrer.includes('fb.com')) platform = 'facebook';
        else if (referrer.includes('linkedin.com')) platform = 'linkedin';
        else if (referrer.includes('instagram.com')) platform = 'instagram';
        else if (referrer.includes('pinterest.com')) platform = 'pinterest';

        console.log(`📱 Platform detected: ${platform || 'direct'}`);

        // STEP 3: Update posted_content clicks
        if (platform) {
          const { data: postData } = await supabase
            .from('posted_content')
            .select('id, clicks')
            .eq('link_id', link.id)
            .eq('platform', platform)
            .order('posted_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (postData) {
            const newPostClicks = (postData.clicks || 0) + 1;
            const { error: postUpdateError } = await supabase
              .from('posted_content')
              .update({ clicks: newPostClicks })
              .eq('id', postData.id);

            if (!postUpdateError) {
              console.log(`✅ Posted content clicks: ${postData.clicks || 0} → ${newPostClicks}`);
            }
          }
        }

        // STEP 4: Record click_event
        const { error: eventError } = await supabase
          .from('click_events')
          .insert({
            link_id: link.id,
            user_id: link.user_id,
            ip_address: "browser",
            user_agent: navigator.userAgent,
            referrer: document.referrer || 'direct',
            clicked_at: new Date().toISOString(),
            converted: false,
            is_bot: false,
            fraud_score: 0
          });

        if (!eventError) {
          console.log("✅ Click event recorded");
        }

        // STEP 5: Update system_state
        const { data: systemState } = await supabase
          .from('system_state')
          .select('total_clicks')
          .eq('user_id', link.user_id)
          .maybeSingle();

        if (systemState) {
          const { error: stateError } = await supabase
            .from('system_state')
            .update({ 
              total_clicks: (systemState.total_clicks || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', link.user_id);

          if (!stateError) {
            console.log(`✅ System state clicks: ${systemState.total_clicks || 0} → ${(systemState.total_clicks || 0) + 1}`);
          }
        }

        console.log('🎉 All tracking complete - redirecting...');

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
      } catch (err: any) {
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
          <p className="text-muted-foreground mb-6">
            You will be redirected in {countdown} second{countdown !== 1 ? 's' : ''}...
          </p>
          
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