"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  type: "LESSON" | "VIDEO" | "LIBRARY_ITEM" | "COURSE";
  itemId: string;
  initialBookmarked: boolean;
  variant?: "icon" | "button";
  label?: string;
}

export function BookmarkButton({
  type,
  itemId,
  initialBookmarked,
  variant = "button",
  label = "Lưu",
}: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [pending, setPending] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPending(true);
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, itemId }),
    });
    const json = await res.json();
    setPending(false);
    if (json.ok) setBookmarked(json.data.bookmarked);
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        title={bookmarked ? "Bỏ lưu" : "Lưu vào Học tập của tôi"}
        className={cn(
          "p-2 rounded-lg transition-colors",
          bookmarked
            ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
            : "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
        )}
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : bookmarked ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "btn btn-sm",
        bookmarked
          ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
          : "btn-outline",
      )}
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : bookmarked ? (
        <BookmarkCheck className="w-3.5 h-3.5" />
      ) : (
        <Bookmark className="w-3.5 h-3.5" />
      )}
      {bookmarked ? "Đã lưu" : label}
    </button>
  );
}
