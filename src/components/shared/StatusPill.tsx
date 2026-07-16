import type { PostStatus } from "@/lib/types";

const MAP: Record<PostStatus, { label: string; color: string; bg: string }> = {
  auto_posted: { label: "Auto-posted", color: "var(--success)", bg: "var(--score-good-bg)" },
  posted: { label: "Posted", color: "var(--success)", bg: "var(--score-good-bg)" },
  pending_review: { label: "Pending review", color: "var(--brand)", bg: "color-mix(in oklab, var(--brand) 14%, transparent)" },
  scheduled: { label: "Scheduled", color: "var(--brand)", bg: "color-mix(in oklab, var(--brand) 14%, transparent)" },
  filtered: { label: "Filtered", color: "var(--neutral)", bg: "color-mix(in oklab, var(--neutral) 16%, transparent)" },
  rejected: { label: "Rejected", color: "var(--danger)", bg: "var(--score-bad-bg)" },
};

export function StatusPill({ status }: { status: PostStatus }) {
  const m = MAP[status] ?? MAP.pending_review;
  return (
    <span
      style={{
        display: "inline-flex",
        padding: "3px 10px",
        borderRadius: 999,
        background: m.bg,
        color: m.color,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.02,
      }}
    >
      {m.label}
    </span>
  );
}
