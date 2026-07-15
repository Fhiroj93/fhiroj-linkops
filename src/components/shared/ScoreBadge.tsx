interface Props {
  score: number | null;
  size?: "sm" | "md";
}

export function ScoreBadge({ score, size = "md" }: Props) {
  const s = score ?? 0;
  let color = "var(--danger)";
  let bg = "rgba(248, 113, 113, 0.12)";
  if (s >= 75) {
    color = "var(--success)";
    bg = "rgba(74, 222, 128, 0.12)";
  } else if (s >= 50) {
    color = "var(--warning)";
    bg = "rgba(250, 204, 21, 0.12)";
  }
  const pad = size === "sm" ? "2px 8px" : "4px 10px";
  const fs = size === "sm" ? 11 : 12;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: pad,
        borderRadius: 999,
        background: bg,
        color,
        fontSize: fs,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
      {score == null ? "—" : s}
    </span>
  );
}
