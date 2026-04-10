import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X, Zap, Activity } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAutopilotStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      checkAutopilotStatus(session.user.id);
    }
  };

  const checkAutopilotStatus = async (userId: string) => {
    const { data } = await supabase
      .from('user_settings')
      .select('autopilot_enabled')
      .eq('user_id', userId)
      .maybeSingle();
    
    setAutopilotEnabled(data?.autopilot_enabled || false);
    
    // Check every 5 seconds for status changes
    const interval = setInterval(async () => {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('autopilot_enabled')
        .eq('user_id', userId)
        .maybeSingle();
      setAutopilotEnabled(settings?.autopilot_enabled || false);
    }, 5000);

    return () => clearInterval(interval);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAutopilotEnabled(false);
    router.push('/');
  };

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Zap className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              AffiliatePro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  router.pathname === item.href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Autopilot Status Indicator */}
            {user && (
              <Link href="/dashboard?tab=autopilot">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all cursor-pointer hover:scale-105 ${
                  autopilotEnabled 
                    ? 'bg-green-50 dark:bg-green-950 border-green-500' 
                    : 'bg-red-50 dark:bg-red-950 border-red-500'
                }`}>
                  <div className={`h-3 w-3 rounded-full ${autopilotEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <Activity className={`h-4 w-4 ${autopilotEnabled ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`text-sm font-bold ${autopilotEnabled ? 'text-green-600' : 'text-red-600'}`}>
                    {autopilotEnabled ? 'RUNNING' : 'STOPPED'}
                  </span>
                </div>
              </Link>
            )}

            <ThemeSwitch />

            {user ? (
              <>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden md:flex">
                  Sign Out
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setShowAuthModal(true)} className="hidden md:flex">
                Sign In
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 mt-8">
                  {/* Autopilot Status in Mobile */}
                  {user && (
                    <Link href="/dashboard?tab=autopilot" onClick={() => setMobileMenuOpen(false)}>
                      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        autopilotEnabled 
                          ? 'bg-green-50 dark:bg-green-950 border-green-500' 
                          : 'bg-red-50 dark:bg-red-950 border-red-500'
                      }`}>
                        <div className={`h-3 w-3 rounded-full ${autopilotEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <Activity className={`h-5 w-5 ${autopilotEnabled ? 'text-green-600' : 'text-red-600'}`} />
                        <span className={`text-base font-bold ${autopilotEnabled ? 'text-green-600' : 'text-red-600'}`}>
                          {autopilotEnabled ? 'RUNNING' : 'STOPPED'}
                        </span>
                      </div>
                    </Link>
                  )}

                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-lg font-medium transition-colors hover:text-primary ${
                        router.pathname === item.href ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}

                  {user ? (
                    <Button variant="outline" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}>
                      Sign Out
                    </Button>
                  ) : (
                    <Button onClick={() => { setShowAuthModal(true); setMobileMenuOpen(false); }}>
                      Sign In
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal 
          open={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
    </header>
  );
}