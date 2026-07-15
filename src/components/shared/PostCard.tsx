import { useState } from "react";
import type { Post } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { ScoreBadge } from "./ScoreBadge";
import { StatusPill } from "./StatusPill";
import { SourceBadge, ContentTypeIcon } from "./SourceBadge";
import { PostActions } from "./PostActions";
import { Info, Lightbulb, FileText } from "lucide-react";
import { toast } from "sonner";

interface Props {
  post: Post;
  onClick?: () => void;
}

export function PostCard({ post, onClick }: Props) {
  const [content, setContent] = useState(post.repurposed_content ?? "");
  const [showOriginal, setShowOriginal] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const saveContent = async () => {
    if (content === post.repurposed_content) return;
    const { error } = await supabase
      .from("posts")
      .update({ repurposed_content: content })
      .eq("id", post.id);
    if (error) toast.error("Save failed");
    else {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1400);
    }
  };

  return (
    <div className="card-shell fade-slide-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ContentTypeIcon type={post.content_type} />
        <SourceBadge source={post.source_type} />
        <StatusPill status={post.status} />
        <div style={{ marginLeft: "auto" }}>
          <ScoreBadge score={post.score} />
        </div>
      </div>

      {post.original_content && (
        <div>
          <button
            onClick={() => setShowOriginal((v) => !v)}
            style={{
              background: "transparent",
              border: 0,
              color: "var(--text-secondary)",
              fontSize: 12,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {showOriginal ? "Hide original ▴" : "Show original ▾"}
          </button>
          {showOriginal && (
            <div
              style={{
                marginTop: 6,
                background: "var(--surface-2)",
                padding: 10,
                borderRadius: 8,
                fontSize: 12.5,
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
              }}
            >
              {post.original_content}
              {post.scraped_post_id && (
                <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 11 }}>
                  ❤️ {post.live_likes ?? 0} 💬 {post.live_comments ?? 0} 🔁 {post.live_shares ?? 0}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {post.status === "pending_review" ? (
        <div style={{ position: "relative" }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={saveContent}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              minHeight: 120,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 12,
              color: "var(--foreground)",
              fontSize: 14,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
          {savedFlash && (
            <span
              style={{
                position: "absolute",
                top: 8,
                right: 10,
                fontSize: 11,
                color: "var(--success)",
              }}
            >
              Saved ✓
            </span>
          )}
        </div>
      ) : (
        <div
          onClick={onClick}
          style={{
            background: "var(--surface-2)",
            padding: 12,
            borderRadius: 10,
            fontSize: 14,
            whiteSpace: "pre-wrap",
            cursor: onClick ? "pointer" : "default",
          }}
        >
          {post.repurposed_content || <span style={{ color: "var(--text-muted)" }}>—</span>}
        </div>
      )}

      {post.image_urls && post.image_urls.length > 0 && (
        <div style={{ display: "flex", gap: 6 }}>
          {post.image_urls.slice(0, 4).map((u, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img
                src={u}
                alt=""
                style={{ width: 68, height: 68, objectFit: "cover", borderRadius: 8 }}
              />
              {i === 3 && post.image_urls!.length > 4 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.55)",
                    borderRadius: 8,
                    display: "grid",
                    placeItems: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  +{post.image_urls!.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {post.document_url && (
        <a
          href={post.document_url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            color: "var(--foreground)",
            textDecoration: "none",
            fontSize: 12.5,
            width: "fit-content",
          }}
        >
          <FileText size={14} /> View PDF
        </a>
      )}

      {post.score_reason && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "var(--text-secondary)" }}>
          <Info size={12} /> {post.score_reason}
        </div>
      )}

      {post.improvement_tip && (
        <div
          style={{
            padding: 10,
            background: "rgba(245,166,35,0.10)",
            border: "1px solid rgba(245,166,35,0.30)",
            borderRadius: 10,
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            fontSize: 13,
          }}
        >
          <Lightbulb size={15} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 1 }} />
          <span>{post.improvement_tip}</span>
        </div>
      )}

      {post.status === "pending_review" && <PostActions post={post} />}
      {post.status === "filtered" && (
        <div style={bannerStyle}>Filtered — hidden from publish queue</div>
      )}
      {post.status === "rejected" && <div style={bannerStyle}>Rejected</div>}
    </div>
  );
}

const bannerStyle: React.CSSProperties = {
  padding: "8px 12px",
  background: "var(--surface-2)",
  borderRadius: 10,
  color: "var(--text-secondary)",
  fontSize: 12.5,
};
