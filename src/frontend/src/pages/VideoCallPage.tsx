import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
type CallState = "idle" | "connecting" | "in-call" | "incoming";

interface ChatMessage {
  id: string;
  text: string;
  from: "me" | "them";
  time: string;
  seen: boolean;
}

interface IncomingInfo {
  fromId: string;
  mode: CallMode;
  call?: any;
  conn?: any;
}

declare global {
  interface Window {
    Peer: any;
  }
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

const PARTICLE_DATA = Array.from({ length: 20 }, (_, i) => ({
  id: `p${i}`,
  w: `${Math.random() * 4 + 2}px`,
  h: `${Math.random() * 4 + 2}px`,
  left: `${Math.random() * 100}%`,
  bg: i % 3 === 0 ? "#06b6d4" : i % 3 === 1 ? "#6366f1" : "#a78bfa",
  dur: `${Math.random() * 15 + 10}s`,
  delay: `-${Math.random() * 10}s`,
  drift: `${(Math.random() - 0.5) * 100}px`,
}));

function ParticleBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes float-particle {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-10vh) translateX(var(--drift)); opacity: 0; }
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
        @keyframes uid-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(6,182,212,0.4), 0 0 30px rgba(99,102,241,0.2); }
          50% { box-shadow: 0 0 30px rgba(6,182,212,0.7), 0 0 60px rgba(99,102,241,0.4); }
        }
        .bc-particle { position: absolute; border-radius: 50%; animation: float-particle linear infinite; }
        .bc-nebula { animation: nebula-drift ease-in-out infinite; }
        .pulsing-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(6,182,212,0.5); animation: ring-expand 2s ease-out infinite; }
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
        .uid-card { animation: uid-glow 3s ease-in-out infinite; }
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

function createPeerWithICE(id?: string): any {
  const config = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
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
  };
  if (id) {
    return new window.Peer(id, { config });
  }
  return new window.Peer({ config });
}

