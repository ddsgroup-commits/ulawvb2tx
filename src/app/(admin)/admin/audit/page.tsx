// ============================================================
// Admin · Audit log viewer.
// Read-only table over AuditLog with action filter and pagination.
// ============================================================

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTimeVi } from "@/lib/utils";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit log" };

const ACTION_VARIANTS: Record<string, "green" | "amber" | "red" | "blue" | "default" | "gray"> = {
  USER_APPROVED: "green",
  USER_REJECTED: "red",
  USER_ROLE_CHANGED: "blue",
  USER_DEACTIVATED: "amber",
  CONTENT_PUBLISHED: "green",
  CONTENT_REJECTED: "red",
  CONTENT_DELETED: "red",
  ASSIGNMENT_SUBMITTED: "blue",
  ASSIGNMENT_GRADED: "green",
  GOOGLE_LINKED: "blue",
  SYSTEM_SETTING_CHANGED: "amber",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  const session = await auth();
  if (!hasPermission(session?.user?.role as any, PERMISSIONS.AUDIT_VIEW)) {
    redirect("/portal/dashboard");
  }

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const pageSize = 30;

  const where: any = {};
  if (sp.action) where.action = sp.action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        actor: { select: { name: true, email: true, role: true } },
        target: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-dark">Nhật ký hệ thống (Audit Log)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Toàn bộ thao tác quản trị, thay đổi quyền, duyệt nội dung và sự kiện hệ thống.
          </p>
        </div>
        <div className="text-sm text-slate-500">
          Tổng cộng: <strong>{total.toLocaleString("vi-VN")}</strong> bản ghi
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: "", label: "Tất cả" },
          { key: "USER_APPROVED", label: "Duyệt user" },
          { key: "USER_ROLE_CHANGED", label: "Đổi role" },
          { key: "CONTENT_PUBLISHED", label: "Xuất bản" },
          { key: "ASSIGNMENT_SUBMITTED", label: "Nộp bài" },
          { key: "SYSTEM_SETTING_CHANGED", label: "Đổi cấu hình" },
        ].map((f) => {
          const active = (sp.action ?? "") === f.key;
          const href = f.key ? `?action=${f.key}` : `?`;
          return (
            <a
              key={f.key}
              href={href}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                active
                  ? "bg-navy text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-navy hover:text-navy"
              }`}
            >
              {f.label}
            </a>
          );
        })}
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-8 w-8" />}
          title="Chưa có bản ghi"
          description="Khi có hoạt động quản trị, nhật ký sẽ hiển thị ở đây."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Người thực hiện</th>
                    <th>Hành động</th>
                    <th>Đối tượng</th>
                    <th>Chi tiết</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap text-slate-500 text-xs">
                        {formatDateTimeVi(log.createdAt)}
                      </td>
                      <td>
                        <div className="font-medium text-slate-700 text-sm">
                          {log.actor?.name ?? log.actor?.email ?? (
                            <span className="text-slate-400 italic">Hệ thống</span>
                          )}
                        </div>
                        {log.actor?.role && (
                          <div className="text-[10px] text-slate-400 uppercase">{log.actor.role}</div>
                        )}
                      </td>
                      <td>
                        <Badge variant={ACTION_VARIANTS[log.action] ?? "gray"}>{log.action}</Badge>
                      </td>
                      <td className="text-sm text-slate-600">
                        {log.target?.name ?? log.entity ?? "—"}
                      </td>
                      <td className="max-w-xs text-xs text-slate-500 truncate">
                        {log.detail ? JSON.stringify(log.detail) : "—"}
                      </td>
                      <td className="text-xs text-slate-400 font-mono">{log.ipAddress ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => {
            const p = i + 1;
            const params = new URLSearchParams();
            if (sp.action) params.set("action", sp.action);
            params.set("page", String(p));
            return (
              <a
                key={p}
                href={`?${params}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  p === page
                    ? "bg-navy text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-navy"
                }`}
              >
                {p}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
