import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Inbox, Calendar, BarChart3, Settings, Bell, Plus, LogOut, Menu, X, Sun, Moon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { NewPostPanel } from "@/components/shared/NewPostPanel";
import { Footer } from "@/components/shared/Footer";


const nav = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/review", label: "Review Queue", Icon: Inbox },
  { to: "/calendar", label: "Calendar", Icon: Calendar },
  { to: "/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/settings", label: "Settings", Icon: Settings },
];

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const { signOut, user } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();


  useEffect(() => {
    const lastSeen = Number(localStorage.getItem("lastPendingSeen") || 0);
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review")
      .gt("created_at", new Date(lastSeen).toISOString())
      .then(({ count }) => setUnread(count ?? 0));
    const ch = supabase
      .channel("pending-notif")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts", filter: "status=eq.pending_review" },
        () => setUnread((u) => u + 1),
      )
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, []);

  const clearUnread = () => {
    localStorage.setItem("lastPendingSeen", String(Date.now()));
    setUnread(0);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
      {/* Sidebar */}
      <aside
        className={mobileOpen ? "sidebar-open" : ""}
        style={{
          width: 240,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          padding: "22px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 22px" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "var(--brand)",
              display: "grid",
              placeItems: "center",
              color: "var(--brand-foreground)",
              fontWeight: 800,
            }}
          >
            L
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--foreground)" }}>LinkOps</div>
          <button
            onClick={() => setMobileOpen(false)}
            className="mobile-close"
            style={{ marginLeft: "auto", background: "transparent", border: 0, color: "var(--text-secondary)" }}
          >
            <X size={18} />
          </button>
        </div>
        {nav.map(({ to, label, Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                color: active ? "var(--foreground)" : "var(--text-secondary)",
                background: active ? "var(--surface-2)" : "transparent",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                transition: "background 120ms",
              }}
            >
              <Icon size={16} /> {label}
            </Link>
          );
        })}
        <div style={{ marginTop: "auto", padding: "10px 8px" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
            {user?.email}
          </div>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/auth" });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 10px",
              borderRadius: 10,
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "18px 32px",
            borderBottom: "1px solid var(--border)",
            background: "var(--background)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="mobile-open-btn"
            style={{ background: "transparent", border: 0, color: "var(--foreground)" }}
          >
            <Menu size={20} />
          </button>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>{title}</h1>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{
                position: "relative",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                width: 38,
                height: 38,
                borderRadius: 10,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
              }}
            >
              <Sun size={16} style={{ position: "absolute", transition: "transform 300ms ease, opacity 300ms ease", transform: theme === "light" ? "rotate(0) scale(1)" : "rotate(-90deg) scale(0.4)", opacity: theme === "light" ? 1 : 0 }} />
              <Moon size={16} style={{ position: "absolute", transition: "transform 300ms ease, opacity 300ms ease", transform: theme === "dark" ? "rotate(0) scale(1)" : "rotate(90deg) scale(0.4)", opacity: theme === "dark" ? 1 : 0 }} />
            </button>

            <button
              onClick={clearUnread}
              style={{
                position: "relative",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                width: 38,
                height: 38,
                borderRadius: 10,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Bell size={16} />
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "var(--brand)",
                    color: "var(--brand-foreground)",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 999,
                  }}
                >
                  {unread}
                </span>
              )}
            </button>
            <button
              onClick={() => setNewPostOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "var(--brand)",
                color: "var(--brand-foreground)",
                padding: "9px 14px",
                borderRadius: 10,
                border: 0,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Plus size={15} /> New Post
            </button>
          </div>
        </header>
        <main key={title} className="page-in" style={{ padding: "24px 32px", flex: 1 }}>{children}</main>
        <Footer />
      </div>

      <NewPostPanel open={newPostOpen} onClose={() => setNewPostOpen(false)} />

      <style>{`
        .mobile-open-btn { display: none; }
        .mobile-close { display: none; }
        @media (max-width: 768px) {
          aside {
            position: fixed !important;
            left: 0; top: 0;
            transform: translateX(-100%);
            transition: transform 200ms ease;
            z-index: 50;
          }
          aside.sidebar-open { transform: translateX(0); }
          .mobile-open-btn { display: inline-flex !important; }
          .mobile-close { display: inline-flex !important; }
          main { padding: 16px !important; }
          header { padding: 14px 16px !important; }
        }
      `}</style>
    </div>
  );
}
