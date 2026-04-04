import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { productCatalogService } from "@/services/productCatalogService";
import type { AffiliateProduct } from "@/services/productCatalogService";
import {
  ExternalLink,
  Search,
  ShoppingCart,
  TrendingUp,
  Filter,
  Loader2,
  Copy,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProductGallery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [networkFilter, setNetworkFilter] = useState("all");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [creatingLinkId, setCreatingLinkId] = useState<string | null>(null);
  const [affiliateLinks, setAffiliateLinks] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const allProducts = productCatalogService.getHighConvertingProducts();
  const categories = ["all", ...new Set(allProducts.map(p => p.category))];
  const networks = ["all", ...new Set(allProducts.map(p => p.network))];

  useEffect(() => {
    async function loadExistingLinks() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("affiliate_links")
          .select("product_name, slug")
          .eq("status", "active");
          
        if (!error && data) {
          const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
          const linkMap = new Map<string, string>();
          data.forEach(link => {
            linkMap.set(link.product_name, `${baseUrl}/go/${link.slug}`);
          });
          setAffiliateLinks(linkMap);
        }
      } catch (err) {
        console.error("Failed to load links:", err);
      } finally {
        setLoading(false);
      }
    }
    loadExistingLinks();
  }, []);

  const filteredProducts = allProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchesNetwork = networkFilter === "all" || p.network === networkFilter;
    return matchesSearch && matchesCategory && matchesNetwork;
  });

  const handleCreateLink = async (product: AffiliateProduct) => {
    setCreatingLinkId(product.id);
    try {
      const { data: existingLink } = await supabase
        .from("affiliate_links")
        .select("slug")
        .eq("product_name", product.name)
        .eq("status", "active")
        .maybeSingle();

      let linkSlug = "";

      if (existingLink) {
        linkSlug = existingLink.slug;
      } else {
        const slug = product.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 50);

        const { data: newLink, error } = await supabase
          .from("affiliate_links")
          .insert({
            product_name: product.name,
            original_url: product.url,
            slug: slug,
            network: product.network,
            commission_rate: parseFloat(product.commission.replace(/[^0-9.]/g, "")) || 0,
            status: "active",
            clicks: 0,
            conversions: 0,
            revenue: 0,
            commission_earned: 0
          })
          .select("slug")
          .single();

        if (error) throw error;
        linkSlug = newLink.slug;
      }

      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const fullLink = `${baseUrl}/go/${linkSlug}`;

      await navigator.clipboard.writeText(fullLink);
      
      setAffiliateLinks(prev => {
        const newMap = new Map(prev);
        newMap.set(product.name, fullLink);
        return newMap;
      });

      setCopiedLink(product.id);
      setTimeout(() => setCopiedLink(null), 2000);

      toast({
        title: "✅ Link Created!",
        description: "Copied to clipboard",
      });
    } catch (error) {
      console.error("Error generating link:", error);
      toast({
        title: "❌ Error",
        description: "Failed to generate link.",
        variant: "destructive",
      });
    } finally {
      setCreatingLinkId(null);
    }
  };

  const copyLink = (link: string, productId: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(productId);
    toast({
      title: "📋 Copied!",
      description: `Link copied to clipboard`
    });
    setTimeout(() => setCopiedLink(null), 2000);
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
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Affiliate Product Catalog
          </CardTitle>
          <CardDescription>
            Browse {allProducts.length} high-converting products. Generate trackable links instantly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={networkFilter} onValueChange={setNetworkFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Networks" />
              </SelectTrigger>
              <SelectContent>
                {networks.map(net => (
                  <SelectItem key={net} value={net}>
                    {net === "all" ? "All Networks" : net}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map(product => {
              const affiliateLink = affiliateLinks.get(product.name);
              const hasLink = !!affiliateLink;
              const isGenerating = creatingLinkId === product.id;

              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                          {product.conversionRate >= 8 && (
                            <Badge className="text-xs bg-green-500 text-white">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              High Converter
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{product.price}</div>
                        <div className="text-xs text-muted-foreground">{product.commission}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {product.network}
                      </Badge>
                      <span>• {product.conversionRate}% conv. rate</span>
                    </div>

                    <div className="space-y-2">
                      {hasLink && affiliateLink ? (
                        <>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => window.open(affiliateLink, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Visit Product
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyLink(affiliateLink, product.id)}
                            >
                              {copiedLink === product.id ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground truncate font-mono bg-muted p-1 rounded">
                            {affiliateLink}
                          </p>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleCreateLink(product)}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Generate Affiliate Link
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}