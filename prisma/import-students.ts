/**
 * prisma/import-students.ts
 *
 * Bulk import / upsert the class roster from `data/students.csv` into the
 * deployed User table. Idempotent (upsert by email). Never duplicates rows.
 *
 * CSV columns: mssv,fullName,passwordOverride,role
 *   - role values: STUDENT | ADMIN (case-insensitive; mapped to deployed enum)
 *   - STUDENT → MEMBER     (deployed Role enum has no STUDENT, uses MEMBER)
 *   - ADMIN   → ADMIN
 *
 * Admin overrides (always preserved regardless of CSV):
 *   2543801010228@email.hcmulaw.edu.vn → ADMIN (Trần Nguyễn Anh Linh)
 *   2543801010147@email.hcmulaw.edu.vn → ADMIN
 *
 * Run inside the migrate container:
 *   docker compose run --rm migrate sh -c "npx tsx prisma/import-students.ts"
 *
 * Flags:
 *   --dry-run            preview only, no DB writes
 *   --reset-passwords    re-hash + overwrite existing passwords too
 *   --file=path/to.csv   override CSV path (default: data/students.csv)
 */

import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const args = parseArgs(process.argv.slice(2));
const csvPath = path.resolve(
  process.cwd(),
  typeof args.file === "string" ? args.file : "data/students.csv",
);
const dryRun = !!args["dry-run"];
const resetPasswords = !!args["reset-passwords"];
const bcryptCost = Number(process.env.BCRYPT_COST ?? 12);

const ADMIN_MSSV = new Set<string>([]); // roles now driven entirely by CSV
const STUDENT_EMAIL_DOMAIN =
  process.env.STUDENT_EMAIL_DOMAIN ?? "email.hcmulaw.edu.vn";

type CsvRow = {
  mssv: string;
  fullName: string;
  passwordOverride: string;
  role: string;
  line: number;
};

type PreparedRow = {
  mssv: string;
  fullName: string;
  email: string;
  password: string;
  passwordSource: "override" | "derived";
  role: Role;
  line: number;
};

async function main() {
  banner();

  if (!fs.existsSync(csvPath)) {
    fail(
      `CSV not found at ${csvPath}\n` +
        `Mount or copy data/students.csv into the container, or pass --file=<path>.`,
    );
  }

  const raw = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(raw);
  if (rows.length === 0) fail("CSV has no data rows.");

  const { prepared, errors } = prepareRows(rows);

  printPreview(prepared);

  if (errors.length > 0) {
    console.error(`\n✖ ${errors.length} row(s) skipped during preparation:`);
    for (const e of errors) console.error(`  • line ${e.line}: ${e.reason}`);
  }

  const dupes = findDuplicates(prepared);
  if (dupes.length > 0) {
    fail(
      `Duplicate MSSV inside CSV (each must be unique):\n  • ` +
        dupes.join("\n  • "),
    );
  }

  console.log(
    `\nAbout to import ${prepared.length} student(s) into User table.`,
  );
  const adminCount = prepared.filter((r) => r.role === "ADMIN").length;
  console.log(`  • ADMIN:  ${adminCount}`);
  console.log(`  • MEMBER: ${prepared.length - adminCount}`);

  if (dryRun) {
    console.log("\n[dry-run] No database writes. Re-run without --dry-run.");
    return;
  }

  if (prepared.length === 0) fail("No valid rows to import.");

  const summary = { created: 0, updated: 0, passwordsReset: 0, failed: 0 };

  for (const row of prepared) {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: row.email },
        select: { id: true, passwordHash: true },
      });

      if (existing) {
        const passwordHash =
          resetPasswords || !existing.passwordHash
            ? await bcrypt.hash(row.password, bcryptCost)
            : existing.passwordHash;

        await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: row.fullName,
            mssv: row.mssv,
            role: row.role,
            isActive: true,
            passwordHash,
          },
        });
        summary.updated++;
        if (resetPasswords || !existing.passwordHash) summary.passwordsReset++;
      } else {
        const passwordHash = await bcrypt.hash(row.password, bcryptCost);
        await prisma.user.create({
          data: {
            email: row.email,
            name: row.fullName,
            mssv: row.mssv,
            role: row.role,
            isActive: true,
            passwordHash,
          },
        });
        summary.created++;
      }
    } catch (err) {
      summary.failed++;
      console.error(`  ✖ ${row.email}: ${(err as Error).message}`);
    }
  }

  console.log("\n──────────────────────────────────────────────");
  console.log("Import complete");
  console.log("──────────────────────────────────────────────");
  console.log(`  created           : ${summary.created}`);
  console.log(`  updated           : ${summary.updated}`);
  console.log(`  passwords (re)set : ${summary.passwordsReset}`);
  console.log(`  failed            : ${summary.failed}`);
  console.log(`  skipped (invalid) : ${errors.length}`);
  console.log(`  total in CSV      : ${rows.length}`);
}

