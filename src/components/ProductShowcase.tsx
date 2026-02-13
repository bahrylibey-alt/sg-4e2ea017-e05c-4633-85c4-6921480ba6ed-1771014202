import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, ExternalLink } from "lucide-react";

const products = [
  {
    id: 1,
    title: "Premium WordPress Theme Bundle",
    category: "Software",
    price: "$67",
    commission: "50%",
    earnings: "$33.50",
    rating: 4.8,
    reviews: 2847,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    trending: true,
    affiliateLink: "#wordpress-themes"
  },
  {
    id: 2,
    title: "Complete Digital Marketing Course",
    category: "Education",
    price: "$197",
    commission: "40%",
    earnings: "$78.80",
    rating: 4.9,
    reviews: 5432,
    image: "https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=800&auto=format&fit=crop",
    trending: true,
    affiliateLink: "#marketing-course"
  },
  {
    id: 3,
    title: "SEO Tools Suite - Annual Plan",
    category: "SaaS",
    price: "$299",
    commission: "30%",
    earnings: "$89.70",
    rating: 4.7,
    reviews: 1893,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop",
    trending: false,
    affiliateLink: "#seo-tools"
  },
  {
    id: 4,
    title: "E-commerce Starter Pack",
    category: "Business",
    price: "$147",
    commission: "45%",
    earnings: "$66.15",
    rating: 4.6,
    reviews: 3241,
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop",
    trending: false,
    affiliateLink: "#ecommerce-pack"
  },
  {
    id: 5,
    title: "Fitness & Nutrition Program",
    category: "Health",
    price: "$79",
    commission: "35%",
    earnings: "$27.65",
    rating: 4.9,
    reviews: 6782,
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop",
    trending: true,
    affiliateLink: "#fitness-program"
  },
  {
    id: 6,
    title: "Photography Presets Collection",
    category: "Creative",
    price: "$49",
    commission: "50%",
    earnings: "$24.50",
    rating: 4.8,
    reviews: 4156,
    image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&auto=format&fit=crop",
    trending: false,
    affiliateLink: "#photo-presets"
  }
];

export function ProductShowcase() {
  const [copiedLink, setCopiedLink] = useState<number | null>(null);

  const handleGetLink = (productId: number, productTitle: string) => {
    // Simulate copying affiliate link
    const affiliateLink = `https://affiliatepro.com/track/${productId}/${productTitle.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(affiliateLink).then(() => {
      setCopiedLink(productId);
      
      // Show success message
      alert(`✅ Affiliate link copied!\n\n${affiliateLink}\n\nPaste this link in your content to earn ${products.find(p => p.id === productId)?.earnings} per sale!`);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setCopiedLink(null);
      }, 3000);
    });
  };

  return (
    <section className="py-24 px-6 bg-background">
      <div className="container">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="text-accent border-accent/30">
            Top Products
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            High-Converting <span className="text-accent">Products</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Hand-picked affiliate products with proven conversion rates and generous commissions
          </p>
        </div>

        {/* Products grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card 
              key={product.id}
              className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-border/50 hover:border-accent/30"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-muted">
                <img 
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className="bg-primary text-primary-foreground">
                    {product.category}
                  </Badge>
                  {product.trending && (
                    <Badge className="bg-accent text-accent-foreground">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                </div>

                {/* Rating */}
                <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-white text-sm font-medium">{product.rating}</span>
                  <span className="text-white/70 text-xs">({product.reviews})</span>
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {product.title}
                </h3>

                {/* Pricing info */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Price</div>
                    <div className="text-xl font-bold text-foreground">{product.price}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">You Earn</div>
                    <div className="text-xl font-bold text-accent">{product.earnings}</div>
                  </div>
                </div>

                {/* Commission badge */}
                <div className="flex items-center justify-between pt-2">
                  <Badge variant="secondary" className="text-xs">
                    {product.commission} Commission
                  </Badge>
                  <Button 
                    size="sm" 
                    className="gap-2"
                    onClick={() => handleGetLink(product.id, product.title)}
                  >
                    {copiedLink === product.id ? "Copied!" : "Get Link"}
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View all button */}
        <div className="text-center mt-12">
          <Button 
            size="lg" 
            variant="outline" 
            className="gap-2"
            onClick={() => alert("This would open the full product catalog with 500+ affiliate products!")}
          >
            View All Products
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}