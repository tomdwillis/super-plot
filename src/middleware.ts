import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "sp_session";

async function getSessionEdge(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const secret = process.env.AUTH_SESSION_SECRET;
    if (!secret) return null;
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Protect GET /api/reports and GET /api/reports/{id}
  if (
    pathname === "/api/reports" ||
    pathname.startsWith("/api/reports/")
  ) {
    const sessionEmail = await getSessionEdge(req);

    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For the list endpoint, verify the session email matches the requested email
    if (pathname === "/api/reports") {
      const requestedEmail = searchParams.get("email");
      if (requestedEmail && requestedEmail.toLowerCase() !== sessionEmail.toLowerCase()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/reports", "/api/reports/:path*"],
};
