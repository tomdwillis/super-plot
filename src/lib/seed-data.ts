/**
 * Seed Data — Realistic Texas parcels for beta demo
 *
 * Contains 12 parcels across Williamson, Travis, and Hays counties with
 * varied land types (rural, suburban, agricultural). Each parcel includes
 * realistic enrichment data so reports look production-quality.
 */

import type {
  ParcelData,
  EnvironmentalData,
  MarketData,
  ValuationData,
  ComparableSale,
} from "@/lib/services/report-assembly";

export interface SeedParcel {
  parcel: ParcelData;
  environmental: EnvironmentalData;
  market: MarketData;
  valuation: ValuationData;
  isSeedData: true;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function comp(
  address: string,
  saleDate: string,
  price: number,
  acreage: number
): ComparableSale {
  return {
    address,
    saleDate,
    price,
    acreage,
    pricePerAcre: Math.round(price / acreage),
  };
}

function valuationFromComps(
  comps: ComparableSale[],
  acreage: number,
  confidence: number,
  methodology = "comparable_sales"
): ValuationData {
  const medianPPA =
    comps.length > 0
      ? comps
          .map((c) => c.pricePerAcre)
          .sort((a, b) => a - b)
          [Math.floor(comps.length / 2)]
      : 5000;
  const estimatedValue = Math.round(medianPPA * acreage);
  const confidenceLow = Math.round(estimatedValue * (1 - (1 - confidence) * 1.2));
  const confidenceHigh = Math.round(estimatedValue * (1 + (1 - confidence) * 1.2));

  return {
    estimatedValue,
    confidenceScore: confidence,
    methodology,
    pricePerAcre: medianPPA,
    confidenceLow,
    confidenceHigh,
  };
}

// ─── Seed Parcels ──────────────────────────────────────────────────────────

const SEED_PARCELS: SeedParcel[] = [
  // 1. Williamson County — suburban lot near Round Rock
  {
    parcel: {
      parcelId: "wilco-001",
      apn: "R071234",
      address: "1420 Sam Bass Rd, Round Rock, TX 78681",
      lat: 30.5217,
      lng: -97.6789,
      acreage: 2.3,
      zoning: "SF-1 (Single Family Residential)",
      legalDescription: "Lot 14, Block C, Brushy Creek Estates, Williamson County, TX",
      county: "Williamson",
      state: "TX",
    },
    environmental: {
      floodZone: "X",
      wetlands: false,
      contamination: "none",
      endangered_species: false,
      soilType: "Houston Black Clay",
      hazards: [],
    },
    market: {
      comparables: [
        comp("1502 Sam Bass Rd, Round Rock, TX", "2025-11-14", 185000, 2.1),
        comp("3210 CR 172, Round Rock, TX", "2025-09-22", 210000, 2.5),
        comp("801 Brushy Creek Trl, Round Rock, TX", "2026-01-08", 195000, 2.0),
        comp("4100 Double Creek Dr, Round Rock, TX", "2025-10-30", 230000, 2.8),
      ],
      medianPricePerAcre: 90000,
      trendDirection: "up",
    },
    valuation: valuationFromComps(
      [
        comp("1502 Sam Bass Rd, Round Rock, TX", "2025-11-14", 185000, 2.1),
        comp("3210 CR 172, Round Rock, TX", "2025-09-22", 210000, 2.5),
        comp("801 Brushy Creek Trl, Round Rock, TX", "2026-01-08", 195000, 2.0),
        comp("4100 Double Creek Dr, Round Rock, TX", "2025-10-30", 230000, 2.8),
      ],
      2.3,
      0.87
    ),
    isSeedData: true,
  },

  // 2. Travis County — rural acreage east of Austin
  {
    parcel: {
      parcelId: "travis-001",
      apn: "01-4520-0300",
      address: "14800 FM 969, Austin, TX 78724",
      lat: 30.3102,
      lng: -97.5841,
      acreage: 18.5,
      zoning: "RR (Rural Residential)",
      legalDescription: "18.5 acres out of the J. Hornsby Survey, Abstract 390, Travis County, TX",
      county: "Travis",
      state: "TX",
    },
    environmental: {
      floodZone: "AE",
      wetlands: true,
      contamination: "none",
      endangered_species: false,
      soilType: "Lewisville Silty Clay",
      hazards: ["Seasonal creek flooding along south boundary"],
    },
    market: {
      comparables: [
        comp("15200 FM 969, Austin, TX", "2025-08-15", 425000, 20.0),
        comp("12900 Decker Ln, Austin, TX", "2025-12-03", 380000, 15.2),
        comp("11400 Lindell Ln, Austin, TX", "2026-02-18", 510000, 22.0),
        comp("16700 FM 969, Austin, TX", "2025-10-11", 340000, 16.8),
        comp("13200 Cele Rd, Austin, TX", "2025-07-28", 295000, 12.5),
      ],
      medianPricePerAcre: 22000,
      trendDirection: "up",
    },
    valuation: valuationFromComps(
      [
        comp("15200 FM 969, Austin, TX", "2025-08-15", 425000, 20.0),
        comp("12900 Decker Ln, Austin, TX", "2025-12-03", 380000, 15.2),
        comp("11400 Lindell Ln, Austin, TX", "2026-02-18", 510000, 22.0),
        comp("16700 FM 969, Austin, TX", "2025-10-11", 340000, 16.8),
        comp("13200 Cele Rd, Austin, TX", "2025-07-28", 295000, 12.5),
      ],
      18.5,
      0.82
    ),
    isSeedData: true,
  },

  // 3. Hays County — agricultural land near Buda
  {
    parcel: {
      parcelId: "hays-001",
      apn: "R32456",
      address: "2100 Onion Creek Dr, Buda, TX 78610",
      lat: 30.0812,
      lng: -97.8543,
      acreage: 45.0,
      zoning: "AG (Agricultural)",
      legalDescription: "45 acres, S. Craft Survey, Abstract 135, Hays County, TX",
      county: "Hays",
      state: "TX",
    },
    environmental: {
      floodZone: "A",
      wetlands: true,
      contamination: "none",
      endangered_species: true,
      soilType: "Purves-Brackett Association",
      hazards: ["Onion Creek 100-year floodplain", "Golden-cheeked warbler habitat (seasonal)"],
    },
    market: {
      comparables: [
        comp("3400 FM 1626, Buda, TX", "2025-09-10", 675000, 50.0),
        comp("1800 Turnersville Rd, Buda, TX", "2025-11-20", 585000, 40.0),
        comp("5500 Old Black Colony Rd, Buda, TX", "2026-01-15", 480000, 35.0),
        comp("2700 Hillside Terrace, Buda, TX", "2025-06-04", 720000, 52.0),
      ],
      medianPricePerAcre: 13700,
      trendDirection: "stable",
    },
    valuation: valuationFromComps(
      [
        comp("3400 FM 1626, Buda, TX", "2025-09-10", 675000, 50.0),
        comp("1800 Turnersville Rd, Buda, TX", "2025-11-20", 585000, 40.0),
        comp("5500 Old Black Colony Rd, Buda, TX", "2026-01-15", 480000, 35.0),
        comp("2700 Hillside Terrace, Buda, TX", "2025-06-04", 720000, 52.0),
      ],
      45.0,
      0.78
    ),
    isSeedData: true,
  },

  // 4. Williamson County — small ranch tract near Liberty Hill
  {
    parcel: {
      parcelId: "wilco-002",
      apn: "R098765",
      address: "8300 CR 200, Liberty Hill, TX 78642",
      lat: 30.6634,
      lng: -97.9211,
      acreage: 25.0,
      zoning: "AG (Agricultural)",
      legalDescription: "25 acres, J. Berry Survey, Abstract 56, Williamson County, TX",
      county: "Williamson",
      state: "TX",
    },
    environmental: {
      floodZone: "X",
      wetlands: false,
      contamination: "none",
      endangered_species: false,
      soilType: "Doss-Real Complex",
      hazards: [],
    },
    market: {
      comparables: [
        comp("7500 CR 200, Liberty Hill, TX", "2025-10-05", 475000, 22.0),
        comp("9100 Ronald Reagan Blvd, Liberty Hill, TX", "2025-12-19", 540000, 25.0),
        comp("6800 CR 214, Liberty Hill, TX", "2026-02-01", 625000, 30.0),
        comp("11200 Hero Way, Liberty Hill, TX", "2025-08-30", 410000, 20.0),
      ],
      medianPricePerAcre: 21000,
      trendDirection: "up",
    },
    valuation: valuationFromComps(
      [
        comp("7500 CR 200, Liberty Hill, TX", "2025-10-05", 475000, 22.0),
        comp("9100 Ronald Reagan Blvd, Liberty Hill, TX", "2025-12-19", 540000, 25.0),
        comp("6800 CR 214, Liberty Hill, TX", "2026-02-01", 625000, 30.0),
        comp("11200 Hero Way, Liberty Hill, TX", "2025-08-30", 410000, 20.0),
      ],
      25.0,
      0.84
    ),
    isSeedData: true,
  },

  // 5. Travis County — small infill lot in Del Valle
  {
    parcel: {
      parcelId: "travis-002",
      apn: "02-8810-0150",
      address: "4200 Elroy Rd, Del Valle, TX 78617",
      lat: 30.1654,
      lng: -97.6678,
      acreage: 0.75,
      zoning: "SF-2 (Single Family Residential)",
      legalDescription: "Lot 8, Elroy Oaks Subdivision, Travis County, TX",
      county: "Travis",
      state: "TX",
    },
    environmental: {
      floodZone: "X",
      wetlands: false,
      contamination: "none",
      endangered_species: false,
      soilType: "Houston Black Clay",
      hazards: [],
    },
    market: {
      comparables: [
        comp("4120 Elroy Rd, Del Valle, TX", "2025-11-02", 82000, 0.7),
        comp("4500 Ross Rd, Del Valle, TX", "2025-12-14", 95000, 0.8),
        comp("3800 Elroy Rd, Del Valle, TX", "2026-01-27", 78000, 0.65),
      ],
      medianPricePerAcre: 115000,
      trendDirection: "up",
    },
    valuation: valuationFromComps(
      [
        comp("4120 Elroy Rd, Del Valle, TX", "2025-11-02", 82000, 0.7),
        comp("4500 Ross Rd, Del Valle, TX", "2025-12-14", 95000, 0.8),
        comp("3800 Elroy Rd, Del Valle, TX", "2026-01-27", 78000, 0.65),
      ],
      0.75,
      0.85
    ),
    isSeedData: true,
  },

  // 6. Hays County — hill country lot near Dripping Springs
  {
    parcel: {
      parcelId: "hays-002",
      apn: "R45678",
      address: "500 Fitzhugh Rd, Dripping Springs, TX 78620",
      lat: 30.2156,
      lng: -98.0912,
      acreage: 10.0,
      zoning: "RR-1 (Rural Residential)",
      legalDescription: "10 acres, A. Erskine Survey, Abstract 172, Hays County, TX",
      county: "Hays",
      state: "TX",
    },
    environmental: {
      floodZone: "X",
      wetlands: false,
      contamination: "none",
      endangered_species: true,
      soilType: "Comfort-Rumple Association",
      hazards: ["Golden-cheeked warbler nesting habitat (USFWS)"],
    },
    market: {
      comparables: [
        comp("700 Fitzhugh Rd, Dripping Springs, TX", "2025-09-28", 450000, 10.5),
        comp("1200 Mt Gainor Rd, Dripping Springs, TX", "2025-11-15", 520000, 12.0),
        comp("300 Bell Springs Rd, Dripping Springs, TX", "2026-01-22", 380000, 8.5),
        comp("900 Creek Rd, Dripping Springs, TX", "2025-07-10", 490000, 11.0),
      ],
      medianPricePerAcre: 43500,
      trendDirection: "up",
    },
    valuation: valuationFromComps(
      [
        comp("700 Fitzhugh Rd, Dripping Springs, TX", "2025-09-28", 450000, 10.5),
        comp("1200 Mt Gainor Rd, Dripping Springs, TX", "2025-11-15", 520000, 12.0),
        comp("300 Bell Springs Rd, Dripping Springs, TX", "2026-01-22", 380000, 8.5),
        comp("900 Creek Rd, Dripping Springs, TX", "2025-07-10", 490000, 11.0),
      ],
      10.0,
      0.81
    ),
    isSeedData: true,
  },

  // 7. Williamson County — commercial pad near Georgetown
  {
    parcel: {
      parcelId: "wilco-003",
      apn: "R112233",
      address: "1900 Williams Dr, Georgetown, TX 78628",
      lat: 30.6517,
      lng: -97.6923,
      acreage: 1.2,
      zoning: "C-1 (Local Commercial)",
      legalDescription: "Lot 3, Block A, Williams Drive Commercial Park, Williamson County, TX",
      county: "Williamson",
      state: "TX",
    },
    environmental: {
      floodZone: "X",
      wetlands: false,
      contamination: "none",
      endangered_species: false,
      soilType: "Austin Chalk",
      hazards: [],
    },
    market: {
      comparables: [
        comp("2100 Williams Dr, Georgetown, TX", "2025-10-12", 540000, 1.1),
        comp("1600 Williams Dr, Georgetown, TX", "2025-08-20", 620000, 1.4),
        comp("2500 Shell Rd, Georgetown, TX", "2025-12-05", 480000, 1.0),
        comp("1200 Leander Rd, Georgetown, TX", "2026-02-14", 575000, 1.25),
      ],
      medianPricePerAcre: 470000,
      trendDirection: "up",
    },
    valuation: valuationFromComps(
      [
        comp("2100 Williams Dr, Georgetown, TX", "2025-10-12", 540000, 1.1),
        comp("1600 Williams Dr, Georgetown, TX", "2025-08-20", 620000, 1.4),
        comp("2500 Shell Rd, Georgetown, TX", "2025-12-05", 480000, 1.0),
        comp("1200 Leander Rd, Georgetown, TX", "2026-02-14", 575000, 1.25),
      ],
      1.2,
      0.89
    ),
    isSeedData: true,
  },

  // 8. Travis County — acreage near Manor
  {
    parcel: {
      parcelId: "travis-003",
      apn: "01-6700-0420",
      address: "11600 FM 973, Manor, TX 78653",
      lat: 30.3891,
      lng: -97.5234,
      acreage: 32.0,
      zoning: "AG (Agricultural)",
      legalDescription: "32 acres, T. Gazley Survey, Abstract 307, Travis County, TX",
      county: "Travis",
      state: "TX",
    },
    environmental: {
      floodZone: "X",
      wetlands: false,
      contamination: "none",
      endangered_species: false,
      soilType: "Houston Black Clay",
      hazards: [],
    },
    market: {
      comparables: [
        comp("12400 FM 973, Manor, TX", "2025-08-22", 640000, 28.0),
        comp("10500 Cele Rd, Manor, TX", "2025-11-10", 780000, 35.0),
        comp("9800 Parmer Ln E, Manor, TX", "2026-01-05", 560000, 24.0),
        comp("13100 Cameron Rd, Manor, TX", "2025-09-18", 700000, 30.0),
        comp("8500 Decker Ln, Manor, TX", "2025-07-02", 520000, 22.5),
      ],
      medianPricePerAcre: 23000,
      trendDirection: "stable",
    },
    valuation: valuationFromComps(
      [
        comp("12400 FM 973, Manor, TX", "2025-08-22", 640000, 28.0),
        comp("10500 Cele Rd, Manor, TX", "2025-11-10", 780000, 35.0),
        comp("9800 Parmer Ln E, Manor, TX", "2026-01-05", 560000, 24.0),
        comp("13100 Cameron Rd, Manor, TX", "2025-09-18", 700000, 30.0),
        comp("8500 Decker Ln, Manor, TX", "2025-07-02", 520000, 22.5),
      ],
      32.0,
      0.86
    ),
    isSeedData: true,
  },

  // 9. Hays County — large ranch near Wimberley
  {
    parcel: {
      parcelId: "hays-003",
      apn: "R78901",
      address: "3200 RR 12, Wimberley, TX 78676",
      lat: 29.9945,
      lng: -98.0987,
      acreage: 85.0,
      zoning: "AG (Agricultural)",
      legalDescription: "85 acres, J. Brown Survey, Abstract 41, Hays County, TX",
      county: "Hays",
      state: "TX",
    },
    environmental: {
      floodZone: "AE",
      wetlands: true,
      contamination: "none",
      endangered_species: true,
      soilType: "Brackett-Comfort Association",
      hazards: [
        "Blanco River 100-year floodplain (north 12 acres)",
        "Golden-cheeked warbler habitat",
        "Karst features — Edwards Aquifer recharge zone",
      ],
    },
    market: {
      comparables: [
        comp("4100 RR 12, Wimberley, TX", "2025-10-25", 1190000, 90.0),
        comp("2800 Woodcreek Dr, Wimberley, TX", "2025-08-14", 950000, 72.0),
        comp("1500 Mt Sharp Rd, Wimberley, TX", "2026-02-06", 1050000, 80.0),
      ],
      medianPricePerAcre: 13200,
      trendDirection: "stable",
    },
    valuation: valuationFromComps(
      [
        comp("4100 RR 12, Wimberley, TX", "2025-10-25", 1190000, 90.0),
        comp("2800 Woodcreek Dr, Wimberley, TX", "2025-08-14", 950000, 72.0),
        comp("1500 Mt Sharp Rd, Wimberley, TX", "2026-02-06", 1050000, 80.0),
      ],
      85.0,
      0.74
    ),
    isSeedData: true,
  },

  // 10. Williamson County — ranchette near Granger
  {
    parcel: {
      parcelId: "wilco-004",
      apn: "R334455",
      address: "5600 CR 346, Granger, TX 76530",
      lat: 30.7234,
      lng: -97.4412,
      acreage: 60.0,
      zoning: "AG (Agricultural)",
      legalDescription: "60 acres, M. Lynch Survey, Abstract 403, Williamson County, TX",
      county: "Williamson",
      state: "TX",
    },
    environmental: {
      floodZone: "X",
      wetlands: false,
      contamination: "none",
      endangered_species: false,
      soilType: "Houston Black Clay",
      hazards: [],
    },
    market: {
      comparables: [
        comp("6200 CR 346, Granger, TX", "2025-09-14", 540000, 55.0),
        comp("4100 FM 971, Granger, TX", "2025-11-28", 660000, 65.0),
        comp("7800 CR 352, Granger, TX", "2026-01-18", 500000, 50.0),
        comp("3300 SH 95, Granger, TX", "2025-07-22", 720000, 70.0),
      ],
      medianPricePerAcre: 10000,
      trendDirection: "down",
    },
    valuation: valuationFromComps(
      [
        comp("6200 CR 346, Granger, TX", "2025-09-14", 540000, 55.0),
        comp("4100 FM 971, Granger, TX", "2025-11-28", 660000, 65.0),
        comp("7800 CR 352, Granger, TX", "2026-01-18", 500000, 50.0),
        comp("3300 SH 95, Granger, TX", "2025-07-22", 720000, 70.0),
      ],
      60.0,
      0.80
    ),
    isSeedData: true,
  },

  // 11. Travis County — Lakefront lot on Lake Travis
  {
    parcel: {
      parcelId: "travis-004",
      apn: "01-2200-0075",
      address: "18900 Lakewood Dr, Jonestown, TX 78645",
      lat: 30.4812,
      lng: -97.9234,
      acreage: 3.5,
      zoning: "LR (Lake Residential)",
      legalDescription: "Lot 22, Lakewood Estates, Travis County, TX",
      county: "Travis",
      state: "TX",
    },
    environmental: {
      floodZone: "AE",
      wetlands: false,
      contamination: "none",
      endangered_species: false,
      soilType: "Speck Stony Clay Loam",
      hazards: ["Lake Travis FEMA floodplain — lower 0.8 acres"],
    },
    market: {
      comparables: [
        comp("19200 Lakewood Dr, Jonestown, TX", "2025-10-08", 520000, 3.2),
        comp("18400 Marina Dr, Jonestown, TX", "2025-12-22", 480000, 3.0),
        comp("20100 Lakeshore Dr, Jonestown, TX", "2026-02-10", 610000, 4.0),
        comp("17900 Laguna Dr, Jonestown, TX", "2025-08-05", 550000, 3.8),
      ],
      medianPricePerAcre: 150000,
      trendDirection: "up",
    },
    valuation: valuationFromComps(
      [
        comp("19200 Lakewood Dr, Jonestown, TX", "2025-10-08", 520000, 3.2),
        comp("18400 Marina Dr, Jonestown, TX", "2025-12-22", 480000, 3.0),
        comp("20100 Lakeshore Dr, Jonestown, TX", "2026-02-10", 610000, 4.0),
        comp("17900 Laguna Dr, Jonestown, TX", "2025-08-05", 550000, 3.8),
      ],
      3.5,
      0.83
    ),
    isSeedData: true,
  },

  // 12. Hays County — suburban lot in Kyle
  {
    parcel: {
      parcelId: "hays-004",
      apn: "R55667",
      address: "200 Marketplace Ave, Kyle, TX 78640",
      lat: 29.9923,
      lng: -97.8756,
      acreage: 0.5,
      zoning: "SF-6 (Single Family Residential)",
      legalDescription: "Lot 45, Plum Creek Phase 4, Hays County, TX",
      county: "Hays",
      state: "TX",
    },
    environmental: {
      floodZone: "X",
      wetlands: false,
      contamination: "none",
      endangered_species: false,
      soilType: "Houston Black Clay",
      hazards: [],
    },
    market: {
      comparables: [
        comp("210 Marketplace Ave, Kyle, TX", "2025-11-18", 62000, 0.5),
        comp("150 Rebel Dr, Kyle, TX", "2025-09-30", 58000, 0.45),
        comp("340 Amberwood Dr, Kyle, TX", "2026-01-12", 68000, 0.55),
        comp("120 Goforth Rd, Kyle, TX", "2025-08-25", 55000, 0.42),
      ],
      medianPricePerAcre: 122000,
      trendDirection: "up",
    },
    valuation: valuationFromComps(
      [
        comp("210 Marketplace Ave, Kyle, TX", "2025-11-18", 62000, 0.5),
        comp("150 Rebel Dr, Kyle, TX", "2025-09-30", 58000, 0.45),
        comp("340 Amberwood Dr, Kyle, TX", "2026-01-12", 68000, 0.55),
        comp("120 Goforth Rd, Kyle, TX", "2025-08-25", 55000, 0.42),
      ],
      0.5,
      0.88
    ),
    isSeedData: true,
  },
];

// ─── Lookup ────────────────────────────────────────────────────────────────

/** Normalize address for fuzzy matching: lowercase, strip punctuation, collapse whitespace */
function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/[.,#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Look up a seed parcel by APN or address.
 * Returns the full seed record if found, or null for unknown parcels.
 */
export function findSeedParcel(
  input: string,
  inputType: "apn" | "address"
): SeedParcel | null {
  if (inputType === "apn") {
    return (
      SEED_PARCELS.find(
        (s) => s.parcel.apn.toLowerCase() === input.toLowerCase()
      ) ?? null
    );
  }

  const normalized = normalizeAddress(input);
  return (
    SEED_PARCELS.find(
      (s) => normalizeAddress(s.parcel.address) === normalized
    ) ?? null
  );
}

// ─── Plausible data generator for unknown parcels ──────────────────────────

const TX_COUNTIES = ["Williamson", "Travis", "Hays", "Bastrop", "Caldwell", "Burnet"];
const SOIL_TYPES = [
  "Houston Black Clay",
  "Austin Chalk",
  "Purves-Brackett Association",
  "Lewisville Silty Clay",
  "Doss-Real Complex",
  "Speck Stony Clay Loam",
];
const FLOOD_ZONES: Array<{ zone: string; weight: number }> = [
  { zone: "X", weight: 60 },
  { zone: "AE", weight: 15 },
  { zone: "A", weight: 10 },
  { zone: "B", weight: 10 },
  { zone: "V", weight: 5 },
];

/** Deterministic hash from string — produces stable "random" values per input */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generate plausible (but clearly synthetic) enrichment data for an unknown parcel.
 * Uses a deterministic hash of the input so the same address always gets the same data.
 */
export function generatePlausibleData(
  input: string,
  inputType: "apn" | "address"
): SeedParcel {
  const h = simpleHash(input);
  const pick = <T>(arr: T[], seed: number): T => arr[seed % arr.length];

  const county = pick(TX_COUNTIES, h);
  const acreage = [0.5, 1.0, 2.5, 5.0, 10.0, 20.0, 40.0][h % 7];
  const basePPA = [8000, 12000, 18000, 25000, 35000, 50000, 80000][(h >> 3) % 7];
  const trend = (["up", "down", "stable"] as const)[(h >> 5) % 3];

  // Pick flood zone by weighted selection
  let zoneIdx = (h >> 7) % 100;
  let floodZone = "X";
  for (const fz of FLOOD_ZONES) {
    zoneIdx -= fz.weight;
    if (zoneIdx <= 0) {
      floodZone = fz.zone;
      break;
    }
  }

  const wetlands = floodZone !== "X" && (h >> 9) % 3 === 0;
  const endangered = (h >> 11) % 8 === 0;

  const numComps = 3 + (h % 3);
  const comps: ComparableSale[] = [];
  for (let i = 0; i < numComps; i++) {
    const compAcreage = +(acreage * (0.7 + ((h >> (i + 2)) % 60) / 100)).toFixed(2);
    const compPPA = Math.round(basePPA * (0.8 + ((h >> (i + 4)) % 40) / 100));
    const compPrice = Math.round(compPPA * compAcreage);
    const monthOffset = 1 + ((h >> (i + 6)) % 8);
    const d = new Date();
    d.setMonth(d.getMonth() - monthOffset);
    comps.push({
      address: `${1000 + (h >> (i + 1)) % 9000} County Rd ${100 + (h >> (i + 3)) % 400}, ${county} Co, TX`,
      saleDate: d.toISOString().slice(0, 10),
      price: compPrice,
      acreage: compAcreage,
      pricePerAcre: compPPA,
    });
  }

  const medianPPA = comps
    .map((c) => c.pricePerAcre)
    .sort((a, b) => a - b)[Math.floor(comps.length / 2)];

  const estimatedValue = Math.round(medianPPA * acreage);
  const confidence = 0.55 + ((h >> 13) % 25) / 100;

  return {
    parcel: {
      parcelId: `gen-${Buffer.from(input).toString("base64").slice(0, 12)}`,
      apn: inputType === "apn" ? input : "PENDING",
      address: inputType === "address" ? input : `Parcel ${input}`,
      acreage,
      zoning: acreage > 15 ? "AG (Agricultural)" : acreage > 3 ? "RR (Rural Residential)" : "SF-1 (Residential)",
      county,
      state: "TX",
    },
    environmental: {
      floodZone,
      wetlands,
      contamination: "none",
      endangered_species: endangered,
      soilType: pick(SOIL_TYPES, h >> 15),
      hazards: wetlands ? ["Potential wetland areas — survey recommended"] : [],
    },
    market: {
      comparables: comps,
      medianPricePerAcre: medianPPA,
      trendDirection: trend,
    },
    valuation: {
      estimatedValue,
      confidenceScore: +confidence.toFixed(2),
      methodology: "comparable_sales",
      pricePerAcre: medianPPA,
      confidenceLow: Math.round(estimatedValue * (1 - (1 - confidence) * 1.2)),
      confidenceHigh: Math.round(estimatedValue * (1 + (1 - confidence) * 1.2)),
    },
    isSeedData: true,
  };
}

/** Get all seed parcels (for testing/listing) */
export function getAllSeedParcels(): SeedParcel[] {
  return [...SEED_PARCELS];
}
