"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash2 } from "lucide-react";

interface FaqItem { id: string; category: string; question: string; answer: string; order: number; }
interface FaqGroup { category: string; items: FaqItem[]; }

export default function AdminFaqPage() {
  const [groups, setGroups] = useState<FaqGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: "", question: "", answer: "", order: 0 });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/faq");
    const j = await res.json();
    if (j.ok) setGroups(j.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ category: "", question: "", answer: "", order: 0 });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa câu hỏi này?")) return;
    await fetch("/api/faq", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  const allItems = groups.flatMap(g => g.items);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark">Quản lý FAQ</h1>
          <p className="text-slate-500 text-sm">{allItems.length} câu hỏi</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="w-4 h-4" /> Thêm câu hỏi
        </Button>
      </div>

      {loading ? (
        <div className="skeleton h-40 w-full" />
      ) : groups.map(g => (
        <div key={g.category} className="card overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <h3 className="font-semibold text-navy-dark text-sm">{g.category}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {g.items.map(item => (
              <div key={item.id} className="px-5 py-3.5 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-800">{item.question}</div>
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.answer}</div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Thêm câu hỏi FAQ" size="lg">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input label="Nhóm / Danh mục" value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            placeholder="Website & Kỹ thuật" required />
          <Input label="Câu hỏi" value={form.question}
            onChange={e => setForm(f => ({ ...f, question: e.target.value }))} required />
          <div>
            <label className="label">Câu trả lời</label>
            <textarea
              className="input min-h-[100px] resize-y"
              value={form.answer}
              onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
              required
            />
          </div>
          <Input label="Thứ tự (số nhỏ hiện trước)" type="number" value={form.order.toString()}
            onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button type="submit" loading={saving}>Lưu câu hỏi</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
