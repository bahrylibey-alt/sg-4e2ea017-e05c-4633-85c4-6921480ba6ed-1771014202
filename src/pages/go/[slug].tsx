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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (message: string) => {
    console.log(`🔍 [DEBUG] ${message}`);
    setDebugInfo(prev => [...prev, message]);
  };

  useEffect(() => {
    if (!slug || typeof slug !== 'string') {
      addDebug('❌ No slug provided or slug is not a string');
      return;
    }

    const trackAndRedirect = async () => {
      try {
        addDebug(`Starting tracking for slug: ${slug}`);

        // Query the database for this slug
        const { data: link, error: linkError } = await supabase
          .from('affiliate_links')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'active')
          .maybeSingle();

        addDebug(`Database query result: ${link ? 'FOUND' : 'NOT FOUND'}`);
        if (linkError) addDebug(`❌ Database error: ${linkError.message}`);

        if (linkError) {
          console.error("❌ Database error:", linkError);
          setError("Database error occurred");
          addDebug(`Error details: ${JSON.stringify(linkError)}`);
          return;
        }

        if (!link) {
          console.error("❌ Link not found for slug:", slug);
          setError("This link doesn't exist in our database");
          addDebug(`Link not found - slug: ${slug}`);
          return;
        }

        addDebug(`✅ Link found: ${link.product_name}`);
        addDebug(`Current clicks: ${link.clicks || 0}`);
        addDebug(`Original URL: ${link.original_url}`);

        setLinkData(link);

        // CRITICAL: Track the click - Update BOTH columns for compatibility
        const newClicks = (link.clicks || 0) + 1;
        addDebug(`Attempting to update clicks: ${link.clicks || 0} → ${newClicks}`);

        const { data: updateData, error: clickError } = await supabase
          .from('affiliate_links')
          .update({ 
            clicks: newClicks,
            click_count: newClicks,
            updated_at: new Date().toISOString()
          })
          .eq('id', link.id)
          .select();

        if (clickError) {
          console.error("❌ Click count update failed:", clickError);
          addDebug(`❌ UPDATE FAILED: ${clickError.message}`);
          addDebug(`Error code: ${clickError.code}`);
          addDebug(`Error details: ${JSON.stringify(clickError.details)}`);
        } else {
          console.log("✅ Click count updated:", newClicks);
          addDebug(`✅ UPDATE SUCCESS: Clicks now ${newClicks}`);
          addDebug(`Update data: ${JSON.stringify(updateData)}`);
        }

        // CRITICAL: Identify platform from referrer to update posted_content
        const referrer = document.referrer.toLowerCase();
        let platform = null;
        if (referrer.includes('twitter.com') || referrer.includes('t.co')) platform = 'twitter';
        else if (referrer.includes('facebook.com') || referrer.includes('fb.com')) platform = 'facebook';
        else if (referrer.includes('linkedin.com')) platform = 'linkedin';
        else if (referrer.includes('instagram.com')) platform = 'instagram';
        else if (referrer.includes('pinterest.com')) platform = 'pinterest';
        else if (referrer.includes('youtube.com')) platform = 'youtube';

        addDebug(`Detected platform from referrer: ${platform || 'direct'}`);
        addDebug(`Full referrer: ${document.referrer || 'none'}`);

        // Update posted_content clicks so Traffic Channels page updates!
        let postQuery = supabase
          .from('posted_content')
          .select('id, clicks')
          .eq('link_id', link.id)
          .order('posted_at', { ascending: false })
          .limit(1);

        if (platform) {
          postQuery = postQuery.eq('platform', platform);
        }

        const { data: postData, error: postQueryError } = await postQuery.maybeSingle();

        if (postQueryError) {
          addDebug(`⚠️ Post query error: ${postQueryError.message}`);
        } else if (postData) {
          const newPostClicks = (postData.clicks || 0) + 1;
          addDebug(`Found post ${postData.id}, updating clicks: ${postData.clicks || 0} → ${newPostClicks}`);
          
          const { error: postUpdateError } = await supabase
            .from('posted_content')
            .update({ clicks: newPostClicks })
            .eq('id', postData.id);

          if (postUpdateError) {
            addDebug(`❌ Post click update failed: ${postUpdateError.message}`);
          } else {
            addDebug(`✅ Post clicks updated to ${newPostClicks}`);
          }
        } else {
          addDebug(`⚠️ No posted_content found for this link (link_id: ${link.id}, platform: ${platform || 'any'})`);
        }

        // Record click event for detailed tracking (CRITICAL FOR ANALYTICS)
        addDebug('Attempting to insert click_event...');
        const { data: eventData, error: eventError } = await supabase
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
          })
          .select();

        if (eventError) {
          console.error("⚠️ Click event tracking failed:", eventError);
          addDebug(`❌ EVENT INSERT FAILED: ${eventError.message}`);
          addDebug(`Error code: ${eventError.code}`);
        } else {
          console.log("✅ Click event recorded");
          addDebug(`✅ EVENT INSERT SUCCESS: ${JSON.stringify(eventData)}`);
        }

        // Record activity log (OPTIONAL - helps with debugging)
        addDebug('Attempting to insert activity_log...');
        const { error: activityError } = await supabase
          .from('activity_logs')
          .insert({
            user_id: link.user_id,
            action: 'link_click',
            details: `Clicked on ${link.product_name}`,
            metadata: {
              link_id: link.id,
              slug: link.slug,
              product_name: link.product_name,
              network: link.network,
              user_agent: navigator.userAgent,
              referrer: document.referrer || 'direct',
              new_click_count: newClicks,
              platform_detected: platform
            },
            status: 'success'
          });

        if (activityError) {
          console.error("⚠️ Activity log failed:", activityError);
          addDebug(`❌ ACTIVITY LOG FAILED: ${activityError.message}`);
        } else {
          console.log("✅ Activity logged");
          addDebug('✅ ACTIVITY LOG SUCCESS');
        }

        addDebug('✅ All tracking operations complete');
        addDebug(`Redirecting to: ${link.original_url}`);

        // Start countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              addDebug('🚀 Redirecting now...');
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
        addDebug(`💥 EXCEPTION: ${err.message}`);
        addDebug(`Stack: ${err.stack}`);
      }
    };

    trackAndRedirect();
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h1 className="text-2xl font-bold mb-2">Link Error</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            
            {/* Debug Info */}
            <details className="text-left bg-muted p-4 rounded-lg mb-6">
              <summary className="cursor-pointer font-semibold mb-2">Debug Information</summary>
              <div className="text-xs font-mono space-y-1">
                {debugInfo.map((info, idx) => (
                  <div key={idx}>{info}</div>
                ))}
              </div>
            </details>

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
          {/* Show debug in loading state too */}
          {debugInfo.length > 0 && (
            <details className="text-left bg-muted p-4 rounded-lg mt-4 max-w-md mx-auto">
              <summary className="cursor-pointer text-sm font-semibold mb-2">Debug Log</summary>
              <div className="text-xs font-mono space-y-1">
                {debugInfo.map((info, idx) => (
                  <div key={idx}>{info}</div>
                ))}
              </div>
            </details>
          )}
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
            onClick={() => {
              addDebug('🚀 Manual redirect clicked');
              window.location.href = linkData.original_url;
            }}
            className="w-full mb-4"
            size="lg"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Go Now
          </Button>

          {/* Debug Info */}
          <details className="text-left bg-muted p-4 rounded-lg text-xs">
            <summary className="cursor-pointer font-semibold mb-2">Debug Information</summary>
            <div className="font-mono space-y-1">
              {debugInfo.map((info, idx) => (
                <div key={idx}>{info}</div>
              ))}
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}