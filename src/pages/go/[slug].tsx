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
        console.log(`🔍 [REDIRECT] Starting for slug: ${slug}`);

        // STEP 1: Try affiliate_links table first (proper affiliate links)
        const { data: affiliateLink } = await supabase
          .from('affiliate_links')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'active')
          .maybeSingle();

        let link: any = null;
        let sourceTable = '';

        if (affiliateLink && affiliateLink.original_url) {
          link = affiliateLink;
          sourceTable = 'affiliate_links';
          console.log('✅ Found in affiliate_links');
        }

        // STEP 2: Try generated_content (using ID as slug)
        if (!link) {
          console.log('Checking generated_content...');
          const { data: content } = await supabase
            .from('generated_content')
            .select('*')
            .eq('id', slug)
            .eq('status', 'published')
            .maybeSingle();

          if (content) {
            // Extract URL from body - try multiple patterns
            let extractedUrl = null;
            
            // Pattern 1: Standard http(s) URL
            const urlMatch = content.body?.match(/https?:\/\/[^\s<>"']+/);
            if (urlMatch) {
              extractedUrl = urlMatch[0];
            }
            
            // Pattern 2: Check if there's a product_id we can use
            if (!extractedUrl && content.campaign_id) {
              // Try to find affiliate link by campaign
              const { data: relatedLink } = await supabase
                .from('affiliate_links')
                .select('original_url, product_name')
                .eq('campaign_id', content.campaign_id)
                .eq('status', 'active')
                .maybeSingle();
              
              if (relatedLink?.original_url) {
                extractedUrl = relatedLink.original_url;
              }
            }

            // Pattern 3: Generic product search fallback
            if (!extractedUrl) {
              // Extract product name from title and search Amazon
              const productName = content.title.replace(/^Review:\s*/, '').replace(/\s*-\s*\d+$/, '');
              extractedUrl = `https://www.amazon.com/s?k=${encodeURIComponent(productName)}`;
            }

            if (extractedUrl) {
              link = {
                id: content.id,
                product_name: content.title,
                original_url: extractedUrl,
                user_id: content.user_id,
                clicks: content.clicks || 0
              };
              sourceTable = 'generated_content';
              console.log('✅ Found in generated_content');
            }
          }
        }

        if (!link || !link.original_url) {
          console.error("❌ No valid redirect URL found");
          setError("This link doesn't exist or has expired");
          return;
        }

        console.log(`✅ Redirecting to: ${link.original_url}`);
        setLinkData(link);

        // STEP 3: Update click count
        const newClicks = (link.clicks || 0) + 1;
        
        if (sourceTable === 'generated_content') {
          await supabase
            .from('generated_content')
            .update({ 
              clicks: newClicks,
              updated_at: new Date().toISOString()
            })
            .eq('id', link.id);
        } else {
          await supabase
            .from('affiliate_links')
            .update({ 
              clicks: newClicks,
              click_count: newClicks,
              updated_at: new Date().toISOString()
            })
            .eq('id', link.id);
        }

        console.log(`✅ Click count updated: ${link.clicks || 0} → ${newClicks}`);

        // STEP 4: Record click event (try, don't fail if it errors)
        try {
          await supabase
            .from('click_events')
            .insert({
              link_id: link.id,
              user_id: link.user_id,
              ip_address: "browser",
              user_agent: navigator.userAgent,
              referrer: document.referrer || 'direct',
              clicked_at: new Date().toISOString()
            });
          console.log("✅ Click event recorded");
        } catch (eventError) {
          console.log("⚠️ Click event skipped:", eventError);
        }

        // STEP 5: Update system_state (try, don't fail if it errors)
        try {
          const { data: systemState } = await supabase
            .from('system_state')
            .select('total_clicks')
            .eq('user_id', link.user_id)
            .maybeSingle();

          if (systemState) {
            await supabase
              .from('system_state')
              .update({ 
                total_clicks: (systemState.total_clicks || 0) + 1,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', link.user_id);
            console.log(`✅ System state updated`);
          }
        } catch (stateError) {
          console.log("⚠️ System state update skipped:", stateError);
        }

        console.log('🎉 Tracking complete - redirecting...');

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
        setError("An error occurred while redirecting");
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