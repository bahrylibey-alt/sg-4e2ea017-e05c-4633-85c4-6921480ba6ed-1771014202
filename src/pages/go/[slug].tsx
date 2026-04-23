import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from "lucide-react";

interface ProductData {
  id: string;
  product_name: string;
  original_url: string;
  user_id: string;
  clicks: number;
  network?: string;
  description?: string;
}

interface RedirectPageProps {
  productData?: ProductData;
  error?: string;
}

export default function RedirectPage({ productData: initialData, error: serverError }: RedirectPageProps) {
  const router = useRouter();
  const { slug } = router.query;
  const [error, setError] = useState<string | null>(serverError || null);
  const [linkData, setLinkData] = useState<ProductData | null>(initialData || null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (serverError || !slug || typeof slug !== 'string') {
      return;
    }

    // If we already have data from SSR, just start countdown
    if (initialData) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = initialData.original_url;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Track click on client side
      trackClick(initialData);

      return () => clearInterval(timer);
    }

    // Fallback: fetch on client if SSR didn't provide data
    const trackAndRedirect = async () => {
      try {
        console.log(`🔍 [REDIRECT] Starting for slug: ${slug}`);

        const { data: affiliateLink, error: linkError } = await supabase
          .from('affiliate_links')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'active')
          .maybeSingle();

        console.log('🔍 [REDIRECT] affiliate_links query result:', { affiliateLink, linkError });

        let link: ProductData | null = null;

        if (affiliateLink && affiliateLink.original_url) {
          link = {
            id: affiliateLink.id,
            product_name: affiliateLink.product_name || 'Product',
            original_url: affiliateLink.original_url,
            user_id: affiliateLink.user_id,
            clicks: affiliateLink.clicks || 0,
            network: affiliateLink.network
          };
          console.log('✅ Found in affiliate_links');
        } else {
          console.log('⚠️ Not found in affiliate_links, trying generated_content...');
          const { data: content, error: contentError } = await supabase
            .from('generated_content')
            .select('*')
            .eq('id', slug)
            .eq('status', 'published')
            .maybeSingle();

          console.log('🔍 [REDIRECT] generated_content query result:', { content, contentError });

          if (content) {
            const urlMatch = content.body?.match(/https?:\/\/[^\s<>"']+/);
            if (urlMatch) {
              link = {
                id: content.id,
                product_name: content.title,
                original_url: urlMatch[0],
                user_id: content.user_id,
                clicks: content.clicks || 0,
                description: content.body?.substring(0, 150)
              };
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

        await trackClick(link);

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
  }, [slug, initialData, serverError]);

  async function trackClick(link: ProductData) {
    try {
      const newClicks = (link.clicks || 0) + 1;

      await supabase
        .from('affiliate_links')
        .update({ 
          clicks: newClicks,
          click_count: newClicks,
          updated_at: new Date().toISOString()
        })
        .eq('id', link.id);

      console.log(`✅ Click count updated: ${link.clicks || 0} → ${newClicks}`);

      try {
        await supabase
          .from('click_events')
          .insert({
            link_id: link.id,
            user_id: link.user_id,
            ip_address: "browser",
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'ssr',
            referrer: typeof document !== 'undefined' ? (document.referrer || 'direct') : 'ssr',
            clicked_at: new Date().toISOString()
          });
        console.log("✅ Click event recorded");
      } catch (eventError) {
        console.log("⚠️ Click event skipped:", eventError);
      }

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

      console.log('🎉 Tracking complete');
    } catch (err) {
      console.error("Error tracking click:", err);
    }
  }

  // Dynamic SEO based on product data
  const seoTitle = linkData 
    ? `${linkData.product_name} - Get It Now` 
    : "Product Redirect";
  const seoDescription = linkData
    ? `Check out ${linkData.product_name}${linkData.network ? ` from ${linkData.network}` : ''}. Click to view product details and get the best deal.`
    : "Redirecting to product page...";

  if (error) {
    return (
      <>
        <SEO 
          title="Link Error"
          description="This link could not be found or has expired"
        />
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
      </>
    );
  }

  if (!linkData) {
    return (
      <>
        <SEO title="Loading Product..." description="Please wait while we load the product information" />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title={seoTitle}
        description={seoDescription}
        url={`/go/${slug}`}
      />
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
            {linkData.network && (
              <p className="text-sm text-muted-foreground mb-4">From {linkData.network}</p>
            )}
            
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
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };

  try {
    // Create a Supabase client for server-side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Simple fetch instead of using the client
    const response = await fetch(
      `${supabaseUrl}/rest/v1/affiliate_links?slug=eq.${slug}&status=eq.active&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    const data = await response.json();

    if (data && data.length > 0) {
      const link = data[0];
      return {
        props: {
          productData: {
            id: link.id,
            product_name: link.product_name || 'Product',
            original_url: link.original_url,
            user_id: link.user_id,
            clicks: link.clicks || 0,
            network: link.network || null,
            description: null
          }
        }
      };
    }

    // Try generated_content as fallback
    const contentResponse = await fetch(
      `${supabaseUrl}/rest/v1/generated_content?id=eq.${slug}&status=eq.published&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    const contentData = await contentResponse.json();

    if (contentData && contentData.length > 0) {
      const content = contentData[0];
      const urlMatch = content.body?.match(/https?:\/\/[^\s<>"']+/);
      
      if (urlMatch) {
        return {
          props: {
            productData: {
              id: content.id,
              product_name: content.title,
              original_url: urlMatch[0],
              user_id: content.user_id,
              clicks: content.clicks || 0,
              description: content.body?.substring(0, 150) || null
            }
          }
        };
      }
    }

    return {
      props: {
        error: "This link doesn't exist or has expired"
      }
    };
  } catch (error) {
    console.error('SSR Error:', error);
    return {
      props: {
        error: "An error occurred loading this product"
      }
    };
  }
};