import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Menu, Shield, UserCheck, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const ADMIN_VISIBLE_KEY = "byteway_admin_nav_visible";

export default function ByteWayHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminLinkVisible, setAdminLinkVisible] = useState(false);

  // Restore admin link visibility from sessionStorage on mount
  useEffect(() => {
    try {
      setAdminLinkVisible(sessionStorage.getItem(ADMIN_VISIBLE_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  // Track rapid logo clicks
  const clickTimestampsRef = useRef<number[]>([]);

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    // Only intercept extra rapid clicks — still navigate on regular click
    const now = Date.now();
    clickTimestampsRef.current = [
      ...clickTimestampsRef.current.filter((t) => now - t < 2000),
      now,
    ];

    if (clickTimestampsRef.current.length >= 5) {
      e.preventDefault();
      clickTimestampsRef.current = [];
      try {
        sessionStorage.setItem(ADMIN_VISIBLE_KEY, "1");
      } catch {
        // ignore
      }
      setAdminLinkVisible(true);
    }
  }, []);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Blog", path: "/blog" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 group transition-transform hover:scale-105 duration-300"
          onClick={handleLogoClick}
        >
          {/* Enhanced logo with glow ring */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 opacity-40 blur-md group-hover:opacity-70 transition-opacity duration-500" />
            <img
              src="/assets/generated/byteway-logo.dim_512x512.png"
              alt="ByteWay Logo"
              className="relative h-10 w-10 object-contain rounded-full transition-transform group-hover:rotate-12 duration-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.7)]"
            />
          </div>
          <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
            ByteWay
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 relative group"
              data-ocid={`nav.${item.label.toLowerCase()}.link`}
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-400 group-hover:w-full transition-all duration-300" />
            </Link>
          ))}

          {/* Hidden Admin & Sub-Admin buttons — only visible after 5 rapid logo clicks */}
          {adminLinkVisible && (
            <div className="flex items-center gap-2 ml-2 animate-in fade-in duration-300">
              <Link
                to="/admin"
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all duration-200"
                data-ocid="nav.admin.link"
              >
                <Shield className="h-3 w-3" />
                Admin
              </Link>
              <Link
                to="/admin"
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all duration-200"
                data-ocid="nav.subadmin.link"
              >
                <UserCheck className="h-3 w-3" />
                Sub-Admin
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-ocid="nav.menu.toggle"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur animate-in slide-in-from-top duration-300">
          <nav className="container py-4 flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 py-2"
                data-ocid={`nav.${item.label.toLowerCase()}.link`}
              >
                {item.label}
              </Link>
            ))}

            {/* Hidden Admin & Sub-Admin links (mobile) */}
            {adminLinkVisible && (
              <div className="flex flex-col gap-2 pt-1 border-t border-border/30">
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/20 w-fit"
                  data-ocid="nav.admin.link"
                >
                  <Shield className="h-3 w-3" />
                  Admin
                </Link>
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/20 w-fit"
                  data-ocid="nav.subadmin.link"
                >
                  <UserCheck className="h-3 w-3" />
                  Sub-Admin
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
