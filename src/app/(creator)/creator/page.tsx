import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  PenSquare, Film, FileText, ClipboardCheck, Clock, XCircle, CheckCircle, Send,
} from "lucide-react";
import { cn, CONTENT_STATUS_LABELS, CONTENT_STATUS_COLORS, formatDateVi } from "@/lib/utils";
import { canAccessCreatorStudio } from "@/lib/rbac";
import type { Role } from "@prisma/client";

export default async function CreatorDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canAccessCreatorStudio(session.user.role as Role)) redirect("/dashboard");

  const userId = session.user.id;

  // Fetch my submissions
  const [announcements, videos, libraryItems] = await Promise.all([
    prisma.announcement.findMany({
      where: { authorId: userId, contentStatus: { in: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] } },
      select: { id: true, title: true, contentStatus: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.video.findMany({
      where: { uploaderId: userId, contentStatus: { in: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] } },
      select: { id: true, title: true, contentStatus: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.libraryItem.findMany({
      where: { uploaderId: userId, contentStatus: { in: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] } },
      select: { id: true, title: true, contentStatus: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const myApprovals = await prisma.contentApproval.findMany({
    where: { submittedById: userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true, contentType: true, contentId: true, status: true,
      rejectionReason: true, revisionNote: true, createdAt: true,
      reviewedAt: true,
    },
  });

  const draftCount     = [...announcements, ...videos, ...libraryItems].filter((i) => i.contentStatus === "DRAFT").length;
  const submittedCount = myApprovals.filter((a) => a.status === "SUBMITTED").length;
  const rejectedCount  = myApprovals.filter((a) => a.status === "REJECTED").length;
  const publishedCount = myApprovals.filter((a) => a.status === "PUBLISHED").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-navy-dark">Creator Studio</h1>
        <p className="text-slate-500 text-sm">Quản lý nội dung của bạn</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Nháp",        value: draftCount,     icon: FileText,      color: "text-slate-500 bg-slate-100" },
          { label: "Chờ duyệt",   value: submittedCount, icon: Clock,         color: "text-amber-600 bg-amber-100" },
          { label: "Bị từ chối",  value: rejectedCount,  icon: XCircle,       color: "text-red-600 bg-red-100" },
          { label: "Đã đăng",     value: publishedCount, icon: CheckCircle,   color: "text-green-600 bg-green-100" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick create */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-700 mb-4">Tạo nội dung mới</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/creator/new/announcement"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-navy/30 hover:bg-navy/5 transition-colors">
            <PenSquare className="w-5 h-5 text-navy" />
            <div>
              <div className="font-medium text-sm text-slate-800">Thông báo</div>
              <div className="text-xs text-slate-400">Viết thông báo mới</div>
            </div>
          </Link>
          <Link href="/creator/new/video"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-navy/30 hover:bg-navy/5 transition-colors">
            <Film className="w-5 h-5 text-navy" />
            <div>
              <div className="font-medium text-sm text-slate-800">Video</div>
              <div className="text-xs text-slate-400">Thêm video bài giảng</div>
            </div>
          </Link>
          <Link href="/creator/new/document"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-navy/30 hover:bg-navy/5 transition-colors">
            <FileText className="w-5 h-5 text-navy" />
            <div>
              <div className="font-medium text-sm text-slate-800">Tài liệu</div>
              <div className="text-xs text-slate-400">Thêm tài liệu thư viện</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent submission status */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-700 mb-4">Trạng thái gửi duyệt gần đây</h2>
        {myApprovals.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            Bạn chưa gửi nội dung nào để duyệt.
            <br />
            <Link href="/creator/new/announcement" className="text-navy hover:underline">Tạo nội dung đầu tiên →</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {myApprovals.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <div className={cn("badge text-xs shrink-0 mt-0.5", CONTENT_STATUS_COLORS[a.status])}>
                  {CONTENT_STATUS_LABELS[a.status]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-700">
                    {a.contentType} · {a.contentId.slice(0, 8)}…
                  </div>
                  {a.rejectionReason && (
                    <div className="text-xs text-red-600 mt-0.5">
                      Lý do từ chối: {a.rejectionReason}
                    </div>
                  )}
                  {a.revisionNote && (
                    <div className="text-xs text-amber-600 mt-0.5">
                      Ghi chú sửa: {a.revisionNote}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 shrink-0">
                  {formatDateVi(a.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
