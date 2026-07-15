import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/lib/types";
import { toast } from "sonner";
import { ScoreBadge } from "./ScoreBadge";
import { StatusPill } from "./StatusPill";
import { SourceBadge, ContentTypeIcon } from "./SourceBadge";
import { X, Info, Lightbulb, FileText } from "lucide-react";
import { format } from "date-fns";
import { PostActions } from "./PostActions";

interface Props {
  post: Post | null;
  onClose: () => void;
}

export function DetailDrawer({ post, onClose }: Props) {
  const [editing, setEditing] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    setEditing(post?.repurposed_content ?? "");
    setShowOriginal(false);
  }, [post]);

  if (!post) return null;
  const editable = post.status === "pending_review";

  const saveEdit = async () => {
    if (editing === post.repurposed_content) return;
    const { error } = await supabase
      .from("posts")
      .update({ repurposed_content: editing })
      .eq("id", post.id);
    if (error) toast.error("Save failed: " + error.message);
    else toast.success("Saved");
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 60,
        }}
      />
      <aside
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: "min(520px, 100vw)",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          zIndex: 61,
          overflowY: "auto",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <ContentTypeIcon type={post.content_type} />
          <SourceBadge source={post.source_type} />
          <StatusPill status={post.status} />
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: 0,
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {post.original_content && (
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setShowOriginal((v) => !v)}
              style={{
                background: "transparent",
                border: 0,
                color: "var(--text-secondary)",
                fontSize: 12,
                cursor: "pointer",
                padding: 0,
                marginBottom: 6,
              }}
            >
              {showOriginal ? "Hide original ▴" : "Show original ▾"}
            </button>
            {showOriginal && (
              <div
                style={{
                  background: "var(--surface-2)",
                  padding: 12,
                  borderRadius: 10,
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {post.original_content}
                {(post.live_likes != null || post.live_comments != null) && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
                    ❤️ {post.live_likes ?? 0} 💬 {post.live_comments ?? 0} 🔁 {post.live_shares ?? 0}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="section-label" style={{ marginBottom: 6 }}>
          Repurposed Content
        </div>
        {editable ? (
          <textarea
            value={editing}
            onChange={(e) => setEditing(e.target.value)}
            onBlur={saveEdit}
            style={{
              width: "100%",
              minHeight: 160,
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
        ) : (
          <div
            style={{
              background: "var(--surface-2)",
              padding: 12,
              borderRadius: 10,
              fontSize: 14,
              whiteSpace: "pre-wrap",
            }}
          >
            {post.repurposed_content || <span style={{ color: "var(--text-muted)" }}>—</span>}
          </div>
        )}

        {post.image_urls && post.image_urls.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {post.image_urls.slice(0, 4).map((u, i) => (
              <img
                key={i}
                src={u}
                alt=""
                style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }}
              />
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
              marginTop: 12,
              padding: "10px 12px",
              background: "var(--surface-2)",
              borderRadius: 10,
              color: "var(--foreground)",
              textDecoration: "none",
              fontSize: 13,
              border: "1px solid var(--border)",
            }}
          >
            <FileText size={16} /> View PDF
          </a>
        )}

        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <ScoreBadge score={post.score} />
          {post.score_reason && (
            <span
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Info size={12} /> {post.score_reason}
            </span>
          )}
        </div>

        {post.improvement_tip && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: "rgba(245,166,35,0.10)",
              border: "1px solid rgba(245,166,35,0.30)",
              borderRadius: 10,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              fontSize: 13,
              color: "var(--foreground)",
            }}
          >
            <Lightbulb size={16} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 1 }} />
            <span>{post.improvement_tip}</span>
          </div>
        )}

        {(post.status === "posted" || post.status === "auto_posted") && (
          <div style={{ marginTop: 18, padding: 12, background: "var(--surface-2)", borderRadius: 10 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Live analytics</div>
            {post.analytics_updated_at ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13 }}>
                <span>❤️ {post.live_likes ?? 0}</span>
                <span>💬 {post.live_comments ?? 0}</span>
                <span>🔁 {post.live_shares ?? 0}</span>
                <span>👥 {post.live_reach ?? 0}</span>
                <span>👁️ {post.live_impressions ?? 0}</span>
                <span style={{ color: "var(--text-muted)" }}>
                  Updated {format(new Date(post.analytics_updated_at), "MMM d, HH:mm")}
                </span>
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                Analytics pending first refresh.
              </div>
            )}
          </div>
        )}

        {(post.status === "pending_review" || post.status === "scheduled") && (
          <div style={{ marginTop: 18 }}>
            <PostActions post={post} onDone={onClose} />
          </div>
        )}

        {post.status === "filtered" && (
          <div
            style={{
              marginTop: 18,
              padding: 12,
              background: "var(--surface-2)",
              borderRadius: 10,
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            Filtered — {post.score_reason ?? "excluded by rules"}
          </div>
        )}
        {post.status === "rejected" && (
          <div
            style={{
              marginTop: 18,
              padding: 12,
              background: "var(--surface-2)",
              borderRadius: 10,
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            Rejected
          </div>
        )}
      </aside>
    </>
  );
}
