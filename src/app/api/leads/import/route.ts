import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import Papa from "papaparse";

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
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) =>
      header
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z_]/g, ""),
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0].message);
  }

  return parsed.data.map((rawRow) => {
    const row: LeadRow = {};
    for (const field of EXPECTED_FIELDS) {
      row[field] = typeof rawRow[field] === "string" ? rawRow[field] : "";
    }
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
