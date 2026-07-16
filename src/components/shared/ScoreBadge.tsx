interface Props {
  score: number | null;
  size?: "sm" | "md";
  animate?: boolean;
}

export function ScoreBadge({ score, size = "md", animate = false }: Props) {
  const s = score ?? 0;
  let color = "var(--danger)";
  let bg = "var(--score-bad-bg)";
  if (s >= 75) {
    color = "var(--success)";
    bg = "var(--score-good-bg)";
  } else if (s >= 50) {
    color = "var(--warning)";
    bg = "var(--score-mid-bg)";
  }
  const pad = size === "sm" ? "2px 8px" : "4px 10px";
  const fs = size === "sm" ? 11 : 12;
  return (
    <span
      className={animate ? "score-pop" : undefined}
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
        fontVariantNumeric: "tabular-nums",
        fontFamily: "var(--font-mono)",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
      {score == null ? "—" : s}
    </span>
  );
}

