"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem { id: string; question: string; answer: string; }
interface FaqGroup { category: string; items: FaqItem[]; }

export default function FaqPage() {
  const [groups, setGroups] = useState<FaqGroup[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faq")
      .then(r => r.json())
      .then(d => { if (d.ok) setGroups(d.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-dark">FAQ & Hướng dẫn</h1>
        <p className="text-slate-500 text-sm mt-1">Câu hỏi thường gặp về website, học tập và quy chế</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-14 w-full" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Chưa có câu hỏi nào</p>
        </div>
      ) : (
        groups.map(g => (
          <section key={g.category}>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-4 h-px bg-slate-300 inline-block" />
              {g.category}
            </h2>
            <div className="space-y-2">
              {g.items.map(item => (
                <div key={item.id} className="card overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left
                               hover:bg-slate-50/60 transition-colors"
                    aria-expanded={expanded === item.id}
                  >
                    <span className="font-medium text-slate-800 flex items-start gap-2.5 text-sm">
                      <HelpCircle className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                      {item.question}
                    </span>
                    {expanded === item.id
                      ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>
                  {expanded === item.id && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-100">
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap pl-6.5">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <div className="notice text-sm">
        Câu hỏi của bạn chưa có ở đây? Liên hệ Ban cán sự lớp qua email hoặc nhóm Zalo nội bộ.
      </div>
    </div>
  );
}
