import type {
  UserAdjustmentsDeltaSummary,
  AdjustmentFieldChange,
} from "@/lib/report-adjustments";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDelta(cents: number) {
  const abs = formatCurrency(Math.abs(cents));
  return cents >= 0 ? `+${abs}` : `−${abs}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DeltaBadge({ change }: { change: AdjustmentFieldChange }) {
  const colorMap = {
    positive: "text-green-700 bg-green-50 border-green-200",
    negative: "text-red-700 bg-red-50 border-red-200",
    neutral: "text-gray-600 bg-gray-100 border-gray-200",
  };
  return (
    <span
      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${colorMap[change.impact]}`}
    >
      {formatDelta(change.valuationDeltaCents)}
    </span>
  );
}

function ChangeRow({ change }: { change: AdjustmentFieldChange }) {
  return (
    <tr className="border-t border-gray-100">
      <td className="py-2.5 pr-4 text-sm text-gray-700 font-medium whitespace-nowrap">
        {change.label}
      </td>
      <td className="py-2.5 pr-4 text-sm text-gray-400 line-through">
        {change.before}
      </td>
      <td className="py-2.5 pr-4 text-sm text-gray-900 font-medium">
        {change.after}
      </td>
      <td className="py-2.5 text-right">
        <DeltaBadge change={change} />
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

interface UserAdjustmentsSectionProps {
  delta: UserAdjustmentsDeltaSummary;
}

/**
 * UserAdjustmentsSection
 *
 * Conditionally rendered in the property report when the user has submitted
 * a valuation challenge and the Valuation Analyst has applied the overrides.
 *
 * Usage (render only when delta data is present):
 *
 *   {report.userAdjustmentsDelta && (
 *     <UserAdjustmentsSection delta={report.userAdjustmentsDelta} />
 *   )}
 */
export default function UserAdjustmentsSection({
  delta,
}: UserAdjustmentsSectionProps) {
  const { changes, originalValueCents, revisedRange } = delta;

  const netDeltaCents = changes.reduce(
    (sum, c) => sum + c.valuationDeltaCents,
    0
  );

  return (
    <section className="mt-8 border border-amber-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
        <h2 className="text-base font-semibold text-amber-900">
          User Adjustments
        </h2>
        <p className="text-xs text-amber-700 mt-0.5">
          The fields below were supplied by you and replace automated research
          data for this report. Original automated values are shown with
          strikethrough.
        </p>
      </div>

      <div className="bg-white px-6 py-5 space-y-6">
        {/* Change table */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            What You Changed
          </h3>
          {changes.length === 0 ? (
            <p className="text-sm text-gray-400">No field changes recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="pb-2 text-xs font-medium text-gray-400 pr-4">
                      Field
                    </th>
                    <th className="pb-2 text-xs font-medium text-gray-400 pr-4">
                      Original
                    </th>
                    <th className="pb-2 text-xs font-medium text-gray-400 pr-4">
                      Your Value
                    </th>
                    <th className="pb-2 text-xs font-medium text-gray-400 text-right">
                      Impact
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {changes.map((c) => (
                    <ChangeRow key={c.field} change={c} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Value comparison */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Updated Value Range
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Original */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Original estimate</p>
              <p className="text-lg font-bold text-gray-500">
                {formatCurrency(originalValueCents)}
              </p>
            </div>

            {/* Revised low */}
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Revised low</p>
              <p className="text-lg font-bold text-gray-700">
                {formatCurrency(revisedRange.lowCents)}
              </p>
            </div>

            {/* Revised mid */}
            <div
              className={`rounded-xl border px-4 py-3 ${
                netDeltaCents > 0
                  ? "bg-green-50 border-green-200"
                  : netDeltaCents < 0
                  ? "bg-red-50 border-red-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <p className="text-xs text-gray-400 mb-1">Revised mid</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(revisedRange.midCents)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Net {formatDelta(netDeltaCents)}
              </p>
            </div>

            {/* Revised high */}
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Revised high</p>
              <p className="text-lg font-bold text-gray-700">
                {formatCurrency(revisedRange.highCents)}
              </p>
            </div>
          </div>

          {/* Confidence note */}
          {revisedRange.confidenceNote && (
            <p className="mt-3 text-xs text-gray-400">
              {revisedRange.confidenceNote}
            </p>
          )}
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Disclaimer:</span> The adjusted
            values above reflect user-supplied inputs that replace automated
            research data for the flagged fields. Super Plot cannot verify
            user-provided information and makes no representations regarding its
            accuracy. This is not an appraisal.
          </p>
        </div>
      </div>
    </section>
  );
}
