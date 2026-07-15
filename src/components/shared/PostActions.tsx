import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/lib/types";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar as CalendarIcon, Send, X as XIcon } from "lucide-react";

const primaryBtn: React.CSSProperties = {
  background: "var(--brand)",
  color: "var(--brand-foreground)",
  padding: "8px 14px",
  borderRadius: 10,
  border: 0,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};
const secondaryBtn: React.CSSProperties = {
  background: "var(--surface-2)",
  color: "var(--foreground)",
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  fontWeight: 500,
  fontSize: 13,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};
const dangerBtn: React.CSSProperties = {
  ...secondaryBtn,
  color: "var(--danger)",
};

export function PostActions({ post, onDone }: { post: Post; onDone?: () => void }) {
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [busy, setBusy] = useState(false);

  const approveNow = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("posts")
      .update({ status: "scheduled", scheduled_for: new Date().toISOString() })
      .eq("id", post.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Approved — publishing now");
      onDone?.();
    }
  };

  const schedule = async () => {
    setBusy(true);
    const iso = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    const { error } = await supabase
      .from("posts")
      .update({ status: "scheduled", scheduled_for: iso })
      .eq("id", post.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Scheduled");
      onDone?.();
    }
  };

  const reject = async () => {
    setBusy(true);
    const { error } = await supabase.from("posts").update({ status: "rejected" }).eq("id", post.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Rejected");
      onDone?.();
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <button style={primaryBtn} onClick={approveNow} disabled={busy}>
        <Send size={13} /> Approve & Post Now
      </button>
      <Popover>
        <PopoverTrigger asChild>
          <button style={secondaryBtn}>
            <CalendarIcon size={13} /> Schedule
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 14 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>Date</label>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              style={inputStyle}
            />
            <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>Time</label>
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              style={inputStyle}
            />
            <button style={primaryBtn} onClick={schedule} disabled={busy}>Confirm</button>
          </div>
        </PopoverContent>
      </Popover>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button style={dangerBtn}>
            <XIcon size={13} /> Reject
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this post?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--text-secondary)" }}>
              This will mark the post as rejected. It will not be published.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={reject} style={{ background: "var(--danger)", color: "#fff" }}>
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "6px 10px",
  color: "var(--foreground)",
  fontSize: 13,
};
