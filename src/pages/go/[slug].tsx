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

        // STEP 1: Try to find the link in affiliate_links table
        const { data: affiliateLink } = await supabase
          .from('affiliate_links')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'active')
          .maybeSingle();

        // STEP 2: If not found, try generated_content table
        let link = affiliateLink;
        let isGeneratedContent = false;

        if (!link) {
          console.log('Link not in affiliate_links, checking generated_content...');
          const { data: generatedContent } = await supabase
            .from('generated_content')
            .select('*')
            .eq('id', slug)
            .eq('status', 'published')
            .maybeSingle();

          if (generatedContent && generatedContent.body) {
            // Extract URL from content body (look for first http/https link)
            const urlMatch = generatedContent.body.match(/https?:\/\/[^\s<>"]+/);
            if (urlMatch) {
              link = {
                id: generatedContent.id,
                product_name: generatedContent.title,
                original_url: urlMatch[0],
                user_id: generatedContent.user_id,
                network: 'Generated',
                clicks: generatedContent.clicks || 0
              };
              isGeneratedContent = true;
              console.log('✅ Found link in generated_content');
            }
          }
        }

        if (!link || !link.original_url) {
          console.error("❌ Link not found in any table");
          setError("This link doesn't exist or has expired");
          return;
        }

        console.log(`✅ Link found: ${link.product_name || 'Unknown'}`);
        setLinkData(link);

        // STEP 3: Update click count
        const newClicks = (link.clicks || 0) + 1;
        
        if (isGeneratedContent) {
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

        // STEP 4: Record click event
        await supabase
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

        console.log("✅ Click event recorded");

        // STEP 5: Update system_state
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