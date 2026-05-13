"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Đang tải…</div>}>
      <RegisterPageInner />
    </Suspense>
  );
}

function RegisterPageInner() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", studentId: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (form.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        studentId: form.studentId || undefined,
        phone: form.phone || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Đăng ký thất bại. Vui lòng thử lại.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-[400px] card p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-navy-dark">Đăng ký thành công!</h2>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              Tài khoản của bạn đã được tạo và đang chờ Admin phê duyệt.<br/>
              Bạn sẽ nhận email thông báo khi được duyệt.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-xs text-amber-700 leading-relaxed">
            Trong thời gian chờ, bạn có thể <strong>đăng nhập</strong> để đọc tin tức và thông báo của lớp ULAW VB2.
          </div>
          <Link href="/login" className="btn-primary w-full py-3 block text-center">
            Đăng nhập ngay →
          </Link>
          <Link href="/" className="text-xs text-slate-400 hover:text-navy transition-colors">
            ← Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white"
        style={{ background: "linear-gradient(160deg, #060f1e 0%, #0d1e3a 50%, #1F3A68 100%)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-sm border border-white/20">UL</div>
          <div>
            <div className="font-bold text-sm">ULAW VB2-TX</div>
            <div className="text-white/50 text-[11px]">Learning Management System</div>
          </div>
        </div>
        <div>
          <div className="w-12 h-1 bg-ulaw mb-6" />
          <h1 className="text-4xl font-extrabold mb-4 leading-tight" style={{ fontFamily: '"Source Serif Pro", serif' }}>
            Tham gia cộng đồng<br/>học tập pháp luật<br/>ULAW VB2.
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-md">
            Đăng ký tài khoản để tham gia lớp Văn bằng 2 Luật từ xa — tiếp cận tài liệu, lịch học, và cộng đồng sinh viên ULAW.
          </p>
        </div>
        <div className="text-white/30 text-xs">© 2026 ULAW VB2-TX · Trường ĐH Luật TP.HCM</div>
      </div>

      {/* Right panel — register form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-[400px] py-8">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-white font-bold text-sm">UL</div>
            <div>
              <div className="font-bold text-navy text-sm">ULAW VB2-TX</div>
              <div className="text-slate-400 text-[11px]">Learning Management System</div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-navy-dark">Tạo tài khoản</h2>
            <p className="text-slate-500 text-sm mt-1">Đăng ký để tham gia cổng học tập ULAW VB2</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="input-group">
              <label className="label">Họ và tên <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={e => set("name", e.target.value)}
                className="input"
                placeholder="Nguyễn Văn A"
                required
                minLength={2}
                autoComplete="name"
              />
            </div>

            <div className="input-group">
              <label className="label">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                className="input"
                placeholder="email@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="input-group">
                <label className="label">MSSV</label>
                <input
                  type="text"
                  value={form.studentId}
                  onChange={e => set("studentId", e.target.value)}
                  className="input"
                  placeholder="Tuỳ chọn"
                  autoComplete="off"
                />
              </div>
              <div className="input-group">
                <label className="label">Số điện thoại</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  className="input"
                  placeholder="Tuỳ chọn"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="label">Mật khẩu <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={form.password}
                onChange={e => set("password", e.target.value)}
                className="input"
                placeholder="Ít nhất 8 ký tự"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="input-group">
              <label className="label">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => set("confirmPassword", e.target.value)}
                className="input"
                placeholder="Nhập lại mật khẩu"
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                "Đăng ký →"
              )}
            </button>
          </form>

          {/* Google option */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">hoặc</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/pending" })}
            className="btn-outline w-full gap-3 py-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Đăng ký bằng Google / Gmail
          </button>

          <div className="mt-6 text-center text-sm text-slate-500">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-navy font-semibold hover:underline">
              Đăng nhập
            </Link>
          </div>

          <div className="mt-3 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-navy transition-colors">
              ← Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
