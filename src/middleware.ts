import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Protect GET /api/reports and GET /api/reports/{id}
  if (
    pathname === "/api/reports" ||
    pathname.startsWith("/api/reports/")
  ) {
    const sessionEmail = await getSession(req);

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
