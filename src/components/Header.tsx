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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <span className="font-bold text-xl">AffiliatePro</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/content-manager" className="text-sm hover:text-primary transition-colors">
            Content
          </Link>
          <Link href="/traffic-sources" className="text-sm hover:text-primary transition-colors">
            Traffic
          </Link>
          <Link href="/integrations" className="text-sm hover:text-primary transition-colors">
            Integrations
          </Link>
          <Link href="/settings" className="text-sm hover:text-primary transition-colors">
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}