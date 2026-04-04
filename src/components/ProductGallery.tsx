import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ExternalLink,
  ShoppingCart,
  Loader2,
  Copy,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

interface AffiliateLink {
  id: string;
  product_name: string;
  slug: string;
  original_url: string;
  cloaked_url: string;
  network: string;
  commission_rate: number;
  clicks: number;
  conversions: number;
  revenue: number;
  status: string;
}

export function ProductGallery() {
  const [products, setProducts] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [testingLink, setTestingLink] = useState<string | null>(null);
  const { toast } = useToast();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("status", "active")
        .order("product_name");

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        title: "❌ Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const copyLink = async (product: AffiliateLink) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const fullLink = `${baseUrl}${product.cloaked_url}`;
    
    await navigator.clipboard.writeText(fullLink);
    setCopiedLink(product.id);
    
    toast({
      title: "✅ Link Copied!",
      description: fullLink,
    });

    setTimeout(() => setCopiedLink(null), 2000);
  };

  const testLink = async (product: AffiliateLink) => {
    setTestingLink(product.id);
    
    toast({
      title: "🧪 Testing Link...",
      description: "Opening Amazon product page",
    });

    // Open the Amazon URL directly to test
    window.open(product.original_url, "_blank");

    setTimeout(() => setTestingLink(null), 1000);
  };

  const testRedirect = async (product: AffiliateLink) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const redirectUrl = `${baseUrl}${product.cloaked_url}`;
    
    toast({
      title: "🔄 Testing Redirect...",
      description: "Opening redirect link",
    });

    window.open(redirectUrl, "_blank");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Verified Amazon Products
              </CardTitle>
              <CardDescription>
                {products.length} verified products with working Amazon links
              </CardDescription>
            </div>
            <Button onClick={loadProducts} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base line-clamp-2">
                      {product.product_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {product.network}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {product.commission_rate}% commission
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => testLink(product)}
                          disabled={testingLink === product.id}
                        >
                          {testingLink === product.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Test Amazon URL
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyLink(product)}
                        >
                          {copiedLink === product.id ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        onClick={() => testRedirect(product)}
                      >
                        Test Redirect {product.cloaked_url}
                      </Button>

                      <div className="text-xs space-y-1 pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Clicks:</span>
                          <span className="font-medium">{product.clicks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Conversions:</span>
                          <span className="font-medium">{product.conversions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Revenue:</span>
                          <span className="font-medium">${product.revenue?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground truncate font-mono bg-muted p-1 rounded">
                        {product.original_url}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}