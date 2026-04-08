import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Menu, X, Zap } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              AffiliatePro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <ThemeSwitch />
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeSwitch />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            <Link 
              href="/#features" 
              className="block px-4 py-2 hover:bg-accent rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/#pricing" 
              className="block px-4 py-2 hover:bg-accent rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/dashboard" 
              className="block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-center font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}