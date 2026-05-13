// ============================================================
// Student assignments hub — lists every assignment in courses the
// student is enrolled in, with status pills, due-date countdown,
// and a "submit" CTA when work is missing.
// ============================================================

import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FileCheck, CalendarClock, FileWarning, Sparkles, ClipboardList } from "lucide-react";
import { formatDateTimeVi, countdownLabel, daysUntil } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bài tập" };

interface AssignmentRow {
  id: string;
  title: string;
  course: { name: string; code: string; icon: string | null } | null;
  dueDate: Date;
  maxScore: number | null;
  submissions: { score: number | null; submittedAt: Date }[];
}

function statusOf(a: AssignmentRow): {
  label: string;
  variant: "green" | "amber" | "red" | "blue" | "gray";
  icon: typeof FileCheck;
} {
  const sub = a.submissions[0];
  if (sub) {
    if (sub.score !== null) return { label: "Đã chấm", variant: "green", icon: FileCheck };
    return { label: "Đã nộp", variant: "blue", icon: FileCheck };
  }
  const days = daysUntil(a.dueDate);
  if (days === null) return { label: "Chưa nộp", variant: "gray", icon: ClipboardList };
  if (days < 0) return { label: "Quá hạn", variant: "red", icon: FileWarning };
  if (days <= 2) return { label: "Sắp hết hạn", variant: "amber", icon: CalendarClock };
  return { label: "Cần làm", variant: "gray", icon: ClipboardList };
}

export default async function StudentAssignmentsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const userId = session.user.id as string;

  const assignments = await prisma.assignment.findMany({
    where: { isPublished: true },
    orderBy: { dueDate: "asc" },
    include: {
      course: { select: { name: true, code: true, icon: true } },
      submissions: {
        where: { studentId: userId },
        select: { score: true, submittedAt: true },
      },
    },
  });

  const upcoming = assignments.filter((a) => !a.submissions[0] && daysUntil(a.dueDate)! >= 0);
  const overdue = assignments.filter((a) => !a.submissions[0] && daysUntil(a.dueDate)! < 0);
  const done = assignments.filter((a) => a.submissions[0]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-dark">Bài tập</h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi và nộp bài tập cho từng môn học. AI hỗ trợ tóm tắt và gợi ý chấm điểm sẽ có ở Phase 4.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Cần làm" value={upcoming.length} tone="amber" icon={CalendarClock} />
        <StatCard label="Quá hạn" value={overdue.length} tone="red" icon={FileWarning} />
        <StatCard label="Đã nộp" value={done.length} tone="green" icon={FileCheck} />
        <StatCard label="Tổng" value={assignments.length} tone="navy" icon={ClipboardList} />
      </div>

      {/* Lists */}
      <Section title="Bài tập cần làm" items={upcoming} emptyText="Tuyệt vời — không còn bài tập tới hạn." />
      {overdue.length > 0 && <Section title="Quá hạn" items={overdue} accent="red" />}
      <Section title="Đã nộp" items={done} emptyText="Bạn chưa nộp bài tập nào." />
    </div>
  );
}

function StatCard({ label, value, tone, icon: Icon }: {
  label: string; value: number; tone: "amber" | "red" | "green" | "navy"; icon: typeof FileCheck;
}) {
  const toneClass = {
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-ulaw",
    green: "bg-emerald-50 text-emerald-700",
    navy: "bg-navy/5 text-navy",
  }[tone];
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-extrabold text-navy-dark">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({
  title, items, emptyText, accent,
}: {
  title: string;
  items: AssignmentRow[];
  emptyText?: string;
  accent?: "red";
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">{title}</h2>
      {items.length === 0 ? (
        emptyText ? (
          <EmptyState
            icon={<Sparkles className="h-8 w-8" />}
            title={emptyText}
          />
        ) : null
      ) : (
        <div className="space-y-2">
          {items.map((a) => {
            const status = statusOf(a);
            const StatusIcon = status.icon;
            return (
              <Link key={a.id} href={`/portal/assignments/${a.id}`}>
                <Card className={`hover:shadow-card-hover transition-shadow ${accent === "red" ? "border-l-4 border-l-ulaw" : ""}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-xl shrink-0">
                      {a.course?.icon ?? "📘"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-semibold uppercase">
                          {a.course?.code} · {a.course?.name}
                        </span>
                      </div>
                      <p className="font-semibold text-navy-dark mt-0.5 truncate">{a.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {formatDateTimeVi(a.dueDate)}
                        </span>
                        <span className={daysUntil(a.dueDate)! < 0 && !a.submissions[0] ? "text-ulaw font-semibold" : ""}>
                          {countdownLabel(a.dueDate)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <Badge variant={status.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                      {a.submissions[0]?.score !== null && a.submissions[0]?.score !== undefined && (
                        <span className="text-sm font-bold text-navy-dark">
                          {a.submissions[0]!.score}/{a.maxScore ?? 10}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
