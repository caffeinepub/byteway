import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Check,
  CheckCheck,
  Copy,
  Lock,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Send,
  UserCircle,
  Video,
  VideoOff,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import UserLoginModal from "../components/UserLoginModal";
import { useUser } from "../context/UserContext";

const CHATS_KEY = "byteway_chats";

type CallMode = "video" | "text";
type CallState = "landing" | "waiting" | "connecting" | "in-call" | "error";

interface ChatMessage {
  id: string;
  text: string;
  from: "me" | "them";
  time: string;
  seen: boolean;
}

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

function getTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// E2E Encryption helpers
async function generateECDHKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"],
  );
}

async function exportPublicKey(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", key);
}

async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );
}

async function deriveSharedKey(
  privateKey: CryptoKey,
  peerPublicKey: CryptoKey,
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: peerPublicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptMessage(
  key: CryptoKey,
  text: string,
): Promise<{ iv: string; data: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );
  return {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
  };
}

async function decryptMessage(
  key: CryptoKey,
  iv: string,
  data: string,
): Promise<string> {
  const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const dataBytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    dataBytes,
  );
  return new TextDecoder().decode(decrypted);
}

function loadChatsFromSession(): ChatMessage[] {
  try {
    return JSON.parse(sessionStorage.getItem(CHATS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveChatsToSession(msgs: ChatMessage[]) {
  try {
    sessionStorage.setItem(CHATS_KEY, JSON.stringify(msgs));
  } catch {
    // ignore
  }
}

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
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        @keyframes typing-dot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
        .bc-particle { position: absolute; border-radius: 50%; animation: float-particle linear infinite; }
        .bc-nebula { animation: nebula-drift ease-in-out infinite; }
        .pulsing-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(6,182,212,0.5); animation: ring-expand 2s ease-out infinite; }
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
          background: rgba(6, 10, 20, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(6,182,212,0.25);
          box-shadow: 0 0 30px rgba(6,182,212,0.1), inset 0 0 30px rgba(99,102,241,0.05);
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .glass-card:hover { border-color: rgba(6,182,212,0.5); box-shadow: 0 0 50px rgba(6,182,212,0.2), inset 0 0 40px rgba(99,102,241,0.08); }
        .btn-glow-cyan {
          background: linear-gradient(135deg, rgba(6,182,212,0.2), rgba(99,102,241,0.2));
          border: 1px solid rgba(6,182,212,0.5);
          box-shadow: 0 0 20px rgba(6,182,212,0.3);
          transition: all 0.3s;
        }
        .btn-glow-cyan:hover { background: linear-gradient(135deg, rgba(6,182,212,0.4), rgba(99,102,241,0.4)); box-shadow: 0 0 40px rgba(6,182,212,0.6), 0 0 80px rgba(99,102,241,0.3); transform: translateY(-2px); }
        .btn-glow-indigo {
          background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3));
          border: 1px solid rgba(99,102,241,0.5);
          box-shadow: 0 0 20px rgba(99,102,241,0.3);
          transition: all 0.3s;
        }
        .btn-glow-indigo:hover { background: linear-gradient(135deg, rgba(99,102,241,0.6), rgba(139,92,246,0.6)); box-shadow: 0 0 40px rgba(99,102,241,0.7); transform: translateY(-2px); }
        .btn-glow-red {
          background: linear-gradient(135deg, rgba(239,68,68,0.3), rgba(220,38,38,0.3));
          border: 1px solid rgba(239,68,68,0.5);
          box-shadow: 0 0 20px rgba(239,68,68,0.3);
          transition: all 0.3s;
        }
        .btn-glow-red:hover { background: linear-gradient(135deg, rgba(239,68,68,0.6), rgba(220,38,38,0.6)); box-shadow: 0 0 40px rgba(239,68,68,0.7); transform: translateY(-2px); }
        .bc-control-bar {
          background: rgba(6, 10, 20, 0.9);
          backdrop-filter: blur(30px);
          border-top: 1px solid rgba(6,182,212,0.2);
          box-shadow: 0 -5px 50px rgba(6,182,212,0.1);
        }
        .msg-me {
          background: linear-gradient(135deg, rgba(99,102,241,0.7), rgba(139,92,246,0.5));
          border: 1px solid rgba(139,92,246,0.4);
          box-shadow: 0 0 15px rgba(99,102,241,0.3);
        }
        .msg-them {
          background: rgba(6, 10, 30, 0.8);
          border: 1px solid rgba(6,182,212,0.25);
          box-shadow: 0 0 10px rgba(6,182,212,0.1);
        }
        .chat-input-area {
          background: rgba(6, 10, 20, 0.9);
          border-top: 1px solid rgba(6,182,212,0.15);
          backdrop-filter: blur(20px);
        }
        .online-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        .typing-dot { animation: typing-dot 1.2s ease-in-out infinite; }
      `}</style>
      {NEBULA_CONFIG.map((n) => (
        <div
          key={n.id}
          className={`bc-nebula absolute rounded-full ${n.cls}`}
          style={{ background: n.bg, ...n.style }}
        />
      ))}
      {PARTICLE_DATA.map((p) => (
        <div
          key={p.id}
          className="bc-particle"
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
  const { currentUser } = useUser();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [callState, setCallState] = useState<CallState>("landing");
  const [callMode, setCallMode] = useState<CallMode>("video");
  const [code, setCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [peerLoaded, setPeerLoaded] = useState(false);
  const [peerError, setPeerError] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadChatsFromSession(),
  );
  const [msgInput, setMsgInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [remoteVideoPaused, setRemoteVideoPaused] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callRef = useRef<any>(null);
  const dataConnRef = useRef<any>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // E2E encryption refs
  const keyPairRef = useRef<CryptoKeyPair | null>(null);
  const sharedKeyRef = useRef<CryptoKey | null>(null);

  // Load PeerJS
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
      setPeerError("Failed to load library. Check connection.");
    document.head.appendChild(script);
  }, []);

  // Duration timer
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

  // Auto-scroll chat
  // biome-ignore lint/correctness/useExhaustiveDependencies: chatBottomRef is stable
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (showChat) setUnreadCount(0);
  }, [showChat, messages]);

  // Persist messages to sessionStorage
  useEffect(() => {
    saveChatsToSession(messages);
  }, [messages]);

  const cleanupPeer = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    if (dataConnRef.current) {
      dataConnRef.current.close();
      dataConnRef.current = null;
    }
    if (localStreamRef.current) {
      for (const t of localStreamRef.current.getTracks()) t.stop();
      localStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    sharedKeyRef.current = null;
    keyPairRef.current = null;
    setIsEncrypted(false);
  }, []);

  useEffect(() => {
    return () => cleanupPeer();
  }, [cleanupPeer]);

  const createPeerWithICE = (peerId?: string) => {
    const config = {
      config: {
        iceCandidatePoolSize: 10,
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
        ],
      },
    };
    return peerId ? new window.Peer(peerId, config) : new window.Peer(config);
  };

  const getLocalStream = async (): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        aspectRatio: 16 / 9,
        width: { ideal: 1280, max: 1280 },
        height: { ideal: 720, max: 720 },
        frameRate: { ideal: 24, max: 30 },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(() => {});
    }
    return stream;
  };

  const handleRemoteStream = useCallback((remoteStream: MediaStream) => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    const vid = remoteVideoRef.current;
    if (vid) {
      vid.srcObject = remoteStream;
      vid.muted = false;
      vid.volume = 1.0;
      vid.onloadedmetadata = () => {
        vid.play().catch(() => setRemoteVideoPaused(true));
      };
    }
    setCallState("in-call");
  }, []);

  const initiateKeyExchange = useCallback(async (conn: any) => {
    try {
      const kp = await generateECDHKeyPair();
      keyPairRef.current = kp;
      const pubJwk = await exportPublicKey(kp.publicKey);
      conn.send({ type: "key-exchange", publicKey: pubJwk });
    } catch {
      // Key exchange failed, proceed unencrypted
    }
  }, []);

  const setupDataConnection = useCallback(
    (conn: any) => {
      dataConnRef.current = conn;

      // Start key exchange
      initiateKeyExchange(conn);

      conn.on("data", async (data: any) => {
        if (data?.type === "key-exchange") {
          try {
            const peerPubKey = await importPublicKey(data.publicKey);
            if (keyPairRef.current) {
              sharedKeyRef.current = await deriveSharedKey(
                keyPairRef.current.privateKey,
                peerPubKey,
              );
              setIsEncrypted(true);
            }
          } catch {
            // ignore key exchange failure
          }
        } else if (data?.type === "encrypted-msg") {
          let text = "[encrypted message]";
          try {
            if (sharedKeyRef.current) {
              text = await decryptMessage(
                sharedKeyRef.current,
                data.iv,
                data.data,
              );
            }
          } catch {
            text = "[decryption failed]";
          }
          const newMsg: ChatMessage = {
            id: Date.now().toString(),
            text,
            from: "them",
            time: getTime(),
            seen: false,
          };
          setMessages((prev) => {
            // Mark all my prev messages as seen when they respond
            const updated = prev.map((m) =>
              m.from === "me" ? { ...m, seen: true } : m,
            );
            return [...updated, newMsg];
          });
          setIsTyping(false);
          setUnreadCount((c) => c + 1);
        } else if (data?.type === "message") {
          // Unencrypted fallback
          const newMsg: ChatMessage = {
            id: Date.now().toString(),
            text: data.text,
            from: "them",
            time: getTime(),
            seen: false,
          };
          setMessages((prev) => {
            const updated = prev.map((m) =>
              m.from === "me" ? { ...m, seen: true } : m,
            );
            return [...updated, newMsg];
          });
          setIsTyping(false);
          setUnreadCount((c) => c + 1);
        } else if (data?.type === "typing") {
          setIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        } else if (data?.type === "seen") {
          // Peer marked our messages as seen
          setMessages((prev) =>
            prev.map((m) => (m.from === "me" ? { ...m, seen: true } : m)),
          );
        }
      });
      conn.on("close", () => {
        dataConnRef.current = null;
      });
      conn.on("error", () => {
        dataConnRef.current = null;
      });
    },
    [initiateKeyExchange],
  );

  const hangUp = useCallback(() => {
    cleanupPeer();
    setCallState("landing");
    setCode("");
    setJoinCode("");
    setIsMuted(false);
    setIsCameraOff(false);
    setMessages([]);
    setUnreadCount(0);
    setIsTyping(false);
    setRemoteVideoPaused(false);
    setIsEncrypted(false);
  }, [cleanupPeer]);

  const handleGenerateCode = async (mode: CallMode) => {
    if (!peerLoaded || !window.Peer) {
      toast.error("Library not loaded yet. Wait a moment.");
      return;
    }

    const newCode = generateCode();
    setCode(newCode);
    setCallMode(mode);
    setCallState("waiting");
    setMessages([]);

    const peer = createPeerWithICE(`${newCode.toLowerCase()}-bc`);
    peerRef.current = peer;

    peer.on("error", (err: any) => {
      toast.error(`Error: ${err.message}`);
      setCallState("landing");
    });

    peer.on("open", () => {
      // Ready and waiting
    });

    if (mode === "video") {
      peer.on("call", async (incomingCall: any) => {
        try {
          const localStream = await getLocalStream();
          callRef.current = incomingCall;
          incomingCall.answer(localStream);
          incomingCall.on("stream", (remoteStream: MediaStream) => {
            handleRemoteStream(remoteStream);
          });
          incomingCall.on("close", () => {
            toast.info("Call ended.");
            hangUp();
          });
        } catch (err: any) {
          toast.error(`Camera/mic error: ${err?.message ?? err}`);
          setCallState("landing");
        }
      });
    }

    peer.on("connection", (conn: any) => {
      conn.on("open", () => {
        setupDataConnection(conn);
        if (mode === "text") {
          setCallState("in-call");
        }
      });
    });
  };

  const handleJoinCall = async (mode: CallMode) => {
    const trimmed = joinCode.trim().toUpperCase();
    if (trimmed.length < 4) {
      toast.error("Enter a valid code.");
      return;
    }
    if (!peerLoaded || !window.Peer) {
      toast.error("Library not loaded yet.");
      return;
    }

    setCallMode(mode);
    setCallState("connecting");
    setMessages([]);

    if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
    connectTimeoutRef.current = setTimeout(() => {
      cleanupPeer();
      setCallState("landing");
      toast.error("Connection timed out. Check the code and try again.");
    }, 20000);

    try {
      const peer = createPeerWithICE();
      peerRef.current = peer;

      peer.on("error", (err: any) => {
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        toast.error(`Error: ${err.message}`);
        setCallState("landing");
      });

      peer.on("open", async () => {
        const dataConn = peer.connect(`${trimmed.toLowerCase()}-bc`, {
          reliable: true,
        });
        dataConn.on("open", () => {
          setupDataConnection(dataConn);
          if (mode === "text") {
            if (connectTimeoutRef.current) {
              clearTimeout(connectTimeoutRef.current);
              connectTimeoutRef.current = null;
            }
            setCallState("in-call");
          }
        });

        if (mode === "video") {
          try {
            const localStream = await getLocalStream();
            const outgoingCall = peer.call(
              `${trimmed.toLowerCase()}-bc`,
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
            outgoingCall.on("error", () => {
              if (connectTimeoutRef.current) {
                clearTimeout(connectTimeoutRef.current);
                connectTimeoutRef.current = null;
              }
              setCallState("error");
            });
          } catch (err: any) {
            if (connectTimeoutRef.current) {
              clearTimeout(connectTimeoutRef.current);
              connectTimeoutRef.current = null;
            }
            toast.error(`Camera/mic error: ${err?.message ?? err}`);
            setCallState("landing");
          }
        }
      });
    } catch (err: any) {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      toast.error(`Error: ${err?.message ?? err}`);
      setCallState("landing");
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        for (const t of localStreamRef.current.getAudioTracks())
          t.enabled = !next;
      }
      return next;
    });
  };

  const toggleCamera = () => {
    setIsCameraOff((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        for (const t of localStreamRef.current.getVideoTracks())
          t.enabled = !next;
      }
      return next;
    });
  };

  const sendMessage = async () => {
    const text = msgInput.trim();
    if (!text) return;
    if (!dataConnRef.current) {
      toast.error("Not connected. Text chat unavailable.");
      return;
    }
    const msg: ChatMessage = {
      id: Date.now().toString(),
      text,
      from: "me",
      time: getTime(),
      seen: false,
    };
    setMessages((prev) => [...prev, msg]);
    setMsgInput("");
    try {
      if (sharedKeyRef.current) {
        const encrypted = await encryptMessage(sharedKeyRef.current, text);
        dataConnRef.current.send({ type: "encrypted-msg", ...encrypted });
      } else {
        dataConnRef.current.send({ type: "message", text });
      }
    } catch {
      toast.error("Failed to send.");
    }
  };

  const sendTyping = () => {
    if (dataConnRef.current) {
      try {
        dataConnRef.current.send({ type: "typing" });
      } catch {
        /* ignore */
      }
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Code copied!");
  };

  // --- RENDER ---
  const isInCall = callState === "in-call";

  // Login gate
  if (!currentUser) {
    return (
      <div
        className="min-h-screen relative flex items-center justify-center"
        style={{ background: "#020409" }}
      >
        <ParticleBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 glass-card rounded-3xl p-10 max-w-sm w-full mx-4 text-center"
          data-ocid="bytechat.login_required.section"
        >
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.3))",
              border: "1px solid rgba(6,182,212,0.4)",
              boxShadow: "0 0 30px rgba(6,182,212,0.3)",
            }}
          >
            <Lock className="w-10 h-10" style={{ color: "#06b6d4" }} />
          </div>
          <h2
            className="text-3xl font-bold mb-2 title-gradient"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            ByteChat
          </h2>
          <p className="text-slate-400 text-sm mb-2">Login Required</p>
          <p className="text-slate-500 text-xs mb-8">
            Sign in to access end-to-end encrypted video calls and text chat.
            Your conversations are ephemeral and deleted when you log out.
          </p>
          <button
            type="button"
            className="btn-glow-cyan w-full py-3 rounded-xl text-cyan-300 font-semibold flex items-center justify-center gap-2"
            onClick={() => setLoginModalOpen(true)}
            data-ocid="bytechat.login_required.primary_button"
          >
            <UserCircle className="w-5 h-5" />
            Sign In to ByteChat
          </button>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-600">
            <Lock className="w-3 h-3" />
            <span>End-to-End Encrypted</span>
          </div>
        </motion.div>
        <UserLoginModal
          open={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: "#020409" }}>
      <ParticleBackground />

      {/* ByteChat Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.6), rgba(6,182,212,0.6))",
                boxShadow: "0 0 30px rgba(99,102,241,0.5)",
              }}
            />
            <div className="relative flex items-center justify-center">
              <MessageSquare
                className="w-5 h-5 absolute"
                style={{ color: "#a78bfa", left: "2px", top: "4px" }}
              />
              <Video
                className="w-5 h-5 absolute"
                style={{ color: "#06b6d4", right: "2px", bottom: "4px" }}
              />
            </div>
          </div>
          <div>
            <h1
              className="text-3xl font-bold tracking-tight title-gradient"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              ByteChat
            </h1>
            <div className="flex items-center gap-1.5">
              <UserCircle className="w-3 h-3" style={{ color: "#06b6d4" }} />
              <span className="text-xs" style={{ color: "#06b6d4" }}>
                {currentUser.username}
              </span>
              {isEncrypted && (
                <span
                  className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(34,197,94,0.15)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    color: "#22c55e",
                  }}
                >
                  <Lock className="w-2.5 h-2.5" />
                  E2E Encrypted
                </span>
              )}
            </div>
          </div>
          {isInCall && (
            <span className="flex items-center gap-1.5 ml-2">
              <span className="online-dot" />
              <span className="text-xs text-green-400 font-medium">
                Connected
              </span>
            </span>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* LANDING */}
        {callState === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="relative z-10 flex flex-col items-center justify-center px-4 pb-12"
            data-ocid="bytechat.section"
          >
            <p className="text-center text-slate-400 mb-10 text-sm max-w-md">
              Connect with anyone via real-time video call or text chat using a
              simple code.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
              {/* Video Call Card */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: "rgba(6,182,212,0.2)",
                      border: "1px solid rgba(6,182,212,0.4)",
                    }}
                  >
                    <Video className="w-5 h-5" style={{ color: "#06b6d4" }} />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">Video Call</h2>
                    <p className="text-xs text-slate-500">
                      Real-time P2P video
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    className="btn-glow-cyan w-full py-2.5 rounded-xl text-cyan-300 font-medium text-sm"
                    onClick={() => handleGenerateCode("video")}
                    data-ocid="bytechat.video_call.primary_button"
                  >
                    📹 Start Video Call
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700" />
                    </div>
                    <div className="relative flex justify-center">
                      <span
                        className="px-2 text-xs text-slate-500"
                        style={{ background: "#060a14" }}
                      >
                        or join
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter code..."
                      maxLength={8}
                      className="flex-1 bg-slate-900/60 border-slate-700 text-white text-sm placeholder:text-slate-600 focus:border-cyan-500"
                      data-ocid="bytechat.video_join.input"
                    />
                    <button
                      type="button"
                      className="btn-glow-cyan px-3 py-2 rounded-xl text-cyan-300 text-sm"
                      onClick={() => handleJoinCall("video")}
                      disabled={joinCode.trim().length < 4}
                      data-ocid="bytechat.video_join.button"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>

              {/* Text Chat Card */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: "rgba(99,102,241,0.2)",
                      border: "1px solid rgba(99,102,241,0.4)",
                    }}
                  >
                    <MessageSquare
                      className="w-5 h-5"
                      style={{ color: "#a78bfa" }}
                    />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">Text Chat</h2>
                    <p className="text-xs text-slate-500">No camera needed</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    className="btn-glow-indigo w-full py-2.5 rounded-xl text-indigo-300 font-medium text-sm"
                    onClick={() => handleGenerateCode("text")}
                    data-ocid="bytechat.text_chat.primary_button"
                  >
                    💬 Start Text Chat
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700" />
                    </div>
                    <div className="relative flex justify-center">
                      <span
                        className="px-2 text-xs text-slate-500"
                        style={{ background: "#060a14" }}
                      >
                        or join
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter code..."
                      maxLength={8}
                      className="flex-1 bg-slate-900/60 border-slate-700 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500"
                      data-ocid="bytechat.text_join.input"
                    />
                    <button
                      type="button"
                      className="btn-glow-indigo px-3 py-2 rounded-xl text-indigo-300 text-sm"
                      onClick={() => handleJoinCall("text")}
                      disabled={joinCode.trim().length < 4}
                      data-ocid="bytechat.text_join.button"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent chat messages */}
            {messages.length > 0 && (
              <div className="mt-8 w-full max-w-3xl">
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-xs text-slate-500 mb-3">
                    Recent session messages
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {messages.slice(-5).map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] px-3 py-1.5 rounded-xl text-xs text-white ${m.from === "me" ? "msg-me" : "msg-them"}`}
                        >
                          <p>{m.text}</p>
                          <div
                            className={`flex items-center gap-1 mt-0.5 ${m.from === "me" ? "justify-end" : "justify-start"}`}
                          >
                            <span className="text-[10px] opacity-60">
                              {m.time}
                            </span>
                            {m.from === "me" &&
                              (m.seen ? (
                                <CheckCheck className="w-3 h-3 text-blue-400" />
                              ) : (
                                <Check className="w-3 h-3 text-slate-400" />
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {peerError && (
              <div className="mt-4 text-red-400 text-sm text-center">
                {peerError}
              </div>
            )}

            {!peerLoaded && (
              <p className="mt-4 text-slate-500 text-xs animate-pulse">
                Loading connection library...
              </p>
            )}
          </motion.div>
        )}

        {/* WAITING */}
        {callState === "waiting" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-10 flex flex-col items-center justify-center px-4 pb-12"
            data-ocid="bytechat.waiting.section"
          >
            <div className="glass-card rounded-3xl p-10 max-w-sm w-full text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(99,102,241,0.2))",
                    border: "1px solid rgba(6,182,212,0.4)",
                  }}
                >
                  {callMode === "video" ? (
                    <Video className="w-10 h-10" style={{ color: "#06b6d4" }} />
                  ) : (
                    <MessageSquare
                      className="w-10 h-10"
                      style={{ color: "#a78bfa" }}
                    />
                  )}
                </div>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="pulsing-ring"
                    style={{ animationDelay: ["0s", "0.6s", "1.2s"][i] }}
                  />
                ))}
              </div>

              <p className="text-slate-400 text-sm mb-3">
                Share this code with the other person:
              </p>
              <div
                className="code-text text-5xl font-mono font-black tracking-widest mb-6"
                style={{ color: "#06b6d4" }}
              >
                {code}
              </div>

              <button
                type="button"
                className="btn-glow-cyan w-full py-3 rounded-xl text-cyan-300 font-medium flex items-center justify-center gap-2"
                onClick={copyCode}
                data-ocid="bytechat.waiting.copy_button"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Copy Code"}
              </button>

              <button
                type="button"
                className="mt-3 w-full py-2.5 rounded-xl text-slate-400 text-sm border border-slate-700 hover:border-slate-500 transition-colors"
                onClick={hangUp}
                data-ocid="bytechat.waiting.cancel_button"
              >
                Cancel
              </button>

              <p className="mt-4 text-xs text-slate-600 animate-pulse">
                Waiting for someone to connect...
              </p>
            </div>
          </motion.div>
        )}

        {/* CONNECTING */}
        {callState === "connecting" && (
          <motion.div
            key="connecting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] px-4"
            data-ocid="bytechat.connecting.loading_state"
          >
            <div className="glass-card rounded-3xl p-10 max-w-sm w-full text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(99,102,241,0.2)",
                  border: "1px solid rgba(99,102,241,0.4)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
                  style={{
                    borderTopColor: "#6366f1",
                    borderRightColor: "#06b6d4",
                  }}
                />
              </div>
              <p className="text-white font-semibold">Connecting...</p>
              <p className="text-slate-500 text-sm mt-1">
                Establishing secure connection
              </p>
              <button
                type="button"
                className="mt-6 text-slate-500 text-xs hover:text-slate-300 transition-colors"
                onClick={hangUp}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* IN-CALL */}
        {callState === "in-call" && (
          <motion.div
            key="in-call"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col pb-20"
            style={{ minHeight: "calc(100vh - 100px)" }}
          >
            {callMode === "video" ? (
              <div className="flex flex-col lg:flex-row flex-1 gap-3 px-3">
                {/* Video Area */}
                <div className="flex-1 lg:w-[70%] flex flex-col gap-2">
                  {/* Remote Video */}
                  <div
                    className="relative w-full rounded-2xl overflow-hidden"
                    style={{
                      aspectRatio: "16/9",
                      background: "#000",
                      border: "1px solid rgba(6,182,212,0.3)",
                      boxShadow: "0 0 40px rgba(6,182,212,0.15)",
                    }}
                  >
                    {/* biome-ignore lint/a11y/useMediaCaption: live video stream */}
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      data-ocid="bytechat.remote_video.canvas_target"
                      onLoadedMetadata={(e) => {
                        const v = e.currentTarget;
                        v.play().catch(() => setRemoteVideoPaused(true));
                      }}
                    />
                    {remoteVideoPaused && (
                      <button
                        type="button"
                        className="absolute inset-0 flex items-center justify-center bg-black/60"
                        onClick={() => {
                          remoteVideoRef.current?.play().catch(() => {});
                          setRemoteVideoPaused(false);
                        }}
                      >
                        <span className="text-white text-sm bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                          Tap to play
                        </span>
                      </button>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className="online-dot"
                        style={{ width: "8px", height: "8px" }}
                      />
                      <span className="text-xs text-green-400">Live</span>
                    </div>
                    <div className="absolute top-3 right-3 text-sm font-mono text-cyan-400">
                      {formatDuration(duration)}
                    </div>
                  </div>

                  {/* Local Video */}
                  <div
                    className="w-40 h-24 rounded-xl overflow-hidden self-end"
                    style={{
                      background: "#000",
                      border: "1px solid rgba(99,102,241,0.3)",
                      boxShadow: "0 0 20px rgba(99,102,241,0.15)",
                    }}
                  >
                    {/* biome-ignore lint/a11y/useMediaCaption: local camera preview */}
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      data-ocid="bytechat.local_video.canvas_target"
                    />
                  </div>
                </div>

                {/* Chat Sidebar (Messenger-style) */}
                <AnimatePresence>
                  {showChat && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="lg:w-[30%] flex flex-col rounded-2xl overflow-hidden"
                      style={{
                        minHeight: "300px",
                        maxHeight: "calc(100vh - 200px)",
                        background: "rgba(6,10,20,0.85)",
                        border: "1px solid rgba(6,182,212,0.2)",
                      }}
                      data-ocid="bytechat.chat.panel"
                    >
                      <div
                        className="px-4 py-3 flex items-center gap-2"
                        style={{
                          borderBottom: "1px solid rgba(6,182,212,0.15)",
                        }}
                      >
                        <MessageSquare
                          className="w-4 h-4"
                          style={{ color: "#a78bfa" }}
                        />
                        <span className="text-sm text-white font-medium flex-1">
                          Chat
                        </span>
                        {isEncrypted && (
                          <span
                            className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{
                              background: "rgba(34,197,94,0.15)",
                              border: "1px solid rgba(34,197,94,0.3)",
                              color: "#22c55e",
                            }}
                          >
                            <Lock className="w-2 h-2" />
                            E2E
                          </span>
                        )}
                      </div>

                      <ScrollArea className="flex-1 p-3">
                        <div className="space-y-2">
                          {messages.map((m) => (
                            <div
                              key={m.id}
                              className={`flex flex-col ${
                                m.from === "me" ? "items-end" : "items-start"
                              }`}
                            >
                              <div
                                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm text-white ${
                                  m.from === "me"
                                    ? "msg-me rounded-br-sm"
                                    : "msg-them rounded-bl-sm"
                                }`}
                              >
                                <p style={{ wordBreak: "break-word" }}>
                                  {m.text}
                                </p>
                              </div>
                              <div
                                className={`flex items-center gap-1 mt-0.5 px-1 ${
                                  m.from === "me"
                                    ? "flex-row-reverse"
                                    : "flex-row"
                                }`}
                              >
                                <span className="text-[10px] text-slate-600">
                                  {m.time}
                                </span>
                                {m.from === "me" &&
                                  (m.seen ? (
                                    <CheckCheck className="w-3 h-3 text-blue-400" />
                                  ) : (
                                    <Check className="w-3 h-3 text-slate-500" />
                                  ))}
                              </div>
                            </div>
                          ))}
                          {isTyping && (
                            <div className="flex items-center gap-1.5 px-3 py-2">
                              {[0, 1, 2].map((i) => (
                                <span
                                  key={i}
                                  className="typing-dot w-2 h-2 rounded-full bg-cyan-400"
                                  style={{ animationDelay: `${i * 0.2}s` }}
                                />
                              ))}
                            </div>
                          )}
                          <div ref={chatBottomRef} />
                        </div>
                      </ScrollArea>

                      <div className="chat-input-area px-3 py-2 flex items-center gap-2">
                        <Input
                          value={msgInput}
                          onChange={(e) => {
                            setMsgInput(e.target.value);
                            sendTyping();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          placeholder="Message..."
                          className="flex-1 bg-slate-900/80 border-slate-700 text-white text-sm placeholder:text-slate-600 focus:border-cyan-500 rounded-full"
                          data-ocid="bytechat.chat.input"
                        />
                        <button
                          type="button"
                          className="btn-glow-cyan p-2 rounded-full"
                          onClick={sendMessage}
                          data-ocid="bytechat.chat.submit_button"
                        >
                          <Send className="w-4 h-4 text-cyan-300" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* TEXT-ONLY CHAT (full width, Messenger-style) */
              <div
                className="flex flex-col mx-3 rounded-2xl overflow-hidden"
                style={{
                  minHeight: "calc(100vh - 220px)",
                  background: "rgba(6,10,20,0.85)",
                  border: "1px solid rgba(99,102,241,0.25)",
                }}
                data-ocid="bytechat.text_chat.panel"
              >
                <div
                  className="px-5 py-3.5 flex items-center gap-2"
                  style={{ borderBottom: "1px solid rgba(99,102,241,0.2)" }}
                >
                  <span
                    className="online-dot"
                    style={{ width: "8px", height: "8px" }}
                  />
                  <MessageSquare
                    className="w-4 h-4"
                    style={{ color: "#a78bfa" }}
                  />
                  <span className="text-sm text-white font-semibold flex-1">
                    ByteChat — Text Session
                  </span>
                  {isEncrypted && (
                    <span
                      className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(34,197,94,0.15)",
                        border: "1px solid rgba(34,197,94,0.3)",
                        color: "#22c55e",
                      }}
                    >
                      <Lock className="w-2.5 h-2.5" />
                      End-to-End Encrypted
                    </span>
                  )}
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3 max-w-2xl mx-auto">
                    {messages.length === 0 && (
                      <div className="text-center py-12">
                        <MessageSquare
                          className="w-12 h-12 mx-auto mb-3"
                          style={{ color: "rgba(99,102,241,0.3)" }}
                        />
                        <p className="text-slate-500 text-sm">
                          No messages yet. Say hello!
                        </p>
                      </div>
                    )}
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          m.from === "me" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm text-white ${
                            m.from === "me"
                              ? "msg-me rounded-br-sm"
                              : "msg-them rounded-bl-sm"
                          }`}
                        >
                          <p style={{ wordBreak: "break-word" }}>{m.text}</p>
                        </div>
                        <div
                          className={`flex items-center gap-1 mt-1 px-1 ${
                            m.from === "me" ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <span className="text-[10px] text-slate-600">
                            {m.time}
                          </span>
                          {m.from === "me" &&
                            (m.seen ? (
                              <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-slate-500" />
                            ))}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex items-start">
                        <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm msg-them flex items-center gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="typing-dot w-2 h-2 rounded-full bg-cyan-400"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>
                </ScrollArea>

                <div className="chat-input-area px-4 py-3 flex items-center gap-3">
                  <Input
                    value={msgInput}
                    onChange={(e) => {
                      setMsgInput(e.target.value);
                      sendTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-900/80 border-slate-700/60 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500 rounded-full px-5"
                    data-ocid="bytechat.text_chat.input"
                  />
                  <button
                    type="button"
                    className="btn-glow-indigo p-2.5 rounded-full"
                    onClick={sendMessage}
                    data-ocid="bytechat.text_chat.submit_button"
                  >
                    <Send className="w-4 h-4 text-indigo-300" />
                  </button>
                </div>
              </div>
            )}

            {/* Control Bar */}
            <div className="bc-control-bar fixed bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-4 py-4 px-6">
              {callMode === "video" && (
                <>
                  <button
                    type="button"
                    className={`p-3 rounded-full transition-all ${
                      isMuted ? "btn-glow-red" : "btn-glow-indigo"
                    }`}
                    onClick={toggleMute}
                    title={isMuted ? "Unmute" : "Mute"}
                    data-ocid="bytechat.controls.toggle"
                  >
                    {isMuted ? (
                      <MicOff className="w-5 h-5 text-red-300" />
                    ) : (
                      <Mic className="w-5 h-5 text-indigo-300" />
                    )}
                  </button>

                  <button
                    type="button"
                    className={`p-3 rounded-full transition-all ${
                      isCameraOff ? "btn-glow-red" : "btn-glow-cyan"
                    }`}
                    onClick={toggleCamera}
                    title={isCameraOff ? "Turn on camera" : "Turn off camera"}
                    data-ocid="bytechat.controls.toggle"
                  >
                    {isCameraOff ? (
                      <VideoOff className="w-5 h-5 text-red-300" />
                    ) : (
                      <Video className="w-5 h-5 text-cyan-300" />
                    )}
                  </button>
                </>
              )}

              {callMode === "video" && (
                <button
                  type="button"
                  className="btn-glow-indigo p-3 rounded-full relative"
                  onClick={() => {
                    setShowChat((s) => !s);
                    setUnreadCount(0);
                  }}
                  title="Toggle Chat"
                  data-ocid="bytechat.controls.toggle"
                >
                  <MessageSquare className="w-5 h-5 text-indigo-300" />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                      style={{ background: "#ef4444" }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                className="btn-glow-red p-4 rounded-full"
                onClick={hangUp}
                title="End Call"
                data-ocid="bytechat.controls.delete_button"
              >
                {callMode === "video" ? (
                  <PhoneOff className="w-6 h-6 text-red-300" />
                ) : (
                  <Phone
                    className="w-6 h-6 text-red-300"
                    style={{ transform: "rotate(135deg)" }}
                  />
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ERROR */}
        {callState === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex items-center justify-center min-h-[60vh] px-4"
            data-ocid="bytechat.error.error_state"
          >
            <div className="glass-card rounded-3xl p-10 max-w-sm w-full text-center">
              <p className="text-red-400 font-semibold mb-4">
                Connection Error
              </p>
              <p className="text-slate-500 text-sm mb-6">
                Unable to establish connection. Check your network and try
                again.
              </p>
              <button
                type="button"
                className="btn-glow-cyan w-full py-3 rounded-xl text-cyan-300"
                onClick={() => setCallState("landing")}
                data-ocid="bytechat.error.primary_button"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
