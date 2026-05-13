"use client";

import { Search, Command } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

/**
 * Top command/search bar — the "Bloomberg Terminal density" entry point.
 * Phase 3 will wire ⌘K / Ctrl-K to a Cmdk palette that searches
 * announcements, courses, videos, library, users (admin), etc.
 * For now this is a placeholder hook that ships visible UI.
 */
export function CommandBar({ placeholder = "Tìm môn học, thông báo, video…" }: { placeholder?: string }) {
  const [value, setValue] = useState("");

  return (
    <div className="relative flex-1 max-w-md hidden md:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-12 h-9 text-sm bg-slate-50 border-slate-200"
      />
      <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 bg-white">
        <Command className="h-3 w-3" /> K
      </kbd>
    </div>
  );
}
