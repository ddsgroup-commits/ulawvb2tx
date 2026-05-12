"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { Edit2, Save } from "lucide-react";
import type { CourseStatus } from "@prisma/client";

const STATUS_OPTIONS = [
  { value: "UPCOMING", label: "Sắp học" },
  { value: "ACTIVE", label: "Đang học" },
  { value: "COMPLETED", label: "Đã hoàn thành" },
];

const STATUS_COLORS: Record<CourseStatus, string> = {
  UPCOMING: "bg-slate-100 text-slate-600",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

interface Course {
  id: string;
  slug: string;
  code: string;
  name: string;
  credits: number;
  icon: string | null;
  description: string | null;
  lecturer: { name: string | null } | null;
  notebooklmUrl: string | null;
  driveUrl: string | null;
  status: CourseStatus;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/courses");
    const j = await res.json();
    if (j.ok) setCourses(j.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    await fetch("/api/courses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        name: editing.name,
        description: editing.description,
        notebooklmUrl: editing.notebooklmUrl,
        driveUrl: editing.driveUrl,
        status: editing.status,
        icon: editing.icon,
        credits: editing.credits,
      }),
    });
    setSaving(false);
    setEditing(null);
    load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-navy-dark">Quản lý Môn học</h1>
        <p className="text-slate-500 text-sm">{courses.length} môn học</p>
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Môn học</th>
                <th>Tín chỉ</th>
                <th>Trạng thái</th>
                <th>NotebookLM</th>
                <th>Drive</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-6 text-slate-400">Đang tải...</td></tr>
              ) : courses.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.icon ?? "📚"}</span>
                      <div>
                        <div className="font-semibold text-sm text-slate-800">{c.name}</div>
                        <div className="text-xs text-slate-400">{c.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-slate-600">{c.credits} TC</td>
                  <td>
                    <span className={cn("badge text-xs", STATUS_COLORS[c.status])}>
                      {STATUS_OPTIONS.find(s => s.value === c.status)?.label}
                    </span>
                  </td>
                  <td className="text-xs">
                    {c.notebooklmUrl ? (
                      <a href={c.notebooklmUrl} target="_blank" rel="noopener noreferrer"
                        className="text-navy hover:underline">Đã có link</a>
                    ) : <span className="text-slate-400">Chưa có</span>}
                  </td>
                  <td className="text-xs">
                    {c.driveUrl ? (
                      <a href={c.driveUrl} target="_blank" rel="noopener noreferrer"
                        className="text-navy hover:underline">Đã có link</a>
                    ) : <span className="text-slate-400">Chưa có</span>}
                  </td>
                  <td>
                    <button
                      onClick={() => setEditing({ ...c })}
                      className="p-1.5 rounded-lg text-navy hover:bg-navy/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Chỉnh sửa: ${editing?.name}`}
        size="lg"
      >
        {editing && (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <Input label="Icon (emoji)" value={editing.icon ?? ""}
                onChange={e => setEditing(ed => ed ? { ...ed, icon: e.target.value } : ed)} />
              <div className="col-span-2">
                <Input label="Tên môn học" value={editing.name}
                  onChange={e => setEditing(ed => ed ? { ...ed, name: e.target.value } : ed)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Số tín chỉ" type="number" min={1} max={10}
                value={editing.credits.toString()}
                onChange={e => setEditing(ed => ed ? { ...ed, credits: Number(e.target.value) } : ed)} />
              <Select label="Trạng thái" value={editing.status} options={STATUS_OPTIONS}
                onChange={e => setEditing(ed => ed ? { ...ed, status: e.target.value as CourseStatus } : ed)} />
            </div>
            <div>
              <label className="label">Mô tả môn học</label>
              <textarea
                className="input min-h-[80px] resize-y"
                value={editing.description ?? ""}
                onChange={e => setEditing(ed => ed ? { ...ed, description: e.target.value } : ed)}
              />
            </div>
            <Input label="NotebookLM URL" type="url" value={editing.notebooklmUrl ?? ""}
              placeholder="https://notebooklm.google.com/..."
              onChange={e => setEditing(ed => ed ? { ...ed, notebooklmUrl: e.target.value } : ed)} />
            <Input label="Google Drive URL" type="url" value={editing.driveUrl ?? ""}
              placeholder="https://drive.google.com/..."
              onChange={e => setEditing(ed => ed ? { ...ed, driveUrl: e.target.value } : ed)} />
            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setEditing(null)}>Hủy</Button>
              <Button type="submit" loading={saving}>
                <Save className="w-4 h-4" /> Lưu thay đổi
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
