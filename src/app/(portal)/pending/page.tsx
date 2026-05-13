import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import { Clock, Mail, LogOut } from "lucide-react";
import type { Role } from "@prisma/client";

export default async function PendingApprovalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  // If already approved, send them to the portal
  if (role !== "PENDING_USER") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-navy/5 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card p-8 text-center space-y-6">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-extrabold text-navy-dark">Chờ phê duyệt</h1>
            <p className="text-slate-500 text-sm mt-2">
              Tài khoản của bạn đang chờ Admin phê duyệt để truy cập Cổng thông tin lớp ULAW VB2.
            </p>
          </div>

          {/* Info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
            <div className="text-sm font-semibold text-amber-800 mb-2">Thông tin tài khoản</div>
            <div className="text-xs text-amber-700 space-y-1">
              <div>Email: <strong>{session.user.email}</strong></div>
              <div>Tên:   <strong>{session.user.name ?? "Chưa cập nhật"}</strong></div>
            </div>
          </div>

          {/* Steps */}
          <div className="text-left space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quy trình</div>
            {[
              { step: "1", text: "Bạn đã đăng ký tài khoản thành công" },
              { step: "2", text: "Admin đang xem xét và xác minh thông tin của bạn", active: true },
              { step: "3", text: "Sau khi phê duyệt, bạn có thể truy cập toàn bộ nội dung" },
            ].map(({ step, text, active }) => (
              <div key={step} className={`flex items-start gap-3 ${active ? "text-amber-700" : "text-slate-500"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5
                  ${active ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"}`}>
                  {step}
                </div>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>

          {/* Contact info */}
          <div className="bg-navy/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-navy font-medium mb-1">
              <Mail className="w-4 h-4" />
              Cần hỗ trợ?
            </div>
            <p className="text-xs text-slate-500">
              Liên hệ lớp trưởng hoặc ban quản lý lớp ULAW VB2 để được hỗ trợ duyệt tài khoản nhanh hơn.
            </p>
          </div>

          {/* Sign out */}
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}>
            <button type="submit" className="flex items-center gap-2 mx-auto text-sm text-slate-400 hover:text-slate-600 transition-colors">
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
