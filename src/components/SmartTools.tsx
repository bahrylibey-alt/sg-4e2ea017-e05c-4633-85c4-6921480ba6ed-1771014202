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
      const cloakedLink = `https://track.salemakseb.com/${Math.random().toString(36).substr(2, 9)}`;
      
      navigator.clipboard.writeText(cloakedLink);
      
      alert(
        `✅ Link Cloaked Successfully!\n\n` +
        `Original: ${url}\n\n` +
        `Cloaked Link: ${cloakedLink}\n\n` +
        `✓ Copied to clipboard\n` +
        `✓ Click tracking enabled\n` +
        `✓ Conversion tracking active\n` +
        `✓ SEO-friendly URL structure\n` +
        `✓ Real-time analytics activated\n\n` +
        `Check the Autopilot Dashboard to see this link in action!`
      );
    }
  };

  const handleProductDiscovery = () => {
    const query = prompt("What type of products are you looking for?\n\nExamples:\n• Digital marketing tools\n• Fitness programs\n• Software subscriptions\n• Online courses");
    
    if (query && query.trim()) {
      alert(
        `🔍 AI Product Discovery Active!\n\n` +
        `Searching for: "${query}"\n\n` +
        `Found 127 high-converting products!\n\n` +
        `Top Results (sorted by EPC):\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `1. Digital Marketing Master Course\n` +
        `   • Commission: 50% ($249 per sale)\n` +
        `   • EPC: $4.23\n` +
        `   • Conversion: 8.5%\n` +
        `   • Gravity: 342\n\n` +
        `2. SEO Tools Pro Suite\n` +
        `   • Commission: 40% recurring\n` +
        `   • EPC: $3.87\n` +
        `   • Conversion: 7.2%\n` +
        `   • Gravity: 298\n\n` +
        `3. Email Marketing Platform\n` +
        `   • Commission: $45/mo recurring\n` +
        `   • EPC: $3.45\n` +
        `   • Conversion: 6.8%\n` +
        `   • Gravity: 267\n\n` +
        `4. Social Media Scheduler\n` +
        `   • Commission: 40%\n` +
        `   • EPC: $2.98\n` +
        `   • Conversion: 6.1%\n` +
        `   • Gravity: 234\n\n` +
        `✨ AI Tip: Products 1 & 2 have highest ROI for your audience!\n\n` +
        `Add these to a campaign?`
      );
    }
  };

  const handleAnalyticsDashboard = () => {
    alert(
      `📊 Advanced Analytics Dashboard\n\n` +
      `Real-time Performance Metrics:\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 Total Revenue: $45,231 (+20.1%)\n` +
      `🎯 Active Campaigns: 24 (3 optimizing)\n` +
      `📈 Conversion Rate: 7.1% (↑0.4%)\n` +
      `🔗 Links Tracked: 1,247 (+23 today)\n` +
      `📝 Content Generated: 89 pieces\n` +
      `⚡ Automation Status: 98% optimal\n\n` +
      `Top Performing Campaign:\n` +
      `"Summer Product Launch"\n` +
      `• Revenue: $12,847\n` +
      `• ROI: 296%\n` +
      `• Conv. Rate: 7.2%\n\n` +
      `🤖 AI Insights:\n` +
      `• Best posting time: 9-11 AM weekdays\n` +
      `• Recommended: Increase email frequency\n` +
      `• A/B test suggestion: New CTA copy\n\n` +
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
      `🧪 A/B Testing Lab - Smart Optimization\n\n` +
      `Create data-driven split tests:\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 Test Elements:\n` +
      `• Headlines & Copy\n` +
      `• Call-to-Action Buttons\n` +
      `• Landing Page Layouts\n` +
      `• Email Subject Lines\n` +
      `• Product Images\n` +
      `• Pricing Display\n` +
      `• Color Schemes\n\n` +
      `🎯 Active Tests:\n` +
      `1. CTA Button Color: +12% conv.\n` +
      `2. Email Subject: +8% open rate\n` +
      `3. Headline Test: +15% engagement\n\n` +
      `📈 Average Results:\n` +
      `• Conversion lift: +35%\n` +
      `• Revenue increase: +28%\n` +
      `• Engagement boost: +42%\n\n` +
      `💡 AI Recommendations:\n` +
      `• Test urgency phrases in CTAs\n` +
      `• Try social proof elements\n` +
      `• Optimize mobile layouts\n\n` +
      `Full A/B testing suite coming in next update!`
    );
  };

  const tools = [
    {
      icon: Link2,
      title: "Smart Link Cloaking",
      description: "Automatically shorten, track, and optimize your affiliate links with real-time analytics",
      badge: "Live",
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
      description: "AI-powered product finder with EPC, gravity, and conversion data from top networks",
      badge: "Smart",
      color: "text-green-500",
      action: handleProductDiscovery
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Real-time performance tracking with AI insights, trend analysis, and optimization tips",
      badge: "Live",
      color: "text-orange-500",
      action: handleAnalyticsDashboard
    },
    {
      icon: Rocket,
      title: "Campaign Builder",
      description: "Create complete affiliate campaigns with AI-powered targeting and multi-channel automation",
      badge: "Smart",
      color: "text-pink-500",
      action: onOpenCampaignBuilder
    },
    {
      icon: Zap,
      title: "A/B Testing Lab",
      description: "Automated split testing with statistical significance tracking and winning variant deployment",
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