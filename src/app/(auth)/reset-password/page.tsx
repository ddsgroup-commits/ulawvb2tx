"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Đang tải…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-navy-dark mb-2">Liên kết không hợp lệ</h2>
          <p className="text-slate-500 text-sm mb-6">
            Liên kết đặt lại mật khẩu này không hợp lệ hoặc đã hết hạn.
          </p>
          <Link href="/forgot-password" className="btn-primary inline-block px-6 py-2.5 text-sm">
            Yêu cầu liên kết mới
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Có lỗi xảy ra. Vui lòng thử lại.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 3000);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white"
        style={{ background: "linear-gradient(160deg, #060f1e 0%, #0d1e3a 50%, #1F3A68 100%)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-sm border border-white/20">
            UL
          </div>
          <div>
            <div className="font-bold text-sm">ULAW VB2-TX</div>
            <div className="text-white/50 text-[11px]">Learning Management System</div>
          </div>
        </div>

        <div>
          <div className="w-12 h-1 bg-ulaw mb-6" />
          <h1
            className="text-4xl font-extrabold mb-4 leading-tight"
            style={{ fontFamily: '"Source Serif Pro", serif' }}
          >
            Tạo mật khẩu<br />mới cho<br />tài khoản.
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-md">
            Chọn mật khẩu mạnh để bảo vệ tài khoản học tập của bạn.
          </p>
        </div>

        <div className="text-white/30 text-xs">© 2026 ULAW VB2-TX · Trường ĐH Luật TP.HCM</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-white font-bold text-sm">
              UL
            </div>
            <div>
              <div className="font-bold text-navy text-sm">ULAW VB2-TX</div>
              <div className="text-slate-400 text-[11px]">Learning Management System</div>
            </div>
          </div>

          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-2xl">
                ✅
              </div>
              <h2 className="text-2xl font-extrabold text-navy-dark mb-2">Mật khẩu đã được đặt lại!</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Mật khẩu của bạn đã được cập nhật thành công. Đang chuyển hướng đến trang đăng nhập…
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-navy-dark">Đặt lại mật khẩu</h2>
                <p className="text-slate-500 text-sm mt-1">Nhập mật khẩu mới cho tài khoản của bạn.</p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="input-group">
                  <label className="label">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    autoComplete="new-password"
                    autoFocus
                  />
                </div>

                <div className="input-group">
                  <label className="label">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
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
                      Đang lưu...
                    </span>
                  ) : (
                    "Đặt lại mật khẩu →"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-xs text-slate-400 hover:text-navy transition-colors">
                  ← Quay lại đăng nhập
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
