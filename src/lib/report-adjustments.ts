/**
 * Report Adjustment Delta Types
 *
 * Defines the delta summary produced by the Valuation Analyst (SUP-42 / SUP-40)
 * after re-running the valuation with user-supplied overrides.
 *
 * The Report Writer consumes this to render the "User Adjustments" section
 * conditionally when a report is re-generated after a user challenge (SUP-36).
 *
 * If `userAdjustmentsDelta` is absent from the report data, the section is
 * omitted entirely.
 */

// ---------------------------------------------------------------------------
// Per-field change record
// ---------------------------------------------------------------------------

/**
 * Represents a single field that the user changed, with before/after values
 * and the dollar impact on the valuation.
 */
export interface AdjustmentFieldChange {
  /** Machine-readable field key matching ValuationAdjustmentPayload fields */
  field:
    | "septic"
    | "roadAccess"
    | "wetlandsPercentage"
    | "utilities"
    | "topography"
    | "zoningConfirmed"
    | "floodZone"
    | "timberMinerals";

  /** Human-readable label for display (e.g. "Road Access") */
  label: string;

  /** Formatted string of the original automated-research value (e.g. "Dirt / Fair") */
  before: string;

  /** Formatted string of the user-supplied value (e.g. "Paved / Excellent") */
  after: string;

  /** Net dollar impact in cents: positive = value increase, negative = decrease */
  valuationDeltaCents: number;

  /** Direction of impact for UI colour-coding */
  impact: "positive" | "negative" | "neutral";
}

// ---------------------------------------------------------------------------
// Value range
// ---------------------------------------------------------------------------

/**
 * Revised three-tier value range after applying all user adjustments.
 * All figures are in cents.
 */
export interface RevisedValueRange {
  lowCents: number;
  midCents: number;
  highCents: number;
  /** Free-text confidence note, e.g. "Medium confidence — 2 fields manually overridden" */
  confidenceNote: string;
}

// ---------------------------------------------------------------------------
// Top-level delta summary
// ---------------------------------------------------------------------------

/**
 * UserAdjustmentsDeltaSummary
 *
 * Produced by the Valuation Analyst and attached to a report order when a
 * user challenge has been applied (status = "applied").
 *
 * The Report Writer renders a "User Adjustments" section only when this
 * object is present on the report payload.
 */
export interface UserAdjustmentsDeltaSummary {
  /** ISO timestamp of when the adjusted valuation was computed */
  computedAt: string;

  /** Original mid-point valuation in cents (before any user adjustments) */
  originalValueCents: number;

  /** Fields the user changed, in display order */
  changes: AdjustmentFieldChange[];

  /** Updated value range reflecting all applied adjustments */
  revisedRange: RevisedValueRange;
}
