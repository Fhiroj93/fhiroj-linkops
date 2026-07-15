import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/settings")({ component: Settings });

function Settings() {
  const { user } = useAuth();
  return (
    <AppShell title="Settings">
      <div className="card-shell">
        <div className="section-label" style={{ marginBottom: 10 }}>Account</div>
        <div style={{ fontSize: 14, marginBottom: 8 }}>
          Signed in as <strong>{user?.email}</strong>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
          Configure scraping cadence, brand tone, and notifications from your Supabase project.
        </div>
      </div>
    </AppShell>
  );
}
