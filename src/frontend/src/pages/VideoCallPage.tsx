import {
  Check,
  Copy,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RefreshCw,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type CallState = "landing" | "waiting" | "connecting" | "in-call" | "error";
type ConnectionStatus = "connecting" | "connected" | "poor" | "disconnected";

declare global {
  interface Window {
    Peer: any;
  }
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const RING_DELAYS_WAITING = ["0s", "0.4s", "0.8s"];
const RING_DELAYS_CONNECTING = ["0s", "0.3s", "0.6s"];
const NEBULA_CONFIG = [
  {
    id: "n1",
    cls: "w-96 h-96 opacity-30",
    bg: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)",
    style: { top: "10%", left: "5%", animationDuration: "12s" },
  },
  {
    id: "n2",
    cls: "w-80 h-80 opacity-25",
    bg: "radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)",
    style: {
      top: "60%",
      right: "8%",
      animationDuration: "15s",
      animationDelay: "-5s",
    },
  },
  {
    id: "n3",
    cls: "w-64 h-64 opacity-20",
    bg: "radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 70%)",
    style: {
      bottom: "15%",
      left: "35%",
      animationDuration: "10s",
      animationDelay: "-3s",
    },
  },
];
const PARTICLE_DATA = Array.from({ length: 30 }, (_, i) => ({
  id: `p${i}`,
  w: `${Math.random() * 4 + 1}px`,
  h: `${Math.random() * 4 + 1}px`,
  left: `${Math.random() * 100}%`,
  bg: i % 3 === 0 ? "#06b6d4" : i % 3 === 1 ? "#6366f1" : "#a78bfa",
  dur: `${Math.random() * 15 + 8}s`,
  delay: `${Math.random() * -20}s`,
  drift: `${(Math.random() - 0.5) * 200}px`,
}));

function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes float-particle {
          0% { transform: translateY(100vh) translateX(0) scale(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-20vh) translateX(var(--drift)) scale(1.5); opacity: 0; }
        }
        @keyframes nebula-drift {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          33% { transform: translate(30px, -20px) scale(1.1); opacity: 0.5; }
          66% { transform: translate(-20px, 30px) scale(0.95); opacity: 0.25; }
        }
        @keyframes ring-expand {
          0% { transform: scale(0.8); opacity: 0.9; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes code-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(6,182,212,0.8), 0 0 30px rgba(99,102,241,0.5); }
          50% { text-shadow: 0 0 25px rgba(6,182,212,1), 0 0 60px rgba(99,102,241,0.9), 0 0 100px rgba(167,139,250,0.5); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .vc-particle {
          position: absolute;
          border-radius: 50%;
          animation: float-particle linear infinite;
        }
        .vc-nebula { animation: nebula-drift ease-in-out infinite; }
        .pulsing-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(6,182,212,0.5);
          animation: ring-expand 2s ease-out infinite;
        }
        .code-text { animation: code-glow 2s ease-in-out infinite; }
        .title-gradient {
          background: linear-gradient(90deg, #06b6d4, #6366f1, #a78bfa, #06b6d4);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 4s ease infinite;
        }
        .glass-card {
          background: rgba(6, 10, 20, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(6,182,212,0.25);
          box-shadow: 0 0 30px rgba(6,182,212,0.1), inset 0 0 30px rgba(99,102,241,0.05);
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .glass-card:hover {
          border-color: rgba(6,182,212,0.5);
          box-shadow: 0 0 50px rgba(6,182,212,0.2), inset 0 0 40px rgba(99,102,241,0.08);
        }
        .btn-glow-cyan {
          background: linear-gradient(135deg, rgba(6,182,212,0.2), rgba(99,102,241,0.2));
          border: 1px solid rgba(6,182,212,0.5);
          box-shadow: 0 0 20px rgba(6,182,212,0.3);
          transition: all 0.3s;
        }
        .btn-glow-cyan:hover {
          background: linear-gradient(135deg, rgba(6,182,212,0.4), rgba(99,102,241,0.4));
          box-shadow: 0 0 40px rgba(6,182,212,0.6), 0 0 80px rgba(99,102,241,0.3);
          transform: translateY(-2px);
        }
        .btn-glow-red {
          background: linear-gradient(135deg, rgba(239,68,68,0.3), rgba(220,38,38,0.3));
          border: 1px solid rgba(239,68,68,0.5);
          box-shadow: 0 0 20px rgba(239,68,68,0.3);
          transition: all 0.3s;
        }
        .btn-glow-red:hover {
          background: linear-gradient(135deg, rgba(239,68,68,0.6), rgba(220,38,38,0.6));
          box-shadow: 0 0 40px rgba(239,68,68,0.7);
          transform: translateY(-2px);
        }
        .vc-control-bar {
          background: rgba(6, 10, 20, 0.85);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(6,182,212,0.2);
          box-shadow: 0 -5px 50px rgba(6,182,212,0.1);
        }
      `}</style>

      {NEBULA_CONFIG.map((n) => (
        <div
          key={n.id}
          className={`vc-nebula absolute rounded-full ${n.cls}`}
          style={{ background: n.bg, ...n.style }}
        />
      ))}

      {PARTICLE_DATA.map((p) => (
        <div
          key={p.id}
          className="vc-particle"
          style={
            {
              width: p.w,
              height: p.h,
              left: p.left,
              background: p.bg,
              animationDuration: p.dur,
              animationDelay: p.delay,
              "--drift": p.drift,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default function VideoCallPage() {
  const [callState, setCallState] = useState<CallState>("landing");
  const [code, setCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const [peerLoaded, setPeerLoaded] = useState(false);
  const [peerError, setPeerError] = useState("");
  const [remoteVideoPaused, setRemoteVideoPaused] = useState(false);
  const [remoteStreamActive, setRemoteStreamActive] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callRef = useRef<any>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (window.Peer) {
      setPeerLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
    script.async = true;
    script.onload = () => setPeerLoaded(true);
    script.onerror = () =>
      setPeerError("Failed to load video call library. Check your connection.");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (callState === "in-call") {
      durationTimerRef.current = setInterval(
        () => setDuration((d) => d + 1),
        1000,
      );
    } else {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      setDuration(0);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callState]);

  const cleanupPeer = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    if (localStreamRef.current) {
      for (const t of localStreamRef.current.getTracks()) t.stop();
      localStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanupPeer();
  }, [cleanupPeer]);

  const getLocalStream = async (): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        aspectRatio: 16 / 9,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: true,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  };

  const handleRemoteStream = useCallback((remoteStream: MediaStream) => {
    // Clear connection timeout on success
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => setRemoteVideoPaused(true));
    }
    setRemoteStreamActive(true);
    setCallState("in-call");
    setConnectionStatus("connected");
  }, []);

  const hangUp = useCallback(() => {
    cleanupPeer();
    setCallState("landing");
    setCode("");
    setJoinCode("");
    setConnectionStatus("connecting");
    setIsMuted(false);
    setIsCameraOff(false);
    setRemoteVideoPaused(false);
    setRemoteStreamActive(false);
  }, [cleanupPeer]);

  const handleGenerateCode = async () => {
    if (!peerLoaded || !window.Peer) {
      toast.error("Video call library not loaded yet. Please wait.");
      return;
    }
    const newCode = generateCode();
    setCode(newCode);
    setCallState("waiting");

    try {
      const localStream = await getLocalStream();
      const peer = new window.Peer(`${newCode.toLowerCase()}-bw`);
      peerRef.current = peer;

      peer.on("error", (err: any) => {
        setPeerError(err.message);
        toast.error(`Connection error: ${err.message}`);
      });

      peer.on("call", (incomingCall: any) => {
        callRef.current = incomingCall;
        incomingCall.answer(localStream);
        setCallState("connecting");
        setConnectionStatus("connecting");

        incomingCall.on("stream", (remoteStream: MediaStream) => {
          handleRemoteStream(remoteStream);
        });

        incomingCall.on("close", () => {
          toast.info("Call ended by the other person.");
          hangUp();
        });

        incomingCall.on("error", () => {
          setConnectionStatus("disconnected");
        });
      });
    } catch (err: any) {
      toast.error(`Camera/mic access denied: ${err?.message ?? err}`);
      setCallState("landing");
    }
  };

  const handleJoinCall = async () => {
    const trimmed = joinCode.trim().toUpperCase();
    if (trimmed.length < 4) {
      toast.error("Please enter a valid code.");
      return;
    }
    if (!peerLoaded || !window.Peer) {
      toast.error("Video call library not loaded yet.");
      return;
    }

    setCallState("connecting");
    setConnectionStatus("connecting");

    // 15-second connection timeout
    if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
    connectTimeoutRef.current = setTimeout(() => {
      cleanupPeer();
      setCallState("landing");
      toast.error("Connection timed out. Check the code and try again.");
    }, 15000);

    try {
      const localStream = await getLocalStream();
      const peer = new window.Peer();
      peerRef.current = peer;

      peer.on("open", () => {
        const outgoingCall = peer.call(
          `${trimmed.toLowerCase()}-bw`,
          localStream,
        );
        callRef.current = outgoingCall;

        outgoingCall.on("stream", (remoteStream: MediaStream) => {
          handleRemoteStream(remoteStream);
        });

        outgoingCall.on("close", () => {
          toast.info("Call ended.");
          hangUp();
        });

        outgoingCall.on("error", (e: any) => {
          if (connectTimeoutRef.current) {
            clearTimeout(connectTimeoutRef.current);
            connectTimeoutRef.current = null;
          }
          toast.error(`Call failed: ${e?.message}`);
          setCallState("error");
          setPeerError(e?.message ?? "Connection failed");
        });
      });

      peer.on("error", (err: any) => {
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        toast.error("Could not connect. Check the code and try again.");
        setCallState("landing");
        setPeerError(err.message);
      });
    } catch (err: any) {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      toast.error(`Camera/mic access denied: ${err?.message ?? err}`);
      setCallState("landing");
    }
  };

  // BUG 7 fix: use functional state updates to avoid stale closures
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (localStreamRef.current) {
        for (const t of localStreamRef.current.getAudioTracks()) {
          t.enabled = !newMuted;
        }
      }
      return newMuted;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setIsCameraOff((prev) => {
      const newOff = !prev;
      if (localStreamRef.current) {
        for (const t of localStreamRef.current.getVideoTracks()) {
          t.enabled = !newOff;
        }
      }
      return newOff;
    });
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCancel = () => {
    cleanupPeer();
    setCallState("landing");
    setCode("");
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "#020409" }}
    >
      <ParticleBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {callState === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col items-center justify-center px-4 py-16"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-16"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(99,102,241,0.3))",
                      border: "1px solid rgba(6,182,212,0.4)",
                      boxShadow: "0 0 30px rgba(6,182,212,0.3)",
                    }}
                  >
                    <Video className="h-7 w-7" style={{ color: "#06b6d4" }} />
                  </div>
                  <h1
                    className="text-4xl md:text-6xl font-black tracking-tight title-gradient"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    ByteWay Video Call
                  </h1>
                </div>
                <p
                  className="text-lg"
                  style={{ color: "rgba(165,180,252,0.7)" }}
                >
                  Crystal-clear real-time video calls, no signup needed
                </p>
                {!peerLoaded && (
                  <div
                    className="mt-4 flex items-center justify-center gap-2"
                    style={{ color: "rgba(6,182,212,0.7)" }}
                  >
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading video engine...</span>
                  </div>
                )}
                {peerError && (
                  <p
                    className="mt-3 text-sm"
                    style={{ color: "rgba(239,68,68,0.8)" }}
                  >
                    {peerError}
                  </p>
                )}
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
                {/* Start Call Card */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card rounded-3xl p-8 flex flex-col items-center gap-6"
                >
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <div
                      className="pulsing-ring"
                      style={{ animationDelay: "0s" }}
                    />
                    <div
                      className="pulsing-ring"
                      style={{ animationDelay: "0.7s" }}
                    />
                    <div
                      className="relative w-20 h-20 rounded-full flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(6,182,212,0.3), rgba(99,102,241,0.4))",
                        border: "1px solid rgba(6,182,212,0.5)",
                        boxShadow: "0 0 40px rgba(6,182,212,0.4)",
                      }}
                    >
                      <Phone className="h-9 w-9" style={{ color: "#06b6d4" }} />
                    </div>
                  </div>

                  <div className="text-center">
                    <h2
                      className="text-xl font-bold mb-2"
                      style={{ color: "#e0e7ff" }}
                    >
                      Start a New Call
                    </h2>
                    <p
                      className="text-sm"
                      style={{ color: "rgba(165,180,252,0.6)" }}
                    >
                      Generate a unique code and share it with anyone
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    disabled={!peerLoaded}
                    data-ocid="videocall.primary_button"
                    className="w-full py-3.5 rounded-2xl font-bold btn-glow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontSize: "1rem", color: "#e0f2fe" }}
                  >
                    {peerLoaded ? "Generate Code" : "Loading..."}
                  </button>
                </motion.div>

                {/* Join Call Card */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-card rounded-3xl p-8 flex flex-col items-center gap-6"
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(167,139,250,0.4))",
                      border: "1px solid rgba(99,102,241,0.5)",
                      boxShadow: "0 0 40px rgba(99,102,241,0.4)",
                    }}
                  >
                    <Wifi className="h-9 w-9" style={{ color: "#6366f1" }} />
                  </div>

                  <div className="text-center">
                    <h2
                      className="text-xl font-bold mb-2"
                      style={{ color: "#e0e7ff" }}
                    >
                      Join a Call
                    </h2>
                    <p
                      className="text-sm"
                      style={{ color: "rgba(165,180,252,0.6)" }}
                    >
                      Enter the code shared by your contact
                    </p>
                  </div>

                  <div className="w-full space-y-3">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleJoinCall()}
                      placeholder="ENTER CODE"
                      maxLength={8}
                      data-ocid="videocall.input"
                      className="w-full py-3.5 px-4 rounded-2xl text-center font-mono text-lg font-bold tracking-[0.3em] focus:outline-none"
                      style={{
                        background: "rgba(6,10,20,0.8)",
                        border: "1px solid rgba(6,182,212,0.3)",
                        color: "#06b6d4",
                        boxShadow: "0 0 20px rgba(6,182,212,0.1) inset",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleJoinCall}
                      disabled={!peerLoaded || joinCode.trim().length < 4}
                      data-ocid="videocall.secondary_button"
                      className="w-full py-3.5 rounded-2xl font-bold btn-glow-cyan disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: "#e0f2fe", fontSize: "1rem" }}
                    >
                      Connect
                    </button>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-12 text-center"
              >
                <p
                  className="text-sm"
                  style={{ color: "rgba(165,180,252,0.4)" }}
                >
                  No account needed &middot; End-to-end encrypted &middot; P2P
                  connection
                </p>
              </motion.div>
            </motion.div>
          )}

          {callState === "waiting" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-center px-4 py-16"
            >
              <div className="glass-card rounded-3xl p-12 max-w-md w-full flex flex-col items-center gap-8">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {RING_DELAYS_WAITING.map((delay) => (
                    <div
                      key={delay}
                      className="absolute rounded-full border"
                      style={{
                        width: "100%",
                        height: "100%",
                        borderColor: "rgba(6,182,212,0.4)",
                        animation: `ring-expand 2.4s ease-out ${delay} infinite`,
                      }}
                    />
                  ))}
                  <div
                    className="relative w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(6,182,212,0.25), rgba(99,102,241,0.35))",
                      border: "1px solid rgba(6,182,212,0.5)",
                      boxShadow: "0 0 40px rgba(6,182,212,0.4)",
                    }}
                  >
                    <Video className="h-9 w-9" style={{ color: "#06b6d4" }} />
                  </div>
                </div>

                <div className="text-center">
                  <p
                    className="text-sm uppercase tracking-widest mb-3"
                    style={{ color: "rgba(6,182,212,0.6)" }}
                  >
                    Your Call Code
                  </p>
                  <div
                    className="code-text font-mono text-5xl font-black py-4 px-6 rounded-2xl"
                    style={{
                      color: "#06b6d4",
                      background: "rgba(6,182,212,0.08)",
                      border: "1px solid rgba(6,182,212,0.3)",
                      letterSpacing: "0.4em",
                    }}
                  >
                    {code}
                  </div>
                </div>

                <p
                  className="text-center text-sm"
                  style={{ color: "rgba(165,180,252,0.6)" }}
                >
                  Share this code with the person you want to call.
                  <br />
                  <span style={{ color: "rgba(165,180,252,0.4)" }}>
                    Waiting for them to connect...
                  </span>
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={copyCode}
                    data-ocid="videocall.toggle"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold btn-glow-cyan"
                    style={{ color: "#e0f2fe" }}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? "Copied!" : "Copy Code"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    data-ocid="videocall.cancel_button"
                    className="flex-1 py-3 rounded-2xl font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(165,180,252,0.7)",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Local video preview — 16:9 ratio (140×79) */}
              <div className="fixed bottom-4 left-4 z-20">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    width: 140,
                    height: 79,
                    border: "1px solid rgba(6,182,212,0.4)",
                    boxShadow: "0 0 20px rgba(6,182,212,0.2)",
                  }}
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  >
                    <track kind="captions" />
                  </video>
                </div>
              </div>
            </motion.div>
          )}

          {callState === "connecting" && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center gap-6"
            >
              <div className="relative w-24 h-24">
                {RING_DELAYS_CONNECTING.map((delay) => (
                  <div
                    key={delay}
                    className="absolute inset-0 rounded-full border"
                    style={{
                      borderColor: "rgba(6,182,212,0.5)",
                      animation: `ring-expand 1.8s ease-out ${delay} infinite`,
                    }}
                  />
                ))}
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(6,182,212,0.15)",
                    border: "1px solid rgba(6,182,212,0.4)",
                  }}
                >
                  <RefreshCw
                    className="h-8 w-8 animate-spin"
                    style={{ color: "#06b6d4" }}
                  />
                </div>
              </div>
              <p className="text-xl font-semibold" style={{ color: "#e0e7ff" }}>
                Connecting...
              </p>
              <p className="text-sm" style={{ color: "rgba(165,180,252,0.5)" }}>
                Establishing encrypted P2P connection
              </p>
            </motion.div>
          )}

          {callState === "in-call" && (
            <motion.div
              key="in-call"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col relative"
            >
              {/* Remote video — enforced 16:9 aspect ratio, centered with black letterbox */}
              <div
                className="flex-1 flex items-center justify-center"
                style={{ background: "#000" }}
              >
                <div
                  className="relative w-full"
                  style={{
                    maxHeight: "calc(100vh - 100px)",
                    aspectRatio: "16/9",
                  }}
                >
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    onCanPlay={(e) => {
                      (e.target as HTMLVideoElement)
                        .play()
                        .catch(() => setRemoteVideoPaused(true));
                    }}
                    onPlay={() => setRemoteVideoPaused(false)}
                    className="w-full h-full object-contain"
                  >
                    <track kind="captions" />
                  </video>

                  {/* Tap to play overlay for mobile autoplay restriction */}
                  {remoteVideoPaused && remoteStreamActive && (
                    <button
                      type="button"
                      onClick={() => {
                        remoteVideoRef.current?.play().catch(() => {});
                        setRemoteVideoPaused(false);
                      }}
                      data-ocid="videocall.canvas_target"
                      className="absolute inset-0 flex flex-col items-center justify-center z-10 cursor-pointer"
                      style={{ background: "rgba(2,4,9,0.6)" }}
                    >
                      <div
                        className="px-6 py-3 rounded-2xl flex items-center gap-3"
                        style={{
                          background: "rgba(6,182,212,0.2)",
                          border: "1px solid rgba(6,182,212,0.5)",
                        }}
                      >
                        <Video
                          className="h-6 w-6"
                          style={{ color: "#06b6d4" }}
                        />
                        <span style={{ color: "#e0f2fe", fontWeight: 600 }}>
                          Tap to play
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Connection status badge */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <div
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                      style={{
                        background: "rgba(6,10,20,0.8)",
                        border: `1px solid ${
                          connectionStatus === "connected"
                            ? "rgba(6,182,212,0.4)"
                            : "rgba(239,68,68,0.4)"
                        }`,
                      }}
                    >
                      {connectionStatus === "connected" ? (
                        <>
                          <Wifi
                            className="h-4 w-4"
                            style={{ color: "#06b6d4" }}
                          />
                          <span style={{ color: "#06b6d4" }}>Connected</span>
                        </>
                      ) : connectionStatus === "poor" ? (
                        <>
                          <WifiOff
                            className="h-4 w-4"
                            style={{ color: "#f59e0b" }}
                          />
                          <span style={{ color: "#f59e0b" }}>Poor Signal</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw
                            className="h-4 w-4 animate-spin"
                            style={{ color: "#6366f1" }}
                          />
                          <span style={{ color: "#6366f1" }}>
                            Connecting...
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Local PiP — 16:9 ratio (160×90) */}
                  <div
                    className="absolute bottom-4 right-4 rounded-2xl overflow-hidden"
                    style={{
                      width: 160,
                      height: 90,
                      border: "2px solid rgba(6,182,212,0.5)",
                      boxShadow: "0 0 20px rgba(6,182,212,0.4)",
                    }}
                  >
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ transform: "scaleX(-1)" }}
                    >
                      <track kind="captions" />
                    </video>
                    {isCameraOff && (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(6,10,20,0.9)" }}
                      >
                        <VideoOff
                          className="h-6 w-6"
                          style={{ color: "rgba(6,182,212,0.6)" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="vc-control-bar px-8 py-4 flex items-center justify-center gap-6">
                <div
                  className="font-mono text-sm px-3 py-1.5 rounded-full mr-auto"
                  style={{
                    background: "rgba(6,182,212,0.1)",
                    border: "1px solid rgba(6,182,212,0.2)",
                    color: "rgba(6,182,212,0.8)",
                  }}
                >
                  {formatDuration(duration)}
                </div>

                <button
                  type="button"
                  onClick={toggleMute}
                  data-ocid="videocall.toggle"
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: isMuted
                      ? "rgba(239,68,68,0.2)"
                      : "rgba(6,182,212,0.15)",
                    border: `1px solid ${
                      isMuted ? "rgba(239,68,68,0.5)" : "rgba(6,182,212,0.4)"
                    }`,
                    boxShadow: `0 0 20px ${
                      isMuted ? "rgba(239,68,68,0.3)" : "rgba(6,182,212,0.2)"
                    }`,
                  }}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <MicOff className="h-5 w-5" style={{ color: "#ef4444" }} />
                  ) : (
                    <Mic className="h-5 w-5" style={{ color: "#06b6d4" }} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleCamera}
                  data-ocid="videocall.secondary_button"
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: isCameraOff
                      ? "rgba(239,68,68,0.2)"
                      : "rgba(6,182,212,0.15)",
                    border: `1px solid ${
                      isCameraOff
                        ? "rgba(239,68,68,0.5)"
                        : "rgba(6,182,212,0.4)"
                    }`,
                    boxShadow: `0 0 20px ${
                      isCameraOff
                        ? "rgba(239,68,68,0.3)"
                        : "rgba(6,182,212,0.2)"
                    }`,
                  }}
                  title={isCameraOff ? "Turn on camera" : "Turn off camera"}
                >
                  {isCameraOff ? (
                    <VideoOff
                      className="h-5 w-5"
                      style={{ color: "#ef4444" }}
                    />
                  ) : (
                    <Video className="h-5 w-5" style={{ color: "#06b6d4" }} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={hangUp}
                  data-ocid="videocall.delete_button"
                  className="w-16 h-16 rounded-full flex items-center justify-center btn-glow-red transition-all duration-300"
                  title="End call"
                >
                  <PhoneOff className="h-6 w-6" style={{ color: "#ef4444" }} />
                </button>
              </div>
            </motion.div>
          )}

          {callState === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 px-4"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  boxShadow: "0 0 40px rgba(239,68,68,0.2)",
                }}
              >
                <WifiOff className="h-9 w-9" style={{ color: "#ef4444" }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: "#e0e7ff" }}>
                Connection Failed
              </h2>
              <p
                className="text-sm text-center max-w-xs"
                style={{ color: "rgba(165,180,252,0.5)" }}
              >
                {peerError ||
                  "Could not connect. Make sure the code is correct and try again."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setCallState("landing");
                  setPeerError("");
                }}
                data-ocid="videocall.primary_button"
                className="px-8 py-3 rounded-2xl font-semibold btn-glow-cyan"
                style={{ color: "#e0f2fe" }}
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
