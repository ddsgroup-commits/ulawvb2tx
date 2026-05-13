// ============================================================
// Assignment detail + submission view for students.
// ============================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CalendarClock, ExternalLink, FileCheck, Target } from "lucide-react";
import { formatDateTimeVi, countdownLabel, daysUntil } from "@/lib/utils";
import { SubmitAssignmentForm } from "./_components/submit-form";

export const dynamic = "force-dynamic";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;
  const userId = session.user.id as string;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      course: true,
      creator: { select: { name: true, email: true } },
      submissions: {
        where: { studentId: userId },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assignment || !assignment.isPublished) notFound();

  const submission = assignment.submissions[0];
  const days = daysUntil(assignment.dueDate);
  const isOverdue = days! < 0 && !submission;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/portal/assignments" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách bài tập
      </Link>

      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase mb-1">
          <span>{assignment.course.code}</span> · <span>{assignment.course.name}</span>
        </div>
        <h1 className="text-2xl font-extrabold text-navy-dark">{assignment.title}</h1>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
          <span className="flex items-center gap-1 text-slate-600">
            <CalendarClock className="h-4 w-4" />
            Hạn nộp: <strong>{formatDateTimeVi(assignment.dueDate)}</strong>
          </span>
          <Badge variant={isOverdue ? "red" : days! <= 2 ? "amber" : "default"}>
            {countdownLabel(assignment.dueDate)}
          </Badge>
          {assignment.maxScore && (
            <span className="flex items-center gap-1 text-slate-600">
              <Target className="h-4 w-4" />
              Điểm tối đa: <strong>{assignment.maxScore}</strong>
              {assignment.weight && <span className="text-slate-400">({assignment.weight}%)</span>}
            </span>
          )}
        </div>
      </div>

      {/* Submission status banner */}
      {submission ? (
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5 flex items-start gap-3">
            <FileCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-emerald-700">Bạn đã nộp bài</h3>
              <p className="text-sm text-slate-600 mt-1">
                Nộp lúc {formatDateTimeVi(submission.submittedAt)}.
                {submission.score !== null && (
                  <> Điểm: <strong>{submission.score}/{assignment.maxScore}</strong>.</>
                )}
                {submission.feedback && (
                  <span className="block mt-2 p-3 bg-slate-50 rounded-lg text-slate-700 italic">
                    "{submission.feedback}"
                  </span>
                )}
              </p>
              {submission.submitUrl && (
                <a
                  href={submission.submitUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 text-sm text-navy hover:underline mt-2"
                >
                  Xem bài nộp <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      ) : isOverdue ? (
        <Card className="border-l-4 border-l-ulaw">
          <CardContent className="p-5">
            <h3 className="font-bold text-ulaw">Bài tập đã quá hạn</h3>
            <p className="text-sm text-slate-600 mt-1">
              Bạn vẫn có thể nộp nhưng sẽ bị đánh dấu là <strong>nộp trễ</strong>. Liên hệ giảng viên nếu cần giải trình.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Đề bài & yêu cầu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">
            {assignment.instructions}
          </div>
          {assignment.creator?.name && (
            <>
              <Separator className="my-4" />
              <p className="text-xs text-slate-500">
                Giảng viên ra đề: <strong>{assignment.creator.name}</strong>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Submit form */}
      <SubmitAssignmentForm
        assignmentId={assignment.id}
        submissionType={assignment.submissionType}
        externalUrl={assignment.submissionUrl}
        hasSubmission={!!submission}
      />
    </div>
  );
}
