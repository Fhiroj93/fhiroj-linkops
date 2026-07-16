import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { supabase, SCRAPE_WEBHOOK_URL } from "@/lib/supabase";
import type { Post, WeeklySuggestion } from "@/lib/types";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { StatusPill } from "@/components/shared/StatusPill";
import { SourceBadge, ContentTypeIcon } from "@/components/shared/SourceBadge";
import { DetailDrawer } from "@/components/shared/DetailDrawer";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const [stats, setStats] = useState({ week: 0, avgScore: 0, pending: 0, auto: 0 });
  const [pendingPulse, setPendingPulse] = useState(false);
  const [suggestion, setSuggestion] = useState<WeeklySuggestion | null>(null);
  const [recent, setRecent] = useState<Post[]>([]);
  const [detail, setDetail] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const [profileUrl, setProfileUrl] = useState("");
  const [scrapeType, setScrapeType] = useState<"personal" | "company">("personal");
  const [scraping, setScraping] = useState(false);

  const loadAll = async () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const iso = weekStart.toISOString();

    const [{ data: weekPosts }, { data: pending }, { data: auto }, { data: sug }, { data: rec }] =
      await Promise.all([
        supabase.from("posts").select("id, score").gte("created_at", iso),
        supabase.from("posts").select("id", { count: "exact" }).eq("status", "pending_review"),
        supabase.from("posts").select("id", { count: "exact" }).eq("status", "auto_posted").gte("created_at", iso),
        supabase.from("weekly_suggestions").select("*").order("week_start", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(10),
      ]);

    const scores = (weekPosts ?? []).map((p) => p.score).filter((s): s is number => typeof s === "number");
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    setStats({
      week: weekPosts?.length ?? 0,
      avgScore: avg,
      pending: pending?.length ?? 0,
      auto: auto?.length ?? 0,
    });
    setSuggestion(sug ?? null);
    setRecent((rec ?? []) as Post[]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    const ch = supabase
      .channel("dash-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, (payload) => {
        loadAll();
        if (payload.eventType === "INSERT" && (payload.new as Post).status === "pending_review") {
          setPendingPulse(true);
          setTimeout(() => setPendingPulse(false), 3600 * 1000);
        }
      })
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, []);

  const submitScrape = async () => {
    if (!profileUrl.includes("linkedin.com")) {
      toast.error("URL must contain linkedin.com");
      return;
    }
    setScraping(true);
    try {
      const res = await fetch(SCRAPE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_url: profileUrl, source_type: scrapeType }),
      });
      if (!res.ok) throw new Error("Webhook returned " + res.status);
      toast.success("Scraping started — check Review Queue in a few minutes");
    } catch (e) {
      toast.error("Scrape failed: " + (e as Error).message);
    } finally {
      setScraping(false);
    }
  };

  return (
    <AppShell title="Dashboard">
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
        <StatCard label="Posts This Week" value={stats.week} />
        <StatCard label="Avg Score" value={stats.avgScore} />
        <StatCard label="Pending Review" value={stats.pending} accent pulse={pendingPulse} />
        <StatCard label="Auto-Posted This Week" value={stats.auto} />
      </div>

      {/* Instant scrape */}
      <div className="card-shell" style={{ marginBottom: 20 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>Scrape a Profile Right Now</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
            placeholder="Paste LinkedIn profile or company URL"
            style={{
              flex: 1,
              minWidth: 240,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "10px 12px",
              color: "var(--foreground)",
              fontSize: 14,
            }}
          />
          <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 3, borderRadius: 10 }}>
            {(["personal", "company"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setScrapeType(t)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: 0,
                  background: scrapeType === t ? "var(--brand)" : "transparent",
                  color: scrapeType === t ? "var(--brand-foreground)" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: 12.5,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={submitScrape}
            disabled={scraping || !profileUrl.includes("linkedin.com")}
            style={{
              background: "var(--brand)",
              color: "var(--brand-foreground)",
              border: 0,
              padding: "10px 18px",
              borderRadius: 10,
              fontWeight: 700,
              cursor: scraping ? "wait" : "pointer",
              opacity: !profileUrl.includes("linkedin.com") ? 0.5 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13.5,
            }}
          >
            {scraping && <Loader2 size={14} className="animate-spin" />}
            {scraping ? "Scraping…" : "Scrape Now"}
          </button>
        </div>
      </div>

      {/* Weekly suggestion */}
      <div className="card-shell" style={{ marginBottom: 20 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>Weekly Suggestion</div>
        {suggestion ? (
          <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.55 }}>{suggestion.suggestion}</div>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Your first weekly recommendation will appear after 7 days of data.
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div className="card-shell">
        <div className="section-label" style={{ marginBottom: 12 }}>Recent Activity</div>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 48, background: "var(--surface-2)", borderRadius: 10, opacity: 0.6 }} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
            No posts yet — next scheduled scrape is at 9:00 AM or 8:00 PM IST.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recent.map((p) => (
              <button
                key={p.id}
                onClick={() => setDetail(p)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "transparent",
                  border: "1px solid transparent",
                  borderRadius: 10,
                  cursor: "pointer",
                  textAlign: "left",
                  color: "inherit",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <ContentTypeIcon type={p.content_type} />
                <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.repurposed_content ?? p.original_content ?? "(no content)"}
                </span>
                <SourceBadge source={p.source_type} />
                <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 60, textAlign: "right" }}>
                  {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                </span>
                <ScoreBadge score={p.score} size="sm" />
                <StatusPill status={p.status} />
              </button>
            ))}
          </div>
        )}
      </div>

      <DetailDrawer post={detail} onClose={() => setDetail(null)} />
    </AppShell>
  );
}

function StatCard({ label, value, accent, pulse }: { label: string; value: number; accent?: boolean; pulse?: boolean }) {
  return (
    <div
      className={pulse ? "card-shell pulse-amber hover-lift" : "card-shell hover-lift"}
      style={{
        borderColor: accent && value > 0 ? "color-mix(in oklab, var(--brand) 40%, transparent)" : "var(--border)",
      }}
    >
      <div className="section-label" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>
      <div className="font-display tabular" style={{ fontSize: 32, fontWeight: 700, marginTop: 6, color: accent ? "var(--brand)" : "var(--foreground)", letterSpacing: "-0.02em" }}>
        {value}
      </div>
    </div>
  );
}

