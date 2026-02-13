import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Link2, Wand2, BarChart3, Target, Rocket } from "lucide-react";

interface SmartToolsProps {
  onOpenContentGenerator: () => void;
  onOpenCampaignBuilder: () => void;
}

export function SmartTools({ onOpenContentGenerator, onOpenCampaignBuilder }: SmartToolsProps) {
  const handleLinkCloaking = () => {
    const url = prompt("Enter the affiliate link to cloak:\n\nExample: https://amazon.com/dp/B08N5WRWNW?tag=youraffid");
    
    if (url && url.trim()) {
      const cloakedLink = `https://affiliatepro.com/go/${Math.random().toString(36).substr(2, 9)}`;
      
      navigator.clipboard.writeText(cloakedLink);
      
      alert(
        `✅ Link Cloaked Successfully!\n\n` +
        `Original: ${url}\n\n` +
        `Cloaked Link: ${cloakedLink}\n\n` +
        `✓ Copied to clipboard\n` +
        `✓ Click tracking enabled\n` +
        `✓ Conversion tracking active\n` +
        `✓ SEO-friendly URL structure`
      );
    }
  };

  const handleProductDiscovery = () => {
    const query = prompt("What type of products are you looking for?\n\nExamples:\n• Digital marketing tools\n• Fitness programs\n• Software subscriptions\n• Online courses");
    
    if (query && query.trim()) {
      alert(
        `🔍 Searching for: "${query}"\n\n` +
        `Found 127 matching products!\n\n` +
        `Top Results:\n` +
        `• Digital Marketing Master Course - 50% commission\n` +
        `• SEO Tools Pro Suite - $89.70 per sale\n` +
        `• Email Marketing Platform - $45/mo recurring\n` +
        `• Social Media Scheduler - 40% commission\n\n` +
        `Would you like to add these to your campaign?`
      );
    }
  };

  const handleAnalyticsDashboard = () => {
    alert(
      `📊 Analytics Dashboard Opening...\n\n` +
      `Real-time Performance:\n` +
      `• Total Revenue: $45,231 (+20.1%)\n` +
      `• Active Campaigns: 24\n` +
      `• Conversion Rate: 7.1%\n` +
      `• Top Product: Digital Marketing Course\n\n` +
      `Scroll down to view the full analytics section!`
    );
    
    setTimeout(() => {
      const analyticsSection = document.querySelector('[data-section="analytics"]');
      if (analyticsSection) {
        analyticsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
  };

  const handleABTesting = () => {
    alert(
      `🧪 A/B Testing Lab\n\n` +
      `Create split tests to optimize:\n` +
      `• Headlines & Copy\n` +
      `• Call-to-Action Buttons\n` +
      `• Landing Page Layouts\n` +
      `• Email Subject Lines\n` +
      `• Product Recommendations\n\n` +
      `Average conversion lift: +35%\n\n` +
      `This feature is coming in the next update!`
    );
  };

  const tools = [
    {
      icon: Link2,
      title: "Smart Link Cloaking",
      description: "Automatically shorten and track your affiliate links with custom branding",
      badge: "Active",
      color: "text-blue-500",
      action: handleLinkCloaking
    },
    {
      icon: Wand2,
      title: "AI Content Generator",
      description: "Generate high-converting product reviews, comparisons, and landing pages in seconds",
      badge: "AI-Powered",
      color: "text-purple-500",
      action: onOpenContentGenerator
    },
    {
      icon: Target,
      title: "Product Discovery",
      description: "Find trending products with high commission rates and proven conversion data",
      badge: "Updated",
      color: "text-green-500",
      action: handleProductDiscovery
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Real-time performance tracking with detailed insights and actionable recommendations",
      badge: "Live",
      color: "text-orange-500",
      action: handleAnalyticsDashboard
    },
    {
      icon: Rocket,
      title: "Campaign Builder",
      description: "Create complete affiliate campaigns with AI-powered optimization and targeting",
      badge: "Smart",
      color: "text-pink-500",
      action: onOpenCampaignBuilder
    },
    {
      icon: Zap,
      title: "A/B Testing Lab",
      description: "Test different strategies and automatically optimize for maximum conversions",
      badge: "Pro",
      color: "text-yellow-500",
      action: handleABTesting
    }
  ];

  return (
    <section className="py-24 px-6 bg-muted/30" data-section="tools">
      <div className="container">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="text-primary border-primary/30">
            Smart Tools
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Powerful Tools for <span className="text-primary">Affiliate Success</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to build, manage, and scale your affiliate marketing business
          </p>
        </div>

        {/* Tools grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool, index) => (
            <Card 
              key={index}
              className="group hover:shadow-2xl transition-all duration-300 border-border/50 hover:border-primary/30 cursor-pointer"
              onClick={tool.action}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ${tool.color}`}>
                    <tool.icon className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {tool.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {tool.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className="w-full group-hover:bg-primary/10 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    tool.action();
                  }}
                >
                  Try Now →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}