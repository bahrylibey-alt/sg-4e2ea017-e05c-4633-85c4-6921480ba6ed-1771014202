import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Zap, Settings, Home, LayoutDashboard, Plug, Menu } from "lucide-react";
import { ThemeSwitch } from "./ThemeSwitch";

export function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isActive = (path: string) => router.pathname === path;

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/integrations", label: "Integrations", icon: Plug },
    { href: "/settings", label: "Settings", icon: Settings }
  ];

  return (
    <header className="fixed top-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-50">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Zap className="w-6 h-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              AffiliatePro
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <Button variant={isActive(link.href) ? "default" : "ghost"} size="sm">
                    <Icon className="w-4 h-4 mr-2" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeSwitch />
          
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-4 mt-8">
                <div className="flex items-center gap-2 mb-4 px-4">
                  <Zap className="w-6 h-6 text-primary" />
                  <span className="font-bold text-lg bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    AffiliatePro
                  </span>
                </div>
                
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button 
                        variant={isActive(link.href) ? "default" : "ghost"} 
                        className="w-full justify-start"
                        size="lg"
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {link.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}