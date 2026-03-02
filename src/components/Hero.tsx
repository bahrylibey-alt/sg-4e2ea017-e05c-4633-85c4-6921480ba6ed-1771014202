import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, TrendingUp, Target, Sparkles, Rocket, Bot } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(120,119,198,0.1),transparent_50%)]" />
      
      <div className="container relative z-10">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <Badge variant="outline" className="px-4 py-2 text-sm font-medium border-primary/30 bg-primary/5 animate-pulse">
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            One-Click Autopilot System • 100% Automated Traffic
          </Badge>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Autopilot Affiliate
            </span>
            <br />
            <span className="text-foreground">Marketing Revolution</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl leading-relaxed">
            Launch complete affiliate campaigns in <span className="font-bold text-primary">one click</span>. 
            AI automatically generates links, drives free traffic, and optimizes for maximum conversions. 
            <span className="font-bold text-foreground"> No work required.</span>
          </p>

          {/* Key Features List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
            <div className="flex items-center gap-3 p-4 bg-background/50 backdrop-blur-sm rounded-lg border border-primary/20">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">One-Click Launch</div>
                <div className="text-xs text-muted-foreground">Campaign ready in 30 seconds</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-background/50 backdrop-blur-sm rounded-lg border border-primary/20">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Free Traffic</div>
                <div className="text-xs text-muted-foreground">8 automated channels</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-background/50 backdrop-blur-sm rounded-lg border border-primary/20">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">AI Optimization</div>
                <div className="text-xs text-muted-foreground">24/7 performance tuning</div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-lg shadow-primary/25">
                <Rocket className="w-5 h-5 mr-2" />
                Launch Autopilot Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
              <Target className="w-5 h-5 mr-2" />
              See How It Works
            </Button>
          </div>

          {/* Social Proof */}
          <div className="pt-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-background" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 border-2 border-background" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 border-2 border-background" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 border-2 border-background" />
              </div>
              <span className="font-semibold">2,847 affiliates</span> earning with autopilot today
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span><span className="font-bold text-foreground">$1.2M+</span> in commissions</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span><span className="font-bold text-foreground">847K+</span> clicks generated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Preview Image (optional) */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="relative rounded-xl overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-600/10" />
            <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-slate-400 font-medium">Live Autopilot Dashboard</span>
                </div>
                <div className="text-6xl font-black text-white/20">
                  AUTOPILOT
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}