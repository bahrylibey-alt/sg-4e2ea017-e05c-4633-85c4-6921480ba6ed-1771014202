import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, TrendingUp, DollarSign } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]" />
      
      {/* Gradient orbs */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />

      <div className="container relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-6 py-2 text-sm font-medium backdrop-blur-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-primary">AI-Powered Affiliate Automation</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
            Build Your
            <span className="block mt-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Affiliate Empire
            </span>
            on Autopilot
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Launch profitable affiliate campaigns in minutes. Smart automation, AI-powered content generation, 
            and advanced analytics to maximize your commissions—all in one platform.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg group shadow-lg shadow-primary/25">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="border-2 px-8 py-6 text-lg backdrop-blur-sm">
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-16 max-w-3xl mx-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                <div className="text-3xl md:text-4xl font-bold text-foreground">$2.4M+</div>
              </div>
              <div className="text-sm text-muted-foreground">Generated Revenue</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <div className="text-3xl md:text-4xl font-bold text-foreground">15K+</div>
              </div>
              <div className="text-sm text-muted-foreground">Active Affiliates</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                <div className="text-3xl md:text-4xl font-bold text-foreground">99.9%</div>
              </div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="pt-12 flex items-center justify-center gap-8 flex-wrap opacity-60">
            <div className="text-sm font-medium">Trusted by</div>
            <div className="h-8 w-24 bg-muted/50 rounded flex items-center justify-center text-xs">Amazon</div>
            <div className="h-8 w-24 bg-muted/50 rounded flex items-center justify-center text-xs">ClickBank</div>
            <div className="h-8 w-24 bg-muted/50 rounded flex items-center justify-center text-xs">ShareASale</div>
            <div className="h-8 w-24 bg-muted/50 rounded flex items-center justify-center text-xs">CJ Affiliate</div>
          </div>
        </div>
      </div>
    </section>
  );
}