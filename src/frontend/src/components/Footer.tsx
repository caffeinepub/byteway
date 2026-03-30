import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import {
  SiFacebook,
  SiInstagram,
  SiLinkedin,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from "react-icons/si";
import { useGetSiteConfiguration } from "../hooks/useSiteConfiguration";

function RealTimeClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const hours = pad(time.getHours());
  const minutes = pad(time.getMinutes());
  const seconds = pad(time.getSeconds());
  const dateStr = time.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="clock-wrapper" data-ocid="footer.card">
      <div className="clock-date">{dateStr}</div>
      <div className="clock-display">
        <span className="clock-segment">{hours}</span>
        <span className="clock-colon">:</span>
        <span className="clock-segment">{minutes}</span>
        <span className="clock-colon">:</span>
        <span className="clock-segment clock-seconds">{seconds}</span>
      </div>
    </div>
  );
}

export default function Footer() {
  const { data: config } = useGetSiteConfiguration();
  const currentYear = new Date().getFullYear();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const appIdentifier = encodeURIComponent(
    typeof window !== "undefined" ? window.location.hostname : "byteway-app",
  );

  const socialLinks = [
    { icon: SiFacebook, url: config?.socialMedia.facebook, label: "Facebook" },
    { icon: SiX, url: config?.socialMedia.twitter, label: "X (Twitter)" },
    {
      icon: SiInstagram,
      url: config?.socialMedia.instagram,
      label: "Instagram",
    },
    { icon: SiLinkedin, url: config?.socialMedia.linkedin, label: "LinkedIn" },
    { icon: SiYoutube, url: config?.socialMedia.youtube, label: "YouTube" },
    { icon: SiWhatsapp, url: config?.socialMedia.whatsapp, label: "WhatsApp" },
  ];

  return (
    <>
      <style>{`
        @keyframes spiderman-glow-pulse {
          0%, 100% { box-shadow: 0 0 4px 1px rgba(204,0,0,0.3), 0 0 10px 2px rgba(30,58,138,0.15); }
          50%       { box-shadow: 0 0 8px 3px rgba(204,0,0,0.55), 0 0 20px 5px rgba(30,58,138,0.3); }
        }
        @keyframes border-flow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes colon-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.2; }
        }
        @keyframes spiderman-clock-glow {
          0%, 100% { text-shadow: 0 0 4px rgba(204,0,0,0.6), 0 0 8px rgba(153,27,27,0.4); }
          50%       { text-shadow: 0 0 8px rgba(204,0,0,1), 0 0 16px rgba(153,27,27,0.7); }
        }
        @keyframes social-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes divider-glow {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }

        .footer-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #cc0000, #1e3a8a, #cc0000, transparent);
          background-size: 200% 100%;
          animation: border-flow 4s ease infinite, divider-glow 2s ease-in-out infinite;
          border: none;
        }

        .clock-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          background: linear-gradient(135deg, rgba(204,0,0,0.08), rgba(30,58,138,0.07));
          border: 1px solid rgba(204,0,0,0.25);
          border-radius: 10px;
          padding: 4px 10px;
          animation: spiderman-glow-pulse 3s ease-in-out infinite;
          backdrop-filter: blur(8px);
        }

        .clock-date {
          font-size: 0.5rem;
          letter-spacing: 0.05em;
          color: rgba(252,165,165,0.7);
          font-weight: 500;
        }

        .clock-display {
          display: flex;
          align-items: center;
          gap: 1px;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
        }

        .clock-segment {
          font-size: 0.7rem;
          font-weight: 700;
          min-width: 1.8ch;
          text-align: center;
          background: linear-gradient(180deg, #fca5a5, #cc0000);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: spiderman-clock-glow 2s ease-in-out infinite;
        }

        .clock-seconds {
          background: linear-gradient(180deg, #93c5fd, #1e3a8a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .clock-colon {
          font-size: 0.7rem;
          font-weight: 700;
          color: rgba(204,0,0,0.85);
          animation: colon-blink 1s step-end infinite;
          padding: 0 1px;
          -webkit-text-fill-color: rgba(204,0,0,0.85);
        }

        .social-icon-animated {
          opacity: 0;
          animation: social-fadein 0.5s ease forwards;
        }
      `}</style>

      <footer className="border-t border-border/40 bg-muted/30 mt-auto">
        {/* Animated top divider */}
        <div className="footer-divider" />

        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/generated/byteway-logo.dim_512x512.png"
                  alt="ByteWay"
                  className="h-8 w-8 object-contain"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-red-500 via-red-400 to-blue-600 bg-clip-text text-transparent">
                  ByteWay
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your destination for insightful articles and stories.
              </p>
            </div>

            {/* Contact Section */}
            {config && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Contact Us</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {config.address && <p>{config.address}</p>}
                  {config.phone && <p>{config.phone}</p>}
                  {config.email && (
                    <a
                      href={`mailto:${config.email}`}
                      className="hover:text-foreground transition-colors"
                    >
                      {config.email}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Social Media + Clock Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Follow Us</h3>
              <div className="flex gap-4">
                {socialLinks.map(
                  (social, idx) =>
                    social.url && (
                      <a
                        key={social.label}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative text-muted-foreground hover:text-red-400 transition-all duration-300 hover:scale-110 social-icon-animated group/social"
                        aria-label={social.label}
                        style={
                          mounted
                            ? { animationDelay: `${idx * 80}ms` }
                            : { opacity: 0 }
                        }
                      >
                        <social.icon className="h-5 w-5 relative z-10" />
                        {/* Web-radiate ring on hover */}
                        <span
                          className="absolute inset-0 rounded-full border border-red-400/0 group-hover/social:border-red-400/60 pointer-events-none"
                          style={{
                            transform: "scale(1)",
                            transition: "border-color 0.2s",
                          }}
                        />
                        <span
                          className="absolute -inset-2 rounded-full border border-red-400/0 group-hover/social:border-red-400/30 pointer-events-none"
                          style={{
                            transform: "scale(1)",
                            transition: "border-color 0.2s 0.05s",
                          }}
                        />
                      </a>
                    ),
                )}
              </div>
              <RealTimeClock />
            </div>
          </div>

          {/* Single animated divider between grid and copyright */}
          <div className="footer-divider my-8" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {currentYear} ByteWay. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Built with{" "}
              <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" />{" "}
              using{" "}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>

        {/* Bottom animated border */}
        <div className="footer-divider" />
      </footer>
    </>
  );
}
