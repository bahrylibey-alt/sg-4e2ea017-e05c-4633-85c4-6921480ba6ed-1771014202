import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Bot, 
  Brain,
  TrendingUp, 
  CheckCircle, 
  Globe,
  Target,
  DollarSign,
  ArrowRight,
  Rocket,
  LineChart,
  Share2,
  Lightbulb,
  Clock,
  BarChart3,
  MessageSquare,
  Mail,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Link2,
  Smartphone,
  Layers,
  Settings,
  Shield,
  Cpu,
  Activity,
  Eye,
  MousePointerClick,
  TrendingDown,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <SEO 
        title="AffiliatePro - Revolutionary AI Affiliate Marketing System"
        description="The world's first 100% autonomous affiliate marketing system. Real traffic, real conversions, real revenue. No mock data. No manual work."
      />
      <Header />

      <main className="container mx-auto px-4 pt-20 pb-16">
        {/* Hero Section */}
        <section className="text-center mb-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 blur-3xl -z-10" />
          <Badge className="mb-4 text-sm px-4 py-1 bg-gradient-to-r from-primary to-purple-600 text-white border-0">
            <Shield className="w-3 h-3 mr-1" />
            100% Real Data • Zero Mock • Fully Verified
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            The First True<br/>Autonomous Affiliate System
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            While others sell you templates and tutorials, we built the machine that does everything
          </p>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Real AI • Real traffic • Real validation • Real revenue tracking • Real decisions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg h-16 px-10 bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:opacity-90 shadow-2xl shadow-primary/20">
                <Rocket className="w-6 h-6 mr-2" />
                Launch Your Empire
              </Button>
            </Link>
            <Link href="/test-complete-system">
              <Button size="lg" variant="outline" className="text-lg h-16 px-10 border-2">
                <Activity className="w-6 h-6 mr-2" />
                Test System
              </Button>
            </Link>
          </div>
        </section>

        {/* Revolutionary Features - What Makes Us Different */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-orange-500 text-white">Revolutionary Technology</Badge>
            <h2 className="text-4xl font-bold mb-4">What Makes This Different</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Other platforms give you tools. We give you a fully autonomous system.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-green-500/50 bg-gradient-to-br from-green-50/50 to-background dark:from-green-950/20">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle>100% Real Data</CardTitle>
                <CardDescription>
                  Every number is verified. Every click tracked. Every conversion authenticated.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Link health monitoring (auto-removes broken products)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Webhook-only revenue (no fake estimates)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Real traffic validation (actual Amazon/Temu pages)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/50 bg-gradient-to-br from-purple-50/50 to-background dark:from-purple-950/20">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <CardTitle>True AI Decision Engine</CardTitle>
                <CardDescription>
                  Not just automation. Real intelligence that learns and adapts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                    <span>Content DNA analysis (what makes posts perform)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                    <span>Scoring engine (WINNER/TESTING/LOSER classification)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                    <span>Auto-scaling (amplifies winners, kills losers)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500/50 bg-gradient-to-br from-blue-50/50 to-background dark:from-blue-950/20">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <Cpu className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Self-Healing Infrastructure</CardTitle>
                <CardDescription>
                  Automatically detects and fixes issues before you notice them.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <span>3-strike link removal (auto-deletes dead products)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <span>Traffic state detection (adapts strategy automatically)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <span>Auto-repair system (keeps database clean)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Setup Guide */}
        <section className="mb-20">
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">🚀 Quick Start - 3 Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <h3 className="font-semibold">Connect Networks</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Go to /integrations and connect Amazon, AliExpress, or other affiliate networks with valid API keys
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <h3 className="font-semibold">Find Products</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click "Find Products" in dashboard to discover products from your connected networks
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <h3 className="font-semibold">Enable Autopilot</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Turn on autopilot in /dashboard and let the AI handle everything automatically
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section>
          <Card className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white border-0 shadow-2xl">
            <CardContent className="pt-10 pb-10 text-center">
              <Rocket className="w-16 h-16 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-4">Stop Working. Start Scaling.</h2>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                The first affiliate system that actually runs itself. Real AI. Real data. Real results.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button size="lg" variant="secondary" className="h-16 px-12 text-lg font-semibold">
                    <Zap className="w-6 h-6 mr-2" />
                    Launch System
                  </Button>
                </Link>
                <Link href="/test-complete-system">
                  <Button size="lg" variant="outline" className="h-16 px-12 text-lg font-semibold bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Activity className="w-6 h-6 mr-2" />
                    Test System
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}