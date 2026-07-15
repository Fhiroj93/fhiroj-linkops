import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { supabase } from "@/lib/supabase";
import type { Post, PausedDate } from "@/lib/types";
import { DetailDrawer } from "@/components/shared/DetailDrawer";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { addDays, addMonths, endOfMonth, format, isSameDay, startOfMonth, startOfWeek } from "date-fns";

export const Route = createFileRoute("/_authenticated/calendar")({ component: CalendarPage });

type ViewMode = "monthly" | "weekly" | "daily";

function CalendarPage() {
  const [view, setView] = useState<ViewMode>("monthly");
  const [anchor, setAnchor] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [paused, setPaused] = useState<PausedDate[]>([]);
  const [detail, setDetail] = useState<Post | null>(null);
  const [pauseFor, setPauseFor] = useState<string | null>(null);
  const [pauseReason, setPauseReason] = useState("");

  const load = async () => {
    const [{ data: p }, { data: pd }] = await Promise.all([
      supabase.from("posts").select("*").not("scheduled_for", "is", null).limit(500),
      supabase.from("paused_dates").select("*"),
    ]);
    setPosts((p ?? []) as Post[]);
    setPaused((pd ?? []) as PausedDate[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("cal-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "paused_dates" }, () => load())
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, []);

  const days = useMemo(() => {
    if (view === "daily") return [anchor];
    if (view === "weekly") {
      const start = startOfWeek(anchor, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
    const end = endOfMonth(anchor);
    const rows = Math.ceil((end.getDate() + (start.getDay() || 7) - 1) / 7);
    return Array.from({ length: rows * 7 }, (_, i) => addDays(start, i));
  }, [view, anchor]);

  const pausedSet = useMemo(() => new Set(paused.map((p) => p.paused_date)), [paused]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    posts.forEach((p) => {
      if (!p.scheduled_for) return;
      const key = format(new Date(p.scheduled_for), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [posts]);

  const nav = (dir: 1 | -1) => {
    if (view === "daily") setAnchor(addDays(anchor, dir));
    else if (view === "weekly") setAnchor(addDays(anchor, dir * 7));
    else setAnchor(addMonths(anchor, dir));
  };

  const togglePause = async (dateStr: string) => {
    if (pausedSet.has(dateStr)) {
      if (!confirm("Un-pause this date?")) return;
      const { error } = await supabase.from("paused_dates").delete().eq("paused_date", dateStr);
      if (error) toast.error(error.message);
      else toast.success("Un-paused");
    } else {
      setPauseFor(dateStr);
    }
  };

  const confirmPause = async () => {
    if (!pauseFor) return;
    const { error } = await supabase
      .from("paused_dates")
      .insert({ paused_date: pauseFor, reason: pauseReason || null });
    if (error) toast.error(error.message);
    else toast.success("Date paused");
    setPauseFor(null);
    setPauseReason("");
  };

  const onDrop = async (dateStr: string, e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    if (pausedSet.has(dateStr)) {
      toast.error("This date is paused");
      return;
    }
    const target = new Date(dateStr);
    target.setHours(9, 0, 0, 0);
    const original = posts.find((p) => p.id === id);
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, scheduled_for: target.toISOString() } : p)));
    const { error } = await supabase.from("posts").update({ scheduled_for: target.toISOString() }).eq("id", id);
    if (error) {
      toast.error("Reschedule failed");
      if (original) setPosts((prev) => prev.map((p) => (p.id === id ? original : p)));
    } else {
      toast.success("Rescheduled to " + format(target, "MMM d"));
    }
  };

  const statusDot = (s: Post["status"]) =>
    s === "posted" || s === "auto_posted" ? "var(--success)" :
    s === "filtered" || s === "rejected" ? "var(--neutral)" : "var(--brand)";

  return (
    <AppShell title="Calendar">
      <div className="card-shell" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 3, borderRadius: 10 }}>
          {(["monthly", "weekly", "daily"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "6px 14px", borderRadius: 8, border: 0,
                background: view === v ? "var(--brand)" : "transparent",
                color: view === v ? "var(--brand-foreground)" : "var(--text-secondary)",
                fontWeight: 600, fontSize: 12.5, cursor: "pointer", textTransform: "capitalize",
              }}
            >
              {v}
            </button>
          ))}
        </div>
        <button onClick={() => nav(-1)} style={iconBtn}><ChevronLeft size={16} /></button>
        <button onClick={() => setAnchor(new Date())} style={secondaryBtn}>Today</button>
        <button onClick={() => nav(1)} style={iconBtn}><ChevronRight size={16} /></button>
        <div style={{ fontSize: 14, fontWeight: 600, marginLeft: 6 }}>
          {view === "daily" ? format(anchor, "EEEE, MMM d yyyy") :
           view === "weekly" ? `Week of ${format(startOfWeek(anchor, { weekStartsOn: 1 }), "MMM d")}` :
           format(anchor, "MMMM yyyy")}
        </div>
      </div>

      <div className="card-shell" style={{ padding: 12 }}>
        {view === "monthly" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600, padding: 6 }}>{d}</div>
            ))}
            {days.map((d, i) => {
              const key = format(d, "yyyy-MM-dd");
              const inMonth = d.getMonth() === anchor.getMonth();
              const dayPosts = postsByDay.get(key) ?? [];
              const isPaused = pausedSet.has(key);
              const isToday = isSameDay(d, new Date());
              return (
                <div
                  key={i}
                  className={isPaused ? "paused-cell" : ""}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(key, e)}
                  style={{
                    minHeight: 92,
                    background: "var(--surface-2)",
                    border: `1px solid ${isToday ? "var(--brand)" : "var(--border)"}`,
                    borderRadius: 10,
                    padding: 8,
                    opacity: inMonth ? 1 : 0.4,
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: isToday ? "var(--brand)" : "var(--text-secondary)" }}>{d.getDate()}</span>
                    <button
                      onClick={() => togglePause(key)}
                      title={isPaused ? "Un-pause" : "Pause automation"}
                      style={{ background: "transparent", border: 0, color: isPaused ? "var(--brand)" : "var(--text-muted)", cursor: "pointer", padding: 0 }}
                    >
                      {isPaused ? <Play size={12} /> : <Pause size={12} />}
                    </button>
                  </div>
                  {dayPosts.slice(0, 3).map((p) => {
                    const locked = p.status === "posted" || p.status === "auto_posted";
                    return (
                      <div
                        key={p.id}
                        draggable={!locked}
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", p.id)}
                        onClick={() => setDetail(p)}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          fontSize: 11,
                          padding: "3px 6px",
                          background: "var(--surface)",
                          borderRadius: 6,
                          marginBottom: 3,
                          cursor: locked ? "not-allowed" : "grab",
                          opacity: locked ? 0.55 : 1,
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: statusDot(p.status), flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                          {(p.repurposed_content ?? p.original_content ?? "Post").slice(0, 26)}
                        </span>
                      </div>
                    );
                  })}
                  {dayPosts.length > 3 && (
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>+{dayPosts.length - 3} more</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {view !== "monthly" && (
          <div style={{ display: "grid", gridTemplateColumns: view === "daily" ? "1fr" : "repeat(7, 1fr)", gap: 6 }}>
            {days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const isPaused = pausedSet.has(key);
              const dayPosts = postsByDay.get(key) ?? [];
              return (
                <div
                  key={key}
                  className={isPaused ? "paused-cell" : ""}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(key, e)}
                  style={{ background: "var(--surface-2)", borderRadius: 10, padding: 10, minHeight: 220, border: "1px solid var(--border)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.06 }}>{format(d, "EEE")}</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{format(d, "d")}</div>
                    </div>
                    <button
                      onClick={() => togglePause(key)}
                      style={{ background: "transparent", border: 0, color: isPaused ? "var(--brand)" : "var(--text-muted)", cursor: "pointer" }}
                    >
                      {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                  </div>
                  {dayPosts.map((p) => {
                    const locked = p.status === "posted" || p.status === "auto_posted";
                    return (
                      <div
                        key={p.id}
                        draggable={!locked}
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", p.id)}
                        onClick={() => setDetail(p)}
                        style={{
                          fontSize: 11.5, padding: 6, background: "var(--surface)", borderRadius: 6, marginBottom: 4,
                          cursor: locked ? "not-allowed" : "grab", opacity: locked ? 0.55 : 1,
                          display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: statusDot(p.status) }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {format(new Date(p.scheduled_for!), "HH:mm")} — {(p.repurposed_content ?? "Post").slice(0, 40)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pauseFor && (
        <>
          <div onClick={() => setPauseFor(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 80 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, zIndex: 81, width: "min(400px, 90vw)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Pause automation on {format(new Date(pauseFor), "MMM d")}?</div>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 12 }}>Scheduled posts on this day will be blocked.</div>
            <input
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              placeholder="Optional reason"
              style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 12px", color: "var(--foreground)", fontSize: 13, marginBottom: 14 }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setPauseFor(null)} style={secondaryBtn}>Cancel</button>
              <button onClick={confirmPause} style={{ background: "var(--brand)", color: "var(--brand-foreground)", border: 0, padding: "8px 14px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Confirm</button>
            </div>
          </div>
        </>
      )}

      <DetailDrawer post={detail} onClose={() => setDetail(null)} />
    </AppShell>
  );
}

const iconBtn: React.CSSProperties = {
  background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)",
  width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center",
};
const secondaryBtn: React.CSSProperties = {
  background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)",
  padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600,
};
