"use client";

import { useState, useEffect } from "react";
import { HelpCircle, Search, ChevronDown, ChevronUp } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  order: number;
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/faq")
      .then(r => r.json())
      .then(j => { if (j.ok) setFaqs(j.data); setLoading(false); });
  }, []);

  const filtered = faqs.filter(f => {
    const matchQ = !q || f.question.toLowerCase().includes(q.toLowerCase()) || f.answer.toLowerCase().includes(q.toLowerCase());
    const matchCat = !activeCategory || f.category === activeCategory;
    return matchQ && matchCat;
  });

  const categories = [...new Set(faqs.map(f => f.category).filter(Boolean))] as string[];

  const grouped = categories.reduce<Record<string, FAQ[]>>((acc, cat) => {
    acc[cat] = filtered.filter(f => f.category === cat);
    return acc;
  }, {});

  const uncategorized = filtered.filter(f => !f.category);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-ulaw" /> Câu hỏi thường gặp
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Giải đáp thắc mắc phổ biến về lớp học và hệ thống</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Tìm câu hỏi..."
          className="input pl-9"
        />
      </div>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              !activeCategory ? "bg-navy text-white border-navy" : "bg-white border-slate-200 text-slate-600"
            }`}>
            Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                activeCategory === cat ? "bg-navy text-white border-navy" : "bg-white border-slate-200 text-slate-600"
              }`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="card p-4"><div className="skeleton h-12 w-full" /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p className="empty-state-text">Không tìm thấy câu hỏi phù hợp</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Categorized */}
          {Object.entries(grouped).map(([cat, items]) => items.length > 0 && (
            <div key={cat}>
              <div className="section-title mb-3">{cat}</div>
              <div className="space-y-2">
                {items.map(faq => (
                  <FaqItem key={faq.id} faq={faq} expanded={expanded} setExpanded={setExpanded} />
                ))}
              </div>
            </div>
          ))}

          {/* Uncategorized */}
          {uncategorized.length > 0 && (
            <div className="space-y-2">
              {uncategorized.map(faq => (
                <FaqItem key={faq.id} faq={faq} expanded={expanded} setExpanded={setExpanded} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FaqItem({ faq, expanded, setExpanded }: {
  faq: FAQ;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
}) {
  const isOpen = expanded === faq.id;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(isOpen ? null : faq.id)}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
        <div className="w-6 h-6 rounded-lg bg-navy/10 flex items-center justify-center shrink-0 mt-0.5">
          <HelpCircle className="w-3.5 h-3.5 text-navy" />
        </div>
        <div className="flex-1 font-semibold text-navy-dark text-sm leading-snug">{faq.question}</div>
        <div className="shrink-0">
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="mt-3 text-sm text-slate-700 leading-relaxed pl-9 whitespace-pre-wrap">{faq.answer}</div>
        </div>
      )}
    </div>
  );
}
