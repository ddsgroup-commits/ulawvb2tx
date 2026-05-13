import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { logAudit, getClientIp } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

const PORTAL_URL = process.env.NEXTAUTH_URL ?? "https://ulawvb2tx.com";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const { id } = await params;
  const body = await req.json();
  const { role, isActive, action } = body;
  const ip = getClientIp(req);

  // Handle approval action
  if (action === "approve") {
    const user = await prisma.user.update({
      where: { id },
      data: { role: role ?? "STUDENT", isActive: true },
    });
    await logAudit({ action: "USER_APPROVED", actorId: session.user.id, targetId: id, ipAddress: ip });
    await sendEmail({
      to: user.email,
      subject: "ULAW VB2-TX — Tài khoản của bạn đã được phê duyệt",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
          <div style="font-weight:700;font-size:18px;color:#0d1e3a;margin-bottom:8px">ULAW VB2-TX</div>
          <hr style="border:none;border-top:2px solid #e2e8f0;margin:0 0 24px"/>
          <h2 style="font-size:20px;margin:0 0 12px">Tài khoản đã được phê duyệt!</h2>
          <p style="color:#475569;line-height:1.6;margin:0 0 16px">
            Xin chào <strong>${user.name ?? user.email}</strong>,<br/>
            Tài khoản của bạn đã được Admin phê duyệt. Bạn có thể đăng nhập và truy cập đầy đủ tài liệu học tập tại Cổng thông tin ULAW VB2.
          </p>
          <a href="${PORTAL_URL}/login"
            style="display:inline-block;background:#0d1e3a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
            Vào cổng học tập →
          </a>
          <p style="margin:32px 0 0;font-size:12px;color:#94a3b8">© 2026 ULAW VB2-TX · Trường ĐH Luật TP.HCM</p>
        </div>
      `,
    });
    return ok(user);
  }

  if (action === "reject") {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    await logAudit({ action: "USER_REJECTED", actorId: session.user.id, targetId: id, ipAddress: ip });
    await sendEmail({
      to: user.email,
      subject: "ULAW VB2-TX — Thông báo về tài khoản đăng ký",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
          <div style="font-weight:700;font-size:18px;color:#0d1e3a;margin-bottom:8px">ULAW VB2-TX</div>
          <hr style="border:none;border-top:2px solid #e2e8f0;margin:0 0 24px"/>
          <h2 style="font-size:20px;margin:0 0 12px">Tài khoản chưa được duyệt</h2>
          <p style="color:#475569;line-height:1.6;margin:0 0 16px">
            Xin chào <strong>${user.name ?? user.email}</strong>,<br/>
            Rất tiếc, tài khoản đăng ký của bạn chưa được phê duyệt lần này.
            Vui lòng liên hệ Ban quản lý lớp ULAW VB2 để được hỗ trợ thêm.
          </p>
          <p style="margin:32px 0 0;font-size:12px;color:#94a3b8">© 2026 ULAW VB2-TX · Trường ĐH Luật TP.HCM</p>
        </div>
      `,
    });
    return ok(user);
  }

  if (action === "deactivate") {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    await logAudit({ action: "USER_DEACTIVATED", actorId: session.user.id, targetId: id, ipAddress: ip });
    return ok(user);
  }

  // Generic update
  const updated: Record<string, unknown> = {};
  if (role !== undefined) updated.role = role;
  if (isActive !== undefined) updated.isActive = isActive;

  const user = await prisma.user.update({ where: { id }, data: updated });

  if (role !== undefined) {
    await logAudit({
      action: "USER_ROLE_CHANGED",
      actorId: session.user.id,
      targetId: id,
      detail: { newRole: role },
      ipAddress: ip,
    });
  }

  return ok(user);
}
