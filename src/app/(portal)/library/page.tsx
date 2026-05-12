"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchInput } from "@/components/ui/Input";
import { cn, formatDateVi } from "@/lib/utils";
import { FileText, BookOpen, ClipboardList, Download, ExternalLink } from "lucide-react";
import type { LibraryCategory } from "@prisma/client";

interface LibItem {
  id: string;
  title: string;
  category: LibraryCategory;
  description?: string | null;
  fileUrl?: string | null;
  driveId?: string | null;
  downloadCount: number;
  course?: { name: string } | null;
  createdAt: string;
}

const CATEGORIES = [
  { value: "" as const, label: "Tất cả", icon: null },
  { value: "LEGAL_DOC" as const, label: "Văn bản pháp luật", icon: <FileText className="w-4 h-4" /> },
  { value: "TEXTBOOK" as const, label: "Giáo trình", icon: <BookOpen className="w-4 h-4" /> },
  { value: "PAST_EXAM" as const, label: "Đề thi mẫu", icon: <ClipboardList className="w-4 h-4" /> },
];

export default function LibraryPage() {
  const [items, setItems] = useState<LibItem[]>([]);
  const [category, setCategory] = useState<LibraryCategory | "">("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    const res = await fetch(`/api/library?${params}`);
    const json = await res.json();
    if (json.ok) setItems(json.data);
    setLoading(false);
  }, [category, q]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function handleDownload(id: string) {
    await fetch(`/api/library/${id}`, { method: "POST" });
  }

  const grouped = CATEGORIES.slice(1).map(c => ({
    ...c,
    items: items.filter(i => i.category === c.value),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-dark">Thư viện tài liệu</h1>
        <p className="text-slate-500 text-sm mt-1">Văn bản pháp luật, giáo trình và đề thi mẫu</p>
      </div>

      <div className="notice-warn text-xs">
        ⚠️ <strong>Bản quyền:</strong> Tài liệu chỉ dùng nội bộ phục vụ học tập. Không sao chép hoặc chia sẻ ra ngoài.
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput
          placeholder="Tìm theo tên tài liệu hoặc môn học..."
          value={q}
          onChange={e => setQ(e.target.value)}
          className="flex-1 min-w-[200px] max-w-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1",
                category === c.value
                  ? "bg-navy text-white border-navy"
                  : "border-slate-200 text-slate-600 hover:border-navy bg-white"
              )}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-12 w-full" />)}
        </div>
      ) : category ? (
        <LibSection
          title={CATEGORIES.find(c => c.value === category)?.label ?? ""}
          items={items}
          onDownload={handleDownload}
        />
      ) : (
        grouped.map(g => g.items.length > 0 && (
          <LibSection
            key={g.value}
            title={g.label}
            icon={g.icon}
            items={g.items}
            onDownload={handleDownload}
          />
        ))
      )}
    </div>
  );
}

function LibSection({
  title, icon, items, onDownload,
}: {
  title: string;
  icon?: React.ReactNode;
  items: LibItem[];
  onDownload: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="font-bold text-navy-dark flex items-center gap-2 mb-3">
        {icon} {title}
        <span className="text-xs font-normal text-slate-400">({items.length})</span>
      </h2>
      <div className="card overflow-hidden">
        <div className="divide-y divide-slate-100">
          {items.map(item => (
            <div key={item.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/60">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 text-sm">{item.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {item.description}
                  {item.course && ` · ${item.course.name}`}
                  {" · "}{formatDateVi(item.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Download className="w-3 h-3" /> {item.downloadCount}
                </span>
                {item.fileUrl ? (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onDownload(item.id)}
                    className="btn btn-primary btn-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Tải về
                  </a>
                ) : item.driveId ? (
                  <a
                    href={`https://drive.google.com/file/d/${item.driveId}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onDownload(item.id)}
                    className="btn btn-outline btn-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Google Drive
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Chưa có file</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
