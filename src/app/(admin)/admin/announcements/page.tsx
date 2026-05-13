// ============================================================
// Admin · Announcements CRUD.
// Canonical pattern: server-rendered list + client-side modal form
// hitting the /api/announcements endpoints. Other admin CRUDs
// (courses, library, videos, FAQ) should mirror this shape.
// ============================================================

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Pin, AlertTriangle } from "lucide-react";
import { formatDateTimeVi } from "@/lib/utils";
import { AnnouncementsAdminClient } from "./_components/admin-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quản lý thông báo" };

export default async function AdminAnnouncementsPage() {
  const session = await auth();
  if (!hasPermission(session?.user?.role as any, PERMISSIONS.ANNOUNCEMENTS_MANAGE)) {
    redirect("/portal/dashboard");
  }

  const [announcements, courses] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        author: { select: { name: true, email: true } },
        course: { select: { code: true, name: true } },
      },
    }),
    prisma.course.findMany({
      where: { status: { in: ["ACTIVE", "UPCOMING"] } },
      orderBy: { order: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-dark">Quản lý thông báo</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tạo, sửa, ghim, hoặc xoá thông báo. Mỗi thông báo mới sẽ gửi đẩy đến toàn lớp.
          </p>
        </div>
        <AnnouncementsAdminClient courses={courses} announcements={[]} mode="create" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Tag</th>
                  <th>Môn</th>
                  <th>Ngày đăng</th>
                  <th>Người đăng</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="flex items-start gap-2">
                        {a.pinned && <Pin className="h-3.5 w-3.5 text-navy mt-0.5 shrink-0" />}
                        {a.urgent && <AlertTriangle className="h-3.5 w-3.5 text-ulaw mt-0.5 shrink-0" />}
                        <span className="font-medium text-navy-dark line-clamp-2">{a.title}</span>
                      </div>
                    </td>
                    <td><Badge variant="default">{a.tag}</Badge></td>
                    <td className="text-xs text-slate-500">
                      {a.course ? `${a.course.code}` : <span className="italic text-slate-400">Chung</span>}
                    </td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">{formatDateTimeVi(a.createdAt)}</td>
                    <td className="text-sm text-slate-600">{a.author?.name ?? "—"}</td>
                    <td>
                      <Badge variant={a.published ? "green" : "gray"}>
                        {a.published ? "Đã xuất bản" : "Nháp"}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <AnnouncementsAdminClient
                        courses={courses}
                        announcements={[a]}
                        mode="edit"
                        targetId={a.id}
                      />
                    </td>
                  </tr>
                ))}
                {announcements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Megaphone className="h-8 w-8" />
                        <p className="text-sm">Chưa có thông báo nào. Tạo cái đầu tiên!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
