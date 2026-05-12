// =============================================================
// ULAW VB2 — Class Roster (EXAMPLE / TEMPLATE)
//
// This file is the public template. The real roster (with real
// student names, MSSVs, and derived default passwords) lives at
// `prisma/class-roster.ts`, which is gitignored.
//
// To build the project locally:
//   cp prisma/class-roster.example.ts prisma/class-roster.ts
//
// Then either keep the dummy data below (for development), or
// populate it from your authoritative source (e.g. the CSV in
// `data/students.csv`, which is also gitignored).
// =============================================================

export type RosterRole = "owner" | "admin" | "student";
// "owner"   → Prisma SUPER_ADMIN
// "admin"   → Prisma ADMIN
// "student" → Prisma STUDENT

export interface ClassRosterEntry {
  /** Mã số sinh viên (MSSV) — used as portal username */
  studentId: string;
  /** Họ + middle name */
  ho: string;
  /** Given name (with diacritics) */
  ten: string;
  /** Full name */
  fullName: string;
  /** Default password = lowercased given name without diacritics */
  defaultPassword: string;
  /** Default role assignment */
  role: RosterRole;
}

export const CLASS_ROSTER: ClassRosterEntry[] = [
  // Dummy seed data — replace with your real class list locally.
  {
    studentId: "2543801010001",
    ho: "Nguyễn Văn",
    ten: "A",
    fullName: "Nguyễn Văn A",
    defaultPassword: "a",
    role: "student",
  },
  {
    studentId: "2543801010002",
    ho: "Trần Thị",
    ten: "B",
    fullName: "Trần Thị B",
    defaultPassword: "b",
    role: "student",
  },
];

export const ROSTER_BY_ID: Record<string, ClassRosterEntry> =
  Object.fromEntries(CLASS_ROSTER.map((e) => [e.studentId, e]));
