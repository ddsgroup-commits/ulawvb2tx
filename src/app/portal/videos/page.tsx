"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Bookmark, Play, Filter } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  type: "YOUTUBE" | "GOOGLE_DRIVE" | "EXTERNAL";
  thumbnailUrl: string | null;
  duration: string | null;
  lecturerName: string | null;
  classDate: string | null;
  tags: string[];
  viewCount: number;
  course: { name: string; slug: string; icon: string | null } | null;
  createdAt: string;
}

const TYPE_LABELS = { YOUTUBE: "YouTube", GOOGLE_DRIVE: "Google Drive", EXTERNAL: "Link ngoài" };

function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com.*v=)([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [courses, setCourses] = useState<{id: string; name: string; icon: string | null}[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: "50" });
    if (q) params.set("q", q);
    if (courseFilter) params.set("courseSlug", courseFilter);
    const res = await fetch(`/api/videos?${params}`);
    const json = await res.json();
    if (json.ok) setVideos(json.data.items ?? []);
    setLoading(false);
  }, [q, courseFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    fetch("/api/courses?status=ACTIVE&pageSize=10")
      .then(r => r.json())
      .then(j => j.ok && setCourses(j.data.items ?? []));
    // Load bookmarks
    fetch("/api/videos/bookmarks")
      .then(r => r.json())
      .then(j => j.ok && setBookmarked(new Set(j.data)));
  }, []);

  async function toggleBookmark(videoId: string, e: React.MouseEvent) {
    e.preventDefault();
    const isBookmarked = bookmarked.has(videoId);
    const method = isBookmarked ? "DELETE" : "POST";
    await fetch(`/api/videos/${videoId}/bookmark`, { method });
    setBookmarked(prev => {
      const next = new Set(prev);
      isBookmarked ? next.delete(videoId) : next.add(videoId);
      return next;
    });
  }

  function getThumbnail(video: Video): string | null {
    if (video.thumbnailUrl) return video.thumbnailUrl;
    if (video.type === "YOUTUBE") return getYoutubeThumbnail(video.url);
    return null;
  }

  const bookmarkedVideos = videos.filter(v => bookmarked.has(v.id));
  const otherVideos = videos.filter(v => !bookmarked.has(v.id));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="page-hero">
        <h1 className="text-2xl font-extrabold text-white mb-1">🎬 Thư viện Video</h1>
        <p className="text-white/70 text-sm">Bài giảng video theo môn · Tìm kiếm · Đánh dấu · Ghi chú riêng</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm video..."
            className="input pl-9"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="input pl-9 pr-8 appearance-none min-w-[160px]"
          >
            <option value="">Tất cả môn học</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton aspect-video" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">

          {/* Bookmarked */}
          {bookmarkedVideos.length > 0 && (
            <div>
              <div className="section-title mb-3">🔖 Đã đánh dấu</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarkedVideos.map(v => (
                  <VideoCard key={v.id} video={v} thumbnail={getThumbnail(v)}
                    bookmarked={true} onBookmark={e => toggleBookmark(v.id, e)} />
                ))}
              </div>
            </div>
          )}

          {/* All Videos */}
          <div>
            {bookmarkedVideos.length > 0 && <div className="section-title mb-3">📹 Tất cả video</div>}
            {otherVideos.length === 0 && bookmarkedVideos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎬</div>
                <p className="empty-state-text">Chưa có video nào</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherVideos.map(v => (
                  <VideoCard key={v.id} video={v} thumbnail={getThumbnail(v)}
                    bookmarked={false} onBookmark={e => toggleBookmark(v.id, e)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VideoCard({
  video, thumbnail, bookmarked, onBookmark
}: {
  video: Video;
  thumbnail: string | null;
  bookmarked: boolean;
  onBookmark: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="video-card group">
      {/* Thumbnail */}
      <div className="video-thumbnail">
        {thumbnail ? (
          <img src={thumbnail} alt={video.title} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-navy/10">
            <span className="text-3xl">🎬</span>
          </div>
        )}
        <div className="video-play-overlay">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-navy fill-navy" />
          </div>
        </div>
        {video.duration && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {video.duration}
          </span>
        )}
        <span className={`absolute top-2 left-2 badge text-[10px] ${
          video.type === "YOUTUBE" ? "bg-red-600 text-white" : "bg-blue-600 text-white"
        }`}>
          {video.type === "YOUTUBE" ? "▶ YT" : video.type === "GOOGLE_DRIVE" ? "Drive" : "Link"}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {video.course && (
              <div className="text-[10px] text-navy font-semibold uppercase tracking-wide mb-0.5">
                {video.course.icon} {video.course.name}
              </div>
            )}
            <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">
              {video.title}
            </h3>
          </div>
          <button onClick={onBookmark}
            title={bookmarked ? "Bỏ đánh dấu" : "Đánh dấu"}
            className={`shrink-0 p-1.5 rounded-lg transition-colors ${
              bookmarked ? "text-navy bg-navy/10" : "text-slate-300 hover:text-navy hover:bg-navy/5"
            }`}>
            <Bookmark className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} />
          </button>
        </div>

        {video.lecturerName && (
          <p className="text-xs text-slate-500 mt-1.5">👨‍🏫 {video.lecturerName}</p>
        )}
        {video.classDate && (
          <p className="text-xs text-slate-400 mt-0.5">
            📅 {new Date(video.classDate).toLocaleDateString("vi-VN")}
          </p>
        )}
        {video.description && (
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
            {video.description}
          </p>
        )}

        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          <a href={video.url} target="_blank" rel="noopener noreferrer"
            className="btn-primary btn-sm flex-1">
            <Play className="w-3.5 h-3.5" /> Xem video
          </a>
          <Link href={`/portal/videos/${video.id}`}
            className="btn-outline btn-sm">
            Ghi chú
          </Link>
        </div>
      </div>
    </div>
  );
}
