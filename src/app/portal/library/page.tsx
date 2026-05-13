"use client";

import { useState, useEffect } from "react";
import { Library, Search, Download, ExternalLink, FileText, FileVideo, FileImage, File } from "lucide-react";

interface LibraryItem {
  id: string;
  title: string;
  description: string | null;
  fileType: string;
  fileUrl: string | null;
  fileSize: number | null;
  tags: string[];
  status: string;
  createdAt: string;
  course: { name: string; slug: string } | null;
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5 text-red-500" />,
  doc: <FileText className="w-5 h-5 text-blue-500" />,
  docx: <FileText className="w-5 h-5 text-blue-500" />,
  ppt: <FileText className="w-5 h-5 text-orange-500" />,
  pptx: <FileText className="w-5 h-5 text-orange-500" />,
  xls: <FileText className="w-5 h-5 text-green-500" />,
  xlsx: <FileText className="w-5 h-5 text-green-500" />,
  video: <FileVideo className="w-5 h-5 text-purple-500" />,
  image: <FileImage className="w-5 h-5 text-pink-500" />,
  link: <ExternalLink className="w-5 h-5 text-navy" />,
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: "50" });
    if (q) params.set("q", q);
    if (tag) params.set("tag", tag);
    fetch(`/api/library?${params}`)
      .then(r => r.json())
      .then(j => { if (j.ok) { setItems(j.data.items); setTotal(j.data.total); } setLoading(false); });
  }, [q, tag]);

  const allTags = [...new Set(items.flatMap(i => i.tags))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
          <Library className="w-5 h-5 text-ulaw" /> Thư viện tài liệu
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">{total} tài liệu</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm tài liệu..."
            className="input pl-9"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setTag("")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                tag === "" ? "bg-navy text-white border-navy" : "bg-white border-slate-200 text-slate-600"
              }`}>Tất cả</button>
            {allTags.map(t => (
              <button key={t} onClick={() => setTag(tag === t ? "" : t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  tag === t ? "bg-navy text-white border-navy" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}>{t}</button>
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="card p-5"><div className="skeleton h-24 w-full" /></div>)}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <p className="empty-state-text">Chưa có tài liệu nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="card p-4 hover:shadow-card-hover transition-shadow group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors">
                  {FILE_ICONS[item.fileType] ?? <File className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-navy-dark text-sm leading-snug">{item.title}</div>
                  {item.course && (
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.course.name}</div>
                  )}
                </div>
              </div>

              {item.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{item.description}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 2).map(t => (
                    <span key={t} className="tag-default">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  {item.fileSize && (
                    <span className="text-[10px] text-slate-400">{formatFileSize(item.fileSize)}</span>
                  )}
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-navy/10 text-navy transition-colors"
                      title={item.fileType === "link" ? "Mở liên kết" : "Tải xuống"}>
                      {item.fileType === "link"
                        ? <ExternalLink className="w-3.5 h-3.5" />
                        : <Download className="w-3.5 h-3.5" />
                      }
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
