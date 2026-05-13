"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface Props {
  lessonId: string;
  initialCompleted: boolean;
  /** Where to navigate after marking complete (next lesson). Null = stay. */
  nextHref: string | null;
}

// Lightweight client component: writes a "viewed" heartbeat on mount and
// exposes the Mark Complete / Undo toggle. Kept in its own file so the
// surrounding lesson page can stay a React Server Component.
export function LessonMarkComplete({ lessonId, initialCompleted, nextHref }: Props) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const mountedAt = useRef<number>(Date.now());

  // Heartbeat: register that the user opened this lesson (lastViewedAt
  // gets updated). Fire-and-forget; no UI feedback.
  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});

    // On unmount, send the elapsed seconds so the watch time is tracked.
    return () => {
      const elapsedSec = Math.floor((Date.now() - mountedAt.current) / 1000);
      if (elapsedSec > 5 && elapsedSec < 7200) {
        navigator.sendBeacon?.(
          `/api/lessons/${lessonId}/progress`,
          new Blob([JSON.stringify({ watchTimeDelta: elapsedSec })], {
            type: "application/json",
          }),
        );
      }
    };
  }, [lessonId]);

  async function toggle(complete: boolean) {
    setPending(true);
    const res = await fetch(`/api/lessons/${lessonId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: complete }),
    });
    setPending(false);
    if (!res.ok) {
      alert("Không cập nhật được tiến độ. Vui lòng thử lại.");
      return;
    }
    setCompleted(complete);
    router.refresh();
    if (complete && nextHref) {
      // small UX delay so user sees the state flip
      setTimeout(() => router.push(nextHref), 300);
    }
  }

  if (completed) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-2 text-green-700 font-semibold text-sm">
          <CheckCircle2 className="w-5 h-5" /> Đã hoàn thành bài học
        </span>
        <button
          type="button"
          onClick={() => toggle(false)}
          disabled={pending}
          className="text-xs text-slate-500 hover:text-slate-700 underline disabled:opacity-50"
        >
          {pending ? "Đang cập nhật…" : "Bỏ đánh dấu"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(true)}
      disabled={pending}
      className="btn btn-primary"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Circle className="w-4 h-4" />}
      Đánh dấu hoàn thành
    </button>
  );
}
