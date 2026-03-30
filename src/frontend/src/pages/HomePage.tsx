import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import SEO from "../components/SEO";
import SiteDetails from "../components/SiteDetails";
import SubscribeForm from "../components/SubscribeForm";

// Small SVG spider-web particle
function WebParticle({
  size,
  style,
  className,
}: {
  size: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={className}
      style={{ width: size, height: size, ...style }}
    >
      <line x1="50" y1="50" x2="50" y2="0" />
      <line x1="50" y1="50" x2="85" y2="15" />
      <line x1="50" y1="50" x2="100" y2="50" />
      <line x1="50" y1="50" x2="85" y2="85" />
      <line x1="50" y1="50" x2="50" y2="100" />
      <line x1="50" y1="50" x2="15" y2="85" />
      <line x1="50" y1="50" x2="0" y2="50" />
      <line x1="50" y1="50" x2="15" y2="15" />
      <circle cx="50" cy="50" r="15" />
      <circle cx="50" cy="50" r="30" />
      <circle cx="50" cy="50" r="45" />
    </svg>
  );
}

const webParticles = [
  {
    size: 48,
    top: "8%",
    left: "5%",
    color: "#cc0000",
    opacity: 0.08,
    delay: "0s",
    spin: false,
  },
  {
    size: 32,
    top: "15%",
    left: "18%",
    color: "#1e3a8a",
    opacity: 0.07,
    delay: "1.2s",
    spin: true,
  },
  {
    size: 60,
    top: "5%",
    left: "75%",
    color: "#cc0000",
    opacity: 0.06,
    delay: "0.5s",
    spin: false,
  },
  {
    size: 28,
    top: "25%",
    left: "88%",
    color: "#1e3a8a",
    opacity: 0.09,
    delay: "2s",
    spin: true,
  },
  {
    size: 40,
    top: "55%",
    left: "3%",
    color: "#cc0000",
    opacity: 0.07,
    delay: "1.8s",
    spin: false,
  },
  {
    size: 22,
    top: "70%",
    left: "12%",
    color: "#1e3a8a",
    opacity: 0.1,
    delay: "0.9s",
    spin: true,
  },
  {
    size: 36,
    top: "75%",
    left: "82%",
    color: "#cc0000",
    opacity: 0.08,
    delay: "1.4s",
    spin: false,
  },
  {
    size: 50,
    top: "40%",
    left: "92%",
    color: "#1e3a8a",
    opacity: 0.06,
    delay: "2.5s",
    spin: true,
  },
  {
    size: 26,
    top: "85%",
    left: "55%",
    color: "#cc0000",
    opacity: 0.07,
    delay: "0.3s",
    spin: false,
  },
  {
    size: 44,
    top: "20%",
    left: "48%",
    color: "#1e3a8a",
    opacity: 0.05,
    delay: "3s",
    spin: true,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLDivElement>(null);

  // Scroll-reveal for feature cards
  useEffect(() => {
    const cards = featuresRef.current?.querySelectorAll(".reveal-on-scroll");
    if (!cards) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("revealed");
          }
        }
      },
      { threshold: 0.15 },
    );
    for (const card of cards) observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <SEO
        title="Home"
        description="Welcome to ByteWay - Your destination for insightful articles and stories"
      />

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden">
        {/* Animated gradient bg */}
        <div
          className="absolute inset-0 animate-gradient"
          style={{
            background:
              "linear-gradient(135deg, #cc000015, #1e3a8a12, #cc000008, #1e3a8a18)",
            backgroundSize: "300% 300%",
          }}
        />

        {/* Background image */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(/assets/generated/byteway-hero.dim_1600x900.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Glowing orb behind content */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, rgba(204,0,0,0.12) 0%, rgba(30,58,138,0.1) 40%, transparent 70%)",
            filter: "blur(60px)",
            animation: "glow-pulse-red 4s ease-in-out infinite",
          }}
        />

        {/* Floating web particles */}
        {webParticles.map((p, i) => (
          <WebParticle
            // biome-ignore lint/suspicious/noArrayIndexKey: static decorative list, no reordering
            key={i}
            size={p.size}
            className={p.spin ? "animate-spin-slow" : "animate-float"}
            style={{
              position: "absolute",
              top: p.top,
              left: p.left,
              color: p.color,
              opacity: p.opacity,
              animationDelay: p.delay,
              pointerEvents: "none",
            }}
          />
        ))}

        <div className="container relative py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-chart-1/10 border border-chart-1/20 text-sm font-medium animate-bounce-in"
              style={{ animationDelay: "100ms" }}
            >
              <Sparkles className="h-4 w-4 text-chart-1" />
              <span>Welcome to ByteWay</span>
            </div>

            {/* Shimmer hero heading */}
            <h1
              className="relative text-4xl md:text-6xl font-bold tracking-tight"
              style={{ animationDelay: "200ms", animationDuration: "700ms" }}
            >
              <span className="bg-gradient-to-r from-foreground via-chart-1 to-chart-2 bg-clip-text text-transparent">
                Your Journey Through Ideas
              </span>
              {/* Shimmer overlay */}
              <span
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 30%, rgba(255,180,180,0.35) 50%, transparent 70%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "shimmer 3.5s linear infinite",
                }}
              >
                Your Journey Through Ideas
              </span>
            </h1>

            <p
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in"
              style={{ animationDelay: "300ms", animationDuration: "700ms" }}
            >
              Discover insightful articles, engaging stories, and
              thought-provoking content that inspires and informs.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in"
              style={{ animationDelay: "500ms", animationDuration: "700ms" }}
            >
              {/* CTA with glow + ripple */}
              <div className="relative inline-flex group">
                {/* Glow ring */}
                <span
                  className="absolute inset-0 rounded-md pointer-events-none"
                  style={{
                    animation: "glow-pulse-red 2.5s ease-in-out infinite",
                    borderRadius: "inherit",
                  }}
                />
                <Button
                  size="lg"
                  onClick={() => navigate({ to: "/blog" })}
                  className="relative bg-gradient-to-r from-chart-1 to-chart-2 hover:opacity-90 transition-all duration-300 hover:scale-105 group overflow-hidden"
                  data-ocid="home.primary_button"
                >
                  {/* Ripple effect on hover */}
                  <span className="absolute inset-0 rounded-md border-2 border-red-400/0 group-hover:border-red-400/50 transition-all duration-500 scale-100 group-hover:scale-110 opacity-0 group-hover:opacity-100" />
                  Explore Blog
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Subscribe Banner ── */}
      <section className="relative overflow-hidden border-y border-border/60">
        <div className="absolute inset-0 bg-gradient-to-r from-chart-1/10 via-chart-2/8 to-chart-3/10" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 50%, oklch(var(--chart-1) / 0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, oklch(var(--chart-2) / 0.10) 0%, transparent 60%)",
          }}
        />
        <div className="container relative py-14 md:py-20">
          <div className="max-w-2xl mx-auto">
            <SubscribeForm />
          </div>
        </div>
      </section>

      {/* ── Contact & Social Section ── */}
      <section className="container py-16 md:py-24">
        <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom duration-700">
          <SiteDetails />
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container" ref={featuresRef}>
          <div className="text-center space-y-4 mb-12 reveal-on-scroll">
            <h2 className="text-3xl font-bold tracking-tight">Why ByteWay?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We&apos;re committed to delivering quality content that matters to
              you.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Quality Content",
                description:
                  "Every article is carefully curated and reviewed for excellence.",
                icon: "✨",
              },
              {
                title: "Diverse Topics",
                description:
                  "From technology to lifestyle, explore a wide range of subjects.",
                icon: "🌈",
              },
              {
                title: "Community Driven",
                description:
                  "Join a community of readers and writers passionate about ideas.",
                icon: "🤝",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="reveal-on-scroll p-6 rounded-xl bg-background border border-border/50 hover:border-chart-1/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(204,0,0,0.15)]"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
