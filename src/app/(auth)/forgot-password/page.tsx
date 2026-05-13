"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Có lỗi xảy ra. Vui lòng thử lại.");
      return;
    }

    setSent(true);
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
            Khôi phục<br />quyền truy cập<br />tài khoản.
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-md">
            Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu trong vòng vài phút.
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

          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-2xl">
                ✉️
              </div>
              <h2 className="text-2xl font-extrabold text-navy-dark mb-2">Kiểm tra email</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Nếu địa chỉ <span className="font-semibold text-navy">{email}</span> có trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu. Liên kết có hiệu lực trong 1 giờ.
              </p>
              <p className="text-xs text-slate-400 mb-6">
                Không thấy email? Kiểm tra thư mục Spam hoặc thử lại sau vài phút.
              </p>
              <Link href="/login" className="btn-primary inline-block px-6 py-2.5 text-sm">
                ← Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-navy-dark">Quên mật khẩu?</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
                </p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="input-group">
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="email@example.com"
                    required
                    autoComplete="email"
                    autoFocus
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
                      Đang gửi...
                    </span>
                  ) : (
                    "Gửi liên kết đặt lại mật khẩu →"
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
