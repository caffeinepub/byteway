import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useUser } from "../context/UserContext";

interface UserLoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UserLoginModal({ open, onClose }: UserLoginModalProps) {
  const { login, register } = useUser();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        data-ocid="user_login.modal"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-full max-w-sm mx-4 rounded-3xl p-8 relative"
          style={{
            background: "rgba(6,10,20,0.95)",
            border: "1px solid rgba(6,182,212,0.3)",
            boxShadow:
              "0 0 60px rgba(6,182,212,0.2), 0 0 120px rgba(99,102,241,0.1)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.3))",
                border: "1px solid rgba(6,182,212,0.4)",
                boxShadow: "0 0 25px rgba(6,182,212,0.3)",
              }}
            >
              <span className="text-2xl">💬</span>
            </div>
            <h2
              className="text-2xl font-bold"
              style={{
                background: "linear-gradient(90deg, #06b6d4, #6366f1)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ByteChat
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Sign in to start chatting
            </p>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as "login" | "register");
              setError("");
            }}
          >
            <TabsList
              className="w-full mb-6"
              style={{
                background: "rgba(6,182,212,0.08)",
                border: "1px solid rgba(6,182,212,0.2)",
              }}
            >
              <TabsTrigger
                value="login"
                className="flex-1 data-[state=active]:text-cyan-300"
                data-ocid="user_login.tab"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 data-[state=active]:text-indigo-300"
                data-ocid="user_login.tab"
              >
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">Username</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    required
                    className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    data-ocid="user_login.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    data-ocid="user_login.input"
                  />
                </div>
                {error && (
                  <p
                    className="text-red-400 text-sm text-center"
                    data-ocid="user_login.error_state"
                  >
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full font-semibold"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(6,182,212,0.4), rgba(99,102,241,0.4))",
                    border: "1px solid rgba(6,182,212,0.5)",
                    color: "#06b6d4",
                    boxShadow: "0 0 20px rgba(6,182,212,0.3)",
                  }}
                  data-ocid="user_login.submit_button"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">
                    Choose a Username
                  </Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Pick a unique username"
                    autoComplete="username"
                    required
                    className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                    data-ocid="user_login.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">
                    Create Password
                  </Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 3 characters"
                    autoComplete="new-password"
                    required
                    className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                    data-ocid="user_login.input"
                  />
                </div>
                {error && (
                  <p
                    className="text-red-400 text-sm text-center"
                    data-ocid="user_login.error_state"
                  >
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full font-semibold"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4))",
                    border: "1px solid rgba(99,102,241,0.5)",
                    color: "#a78bfa",
                    boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                  }}
                  data-ocid="user_login.submit_button"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-slate-600 text-center mt-4">
            Your chats are end-to-end encrypted and deleted when you log out.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
