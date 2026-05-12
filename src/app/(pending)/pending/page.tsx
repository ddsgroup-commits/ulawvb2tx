import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PendingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user;
  const email = user.email ?? "";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center text-white font-bold">
            UL
          </div>
          <div>
            <div className="font-bold text-navy text-lg">ULAW VB2-TX</div>
            <div className="text-slate-400 text-xs">Learning Management System</div>
          </div>
        </div>

        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">⏳</span>
          </div>

          <h1 className="text-xl font-extrabold text-navy-dark mb-2">
            Tài khoản đang chờ xét duyệt
          </h1>

          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Tài khoản của bạn (<span className="font-semibold text-navy">{email}</span>) đã được tạo
            thành công và đang trong quá trình xét duyệt bởi Ban Quản lý lớp.
          </p>

          <div className="space-y-3 text-sm text-left mb-6">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span className="text-slate-600">Tài khoản đã đăng ký thành công</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-amber-500 mt-0.5">⏳</span>
              <div>
                <div className="font-semibold text-amber-800">Đang chờ xét duyệt</div>
                <div className="text-amber-700 text-xs mt-0.5">
                  Admin sẽ xác minh thông tin của bạn trong vòng 24-48 giờ làm việc
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl opacity-50">
              <span className="text-slate-300 mt-0.5">○</span>
              <span className="text-slate-400">Truy cập đầy đủ hệ thống LMS</span>
            </div>
          </div>

          <div className="p-4 bg-navy/5 rounded-xl border border-navy/10 text-left mb-6">
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-navy">Nếu bạn là sinh viên lớp VB2-TX:</span><br />
              Vui lòng liên hệ Ban cán sự lớp qua nhóm Zalo để được hỗ trợ xác minh nhanh hơn.
            </p>
          </div>

          <a
            href="/api/auth/signout"
            className="btn-outline w-full text-center block">
            Đăng xuất
          </a>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Cần hỗ trợ? Liên hệ{" "}
          <a href="mailto:vb2luat2025@gmail.com" className="text-navy hover:underline">
            vb2luat2025@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