function prepareRows(rows: CsvRow[]): {
  prepared: PreparedRow[];
  errors: { line: number; reason: string }[];
} {
  const prepared: PreparedRow[] = [];
  const errors: { line: number; reason: string }[] = [];

  for (const r of rows) {
    const mssv = r.mssv.trim();
    const fullName = r.fullName.replace(/\s+/g, " ").trim();
    const line = r.line;

    if (!mssv) {
      errors.push({ line, reason: "missing mssv" });
      continue;
    }
    if (!fullName) {
      errors.push({ line, reason: "missing fullName" });
      continue;
    }
    if (!/^\d{8,15}$/.test(mssv)) {
      errors.push({ line, reason: `mssv "${mssv}" is not 8-15 digits` });
      continue;
    }

    const roleRaw = r.role.trim().toUpperCase();
    let role: Role;
    if (ADMIN_MSSV.has(mssv) || roleRaw === "ADMIN") {
      role = "ADMIN";
    } else if (!roleRaw || roleRaw === "STUDENT" || roleRaw === "MEMBER") {
      role = "STUDENT";
    } else if (
      roleRaw === "SUPER_ADMIN" ||
      roleRaw === "EDITOR" ||
      roleRaw === "LECTURER" ||
      roleRaw === "GUEST"
    ) {
      role = roleRaw;
    } else {
      errors.push({ line, reason: `role "${r.role}" not recognized` });
      continue;
    }

    const override = r.passwordOverride.trim();
    const password = override || derivePassword(fullName);
    if (!password) {
      errors.push({ line, reason: "could not derive password from fullName" });
      continue;
    }

    prepared.push({
      mssv,
      fullName,
      email: `${mssv}@${STUDENT_EMAIL_DOMAIN}`,
      password,
      passwordSource: override ? "override" : "derived",
      role,
      line,
    });
  }

  return { prepared, errors };
}

function findDuplicates(rows: PreparedRow[]): string[] {
  const seen = new Map<string, number>();
  const dupes = new Set<string>();
  for (const r of rows) {
    const n = (seen.get(r.mssv) ?? 0) + 1;
    seen.set(r.mssv, n);
    if (n > 1) dupes.add(r.mssv);
  }
  return [...dupes];
}

function printPreview(rows: PreparedRow[]) {
  if (rows.length === 0) return;
  console.log("\nImport preview (first 10 rows)");
  console.log("──────────────────────────────────────────────");
  const head =
    pad("MSSV", 14) +
    pad("FULL NAME", 32) +
    pad("EMAIL", 38) +
    pad("PWD", 14) +
    "ROLE";
  console.log(head);
  console.log("─".repeat(head.length));
  for (const r of rows.slice(0, 10)) {
    console.log(
      pad(r.mssv, 14) +
        pad(truncate(r.fullName, 30), 32) +
        pad(truncate(r.email, 36), 38) +
        pad(`${r.password} (${r.passwordSource[0]})`, 14) +
        r.role,
    );
  }
  if (rows.length > 10) console.log(`  … +${rows.length - 10} more rows`);
  console.log(`\n${rows.length} valid row(s).`);
  console.log("Password source: (o)=override, (d)=derived from last word.");
}

function parseCsv(raw: string): CsvRow[] {
  // Tiny RFC-4180-style CSV parser. Handles quoted fields with "" escapes.
  const out: CsvRow[] = [];
  const lines = splitCsvLines(raw);
  if (lines.length === 0) return out;
  const header = parseCsvLine(lines[0]).map((s) => s.trim());
  const colIdx = (name: string) => header.indexOf(name);
  const iMssv = colIdx("mssv");
  const iName = colIdx("fullName");
  const iPwd = colIdx("passwordOverride");
  const iRole = colIdx("role");
  if (iMssv < 0 || iName < 0) {
    fail("CSV header must contain at least: mssv,fullName");
  }
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;
    const cells = parseCsvLine(line);
    out.push({
      mssv: cells[iMssv] ?? "",
      fullName: cells[iName] ?? "",
      passwordOverride: iPwd >= 0 ? cells[iPwd] ?? "" : "",
      role: iRole >= 0 ? cells[iRole] ?? "" : "",
      line: i + 1,
    });
  }
  return out;
}

function splitCsvLines(raw: string): string[] {
  // Split on newlines, but only when not inside quotes.
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

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const a of argv) {
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq >= 0) out[a.slice(2, eq)] = a.slice(eq + 1);
    else out[a.slice(2)] = true;
  }
  return out;
}

function pad(s: string, n: number): string {
  return (s + " ".repeat(n)).slice(0, n);
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

function banner() {
  console.log("──────────────────────────────────────────────");
  console.log(" ULAW VB2 — student bulk import");
  console.log("──────────────────────────────────────────────");
  console.log(`  csv         : ${csvPath}`);
  console.log(`  mode        : ${dryRun ? "DRY-RUN" : "WRITE"}`);
  if (resetPasswords) console.log("  reset-passwords: yes");
}

function fail(msg: string): never {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
