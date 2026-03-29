import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Download, MessageSquare, Video } from "lucide-react";
import { useEffect, useRef } from "react";
import SEO from "../components/SEO";
import SiteDetails from "../components/SiteDetails";
import SubscribeForm from "../components/SubscribeForm";

function SpiderWebSVG({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Radial lines */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line
            key={angle}
            x1="200"
            y1="200"
            x2={200 + 200 * Math.cos(rad)}
            y2={200 + 200 * Math.sin(rad)}
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity="0.35"
          />
        );
      })}
      {/* Concentric rings */}
      {[40, 80, 120, 160, 200].map((r) => (
        <polygon
          key={r}
          points={[0, 45, 90, 135, 180, 225, 270, 315]
            .map((a) => {
              const rad = (a * Math.PI) / 180;
              return `${200 + r * Math.cos(rad)},${200 + r * Math.sin(rad)}`;
            })
            .join(" ")}
          stroke="currentColor"
          strokeWidth="0.6"
          strokeOpacity="0.25"
          fill="none"
        />
      ))}
    </svg>
  );
}

function WebLine({
  x1,
  y1,
  x2,
  y2,
  delay = 0,
}: { x1: number; y1: number; x2: number; y2: number; delay?: number }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="#cc0000"
      strokeWidth="1.5"
      strokeOpacity="0.18"
      strokeLinecap="round"
      style={{
        strokeDasharray: 300,
        strokeDashoffset: 300,
        animation: `web-draw 1.8s ease forwards ${delay}ms`,
      }}
    />
  );
}

