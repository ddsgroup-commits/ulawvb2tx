"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDateVi } from "@/lib/utils";
import { Search, Film, Pin, Youtube, HardDrive, Filter, X } from "lucide-react";

interface VideoCard {
  id: string;
  title: string;
  description?: string | null;
  subject?: string | null;
  lecturer?: string | null;
  classDate?: string | null;
  thumbnailUrl?: string | null;
  source: "YOUTUBE" | "DRIVE" | "OTHER";
  tags: string[];
  pinned: boolean;
  viewCount: number;
  course?: { id: string; name: string; slug: string } | null;
  createdAt: string;
}

export default function VideoLibraryPage() {
  const [videos, setVideos] = useState<VideoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [sort, setSort] = useState<"recent" | "popular">("recent");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/videos?take=200");
      const json = await res.json();
      if (json.ok) setVideos(json.data);
      setLoading(false);
    })();
  }, []);

  // Distinct subjects + tags for filter chips.
  const { subjects, tags } = useMemo(() => {
    const subjectSet = new Set<string>();
    const tagSet = new Set<string>();
    for (const v of videos) {
      if (v.course?.name) subjectSet.add(v.course.name);
      else if (v.subject) subjectSet.add(v.subject);
      v.tags.forEach((t) => tagSet.add(t));
    }
    return {
      subjects: Array.from(subjectSet).sort((a, b) => a.localeCompare(b, "vi")),
      tags: Array.from(tagSet).sort((a, b) => a.localeCompare(b, "vi")),
    };
  }, [videos]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = videos.filter((v) => {
      const subj = v.course?.name ?? v.subject ?? "";
      if (subjectFilter && subj !== subjectFilter) return false;
      if (tagFilter && !v.tags.includes(tagFilter)) return false;
      if (!q) return true;
      return (
        v.title.toLowerCase().includes(q) ||
        (v.lecturer ?? "").toLowerCase().includes(q) ||
        (v.description ?? "").toLowerCase().includes(q) ||
        subj.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q))
      );
    });

    if (sort === "popular") {
      return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.viewCount - a.viewCount);
    }
    // recent (already comes ordered by classDate desc from API)
    return list;
  }, [videos, query, subjectFilter, tagFilter, sort]);

  const activeFilters = (subjectFilter ? 1 : 0) + (tagFilter ? 1 : 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-navy-dark font-serif">Video bài giảng</h1>
        <p className="text-sm text-slate-500 mt-1">
          {videos.length} video · YouTube và Google Drive · Lưu lại để xem lại bất cứ lúc nào
        </p>
      </header>

      {/* Search + sort */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Tìm theo tiêu đề, môn học, giảng viên, tag…"
            className="input pl-9 w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "recent" | "popular")}
          className="input appearance-none w-40"
        >
          <option value="recent">Mới nhất</option>
          <option value="popular">Xem nhiều</option>
        </select>
      </div>

      {/* Active filter pills */}
      {activeFilters > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 inline-flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Đang lọc:
          </span>
          {subjectFilter && (
            <button
              onClick={() => setSubjectFilter("")}
              className="badge bg-navy/10 text-navy text-xs hover:bg-navy/20"
            >
              {subjectFilter} <X className="w-3 h-3" />
            </button>
          )}
          {tagFilter && (
            <button
              onClick={() => setTagFilter("")}
              className="badge bg-amber-100 text-amber-800 text-xs hover:bg-amber-200"
            >
              #{tagFilter} <X className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => {
              setSubjectFilter("");
              setTagFilter("");
            }}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Subject chips */}
      {subjects.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setSubjectFilter(subjectFilter === s ? "" : s)}
              className={
                subjectFilter === s
                  ? "px-3 py-1.5 rounded-full text-xs font-semibold bg-navy text-white"
                  : "px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card">
              <div className="aspect-video bg-slate-200 skeleton rounded-t-2xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 skeleton w-3/4" />
                <div className="h-3 skeleton w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Film className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Không tìm thấy video</p>
          <p className="text-slate-400 text-sm mt-1">Thử bỏ bộ lọc hoặc đổi từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((v) => (
            <Link
              key={v.id}
              href={`/videos/${v.id}`}
              className="card card-hover overflow-hidden group flex flex-col"
            >
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                {v.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Film className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {v.pinned && (
                    <span className="badge bg-white/95 text-navy text-[10px]">
                      <Pin className="w-3 h-3" /> Ghim
                    </span>
                  )}
                  {v.source === "YOUTUBE" ? (
                    <span className="badge bg-red-600 text-white text-[10px]">
                      <Youtube className="w-3 h-3" />
                    </span>
                  ) : v.source === "DRIVE" ? (
                    <span className="badge bg-emerald-600 text-white text-[10px]">
                      <HardDrive className="w-3 h-3" />
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-navy transition-colors">
                  {v.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">
                  {(v.course?.name ?? v.subject) ?? "—"}
                  {v.lecturer ? ` · ${v.lecturer}` : ""}
                </p>
                <div className="flex items-center justify-between mt-auto pt-3 text-[11px] text-slate-400">
                  <span>
                    {v.classDate ? formatDateVi(v.classDate) : formatDateVi(v.createdAt)}
                  </span>
                  <span>{v.viewCount} lượt xem</span>
                </div>
                {v.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {v.tags.slice(0, 3).map((t) => (
                      <button
                        key={t}
                        onClick={(e) => {
                          e.preventDefault();
                          setTagFilter(t);
                        }}
                        className="badge bg-slate-100 text-slate-600 text-[10px] hover:bg-slate-200"
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Tag cloud (collapsed at bottom) */}
      {tags.length > 0 && (
        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700 select-none">
            Tất cả tag ({tags.length})
          </summary>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter(tagFilter === t ? "" : t)}
                className={
                  tagFilter === t
                    ? "px-2.5 py-1 rounded-full text-xs bg-amber-500 text-white"
                    : "px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-600 hover:bg-slate-200"
                }
              >
                #{t}
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
