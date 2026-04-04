/**
 * Report Assembly Service
 *
 * Combines enriched pipeline data (parcel, environmental, market, valuation)
 * into a structured report JSON with all required sections.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ParcelData {
  parcelId: string;
  apn: string;
  address: string;
  lat?: number;
  lng?: number;
  acreage?: number;
  zoning?: string;
  legalDescription?: string;
  county?: string;
  state?: string;
}

export interface OwnerInfo {
  name?: string;
  mailingAddress?: string;
  ownershipType?: string;
  deedDate?: string;
}

export interface EnvironmentalData {
  floodZone: string;
  wetlands: boolean;
  contamination: string;
  endangered_species: boolean;
  soilType?: string;
  hazards?: string[];
}

export interface ComparableSale {
  address: string;
  saleDate: string;
  price: number;
  acreage: number;
  pricePerAcre: number;
}

export interface MarketData {
  comparables: ComparableSale[];
  medianPricePerAcre: number;
  trendDirection: "up" | "down" | "stable";
}

export interface ValuationData {
  estimatedValue: number;
  confidenceScore: number;
  methodology: string;
  pricePerAcre: number;
  confidenceLow?: number;
  confidenceHigh?: number;
}

export type ReportTier = "free" | "basic" | "professional" | "premium";

export interface ReportSection {
  title: string;
  content: Record<string, unknown>;
}

export interface AssembledReport {
  title: string;
  tier: ReportTier;
  orderId: string;
  generatedAt: string;
  sections: {
    executiveSummary: ReportSection;
    parcelDetails: ReportSection;
    ownerInformation: ReportSection;
    environmentalAssessment: ReportSection;
    marketAnalysis: ReportSection;
    valuation: ReportSection;
    wilcoLandCta: ReportSection;
  };
}

// ─── Assembly Input ─────────────────────────────────────────────────────────

export interface AssemblyInput {
  orderId: string;
  tier: ReportTier;
  parcelInput: string;
  parcel: ParcelData;
  environmental: EnvironmentalData;
  market: MarketData;
  valuation: ValuationData;
  owner?: OwnerInfo;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function formatCurrencyDollars(dollars: number): string {
  return `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function environmentalRiskLevel(env: EnvironmentalData): "low" | "moderate" | "high" {
  let risk = 0;
  if (env.floodZone !== "X" && env.floodZone !== "C") risk += 2;
  if (env.wetlands) risk += 2;
  if (env.contamination !== "none") risk += 3;
  if (env.endangered_species) risk += 1;
  if (risk >= 4) return "high";
  if (risk >= 2) return "moderate";
  return "low";
}

function buildExecutiveSummary(input: AssemblyInput): ReportSection {
  const { parcel, environmental, market, valuation: val } = input;
  const riskLevel = environmentalRiskLevel(environmental);

  const confidenceLow = val.confidenceLow ?? Math.round(val.estimatedValue * 0.85);
  const confidenceHigh = val.confidenceHigh ?? Math.round(val.estimatedValue * 1.15);

  return {
    title: "Executive Summary",
    content: {
      propertyAddress: parcel.address,
      apn: parcel.apn,
      acreage: parcel.acreage ?? "Not available",
      zoning: parcel.zoning ?? "Not available",
      estimatedValue: formatCurrencyDollars(val.estimatedValue),
      valueRange: `${formatCurrencyDollars(confidenceLow)} - ${formatCurrencyDollars(confidenceHigh)}`,
      confidenceScore: `${Math.round(val.confidenceScore * 100)}%`,
      environmentalRisk: riskLevel,
      marketTrend: market.trendDirection,
      comparableSalesCount: market.comparables.length,
    },
  };
}

function buildParcelDetails(input: AssemblyInput): ReportSection {
  const { parcel } = input;
  return {
    title: "Parcel Details",
    content: {
      parcelId: parcel.parcelId,
      apn: parcel.apn,
      address: parcel.address,
      county: parcel.county ?? "Not available",
      state: parcel.state ?? "Not available",
      acreage: parcel.acreage ?? "Not available",
      zoning: parcel.zoning ?? "Not available",
      legalDescription: parcel.legalDescription ?? "Not available",
      coordinates:
        parcel.lat && parcel.lng
          ? { latitude: parcel.lat, longitude: parcel.lng }
          : "Not available",
    },
  };
}

function buildOwnerInformation(input: AssemblyInput): ReportSection {
  const owner = input.owner;
  return {
    title: "Owner Information",
    content: {
      name: owner?.name ?? "Not available",
      mailingAddress: owner?.mailingAddress ?? "Not available",
      ownershipType: owner?.ownershipType ?? "Not available",
      deedDate: owner?.deedDate ?? "Not available",
    },
  };
}

function buildEnvironmentalAssessment(input: AssemblyInput): ReportSection {
  const { environmental } = input;
  return {
    title: "Environmental Assessment",
    content: {
      floodZone: environmental.floodZone,
      floodZoneDescription: describeFloodZone(environmental.floodZone),
      wetlandsPresent: environmental.wetlands,
      soilType: environmental.soilType ?? "Not assessed",
      contamination: environmental.contamination,
      endangeredSpecies: environmental.endangered_species,
      hazards: environmental.hazards ?? [],
      overallRisk: environmentalRiskLevel(environmental),
    },
  };
}

function describeFloodZone(zone: string): string {
  const descriptions: Record<string, string> = {
    X: "Minimal flood hazard - outside 500-year floodplain",
    C: "Minimal flood hazard - outside 500-year floodplain",
    B: "Moderate flood hazard - between 100-year and 500-year floodplain",
    A: "High flood hazard - within 100-year floodplain",
    AE: "High flood hazard - within 100-year floodplain with base flood elevations",
    V: "High flood hazard - coastal area with wave action",
    VE: "High flood hazard - coastal area with wave action and base flood elevations",
  };
  return descriptions[zone.toUpperCase()] ?? `Flood zone ${zone} - consult local floodplain maps`;
}

function buildMarketAnalysis(input: AssemblyInput): ReportSection {
  const { market } = input;
  return {
    title: "Market Analysis",
    content: {
      medianPricePerAcre: formatCurrencyDollars(market.medianPricePerAcre),
      trendDirection: market.trendDirection,
      trendDescription: describeTrend(market.trendDirection),
      comparableSalesCount: market.comparables.length,
      comparableSales: market.comparables.map((comp) => ({
        address: comp.address,
        saleDate: comp.saleDate,
        price: formatCurrencyDollars(comp.price),
        acreage: comp.acreage,
        pricePerAcre: formatCurrencyDollars(comp.pricePerAcre),
      })),
    },
  };
}

function describeTrend(direction: "up" | "down" | "stable"): string {
  const descriptions: Record<string, string> = {
    up: "Values in your area have been rising — comparable properties are selling for more than they did 6-12 months ago.",
    down: "Values in your area have been softening — comparable properties are selling for less than they did 6-12 months ago.",
    stable: "Values in your area have held steady — comparable properties are selling at similar prices to 6-12 months ago.",
  };
  return descriptions[direction] ?? `Market trend: ${direction}`;
}

function buildValuation(input: AssemblyInput): ReportSection {
  const { valuation: val } = input;
  const confidenceLow = val.confidenceLow ?? Math.round(val.estimatedValue * 0.85);
  const confidenceHigh = val.confidenceHigh ?? Math.round(val.estimatedValue * 1.15);

  return {
    title: "Property Value Summary",
    content: {
      estimatedValue: formatCurrencyDollars(val.estimatedValue),
      confidenceRange: {
        low: formatCurrencyDollars(confidenceLow),
        high: formatCurrencyDollars(confidenceHigh),
      },
      confidenceScore: `${Math.round(val.confidenceScore * 100)}%`,
      pricePerAcre: formatCurrencyDollars(val.pricePerAcre),
      methodology: val.methodology,
      methodologyDescription: describeMethodology(val.methodology),
      ownerGuidance: buildOwnerGuidance(val, input.market),
    },
  };
}

function describeMethodology(method: string): string {
  const descriptions: Record<string, string> = {
    comparable_sales:
      "Your property's value was estimated by analyzing recent sales of similar properties nearby, adjusted for your parcel's specific characteristics like size, location, and environmental factors.",
    income_approach:
      "Your property's value was estimated based on the potential income the land could generate, such as from leasing, agriculture, or development.",
    cost_approach:
      "Your property's value was estimated based on what it would cost to acquire equivalent land in today's market.",
  };
  return descriptions[method] ?? `Valuation approach: ${method}`;
}

function buildOwnerGuidance(val: ValuationData, market: MarketData): string {
  const parts: string[] = [];
  if (market.trendDirection === "up") {
    parts.push("Property values in your area are trending upward, which may work in your favor for a sale or tax appeal.");
  } else if (market.trendDirection === "down") {
    parts.push("Property values in your area have been declining, which may strengthen a property tax appeal if your assessed value seems high.");
  } else {
    parts.push("Property values in your area have been stable.");
  }
  if (val.confidenceScore >= 0.8) {
    parts.push("This estimate is based on strong comparable data and should give you a reliable baseline for decisions about your property.");
  } else if (val.confidenceScore >= 0.5) {
    parts.push("This estimate is based on moderate comparable data. Consider getting a professional appraisal for high-stakes decisions like selling or tax appeals.");
  } else {
    parts.push("Limited comparable data was available for this estimate. We recommend a professional appraisal for important decisions.");
  }
  return parts.join(" ");
}

function buildWilcoLandCta(_input: AssemblyInput): ReportSection {
  return {
    title: "Next Steps & Property Services",
    content: {
      headline: "Need help with your property?",
      description:
        "Whether you're exploring a sale, challenging your tax assessment, or planning your next move, our services marketplace connects you with trusted professionals who specialize in vacant land.",
      benefits: [
        "Property tax appeal assistance",
        "Professional appraisal referrals",
        "Title search and deed review",
        "Land surveying services",
        "Cash offer if you decide to sell",
      ],
      ctaText: "Explore Property Services",
      ctaUrl: "https://superplot.com/services",
    },
  };
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validateSections(report: AssembledReport): string[] {
  const errors: string[] = [];
  const requiredSections = [
    "executiveSummary",
    "parcelDetails",
    "ownerInformation",
    "environmentalAssessment",
    "marketAnalysis",
    "valuation",
    "wilcoLandCta",
  ] as const;

  for (const key of requiredSections) {
    if (!report.sections[key]) {
      errors.push(`Missing required section: ${key}`);
    }
  }

  return errors;
}

// ─── Main Assembly Function ─────────────────────────────────────────────────

export async function assembleReport(input: AssemblyInput): Promise<AssembledReport> {
  const startTime = Date.now();

  const address = input.parcel.address ?? input.parcelInput;
  const tierLabels: Record<string, string> = {
    free: "Basic",
    basic: "Standard",
    professional: "Detailed",
    premium: "Complete",
  };
  const tierLabel = tierLabels[input.tier] ?? input.tier.charAt(0).toUpperCase() + input.tier.slice(1);
  const title = `Your ${tierLabel} Property Report — ${address}`;

  const report: AssembledReport = {
    title,
    tier: input.tier,
    orderId: input.orderId,
    generatedAt: new Date().toISOString(),
    sections: {
      executiveSummary: buildExecutiveSummary(input),
      parcelDetails: buildParcelDetails(input),
      ownerInformation: buildOwnerInformation(input),
      environmentalAssessment: buildEnvironmentalAssessment(input),
      marketAnalysis: buildMarketAnalysis(input),
      valuation: buildValuation(input),
      wilcoLandCta: buildWilcoLandCta(input),
    },
  };

  const errors = validateSections(report);
  if (errors.length > 0) {
    throw new Error(`Report validation failed: ${errors.join(", ")}`);
  }

  const durationMs = Date.now() - startTime;
  console.log(`[report-assembly] Assembled report for order ${input.orderId} in ${durationMs}ms`);

  return report;
}
