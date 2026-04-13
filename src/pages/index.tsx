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
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="text-lg h-16 px-10 border-2">
                See The System
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

        {/* The Intelligence Layer */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-purple-500 text-white">
              <Brain className="w-3 h-3 mr-1" />
              Intelligence Layer
            </Badge>
            <h2 className="text-4xl font-bold mb-4">7 AI Systems Working 24/7</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Each one handles a specific part of the machine. Together, they run your entire business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-xl transition-all border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">Real-Time</Badge>
                </div>
                <CardTitle className="text-lg">Scoring Engine</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Classifies every post as WINNER, TESTING, or LOSER based on real performance data
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all border-2 border-blue-500/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">Autonomous</Badge>
                </div>
                <CardTitle className="text-lg">Decision Engine</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Makes scaling decisions: amplify, maintain, or kill — all without human input
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all border-2 border-green-500/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-green-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">Intelligent</Badge>
                </div>
                <CardTitle className="text-lg">Content DNA</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Analyzes what makes content perform: hooks, timing, platform, product match
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all border-2 border-purple-500/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">Predictive</Badge>
                </div>
                <CardTitle className="text-lg">Traffic Intelligence</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Detects traffic states (NO_DATA → TESTING → SCALING) and adapts strategy
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all border-2 border-orange-500/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-orange-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">Self-Healing</Badge>
                </div>
                <CardTitle className="text-lg">Link Health Monitor</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Validates actual product pages, tracks failures, auto-removes dead links (3-strike system)
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all border-2 border-pink-500/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center">
                    <MousePointerClick className="w-5 h-5 text-pink-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">Verified</Badge>
                </div>
                <CardTitle className="text-lg">Click Tracker</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Real click tracking via redirect system — every click is logged with platform source
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all border-2 border-cyan-500/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-cyan-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">Actionable</Badge>
                </div>
                <CardTitle className="text-lg">AI Insights</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Generates recommendations: best platforms, top hooks, next steps — all data-driven
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Real-Time Validation */}
        <section className="mb-20">
          <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50/50 to-background dark:from-green-950/20">
            <CardContent className="pt-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-green-600" />
                  <h3 className="text-xl font-bold mb-2">Webhook Verification</h3>
                  <p className="text-sm text-muted-foreground">
                    Revenue = $0 until affiliate network sends webhook. No estimates. No projections. Only real money.
                  </p>
                </div>
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-bold mb-2">Live Link Validation</h3>
                  <p className="text-sm text-muted-foreground">
                    Checks actual Amazon/Temu pages. 3 failures = auto-delete. Your database stays clean automatically.
                  </p>
                </div>
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-xl font-bold mb-2">Real Traffic Only</h3>
                  <p className="text-sm text-muted-foreground">
                    Every view tracked via posted_content. Every click via redirect logs. Zero fake numbers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Traffic Sources Section */}
        <section id="traffic-sources" className="mb-20">
          <div className="text-center mb-12">
            <Badge className="mb-4">8 Automated Traffic Channels</Badge>
            <h2 className="text-4xl font-bold mb-4">Free Traffic on Autopilot</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect once, post forever. AI handles content creation and distribution.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: "Pinterest", icon: Share2, gradient: "from-red-500 to-pink-600", traffic: "100-500/mo" },
              { name: "Twitter/X", icon: Twitter, gradient: "from-sky-500 to-blue-600", traffic: "100-500/mo" },
              { name: "Facebook", icon: Facebook, gradient: "from-blue-600 to-blue-800", traffic: "200-1K/mo" },
              { name: "Instagram", icon: Instagram, gradient: "from-pink-500 to-purple-600", traffic: "300-1.5K/mo" },
              { name: "YouTube", icon: Youtube, gradient: "from-red-600 to-red-800", traffic: "500-3K/mo" },
              { name: "Reddit", icon: MessageSquare, gradient: "from-orange-500 to-red-600", traffic: "500-2K/mo" },
              { name: "LinkedIn", icon: Linkedin, gradient: "from-blue-700 to-blue-900", traffic: "100-800/mo" },
              { name: "Email", icon: Mail, gradient: "from-blue-500 to-purple-600", traffic: "200-1K/mo" },
            ].map((platform, idx) => (
              <Card key={idx} className="hover:shadow-xl transition-all">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${platform.gradient} rounded-2xl flex items-center justify-center mb-4`}>
                    <platform.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">{platform.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">{platform.traffic}</div>
                  <div className="text-xs text-muted-foreground">visitors/month</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/traffic-channels">
              <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600">
                <Settings className="w-5 h-5 mr-2" />
                Manage Traffic Channels
              </Button>
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mb-20">
          <h2 className="text-4xl font-bold mb-4 text-center">How The Machine Works</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Set it up once. The AI handles everything else.
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: "1", title: "Connect & Configure", desc: "Link affiliate networks and social accounts. Takes 10 minutes.", color: "primary" },
              { num: "2", title: "AI Discovers Products", desc: "System finds trending products that match your niche automatically.", color: "blue-600" },
              { num: "3", title: "Content Generation", desc: "Creates optimized posts with hooks, hashtags, and timing intelligence.", color: "purple-600" },
              { num: "4", title: "Autonomous Optimization", desc: "Tracks performance, scales winners, kills losers — no human decisions needed.", color: "green-600" },
            ].map((step, idx) => (
              <Card key={idx} className={`border-2 border-${step.color}/20`}>
                <CardHeader>
                  <div className={`w-12 h-12 rounded-full bg-${step.color}/10 flex items-center justify-center mb-4`}>
                    <span className={`text-2xl font-bold text-${step.color}`}>{step.num}</span>
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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
                <Link href="/traffic-test">
                  <Button size="lg" variant="outline" className="h-16 px-12 text-lg font-semibold bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Activity className="w-6 h-6 mr-2" />
                    Test Health Monitor
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