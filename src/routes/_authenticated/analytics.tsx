import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { formatDistanceToNow, subDays, format } from "date-fns";

export const Route = createFileRoute("/_authenticated/analytics")({ component: Analytics });

const CHART_COLOR = "#F5A623";
const CHART_COLOR_2 = "#4ADE80";
const GRID = "#2A3247";
const TEXT = "#9098AB";

function Analytics() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [range, setRange] = useState<"weekly" | "monthly">("weekly");

  useEffect(() => {
    const from = subDays(new Date(), range === "weekly" ? 7 : 30).toISOString();
    supabase
      .from("posts")
      .select("*")
      .gte("created_at", from)
      .limit(1000)
      .then(({ data }) => setPosts((data ?? []) as Post[]));
  }, [range]);

  const topPerforming = useMemo(() => {
    return [...posts]
      .filter((p) => p.status === "posted" || p.status === "auto_posted")
      .map((p) => ({
        p,
        eng: (p.live_likes ?? 0) + (p.live_comments ?? 0) + (p.live_shares ?? 0) || (p.score ?? 0),
      }))
      .sort((a, b) => b.eng - a.eng)
      .slice(0, 10);
  }, [posts]);

  const scoreDist = useMemo(() => {
    const buckets = [
      { name: "0-20", count: 0 },
      { name: "20-50", count: 0 },
      { name: "50-75", count: 0 },
      { name: "75-100", count: 0 },
    ];
    posts.forEach((p) => {
      const s = p.score ?? 0;
      if (s < 20) buckets[0].count++;
      else if (s < 50) buckets[1].count++;
      else if (s < 75) buckets[2].count++;
      else buckets[3].count++;
    });
    return buckets;
  }, [posts]);

  const brandTone = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    posts.forEach((p) => {
      const t = p.brand_tone ?? "unknown";
      const cur = map.get(t) ?? { total: 0, count: 0 };
      if (p.score != null) {
        cur.total += p.score;
        cur.count += 1;
      }
      map.set(t, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, avg: v.count ? Math.round(v.total / v.count) : 0 }))
      .filter((r) => r.avg > 0)
      .slice(0, 6);
  }, [posts]);

  const overTime = useMemo(() => {
    const map = new Map<string, { day: string; scraped: number; published: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d");
      map.set(d, { day: d, scraped: 0, published: 0 });
    }
    posts.forEach((p) => {
      const d = format(new Date(p.created_at), "MMM d");
      if (!map.has(d)) return;
      const row = map.get(d)!;
      row.scraped += 1;
      if (p.status === "posted" || p.status === "auto_posted") row.published += 1;
    });
    return Array.from(map.values());
  }, [posts]);

  const filteredBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    posts.filter((p) => p.status === "filtered").forEach((p) => {
      const key = p.score_reason ?? "Uncategorized";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  return (
    <AppShell title="Analytics">
      <div style={{ marginBottom: 16, display: "flex", gap: 10 }}>
        <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 3, borderRadius: 10 }}>
          {(["weekly", "monthly"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: "6px 14px", borderRadius: 8, border: 0,
                background: range === r ? "var(--brand)" : "transparent",
                color: range === r ? "var(--brand-foreground)" : "var(--text-secondary)",
                fontWeight: 600, fontSize: 12.5, cursor: "pointer", textTransform: "capitalize",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="card-shell" style={{ marginBottom: 16 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>Top Performing Posts</div>
        {topPerforming.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No published posts yet.</div>
        ) : (
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
            {topPerforming.map(({ p, eng }) => (
              <div key={p.id} style={{ minWidth: 260, background: "var(--surface-2)", padding: 12, borderRadius: 10, flexShrink: 0 }}>
                <ScoreBadge score={p.score} size="sm" />
                <div style={{ fontSize: 13, marginTop: 8, marginBottom: 8, maxHeight: 60, overflow: "hidden" }}>
                  {(p.repurposed_content ?? "").slice(0, 120)}…
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {eng} engagements · {p.analytics_updated_at ? `Updated ${formatDistanceToNow(new Date(p.analytics_updated_at), { addSuffix: true })}` : "Analytics pending"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16, marginBottom: 16 }}>
        <div className="card-shell">
          <div className="section-label" style={{ marginBottom: 12 }}>Score Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreDist}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke={TEXT} fontSize={11} />
              <YAxis stroke={TEXT} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill={CHART_COLOR} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-shell">
          <div className="section-label" style={{ marginBottom: 12 }}>Brand Tone Performance (avg score)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={brandTone}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke={TEXT} fontSize={11} />
              <YAxis stroke={TEXT} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="avg" fill={CHART_COLOR_2} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-shell" style={{ marginBottom: 16 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>Posts Over Time (last 30 days)</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={overTime}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke={TEXT} fontSize={10} />
            <YAxis stroke={TEXT} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: TEXT }} />
            <Line type="monotone" dataKey="scraped" stroke={CHART_COLOR} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="published" stroke={CHART_COLOR_2} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card-shell">
        <div className="section-label" style={{ marginBottom: 12 }}>Filtered Posts Breakdown</div>
        {filteredBreakdown.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No filtered posts in this range.</div>
        ) : (
          <div>
            {filteredBreakdown.map(([reason, count]) => (
              <div
                key={reason}
                style={{
                  display: "flex", justifyContent: "space-between", padding: "10px 12px",
                  background: "var(--surface-2)", borderRadius: 10, marginBottom: 6, fontSize: 13,
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>{reason}</span>
                <span style={{ fontWeight: 700 }}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--foreground)",
  fontSize: 12,
};
