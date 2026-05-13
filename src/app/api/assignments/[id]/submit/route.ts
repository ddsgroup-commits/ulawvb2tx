import prisma from "@/lib/prisma";
import { apiHandler, ok, err } from "@/lib/api";
import { idSchema, submissionCreateSchema } from "@/lib/validation";
import { notify } from "@/lib/notifications";

/**
 * POST /api/assignments/:id/submit — student submits or resubmits.
 *
 * Uses upsert on (assignmentId, studentId) so resubmissions overwrite the
 * previous attempt (matches Canvas/Moodle "submit again" semantics).
 * Fires a notification to the lecturer who created the assignment.
 */
export const POST = apiHandler({
  auth: "required",
  params: idSchema,
  body: submissionCreateSchema,
  handler: async ({ session, body, params }) => {
    const userId = session!.user!.id as string;

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: { course: { select: { name: true, code: true } } },
    });
    if (!assignment || !assignment.isPublished) return err("Assignment not found", 404);

    const submission = await prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: userId } },
      create: {
        assignmentId: assignment.id,
        studentId: userId,
        submitUrl: body.submitUrl || null,
        notes: body.notes || null,
      },
      update: {
        submitUrl: body.submitUrl || null,
        notes: body.notes || null,
        submittedAt: new Date(),
        score: null,
        feedback: null,
        gradedAt: null,
      },
    });

    // Audit + notify the lecturer.
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "ASSIGNMENT_SUBMITTED",
        entity: "Submission",
        entityId: submission.id,
        detail: { assignmentId: assignment.id, title: assignment.title },
      },
    });

    if (assignment.creatorId !== userId) {
      await notify({
        userId: assignment.creatorId,
        type: "ASSIGNMENT_DUE",
        title: `Có bài nộp mới: ${assignment.title}`,
        body: `Học viên đã nộp bài tập "${assignment.title}" – môn ${assignment.course.name}.`,
        link: `/admin/assignments/${assignment.id}`,
        entity: "Submission",
        entityId: submission.id,
      });
    }

    return ok(submission);
  },
});
