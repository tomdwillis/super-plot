import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const EXPECTED_FIELDS = [
  "email",
  "phone",
  "first_name",
  "last_name",
  "address",
  "city",
  "state",
  "zip",
  "county",
  "apn",
  "source",
  "notes",
] as const;

type LeadRow = Partial<Record<(typeof EXPECTED_FIELDS)[number], string>>;

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === "1")
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return raw.trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function parseCSV(text: string): LeadRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, ""));
  return lines.slice(1).map((line) => {
    // Basic CSV parse — handles quoted fields with commas
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current.trim());

    const row: LeadRow = {};
    headers.forEach((h, idx) => {
      const key = h as keyof LeadRow;
      if (EXPECTED_FIELDS.includes(key as (typeof EXPECTED_FIELDS)[number])) {
        row[key as (typeof EXPECTED_FIELDS)[number]] = values[idx] ?? "";
      }
    });
    return row;
  });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  let rows: LeadRow[] = [];
  let sourceCrm: string | undefined;

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      sourceCrm = (formData.get("source_crm") as string) ?? undefined;

      if (!file || typeof file === "string") {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }
      const text = await (file as Blob).text();
      rows = parseCSV(text);
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      rows = Array.isArray(body) ? body : body.leads ?? [];
      sourceCrm = body.source_crm;
    } else if (contentType.includes("text/csv")) {
      const text = await req.text();
      rows = parseCSV(text);
    } else {
      return NextResponse.json({ error: "Unsupported content type. Use multipart/form-data, application/json, or text/csv." }, { status: 415 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to parse request body" }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows found in input" }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;
  const errors: { row: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const email = (row.email ?? "").trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      errors.push({ row: i + 1, reason: `Invalid or missing email: "${row.email ?? ""}"` });
      continue;
    }

    const phone = row.phone ? normalizePhone(row.phone) : null;
    const apn = row.apn?.trim() || null;

    try {
      const result = await query<{ id: string }>(
        `INSERT INTO leads
           (email, phone, first_name, last_name, address, city, state, zip,
            county, apn, source, notes, source_crm)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT ON CONSTRAINT idx_leads_email_apn DO NOTHING
         RETURNING id`,
        [
          email,
          phone,
          row.first_name?.trim() || null,
          row.last_name?.trim() || null,
          row.address?.trim() || null,
          row.city?.trim() || null,
          row.state?.trim() || null,
          row.zip?.trim() || null,
          row.county?.trim() || null,
          apn,
          row.source?.trim() || null,
          row.notes?.trim() || null,
          sourceCrm ?? null,
        ]
      );

      if (result.length > 0) {
        imported++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`Row ${i + 1} insert error:`, err);
      errors.push({ row: i + 1, reason: "Database error" });
    }
  }

  return NextResponse.json({
    total: rows.length,
    imported,
    skipped,
    errors,
  });
}
