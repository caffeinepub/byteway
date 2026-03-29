import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Copy,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  MessageCircle,
  MoreVertical,
  Palette,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useUser } from "../context/UserContext";
declare global {
  interface Window {
    Peer: any;
  }
}

// ─────────────────────────── TYPES ──────────────────────────────

interface Message {
  id: string;
  text: string;
  from: "me" | "them";
  time: string;
  seen: boolean;
}

interface Conversation {
  peerId: string;
  peerName: string;
  messages: Message[];
  isOnline: boolean;
  isTyping: boolean;
  lastSeen?: string;
  unreadCount?: number;
}

// ──────────────────── THEMES ─────────────────────────────────────

interface ChatTheme {
  id: string;
  name: string;
  bg: string;
  sidebarBg: string;
  headerBg: string;
  sentBubble: string;
  receivedBubble: string;
  sentText: string;
  receivedText: string;
  inputBg: string;
  borderColor: string;
  label: string;
  accent: string;
}

const THEMES: ChatTheme[] = [
  {
    id: "dark",
    name: "Dark",
    label: "🌙",
    bg: "#0a0a1a",
    sidebarBg: "#111128",
    headerBg: "rgba(17,17,40,0.97)",
    sentBubble: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    receivedBubble: "#1e1e3a",
    sentText: "#fff",
    receivedText: "#e0e0f0",
    inputBg: "#1a1a30",
    borderColor: "#1e1e3a",
    accent: "#6366f1",
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    label: "🌊",
    bg: "#040e1a",
    sidebarBg: "#071525",
    headerBg: "rgba(7,21,37,0.97)",
    sentBubble: "linear-gradient(135deg,#0284c7,#0ea5e9)",
    receivedBubble: "#0c2234",
    sentText: "#fff",
    receivedText: "#bae6fd",
    inputBg: "#0c2030",
    borderColor: "#0c2234",
    accent: "#0ea5e9",
  },
  {
    id: "purple",
    name: "Purple Haze",
    label: "💜",
    bg: "#0d0814",
    sidebarBg: "#140c1e",
    headerBg: "rgba(20,12,30,0.97)",
    sentBubble: "linear-gradient(135deg,#7c3aed,#a855f7)",
    receivedBubble: "#1e1228",
    sentText: "#fff",
    receivedText: "#e9d5ff",
    inputBg: "#1a1025",
    borderColor: "#2d1248",
    accent: "#a855f7",
  },
  {
    id: "forest",
    name: "Forest",
    label: "🌲",
    bg: "#061208",
    sidebarBg: "#091a0c",
    headerBg: "rgba(9,26,12,0.97)",
    sentBubble: "linear-gradient(135deg,#15803d,#22c55e)",
    receivedBubble: "#0f2416",
    sentText: "#fff",
    receivedText: "#bbf7d0",
    inputBg: "#0d1f10",
    borderColor: "#14321a",
    accent: "#22c55e",
  },
  {
    id: "sunset",
    name: "Sunset",
    label: "🌅",
    bg: "#140805",
    sidebarBg: "#1e0e08",
    headerBg: "rgba(30,14,8,0.97)",
    sentBubble: "linear-gradient(135deg,#ea580c,#f97316)",
    receivedBubble: "#231208",
    sentText: "#fff",
    receivedText: "#fed7aa",
    inputBg: "#1c1008",
    borderColor: "#2e1a08",
    accent: "#f97316",
  },
  {
    id: "rose",
    name: "Rose Pink",
    label: "🌹",
    bg: "#13060d",
    sidebarBg: "#1e0a14",
    headerBg: "rgba(30,10,20,0.97)",
    sentBubble: "linear-gradient(135deg,#be185d,#ec4899)",
    receivedBubble: "#25101a",
    sentText: "#fff",
    receivedText: "#fce7f3",
    inputBg: "#1c0e16",
    borderColor: "#331222",
    accent: "#ec4899",
  },
  {
    id: "midnight",
    name: "Midnight",
    label: "🖤",
    bg: "#000000",
    sidebarBg: "#050505",
    headerBg: "rgba(5,5,5,0.99)",
    sentBubble: "linear-gradient(135deg,#0891b2,#06b6d4)",
    receivedBubble: "#111111",
    sentText: "#fff",
    receivedText: "#cffafe",
    inputBg: "#0d0d0d",
    borderColor: "#1a1a1a",
    accent: "#06b6d4",
  },
  {
    id: "light",
    name: "Light",
    label: "☀️",
    bg: "#f8f9ff",
    sidebarBg: "#ffffff",
    headerBg: "rgba(255,255,255,0.97)",
    sentBubble: "linear-gradient(135deg,#4f46e5,#6366f1)",
    receivedBubble: "#eef0fb",
    sentText: "#fff",
    receivedText: "#1e1b4b",
    inputBg: "#f1f2f9",
    borderColor: "#e0e2f0",
    accent: "#4f46e5",
  },
  {
    id: "spiderman",
    name: "Spider-Man",
    label: "🕷️",
    bg: "#0a0005",
    sidebarBg: "#110008",
    headerBg: "rgba(12,0,8,0.97)",
    sentBubble: "linear-gradient(135deg,#cc0000,#991b1b)",
    receivedBubble: "#1a0a0e",
    sentText: "#fff",
    receivedText: "#fca5a5",
    inputBg: "#160008",
    borderColor: "#3a0010",
    accent: "#cc0000",
  },
];

