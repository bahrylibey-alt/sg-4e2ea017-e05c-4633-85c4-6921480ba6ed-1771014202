import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const integrations = [
  {
    name: "Amazon Associates",
    description: "Connect your Amazon affiliate account and start promoting millions of products",
    logo: "🛒",
    category: "E-commerce",
    connected: true
  },
  {
    name: "ClickBank",
    description: "Access thousands of digital products with high commission rates",
    logo: "💳",
    category: "Digital Products",
    connected: true
  },
  {
    name: "ShareASale",
    description: "Join one of the largest affiliate networks with premium brands",
    logo: "🤝",
    category: "Affiliate Network",
    connected: false
  },
  {
    name: "CJ Affiliate",
    description: "Partner with top brands and access exclusive offers",
    logo: "🎯",
    category: "Affiliate Network",
    connected: true
  },
  {
    name: "Mailchimp",
    description: "Automate email campaigns and build your subscriber list",
    logo: "📧",
    category: "Email Marketing",
    connected: false
  },
  {
    name: "Google Analytics",
    description: "Track detailed visitor behavior and conversion data",
    logo: "📊",
    category: "Analytics",
    connected: true
  },
  {
    name: "Stripe",
    description: "Accept payments and manage subscriptions seamlessly",
    logo: "💰",
    category: "Payments",
    connected: false
  },
  {
    name: "Zapier",
    description: "Connect 5,000+ apps and automate workflows",
    logo: "⚡",
    category: "Automation",
    connected: false
  },
  {
    name: "WordPress",
    description: "Seamlessly integrate with your WordPress sites",
    logo: "📝",
    category: "CMS",
    connected: true
  }
];

export function Integrations() {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="text-accent border-accent/30">
            Integrations
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Connect With Your <span className="text-accent">Favorite Tools</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Seamlessly integrate with 50+ platforms and services to supercharge your affiliate business
          </p>
        </div>

        {/* Integrations grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration, index) => (
            <Card 
              key={index}
              className="hover:shadow-lg hover:border-primary/30 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-4xl">{integration.logo}</div>
                  {integration.connected ? (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      <Check className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      Available
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{integration.name}</CardTitle>
                <CardDescription className="text-sm">
                  {integration.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {integration.category}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant={integration.connected ? "outline" : "default"}
                  >
                    {integration.connected ? "Manage" : "Connect"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Need a custom integration? We can build it for you.
          </p>
          <Button size="lg" variant="outline">
            Request Integration
          </Button>
        </div>
      </div>
    </section>
  );
}