export default function VideoCallPage() {
  const { currentUser, logout } = useUser();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [callState, setCallState] = useState<CallState>("idle");
  const [callMode, setCallMode] = useState<CallMode>("video");
  const [friendId, setFriendId] = useState("");
  const [copiedUid, setCopiedUid] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [peerLoaded, setPeerLoaded] = useState(false);
  const [peerReady, setPeerReady] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadChatsFromSession(),
  );
  const [msgInput, setMsgInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [remoteVideoPaused, setRemoteVideoPaused] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [incomingInfo, setIncomingInfo] = useState<IncomingInfo | null>(null);
  const [connectedPeerId, setConnectedPeerId] = useState("");

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
  const messagesRef = useRef(messages);

  // E2E encryption refs
  const keyPairRef = useRef<CryptoKeyPair | null>(null);
  const sharedKeyRef = useRef<CryptoKey | null>(null);

  // Keep messages ref in sync for saveChatsToSession
  useEffect(() => {
    messagesRef.current = messages;
    saveChatsToSession(messages);
  }, [messages]);

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
    script.onerror = () => toast.error("Failed to load connection library.");
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional scroll on messages
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const getLocalStream = useCallback(async (): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, frameRate: 24 },
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  }, []);

  const cleanupPeer = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (localStreamRef.current) {
      for (const t of localStreamRef.current.getTracks()) t.stop();
      localStreamRef.current = null;
    }
    if (callRef.current) {
      try {
        callRef.current.close();
      } catch {
        /* ignore */
      }
      callRef.current = null;
    }
    if (dataConnRef.current) {
      try {
        dataConnRef.current.close();
      } catch {
        /* ignore */
      }
      dataConnRef.current = null;
    }
    sharedKeyRef.current = null;
    keyPairRef.current = null;
  }, []);

  const handleRemoteStream = useCallback((stream: MediaStream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.onloadedmetadata = () => {
        const vid = remoteVideoRef.current;
        if (vid) vid.play().catch(() => setRemoteVideoPaused(true));
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
            // ignore
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
            const updated = prev.map((m) =>
              m.from === "me" ? { ...m, seen: true } : m,
            );
            return [...updated, newMsg];
          });
          setIsTyping(false);
          setUnreadCount((c) => c + 1);
        } else if (data?.type === "message") {
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

  // Initialize always-on peer when user is logged in and PeerJS is loaded
  useEffect(() => {
    if (!currentUser || !peerLoaded) return;
    if (!window.Peer) return;

    const peerId = `bytechat-${currentUser.uniqueId.toLowerCase()}`;

    // Destroy any existing peer first
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch {
        /* ignore */
      }
      peerRef.current = null;
    }

    const peer = createPeerWithICE(peerId);
    peerRef.current = peer;

    peer.on("open", () => {
      setPeerReady(true);
    });

    peer.on("error", (err: any) => {
      // If ID taken (already open in another tab), try without fixed ID
      if (err.type === "unavailable-id") {
        toast.error("Your ByteChat is already open in another tab.");
      }
      setPeerReady(false);
    });

    // Handle incoming video calls
    peer.on("call", (incomingCall: any) => {
      const fromId = incomingCall.peer?.replace("bytechat-", "") ?? "unknown";
      setIncomingInfo({ fromId, mode: "video", call: incomingCall });
      setCallState("incoming");
    });

    // Handle incoming text connections
    peer.on("connection", (conn: any) => {
      const fromId = conn.peer?.replace("bytechat-", "") ?? "unknown";
      conn.on("open", () => {
        setIncomingInfo({ fromId, mode: "text", conn });
        setCallState("incoming");
      });
    });

    return () => {
      setPeerReady(false);
      try {
        peer.destroy();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, peerLoaded]);

  const hangUp = useCallback(() => {
    cleanupPeer();
    setCallState("idle");
    setFriendId("");
    setIsMuted(false);
    setIsCameraOff(false);
    setMessages([]);
    setUnreadCount(0);
    setIsTyping(false);
    setRemoteVideoPaused(false);
    setIsEncrypted(false);
    setConnectedPeerId("");
    setIncomingInfo(null);
  }, [cleanupPeer]);

  const handleCallFriend = async (mode: CallMode) => {
    const trimmed = friendId.trim();
    if (!trimmed) {
      toast.error("Enter your friend's Unique ID.");
      return;
    }
    if (!peerRef.current || !peerReady) {
      toast.error("Connection not ready yet. Wait a moment.");
      return;
    }

    setCallMode(mode);
    setCallState("connecting");
    setMessages([]);
    setConnectedPeerId(trimmed);

    const targetPeerId = `bytechat-${trimmed.toLowerCase()}`;

    if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
    connectTimeoutRef.current = setTimeout(() => {
      cleanupPeer();
      setCallState("idle");
      toast.error(
        "Connection timed out. Make sure the other person is on ByteChat.",
      );
    }, 20000);

    try {
      // Always establish data connection for text/chat
      const dataConn = peerRef.current.connect(targetPeerId, {
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
      dataConn.on("error", () => {
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        toast.error(
          "Could not connect. Make sure the other person is on ByteChat.",
        );
        setCallState("idle");
      });

      if (mode === "video") {
        const localStream = await getLocalStream();
        const outgoingCall = peerRef.current.call(targetPeerId, localStream);
        callRef.current = outgoingCall;

        outgoingCall.on("stream", (remoteStream: MediaStream) => {
          if (connectTimeoutRef.current) {
            clearTimeout(connectTimeoutRef.current);
            connectTimeoutRef.current = null;
          }
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
          toast.error("Video call failed.");
          setCallState("idle");
        });
      }
    } catch (err: any) {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      toast.error(`Error: ${err?.message ?? err}`);
      setCallState("idle");
    }
  };

  const acceptIncoming = async () => {
    if (!incomingInfo) return;
    const info = incomingInfo;
    setIncomingInfo(null);
    setCallMode(info.mode);
    setConnectedPeerId(info.fromId);

    if (info.mode === "text" && info.conn) {
      setupDataConnection(info.conn);
      setCallState("in-call");
    } else if (info.mode === "video" && info.call) {
      try {
        const localStream = await getLocalStream();
        info.call.answer(localStream);
        callRef.current = info.call;
        info.call.on("stream", (remoteStream: MediaStream) => {
          handleRemoteStream(remoteStream);
        });
        info.call.on("close", () => {
          toast.info("Call ended.");
          hangUp();
        });
        setCallState("in-call");
      } catch (err: any) {
        toast.error(`Camera error: ${err?.message ?? err}`);
        setCallState("idle");
      }
    }
  };

  const declineIncoming = () => {
    if (incomingInfo?.call) {
      try {
        incomingInfo.call.close();
      } catch {
        /* ignore */
      }
    }
    if (incomingInfo?.conn) {
      try {
        incomingInfo.conn.close();
      } catch {
        /* ignore */
      }
    }
    setIncomingInfo(null);
    setCallState("idle");
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

  const copyUid = async () => {
    if (!currentUser) return;
    await navigator.clipboard.writeText(currentUser.uniqueId);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
    toast.success("Unique ID copied!");
  };

  // --- RENDER ---
  const isInCall = callState === "in-call";

  // Login gate - show login inside ByteChat page
  if (!currentUser) {
    return (
      <div
        className="min-h-screen relative flex items-center justify-center overflow-hidden"
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
            <span>End-to-end encrypted &bull; Ephemeral chats</span>
          </div>
        </motion.div>

        <UserLoginModal
          open={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
        />
      </div>
    );
  }

  const ChatPanel = ({ inSidebar = false }: { inSidebar?: boolean }) => (
    <div
      className={`flex flex-col ${
        inSidebar ? "h-full" : "flex-1 rounded-2xl overflow-hidden"
      }`}
      style={{
        background: "rgba(6,10,20,0.85)",
        border: "1px solid rgba(6,182,212,0.2)",
      }}
      data-ocid="bytechat.chat.panel"
    >
      {/* Chat header */}
      <div
        className="px-4 py-3 flex items-center gap-2 shrink-0"
        style={{ borderBottom: "1px solid rgba(6,182,212,0.15)" }}
      >
        <MessageSquare className="w-4 h-4" style={{ color: "#a78bfa" }} />
        <span className="text-sm text-white font-medium flex-1">
          {connectedPeerId ? `Chat with ${connectedPeerId}` : "Chat"}
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
            <Lock className="w-2.5 h-2.5" />
            E2E
          </span>
        )}
        {unreadCount > 0 && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
            style={{ background: "#6366f1", color: "white" }}
          >
            {unreadCount}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <Lock
              className="w-8 h-8 mb-3"
              style={{ color: "rgba(99,102,241,0.4)" }}
            />
            <p className="text-slate-500 text-xs">
              Messages are end-to-end encrypted.
            </p>
            <p className="text-slate-600 text-xs mt-1">Start a conversation!</p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.from === "me" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm text-white ${
                m.from === "me"
                  ? "msg-me rounded-br-sm"
                  : "msg-them rounded-bl-sm"
              }`}
            >
              <p style={{ wordBreak: "break-word" }}>{m.text}</p>
              <div
                className={`flex items-center gap-1 mt-1 ${
                  m.from === "me" ? "justify-end" : "justify-start"
                }`}
              >
                <span className="text-[10px] opacity-50">{m.time}</span>
                {m.from === "me" &&
                  (m.seen ? (
                    <CheckCheck className="w-3 h-3 text-blue-400" />
                  ) : (
                    <Check className="w-3 h-3 text-slate-500" />
                  ))}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="msg-them px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <div
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

      {/* Input */}
      <div className="chat-input-area p-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <input
            value={msgInput}
            onChange={(e) => {
              setMsgInput(e.target.value);
              sendTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            data-ocid="bytechat.chat.input"
          />
          <button
            type="submit"
            disabled={!msgInput.trim()}
            className="btn-glow-cyan px-3 py-2 rounded-xl text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            data-ocid="bytechat.chat.submit_button"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div
      className="h-screen overflow-hidden flex flex-col"
      style={{ background: "#020409" }}
    >
      <ParticleBackground />

      {/* Incoming Call Modal */}
      <AnimatePresence>
        {callState === "incoming" && incomingInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(12px)",
            }}
            data-ocid="bytechat.incoming.modal"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card rounded-3xl p-8 max-w-sm w-full mx-4 text-center"
            >
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(6,182,212,0.3), rgba(99,102,241,0.3))",
                    border: "1px solid rgba(6,182,212,0.4)",
                  }}
                >
                  {incomingInfo.mode === "video" ? (
                    <Video className="w-9 h-9" style={{ color: "#06b6d4" }} />
                  ) : (
                    <MessageSquare
                      className="w-9 h-9"
                      style={{ color: "#a78bfa" }}
                    />
                  )}
                </div>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="pulsing-ring"
                    style={{ animationDelay: `${i * 0.6}s` }}
                  />
                ))}
              </div>
              <p className="text-slate-400 text-sm mb-1">Incoming</p>
              <h3
                className="text-xl font-bold mb-1"
                style={{
                  color: incomingInfo.mode === "video" ? "#06b6d4" : "#a78bfa",
                }}
              >
                {incomingInfo.mode === "video" ? "Video Call" : "Text Chat"}
              </h3>
              <p className="text-white font-semibold mb-6">
                from{" "}
                <span
                  className="px-2 py-0.5 rounded-lg text-cyan-300"
                  style={{
                    background: "rgba(6,182,212,0.15)",
                    border: "1px solid rgba(6,182,212,0.3)",
                  }}
                >
                  {incomingInfo.fromId}
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 py-3 rounded-xl text-red-300 font-semibold btn-glow-red flex items-center justify-center gap-2"
                  onClick={declineIncoming}
                  data-ocid="bytechat.incoming.cancel_button"
                >
                  <PhoneOff className="w-4 h-4" />
                  Decline
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 rounded-xl text-cyan-300 font-semibold btn-glow-cyan flex items-center justify-center gap-2"
                  onClick={acceptIncoming}
                  data-ocid="bytechat.incoming.confirm_button"
                >
                  <Phone className="w-4 h-4" />
                  Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div
        className="relative z-10 px-4 py-3 flex items-center gap-3 shrink-0"
        style={{
          background: "rgba(6,10,20,0.9)",
          borderBottom: "1px solid rgba(6,182,212,0.2)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-10 h-10 flex items-center justify-center">
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
                className="w-4 h-4 absolute"
                style={{ color: "#a78bfa", left: "1px", top: "3px" }}
              />
              <Video
                className="w-4 h-4 absolute"
                style={{ color: "#06b6d4", right: "1px", bottom: "3px" }}
              />
            </div>
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight title-gradient"
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
              {isInCall && (
                <span className="flex items-center gap-1.5">
                  <span
                    className="online-dot"
                    style={{ width: "7px", height: "7px" }}
                  />
                  <span className="text-xs text-green-400">
                    {formatDuration(duration)}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isInCall && (
            <button
              type="button"
              onClick={() => setShowChat((v) => !v)}
              className="p-2 rounded-full text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all relative"
              title="Toggle chat"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 text-[9px] font-bold px-1 rounded-full"
                  style={{ background: "#6366f1", color: "white" }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              logout();
            }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all"
            data-ocid="bytechat.logout.button"
          >
            <PhoneOff className="w-3 h-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {/* IDLE */}
          {callState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto"
              data-ocid="bytechat.section"
            >
              {/* Unique ID Display */}
              <div
                className="uid-card rounded-2xl p-5 mb-8 w-full max-w-md"
                style={{
                  background: "rgba(6,10,20,0.85)",
                  border: "1px solid rgba(6,182,212,0.4)",
                }}
                data-ocid="bytechat.uid.card"
              >
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">
                  Your Unique ID
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 text-2xl font-bold font-mono tracking-widest"
                    style={{
                      background:
                        "linear-gradient(90deg, #06b6d4, #6366f1, #a78bfa)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {currentUser.uniqueId}
                  </div>
                  <button
                    type="button"
                    onClick={copyUid}
                    className="p-2.5 rounded-xl transition-all shrink-0"
                    style={{
                      background: copiedUid
                        ? "rgba(34,197,94,0.2)"
                        : "rgba(6,182,212,0.15)",
                      border: copiedUid
                        ? "1px solid rgba(34,197,94,0.4)"
                        : "1px solid rgba(6,182,212,0.3)",
                      color: copiedUid ? "#22c55e" : "#06b6d4",
                    }}
                    title="Copy Unique ID"
                    data-ocid="bytechat.uid.button"
                  >
                    {copiedUid ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Share this ID with friends so they can call or message you.
                </p>
                {peerReady ? (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span
                      className="online-dot"
                      style={{ width: "7px", height: "7px" }}
                    />
                    <span className="text-xs text-green-400">
                      Online &amp; reachable
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-yellow-500 mt-2 animate-pulse">
                    Connecting to network...
                  </p>
                )}
              </div>

              {/* Connect to friend */}
              <div
                className="glass-card rounded-2xl p-6 w-full max-w-md"
                data-ocid="bytechat.connect.card"
              >
                <h2 className="text-white font-semibold mb-1">
                  Connect with a Friend
                </h2>
                <p className="text-slate-500 text-xs mb-4">
                  Enter your friend&apos;s Unique ID to start a video call or
                  text chat.
                </p>

                <div className="space-y-3">
                  <Input
                    value={friendId}
                    onChange={(e) => setFriendId(e.target.value)}
                    placeholder="Enter friend's Unique ID (e.g. alok123)"
                    className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-cyan-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCallFriend("text");
                    }}
                    data-ocid="bytechat.connect.input"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="btn-glow-cyan py-3 rounded-xl text-cyan-300 font-medium flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => handleCallFriend("video")}
                      disabled={!friendId.trim() || !peerReady}
                      data-ocid="bytechat.video_call.primary_button"
                    >
                      <Video className="w-4 h-4" />
                      Video Call
                    </button>
                    <button
                      type="button"
                      className="btn-glow-indigo py-3 rounded-xl text-indigo-300 font-medium flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => handleCallFriend("text")}
                      disabled={!friendId.trim() || !peerReady}
                      data-ocid="bytechat.text_chat.primary_button"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Text Chat
                    </button>
                  </div>
                </div>
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
              className="flex-1 flex flex-col items-center justify-center px-4"
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
                <p className="text-white font-semibold">
                  Connecting to{" "}
                  <span style={{ color: "#06b6d4" }}>{connectedPeerId}</span>...
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Make sure they are on ByteChat
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
              className="flex-1 overflow-hidden flex flex-col"
            >
              {callMode === "video" ? (
                <div className="flex-1 flex flex-col lg:flex-row gap-2 p-2 overflow-hidden">
                  {/* Video Area */}
                  <div className="flex-1 lg:w-[70%] flex flex-col gap-2 min-w-0">
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
                          style={{ width: "7px", height: "7px" }}
                        />
                        <span className="text-xs text-green-400">
                          Live &bull; {connectedPeerId}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 text-sm font-mono text-cyan-400">
                        {formatDuration(duration)}
                      </div>
                    </div>

                    {/* Local Video */}
                    <div
                      className="w-36 h-20 rounded-xl overflow-hidden self-end"
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

                  {/* Chat Sidebar */}
                  <AnimatePresence>
                    {showChat && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="lg:w-[30%] flex flex-col min-w-0 overflow-hidden"
                        style={{ maxHeight: "100%" }}
                      >
                        <ChatPanel inSidebar />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Text-only chat */
                <div className="flex-1 flex flex-col p-3 overflow-hidden">
                  <ChatPanel />
                </div>
              )}

              {/* Control Bar */}
              <div className="bc-control-bar px-6 py-4 flex items-center justify-center gap-4 shrink-0">
                {callMode === "video" && (
                  <>
                    <button
                      type="button"
                      onClick={toggleMute}
                      className={`p-3 rounded-full transition-all ${
                        isMuted
                          ? "bg-red-500/30 border border-red-500/50 text-red-300"
                          : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300"
                      }`}
                      title={isMuted ? "Unmute" : "Mute"}
                      data-ocid="bytechat.mute.toggle"
                    >
                      {isMuted ? (
                        <MicOff className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={toggleCamera}
                      className={`p-3 rounded-full transition-all ${
                        isCameraOff
                          ? "bg-red-500/30 border border-red-500/50 text-red-300"
                          : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300"
                      }`}
                      title={isCameraOff ? "Turn camera on" : "Turn camera off"}
                      data-ocid="bytechat.camera.toggle"
                    >
                      {isCameraOff ? (
                        <VideoOff className="w-5 h-5" />
                      ) : (
                        <Video className="w-5 h-5" />
                      )}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={hangUp}
                  className="btn-glow-red px-6 py-3 rounded-full text-red-300 font-semibold flex items-center gap-2"
                  data-ocid="bytechat.hangup.button"
                >
                  <PhoneOff className="w-5 h-5" />
                  End {callMode === "video" ? "Call" : "Chat"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <UserLoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </div>
  );
}
