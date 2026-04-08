import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Menu, X, Zap, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

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
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/settings" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <ThemeSwitch />
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
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

        {/* Mobile Menu - Clean and consolidated */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-lg transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <LayoutDashboard className="w-5 h-5 text-primary" />
              Dashboard
            </Link>
            <Link 
              href="/settings" 
              className="flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-lg transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
              Settings
            </Link>
            <button 
              onClick={() => {
                handleSignOut();
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}