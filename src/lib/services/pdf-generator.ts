/**
 * PDF Generation Service
 *
 * Renders an AssembledReport to a downloadable PDF using @react-pdf/renderer.
 * Stores the PDF locally in /uploads/reports/ for MVP.
 * TODO: S3 integration for production.
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import type { AssembledReport, ReportSection } from "./report-assembly";

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 12,
  },
  brand: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
  },
  reportTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    color: "#111827",
  },
  tocTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    color: "#111827",
  },
  tocItem: {
    fontSize: 10,
    marginBottom: 4,
    color: "#374151",
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    marginBottom: 10,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
    paddingVertical: 2,
  },
  label: {
    width: 180,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    fontSize: 9,
  },
  value: {
    flex: 1,
    color: "#1f2937",
    fontSize: 9,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#374151",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  tableCell: {
    fontSize: 8,
    color: "#4b5563",
  },
  highlightBox: {
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 4,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",
  },
  highlightValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
  },
  highlightLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
  },
  ctaBox: {
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 4,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  ctaHeadline: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#166534",
    marginBottom: 6,
  },
  ctaDescription: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 8,
  },
  ctaBullet: {
    fontSize: 9,
    color: "#15803d",
    marginBottom: 2,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 7,
    color: "#9ca3af",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mapPlaceholder: {
    height: 120,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
  },
  mapPlaceholderText: {
    fontSize: 10,
    color: "#9ca3af",
  },
});

// ─── Component Helpers ───────────────────────────────���──────────────────────

function DataRow({ label, value }: { label: string; value: string }) {
  return React.createElement(View, { style: styles.row },
    React.createElement(Text, { style: styles.label }, label),
    React.createElement(Text, { style: styles.value }, String(value))
  );
}

function SectionHeading({ title }: { title: string }) {
  return React.createElement(Text, { style: styles.sectionTitle }, title);
}

// ─── Report Document ────────────────────────────────────────────────────────

function ReportDocument({ report }: { report: AssembledReport }) {
  const { sections } = report;
  const exec = sections.executiveSummary.content as Record<string, unknown>;
  const parcel = sections.parcelDetails.content as Record<string, unknown>;
  const owner = sections.ownerInformation.content as Record<string, unknown>;
  const env = sections.environmentalAssessment.content as Record<string, unknown>;
  const market = sections.marketAnalysis.content as Record<string, unknown>;
  const val = sections.valuation.content as Record<string, unknown>;
  const cta = sections.wilcoLandCta.content as Record<string, unknown>;
  const comps = (market.comparableSales as Array<Record<string, unknown>>) ?? [];
  const benefits = (cta.benefits as string[]) ?? [];
  const confidenceRange = val.confidenceRange as Record<string, string> | undefined;

  return React.createElement(Document, null,
    // Page 1: Cover + Executive Summary + TOC
    React.createElement(Page, { size: "LETTER", style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.brand }, "Super Plot"),
        React.createElement(Text, { style: styles.subtitle }, "Your Property, Your Data"),
        React.createElement(Text, { style: styles.reportTitle }, report.title)
      ),
      // Table of Contents
      React.createElement(View, { style: { marginBottom: 16 } },
        React.createElement(Text, { style: styles.tocTitle }, "Table of Contents"),
        React.createElement(Text, { style: styles.tocItem }, "1. Executive Summary"),
        React.createElement(Text, { style: styles.tocItem }, "2. Parcel Details"),
        React.createElement(Text, { style: styles.tocItem }, "3. Owner Information"),
        React.createElement(Text, { style: styles.tocItem }, "4. Environmental Assessment"),
        React.createElement(Text, { style: styles.tocItem }, "5. Market Analysis"),
        React.createElement(Text, { style: styles.tocItem }, "6. Property Value Summary"),
        React.createElement(Text, { style: styles.tocItem }, "7. Next Steps & Property Services")
      ),
      // Executive Summary
      React.createElement(SectionHeading, { title: "1. Executive Summary" }),
      React.createElement(View, { style: styles.highlightBox },
        React.createElement(Text, { style: styles.highlightValue }, String(exec.estimatedValue)),
        React.createElement(Text, { style: styles.highlightLabel },
          `Estimated Value (${exec.confidenceScore} confidence) | Range: ${exec.valueRange}`
        )
      ),
      React.createElement(DataRow, { label: "Property Address", value: String(exec.propertyAddress) }),
      React.createElement(DataRow, { label: "APN", value: String(exec.apn) }),
      React.createElement(DataRow, { label: "Acreage", value: String(exec.acreage) }),
      React.createElement(DataRow, { label: "Zoning", value: String(exec.zoning) }),
      React.createElement(DataRow, { label: "Environmental Risk Level", value: String(exec.environmentalRisk) }),
      React.createElement(DataRow, { label: "Market Trend in Your Area", value: String(exec.marketTrend) }),
      React.createElement(DataRow, { label: "Similar Properties Analyzed", value: String(exec.comparableSalesCount) }),
      // Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, null, `Generated: ${new Date(report.generatedAt).toLocaleDateString()}`),
        React.createElement(Text, null, `Report ID: ${report.orderId}`),
        React.createElement(Text, null, "Super Plot - superplot.com")
      )
    ),

    // Page 2: Parcel + Owner + Environmental
    React.createElement(Page, { size: "LETTER", style: styles.page },
      React.createElement(SectionHeading, { title: "2. Parcel Details" }),
      React.createElement(DataRow, { label: "Parcel ID", value: String(parcel.parcelId) }),
      React.createElement(DataRow, { label: "APN", value: String(parcel.apn) }),
      React.createElement(DataRow, { label: "Address", value: String(parcel.address) }),
      React.createElement(DataRow, { label: "County", value: String(parcel.county) }),
      React.createElement(DataRow, { label: "State", value: String(parcel.state) }),
      React.createElement(DataRow, { label: "Acreage", value: String(parcel.acreage) }),
      React.createElement(DataRow, { label: "Zoning", value: String(parcel.zoning) }),
      React.createElement(DataRow, { label: "Legal Description", value: String(parcel.legalDescription) }),
      // Map placeholder
      React.createElement(View, { style: styles.mapPlaceholder },
        React.createElement(Text, { style: styles.mapPlaceholderText }, "[ Map View - Coming Soon ]")
      ),

      React.createElement(SectionHeading, { title: "3. Owner Information" }),
      React.createElement(DataRow, { label: "Owner Name", value: String(owner.name) }),
      React.createElement(DataRow, { label: "Mailing Address", value: String(owner.mailingAddress) }),
      React.createElement(DataRow, { label: "Ownership Type", value: String(owner.ownershipType) }),
      React.createElement(DataRow, { label: "Deed Date", value: String(owner.deedDate) }),

      React.createElement(SectionHeading, { title: "4. Environmental Assessment" }),
      React.createElement(DataRow, { label: "Flood Zone", value: `${env.floodZone} - ${env.floodZoneDescription}` }),
      React.createElement(DataRow, { label: "Wetlands Present", value: env.wetlandsPresent ? "Yes" : "No" }),
      React.createElement(DataRow, { label: "Soil Type", value: String(env.soilType) }),
      React.createElement(DataRow, { label: "Contamination", value: String(env.contamination) }),
      React.createElement(DataRow, { label: "Endangered Species", value: env.endangeredSpecies ? "Yes" : "No" }),
      React.createElement(DataRow, { label: "Overall Risk", value: String(env.overallRisk) }),
      // Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, null, "Super Plot Property Report"),
        React.createElement(Text, null, `Page 2 | ${report.orderId}`)
      )
    ),

    // Page 3: Market + Valuation + CTA
    React.createElement(Page, { size: "LETTER", style: styles.page },
      React.createElement(SectionHeading, { title: "5. Market Analysis" }),
      React.createElement(DataRow, { label: "Typical Value per Acre in Your Area", value: String(market.medianPricePerAcre) }),
      React.createElement(DataRow, { label: "Market Trend", value: String(market.trendDirection) }),
      React.createElement(DataRow, { label: "Similar Properties Sold Recently", value: String(market.comparableSalesCount) }),
      // Comps table
      ...(comps.length > 0
        ? [
            React.createElement(View, { style: styles.tableHeader, key: "comp-header" },
              React.createElement(Text, { style: { ...styles.tableHeaderCell, width: 160 } }, "Address"),
              React.createElement(Text, { style: { ...styles.tableHeaderCell, width: 70 } }, "Sale Date"),
              React.createElement(Text, { style: { ...styles.tableHeaderCell, width: 70 } }, "Price"),
              React.createElement(Text, { style: { ...styles.tableHeaderCell, width: 50 } }, "Acres"),
              React.createElement(Text, { style: { ...styles.tableHeaderCell, width: 70 } }, "Value/Acre")
            ),
            ...comps.map((comp, i) =>
              React.createElement(View, { style: styles.tableRow, key: `comp-${i}` },
                React.createElement(Text, { style: { ...styles.tableCell, width: 160 } }, String(comp.address)),
                React.createElement(Text, { style: { ...styles.tableCell, width: 70 } }, String(comp.saleDate)),
                React.createElement(Text, { style: { ...styles.tableCell, width: 70 } }, String(comp.price)),
                React.createElement(Text, { style: { ...styles.tableCell, width: 50 } }, String(comp.acreage)),
                React.createElement(Text, { style: { ...styles.tableCell, width: 70 } }, String(comp.pricePerAcre))
              )
            ),
          ]
        : [React.createElement(Text, { style: { fontSize: 9, color: "#6b7280", marginTop: 4 }, key: "no-comps" }, "No comparable sales data available.")]),

      // Charts placeholder
      React.createElement(View, { style: styles.mapPlaceholder },
        React.createElement(Text, { style: styles.mapPlaceholderText }, "[ Market Trends Chart - Coming Soon ]")
      ),

      React.createElement(SectionHeading, { title: "6. Property Value Summary" }),
      React.createElement(View, { style: styles.highlightBox },
        React.createElement(Text, { style: styles.highlightValue }, String(val.estimatedValue)),
        React.createElement(Text, { style: styles.highlightLabel },
          confidenceRange
            ? `Estimated Range: ${confidenceRange.low} - ${confidenceRange.high} (${val.confidenceScore} confidence)`
            : `Confidence: ${val.confidenceScore}`
        )
      ),
      React.createElement(DataRow, { label: "Value per Acre", value: String(val.pricePerAcre) }),
      React.createElement(DataRow, { label: "How We Estimated This", value: String(val.methodologyDescription) }),
      ...(val.ownerGuidance
        ? [React.createElement(View, { style: { marginTop: 8 }, key: "owner-guidance" },
            React.createElement(Text, { style: { fontSize: 9, color: "#374151", lineHeight: 1.4 } }, String(val.ownerGuidance))
          )]
        : []),

      // Wilco Land CTA
      React.createElement(View, { style: styles.ctaBox },
        React.createElement(Text, { style: styles.ctaHeadline }, String(cta.headline)),
        React.createElement(Text, { style: styles.ctaDescription }, String(cta.description)),
        ...benefits.map((b, i) =>
          React.createElement(Text, { style: styles.ctaBullet, key: `benefit-${i}` }, `  \u2022  ${b}`)
        ),
        React.createElement(Text, {
          style: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#166534", marginTop: 8 },
        }, `Visit: ${cta.ctaUrl}`)
      ),
      // Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, null, "Super Plot Property Report"),
        React.createElement(Text, null, `Page 3 | ${report.orderId}`)
      )
    )
  );
}

// ─── PDF Generation ────────────────────────────────��────────────────────────

export interface PdfResult {
  filePath: string;
  fileSize: number;
  pdfUrl: string;
}

/**
 * Render an assembled report to PDF and store it locally.
 * Returns the file path, size, and URL for the generated PDF.
 *
 * TODO: Replace local storage with S3 upload for production.
 */
export async function generatePdf(report: AssembledReport): Promise<PdfResult> {
  const startTime = Date.now();

  // Render PDF to buffer
  const doc = React.createElement(ReportDocument, { report });
  const buffer = await renderToBuffer(doc as React.ReactElement);

  // Store locally — uploads/reports/{orderId}/report.pdf
  const uploadsDir = path.join(process.cwd(), "uploads", "reports", report.orderId);
  await mkdir(uploadsDir, { recursive: true });

  const filePath = path.join(uploadsDir, "report.pdf");
  await writeFile(filePath, buffer);

  // For MVP, use a placeholder URL pattern.
  // In production this would be an S3 presigned URL.
  const pdfUrl = `https://storage.superplot.com/reports/${report.orderId}/report.pdf`;

  const durationMs = Date.now() - startTime;
  console.log(
    `[pdf-generator] Generated PDF for order ${report.orderId} (${buffer.length} bytes) in ${durationMs}ms`
  );

  return {
    filePath,
    fileSize: buffer.length,
    pdfUrl,
  };
}
