const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../data/students.csv');
const tsPath = path.join(__dirname, '../prisma/class-roster.ts');

const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n').map(l => l.trim()).filter(l => l && l !== 'mssv,fullName,passwordOverride,role');

const entries = lines.map(line => {
  const [studentId, fullName, defaultPassword, roleStr] = line.split(',');
  const parts = fullName.split(' ');
  const ten = parts.pop();
  const ho = parts.join(' ');
  let role = roleStr.toLowerCase();
  
  // Keep original owners if necessary, or just follow CSV.
  // In previous class-roster, Linh (228) and Thao (155) were owners.
  if (role === 'admin' && studentId === '2543801010228') role = 'owner';
  
  return `  { studentId: "${studentId}", ho: "${ho}", ten: "${ten}", fullName: "${fullName}", defaultPassword: "${defaultPassword}", role: "${role}" },`;
});

const fileContent = `// =============================================================
// ULAW VB2 – Class Roster (auto-generated from class list)
// Source: data/students.csv
// MSSV is the username; defaultPassword is the first name (no diacritics).
// =============================================================

export type RosterRole = "owner" | "admin" | "student";
// "owner"   → Prisma SUPER_ADMIN (top-tier; can delete users, demote admins)
// "admin"   → Prisma ADMIN       (manage content, users, settings)
// "student" → Prisma MEMBER      (read-only portal access)

export interface ClassRosterEntry {
  /** Mã số sinh viên (MSSV) – used as portal username */
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
${entries.join('\n')}
];

/** Quick lookup table by MSSV. */
export const ROSTER_BY_ID: Record<string, ClassRosterEntry> =
  Object.fromEntries(CLASS_ROSTER.map((e) => [e.studentId, e]));
`;

fs.writeFileSync(tsPath, fileContent);
console.log('class-roster.ts generated');
