import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, DollarSign, Users, Clock, Star } from "lucide-react";

const featuredOffers = [
  {
    id: 1,
    title: "High-Converting Tech Products",
    description: "Premium electronics and gadgets with commission rates up to 8% from Amazon Associates and Best Buy.",
    category: "Electronics",
    commission: "5-8%",
    icon: <TrendingUp className="w-5 h-5" />,
    trending: true,
  },
  {
    id: 2,
    title: "Health & Wellness Supplements",
    description: "Top-performing health products with recurring commissions from ClickBank and Commission Junction.",
    category: "Health",
    commission: "30-50%",
    icon: <Target className="w-5 h-5" />,
    trending: true,
  },
  {
    id: 3,
    title: "Financial Services & Tools",
    description: "High-ticket affiliate programs for credit cards, investment platforms, and financial education.",
    category: "Finance",
    commission: "$50-$500 CPA",
    icon: <DollarSign className="w-5 h-5" />,
    trending: false,
  },
  {
    id: 4,
    title: "SaaS & Software Tools",
    description: "Recurring commission programs for business software, productivity tools, and cloud services.",
    category: "Software",
    commission: "20-30% recurring",
    icon: <Users className="w-5 h-5" />,
    trending: true,
  },
  {
    id: 5,
    title: "Fashion & Lifestyle Products",
    description: "Trending fashion items, accessories, and lifestyle products from major retailers and boutique brands.",
    category: "Fashion",
    commission: "10-15%",
    icon: <Star className="w-5 h-5" />,
    trending: false,
  },
  {
    id: 6,
    title: "Online Courses & Education",
    description: "High-converting educational products and courses with generous affiliate payouts from platforms like Udemy and Teachable.",
    category: "Education",
    commission: "20-50%",
    icon: <Clock className="w-5 h-5" />,
    trending: true,
  },
];

export function FeaturedContent() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20" data-section="features">
      <div className="container px-6">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            Featured Opportunities
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Top Performing Affiliate Niches
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover high-converting affiliate programs across multiple niches with proven ROI
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredOffers.map((offer) => (
            <Card
              key={offer.id}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            >
              {offer.trending && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    🔥 Trending
                  </Badge>
                </div>
              )}
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {offer.icon}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{offer.category}</Badge>
                  <Badge variant="secondary" className="font-semibold">
                    {offer.commission}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {offer.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {offer.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            All offers are curated and verified for quality and conversion rates
          </p>
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span>High Conversion Rates</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Verified Programs</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <span>Competitive Payouts</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}