/**
 * Valuation Adjustment Types
 *
 * Data contract for user-submitted property characteristic adjustments
 * used in valuation challenge / correction flow (SUP-36).
 *
 * All fields except reportOrderId are optional — users provide what they know.
 */

// ---------------------------------------------------------------------------
// Enums / primitive types
// ---------------------------------------------------------------------------

/** Septic system status as reported by the user */
export type SepticStatus = "pass" | "fail" | "unknown";

/**
 * Road access quality (1 = paved public road, 5 = landlocked / no legal access)
 * 1 - Paved public road frontage
 * 2 - Gravel / improved road frontage
 * 3 - Unimproved / dirt road
 * 4 - Easement only / shared access
 * 5 - Landlocked (no legal access)
 */
export type RoadAccessScale = 1 | 2 | 3 | 4 | 5;

/**
 * Approximate wetlands coverage as a percentage of the parcel.
 * Bucket values chosen to match common appraisal adjustment thresholds.
 */
export type WetlandsPercentage = 0 | 10 | 25 | 50;

/**
 * Topography / buildability score (1 = flat & easy, 5 = steep/mixed/difficult)
 * 1 - Flat, minimal site prep
 * 2 - Gentle slope, minor grading needed
 * 3 - Moderate slope
 * 4 - Steep — significant grading / engineering required
 * 5 - Very steep or mixed terrain — largely unbuildable
 */
export type TopographyScale = 1 | 2 | 3 | 4 | 5;

/** Flood zone membership for the parcel */
export type FloodZoneStatus = "in" | "out" | "partial";

// ---------------------------------------------------------------------------
// Nested objects
// ---------------------------------------------------------------------------

/** Utility availability flags — user checks each known utility */
export interface UtilitiesAvailability {
  electric: boolean;
  water: boolean;
  sewer: boolean;
  gas: boolean;
}

/** Timber and mineral value indicators */
export interface TimberMinerals {
  /** User has confirmed standing timber with known value */
  timber: boolean;
  /** User has confirmed mineral rights with known value */
  minerals: boolean;
}

// ---------------------------------------------------------------------------
// Primary payload interface
// ---------------------------------------------------------------------------

/**
 * ValuationAdjustmentPayload
 *
 * Submitted by the user when they challenge or supplement a valuation report.
 * All property fields are optional; only reportOrderId is required.
 */
export interface ValuationAdjustmentPayload {
  /** UUID of the report_order being challenged */
  reportOrderId: string;

  /** Septic system condition (pass / fail / unknown) */
  septic?: SepticStatus;

  /** Road access quality on a 1–5 scale */
  roadAccess?: RoadAccessScale;

  /**
   * Estimated wetlands coverage as a bucketed percentage.
   * 0 = no wetlands, 50 = 50 %+ of parcel is wetlands.
   */
  wetlandsPercentage?: WetlandsPercentage;

  /** Which utility services are available at or near the parcel */
  utilities?: UtilitiesAvailability;

  /** Topography / buildability on a 1–5 scale */
  topography?: TopographyScale;

  /**
   * Whether the zoning classification has been confirmed with the county.
   * true  = confirmed (verified directly with jurisdiction)
   * false = assumed (based on maps / online data only)
   */
  zoningConfirmed?: boolean;

  /** Flood zone membership */
  floodZone?: FloodZoneStatus;

  /** Timber and mineral value toggles */
  timberMinerals?: TimberMinerals;

  /** Free-text notes from the user (max 2 000 characters) */
  notes?: string;
}

// ---------------------------------------------------------------------------
// Database row type (as returned from valuation_adjustments table)
// ---------------------------------------------------------------------------

export interface ValuationAdjustmentRow {
  id: string;
  report_order_id: string;
  septic: SepticStatus | null;
  road_access: RoadAccessScale | null;
  wetlands_pct: WetlandsPercentage | null;
  utility_electric: boolean | null;
  utility_water: boolean | null;
  utility_sewer: boolean | null;
  utility_gas: boolean | null;
  topography: TopographyScale | null;
  zoning_confirmed: boolean | null;
  flood_zone: FloodZoneStatus | null;
  timber_known: boolean | null;
  minerals_known: boolean | null;
  notes: string | null;
  raw_payload: ValuationAdjustmentPayload;
  status: AdjustmentStatus;
  created_at: string;
  updated_at: string;
}

