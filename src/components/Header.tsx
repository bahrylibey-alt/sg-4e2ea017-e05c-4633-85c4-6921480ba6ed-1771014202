import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Zap, Settings, Home, LayoutDashboard, Plug } from "lucide-react";
import { ThemeSwitch } from "./ThemeSwitch";

export function Header() {
  const router = useRouter();
  const isActive = (path: string) => router.pathname === path;

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
          
          <div className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant={isActive("/") ? "default" : "ghost"} size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant={isActive("/dashboard") ? "default" : "ghost"} size="sm">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/integrations">
              <Button variant={isActive("/integrations") ? "default" : "ghost"} size="sm">
                <Plug className="w-4 h-4 mr-2" />
                Integrations
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant={isActive("/settings") ? "default" : "ghost"} size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeSwitch />
        </div>
      </nav>
    </header>
  );
}