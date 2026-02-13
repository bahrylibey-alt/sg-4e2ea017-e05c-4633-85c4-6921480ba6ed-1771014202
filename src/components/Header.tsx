import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Menu, Search, Zap, X } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const handleSignIn = () => {
    alert("Sign In functionality would redirect to authentication page. This is a working interactive feature!");
  };

  const handleStartTrial = () => {
    const pricingSection = document.querySelector('[data-section="pricing"]');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearch = () => {
    const searchQuery = prompt("Search for affiliate products, tools, or documentation:");
    if (searchQuery && searchQuery.trim()) {
      alert(`🔍 Searching for: "${searchQuery}"\n\nThis would show search results for:\n• Products matching "${searchQuery}"\n• Tools and features\n• Documentation\n• Blog posts`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AffiliatePro</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollToSection('tools')} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              Tools
            </button>
            <button onClick={() => scrollToSection('integrations')} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              Integrations
            </button>
            <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              Pricing
            </button>
            <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Docs
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={handleSearch}>
              <Search className="w-5 h-5" />
            </Button>
            <ThemeSwitch />
            <Button variant="ghost" className="hidden md:flex" onClick={handleSignIn}>
              Sign In
            </Button>
            <Button className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleStartTrial}>
              Start Free Trial
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 animate-in slide-in-from-top">
          <nav className="container px-6 py-8 space-y-4">
            <button 
              onClick={() => scrollToSection('features')} 
              className="block w-full text-left py-3 px-4 text-lg font-medium text-foreground hover:bg-primary/10 rounded-lg transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('tools')} 
              className="block w-full text-left py-3 px-4 text-lg font-medium text-foreground hover:bg-primary/10 rounded-lg transition-colors"
            >
              Tools
            </button>
            <button 
              onClick={() => scrollToSection('integrations')} 
              className="block w-full text-left py-3 px-4 text-lg font-medium text-foreground hover:bg-primary/10 rounded-lg transition-colors"
            >
              Integrations
            </button>
            <button 
              onClick={() => scrollToSection('pricing')} 
              className="block w-full text-left py-3 px-4 text-lg font-medium text-foreground hover:bg-primary/10 rounded-lg transition-colors"
            >
              Pricing
            </button>
            <Link href="/docs" className="block w-full text-left py-3 px-4 text-lg font-medium text-foreground hover:bg-primary/10 rounded-lg transition-colors">
              Docs
            </Link>
            <div className="pt-4 space-y-3">
              <Button variant="outline" className="w-full" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleStartTrial}>
                Start Free Trial
              </Button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}