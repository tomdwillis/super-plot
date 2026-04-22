import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { query } from "./db";

const SESSION_COOKIE = "sp_session";
const SESSION_TTL_DAYS = 7;
const TOKEN_TTL_HOURS = 1;

function getSessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) throw new Error("AUTH_SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

// ─── Magic link tokens ────────────────────────────────────────────────────────

/** Generate a raw magic-link token, store its hash, and return the raw token. */
export async function generateMagicToken(email: string): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await query(
    `INSERT INTO auth_tokens (email, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [email, hash, expiresAt]
  );

  return raw;
}

/**
 * Validate a magic-link token.
 * Returns the associated email on success; throws on invalid/expired/used token.
 * Marks the token as used (single-use).
 */
export async function validateMagicToken(raw: string): Promise<string> {
  const hash = createHash("sha256").update(raw).digest("hex");

  const rows = await query<{ email: string }>(
    `UPDATE auth_tokens
     SET used_at = now()
     WHERE token_hash = $1
       AND used_at IS NULL
       AND expires_at > now()
     RETURNING email`,
    [hash]
  );

  if (rows.length === 0) throw new Error("Invalid token");

  return rows[0].email;
}

// ─── JWT sessions ─────────────────────────────────────────────────────────────

/** Create a signed JWT session and set it as an HttpOnly cookie. */
export async function createSession(email: string): Promise<void> {
  const secret = getSessionSecret();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(secret);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    expires: expiresAt,
    path: "/",
  });
}

/** Extract and verify the session from the request. Returns email or null. */
export async function getSession(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const secret = getSessionSecret();
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}
