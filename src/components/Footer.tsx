import React from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube, Mail, Zap } from "lucide-react";

export function Footer() {
  const handleSocialClick = (platform: string) => {
    alert(`🔗 Opening ${platform}\n\nThis would redirect to AffiliatePro's ${platform} profile where you can:\n• Follow for updates\n• Connect with the community\n• Get tips and strategies\n• See success stories`);
  };

  const handleEmailClick = () => {
    window.location.href = 'mailto:support@affiliatepro.com';
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AffiliatePro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Build your affiliate empire with AI-powered automation. Smart tools, analytics, and integrations all in one platform.
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleSocialClick('Facebook')}
                className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Facebook className="w-4 h-4 text-primary" />
              </button>
              <button 
                onClick={() => handleSocialClick('Twitter')}
                className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Twitter className="w-4 h-4 text-primary" />
              </button>
              <button 
                onClick={() => handleSocialClick('Instagram')}
                className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Instagram className="w-4 h-4 text-primary" />
              </button>
              <button 
                onClick={() => handleSocialClick('YouTube')}
                className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Youtube className="w-4 h-4 text-primary" />
              </button>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href="/features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="/tools" className="text-sm text-muted-foreground hover:text-primary transition-colors">Smart Tools</Link></li>
              <li><Link href="/integrations" className="text-sm text-muted-foreground hover:text-primary transition-colors">Integrations</Link></li>
              <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/changelog" className="text-sm text-muted-foreground hover:text-primary transition-colors">Changelog</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><Link href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="/tutorials" className="text-sm text-muted-foreground hover:text-primary transition-colors">Tutorials</Link></li>
              <li><Link href="/support" className="text-sm text-muted-foreground hover:text-primary transition-colors">Support</Link></li>
              <li><Link href="/api" className="text-sm text-muted-foreground hover:text-primary transition-colors">API</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/careers" className="text-sm text-muted-foreground hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AffiliatePro. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <button onClick={handleEmailClick} className="hover:text-primary transition-colors cursor-pointer">
              support@affiliatepro.com
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}