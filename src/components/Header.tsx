import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Menu, Search, Zap } from "lucide-react";

export function Header() {
  return (
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
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="/tools" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Tools
          </Link>
          <Link href="/integrations" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Integrations
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Docs
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="w-5 h-5" />
          </Button>
          <ThemeSwitch />
          <Button variant="ghost" className="hidden md:flex">
            Sign In
          </Button>
          <Button className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground">
            Start Free Trial
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}