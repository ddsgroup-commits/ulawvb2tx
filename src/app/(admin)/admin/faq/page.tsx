"use client";

import { useState, useEffect } from "react";
import { HelpCircle, Plus, Edit2, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  order: number;
}

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "Chung",
    order: "0"
  });

  function load() {
    setLoading(true);
    fetch("/api/admin/faq")
      .then(r => r.json())
      .then(j => { if (j.ok) setFaqs(j.data); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingFaq(null);
    setFormData({ question: "", answer: "", category: "Chung", order: String(faqs.length) });
    setShowModal(true);
  }

  function openEdit(f: FAQ) {
    setEditingFaq(f);
    setFormData({
      question: f.question,
      answer: f.answer,
      category: f.category || "Chung",
      order: String(f.order)
    });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!formData.question || !formData.answer) return;
    setSaving(true);
    const method = editingFaq ? "PATCH" : "POST";
    const url = editingFaq ? `/api/admin/faq/${editingFaq.id}` : "/api/admin/faq";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    setSaving(false);
    setShowModal(false);
    load();
  }

  async function deleteFaq(id: string) {
    if (!confirm("Xóa câu hỏi này?")) return;
    await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
            <HelpCircle className="w-5 h-5" /> Quản lý FAQ
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{faqs.length} câu hỏi thường gặp</p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Thêm câu hỏi
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card p-5 skeleton h-20 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {faqs.map(faq => (
            <div key={faq.id} className="card p-5 flex items-start justify-between gap-4 group">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-navy bg-navy/5 px-2 py-0.5 rounded uppercase">{faq.category || "Chung"}</span>
                  <span className="text-[10px] text-slate-400">Thứ tự: {faq.order}</span>
                </div>
                <h3 className="font-bold text-navy-dark">{faq.question}</h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">{faq.answer}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(faq)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteFaq(faq.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {faqs.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">Chưa có câu hỏi nào được tạo.</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-panel max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-navy-dark">{editingFaq ? "Chỉnh sửa FAQ" : "Thêm FAQ mới"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label">Danh mục</label>
                  <input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="input" placeholder="Học vụ, Kỹ thuật..." />
                </div>
                <div className="input-group">
                  <label className="label">Thứ tự hiển thị</label>
                  <input type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: e.target.value })} className="input" />
                </div>
              </div>

              <div className="input-group">
                <label className="label">Câu hỏi *</label>
                <input value={formData.question} onChange={e => setFormData({ ...formData, question: e.target.value })} className="input font-bold" placeholder="Làm sao để đăng nhập?" />
              </div>

              <div className="input-group">
                <label className="label">Câu trả lời *</label>
                <textarea value={formData.answer} onChange={e => setFormData({ ...formData, answer: e.target.value })} className="input min-h-[150px]" placeholder="Câu trả lời chi tiết..." />
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button onClick={() => setShowModal(false)} className="btn-outline flex-1">Hủy</button>
                <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
                  {saving ? "Đang lưu..." : editingFaq ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