/** Lifecycle status of a submitted adjustment challenge */
export type AdjustmentStatus = "pending" | "accepted" | "rejected" | "applied";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const SEPTIC_VALUES: SepticStatus[] = ["pass", "fail", "unknown"];
const FLOOD_ZONE_VALUES: FloodZoneStatus[] = ["in", "out", "partial"];
const ROAD_ACCESS_VALUES: RoadAccessScale[] = [1, 2, 3, 4, 5];
const WETLANDS_VALUES: WetlandsPercentage[] = [0, 10, 25, 50];
const TOPOGRAPHY_VALUES: TopographyScale[] = [1, 2, 3, 4, 5];
const NOTES_MAX_LENGTH = 2000;

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate a ValuationAdjustmentPayload.
 * Returns an array of errors; empty array means the payload is valid.
 */
export function validateAdjustmentPayload(
  payload: unknown
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof payload !== "object" || payload === null) {
    return [{ field: "root", message: "Payload must be a non-null object" }];
  }

  const p = payload as Record<string, unknown>;

  // reportOrderId — required, must be a non-empty string (UUID format)
  if (typeof p.reportOrderId !== "string" || p.reportOrderId.trim() === "") {
    errors.push({ field: "reportOrderId", message: "reportOrderId is required and must be a non-empty string" });
  } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.reportOrderId)) {
    errors.push({ field: "reportOrderId", message: "reportOrderId must be a valid UUID" });
  }

  // septic
  if (p.septic !== undefined) {
    if (!SEPTIC_VALUES.includes(p.septic as SepticStatus)) {
      errors.push({ field: "septic", message: `septic must be one of: ${SEPTIC_VALUES.join(", ")}` });
    }
  }

  // roadAccess
  if (p.roadAccess !== undefined) {
    if (!ROAD_ACCESS_VALUES.includes(p.roadAccess as RoadAccessScale)) {
      errors.push({ field: "roadAccess", message: `roadAccess must be an integer 1–5` });
    }
  }

  // wetlandsPercentage
  if (p.wetlandsPercentage !== undefined) {
    if (!WETLANDS_VALUES.includes(p.wetlandsPercentage as WetlandsPercentage)) {
      errors.push({ field: "wetlandsPercentage", message: `wetlandsPercentage must be one of: ${WETLANDS_VALUES.join(", ")}` });
    }
  }

  // utilities
  if (p.utilities !== undefined) {
    if (typeof p.utilities !== "object" || p.utilities === null) {
      errors.push({ field: "utilities", message: "utilities must be an object" });
    } else {
      const u = p.utilities as Record<string, unknown>;
      for (const key of ["electric", "water", "sewer", "gas"] as const) {
        if (u[key] !== undefined && typeof u[key] !== "boolean") {
          errors.push({ field: `utilities.${key}`, message: `utilities.${key} must be a boolean` });
        }
      }
    }
  }

  // topography
  if (p.topography !== undefined) {
    if (!TOPOGRAPHY_VALUES.includes(p.topography as TopographyScale)) {
      errors.push({ field: "topography", message: `topography must be an integer 1–5` });
    }
  }

  // zoningConfirmed
  if (p.zoningConfirmed !== undefined && typeof p.zoningConfirmed !== "boolean") {
    errors.push({ field: "zoningConfirmed", message: "zoningConfirmed must be a boolean" });
  }

  // floodZone
  if (p.floodZone !== undefined) {
    if (!FLOOD_ZONE_VALUES.includes(p.floodZone as FloodZoneStatus)) {
      errors.push({ field: "floodZone", message: `floodZone must be one of: ${FLOOD_ZONE_VALUES.join(", ")}` });
    }
  }

  // timberMinerals
  if (p.timberMinerals !== undefined) {
    if (typeof p.timberMinerals !== "object" || p.timberMinerals === null) {
      errors.push({ field: "timberMinerals", message: "timberMinerals must be an object" });
    } else {
      const tm = p.timberMinerals as Record<string, unknown>;
      for (const key of ["timber", "minerals"] as const) {
        if (tm[key] !== undefined && typeof tm[key] !== "boolean") {
          errors.push({ field: `timberMinerals.${key}`, message: `timberMinerals.${key} must be a boolean` });
        }
      }
    }
  }

  // notes
  if (p.notes !== undefined) {
    if (typeof p.notes !== "string") {
      errors.push({ field: "notes", message: "notes must be a string" });
    } else if (p.notes.length > NOTES_MAX_LENGTH) {
      errors.push({ field: "notes", message: `notes must be ${NOTES_MAX_LENGTH} characters or fewer` });
    }
  }

  return errors;
}
