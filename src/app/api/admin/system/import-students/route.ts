import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { Role } from "@prisma/client";

export const runtime = "nodejs";

// MSSVs that always get ADMIN, regardless of CSV value.
const ADMIN_MSSV_OVERRIDES = new Set(["2543801010147"]);
// MSSVs that always get SUPER_ADMIN.
const SUPER_ADMIN_MSSV_OVERRIDES = new Set(["2543801010228"]);

const STUDENT_EMAIL_DOMAIN =
  process.env.STUDENT_EMAIL_DOMAIN ?? "email.hcmulaw.edu.vn";

const BCRYPT_COST = Number(process.env.BCRYPT_COST ?? 12);

type PreparedRow = {
  line: number;
  mssv: string;
  fullName: string;
  email: string;
  password: string;
  role: Role;
};

export async function POST(req: Request) {
  const guard = await requireRole("SUPER_ADMIN");
  if (!guard.ok) return guard.response;

  const formData = await req.formData();
  const file = formData.get("file");
  const dryRun = formData.get("dryRun") === "true";
  const resetPasswords = formData.get("resetPasswords") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "Thiếu tệp CSV" },
      { status: 400 },
    );
  }
  if (file.size > 1_000_000) {
    return NextResponse.json(
      { ok: false, error: "Tệp quá lớn (giới hạn 1 MB)" },
      { status: 400 },
    );
  }

  const raw = await file.text();
  const { prepared, errors } = prepareRows(raw);

  if (prepared.length === 0 && errors.length === 0) {
    return NextResponse.json(
      { ok: false, error: "CSV không có dòng dữ liệu hợp lệ" },
      { status: 400 },
    );
  }

  // Detect duplicate MSSV in the input
  const seen = new Map<string, number>();
  const dupes = new Set<string>();
  for (const r of prepared) {
    const n = (seen.get(r.mssv) ?? 0) + 1;
    seen.set(r.mssv, n);
    if (n > 1) dupes.add(r.mssv);
  }
  if (dupes.size > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `MSSV trùng lặp trong CSV: ${[...dupes].join(", ")}`,
      },
      { status: 400 },
    );
  }

  const admins = prepared.filter(
    (r) => r.role === "SUPER_ADMIN" || r.role === "ADMIN",
  ).length;
  const students = prepared.length - admins;
  const preview = {
    total: prepared.length,
    admins,
    students,
    invalid: errors.length,
  };

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      preview,
      errors: errors.map((e) => `dòng ${e.line}: ${e.reason}`),
    });
  }

  // ── Write phase ──
  const summary = {
    created: 0,
    updated: 0,
    passwordsReset: 0,
    failed: 0,
    skipped: errors.length,
  };

  for (const row of prepared) {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: row.email },
        select: { id: true, passwordHash: true },
      });

      if (existing) {
        const shouldHash = resetPasswords || !existing.passwordHash;
        const passwordHash = shouldHash
          ? await bcrypt.hash(row.password, BCRYPT_COST)
          : existing.passwordHash!;

        await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: row.fullName,
            studentId: row.mssv,
            role: row.role,
            isActive: true,
            passwordHash,
          },
        });
        summary.updated++;
        if (shouldHash) summary.passwordsReset++;
      } else {
        const passwordHash = await bcrypt.hash(row.password, BCRYPT_COST);
        await prisma.user.create({
          data: {
            email: row.email,
            name: row.fullName,
            studentId: row.mssv,
            role: row.role,
            isActive: true,
            passwordHash,
          },
        });
        summary.created++;
      }
    } catch {
      summary.failed++;
    }
  }

  await logAudit({
    req: req as Parameters<typeof logAudit>[0]["req"],
    userId: guard.userId,
    actorRole: guard.role,
    action: "BULK_IMPORT_STUDENTS",
    entityType: "User",
    newValue: { ...summary, dryRun, resetPasswords },
  }).catch(() => {
    /* audit-log best-effort */
  });

  return NextResponse.json({
    ok: true,
    preview,
    summary,
    errors: errors.map((e) => `dòng ${e.line}: ${e.reason}`),
  });
}

// ── CSV parsing + validation ─────────────────────────────────

