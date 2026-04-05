import { NextRequest, NextResponse } from "next/server";
import { stat, readFile } from "fs/promises";
import path from "path";
import { query } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Validate the id is a plausible UUID to prevent path traversal
  if (!/^[a-f0-9-]{36}$/.test(id)) {
    return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
  }

  // Verify the report order exists
  const rows = await query<{ id: string; status: string }>(
    `SELECT id, status FROM report_orders WHERE id = $1`,
    [id]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "uploads", "reports", id, "report.pdf");

  try {
    await stat(filePath);
  } catch {
    return NextResponse.json({ error: "PDF not yet generated" }, { status: 404 });
  }

  const buffer = await readFile(filePath);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="report-${id}.pdf"`,
      "Content-Length": String(buffer.length),
    },
  });
}
