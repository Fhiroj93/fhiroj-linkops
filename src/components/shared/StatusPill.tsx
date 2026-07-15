import type { PostStatus } from "@/lib/types";

const MAP: Record<PostStatus, { label: string; color: string; bg: string }> = {
  auto_posted: { label: "Auto-posted", color: "var(--success)", bg: "rgba(74,222,128,0.12)" },
  posted: { label: "Posted", color: "var(--success)", bg: "rgba(74,222,128,0.12)" },
  pending_review: { label: "Pending review", color: "var(--brand)", bg: "rgba(245,166,35,0.14)" },
  scheduled: { label: "Scheduled", color: "var(--brand)", bg: "rgba(245,166,35,0.14)" },
  filtered: { label: "Filtered", color: "var(--neutral)", bg: "rgba(107,114,128,0.16)" },
  rejected: { label: "Rejected", color: "var(--danger)", bg: "rgba(248,113,113,0.12)" },
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
