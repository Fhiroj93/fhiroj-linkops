import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewPostPanel({ open, onClose }: Props) {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<"text" | "image">("text");
  const [imgInstr, setImgInstr] = useState("");
  const [aiGen, setAiGen] = useState(false);
  const [scheduleLater, setScheduleLater] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const reset = () => {
    setTopic(""); setContent(""); setMedia("text"); setImgInstr("");
    setAiGen(false); setScheduleLater(false); setErrors({});
  };

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (!topic.trim()) errs.topic = "Topic is required";
    if (!content.trim()) errs.content = "Content is required";
    if (content.length > 2200) errs.content = "Max 2200 chars";
    if (scheduleLater && (!date || !time)) errs.schedule = "Pick date and time";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    const scheduled_for = scheduleLater
      ? new Date(`${date}T${time}`).toISOString()
      : new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error } = await supabase.from("posts").insert({
      origin: "manual",
      source_type: "manual",
      content_type: media,
      repurposed_content: content,
      image_prompt: media === "image" ? imgInstr || null : null,
      status: "scheduled",
      scheduled_for,
    });
    if (error) {
      setBusy(false);
      toast.error("Create failed: " + error.message);
      return;
    }

    try {
      await fetch("https://n8n.srv971626.hstgr.cloud/webhook/linkops-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          content,
          content_type: media,
          image_prompt: media === "image" ? imgInstr || null : null,
          ai_generated: aiGen,
          scheduled_for,
          schedule_later: scheduleLater,
          submitted_at: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error("Webhook post failed", err);
      toast.error("Webhook trigger failed");
    }

    setBusy(false);
    toast.success(
      scheduleLater
        ? `Scheduled for ${new Date(scheduled_for).toLocaleString()}`
        : "Will post in 5 minutes",
    );
    reset();
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 70 }} />
      <aside
        style={{
          position: "fixed",
          right: 0, top: 0, bottom: 0,
          width: "min(480px, 100vw)",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          zIndex: 71,
          overflowY: "auto",
          padding: 24,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>New Post</h2>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "transparent", border: 0, color: "var(--text-secondary)", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>Content</div>
            <Field label="Post Topic *" error={errors.topic}>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} style={inputStyle} placeholder="e.g. Lessons from launching v2" />
            </Field>
            <Field label={`Post Content * (${content.length}/2200)`} error={errors.content}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={2200}
                rows={7}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
              />
            </Field>
          </div>

          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>Media</div>
            <PillToggle
              value={media}
              onChange={(v) => setMedia(v as "text" | "image")}
              options={[{ v: "text", label: "Text Only" }, { v: "image", label: "Image" }]}
            />
            {media === "image" && (
              <div style={{ marginTop: 12 }}>
                <Field label={`Image Instructions (${imgInstr.length}/500)`}>
                  <textarea
                    value={imgInstr}
                    onChange={(e) => setImgInstr(e.target.value.slice(0, 500))}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                    placeholder="Describe the image you want"
                  />
                </Field>
              </div>
            )}
          </div>

          <ToggleRow
            label="AI Generated"
            hint="Let AI create or enhance your content"
            value={aiGen}
            onChange={setAiGen}
          />

          <ToggleRow
            label="Schedule for Later"
            hint={scheduleLater ? "" : "Will post in 5 minutes"}
            value={scheduleLater}
            onChange={setScheduleLater}
          />
          {scheduleLater && (
            <div style={{ display: "flex", gap: 10 }}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
          <button onClick={submit} disabled={busy} style={{ ...primaryBtnStyle, opacity: busy ? 0.6 : 1 }}>
            {busy ? "Creating…" : "Create Post"}
          </button>
        </div>
      </aside>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>{label}</label>
      {children}
      {error && <div style={{ color: "var(--danger)", fontSize: 11, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function PillToggle({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; label: string }[] }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 3, borderRadius: 10 }}>
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          style={{
            padding: "7px 14px",
            borderRadius: 8,
            border: 0,
            background: value === o.v ? "var(--brand)" : "transparent",
            color: value === o.v ? "var(--brand-foreground)" : "var(--text-secondary)",
            fontWeight: 600,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{hint}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 40, height: 22, borderRadius: 999,
          background: value ? "var(--brand)" : "var(--surface-2)",
          border: "1px solid var(--border)",
          position: "relative", cursor: "pointer", padding: 0,
          transition: "background 150ms",
        }}
      >
        <span style={{
          position: "absolute",
          top: 2, left: value ? 20 : 2,
          width: 16, height: 16, borderRadius: 999,
          background: "#fff",
          transition: "left 150ms",
        }} />
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 12px",
  color: "var(--foreground)",
  fontSize: 14,
};
const primaryBtnStyle: React.CSSProperties = {
  flex: 1,
  background: "var(--brand)",
  color: "var(--brand-foreground)",
  border: 0,
  padding: "11px 16px",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 14,
};
const secondaryBtnStyle: React.CSSProperties = {
  background: "var(--surface-2)",
  color: "var(--foreground)",
  border: "1px solid var(--border)",
  padding: "11px 16px",
  borderRadius: 10,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 14,
};
