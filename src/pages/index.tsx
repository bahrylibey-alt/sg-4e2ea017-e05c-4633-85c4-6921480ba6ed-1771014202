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
  Sparkles, 
  TrendingUp, 
  CheckCircle, 
  Globe,
  Target,
  DollarSign,
  ArrowRight,
  Wand2,
  Activity,
  Users,
  BarChart3,
  Brain,
  Rocket,
  LineChart
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEO 
        title="AffiliatePro - Profit-Seeking AI Autopilot for Affiliate Marketing"
        description="Complete affiliate system with AI intelligence that tracks, scores, and scales winners automatically. Discover → Generate → Post → Track → Score → Decide → Scale"
      />
      <Header />

      <main className="container mx-auto px-4 pt-20 pb-16">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <Badge className="mb-4 text-sm px-4 py-1">AI-Powered Profit Intelligence</Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            Autopilot That Actually<br/>Makes You Money
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            Not just automation—<span className="font-bold text-foreground">profit-seeking intelligence</span> that discovers, tests, and scales winners automatically
          </p>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Track → Score → Decide → Scale
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg h-16 px-10 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                <Zap className="w-6 h-6 mr-2" />
                Launch Dashboard
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="text-lg h-16 px-10">
                See How It Works
              </Button>
            </Link>
          </div>
        </section>

        {/* Intelligence Layer Highlight */}
        <section className="mb-20">
          <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-purple-500/5">
            <CardContent className="pt-8">
              <div className="text-center mb-8">
                <Brain className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h2 className="text-3xl font-bold mb-3">Profit-Seeking Intelligence Layer</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Not random posting—smart decisions based on real performance data
                </p>
              </div>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-background rounded-lg border">
                  <Target className="w-10 h-10 mx-auto mb-3 text-green-600" />
                  <h3 className="font-bold mb-2">Track</h3>
                  <p className="text-sm text-muted-foreground">Every click, conversion, revenue tracked</p>
                </div>
                <div className="text-center p-6 bg-background rounded-lg border">
                  <BarChart3 className="w-10 h-10 mx-auto mb-3 text-blue-600" />
                  <h3 className="font-bold mb-2">Score</h3>
                  <p className="text-sm text-muted-foreground">Performance scores: testing → scaling → killed</p>
                </div>
                <div className="text-center p-6 bg-background rounded-lg border">
                  <Brain className="w-10 h-10 mx-auto mb-3 text-purple-600" />
                  <h3 className="font-bold mb-2">Decide</h3>
                  <p className="text-sm text-muted-foreground">AI makes scale/kill decisions automatically</p>
                </div>
                <div className="text-center p-6 bg-background rounded-lg border">
                  <Rocket className="w-10 h-10 mx-auto mb-3 text-pink-600" />
                  <h3 className="font-bold mb-2">Scale</h3>
                  <p className="text-sm text-muted-foreground">Winners get more content & priority</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Main Features */}
        <section id="features" className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Complete Automation + Intelligence</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-xl transition-all border-2 border-primary/20 hover:border-primary/40">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Autopilot Engine</h3>
              <p className="text-muted-foreground mb-6">
                Runs 24/7 on server—discovers products, generates content, posts automatically
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Continuous background execution</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Smart product discovery from Amazon, Temu</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>AI content generation with DNA tracking</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all border-2 border-blue-500/20 hover:border-blue-500/40">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                <LineChart className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Profit Intelligence</h3>
              <p className="text-muted-foreground mb-6">
                Real-time scoring, decision-making, and winner identification
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>Performance scoring (CTR, conversion, revenue)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>Auto scale winners, kill losers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>Priority queue—best products first</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all border-2 border-pink-500/20 hover:border-pink-500/40">
              <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Social Automation</h3>
              <p className="text-muted-foreground mb-6">
                One-click setup—post to 5 platforms forever automatically
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-pink-600 flex-shrink-0" />
                  <span>Facebook, Instagram, TikTok, YouTube</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-pink-600 flex-shrink-0" />
                  <span>Smart scheduling based on performance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-pink-600 flex-shrink-0" />
                  <span>Content DNA pattern learning</span>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mb-20">
          <h2 className="text-4xl font-bold mb-4 text-center">The Complete Intelligence Loop</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Discover → Generate → Post → Track → Score → Decide → Scale
          </p>
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <CardTitle className="text-lg">Discover Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  AI finds trending products from top affiliate networks
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <CardTitle className="text-lg">Generate & Post</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Creates content and publishes to social media automatically
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <CardTitle className="text-lg">Track & Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitors clicks, CTR, conversions—assigns performance scores
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-green-600">4</span>
                </div>
                <CardTitle className="text-lg">Decide & Scale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Scales winners, kills losers—optimizes for maximum profit
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-2 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">The Intelligence Difference</h3>
                  <p className="text-sm text-muted-foreground">What makes this system actually work</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-background p-4 rounded-lg border">
                  <p className="text-sm"><span className="font-bold text-red-600">❌ Without Intelligence:</span> Posts 100 products randomly, wastes time on losers</p>
                </div>
                <div className="bg-background p-4 rounded-lg border">
                  <p className="text-sm"><span className="font-bold text-green-600">✅ With Intelligence:</span> Tests, identifies winners, scales them 10x—kills losers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Social Proof */}
        <section className="mb-20">
          <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardContent className="pt-8">
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-5xl font-bold text-primary mb-2">2150+</div>
                  <div className="text-sm text-muted-foreground">Products Tested & Scored</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-blue-600 mb-2">89K+</div>
                  <div className="text-sm text-muted-foreground">Intelligence Decisions Made</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-pink-600 mb-2">226K+</div>
                  <div className="text-sm text-muted-foreground">Posts Optimized</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-green-600 mb-2">$2.4M+</div>
                  <div className="text-sm text-muted-foreground">Revenue Tracked</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Dashboard Preview */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold mb-4 text-center">Your Command Center</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Everything in one place—activity, intelligence, and profit
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Overview
                </CardTitle>
                <CardDescription>Campaign activity & stats</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                See all your products, content, and posts at a glance
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/40 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  AI Autopilot
                </CardTitle>
                <CardDescription>Intelligence control center</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                One-click enable/disable, live stats, run cycles manually
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/40 bg-green-50 dark:bg-green-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Profit Intelligence
                </CardTitle>
                <CardDescription>What's making money</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Revenue, CTR, conversion rates, top performers
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Simple, Powerful Pricing</h2>
          <Card className="max-w-md mx-auto border-2 border-primary/30 shadow-xl">
            <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-purple-500/10">
              <CardTitle className="text-3xl">Pro Intelligence</CardTitle>
              <div className="text-5xl font-bold my-6">$97<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
              <CardDescription className="text-base">The complete profit-seeking system</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Full Intelligence Layer</div>
                    <div className="text-sm text-muted-foreground">Track, score, decide, scale automatically</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">24/7 AI Autopilot</div>
                    <div className="text-sm text-muted-foreground">Continuous product discovery & content generation</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Profit Dashboard</div>
                    <div className="text-sm text-muted-foreground">Real-time revenue, CTR, best performers</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">5 Social Platforms</div>
                    <div className="text-sm text-muted-foreground">Auto-posting with smart scheduling</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Decision Engine</div>
                    <div className="text-sm text-muted-foreground">Auto scale winners, kill losers</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Content DNA</div>
                    <div className="text-sm text-muted-foreground">Learn & reuse winning patterns</div>
                  </div>
                </li>
              </ul>
              <Link href="/dashboard">
                <Button className="w-full h-14 text-lg bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                  Start Intelligence System
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Final CTA */}
        <section>
          <Card className="bg-gradient-to-r from-primary to-purple-600 text-white border-0 shadow-2xl">
            <CardContent className="pt-10 pb-10 text-center">
              <Rocket className="w-16 h-16 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-4">Stop Guessing. Start Scaling.</h2>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                The only affiliate system with built-in profit intelligence that actually learns and scales winners
              </p>
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="h-16 px-12 text-lg font-semibold">
                  <Zap className="w-6 h-6 mr-2" />
                  Launch Your Intelligence Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}