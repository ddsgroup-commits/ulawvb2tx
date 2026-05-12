import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth", "/invite", "/api/invite"];

// Routes only accessible to MODERATOR and above (admin panel)
const ADMIN_PREFIXES = ["/admin"];

// Routes accessible to CREATOR and above (creator studio)
const CREATOR_PREFIXES = ["/creator"];

// Routes accessible to authenticated non-pending users
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/my-learning",
  "/announcements",
  "/schedule",
  "/courses",
  "/videos",
  "/ai-hub",
  "/library",
  "/contacts",
  "/faq",
];

// PENDING_USER can only see the pending page after login
const PENDING_ALLOWED = ["/pending", "/api/auth"];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Always allow public paths
  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) {
    return NextResponse.next();
  }

  const token =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  // Require login for all protected areas
  if (
    [...ADMIN_PREFIXES, ...CREATOR_PREFIXES, ...PROTECTED_PREFIXES].some(
      (p) => path.startsWith(p)
    )
  ) {
    if (!token) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, req.url)
      );
    }
  }

  // PENDING_USER role check is enforced in server components / API routes
  // because middleware can't decode the JWT role without the secret here.
  // The /pending page is the landing zone; server layouts redirect there.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