type CsvCols = {
  mssv?: string;
  fullName?: string;
  passwordOverride?: string;
  role?: string;
};

function prepareRows(raw: string): {
  prepared: PreparedRow[];
  errors: { line: number; reason: string }[];
} {
  const prepared: PreparedRow[] = [];
  const errors: { line: number; reason: string }[] = [];

  const lines = splitCsvLines(raw);
  if (lines.length === 0) return { prepared, errors };

  const header = parseCsvLine(lines[0]).map((s) => s.trim());
  const idx = (name: string) => header.indexOf(name);
  const iMssv = idx("mssv");
  const iName = idx("fullName");
  const iPwd = idx("passwordOverride");
  const iRole = idx("role");

  if (iMssv < 0 || iName < 0) {
    errors.push({
      line: 1,
      reason: "Header phải có ít nhất các cột: mssv, fullName",
    });
    return { prepared, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;
    const cells = parseCsvLine(line);
    const row: CsvCols = {
      mssv: cells[iMssv] ?? "",
      fullName: cells[iName] ?? "",
      passwordOverride: iPwd >= 0 ? cells[iPwd] ?? "" : "",
      role: iRole >= 0 ? cells[iRole] ?? "" : "",
    };

    const mssv = row.mssv!.trim();
    const fullName = row.fullName!.replace(/\s+/g, " ").trim();
    const lineNo = i + 1;

    if (!mssv) {
      errors.push({ line: lineNo, reason: "thiếu mssv" });
      continue;
    }
    if (!fullName) {
      errors.push({ line: lineNo, reason: "thiếu fullName" });
      continue;
    }
    if (!/^\d{8,15}$/.test(mssv)) {
      errors.push({
        line: lineNo,
        reason: `mssv "${mssv}" không phải 8-15 chữ số`,
      });
      continue;
    }

    let role: Role = "STUDENT";
    const roleRaw = (row.role ?? "").trim().toUpperCase();
    if (SUPER_ADMIN_MSSV_OVERRIDES.has(mssv)) role = "SUPER_ADMIN";
    else if (ADMIN_MSSV_OVERRIDES.has(mssv)) role = "ADMIN";
    else if (roleRaw === "SUPER_ADMIN" || roleRaw === "OWNER") role = "SUPER_ADMIN";
    else if (roleRaw === "ADMIN") role = "ADMIN";
    else if (roleRaw === "MODERATOR") role = "MODERATOR";
    else if (roleRaw === "CREATOR" || roleRaw === "EDITOR") role = "CREATOR";
    else if (
      roleRaw === "" ||
      roleRaw === "STUDENT" ||
      roleRaw === "MEMBER"
    )
      role = "STUDENT";
    else {
      errors.push({
        line: lineNo,
        reason: `role "${row.role}" không hợp lệ`,
      });
      continue;
    }

    const override = (row.passwordOverride ?? "").trim();
    const password = override || derivePassword(fullName);
    if (!password) {
      errors.push({
        line: lineNo,
        reason: "không suy ra được mật khẩu từ tên",
      });
      continue;
    }

    prepared.push({
      line: lineNo,
      mssv,
      fullName,
      email: `${mssv}@${STUDENT_EMAIL_DOMAIN}`,
      password,
      role,
    });
  }

  return { prepared, errors };
}

function splitCsvLines(raw: string): string[] {
  const lines: string[] = [];
  let buf = "";
  let inQuotes = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      buf += c;
      if (raw[i + 1] === '"') {
        buf += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((c === "\n" || c === "\r") && !inQuotes) {
      if (c === "\r" && raw[i + 1] === "\n") i++;
      lines.push(buf);
      buf = "";
    } else {
      buf += c;
    }
  }
  if (buf.length > 0) lines.push(buf);
  return lines;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let buf = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          buf += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        buf += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        cells.push(buf);
        buf = "";
      } else buf += c;
    }
  }
  cells.push(buf);
  return cells;
}

function derivePassword(fullName: string): string {
  const parts = fullName.replace(/\s+/g, " ").trim().split(" ");
  const last = parts[parts.length - 1] ?? "";
  return last
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}
