import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, FileText, BarChart3, Link2, Sparkles, Zap } from "lucide-react";

const tools = [
  {
    icon: Bot,
    title: "AI Content Generator",
    description: "Create high-converting product reviews, comparisons, and landing pages in seconds using advanced AI.",
    badge: "Most Popular",
    color: "text-primary"
  },
  {
    icon: FileText,
    title: "Smart Link Cloaking",
    description: "Automatically cloak and track all affiliate links with branded URLs and advanced analytics.",
    badge: "Essential",
    color: "text-accent"
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Real-time tracking of clicks, conversions, and revenue with actionable insights and reports.",
    badge: "Pro Feature",
    color: "text-blue-500"
  },
  {
    icon: Link2,
    title: "Multi-Platform Integration",
    description: "Connect with Amazon, ClickBank, ShareASale, and 50+ affiliate networks seamlessly.",
    badge: "New",
    color: "text-orange-500"
  },
  {
    icon: Sparkles,
    title: "SEO Optimizer",
    description: "Automatic on-page SEO optimization to rank your affiliate content higher in search results.",
    badge: "Growth",
    color: "text-purple-500"
  },
  {
    icon: Zap,
    title: "Automated Campaigns",
    description: "Set up email sequences, social media posts, and content calendars that run on autopilot.",
    badge: "Automation",
    color: "text-yellow-500"
  }
];

export function SmartTools() {
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
              className="group hover:shadow-xl hover:border-primary/30 transition-all duration-300 relative overflow-hidden"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <CardHeader className="relative">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center ${tool.color}`}>
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
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}