/**
 * Promote an existing account to SUPER_ADMIN ("owner").
 *
 * Run after the DB is already seeded — useful when you don't want to
 * re-run the full seed but still need to flip a single account to owner.
 *
 *   # Default: promote 2543801010228 (Trần Nguyễn Anh Linh) and reset
 *   # her password to "linh".
 *   npx tsx prisma/make-owner.ts
 *
 *   # Promote a different user by MSSV or email, optionally with a
 *   # new password.
 *   npx tsx prisma/make-owner.ts 2543801010147
 *   npx tsx prisma/make-owner.ts 2543801010147 newpass123
 *   npx tsx prisma/make-owner.ts user@email.hcmulaw.edu.vn newpass123
 */

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_ID = "2543801010228";
const DEFAULT_PASSWORD = "linh";

async function main() {
  const idArg = process.argv[2]?.trim() || DEFAULT_ID;
  const passwordArg = process.argv[3]?.trim() || (idArg === DEFAULT_ID ? DEFAULT_PASSWORD : null);
  const isLikelyEmail = idArg.includes("@");

  console.log(`👑 Promoting ${idArg} to SUPER_ADMIN…`);

  const user = await prisma.user.findFirst({
    where: isLikelyEmail
      ? { email: idArg.toLowerCase() }
      : { studentId: idArg },
  });

  if (!user) {
    console.error(`❌ No user found with ${isLikelyEmail ? "email" : "MSSV"} = ${idArg}`);
    console.error(`   Tip: run \`npm run db:seed\` first to populate the class roster.`);
    process.exit(1);
  }

  // Reset password if one was provided (or if we're using the default
  // promotion that ships with a known default pw).
  const data: { role: Role; isActive: true; mustChangePassword?: boolean; passwordHash?: string } = {
    role: Role.SUPER_ADMIN,
    isActive: true,
  };

  if (passwordArg) {
    data.passwordHash = await bcrypt.hash(passwordArg, 10);
    // Owner doesn't get the first-login password-reset prompt — they
    // explicitly know their password.
    data.mustChangePassword = false;
  }

  await prisma.user.update({ where: { id: user.id }, data });

  console.log(`✅ Promoted: ${user.name} (${user.studentId ?? user.email})`);
  console.log(`   Role:     SUPER_ADMIN (owner)`);
  if (passwordArg) console.log(`   Password: ${passwordArg}`);
  console.log(`   Login at /login with either:`);
  if (user.studentId) console.log(`     MSSV:  ${user.studentId}`);
  if (user.email)     console.log(`     Email: ${user.email}`);
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
