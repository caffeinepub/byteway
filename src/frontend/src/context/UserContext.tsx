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

interface StoredUser {
  hash: string;
  uniqueId: string;
}

function getStoredUsers(): Record<string, StoredUser> {
  try {
    const raw = JSON.parse(localStorage.getItem(USERS_KEY) ?? "{}");
    // Migrate old format (plain string hash) to new format
    const migrated: Record<string, StoredUser> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string") {
        migrated[k] = { hash: v, uniqueId: k };
      } else {
        migrated[k] = v as StoredUser;
      }
    }
    return migrated;
  } catch {
    return {};
  }
}

function saveStoredUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export interface User {
  username: string;
  uniqueId: string;
}

interface UserContextType {
  currentUser: User | null;
  isInitializing: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    uniqueId: string,
  ) => Promise<void>;
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
        const users = getStoredUsers();
        const stored = users[session.username];
        const uniqueId =
          stored?.uniqueId ?? session.uniqueId ?? session.username;
        setCurrentUser({ username: session.username, uniqueId });
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
    if (users[trimmed].hash !== hashed) throw new Error("Incorrect password");
    const uniqueId = users[trimmed].uniqueId;
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ username: trimmed, uniqueId }),
    );
    setCurrentUser({ username: trimmed, uniqueId });
  }, []);

  const register = useCallback(
    async (username: string, password: string, uniqueId: string) => {
      const users = getStoredUsers();
      const trimmed = username.trim();
      const uid = uniqueId.trim();

      if (!trimmed) throw new Error("Username cannot be empty");
      if (password.length < 3)
        throw new Error("Password must be at least 3 characters");
      if (users[trimmed]) throw new Error("Username already taken");

      if (!uid) throw new Error("Unique ID cannot be empty");
      if (uid.length < 3 || uid.length > 20)
        throw new Error("Unique ID must be 3-20 characters");
      if (!/^[a-zA-Z0-9_]+$/.test(uid))
        throw new Error(
          "Unique ID can only contain letters, numbers, and underscores",
        );

      // Check uniqueId uniqueness
      for (const stored of Object.values(users)) {
        if (stored.uniqueId.toLowerCase() === uid.toLowerCase()) {
          throw new Error("Unique ID already taken. Choose another.");
        }
      }

      const hashed = await sha256(password);
      users[trimmed] = { hash: hashed, uniqueId: uid };
      saveStoredUsers(users);
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ username: trimmed, uniqueId: uid }),
      );
      setCurrentUser({ username: trimmed, uniqueId: uid });
    },
    [],
  );

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
