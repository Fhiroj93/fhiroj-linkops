import { Building2, User, PenLine } from "lucide-react";

export function SourceBadge({ source }: { source: string | null }) {
  const map: Record<string, { label: string; Icon: typeof User }> = {
    personal: { label: "Personal", Icon: User },
    company: { label: "Company", Icon: Building2 },
    manual: { label: "Manual", Icon: PenLine },
  };
  const m = map[source ?? ""] ?? { label: source ?? "Unknown", Icon: User };
  const Icon = m.Icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 8,
        background: "var(--surface-2)",
        color: "var(--text-secondary)",
        fontSize: 11,
        fontWeight: 500,
      }}
    >
      <Icon size={11} /> {m.label}
    </span>
  );
}

export function ContentTypeIcon({ type }: { type: string | null }) {
  const labels: Record<string, string> = {
    text: "📝",
    image: "🖼️",
    carousel: "🎠",
    document: "📄",
  };
  return (
    <span style={{ fontSize: 14 }} title={type ?? "text"}>
      {labels[type ?? "text"] ?? "📝"}
    </span>
  );
}
