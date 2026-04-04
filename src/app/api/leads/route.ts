import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const search = params.get("q") ?? "";
  const status = params.get("status") ?? "";
  const state = params.get("state") ?? "";
  const limit = Math.min(parseInt(params.get("limit") ?? "100", 10), 500);
  const offset = parseInt(params.get("offset") ?? "0", 10);

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (search) {
    conditions.push(
      `(email ILIKE $${idx} OR first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR apn ILIKE $${idx} OR address ILIKE $${idx} OR county ILIKE $${idx})`
    );
    values.push(`%${search}%`);
    idx++;
  }
  if (status) {
    conditions.push(`status = $${idx}`);
    values.push(status);
    idx++;
  }
  if (state) {
    conditions.push(`state = $${idx}`);
    values.push(state);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [countRow] = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM leads ${where}`,
      values
    );
    const total = parseInt(countRow?.count ?? "0", 10);

    values.push(limit, offset);
    const leads = await query(
      `SELECT id, email, phone, first_name, last_name, address, city, state,
              zip, county, apn, source, notes, status, source_crm, created_at, updated_at
       FROM leads
       ${where}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    return NextResponse.json({ leads, total, limit, offset });
  } catch (err) {
    console.error("GET /api/leads error:", err);
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}
