import { NextResponse } from "next/server";
import crypto from "node:crypto";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

  if (!email) {
    return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
  }

  // Look up user — but don't reveal whether the email exists in our response
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiry = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: expiry,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "https://ulawvb2tx.com";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    await sendEmail({
      to: email,
      subject: "Đặt lại mật khẩu ULAW VB2-TX",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#1F3A68;border-radius:10px;color:white;font-weight:bold;font-size:14px;">UL</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:6px;">ULAW VB2-TX · LMS</div>
          </div>
          <h2 style="color:#0f172a;font-size:20px;margin:0 0 8px;">Đặt lại mật khẩu của bạn</h2>
          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản gắn với địa chỉ email này.
            Nhấn vào nút bên dưới để tiếp tục. Liên kết có hiệu lực trong <strong>1 giờ</strong>.
          </p>
          <div style="text-align:center;margin-bottom:28px;">
            <a href="${resetUrl}"
               style="display:inline-block;background:#1F3A68;color:white;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:600;font-size:14px;">
              Đặt lại mật khẩu →
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
            Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này — tài khoản của bạn vẫn an toàn.<br/>
            Liên kết sẽ hết hạn sau 1 giờ.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
          <p style="color:#cbd5e1;font-size:11px;text-align:center;margin:0;">
            © 2026 ULAW VB2-TX · Trường ĐH Luật TP.HCM
          </p>
        </div>
      `,
    });
  }

  // Always return the same response to avoid email enumeration
  return NextResponse.json({
    message: "Nếu email của bạn có trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.",
  });
}
