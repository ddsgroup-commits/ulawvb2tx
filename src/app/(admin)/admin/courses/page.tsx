"use client";

import { useState, useEffect } from "react";
import { BookOpen, ExternalLink, NotebookIcon } from "lucide-react";

interface Course {
  id: string;
  name: string;
  slug: string;
  code: string;
  credits: number;
  status: string;
  color: string | null;
  icon: string | null;
  lecturer: { name: string | null } | null;
  notebooklmUrl: string | null;
  driveUrl: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Sắp khai giảng", ACTIVE: "Đang học", COMPLETED: "Đã hoàn thành",
};

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: "bg-amber-50 text-amber-700", ACTIVE: "bg-emerald-50 text-emerald-700", COMPLETED: "bg-slate-100 text-slate-600",
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses")
      .then(r => r.json())
      .then(j => { if (j.ok) setCourses(j.data); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Quản lý môn học
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">{courses.length} môn học</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="card p-5"><div className="skeleton h-24 w-full" /></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <div key={course.id} className="card p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: `${course.color ?? "#1F3A68"}20`, color: course.color ?? "#1F3A68" }}>
                  {course.icon ?? "📚"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-navy-dark text-sm leading-snug">{course.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{course.code} · {course.credits} tín chỉ</div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[course.status] ?? ""}`}>
                  {STATUS_LABELS[course.status] ?? course.status}
                </span>
                <span className="text-[11px] text-slate-400">{course.lecturer?.name ?? "—"}</span>
              </div>

              <div className="flex gap-2">
                {course.notebooklmUrl && (
                  <a href={course.notebooklmUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 btn-sm bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-[11px]">
                    🔮 NotebookLM
                  </a>
                )}
                {course.driveUrl && (
                  <a href={course.driveUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 btn-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-[11px]">
                    <ExternalLink className="w-3 h-3" /> Drive
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
