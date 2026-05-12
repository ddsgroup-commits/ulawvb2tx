"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, NotebookPen, Trash2 } from "lucide-react";

interface Props {
  lessonId: string;
}

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

/**
 * Personal lesson notes. Auto-saves the textarea content 1.2s after the
 * user stops typing, plus on blur. Empty content deletes the row.
 *
 * Loads asynchronously on mount so the surrounding page can stay a
 * Server Component and pre-render fast.
 */
export function LessonNotes({ lessonId }: Props) {
  const [content, setContent] = useState("");
  const [state, setState] = useState<SaveState>("idle");
  const [loaded, setLoaded] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef("");

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/lessons/${lessonId}/notes`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const c = j?.data?.content ?? "";
        setContent(c);
        lastSaved.current = c;
        if (j?.data?.updatedAt) setUpdatedAt(new Date(j.data.updatedAt));
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [lessonId]);

  const save = useCallback(async (text: string) => {
    if (text === lastSaved.current) {
      setState("saved");
      return;
    }
    setState("saving");
    try {
      const res = await fetch(`/api/lessons/${lessonId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error("save failed");
      lastSaved.current = text;
      setState("saved");
      setUpdatedAt(new Date());
    } catch {
      setState("error");
    }
  }, [lessonId]);

  // Debounced auto-save on change.
  useEffect(() => {
    if (!loaded) return;
    if (content === lastSaved.current) return;
    setState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(content), 1200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [content, loaded, save]);

  // Flush pending save on unmount via sendBeacon.
  useEffect(() => {
    return () => {
      if (content !== lastSaved.current && content.length < 20000) {
        navigator.sendBeacon?.(
          `/api/lessons/${lessonId}/notes`,
          new Blob([JSON.stringify({ content })], { type: "application/json" }),
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  async function handleClear() {
    if (!confirm("Xóa toàn bộ ghi chú của bạn cho bài học này?")) return;
    setContent("");
    await save("");
    setUpdatedAt(null);
  }

  const indicator = (() => {
    switch (state) {
      case "saving": return <span className="inline-flex items-center gap-1 text-slate-400"><Loader2 className="w-3 h-3 animate-spin" /> Đang lưu…</span>;
      case "saved":  return <span className="inline-flex items-center gap-1 text-green-600"><Check className="w-3 h-3" /> Đã lưu</span>;
      case "dirty":  return <span className="text-amber-600">Đang chỉnh sửa…</span>;
      case "error":  return <span className="text-red-600">Lỗi lưu — thử lại</span>;
      default:       return updatedAt ? <span className="text-slate-400">Đã lưu</span> : <span className="text-slate-400">Tự động lưu</span>;
    }
  })();

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
          <NotebookPen className="w-4 h-4" /> Ghi chú cá nhân
        </h2>
        <div className="flex items-center gap-3 text-[11px]">
          {indicator}
          {content.trim() && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-red-600 inline-flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Xóa
            </button>
          )}
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={() => save(content)}
        disabled={!loaded}
        placeholder={loaded ? "Viết ghi chú của bạn ở đây — chỉ bạn nhìn thấy. Tự động lưu mỗi khi bạn dừng gõ." : "Đang tải ghi chú…"}
        rows={6}
        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy px-3.5 py-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 disabled:opacity-50 resize-y min-h-[140px] transition-colors"
      />
      <div className="text-[11px] text-slate-400 mt-2">
        {content.length.toLocaleString("vi-VN")} ký tự · Chỉ bạn nhìn thấy ghi chú này.
      </div>
    </div>
  );
}
