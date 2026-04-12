import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X, LogOut, Settings, Zap, BarChart3, Link2 } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              AffiliatePro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/traffic-channels" className="text-sm font-medium hover:text-primary transition-colors">
                  Traffic
                </Link>
                <Link href="/integration-hub" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                  <Link2 className="h-4 w-4" />
                  Integrations
                </Link>
                <Link href="/settings" className="text-sm font-medium hover:text-primary transition-colors">
                  Settings
                </Link>
                <ThemeSwitch />
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
                  How It Works
                </Link>
                <Link href="/traffic-sources" className="text-sm font-medium hover:text-primary transition-colors">
                  Traffic Sources
                </Link>
                <Link href="/integration-hub" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                  <Link2 className="h-4 w-4" />
                  Integrations
                </Link>
                <ThemeSwitch />
                <Link href="/dashboard">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="block text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/traffic-channels" className="block text-sm font-medium hover:text-primary transition-colors">
                  Traffic
                </Link>
                <Link href="/integration-hub" className="block text-sm font-medium hover:text-primary transition-colors">
                  Integrations
                </Link>
                <Link href="/settings" className="block text-sm font-medium hover:text-primary transition-colors">
                  Settings
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/#how-it-works" className="block text-sm font-medium hover:text-primary transition-colors">
                  How It Works
                </Link>
                <Link href="/traffic-sources" className="block text-sm font-medium hover:text-primary transition-colors">
                  Traffic Sources
                </Link>
                <Link href="/integration-hub" className="block text-sm font-medium hover:text-primary transition-colors">
                  Integrations
                </Link>
                <Link href="/dashboard">
                  <Button size="sm" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}