function SpiderSymbol({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <ellipse cx="50" cy="50" rx="12" ry="18" fill="currentColor" />
      <ellipse
        cx="50"
        cy="50"
        rx="6"
        ry="10"
        fill="currentColor"
        transform="rotate(45 50 50)"
      />
      <ellipse
        cx="50"
        cy="50"
        rx="6"
        ry="10"
        fill="currentColor"
        transform="rotate(-45 50 50)"
      />
      {/* Legs */}
      {[
        [-30, -20],
        [-20, -35],
        [-35, 5],
        [-30, 20],
        [30, -20],
        [20, -35],
        [35, 5],
        [30, 20],
      ].map(([dx, dy]) => (
        <line
          key={`leg-${dx}-${dy}`}
          x1="50"
          y1="50"
          x2={50 + dx}
          y2={50 + dy}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated web-strand particle effect on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const strands: Array<{
      x: number;
      y: number;
      tx: number;
      ty: number;
      progress: number;
      speed: number;
      color: string;
    }> = [];

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function spawnStrand() {
      if (!canvas) return;
      const side = Math.random() > 0.5 ? "top" : "left";
      const x = side === "top" ? Math.random() * canvas.width : 0;
      const y = side === "top" ? 0 : Math.random() * canvas.height;
      const tx = x + (Math.random() - 0.5) * 400 + 200;
      const ty = y + Math.random() * 300 + 100;
      strands.push({
        x,
        y,
        tx,
        ty,
        progress: 0,
        speed: 0.004 + Math.random() * 0.006,
        color: Math.random() > 0.5 ? "rgba(204,0,0," : "rgba(30,58,138,",
      });
    }

    for (let i = 0; i < 8; i++) spawnStrand();

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = strands.length - 1; i >= 0; i--) {
        const s = strands[i];
        s.progress += s.speed;
        const p = Math.min(s.progress, 1);
        const cx = s.x + (s.tx - s.x) * p;
        const cy = s.y + (s.ty - s.y) * p;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.quadraticCurveTo(s.x + (s.tx - s.x) * 0.5, s.y - 60, cx, cy);
        const alpha = p < 0.5 ? p * 2 : (1 - p) * 2;
        ctx.strokeStyle = `${s.color}${alpha * 0.25})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        if (s.progress >= 1.5) {
          strands.splice(i, 1);
          spawnStrand();
        }
      }

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const features = [
    {
      title: "ByteChat",
      description:
        "Real-time encrypted messaging with Messenger-style UI, audio calls, unique ID connections, and 8+ chat themes.",
      icon: <MessageSquare className="h-8 w-8" />,
      path: "/bytechat",
      color: "red",
    },
    {
      title: "Videos",
      description:
        "Cinema-style video library with HD playback, download buttons, view counts, and admin upload.",
      icon: <Video className="h-8 w-8" />,
      path: "/videos",
      color: "blue",
    },
    {
      title: "Downloads",
      description:
        "Play Store-like downloads hub for APKs, PDFs, and documents -- all neatly categorized.",
      icon: <Download className="h-8 w-8" />,
      path: "/downloads",
      color: "red",
    },
  ];

  return (
    <>
      <style>{`
        @keyframes web-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes hero-web-float {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.07; }
          50% { transform: scale(1.05) rotate(3deg); opacity: 0.12; }
        }
        @keyframes web-corner-float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.18; }
          50% { transform: translate(-5px, 5px) rotate(5deg); opacity: 0.28; }
        }
        @keyframes web-corner-float-r {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.15; }
          50% { transform: translate(5px, 5px) rotate(-5deg); opacity: 0.25; }
        }
        @keyframes spider-drop {
          0% { transform: translateY(-60px); opacity: 0; }
          60% { opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes city-rise {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 0.08; }
        }
        @keyframes badge-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(204,0,0,0.5); }
          50% { box-shadow: 0 0 0 8px rgba(204,0,0,0); }
        }
        @keyframes card-web-reveal {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .hero-web-bg {
          animation: hero-web-float 8s ease-in-out infinite;
        }
        .web-corner-tl {
          animation: web-corner-float 5s ease-in-out infinite;
        }
        .web-corner-tr {
          animation: web-corner-float-r 4.5s ease-in-out infinite;
        }
        .spider-drop-in {
          animation: spider-drop 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .feature-card {
          animation: card-web-reveal 0.6s ease forwards;
          opacity: 0;
        }
        .feature-card:nth-child(1) { animation-delay: 100ms; }
        .feature-card:nth-child(2) { animation-delay: 250ms; }
        .feature-card:nth-child(3) { animation-delay: 400ms; }
        .spidey-badge {
          animation: badge-pulse 2.5s ease-in-out infinite;
        }
        .web-thread-svg line {
          animation: web-draw 2s ease forwards;
        }
      `}</style>

      <SEO
        title="Home"
        description="Welcome to ByteWay - Your destination for insightful articles and stories"
      />

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center">
        {/* Canvas web strands */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        />

        {/* Large centered web bg */}
        <SpiderWebSVG className="hero-web-bg absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] text-red-600 pointer-events-none" />

        {/* Corner webs */}
        <div className="web-corner-tl absolute -top-8 -left-8 w-48 h-48 pointer-events-none">
          <SpiderWebSVG className="w-full h-full text-red-500" />
        </div>
        <div className="web-corner-tr absolute -top-8 -right-8 w-48 h-48 pointer-events-none">
          <SpiderWebSVG className="w-full h-full text-blue-600" />
        </div>

        {/* City skyline silhouette */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ animation: "city-rise 1.2s ease 0.3s both" }}
        >
          <svg
            viewBox="0 0 1440 200"
            fill="currentColor"
            aria-hidden="true"
            className="w-full text-red-900/8"
          >
            <rect x="0" y="120" width="60" height="80" />
            <rect x="40" y="80" width="40" height="120" />
            <rect x="100" y="100" width="50" height="100" />
            <rect x="160" y="60" width="30" height="140" />
            <rect x="200" y="90" width="60" height="110" />
            <rect x="280" y="50" width="40" height="150" />
            <rect x="330" y="110" width="50" height="90" />
            <rect x="400" y="70" width="35" height="130" />
            <rect x="450" y="40" width="55" height="160" />
            <rect x="520" y="90" width="40" height="110" />
            <rect x="580" y="55" width="45" height="145" />
            <rect x="640" y="80" width="60" height="120" />
            <rect x="720" y="30" width="50" height="170" />
            <rect x="780" y="85" width="40" height="115" />
            <rect x="840" y="60" width="55" height="140" />
            <rect x="910" y="95" width="45" height="105" />
            <rect x="970" y="50" width="35" height="150" />
            <rect x="1020" y="75" width="60" height="125" />
            <rect x="1100" y="40" width="45" height="160" />
            <rect x="1160" y="100" width="50" height="100" />
            <rect x="1230" y="65" width="40" height="135" />
            <rect x="1290" y="85" width="55" height="115" />
            <rect x="1360" y="110" width="80" height="90" />
          </svg>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background/90 pointer-events-none" />

        {/* Hero content */}
        <div className="container relative z-10 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            {/* Spider symbol */}
            <div className="flex justify-center spider-drop-in">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-red-600/20 blur-2xl scale-150" />
                <SpiderSymbol className="w-16 h-16 text-red-500 relative drop-shadow-[0_0_16px_rgba(204,0,0,0.9)]" />
              </div>
            </div>

            {/* Badge */}
            <div
              className="spidey-badge inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold"
              style={{
                background:
                  "linear-gradient(135deg, rgba(204,0,0,0.15), rgba(30,58,138,0.15))",
                border: "1px solid rgba(204,0,0,0.4)",
                color: "#fca5a5",
                animationDelay: "200ms",
              }}
            >
              <span style={{ fontSize: "1.1em" }}>🕷️</span>
              <span>With Great Power Comes Great Content</span>
              <span style={{ fontSize: "1.1em" }}>🕸️</span>
            </div>

            {/* Headline */}
            <h1
              className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] animate-in slide-in-from-bottom delay-200"
              style={{
                animationDuration: "700ms",
                background:
                  "linear-gradient(135deg, #ffffff 0%, #fca5a5 40%, #cc0000 70%, #1e3a8a 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 30px rgba(204,0,0,0.3))",
              }}
            >
              ByteWay
            </h1>
            <p
              className="text-lg md:text-2xl font-medium animate-in fade-in delay-300"
              style={{
                animationDuration: "700ms",
                color: "rgba(252,165,165,0.85)",
                textShadow: "0 0 20px rgba(204,0,0,0.3)",
              }}
            >
              Your universe of blogs, videos, chat & downloads
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in delay-500"
              style={{ animationDuration: "700ms" }}
            >
              <Button
                size="lg"
                onClick={() => navigate({ to: "/blog" })}
                className="group relative overflow-hidden font-bold text-base px-8 py-6 rounded-2xl border-0"
                style={{
                  background: "linear-gradient(135deg, #cc0000, #991b1b)",
                  boxShadow:
                    "0 0 30px rgba(204,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
                  color: "white",
                }}
                data-ocid="home.primary_button"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Explore Blog
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "linear-gradient(135deg, #ef4444, #cc0000)",
                  }}
                />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate({ to: "/bytechat" })}
                className="group font-bold text-base px-8 py-6 rounded-2xl"
                style={{
                  border: "1.5px solid rgba(30,58,138,0.6)",
                  background: "rgba(30,58,138,0.1)",
                  color: "#93c5fd",
                  boxShadow: "0 0 20px rgba(30,58,138,0.25)",
                }}
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Open ByteChat
                </span>
              </Button>
            </div>

            {/* Web strand decorations below CTA */}
            <div className="flex justify-center gap-8 pt-4 opacity-40">
              {["s0", "s1", "s2", "s3", "s4"].map((key, i) => (
                <svg
                  key={key}
                  width="2"
                  height="40"
                  aria-hidden="true"
                  className="overflow-visible"
                >
                  <line
                    x1="1"
                    y1="0"
                    x2="1"
                    y2="40"
                    stroke="#cc0000"
                    strokeWidth="1.5"
                    style={{
                      strokeDasharray: 40,
                      strokeDashoffset: 40,
                      animation: `web-draw 0.8s ease ${i * 150}ms forwards`,
                    }}
                  />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="relative py-20 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(204,0,0,0.06) 0%, transparent 70%)",
          }}
        />
        {/* Mini web in section corners */}
        <SpiderWebSVG className="absolute -right-16 top-0 w-48 h-48 text-red-600 opacity-10 pointer-events-none" />
        <SpiderWebSVG className="absolute -left-16 bottom-0 w-48 h-48 text-blue-700 opacity-10 pointer-events-none" />

        <div className="container relative z-10">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-black mb-3"
              style={{
                background: "linear-gradient(90deg, #cc0000, #fca5a5, #1e3a8a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Your Powers
            </h2>
            <p className="text-muted-foreground">
              Everything you need, all in one web
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <button
                key={f.title}
                type="button"
                onClick={() => navigate({ to: f.path as "/" })}
                className="feature-card text-left group rounded-2xl p-6 border transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{
                  background:
                    f.color === "red"
                      ? "linear-gradient(135deg, rgba(204,0,0,0.08), rgba(153,27,27,0.04))"
                      : "linear-gradient(135deg, rgba(30,58,138,0.1), rgba(30,58,138,0.04))",
                  border:
                    f.color === "red"
                      ? "1px solid rgba(204,0,0,0.25)"
                      : "1px solid rgba(30,58,138,0.35)",
                  boxShadow:
                    f.color === "red"
                      ? "0 0 0 0 rgba(204,0,0,0.3)"
                      : "0 0 0 0 rgba(30,58,138,0.3)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    f.color === "red"
                      ? "0 0 30px rgba(204,0,0,0.25), inset 0 0 30px rgba(204,0,0,0.05)"
                      : "0 0 30px rgba(30,58,138,0.3), inset 0 0 30px rgba(30,58,138,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 0 0 transparent";
                }}
              >
                <div
                  className="mb-4 w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      f.color === "red"
                        ? "rgba(204,0,0,0.15)"
                        : "rgba(30,58,138,0.15)",
                    color: f.color === "red" ? "#f87171" : "#93c5fd",
                  }}
                >
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-red-400 transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
                <div
                  className="mt-4 flex items-center gap-1 text-xs font-semibold"
                  style={{ color: f.color === "red" ? "#f87171" : "#93c5fd" }}
                >
                  Open{" "}
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Subscribe Banner ── */}
      <section className="relative overflow-hidden border-y">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(204,0,0,0.08) 0%, rgba(30,58,138,0.06) 50%, rgba(204,0,0,0.08) 100%)",
            borderColor: "rgba(204,0,0,0.2)",
          }}
        />
        {/* Web strands as section dividers */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-10"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <WebLine x1={0} y1={0} x2={200} y2={200} delay={200} />
          <WebLine x1={0} y1={200} x2={300} y2={0} delay={400} />
          <WebLine x1={1440} y1={0} x2={1200} y2={200} delay={300} />
        </svg>
        <div className="container relative py-14 md:py-20">
          <div className="max-w-2xl mx-auto">
            <SubscribeForm />
          </div>
        </div>
      </section>

      {/* ── Contact & Social ── */}
      <section className="container py-16 md:py-24">
        <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom duration-700">
          <SiteDetails />
        </div>
      </section>

      {/* ── Spidey Quote ── */}
      <section
        className="relative overflow-hidden py-16 border-t"
        style={{ borderColor: "rgba(204,0,0,0.2)" }}
      >
        <SpiderWebSVG className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 text-red-600 opacity-5 pointer-events-none" />
        <div className="container relative z-10 text-center">
          <SpiderSymbol className="w-10 h-10 text-red-500 mx-auto mb-4 opacity-60" />
          <blockquote
            className="text-xl md:text-2xl font-semibold italic max-w-2xl mx-auto"
            style={{
              background: "linear-gradient(135deg, #fca5a5, #cc0000, #1e3a8a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            &ldquo;With great content comes great responsibility.&rdquo;
          </blockquote>
          <p className="mt-3 text-sm text-muted-foreground">— ByteWay</p>
        </div>
      </section>
    </>
  );
}
