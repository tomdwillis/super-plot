import { NextRequest, NextResponse } from "next/server";
import { validateMagicToken, createSession } from "@/lib/auth";

/**
 * POST /api/auth/magic-link?token={token}
 *
 * Validates the magic link token, creates an HttpOnly session cookie,
 * and redirects the user to their reports page.
 */
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  let email: string;
  try {
    email = await validateMagicToken(token);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid token";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  await createSession(email);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(
    `${appUrl}/dashboard?email=${encodeURIComponent(email)}`
  );
}

/**
 * GET /api/auth/magic-link?token={token}
 *
 * Same as POST — supports direct browser navigation from email links.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  let email: string;
  try {
    email = await validateMagicToken(token);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid token";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  await createSession(email);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(
    `${appUrl}/dashboard?email=${encodeURIComponent(email)}`
  );
}
