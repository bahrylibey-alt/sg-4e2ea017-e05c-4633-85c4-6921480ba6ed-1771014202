import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { affiliateLinkService } from "@/services/affiliateLinkService";
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
  const { toast } = useToast();
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<AffiliateProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  
  // Track which product is currently being linked
  const [creatingLinkId, setCreatingLinkId] = useState<string | null>(null);
  
  // Map of product ID to generated affiliate link
  const [affiliateLinks, setAffiliateLinks] = useState<Map<string, string>>(new Map());
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    // Load products
    const loadProducts = () => {
      setLoading(true);
      try {
        let result = [];
        // Use categoryFilter instead of selectedCategory
        if (categoryFilter === "all") {
          result = productCatalogService.getAllProducts();
        } else {
          result = productCatalogService.getProductsByCategory(categoryFilter);
        }
        setProducts(result);
      } catch (err) {
        console.error("Error loading products:", err);
        toast({
          title: "Error",
          description: "Failed to load product catalog",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [categoryFilter]); // Dependency updated to categoryFilter

  useEffect(() => {
    filterProducts();
  }, [searchQuery, categoryFilter, networkFilter, products]);

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (networkFilter !== "all") {
      filtered = filtered.filter(p => p.network === networkFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleCreateLink = async (product: AffiliateProduct) => {
    setCreatingLinkId(product.id);
    try {
      const result = await affiliateLinkService.createLink({
        originalUrl: (product as any).url || "https://example.com",
        productName: product.name,
        network: product.network,
        commissionRate: parseFloat(product.commission.replace(/[^0-9.]/g, "")) || 0
      });

      if (result.success && result.link) {
        toast({
          title: "Link Created",
          description: `Affiliate link for ${product.name} created successfully!`,
        });
        
        // Update local state with the new link
        setAffiliateLinks(prev => {
          const newMap = new Map(prev);
          newMap.set(product.id, (result as any).cloaked_url || (result as any).link?.short_url || "");
          return newMap;
        });
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({
        title: "Creation Failed",
        description: err.message || "Failed to create link",
        variant: "destructive"
      });
    } finally {
      setCreatingLinkId(null);
    }
  };

  const copyLink = (link: string, productName: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    toast({
      title: "📋 Copied!",
      description: `Link for ${productName} copied to clipboard`
    });
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const categories = ["all", ...productCatalogService.getCategories()];
  const networks = ["all", ...productCatalogService.getNetworks()];

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
            Browse {products.length} high-converting products from top affiliate networks. Generate trackable links instantly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
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

          {/* Products Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map(product => {
              const hasLink = affiliateLinks.has(product.id);
              const isGenerating = creatingLinkId === product.id;
              const affiliateLink = affiliateLinks.get(product.id);

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
                          {product.conversionRate && product.conversionRate >= 8 && (
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
                      {product.conversionRate && (
                        <span>• {product.conversionRate}% conv. rate</span>
                      )}
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
                              onClick={() => copyLink(affiliateLink, product.name)}
                            >
                              {copiedLink === affiliateLink ? (
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