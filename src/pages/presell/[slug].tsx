import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Star, Shield, TrendingUp, Mail } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";

interface BridgePage {
  id: string;
  headline: string;
  story_content: string;
  benefits: string[];
  social_proof: string[];
  cta_text: string;
  urgency_message: string;
  trust_badges: string[];
  product_id: string;
}

export default function BridgePageViewer() {
  const router = useRouter();
  const { slug } = router.query;
  const [page, setPage] = useState<BridgePage | null>(null);
  const [productUrl, setProductUrl] = useState("");
  const [email, setEmail] = useState("");
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (slug && typeof slug === 'string') {
      loadBridgePage(slug);
      trackView(slug);
    }
  }, [slug]);

  const loadBridgePage = async (pageSlug: string) => {
    const { data, error } = await supabase
      .from('bridge_pages')
      .select(`
        *,
        product_catalog!bridge_pages_product_id_fkey (
          affiliate_url
        )
      `)
      .eq('slug', pageSlug)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      console.error('Bridge page not found:', error);
      router.push('/404');
      return;
    }

    setPage(data);
    setProductUrl((data as any).product_catalog?.affiliate_url || '');
  };

  const trackView = async (pageSlug: string) => {
    // In a production environment, this would call a secure API route
    // to increment the views count safely without exposing DB access
    console.log('View tracked:', pageSlug);
  };

  const trackClick = async () => {
    if (!slug || typeof slug !== 'string') return;
    
    // In a production environment, this would call a secure API route
    console.log('Click tracked:', slug);
  };

  const handleCTA = () => {
    if (showLeadCapture && email) {
      captureEmail();
    } else {
      setShowLeadCapture(true);
    }
  };

  const captureEmail = async () => {
    if (!email || !page) return;

    const { error } = await supabase
      .from('lead_captures')
      .insert({
        user_id: page.id,
        product_id: page.product_id,
        email,
        source: 'bridge_page',
        metadata: { slug }
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save email",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success!",
      description: "Check your email for exclusive access"
    });

    // Redirect to product after capturing email
    trackClick();
    setTimeout(() => {
      if (productUrl) window.location.href = productUrl;
    }, 1500);
  };

  const skipToProduct = () => {
    trackClick();
    if (productUrl) window.location.href = productUrl;
  };

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={page.headline}
        description={page.story_content.substring(0, 160)}
        image="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
          
          {/* Headline */}
          <div className="text-center space-y-4">
            <Badge variant="outline" className="mb-4">
              <TrendingUp className="h-3 w-3 mr-1" /> Trending Now
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              {page.headline}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {page.urgency_message}
            </p>
          </div>

          {/* Story Content */}
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="prose prose-lg max-w-none">
                {page.story_content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-foreground/90 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold text-center mb-6">Why People Love This</h2>
              <div className="grid gap-4">
                {page.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Social Proof */}
          <Card className="bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                What Others Are Saying
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {page.social_proof.map((proof, i) => (
                  <Card key={i}>
                    <CardContent className="pt-4">
                      <p className="italic text-foreground/80">"{proof}"</p>
                      <div className="flex gap-1 mt-2">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="border-2 border-primary">
            <CardContent className="pt-6 space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">{page.cta_text}</h2>
                <p className="text-lg text-primary font-semibold">
                  {page.urgency_message}
                </p>

                {showLeadCapture ? (
                  <div className="space-y-4 max-w-md mx-auto">
                    <div className="flex items-center gap-2 bg-background p-4 rounded-lg">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Enter your email for exclusive access"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-0 bg-transparent focus-visible:ring-0"
                      />
                    </div>
                    <Button 
                      onClick={handleCTA} 
                      size="lg" 
                      className="w-full h-14 text-lg"
                      disabled={!email}
                    >
                      Get Instant Access
                    </Button>
                    <Button 
                      onClick={skipToProduct} 
                      variant="ghost" 
                      className="w-full"
                    >
                      Skip to product →
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button 
                      onClick={handleCTA} 
                      size="lg" 
                      className="w-full max-w-md mx-auto h-14 text-lg"
                    >
                      {page.cta_text}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Get instant access + exclusive bonus content
                    </p>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center gap-4 pt-6 border-t">
                {page.trust_badges.map((badge, i) => (
                  <Badge key={i} variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" /> {badge}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
}