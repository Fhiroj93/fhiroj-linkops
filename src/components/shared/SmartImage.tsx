import { useState } from "react";
import { ImageOff } from "lucide-react";

/**
 * Renders remote post images reliably on any host (Netlify, Vercel, etc.).
 * - Google Drive share links are rewritten to direct thumbnail/view URLs.
 * - LinkedIn / CDN images block hotlinking via Referer checks, so we send no
 *   referrer and fall back to an image proxy, then to a placeholder tile.
 */
const driveId = (url: string): string | null => {
  const m =
    url.match(/drive\.google\.com\/file\/d\/([\w-]+)/) ||
    url.match(/[?&]id=([\w-]+)/) ||
    url.match(/drive\.google\.com\/open\?id=([\w-]+)/);
  return m ? m[1] : null;
};

/** Ordered list of candidate URLs to try for a given source. */
function candidates(url: string): string[] {
  const id = driveId(url);
  if (id) {
    return [
      `https://drive.google.com/thumbnail?id=${id}&sz=w1200`,
      `https://lh3.googleusercontent.com/d/${id}=w1200`,
      `https://drive.google.com/uc?export=view&id=${id}`,
    ];
  }
  return [
    url,
    `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}&w=1000&output=webp`,
  ];
}


interface Props {
  src: string;
  alt?: string;
  size: number;
  onClick?: () => void;
}

export function SmartImage({ src, alt = "Post image", size, onClick }: Props) {
  const urls = candidates(src);
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid var(--border)",
    background: "var(--surface-2)",
    flexShrink: 0,
  };

  if (idx >= urls.length) {
    return (
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        title="Open image in a new tab"
        style={{
          ...base,
          display: "grid",
          placeItems: "center",
          color: "var(--text-muted)",
          textDecoration: "none",
        }}
      >
        <ImageOff size={Math.max(14, size / 5)} />
      </a>
    );
  }

  return (
    <div
      style={{ ...base, cursor: onClick ? "zoom-in" : "default", position: "relative" }}
      onClick={onClick}
      className="hover-lift"
    >
      <img
        key={urls[idx]}
        src={urls[idx]}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setIdx((i) => i + 1)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity .35s ease, transform .4s ease",
        }}
      />
    </div>
  );

}
