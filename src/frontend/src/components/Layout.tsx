import { useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import ByteWayHeader from "./ByteWayHeader";
import FlirtyChatbot from "./FlirtyChatbot";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const barRef = useRef<HTMLDivElement>(null);
  const pathname = location.pathname;

  // Restart the progress bar on route change
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname change triggers animation reset
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    bar.style.animation = "none";
    void bar.offsetHeight;
    bar.style.animation = "";
    bar.classList.remove("animate-progress-bar");
    requestAnimationFrame(() => {
      bar.classList.add("animate-progress-bar");
    });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Animated top progress bar */}
      <div
        ref={barRef}
        className="fixed top-0 left-0 h-0.5 z-[100] pointer-events-none"
        style={{
          background: "linear-gradient(90deg, #cc0000, #f87171, #1e3a8a)",
          boxShadow: "0 0 8px rgba(204,0,0,0.7)",
        }}
      />

      <ByteWayHeader />

      <main
        key={pathname}
        className="flex-1 animate-in fade-in duration-500"
        style={{ animationDuration: "400ms" }}
      >
        {children}
      </main>

      <Footer />
      <FlirtyChatbot />
    </div>
  );
}
