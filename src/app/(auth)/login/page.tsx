"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Next.js 15 requires `useSearchParams()` consumers to be wrapped in a
// `<Suspense>` so the surrounding shell can prerender statically while
// the query-string-dependent bits stream in. Without this, `next build`
// fails the prerender check.
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell loading />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginShell({ loading }: { loading?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-slate-400 text-sm">
      {loading ? "Đang tải…" : null}
    </div>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/portal/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
    } else {
      router.push(callbackUrl);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl });
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white"
        style={{background: "linear-gradient(160deg, #060f1e 0%, #0d1e3a 50%, #1F3A68 100%)"}}>
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
          <h1 className="text-4xl font-extrabold mb-4 leading-tight" style={{fontFamily: '"Source Serif Pro", serif'}}>
            Học tập pháp luật<br/>theo chuẩn mực<br/>học thuật.
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-md">
            Hệ thống LMS chuyên nghiệp cho lớp Văn bằng 2 Luật từ xa của
            Trường Đại học Luật TP.HCM — kết hợp công nghệ hiện đại với
            bản sắc học thuật truyền thống.
          </p>
        </div>

        <div className="text-white/30 text-xs">
          © 2026 ULAW VB2-TX · Trường ĐH Luật TP.HCM
        </div>
      </div>

      {/* Right panel — login form */}
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

          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-navy-dark">Đăng nhập</h2>
            <p className="text-slate-500 text-sm mt-1">
              Dùng tài khoản portal hoặc Gmail đã đăng ký
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="btn-outline w-full mb-4 gap-3 py-3"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-slate-300 border-t-navy rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Đăng nhập bằng Google / Gmail
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">hoặc dùng tài khoản portal</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Credentials form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="input-group">
              <label className="label">Email sinh viên</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="MSSV@email.hcmulaw.edu.vn"
                required
                autoComplete="email"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Định dạng: {"{MSSV}"}@email.hcmulaw.edu.vn
              </p>
            </div>

            <div className="input-group">
              <div className="flex items-center justify-between mb-1">
                <label className="label !mb-0">Mật khẩu</label>
                <Link href="/forgot-password" className="text-[11px] text-navy/70 hover:text-navy transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="Mật khẩu mặc định: tên không dấu, thường"
                required
                autoComplete="current-password"
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
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập →"
              )}
            </button>
          </form>

          {/* Info box */}
          <div className="mt-6 p-4 bg-navy/5 rounded-xl border border-navy/10">
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-navy">Lần đầu đăng nhập?</span> Mật khẩu mặc định là tên riêng của bạn không có dấu, viết thường (ví dụ: <span className="font-mono bg-white px-1 py-0.5 rounded text-navy">linh</span>).
              Tài khoản Google phải được admin duyệt trước khi sử dụng.
            </p>
          </div>

          <div className="mt-6 text-center text-sm text-slate-500">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-navy font-semibold hover:underline">
              Đăng ký ngay
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
