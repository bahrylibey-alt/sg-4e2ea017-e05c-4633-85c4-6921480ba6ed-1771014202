import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { SimplifiedAuthModal } from "@/components/SimplifiedAuthModal";
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Zap,
  TrendingUp,
  BarChart3,
  ChevronDown,
  User
} from "lucide-react";

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <Zap className="h-6 w-6 text-primary" />
              <span>Sale Makseb</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {user ? (
                <>
                  <Link href="/dashboard" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link href="/autopilot-center" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Zap className="h-4 w-4" />
                    AutoPilot
                  </Link>
                  <Link href="/settings" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <Button onClick={handleSignOut} variant="outline" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/#features" className="hover:text-primary transition-colors">
                    Features
                  </Link>
                  <Link href="/#pricing" className="hover:text-primary transition-colors">
                    Pricing
                  </Link>
                  <Button onClick={() => setShowAuthModal(true)} variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                  <Button onClick={() => setShowAuthModal(true)} size="sm">
                    Get Started Free
                  </Button>
                </>
              )}
              <ThemeSwitch />
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col gap-4">
                {user ? (
                  <>
                    <Link 
                      href="/dashboard" 
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link 
                      href="/autopilot-center" 
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Zap className="h-4 w-4" />
                      AutoPilot
                    </Link>
                    <Link 
                      href="/settings" 
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <Button onClick={handleSignOut} variant="outline" className="w-full">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/#features" 
                      className="p-2 hover:bg-accent rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Features
                    </Link>
                    <Link 
                      href="/#pricing" 
                      className="p-2 hover:bg-accent rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Pricing
                    </Link>
                    <Button 
                      onClick={() => { setShowAuthModal(true); setMobileMenuOpen(false); }} 
                      variant="outline" 
                      className="w-full"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                    <Button 
                      onClick={() => { setShowAuthModal(true); setMobileMenuOpen(false); }} 
                      className="w-full"
                    >
                      Get Started Free
                    </Button>
                  </>
                )}
                <div className="flex justify-center pt-2">
                  <ThemeSwitch />
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <SimplifiedAuthModal 
        open={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}