import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Link2, Menu, X, ChevronDown } from "lucide-react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/pricing", label: "Pricing" },
    { href: "/demo", label: "Demo" },
    { href: "/docs", label: "Docs" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="bg-gradient-to-br from-primary to-violet-500 p-1.5 rounded-xl group-hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.6)] transition-all duration-300">
                <Link2 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">1ur<span className="text-primary">.in</span></span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    location === link.href
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <div className="hidden sm:flex items-center gap-2">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm" className="font-medium text-muted-foreground hover:text-foreground">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="font-semibold rounded-full px-5 bg-primary hover:bg-primary/90">
                    Get Started
                  </Button>
                </SignUpButton>
              </div>
              <div className="sm:hidden">
                <SignInButton mode="modal">
                  <Button size="sm" className="font-semibold rounded-full px-4 bg-primary hover:bg-primary/90">
                    Sign In
                  </Button>
                </SignInButton>
              </div>
            </Show>

            <Show when="signed-in">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className={`hidden sm:flex font-medium ${location === "/dashboard" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  Dashboard
                </Button>
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 ring-2 ring-primary/30 hover:ring-primary/60 transition-all duration-300",
                  },
                }}
              />
            </Show>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Show when="signed-in">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              Dashboard
            </Link>
          </Show>
        </div>
      )}
    </header>
  );
}
