import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { logAudit, getClientIp } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password, studentId, phone } = body;

  // Basic validation
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return err("Tên phải có ít nhất 2 ký tự", 400);
  }
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return err("Email không hợp lệ", 400);
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return err("Mật khẩu phải có ít nhất 8 ký tự", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check duplicate email
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return err("Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "PENDING_USER",
      isActive: false,
      ...(studentId ? { mssv: studentId.trim() } : {}),
      ...(phone
        ? {
            profile: {
              create: { phone: phone.trim() },
            },
          }
        : {}),
    },
  });

  await logAudit({
    action: "USER_CREATED",
    actorId: user.id,
    targetId: user.id,
    detail: { type: "self-registration", email: normalizedEmail },
    ipAddress: getClientIp(req),
  });

  // Email to new user
  await sendEmail({
    to: normalizedEmail,
    subject: "ULAW VB2-TX — Đăng ký tài khoản thành công",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
        <div style="font-weight:700;font-size:18px;color:#0d1e3a;margin-bottom:8px">ULAW VB2-TX</div>
        <hr style="border:none;border-top:2px solid #e2e8f0;margin:0 0 24px"/>
        <h2 style="font-size:20px;margin:0 0 12px">Đăng ký thành công!</h2>
        <p style="color:#475569;line-height:1.6;margin:0 0 16px">
          Xin chào <strong>${name.trim()}</strong>,<br/>
          Tài khoản của bạn đã được tạo tại hệ thống <strong>ULAW VB2-TX</strong>.
        </p>
        <div style="background:#fefce8;border:1px solid #fde047;border-radius:10px;padding:16px;margin:0 0 20px">
          <p style="margin:0;font-size:14px;color:#713f12">
            <strong>Lưu ý:</strong> Tài khoản của bạn đang chờ <strong>Admin phê duyệt</strong>.
            Sau khi được duyệt, bạn sẽ có thể truy cập đầy đủ tài liệu học tập.
          </p>
        </div>
        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px">
          Trong thời gian chờ, bạn có thể đăng nhập để xem tin tức và thông báo của lớp ULAW VB2.
        </p>
        <a href="${process.env.NEXTAUTH_URL ?? "https://ulawvb2tx.com"}/login"
          style="display:inline-block;background:#0d1e3a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
          Đăng nhập →
        </a>
        <p style="margin:32px 0 0;font-size:12px;color:#94a3b8">
          © 2026 ULAW VB2-TX · Trường ĐH Luật TP.HCM
        </p>
      </div>
    `,
  });

  // Email to admins
  const admins = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] }, isActive: true },
    select: { email: true },
  });
  if (admins.length > 0) {
    await sendEmail({
      to: admins.map(a => a.email),
      subject: "ULAW VB2-TX — Có tài khoản mới cần duyệt",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
          <div style="font-weight:700;font-size:18px;color:#0d1e3a;margin-bottom:8px">ULAW VB2-TX · Admin</div>
          <hr style="border:none;border-top:2px solid #e2e8f0;margin:0 0 24px"/>
          <h2 style="font-size:20px;margin:0 0 12px">Tài khoản mới cần phê duyệt</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 20px">
            <tr><td style="padding:6px 0;color:#64748b;width:90px">Tên</td><td><strong>${name.trim()}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Email</td><td>${normalizedEmail}</td></tr>
            ${studentId ? `<tr><td style="padding:6px 0;color:#64748b">MSSV</td><td>${studentId}</td></tr>` : ""}
            <tr><td style="padding:6px 0;color:#64748b">Đăng ký lúc</td><td>${new Date().toLocaleString("vi-VN")}</td></tr>
          </table>
          <a href="${process.env.NEXTAUTH_URL ?? "https://ulawvb2tx.com"}/admin/users"
            style="display:inline-block;background:#0d1e3a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
            Xem & duyệt tài khoản →
          </a>
          <p style="margin:32px 0 0;font-size:12px;color:#94a3b8">
            © 2026 ULAW VB2-TX · Trường ĐH Luật TP.HCM
          </p>
        </div>
      `,
    });
  }

  return ok({ message: "Đăng ký thành công. Vui lòng chờ Admin phê duyệt." });
}
