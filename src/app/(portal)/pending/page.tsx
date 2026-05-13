import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Clock, Mail, LogOut, Pin, AlertTriangle } from "lucide-react";
import type { Role, AnnouncementTag } from "@prisma/client";

const TAG_LABELS: Record<AnnouncementTag, string> = {
  LICH_HOC: "Lịch học",
  DEADLINE: "Deadline",
  THAY_DOI: "Thay đổi",
  THI_CU: "Thi cử",
  CHUNG_CHI: "Chứng chỉ",
  KHAC: "Thông báo",
};

const TAG_COLORS: Record<AnnouncementTag, string> = {
  LICH_HOC: "bg-blue-100 text-blue-700",
  DEADLINE: "bg-red-100 text-red-700",
  THAY_DOI: "bg-orange-100 text-orange-700",
  THI_CU: "bg-purple-100 text-purple-700",
  CHUNG_CHI: "bg-green-100 text-green-700",
  KHAC: "bg-slate-100 text-slate-600",
};

export default async function PendingApprovalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;
  if (role !== "PENDING_USER") redirect("/dashboard");

  // Fetch school-wide published announcements
  const news = await prisma.announcement.findMany({
    where: {
      courseId: null,
      published: true,
      status: "PUBLISHED",
      AND: [
        { OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      ],
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 10,
    select: {
      id: true,
      title: true,
      content: true,
      tag: true,
      pinned: true,
      urgent: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-navy/5 p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">

        {/* Approval status card */}
        <div className="card p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-navy-dark">Chờ phê duyệt</h1>
            <p className="text-slate-500 text-sm mt-2">
              Tài khoản của bạn đang chờ Admin phê duyệt để truy cập Cổng thông tin lớp ULAW VB2.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
            <div className="text-sm font-semibold text-amber-800 mb-2">Thông tin tài khoản</div>
            <div className="text-xs text-amber-700 space-y-1">
              <div>Email: <strong>{session.user.email}</strong></div>
              <div>Tên: <strong>{session.user.name ?? "Chưa cập nhật"}</strong></div>
            </div>
          </div>

          <div className="text-left space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quy trình</div>
            {[
              { step: "1", text: "Bạn đã đăng ký tài khoản thành công" },
              { step: "2", text: "Admin đang xem xét và xác minh thông tin của bạn", active: true },
              { step: "3", text: "Sau khi phê duyệt, bạn có thể truy cập toàn bộ tài liệu học tập" },
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

          <div className="bg-navy/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-navy font-medium mb-1">
              <Mail className="w-4 h-4" />
              Cần hỗ trợ?
            </div>
            <p className="text-xs text-slate-500">
              Liên hệ lớp trưởng hoặc ban quản lý lớp ULAW VB2 để được hỗ trợ duyệt tài khoản nhanh hơn.
            </p>
          </div>

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

        {/* News feed */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-ulaw rounded-full" />
            <h2 className="text-base font-bold text-navy-dark">Tin tức & Thông báo ULAW VB2</h2>
          </div>

          {news.length === 0 ? (
            <div className="card p-6 text-center text-slate-400 text-sm">
              Chưa có thông báo nào.
            </div>
          ) : (
            <div className="space-y-3">
              {news.map(item => (
                <div
                  key={item.id}
                  className={`card p-5 space-y-2 ${item.urgent ? "border-l-4 border-l-red-400" : item.pinned ? "border-l-4 border-l-navy/40" : ""}`}
                >
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TAG_COLORS[item.tag]}`}>
                      {TAG_LABELS[item.tag]}
                    </span>
                    {item.pinned && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-navy/10 text-navy flex items-center gap-1">
                        <Pin className="w-3 h-3" />Ghim
                      </span>
                    )}
                    {item.urgent && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />Khẩn
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-navy-dark text-sm leading-snug">{item.title}</h3>

                  <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">{item.content}</p>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{item.author.name}</span>
                    <span>·</span>
                    <span>{new Date(item.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
