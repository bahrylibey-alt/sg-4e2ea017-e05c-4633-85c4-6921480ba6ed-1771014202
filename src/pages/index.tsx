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
  Settings
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEO 
        title="AffiliatePro - AI-Powered Affiliate Marketing Automation"
        description="Complete affiliate marketing system with AI intelligence, automatic traffic generation, and profit tracking. Get started in minutes."
      />
      <Header />

      <main className="container mx-auto px-4 pt-20 pb-16">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <Badge className="mb-4 text-sm px-4 py-1">AI-Powered Automation</Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            Affiliate Marketing<br/>on Autopilot
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            AI discovers products, creates content, posts automatically, and tracks every penny
          </p>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            8 traffic sources • 100% automation • Real-time insights
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg h-16 px-10 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                <Zap className="w-6 h-6 mr-2" />
                Start Free Now
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="text-lg h-16 px-10">
                See How It Works
              </Button>
            </Link>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="mb-20">
          <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardContent className="pt-8">
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-5xl font-bold text-primary mb-2">8</div>
                  <div className="text-sm text-muted-foreground">Traffic Sources</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-blue-600 mb-2">24/7</div>
                  <div className="text-sm text-muted-foreground">Automation</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-pink-600 mb-2">100%</div>
                  <div className="text-sm text-muted-foreground">Real Tracking</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-green-600 mb-2">$0</div>
                  <div className="text-sm text-muted-foreground">Setup Fee</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Traffic Sources Section - PROMINENT */}
        <section id="traffic-sources" className="mb-20">
          <div className="text-center mb-12">
            <Badge className="mb-4">8 Automated Traffic Channels</Badge>
            <h2 className="text-4xl font-bold mb-4">Free Traffic on Autopilot</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect once, post forever. Our AI handles content creation and distribution across all platforms.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-xl transition-all border-2 border-primary/20 hover:border-primary/40">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
                  <Share2 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg">Pinterest</CardTitle>
                <CardDescription>Auto-pin products</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">100-500</div>
                <div className="text-xs text-muted-foreground">visitors/month</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all border-2 border-blue-500/20 hover:border-blue-500/40">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <Twitter className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg">Twitter/X</CardTitle>
                <CardDescription>Auto-tweet deals</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">100-500</div>
                <div className="text-xs text-muted-foreground">visitors/month</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all border-2 border-blue-500/20 hover:border-blue-500/40">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mb-4">
                  <Facebook className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg">Facebook</CardTitle>
                <CardDescription>Group sharing</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">200-1K</div>
                <div className="text-xs text-muted-foreground">visitors/month</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all border-2 border-pink-500/20 hover:border-pink-500/40">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                  <Instagram className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg">Instagram</CardTitle>
                <CardDescription>Story automation</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-pink-600 mb-2">300-1.5K</div>
                <div className="text-xs text-muted-foreground">visitors/month</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all border-2 border-red-500/20 hover:border-red-500/40">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center mb-4">
                  <Youtube className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg">YouTube</CardTitle>
                <CardDescription>Community posts</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-2">500-3K</div>
                <div className="text-xs text-muted-foreground">visitors/month</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all border-2 border-orange-500/20 hover:border-orange-500/40">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg">Reddit</CardTitle>
                <CardDescription>Deal posting</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">500-2K</div>
                <div className="text-xs text-muted-foreground">visitors/month</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all border-2 border-blue-500/20 hover:border-blue-500/40">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl flex items-center justify-center mb-4">
                  <Linkedin className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg">LinkedIn</CardTitle>
                <CardDescription>Article publishing</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-blue-700 mb-2">100-800</div>
                <div className="text-xs text-muted-foreground">visitors/month</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all border-2 border-blue-500/20 hover:border-blue-500/40">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg">Email</CardTitle>
                <CardDescription>Drip campaigns</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">200-1K</div>
                <div className="text-xs text-muted-foreground">visitors/month</div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Link href="/traffic-channels">
              <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600">
                <Settings className="w-5 h-5 mr-2" />
                Manage Traffic Channels
              </Button>
            </Link>
          </div>
        </section>

        {/* AI Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge className="mb-4">Powered by AI</Badge>
            <h2 className="text-4xl font-bold mb-4">Intelligence That Works For You</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-xl transition-all border-2 border-primary/20">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Insights</h3>
              <p className="text-muted-foreground mb-6">
                Real-time performance analysis with actionable recommendations
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Channel performance scoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Content optimization tips</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Best posting times</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all border-2 border-blue-500/20">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Bot className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">24/7 Automation</h3>
              <p className="text-muted-foreground mb-6">
                Runs continuously on our servers - no manual work required
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span>Product discovery</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span>Content generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span>Auto-posting to all channels</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all border-2 border-green-500/20">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Real Tracking</h3>
              <p className="text-muted-foreground mb-6">
                100% verified data - no fake numbers or estimates
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Real click tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Verified conversions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Actual revenue only</span>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Integrations */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge className="mb-4">Easy Integration</Badge>
            <h2 className="text-4xl font-bold mb-4">Connect Your Favorite Tools</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Works seamlessly with the platforms you already use
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-all">
              <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Link2 className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Amazon Associates</h4>
              <p className="text-sm text-muted-foreground">Auto-discover products</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-all">
              <div className="w-12 h-12 mx-auto bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">Zapier</h4>
              <p className="text-sm text-muted-foreground">Auto-post to socials</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-all">
              <div className="w-12 h-12 mx-auto bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Stripe</h4>
              <p className="text-sm text-muted-foreground">Payment processing</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-all">
              <div className="w-12 h-12 mx-auto bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">More Networks</h4>
              <p className="text-sm text-muted-foreground">ShareASale, CJ, etc.</p>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link href="/integrations">
              <Button variant="outline" size="lg">
                <Settings className="w-5 h-5 mr-2" />
                View All Integrations
              </Button>
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mb-20">
          <h2 className="text-4xl font-bold mb-4 text-center">How It Works</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Four simple steps to automated affiliate income
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <CardTitle className="text-lg">Connect Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Link your affiliate networks and social media accounts
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <CardTitle className="text-lg">Launch Autopilot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  AI discovers products and creates engaging content
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <CardTitle className="text-lg">Auto-Post Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Content posted to 8 platforms automatically 24/7
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-green-600">4</span>
                </div>
                <CardTitle className="text-lg">Track & Optimize</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  AI insights show you what's working and scales winners
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section>
          <Card className="bg-gradient-to-r from-primary to-purple-600 text-white border-0 shadow-2xl">
            <CardContent className="pt-10 pb-10 text-center">
              <Rocket className="w-16 h-16 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-4">Ready to Automate Your Income?</h2>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                Join thousands using AI to scale affiliate marketing with zero manual work
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button size="lg" variant="secondary" className="h-16 px-12 text-lg font-semibold">
                    <Zap className="w-6 h-6 mr-2" />
                    Start Free Now
                  </Button>
                </Link>
                <Link href="/traffic-channels">
                  <Button size="lg" variant="outline" className="h-16 px-12 text-lg font-semibold bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Globe className="w-6 h-6 mr-2" />
                    View Traffic Sources
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