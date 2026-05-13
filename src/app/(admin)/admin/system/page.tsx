import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { Role } from "@prisma/client";
import {
  Activity, Database, Users, FileText, AlertTriangle,
  CheckCircle2, ShieldAlert, Server, Upload, Clock,
} from "lucide-react";
import { SystemActions } from "./SystemActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Hệ thống · Admin" };

type MigrationRow = {
  migration_name: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: "bg-rose-100 text-rose-800",
  ADMIN: "bg-amber-100 text-amber-800",
  MODERATOR: "bg-sky-100 text-sky-800",
  CREATOR: "bg-violet-100 text-violet-800",
  STUDENT: "bg-slate-100 text-slate-700",
  PENDING_USER: "bg-yellow-100 text-yellow-800",
};

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Quản trị tối cao",
  ADMIN: "Quản trị viên",
  MODERATOR: "Kiểm duyệt viên",
  CREATOR: "Biên tập viên",
  STUDENT: "Sinh viên",
  PENDING_USER: "Chờ phê duyệt",
};

export default async function AdminSystemPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (role !== "SUPER_ADMIN") redirect("/admin");

  // ── Health checks ──
  const dbStart = Date.now();
  let dbStatus: "ok" | "fail" = "ok";
  let dbError: string | null = null;
  let userCount = 0;
  try {
    userCount = await prisma.user.count();
  } catch (e) {
    dbStatus = "fail";
    dbError = (e as Error).message;
  }
  const dbLatencyMs = Date.now() - dbStart;

  // ── Migrations (raw query — _prisma_migrations isn't a Prisma model) ──
  let migrations: MigrationRow[] = [];
  try {
    migrations = await prisma.$queryRawUnsafe<MigrationRow[]>(
      `SELECT migration_name, finished_at, rolled_back_at
       FROM _prisma_migrations
       ORDER BY started_at DESC
       LIMIT 20`,
    );
  } catch {
    /* table missing — first install */
  }

  // ── Stats ──
  const [
    usersByRole,
    announcementCount,
    courseCount,
    libraryCount,
    videoCount,
    lessonCount,
    pendingApprovals,
    recentAudits,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.announcement.count(),
    prisma.course.count(),
    prisma.libraryItem.count(),
    prisma.video.count(),
    prisma.lesson.count(),
    prisma.user.count({ where: { role: "PENDING_USER" } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { actor: { select: { name: true } } },
    }),
  ]);

  const totalContent =
    announcementCount + courseCount + libraryCount + videoCount + lessonCount;

  return (
    <div className="space-y-8 max-w-6xl">
      <header>
        <div className="flex items-center gap-2 text-xs text-rose-700 font-semibold uppercase tracking-wider mb-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          SUPER_ADMIN only
        </div>
        <h1 className="text-2xl font-extrabold text-navy-dark">Hệ thống vận hành</h1>
        <p className="text-slate-500 text-sm mt-1">
          Trạng thái hệ thống, di chuyển CSDL, và các thao tác vận hành. Mọi hành động ở đây đều được ghi vào nhật ký.
        </p>
      </header>

      {/* ── Health summary ── */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard
          icon={Database}
          label="Cơ sở dữ liệu"
          ok={dbStatus === "ok"}
          primary={dbStatus === "ok" ? `${dbLatencyMs} ms` : "OFFLINE"}
          sub={dbError ?? "PostgreSQL · ulaw_portal"}
        />
        <HealthCard
          icon={Users}
          label="Tổng tài khoản"
          ok
          primary={userCount.toString()}
          sub={`${pendingApprovals} chờ phê duyệt`}
        />
        <HealthCard
          icon={FileText}
          label="Tổng nội dung"
          ok
          primary={totalContent.toString()}
          sub={`${announcementCount} tin · ${lessonCount} bài học · ${videoCount} video`}
        />
        <HealthCard
          icon={Server}
          label="Phiên bản"
          ok
          primary={process.env.NODE_ENV === "production" ? "PROD" : process.env.NODE_ENV ?? "dev"}
          sub={`Node ${process.version}`}
        />
      </section>

      {/* ── User role distribution ── */}
      <section>
        <SectionHeader icon={Users} title="Phân bổ theo vai trò" />
        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR", "STUDENT", "PENDING_USER"] as Role[]).map(
            (r) => {
              const entry = usersByRole.find((u) => u.role === r);
              const count = entry?._count?._all ?? 0;
              return (
                <div key={r} className="card p-4">
                  <div
                    className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${ROLE_COLORS[r]}`}
                  >
                    {r}
                  </div>
                  <div className="text-2xl font-extrabold text-navy-dark mt-2">{count}</div>
                  <div className="text-xs text-slate-500">{ROLE_LABEL[r]}</div>
                </div>
              );
            },
          )}
        </div>
      </section>

      {/* ── CSV import (client-side form) ── */}
      <section>
        <SectionHeader
          icon={Upload}
          title="Nhập danh sách sinh viên từ CSV"
          subtitle="Idempotent upsert theo email. Mật khẩu hiện tại được giữ nguyên trừ khi bạn bật reset."
        />
        <SystemActions />
      </section>

      {/* ── Migration history ── */}
      <section>
        <SectionHeader
          icon={Activity}
          title="Lịch sử migration"
          subtitle={`${migrations.length} mục gần nhất từ _prisma_migrations`}
        />
        <div className="card overflow-hidden">
          {migrations.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">Không có migration nào.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2">Tên migration</th>
                  <th className="px-4 py-2">Trạng thái</th>
                  <th className="px-4 py-2">Thời gian hoàn tất</th>
                </tr>
              </thead>
              <tbody>
                {migrations.map((m, i) => (
                  <tr key={`${m.migration_name}-${i}`} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-xs">{m.migration_name}</td>
                    <td className="px-4 py-2">
                      {m.rolled_back_at ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 text-xs">
                          <AlertTriangle className="w-3 h-3" /> Rolled back
                        </span>
                      ) : m.finished_at ? (
                        <span className="inline-flex items-center gap-1 text-green-700 text-xs">
                          <CheckCircle2 className="w-3 h-3" /> Applied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {m.finished_at ? formatDate(m.finished_at) : m.rolled_back_at ? formatDate(m.rolled_back_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Audit log tail ── */}
      <section>
        <SectionHeader
          icon={Activity}
          title="Nhật ký hệ thống (gần nhất)"
          subtitle="12 sự kiện mới nhất. Xem toàn bộ tại /admin/audit."
        />
        <div className="card overflow-hidden">
          {recentAudits.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">Chưa có sự kiện nào.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2">Thời gian</th>
                  <th className="px-4 py-2">Người</th>
                  <th className="px-4 py-2">Hành động</th>
                  <th className="px-4 py-2">Đối tượng</th>
                </tr>
              </thead>
              <tbody>
                {recentAudits.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(a.createdAt)}
                    </td>
                    <td className="px-4 py-2 text-xs">{a.actor?.name ?? "(system)"}</td>
                    <td className="px-4 py-2 text-xs font-mono">{a.action}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {a.entity}
                      {a.entityId && (
                        <span className="ml-1 font-mono text-slate-400">#{a.entityId.slice(0, 8)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function HealthCard({
  icon: Icon,
  label,
  primary,
  sub,
  ok,
}: {
  icon: React.ElementType;
  label: string;
  primary: string;
  sub: string;
  ok: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
          {label}
        </span>
        <span
          className={`ml-auto w-2 h-2 rounded-full ${
            ok ? "bg-green-500" : "bg-rose-500"
          }`}
        />
      </div>
      <div className="text-2xl font-extrabold text-navy-dark">{primary}</div>
      <div className="text-xs text-slate-500 truncate" title={sub}>
        {sub}
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-2 mb-3">
      <Icon className="w-4 h-4 text-navy mt-0.5 shrink-0" />
      <div>
        <h2 className="font-bold text-navy-dark">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}
