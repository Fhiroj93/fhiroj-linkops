import { Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer
      style={{
        padding: "18px 32px",
        borderTop: "1px solid var(--border)",
        color: "var(--text-muted)",
        fontSize: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <span>Built by Shaik Fhiroj</span>
      <a
        href="https://www.linkedin.com/in/fhiroj-shaik-020760355/"
        target="_blank"
        rel="noreferrer noopener"
        style={{ color: "var(--brand)", display: "inline-flex", alignItems: "center" }}
        aria-label="LinkedIn"
      >
        <Linkedin size={14} />
      </a>
    </footer>
  );
}
