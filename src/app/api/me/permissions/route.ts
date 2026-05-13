// =============================================================
// GET /api/me/permissions
//
// Returns the caller's role + the resolved list of permission
// keys + booleans for the most-checked UI gates. Client UIs
// (e.g. nav rendering, button visibility) can call this once
// at startup instead of duplicating the matrix.
// =============================================================

import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  ROLE_RANK,
  isAdmin,
  canSeeCreatorPanel,
  canSeeModeratorPanel,
} from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }

  const role = session.user.role as Role;
  const permissions = ROLE_PERMISSIONS[role] ?? [];

  return NextResponse.json({
    ok: true,
    data: {
      userId: session.user.id,
      role,
      roleLabel: ROLE_LABELS[role],
      level: ROLE_RANK[role] ?? 0,
      permissions: [...permissions],
      flags: {
        isAdmin: isAdmin(role),
        canSeeAdmin: isAdmin(role),
        canSeeCreator: canSeeCreatorPanel(role),
        canSeeModerator: canSeeModeratorPanel(role),
      },
    },
  });
}
