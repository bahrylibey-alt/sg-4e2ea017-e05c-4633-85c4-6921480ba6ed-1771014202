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
  BarChart3
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEO 
        title="AffiliatePro - AI-Powered Affiliate Marketing Automation"
        description="Complete affiliate marketing system with AI autopilot, product discovery, content generation, and social media automation"
      />
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <Badge className="mb-4">AI-Powered Automation</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Your Complete Affiliate<br/>Marketing Autopilot
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover trending products, generate content, optimize performance, and automate social media—all managed by AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg h-14 px-8">
                <Zap className="w-5 h-5 mr-2" />
                Launch Dashboard
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg h-14 px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Overview */}
        <section id="features" className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Complete Automation Suite</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 hover:shadow-lg transition-shadow border-2 border-primary/20">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Autopilot</h3>
              <p className="text-muted-foreground mb-6">
                24/7 automated system discovers products, generates content, and publishes to social media
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Runs on server (not browser)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Auto product discovery
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Content generation
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow border-2 border-blue-500/20">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Social Connect</h3>
              <p className="text-muted-foreground mb-6">
                One-click social media setup - post automatically to 5 platforms forever
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Facebook & Instagram
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  TikTok & YouTube Shorts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Auto-scheduling
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow border-2 border-pink-500/20">
              <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Wand2 className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Magic Tools</h3>
              <p className="text-muted-foreground mb-6">
                7 revolutionary AI tools: Viral Predictor, Video Generator, Revenue Heatmap & more
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-pink-600" />
                  AI viral prediction
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-pink-600" />
                  Auto video creation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-pink-600" />
                  Competitor intelligence
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <CardTitle className="text-lg">Discover Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  AI finds trending products from Amazon, Temu, and AliExpress automatically
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <CardTitle className="text-lg">Generate Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  AI writes SEO-optimized articles and social media posts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <CardTitle className="text-lg">Auto-Post</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  System posts to Facebook, TikTok, YouTube, Instagram automatically
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">4</span>
                </div>
                <CardTitle className="text-lg">Track & Optimize</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Real-time analytics and AI optimization for maximum revenue
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Social Proof */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardContent className="pt-8">
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">1000+</div>
                  <div className="text-sm text-muted-foreground">Products Discovered</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
                  <div className="text-sm text-muted-foreground">Content Pieces Generated</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-pink-600 mb-2">100K+</div>
                  <div className="text-sm text-muted-foreground">Social Posts Published</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-600 mb-2">$2M+</div>
                  <div className="text-sm text-muted-foreground">Revenue Generated</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Simple Pricing</h2>
          <Card className="max-w-md mx-auto border-2 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Pro Plan</CardTitle>
              <div className="text-4xl font-bold my-4">$97<span className="text-lg font-normal text-muted-foreground">/month</span></div>
              <CardDescription>Everything you need to succeed</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Unlimited product discovery</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>AI content generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>5 social media platforms</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>7 magic AI tools</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>24/7 autopilot system</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Real-time analytics</span>
                </li>
              </ul>
              <Link href="/dashboard">
                <Button className="w-full" size="lg">
                  Get Started Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section>
          <Card className="bg-gradient-to-r from-primary to-purple-600 text-white border-0">
            <CardContent className="pt-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Automate Your Affiliate Business?</h2>
              <p className="text-lg mb-6 text-white/90">
                Join thousands of marketers using AI to scale their income on autopilot
              </p>
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="h-14 px-8 text-lg">
                  <Zap className="w-5 h-5 mr-2" />
                  Launch Your Dashboard
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