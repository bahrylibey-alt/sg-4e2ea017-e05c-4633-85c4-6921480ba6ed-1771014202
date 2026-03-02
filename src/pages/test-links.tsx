import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Copy, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";

interface AffiliateLink {
  id: string;
  slug: string;
  product_name: string;
  original_url: string;
  cloaked_url: string;
  clicks: number;
  conversion_count: number;
  status: string;
}

export default function TestLinksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadLinks();
  }, []);

  const checkAuthAndLoadLinks = async () => {
    const session = await authService.getCurrentSession();
    
    if (!session) {
      router.push("/?auth=login");
      return;
    }

    await loadLinks();
    setLoading(false);
  };

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading links:", error);
        return;
      }

      setLinks(data || []);
    } catch (error) {
      console.error("Failed to load links:", error);
    }
  };

  const copyLink = (link: AffiliateLink) => {
    const fullUrl = `${window.location.origin}/go/${link.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const testLink = (link: AffiliateLink) => {
    window.open(`/go/${link.slug}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading links...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Test Affiliate Links - Sale Makseb" description="Test and verify all your affiliate links" />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container py-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">Test Affiliate Links</h1>
            <p className="text-muted-foreground">
              Verify all your affiliate links are working correctly
            </p>
          </div>

          {links.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No affiliate links found. Go to the Dashboard and launch the One-Click Autopilot to generate links.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-700 dark:text-blue-400">
                  <strong>{links.length} Affiliate Links Generated</strong> - Click "Test Link" to verify each one redirects correctly to the product page.
                </AlertDescription>
              </Alert>

              {links.map((link) => (
                <Card key={link.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{link.product_name}</CardTitle>
                        <CardDescription className="mt-1">
                          Slug: <code className="text-xs bg-muted px-2 py-1 rounded">{link.slug}</code>
                        </CardDescription>
                      </div>
                      <Badge variant={link.status === "active" ? "default" : "secondary"}>
                        {link.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Clicks</p>
                        <p className="text-2xl font-bold">{link.clicks || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Conversions</p>
                        <p className="text-2xl font-bold">{link.conversion_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Conv. Rate</p>
                        <p className="text-2xl font-bold">
                          {link.clicks > 0 ? ((link.conversion_count / link.clicks) * 100).toFixed(1) : "0.0"}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Your Affiliate Link:</p>
                        <code className="text-sm break-all">
                          {window.location.origin}/go/{link.slug}
                        </code>
                      </div>
                      
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Redirects To:</p>
                        <code className="text-sm break-all text-green-600">
                          {link.original_url}
                        </code>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => testLink(link)}
                        className="flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Test Link (Opens Product)
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => copyLink(link)}
                        className="flex-1"
                      >
                        {copiedId === link.id ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}