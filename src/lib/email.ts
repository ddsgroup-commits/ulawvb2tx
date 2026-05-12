/**
 * Email utility — Nodemailer-based sender
 * Configure SMTP via env vars:
 *   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
 *
 * For dev/test without real SMTP: set EMAIL_PREVIEW=true to log emails to console.
 */

import nodemailer from "nodemailer";

function createTransport() {
  if (process.env.EMAIL_PREVIEW === "true") {
    // Preview mode — just log, no real send
    return null;
  }
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   || "smtp.gmail.com",
    port:   Number(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER || "",
      pass: process.env.EMAIL_PASS || "",
    },
  });
}

interface MailOptions {
  to:      string;
  subject: string;
  html:    string;
}

export async function sendMail(opts: MailOptions): Promise<boolean> {
  const from = process.env.EMAIL_FROM || `"ULAW VB2 Portal" <noreply@ulaw-vb2.edu.vn>`;

  if (process.env.EMAIL_PREVIEW === "true") {
    console.log("\n─── [EMAIL PREVIEW] ──────────────────────────────");
    console.log(`To:      ${opts.to}`);
    console.log(`Subject: ${opts.subject}`);
    console.log(`Body:    ${opts.html.replace(/<[^>]+>/g, "")}`);
    console.log("─────────────────────────────────────────────────\n");
    return true;
  }

  const transport = createTransport();
  if (!transport) return false;

  try {
    await transport.sendMail({ from, ...opts });
    return true;
  } catch (err) {
    console.error("[email] Send failed:", err);
    return false;
  }
}

// ── Templates ────────────────────────────────────────────────

export function invitationEmailHtml({
  inviterName,
  role,
  inviteUrl,
  expiresAt,
  note,
}: {
  inviterName: string;
  role:        string;
  inviteUrl:   string;
  expiresAt:   Date;
  note?:       string | null;
}): string {
  const expiry = expiresAt.toLocaleDateString("vi-VN", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN:  "Quản trị cao nhất",
    ADMIN:        "Quản trị viên",
    MODERATOR:    "Kiểm duyệt viên",
    CREATOR:      "Người tạo nội dung",
    STUDENT:      "Sinh viên",
    PENDING_USER: "Chờ phê duyệt",
  };

  return `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#1F3A68;padding:28px 32px;">
          <p style="margin:0;font-size:11px;color:#c9a84c;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">ULAW VB2 PORTAL</p>
          <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:800;">Bạn được mời tham gia</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">
            <strong style="color:#1F3A68">${inviterName}</strong> đã mời bạn tham gia hệ thống quản lý
            <strong>ULAW VB2 Portal</strong> với quyền hạn:
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 20px;margin:0 0 20px;">
            <span style="font-size:18px;font-weight:800;color:#1F3A68;">${roleLabel[role] ?? role}</span>
          </div>
          ${note ? `<p style="color:#64748b;font-size:14px;font-style:italic;border-left:3px solid #c9a84c;padding-left:12px;margin:0 0 24px;">"${note}"</p>` : ""}
          <a href="${inviteUrl}"
             style="display:inline-block;background:#1F3A68;color:#fff;text-decoration:none;
                    padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;
                    letter-spacing:0.5px;">
            Kích hoạt tài khoản →
          </a>
          <p style="color:#94a3b8;font-size:12px;margin:20px 0 0;">
            Link có hiệu lực đến: <strong>${expiry}</strong>
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">
            Nếu bạn không mong đợi lời mời này, hãy bỏ qua email này.<br/>
            ULAW VB2 Portal — Trường Đại học Luật TP.HCM
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
