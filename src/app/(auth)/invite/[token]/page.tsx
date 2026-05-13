"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:  "Quản trị cao nhất",
  ADMIN:        "Quản trị viên",
  MODERATOR:    "Kiểm duyệt viên",
  CREATOR:      "Người tạo nội dung",
  STUDENT:      "Sinh viên",
  PENDING_USER: "Chờ phê duyệt",
};

interface InviteInfo {
  email:       string;
  role:        string;
  inviterName: string | null;
  note:        string | null;
  expiresAt:   string;
}

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router    = useRouter();

  const [status, setStatus]   = useState<"loading" | "valid" | "invalid" | "success">("loading");
  const [errMsg, setErrMsg]   = useState("");
  const [invite, setInvite]   = useState<InviteInfo | null>(null);

  const [form, setForm]       = useState({ name: "", password: "", confirm: "", studentId: "" });
  const [saving, setSaving]   = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  useEffect(() => {
    async function validate() {
      const res = await fetch(`/api/invite/${token}`);
      const j   = await res.json();
      if (j.ok) {
        setInvite(j.data);
        setStatus("valid");
      } else {
        setErrMsg(j.error ?? "Link không hợp lệ");
        setStatus("invalid");
      }
    }
    validate();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    if (form.password !== form.confirm) {
      setFormErr("Mật khẩu xác nhận không khớp");
      return;
    }
    if (form.password.length < 8) {
      setFormErr("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/invite/${token}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        name:      form.name,
        password:  form.password,
        studentId: form.studentId || undefined,
      }),
    });
    const j = await res.json();
    setSaving(false);

    if (!j.ok) {
      setFormErr(typeof j.error === "string" ? j.error : "Có lỗi xảy ra");
      return;
    }

    setStatus("success");
    // Auto sign-in after 2s
    setTimeout(async () => {
      await signIn("credentials", {
        email:    invite!.email,
        password: form.password,
        redirect: false,
      });
      router.push("/dashboard");
    }, 2000);
  }

  // ── Loading ──
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-dark to-navy flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  // ── Invalid ──
  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-dark to-navy flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-navy-dark mb-2">Link không hợp lệ</h1>
          <p className="text-slate-500 text-sm">{errMsg}</p>
          <Button className="mt-6 w-full" onClick={() => router.push("/login")}>
            Về trang đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  // ── Success ──
  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-dark to-navy flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-navy-dark mb-2">Tài khoản đã kích hoạt!</h1>
          <p className="text-slate-500 text-sm">Đang chuyển hướng về cổng thông tin...</p>
          <Loader2 className="w-5 h-5 text-navy animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark to-navy flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-navy px-8 py-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-gold" />
            <span className="text-[11px] text-gold font-bold tracking-widest uppercase">ULAW VB2 Portal</span>
          </div>
          <h1 className="text-xl font-extrabold text-white">Kích hoạt tài khoản</h1>
          <p className="text-white/60 text-sm mt-1">
            {invite?.inviterName && `${invite.inviterName} đã mời bạn tham gia`}
          </p>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* Invite info badge */}
          <div className="bg-navy/5 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500">Email</div>
              <div className="font-semibold text-sm text-navy-dark truncate">{invite?.email}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Quyền hạn</div>
              <div className="font-semibold text-sm text-navy-dark">
                {ROLE_LABELS[invite?.role ?? ""] ?? invite?.role}
              </div>
            </div>
          </div>

          {invite?.note && (
            <div className="border-l-2 border-gold px-3 py-2 bg-gold/5 rounded-r-lg">
              <p className="text-xs text-slate-600 italic">"{invite.note}"</p>
            </div>
          )}

          {formErr && (
            <div className="notice notice-danger text-sm">{formErr}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Họ và tên"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nguyễn Văn A"
              required
            />
            <Input
              label="Mã số sinh viên (tuỳ chọn)"
              value={form.studentId}
              onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
              placeholder="MSSV..."
            />
            <Input
              label="Mật khẩu"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Tối thiểu 8 ký tự"
              required
            />
            <Input
              label="Xác nhận mật khẩu"
              type="password"
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="Nhập lại mật khẩu"
              required
            />
            <Button type="submit" loading={saving} className="w-full">
              Kích hoạt tài khoản
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Link hết hạn vào{" "}
            {invite?.expiresAt
              ? new Date(invite.expiresAt).toLocaleDateString("vi-VN", {
                  day: "numeric", month: "long", year: "numeric",
                })
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
