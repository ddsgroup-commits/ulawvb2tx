"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Edit, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

const TAGS = ["LICH_HOC", "DEADLINE", "THAY_DOI", "THI_CU", "CHUNG_CHI", "KHAC"] as const;
const TAG_LABELS: Record<string, string> = {
  LICH_HOC: "Lịch học", DEADLINE: "Deadline", THAY_DOI: "Thay đổi",
  THI_CU: "Thi cử", CHUNG_CHI: "Chứng chỉ", KHAC: "Khác",
};

interface Props {
  courses: { id: string; code: string; name: string }[];
  announcements: any[];
  mode: "create" | "edit";
  targetId?: string;
}

interface FormState {
  title: string;
  content: string;
  tag: string;
  courseId: string;
  pinned: boolean;
  urgent: boolean;
}

const empty: FormState = {
  title: "", content: "", tag: "KHAC", courseId: "", pinned: false, urgent: false,
};

export function AnnouncementsAdminClient({ courses, announcements, mode, targetId }: Props) {
  const router = useRouter();
  const initial = mode === "edit" && announcements[0]
    ? {
        title: announcements[0].title,
        content: announcements[0].content,
        tag: announcements[0].tag,
        courseId: announcements[0].courseId ?? "",
        pinned: announcements[0].pinned,
        urgent: announcements[0].urgent,
      }
    : empty;

  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(initial);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setState((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const url = mode === "edit" ? `/api/announcements/${targetId}` : "/api/announcements";
    const method = mode === "edit" ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...state, courseId: state.courseId || undefined }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(mode === "edit" ? "Đã cập nhật" : "Đã đăng thông báo");
      setOpen(false);
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "Có lỗi");
    }
  };

  const remove = async () => {
    if (!confirm("Xoá thông báo này?")) return;
    setBusy(true);
    const res = await fetch(`/api/announcements/${targetId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      toast.success("Đã xoá");
      setOpen(false);
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button><Plus className="h-4 w-4" /> Tạo thông báo</Button>
        ) : (
          <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Sửa thông báo" : "Tạo thông báo mới"}</DialogTitle>
          <DialogDescription>
            Thông báo có gắn nhãn "Khẩn" sẽ được hiển thị nổi bật và gửi push đến tất cả thành viên.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input id="title" required minLength={3} maxLength={200} value={state.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="content">Nội dung *</Label>
            <Textarea id="content" required rows={6} minLength={10} value={state.content} onChange={(e) => set("content", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tag">Nhãn</Label>
              <Select value={state.tag} onValueChange={(v) => set("tag", v)}>
                <SelectTrigger id="tag"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TAGS.map((t) => <SelectItem key={t} value={t}>{TAG_LABELS[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course">Môn học (tuỳ chọn)</Label>
              <Select value={state.courseId} onValueChange={(v) => set("courseId", v)}>
                <SelectTrigger id="course"><SelectValue placeholder="Toàn lớp" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toàn lớp (chung)</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.code} · {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={state.pinned} onCheckedChange={(v) => set("pinned", v)} />
              <span className="text-sm">Ghim đầu trang</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={state.urgent} onCheckedChange={(v) => set("urgent", v)} />
              <span className="text-sm">Đánh dấu khẩn</span>
            </label>
          </div>

          <DialogFooter>
            {mode === "edit" && (
              <Button type="button" variant="destructive" onClick={remove} disabled={busy} className="mr-auto">
                <Trash2 className="h-4 w-4" /> Xoá
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
            <Button type="submit" disabled={busy}>
              <Send className="h-4 w-4" />
              {busy ? "Đang lưu…" : mode === "edit" ? "Cập nhật" : "Đăng & gửi thông báo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
