import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Footer } from "@/components/shared/Footer";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const fn = mode === "signin" ? signIn : signUp;
    const { error } = await fn(email, password);
    setBusy(false);
    if (error) toast.error(error);
    else if (mode === "signup") toast.success("Check your email to confirm your account");
    else toast.success("Signed in");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--background)" }}>
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 20 }}>
        <div className="card-shell" style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
            <img src="/linkops-logo.png" alt="LinkOps" style={{ height: 36, width: "auto", objectFit: "contain" }} />
          </div>
          <div className="section-label" style={{ marginBottom: 6 }}>
            {mode === "signin" ? "Welcome back" : "Create account"}
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
            {mode === "signin" ? "Sign in to your dashboard" : "Get started"}
          </h1>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="you@example.com"
            />
            <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="••••••••"
            />
            <button
              type="submit"
              disabled={busy}
              style={{
                marginTop: 6,
                background: "var(--brand)",
                color: "var(--brand-foreground)",
                border: 0,
                padding: "11px 14px",
                borderRadius: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 14,
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            style={{ marginTop: 14, background: "transparent", border: 0, color: "var(--text-secondary)", fontSize: 12.5, cursor: "pointer" }}
          >
            {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 12px",
  color: "var(--foreground)",
  fontSize: 14,
};
