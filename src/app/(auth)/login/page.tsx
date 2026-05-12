"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Scale, IdCard, KeyRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username: username.trim(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("MSSV hoặc mật khẩu không đúng. Vui lòng thử lại.");
      return;
    }
    router.push(callbackUrl);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-navy-dark via-navy to-navy-light">
      {/* Top utility strip — mirrors the public homepage */}
      <div className="bg-navy-dark/80 backdrop-blur border-b border-white/5 text-white/70 text-xs">
        <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-between">
          <span>Trường Đại học Luật TP. Hồ Chí Minh · Lớp VB2 Luật Khóa 1</span>
          <a
            href="/"
            className="hidden sm:inline hover:text-white transition-colors"
          >
            ← Trang chủ
          </a>
        </div>
      </div>

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-ulaw-red">
            <div className="flex flex-col items-center mb-7">
              <div className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center mb-3 shadow-md">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <h1 className="font-serif text-2xl font-bold text-navy text-center leading-tight">
                Cổng thông tin lớp
              </h1>
              <p className="text-sm text-slate-500 mt-1.5 text-center">
                Văn bằng 2 Luật từ xa — ULAW HCM
              </p>
            </div>

            {error && (
              <div className="notice-danger mb-4 text-sm" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                id="username"
                label="MSSV (mã số sinh viên)"
                type="text"
                inputMode="numeric"
                autoComplete="username"
                placeholder="VD: 2543801010228"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                icon={<IdCard className="w-4 h-4" />}
              />
              <Input
                id="password"
                label="Mật khẩu"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                icon={<KeyRound className="w-4 h-4" />}
              />

              <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                Đăng nhập
              </Button>
            </form>

            <div className="mt-6 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
              <p className="font-semibold text-slate-700 mb-1">Tài khoản mặc định</p>
              <ul className="space-y-0.5">
                <li>• Tên đăng nhập = MSSV (13 chữ số)</li>
                <li>• Mật khẩu lần đầu = tên gọi viết thường, không dấu</li>
              </ul>
              <p className="mt-2">
                Quên mật khẩu? Liên hệ Ban cán sự lớp.
              </p>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-white/70 text-xs font-semibold tracking-wide">
              TRƯỜNG ĐẠI HỌC LUẬT TP. HỒ CHÍ MINH
            </p>
            <p className="text-white/40 text-[11px] mt-0.5">
              Lớp VB2 Luật từ xa · Học kỳ I 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
