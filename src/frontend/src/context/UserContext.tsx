import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const USERS_KEY = "byteway_users";
const SESSION_KEY = "byteway_session";
const CHATS_KEY = "byteway_chats";

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getStoredUsers(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveStoredUsers(users: Record<string, string>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

interface User {
  username: string;
}

interface UserContextType {
  currentUser: User | null;
  isInitializing: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
      if (session?.username) {
        setCurrentUser({ username: session.username });
      }
    } catch {
      // ignore
    }
    setIsInitializing(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const users = getStoredUsers();
    const trimmed = username.trim();
    if (!users[trimmed]) throw new Error("User not found");
    const hashed = await sha256(password);
    if (users[trimmed] !== hashed) throw new Error("Incorrect password");
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: trimmed }));
    setCurrentUser({ username: trimmed });
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const users = getStoredUsers();
    const trimmed = username.trim();
    if (!trimmed) throw new Error("Username cannot be empty");
    if (password.length < 3)
      throw new Error("Password must be at least 3 characters");
    if (users[trimmed]) throw new Error("Username already taken");
    const hashed = await sha256(password);
    users[trimmed] = hashed;
    saveStoredUsers(users);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: trimmed }));
    setCurrentUser({ username: trimmed });
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(CHATS_KEY);
    } catch {
      // ignore
    }
    setCurrentUser(null);
  }, []);

  return (
    <UserContext.Provider
      value={{ currentUser, isInitializing, login, register, logout }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