const THEME_KEY = "bytechat_theme";

function getTheme(id: string): ChatTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

// ──────────────────── CONSTANTS ─────────────────────────────────

const CONVS_KEY = "bytechat_convs";

const AVATAR_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ──────────────────── CRYPTO HELPERS ────────────────────────────

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

// ────────────────── PEERJS LOADER ───────────────────────────────
// ────────────────── STORAGE HELPERS ─────────────────────────────

function loadConversations(username: string): Conversation[] {
  try {
    const raw = sessionStorage.getItem(`${CONVS_KEY}_${username}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(username: string, convs: Conversation[]) {
  try {
    sessionStorage.setItem(`${CONVS_KEY}_${username}`, JSON.stringify(convs));
  } catch {
    /**/
  }
}

function clearSessionData(username: string) {
  sessionStorage.removeItem(`${CONVS_KEY}_${username}`);
}

// ─────────────────────── AUTH SCREEN ────────────────────────────

function AuthScreen() {
  const { login, register } = useUser();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(username.trim(), password);
      } else {
        if (!uniqueId.trim()) {
          setError("Unique ID is required");
          setLoading(false);
          return;
        }
        await register(username.trim(), password, uniqueId.trim());
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-full px-4"
      style={{
        background:
          "linear-gradient(160deg, #07071a 0%, #0d0d25 60%, #0a0a1f 100%)",
      }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          >
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ByteChat</h1>
          <p className="text-sm mt-1" style={{ color: "#8888aa" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: "#111128", border: "1px solid #1e1e3a" }}
        >
          <div
            className="flex rounded-xl overflow-hidden mb-5"
            style={{ background: "#0d0d20" }}
          >
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className="flex-1 py-2.5 text-sm font-medium transition-all"
                style={{
                  background: mode === m ? "#6366f1" : "transparent",
                  color: mode === m ? "#fff" : "#8888aa",
                  borderRadius: 10,
                }}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <p
                className="block text-xs font-medium mb-1.5"
                style={{ color: "#8888aa" }}
              >
                Username
              </p>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                required
                autoComplete="username"
                className="w-full px-4 rounded-xl text-white placeholder-gray-600 border outline-none transition-colors"
                style={{
                  background: "#0d0d20",
                  borderColor: "#2a2a4a",
                  height: "48px",
                  fontSize: "16px",
                }}
                data-ocid="auth.username_input"
              />
            </div>

            <div>
              <p
                className="block text-xs font-medium mb-1.5"
                style={{ color: "#8888aa" }}
              >
                Password
              </p>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  className="w-full px-4 pr-12 rounded-xl text-white placeholder-gray-600 border outline-none transition-colors"
                  style={{
                    background: "#0d0d20",
                    borderColor: "#2a2a4a",
                    height: "48px",
                    fontSize: "16px",
                  }}
                  data-ocid="auth.password_input"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: "#555570" }}
                >
                  {showPass ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div>
                <p
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "#8888aa" }}
                >
                  Unique ID
                </p>
                <input
                  type="text"
                  value={uniqueId}
                  onChange={(e) => setUniqueId(e.target.value)}
                  placeholder="e.g. alok123 (used to connect)"
                  required
                  autoComplete="off"
                  className="w-full px-4 rounded-xl text-white placeholder-gray-600 border outline-none transition-colors"
                  style={{
                    background: "#0d0d20",
                    borderColor: "#2a2a4a",
                    height: "48px",
                    fontSize: "16px",
                  }}
                  data-ocid="auth.uniqueid_input"
                />
                <p className="text-xs mt-1.5" style={{ color: "#555570" }}>
                  Others use this ID to call or chat with you
                </p>
              </div>
            )}

            {error && (
              <div
                className="px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
                data-ocid="auth.error_state"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                fontSize: "16px",
              }}
              data-ocid="auth.submit_button"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5" style={{ color: "#555570" }} />
          <p className="text-xs" style={{ color: "#555570" }}>
            End-to-end encrypted · Chats deleted on logout
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────── TYPING DOT ─────────────────────────────

function TypingIndicator({ theme }: { theme: ChatTheme }) {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ background: theme.receivedBubble }}
      >
        <User className="w-4 h-4" style={{ color: "#8888aa" }} />
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1"
        style={{ background: theme.receivedBubble }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={`dot-${i}`}
            className="w-2 h-2 rounded-full"
            style={{
              background: theme.accent,
              animation: "typingBounce 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ──────────────────── AVATAR ─────────────────────────────────────

function AvatarBadge({ name, size = 40 }: { name: string; size?: number }) {
  const color = avatarColor(name);
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </div>
  );
}

// ──────────────────── THEME PICKER ───────────────────────────────

function ThemePicker({
  currentThemeId,
  onSelect,
  onClose,
}: {
  currentThemeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      data-ocid="messenger.themes.dialog"
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="w-full max-w-md mx-2 mb-4 rounded-2xl p-5"
        style={{ background: "#1a1a30", border: "1px solid #2a2a4a" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white text-lg">Chat Themes</h2>
          <button
            type="button"
            onClick={onClose}
            style={{ color: "#8888aa" }}
            data-ocid="messenger.themes.close_button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => {
                onSelect(theme.id);
                onClose();
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all active:scale-95"
              style={{
                background:
                  currentThemeId === theme.id
                    ? "rgba(99,102,241,0.2)"
                    : "#111128",
                border:
                  currentThemeId === theme.id
                    ? "2px solid #6366f1"
                    : "2px solid transparent",
              }}
              data-ocid="messenger.theme.button"
            >
              <span className="text-2xl">{theme.label}</span>
              <span className="text-xs text-white text-center leading-tight">
                {theme.name}
              </span>
              <div className="flex gap-1">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ background: theme.accent }}
                />
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    background: theme.receivedBubble,
                    border: "1px solid #333",
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────── MAIN MESSENGER PAGE ───────────────────────

export default function MessengerPage() {
  const { currentUser, isInitializing, logout } = useUser();

  // ── Theme ──
  const [themeId, setThemeId] = useState<string>(() => {
    try {
      return localStorage.getItem(THEME_KEY) ?? "spiderman";
    } catch {
      return "dark";
    }
  });
  const theme = useMemo(() => getTheme(themeId), [themeId]);
  const [showThemes, setShowThemes] = useState(false);

  const selectTheme = useCallback((id: string) => {
    setThemeId(id);
    try {
      localStorage.setItem(THEME_KEY, id);
    } catch {
      /**/
    }
  }, []);

  // ── UI state ──
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newChatId, setNewChatId] = useState("");
  const [newChatError, setNewChatError] = useState("");

  // ── Call state ──

  // ── Refs ──
  const peerRef = useRef<any>(null);
  const dataConnsRef = useRef<Record<string, any>>({});
  const sharedKeysRef = useRef<Record<string, CryptoKey>>({});
  const myKeyPairRef = useRef<CryptoKeyPair | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const user = currentUser;

  // ── Lock body scroll when in chat on mobile ──
  useEffect(() => {
    if (mobileView === "chat") {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [mobileView]);

  // ── Load/save conversations ──
  useEffect(() => {
    if (!user) return;
    setConversations(loadConversations(user.username));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    saveConversations(user.username, conversations);
  }, [conversations, user]);

  // ── Scroll to bottom ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeConvId]);

  // ── Initialize PeerJS ──
  useEffect(() => {
    if (!user) return;
    let mounted = true;

    (async () => {
      if (!mounted) return;
      // Load PeerJS
      if (!window.Peer) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      myKeyPairRef.current = await generateECDHKeyPair();
      const peer = new window.Peer(`bytechat_${user.uniqueId}`, {
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        },
      });
      peerRef.current = peer;

      peer.on("error", () => {
        /* ignore */
      });

      peer.on("connection", (conn: any) => {
        if (!mounted) return;
        setupDataConn(conn);
      });
    })();

    return () => {
      mounted = false;
      peerRef.current?.destroy();
      peerRef.current = null;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Setup data connection ──
  const setupDataConn = useCallback(
    (conn: any) => {
      const peerId = conn.peer.replace("bytechat_", "");

      conn.on("open", async () => {
        dataConnsRef.current[peerId] = conn;
        if (myKeyPairRef.current) {
          const pubKey = await exportPublicKey(myKeyPairRef.current.publicKey);
          conn.send({
            type: "key-exchange",
            publicKey: pubKey,
            username: user?.username,
          });
        }
        setConversations((prev) => {
          if (prev.find((c) => c.peerId === peerId)) return prev;
          return [
            ...prev,
            {
              peerId,
              peerName: peerId,
              messages: [],
              isOnline: true,
              isTyping: false,
            },
          ];
        });
      });

      conn.on("data", async (data: any) => {
        if (data.type === "key-exchange") {
          try {
            const peerPub = await importPublicKey(data.publicKey);
            if (myKeyPairRef.current) {
              sharedKeysRef.current[peerId] = await deriveSharedKey(
                myKeyPairRef.current.privateKey,
                peerPub,
              );
            }
            if (data.username) {
              setConversations((prev) =>
                prev.map((c) =>
                  c.peerId === peerId
                    ? { ...c, peerName: data.username, isOnline: true }
                    : c,
                ),
              );
            }
          } catch {
            /**/
          }
        } else if (data.type === "message") {
          try {
            let text = data.text ?? "";
            const sharedKey = sharedKeysRef.current[peerId];
            if (sharedKey && data.iv && data.data) {
              text = await decryptMessage(sharedKey, data.iv, data.data);
            }
            const msg: Message = {
              id: crypto.randomUUID(),
              text,
              from: "them",
              time: getTime(),
              seen: false,
            };
            setConversations((prev) =>
              prev.map((c) =>
                c.peerId === peerId
                  ? {
                      ...c,
                      messages: [...c.messages, msg],
                      isTyping: false,
                      unreadCount: (c.unreadCount ?? 0) + 1,
                    }
                  : c,
              ),
            );
            conn.send({ type: "seen", messageId: msg.id });
          } catch {
            /**/
          }
        } else if (data.type === "typing") {
          setConversations((prev) =>
            prev.map((c) =>
              c.peerId === peerId ? { ...c, isTyping: data.isTyping } : c,
            ),
          );
        } else if (data.type === "seen") {
          setConversations((prev) =>
            prev.map((c) =>
              c.peerId === peerId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.from === "me" ? { ...m, seen: true } : m,
                    ),
                  }
                : c,
            ),
          );
        }
      });

      conn.on("close", () => {
        delete dataConnsRef.current[peerId];
        setConversations((prev) =>
          prev.map((c) =>
            c.peerId === peerId ? { ...c, isOnline: false } : c,
          ),
        );
      });
    },
    [user],
  );

  // ── Connect to peer ──
  const connectToPeer = useCallback(
    async (targetId: string, targetName?: string) => {
      const conn = peerRef.current.connect(`bytechat_${targetId}`);
      dataConnsRef.current[targetId] = conn;

      setConversations((prev) => {
        if (prev.find((c) => c.peerId === targetId)) return prev;
        return [
          ...prev,
          {
            peerId: targetId,
            peerName: targetName ?? targetId,
            messages: [],
            isOnline: false,
            isTyping: false,
          },
        ];
      });

      conn.on("open", async () => {
        setConversations((prev) =>
          prev.map((c) =>
            c.peerId === targetId ? { ...c, isOnline: true } : c,
          ),
        );
        if (myKeyPairRef.current) {
          const pubKey = await exportPublicKey(myKeyPairRef.current.publicKey);
          conn.send({
            type: "key-exchange",
            publicKey: pubKey,
            username: user?.username,
          });
        }
      });

      conn.on("data", async (data: any) => {
        if (data.type === "key-exchange") {
          try {
            const peerPub = await importPublicKey(data.publicKey);
            if (myKeyPairRef.current) {
              sharedKeysRef.current[targetId] = await deriveSharedKey(
                myKeyPairRef.current.privateKey,
                peerPub,
              );
            }
            if (data.username) {
              setConversations((prev) =>
                prev.map((c) =>
                  c.peerId === targetId
                    ? { ...c, peerName: data.username, isOnline: true }
                    : c,
                ),
              );
            }
          } catch {
            /**/
          }
        } else if (data.type === "message") {
          try {
            let text = data.text ?? "";
            const sharedKey = sharedKeysRef.current[targetId];
            if (sharedKey && data.iv && data.data) {
              text = await decryptMessage(sharedKey, data.iv, data.data);
            }
            const msg: Message = {
              id: crypto.randomUUID(),
              text,
              from: "them",
              time: getTime(),
              seen: false,
            };
            setConversations((prev) =>
              prev.map((c) =>
                c.peerId === targetId
                  ? {
                      ...c,
                      messages: [...c.messages, msg],
                      isTyping: false,
                      unreadCount: (c.unreadCount ?? 0) + 1,
                    }
                  : c,
              ),
            );
            conn.send({ type: "seen", messageId: msg.id });
          } catch {
            /**/
          }
        } else if (data.type === "typing") {
          setConversations((prev) =>
            prev.map((c) =>
              c.peerId === targetId ? { ...c, isTyping: data.isTyping } : c,
            ),
          );
        } else if (data.type === "seen") {
          setConversations((prev) =>
            prev.map((c) =>
              c.peerId === targetId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.from === "me" ? { ...m, seen: true } : m,
                    ),
                  }
                : c,
            ),
          );
        }
      });

      conn.on("close", () => {
        delete dataConnsRef.current[targetId];
        setConversations((prev) =>
          prev.map((c) =>
            c.peerId === targetId ? { ...c, isOnline: false } : c,
          ),
        );
      });
    },
    [user],
  );

  // ── Send message ──
  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !activeConvId || !user) return;
    const text = messageInput.trim();
    setMessageInput("");
    const msg: Message = {
      id: crypto.randomUUID(),
      text,
      from: "me",
      time: getTime(),
      seen: false,
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.peerId === activeConvId
          ? { ...c, messages: [...c.messages, msg] }
          : c,
      ),
    );
    const conn = dataConnsRef.current[activeConvId];
    if (conn?.open) {
      const sharedKey = sharedKeysRef.current[activeConvId];
      if (sharedKey) {
        try {
          const encrypted = await encryptMessage(sharedKey, text);
          conn.send({ type: "message", ...encrypted });
        } catch {
          conn.send({ type: "message", text });
        }
      } else {
        conn.send({ type: "message", text });
      }
      conn.send({ type: "typing", isTyping: false });
    }
  }, [messageInput, activeConvId, user]);

  // ── Handle typing (debounced) ──
  const handleTyping = useCallback(
    (value: string) => {
      setMessageInput(value);
      if (!activeConvId) return;
      const conn = dataConnsRef.current[activeConvId];
      if (!conn?.open) return;
      conn.send({ type: "typing", isTyping: true });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        conn.send({ type: "typing", isTyping: false });
      }, 500);
    },
    [activeConvId],
  );

  // ── Handle logout ──
  const handleLogout = useCallback(() => {
    if (user) clearSessionData(user.username);
    peerRef.current?.destroy();
    logout();
  }, [user, logout]);

  // ── Open conversation ──
  const openConversation = useCallback((peerId: string) => {
    setActiveConvId(peerId);
    setMobileView("chat");
    setConversations((prev) =>
      prev.map((c) => (c.peerId === peerId ? { ...c, unreadCount: 0 } : c)),
    );
  }, []);

  // ── Derived ──
  const activeConv = useMemo(
    () => conversations.find((c) => c.peerId === activeConvId) ?? null,
    [conversations, activeConvId],
  );

  const filteredConvs = useMemo(
    () =>
      searchQuery
        ? conversations.filter(
            (c) =>
              c.peerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.peerId.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : conversations,
    [conversations, searchQuery],
  );

  // ─────────────── LOADING ────────────────────────────────────────
  if (isInitializing) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ background: "#0a0a1a", height: "100dvh" }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ─────────────── AUTH GATE ───────────────────────────────────────
  if (!user) {
    return (
      <div
        style={{ background: "#0a0a1a", height: "100dvh", overflowY: "auto" }}
      >
        <AuthScreen />
      </div>
    );
  }

  // ─────────────── INLINE STYLES ──────────────────────────────────
  const CSS = `
    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
      30% { transform: translateY(-6px); opacity: 1; }
    }
    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    @keyframes msgSlideInLeft {
      from { opacity: 0; transform: translateX(-18px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes msgSlideInRight {
      from { opacity: 0; transform: translateX(18px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes audioWave {
      0%, 100% { transform: scaleY(0.4); }
      50% { transform: scaleY(1); }
    }
    @keyframes audioRing {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(2); opacity: 0; }
    }
    .msg-in-left { animation: msgSlideInLeft 0.2s ease-out; }
    .msg-in-right { animation: msgSlideInRight 0.2s ease-out; }
    .bc-scrollbar::-webkit-scrollbar { width: 3px; }
    .bc-scrollbar::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 99px; }
    .bc-scrollbar::-webkit-scrollbar-track { background: transparent; }
    @keyframes webPulse {
      0%, 100% { opacity: 0.04; transform: scale(1) rotate(0deg); }
      50% { opacity: 0.09; transform: scale(1.04) rotate(3deg); }
    }
    @keyframes webCornerDraw {
      from { opacity: 0; transform: scale(0.7); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes spideyBubbleIn {
      from { opacity: 0; transform: scale(0.85) translateY(6px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .spidey-bubble { animation: spideyBubbleIn 0.22s cubic-bezier(0.34,1.4,0.64,1); }
    .web-bg-pulse { animation: webPulse 6s ease-in-out infinite; }
    .chat-panel-mobile { animation: slideInRight 0.25s cubic-bezier(0.25,0.46,0.45,0.94); }
    .audio-ring {
      position: absolute;
      inset: -8px;
      border-radius: 50%;
      border: 2px solid currentColor;
      animation: audioRing 1.8s ease-out infinite;
    }
  `;

  // ─────────────── CONVERSATIONS SIDEBAR ──────────────────────────
  const SidebarPanel = (
    <div
      className="flex flex-col h-full"
      style={{ background: theme.sidebarBg }}
      data-ocid="messenger.panel"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: `1px solid ${theme.borderColor}` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">ByteChat</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowThemes(true)}
            className="p-2 rounded-xl transition-colors hover:bg-white/5 active:bg-white/10"
            style={{ color: theme.accent }}
            title="Chat Themes"
            data-ocid="messenger.themes.open_modal_button"
          >
            <Palette className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl transition-colors hover:bg-white/5 active:bg-white/10"
            style={{ color: "#8888aa" }}
            data-ocid="messenger.settings.open_modal_button"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowNewChat(true)}
            className="p-2 rounded-xl transition-colors hover:bg-white/5 active:bg-white/10"
            style={{ color: "#8888aa" }}
            data-ocid="messenger.new_chat.open_modal_button"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 flex-shrink-0">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "#555570" }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
            style={{ background: theme.inputBg, fontSize: "16px" }}
            data-ocid="messenger.search_input"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto bc-scrollbar">
        {filteredConvs.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full px-6 text-center"
            data-ocid="messenger.empty_state"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: theme.inputBg }}
            >
              <MessageCircle className="w-8 h-8" style={{ color: "#555570" }} />
            </div>
            <p className="font-semibold text-white mb-1">
              No conversations yet
            </p>
            <p className="text-sm" style={{ color: "#555570" }}>
              Tap + to start a new chat
            </p>
          </div>
        ) : (
          <div>
            {filteredConvs.map((conv, idx) => {
              const lastMsg = conv.messages[conv.messages.length - 1];
              const isActive = conv.peerId === activeConvId;
              return (
                <button
                  type="button"
                  key={conv.peerId}
                  onClick={() => openConversation(conv.peerId)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 active:bg-white/10 text-left"
                  style={{
                    background: isActive ? `${theme.accent}22` : "transparent",
                  }}
                  data-ocid={`messenger.conversation.item.${idx + 1}`}
                >
                  <div className="relative flex-shrink-0">
                    <AvatarBadge name={conv.peerName} size={48} />
                    {conv.isOnline && (
                      <span
                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                        style={{
                          background: "#22c55e",
                          borderColor: theme.sidebarBg,
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white truncate">
                        {conv.peerName}
                      </span>
                      {lastMsg && (
                        <span
                          className="text-xs flex-shrink-0 ml-2"
                          style={{ color: "#555570" }}
                        >
                          {lastMsg.time}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span
                        className="text-sm truncate"
                        style={{
                          color: conv.isTyping ? theme.accent : "#555570",
                        }}
                      >
                        {conv.isTyping
                          ? "typing..."
                          : lastMsg
                            ? `${lastMsg.from === "me" ? "You: " : ""}${lastMsg.text}`
                            : "No messages yet"}
                      </span>
                      {(conv.unreadCount ?? 0) > 0 && (
                        <span
                          className="flex-shrink-0 ml-2 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: "#ef4444" }}
                          data-ocid={`messenger.unread_badge.${idx + 1}`}
                        >
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* My ID bar */}
      <div
        className="px-4 py-3 flex-shrink-0 flex items-center gap-3"
        style={{
          borderTop: `1px solid ${theme.borderColor}`,
          background: theme.bg,
        }}
      >
        <AvatarBadge name={user.username} size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {user.username}
          </p>
          <p className="text-xs truncate" style={{ color: "#555570" }}>
            ID: {user.uniqueId}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(user.uniqueId);
            toast.success("ID copied!");
          }}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: "#555570" }}
          title="Copy your ID"
          data-ocid="messenger.copy_id.button"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
          style={{ color: "#ef4444" }}
          title="Logout"
          data-ocid="messenger.logout.button"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ─────────────── CHAT PANEL ──────────────────────────────────────
  const ChatPanel = (
    <div className="flex flex-col h-full" style={{ background: theme.bg }}>
      {activeConv ? (
        <>
          {/* Chat header */}
          <div
            className="flex items-center gap-3 px-3 py-3 flex-shrink-0"
            style={{
              background: theme.headerBg,
              borderBottom: `1px solid ${theme.borderColor}`,
            }}
          >
            {/* Back (mobile) */}
            <button
              type="button"
              onClick={() => setMobileView("list")}
              className="md:hidden p-2 rounded-xl hover:bg-white/5 flex-shrink-0"
              style={{ color: "#8888aa" }}
              data-ocid="messenger.back.button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <AvatarBadge name={activeConv.peerName} size={40} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">
                {activeConv.peerName}
              </p>
              <p
                className="text-xs"
                style={{ color: activeConv.isOnline ? "#22c55e" : "#555570" }}
              >
                {activeConv.isOnline ? "Online" : "Offline"}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowThemes(true)}
                className="p-2.5 rounded-xl transition-all hover:bg-white/5 active:scale-95"
                style={{ color: "#8888aa" }}
                title="Change Theme"
                data-ocid="messenger.theme.open_modal_button"
              >
                <Palette className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2.5 rounded-xl transition-colors hover:bg-white/5 active:bg-white/10"
                style={{ color: "#8888aa" }}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* E2E label */}
          <div className="flex items-center justify-center gap-1.5 py-2 flex-shrink-0">
            <Lock className="w-3 h-3" style={{ color: "#555570" }} />
            <span className="text-xs" style={{ color: "#555570" }}>
              End-to-end encrypted
            </span>
          </div>
          <div
            className="flex-1 overflow-y-auto bc-scrollbar px-3 py-2 relative"
            style={{ minHeight: 0, overscrollBehavior: "contain" }}
          >
            {theme.id === "spiderman" && (
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden"
                style={{ zIndex: 0 }}
              >
                <svg
                  viewBox="0 0 400 400"
                  fill="none"
                  aria-hidden="true"
                  className="web-bg-pulse absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80"
                  style={{ color: "#cc0000" }}
                >
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
                    const r = (a * Math.PI) / 180;
                    return (
                      <line
                        key={a}
                        x1="200"
                        y1="200"
                        x2={200 + 200 * Math.cos(r)}
                        y2={200 + 200 * Math.sin(r)}
                        stroke="currentColor"
                        strokeWidth="0.8"
                        strokeOpacity="0.4"
                      />
                    );
                  })}
                  {[40, 80, 120, 160, 200].map((radius) => (
                    <polygon
                      key={radius}
                      points={[0, 45, 90, 135, 180, 225, 270, 315]
                        .map((a) => {
                          const r = (a * Math.PI) / 180;
                          return `${200 + radius * Math.cos(r)},${200 + radius * Math.sin(r)}`;
                        })
                        .join(" ")}
                      stroke="currentColor"
                      strokeWidth="0.5"
                      strokeOpacity="0.3"
                      fill="none"
                    />
                  ))}
                </svg>
              </div>
            )}
            {activeConv.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
                <AvatarBadge name={activeConv.peerName} size={64} />
                <p className="font-semibold text-white mt-3">
                  {activeConv.peerName}
                </p>
                <p className="text-sm mt-1" style={{ color: "#555570" }}>
                  ID: {activeConv.peerId}
                </p>
                <p className="text-sm mt-3" style={{ color: "#555570" }}>
                  Send a message to start the conversation
                </p>
              </div>
            ) : (
              <div className="relative z-10">
                {activeConv.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex mb-1.5 ${
                      msg.from === "me"
                        ? "justify-end msg-in-right"
                        : "justify-start msg-in-left"
                    }`}
                  >
                    {msg.from === "them" && (
                      <div className="mr-2 flex-shrink-0 self-end">
                        <AvatarBadge name={activeConv.peerName} size={28} />
                      </div>
                    )}
                    <div
                      className="max-w-[72%] px-3.5 py-2.5 rounded-2xl spidey-bubble relative overflow-hidden"
                      style={{
                        background:
                          msg.from === "me"
                            ? theme.sentBubble
                            : theme.receivedBubble,
                        borderBottomRightRadius:
                          msg.from === "me" ? 6 : undefined,
                        borderBottomLeftRadius:
                          msg.from === "them" ? 6 : undefined,
                        color:
                          msg.from === "me"
                            ? theme.sentText
                            : theme.receivedText,
                        ...(theme.id === "spiderman" && msg.from === "me"
                          ? {
                              boxShadow:
                                "0 2px 12px rgba(204,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
                              border: "1px solid rgba(204,0,0,0.3)",
                            }
                          : theme.id === "spiderman" && msg.from === "them"
                            ? {
                                boxShadow: "0 2px 8px rgba(204,0,0,0.15)",
                                border: "1px solid rgba(204,0,0,0.2)",
                              }
                            : {}),
                      }}
                    >
                      {theme.id === "spiderman" && (
                        <svg
                          viewBox="0 0 60 60"
                          fill="none"
                          aria-hidden="true"
                          className="absolute pointer-events-none"
                          style={{
                            width: 40,
                            height: 40,
                            right: msg.from === "me" ? -8 : undefined,
                            left: msg.from === "them" ? -8 : undefined,
                            bottom: -8,
                            opacity: 0.12,
                            color: msg.from === "me" ? "#ff6b6b" : "#fca5a5",
                          }}
                        >
                          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
                            const r = (a * Math.PI) / 180;
                            return (
                              <line
                                key={a}
                                x1="30"
                                y1="30"
                                x2={30 + 30 * Math.cos(r)}
                                y2={30 + 30 * Math.sin(r)}
                                stroke="currentColor"
                                strokeWidth="1"
                              />
                            );
                          })}
                          {[10, 20, 28].map((radius) => (
                            <polygon
                              key={radius}
                              points={[0, 45, 90, 135, 180, 225, 270, 315]
                                .map((a) => {
                                  const r = (a * Math.PI) / 180;
                                  return `${30 + radius * Math.cos(r)},${30 + radius * Math.sin(r)}`;
                                })
                                .join(" ")}
                              stroke="currentColor"
                              strokeWidth="0.6"
                              fill="none"
                            />
                          ))}
                        </svg>
                      )}
                      <p className="text-sm leading-relaxed break-words relative z-10">
                        {msg.text}
                      </p>
                      <div
                        className={`flex items-center gap-1 mt-1 ${
                          msg.from === "me" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span
                          className="text-xs"
                          style={{
                            color:
                              msg.from === "me"
                                ? "rgba(255,255,255,0.55)"
                                : "#555570",
                          }}
                        >
                          {msg.time}
                        </span>
                        {msg.from === "me" &&
                          (msg.seen ? (
                            <CheckCheck
                              className="w-3.5 h-3.5"
                              style={{ color: "#60a5fa" }}
                            />
                          ) : (
                            <Check
                              className="w-3.5 h-3.5"
                              style={{ color: "rgba(255,255,255,0.4)" }}
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
                {activeConv.isTyping && <TypingIndicator theme={theme} />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          <div
            className="flex-shrink-0 px-3 py-2 flex items-center gap-2"
            style={{
              background: theme.headerBg,
              borderTop: `1px solid ${theme.borderColor}`,
              paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={messageInput}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Message..."
              className="flex-1 px-4 py-2.5 rounded-2xl text-white placeholder-gray-600 outline-none"
              style={{
                background: theme.inputBg,
                fontSize: "16px",
                minHeight: "44px",
              }}
              data-ocid="messenger.message.input"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!messageInput.trim()}
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-40 active:scale-95"
              style={{
                background: messageInput.trim()
                  ? theme.sentBubble
                  : theme.inputBg,
              }}
              data-ocid="messenger.message.submit_button"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          >
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">ByteChat</h2>
          <p className="text-sm" style={{ color: "#555570" }}>
            Select a conversation or start a new one
          </p>
          <button
            type="button"
            onClick={() => setShowNewChat(true)}
            className="mt-6 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
            data-ocid="messenger.start_chat.button"
          >
            Start a chat
          </button>
        </div>
      )}
    </div>
  );

  // ─────────────────────────── RENDER ─────────────────────────────
  return (
    <div
      style={{
        height: "100dvh",
        background: theme.bg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        // Prevent browser viewport resize from shifting layout
        position: "fixed",
        inset: 0,
      }}
    >
      <style>{CSS}</style>

      {/* ── Theme picker ── */}
      <AnimatePresence>
        {showThemes && (
          <ThemePicker
            currentThemeId={themeId}
            onSelect={selectTheme}
            onClose={() => setShowThemes(false)}
          />
        )}
      </AnimatePresence>

      {/* ── New Chat dialog ── */}
      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-end md:items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowNewChat(false)}
            data-ocid="messenger.new_chat.dialog"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-sm mx-4 mb-4 md:mb-0 rounded-2xl p-5"
              style={{ background: "#1a1a30", border: "1px solid #2a2a4a" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-white text-lg">New Chat</h2>
                <button
                  type="button"
                  onClick={() => setShowNewChat(false)}
                  style={{ color: "#8888aa" }}
                  data-ocid="messenger.new_chat.close_button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <p
                  className="block text-xs font-medium mb-2"
                  style={{ color: "#8888aa" }}
                >
                  Enter their Unique ID
                </p>
                <input
                  type="text"
                  value={newChatId}
                  onChange={(e) => {
                    setNewChatId(e.target.value);
                    setNewChatError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newChatId.trim()) {
                      connectToPeer(newChatId.trim());
                      openConversation(newChatId.trim());
                      setNewChatId("");
                      setShowNewChat(false);
                    }
                  }}
                  placeholder="e.g. alok123"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none"
                  style={{
                    background: "#111128",
                    border: "1px solid #2a2a4a",
                    fontSize: "16px",
                  }}
                  data-ocid="messenger.new_chat.input"
                />
                {newChatError && (
                  <p
                    className="text-xs mt-2"
                    style={{ color: "#f87171" }}
                    data-ocid="messenger.new_chat.error_state"
                  >
                    {newChatError}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={!newChatId.trim()}
                onClick={() => {
                  if (!newChatId.trim()) {
                    setNewChatError("Enter a valid Unique ID");
                    return;
                  }
                  connectToPeer(newChatId.trim());
                  openConversation(newChatId.trim());
                  setNewChatId("");
                  setShowNewChat(false);
                }}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40 active:scale-95"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                }}
                data-ocid="messenger.new_chat.submit_button"
              >
                Start Chat
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Settings panel ── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-end md:items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowSettings(false)}
            data-ocid="messenger.settings.dialog"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-sm mx-4 mb-4 md:mb-0 rounded-2xl p-5"
              style={{ background: "#1a1a30", border: "1px solid #2a2a4a" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-white text-lg">Settings</h2>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  style={{ color: "#8888aa" }}
                  data-ocid="messenger.settings.close_button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div
                  className="p-4 rounded-xl flex items-center gap-3"
                  style={{ background: "#111128", border: "1px solid #1e1e3a" }}
                >
                  <AvatarBadge name={user.username} size={44} />
                  <div>
                    <p className="font-semibold text-white">{user.username}</p>
                    <p className="text-xs" style={{ color: "#8888aa" }}>
                      Unique ID: {user.uniqueId}
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setShowSettings(false);
                    handleLogout();
                  }}
                  data-ocid="messenger.settings.logout.button"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (always on desktop, conditional on mobile) */}
        <div
          className={`${
            mobileView === "list" ? "flex" : "hidden"
          } md:flex flex-col w-full md:w-80 lg:w-96 flex-shrink-0`}
          style={{ borderRight: `1px solid ${theme.borderColor}` }}
        >
          {SidebarPanel}
        </div>

        {/* Chat area */}
        <div
          className={`${
            mobileView === "chat" ? "flex chat-panel-mobile" : "hidden"
          } md:flex flex-1 flex-col overflow-hidden`}
        >
          {ChatPanel}
        </div>
      </div>
    </div>
  );
}
