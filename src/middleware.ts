// ============================================================
// ULAW VB2-TX LMS — RBAC Middleware
// Enforces role-based access for all protected routes
// ============================================================

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route → minimum required role(s)
const ROUTE_ACCESS: Record<string, string[]> = {
  // Super Admin only
  "/owner":         ["SUPER_ADMIN"],
  "/admin/super":   ["SUPER_ADMIN"],

  // Admin and above
  "/admin":         ["SUPER_ADMIN", "ADMIN"],

  // Moderator and above
  "/moderator":     ["SUPER_ADMIN", "ADMIN", "MODERATOR"],

  // Creator and above
  "/creator":       ["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR"],

  // Student and above (all approved users)
  "/portal":        ["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR", "LECTURER", "STUDENT"],

  // Pending users only see /pending
  "/pending":       ["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR", "LECTURER", "STUDENT", "PENDING_USER"],
};

const PUBLIC_ROUTES = ["/", "/login", "/register", "/api/auth", "/api/config"];

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = req.auth;
  const user = session?.user;

  // Not authenticated → redirect to login
  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (user as { role?: string }).role ?? "PENDING_USER";

  // Find matching route rule (most specific first)
  const matchedRoute = Object.keys(ROUTE_ACCESS)
    .sort((a, b) => b.length - a.length)
    .find(route => pathname.startsWith(route));

  if (matchedRoute) {
    const allowedRoles = ROUTE_ACCESS[matchedRoute];
    if (!allowedRoles.includes(role)) {
      // Pending users go to /pending
      if (role === "PENDING_USER") {
        return NextResponse.redirect(new URL("/pending", req.url));
      }
      // Others go to their default portal
      return NextResponse.redirect(new URL("/portal/dashboard", req.url));
    }
  }

  // Pending user trying to access anything → send to /pending
  if (role === "PENDING_USER" && !pathname.startsWith("/pending") && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/pending", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
