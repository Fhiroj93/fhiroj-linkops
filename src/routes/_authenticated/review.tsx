import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/shared/PostCard";

export const Route = createFileRoute("/_authenticated/review")({ component: Review });

const TYPES = ["All", "text", "image", "carousel", "document"] as const;
const SOURCES = ["All", "personal", "company"] as const;
const TIERS = ["All", "75+", "50-75", "<50"] as const;
const STATUSES = ["All", "pending_review", "filtered", "rejected"] as const;

function Review() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<(typeof TYPES)[number]>("All");
  const [source, setSource] = useState<(typeof SOURCES)[number]>("All");
  const [tier, setTier] = useState<(typeof TIERS)[number]>("All");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("pending_review");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"score" | "newest" | "oldest">("score");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("*")
      .in("status", ["pending_review", "filtered", "rejected"])
      .order("created_at", { ascending: false })
      .limit(200);
    setPosts((data ?? []) as Post[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("review-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => load())
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, []);

  const filtered = useMemo(() => {
    let list = posts;
    if (type !== "All") list = list.filter((p) => p.content_type === type);
    if (source !== "All") list = list.filter((p) => p.source_type === source);
    if (status !== "All") list = list.filter((p) => p.status === status);
    if (tier !== "All") {
      list = list.filter((p) => {
        const s = p.score ?? 0;
        if (tier === "75+") return s >= 75;
        if (tier === "50-75") return s >= 50 && s < 75;
        return s < 50;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.repurposed_content?.toLowerCase().includes(q) ||
          p.original_content?.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    if (sort === "score") sorted.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    else if (sort === "newest") sorted.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else sorted.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    return sorted;
  }, [posts, type, source, tier, status, search, sort]);

  const filtersActive = type !== "All" || source !== "All" || tier !== "All" || status !== "pending_review" || !!search;

  return (
    <AppShell title="Review Queue">
      <div className="card-shell" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <Select label="Type" value={type} options={TYPES} onChange={(v) => setType(v as any)} />
          <Select label="Source" value={source} options={SOURCES} onChange={(v) => setSource(v as any)} />
          <Select label="Score" value={tier} options={TIERS} onChange={(v) => setTier(v as any)} />
          <Select label="Status" value={status} options={STATUSES} onChange={(v) => setStatus(v as any)} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            style={{
              flex: 1,
              minWidth: 160,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "8px 12px",
              color: "var(--foreground)",
              fontSize: 13,
            }}
          />
          <Select label="Sort" value={sort} options={["score", "newest", "oldest"]} onChange={(v) => setSort(v as any)} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-shell" style={{ minHeight: 240, opacity: 0.5 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-shell" style={{ textAlign: "center", padding: "48px 20px" }}>
          <div style={{ fontSize: 15, marginBottom: 6 }}>No posts to review</div>
          {filtersActive ? (
            <button
              onClick={() => { setType("All"); setSource("All"); setTier("All"); setStatus("All"); setSearch(""); }}
              style={{ marginTop: 8, background: "var(--brand)", color: "var(--brand-foreground)", border: 0, padding: "9px 14px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}
            >
              Clear filters
            </button>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>You're all caught up 🎉</div>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 16 }}>
          {filtered.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "inline-flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "6px 10px",
          color: "var(--foreground)",
          fontSize: 13,
        }}
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ background: "var(--surface)", color: "var(--foreground)" }}>
            {o.replace("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
