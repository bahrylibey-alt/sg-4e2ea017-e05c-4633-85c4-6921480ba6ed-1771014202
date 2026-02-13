import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, FileText, BarChart3, Link2, Sparkles, Zap } from "lucide-react";

interface SmartToolsProps {
  onOpenContentGenerator?: () => void;
}

const tools = [
  {
    icon: Bot,
    title: "AI Content Generator",
    description: "Create high-converting product reviews, comparisons, and landing pages in seconds using advanced AI.",
    badge: "Most Popular",
    color: "text-primary",
    action: "content-generator"
  },
  {
    icon: FileText,
    title: "Smart Link Cloaking",
    description: "Automatically cloak and track all affiliate links with branded URLs and advanced analytics.",
    badge: "Essential",
    color: "text-accent",
    action: "link-cloaking"
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Real-time tracking of clicks, conversions, and revenue with actionable insights and reports.",
    badge: "Pro Feature",
    color: "text-blue-500",
    action: "analytics"
  },
  {
    icon: Link2,
    title: "Multi-Platform Integration",
    description: "Connect with Amazon, ClickBank, ShareASale, and 50+ affiliate networks seamlessly.",
    badge: "New",
    color: "text-orange-500",
    action: "integrations"
  },
  {
    icon: Sparkles,
    title: "SEO Optimizer",
    description: "Automatic on-page SEO optimization to rank your affiliate content higher in search results.",
    badge: "Growth",
    color: "text-purple-500",
    action: "seo-optimizer"
  },
  {
    icon: Zap,
    title: "Automated Campaigns",
    description: "Set up email sequences, social media posts, and content calendars that run on autopilot.",
    badge: "Automation",
    color: "text-yellow-500",
    action: "automation"
  }
];

export function SmartTools({ onOpenContentGenerator }: SmartToolsProps) {
  const handleToolClick = (action: string) => {
    switch (action) {
      case "content-generator":
        if (onOpenContentGenerator) {
          onOpenContentGenerator();
        }
        break;
      case "link-cloaking":
        alert("🔗 Smart Link Cloaking\n\nTransform any affiliate link into:\n• Branded short URLs (yoursite.com/go/product)\n• Advanced click tracking\n• Geolocation data\n• Device analytics\n• A/B testing variants\n\nExample:\namazon.com/dp/B08X... → yoursite.com/recommends/wireless-earbuds\n\nClick 'Get Started' to set up your first cloaked link!");
        break;
      case "analytics":
        const analyticsSection = document.querySelector('[data-section="analytics"]');
        if (analyticsSection) {
          analyticsSection.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      case "integrations":
        const integrationsSection = document.querySelector('[data-section="integrations"]');
        if (integrationsSection) {
          integrationsSection.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      case "seo-optimizer":
        alert("🎯 SEO Optimizer\n\nAutomatic optimization includes:\n• Meta title & description generation\n• Header tag optimization (H1-H6)\n• Internal linking suggestions\n• Keyword density analysis\n• Schema markup generation\n• Image alt text optimization\n• Mobile-friendly checks\n• Page speed recommendations\n\nYour content will automatically rank higher in search results!");
        break;
      case "automation":
        alert("⚡ Automated Campaigns\n\nSet up once, run forever:\n\n📧 Email Sequences\n• Welcome series (7 emails)\n• Product recommendations\n• Re-engagement campaigns\n• Abandoned cart recovery\n\n📱 Social Media\n• Auto-post to Facebook, Twitter, Instagram\n• Optimal posting times\n• Hashtag optimization\n• Content recycling\n\n📅 Content Calendar\n• Schedule posts weeks in advance\n• Automated publishing\n• Multi-platform distribution\n\nSave 20+ hours per week!");
        break;
    }
  };

  return (
    <section className="py-24 px-6 bg-muted/30" data-section="tools">
      <div className="container">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="text-primary border-primary/30">
            Smart Tools
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Everything You Need to <span className="text-primary">Succeed</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful automation tools designed to maximize your affiliate revenue while minimizing your workload
          </p>
        </div>

        {/* Tools grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <Card 
              key={index}
              className="group hover:shadow-xl hover:border-primary/30 transition-all duration-300 relative overflow-hidden cursor-pointer"
              onClick={() => handleToolClick(tool.action)}
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <CardHeader className="relative">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center ${tool.color} group-hover:scale-110 transition-transform`}>
                    <tool.icon className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {tool.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {tool.title}
                </CardTitle>
                <CardDescription className="text-base">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Button 
                  variant="ghost" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
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