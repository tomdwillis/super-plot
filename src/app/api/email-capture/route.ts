import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Upsert — idempotent if they sign up multiple times
    await query(
      `INSERT INTO email_captures (email, created_at)
       VALUES ($1, now())
       ON CONFLICT (email) DO NOTHING`,
      [email.toLowerCase().trim()]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/email-capture error:", err);
    // Non-fatal — always return 200 to avoid blocking the user
    return NextResponse.json({ success: true });
  }
}
