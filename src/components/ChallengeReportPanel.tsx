"use client";

import { useState } from "react";

// Adjustment payload — aligns with SUP-37 schema (ValuationAdjustmentPayload)
export interface ValuationAdjustment {
  roadAccess: 1 | 2 | 3 | 4 | 5;
  wetlandsPercentage: 0 | 10 | 25 | 50;
  topography: 1 | 2 | 3 | 4 | 5;
  septic: "pass" | "fail" | "unknown";
  floodZone: "out" | "partial" | "in";
  utilities: {
    electric: boolean;
    water: boolean;
    sewer: boolean;
    gas: boolean;
  };
  timberMinerals: {
    timber: boolean;
    minerals: boolean;
  };
  zoningConfirmed: boolean;
}

export interface AdjustmentResult {
  originalValue: number | null;
  adjustedValue: number;
  adjustedValueMin: number;
  adjustedValueMax: number;
  factors: Array<{
    label: string;
    impact: "positive" | "negative" | "neutral";
    deltaPercent: number;
  }>;
}

const ROAD_ACCESS_LABELS: Record<number, string> = {
  1: "Paved / Excellent",
  2: "Gravel / Good",
  3: "Dirt / Fair",
  4: "Seasonal / Poor",
  5: "Landlocked / None",
};

const TOPOGRAPHY_OPTIONS: Array<{
  value: ValuationAdjustment["topography"];
  label: string;
}> = [
  { value: 1, label: "Flat" },
  { value: 2, label: "Gentle slope" },
  { value: 3, label: "Moderate slope" },
  { value: 4, label: "Steep" },
  { value: 5, label: "Very steep" },
];

const WETLAND_OPTIONS: Array<{
  value: ValuationAdjustment["wetlandsPercentage"];
  label: string;
}> = [
  { value: 0, label: "None" },
  { value: 10, label: "~10%" },
  { value: 25, label: "~25%" },
  { value: 50, label: "50%+" },
];

const DEFAULT_ADJUSTMENT: ValuationAdjustment = {
  roadAccess: 3,
  wetlandsPercentage: 0,
  topography: 1,
  septic: "unknown",
  floodZone: "out",
  utilities: { electric: false, water: false, sewer: false, gas: false },
  timberMinerals: { timber: false, minerals: false },
  zoningConfirmed: false,
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatRange(min: number, max: number) {
  return `${formatCurrency(min)} – ${formatCurrency(max)}`;
}

// --- Educational tooltips for each property factor ---

const FACTOR_TOOLTIPS: Record<string, string> = {
  roadAccess:
    "How easily you can reach your property matters a lot. Paved road frontage can add significant value, while landlocked parcels with no legal access are much harder to develop or sell.",
  wetlands:
    "Wetlands are protected areas where building is restricted. More wetland coverage means less usable land, but wetlands can also provide natural beauty, wildlife habitat, and may qualify for conservation incentives.",
  topography:
    "Flat to gently sloping land is easiest and least expensive to build on. Steeper terrain can limit where you place a home, driveway, or septic system, but may offer better views.",
  septic:
    "If your land isn't connected to municipal sewer, you'll need a septic system. A passing perc test means the soil can support one. A failing test can significantly limit what you can build.",
  floodZone:
    "Properties inside FEMA flood zones require flood insurance and face building restrictions. Being outside a flood zone is a major plus for both value and peace of mind.",
  utilities:
    "Having electricity, water, sewer, or gas already available at or near your property line saves thousands in development costs. The more utilities in place, the more build-ready your land is.",
  additional:
    "Timber can be a source of income or building material. Mineral rights add long-term value. Confirmed zoning means you know exactly what's allowed on your land — no surprises.",
};

// --- Sub-components ---

function SectionLabel({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <div className="mb-3">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {children}
      </h4>
      {tooltip && (
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{tooltip}</p>
      )}
    </div>
  );
}

function RadioGroup<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            value === opt.value
              ? "bg-brand-600 border-brand-600 text-white"
              : "bg-white border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ToggleCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
        checked
          ? "bg-brand-50 border-brand-400 text-brand-700"
          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
      }`}
    >
      <span
        className={`w-4 h-4 rounded flex items-center justify-center text-xs border flex-shrink-0 ${
          checked ? "bg-brand-600 border-brand-600 text-white" : "border-gray-300"
        }`}
      >
        {checked && "✓"}
      </span>
      {label}
    </button>
  );
}

function ImpactBadge({
  impact,
  deltaPercent,
}: {
  impact: "positive" | "negative" | "neutral";
  deltaPercent: number;
}) {
  const config = {
    positive: { color: "text-green-700 bg-green-50", sign: "+" },
    negative: { color: "text-red-700 bg-red-50", sign: "" },
    neutral: { color: "text-gray-600 bg-gray-100", sign: "" },
  }[impact];
  return (
    <span
      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${config.color}`}
    >
      {config.sign}
      {deltaPercent}%
    </span>
  );
}

// --- Main component ---

interface ChallengeReportPanelProps {
  reportId: string;
  reportTitle: string;
  onClose: () => void;
}

export default function ChallengeReportPanel({
  reportId,
  reportTitle,
  onClose,
}: ChallengeReportPanelProps) {
  const [adj, setAdj] = useState<ValuationAdjustment>(DEFAULT_ADJUSTMENT);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AdjustmentResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  function updateAdj(partial: Partial<ValuationAdjustment>) {
    setAdj((prev) => ({ ...prev, ...partial }));
    // Clear previous result when form changes
    setResult(null);
    setApiError(null);
  }

  function updateUtility(key: keyof ValuationAdjustment["utilities"], val: boolean) {
    setAdj((prev) => ({
      ...prev,
      utilities: { ...prev.utilities, [key]: val },
    }));
    setResult(null);
    setApiError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setApiError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/reports/${reportId}/adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adj),
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Adjustment endpoint not yet available.");
        }
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Adjustment failed. Please try again.");
      }

      const data = await res.json();
      setResult(data.result as AdjustmentResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">
            What Affects Your Land's Value?
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Explore how your property's unique characteristics shape its
            estimated value. Adjust each factor to learn what matters most.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm ml-4 flex-shrink-0"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Road Access */}
        <div>
          <SectionLabel tooltip={FACTOR_TOOLTIPS.roadAccess}>Road Access</SectionLabel>
          <div className="space-y-2">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={adj.roadAccess}
              onChange={(e) =>
                updateAdj({
                  roadAccess: Number(e.target.value) as ValuationAdjustment["roadAccess"],
                })
              }
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Paved</span>
              <span className="font-medium text-gray-700">
                {ROAD_ACCESS_LABELS[adj.roadAccess]}
              </span>
              <span>Landlocked</span>
            </div>
          </div>
        </div>

        {/* Wetlands */}
        <div>
          <SectionLabel tooltip={FACTOR_TOOLTIPS.wetlands}>Wetlands Coverage</SectionLabel>
          <RadioGroup
            value={adj.wetlandsPercentage}
            options={WETLAND_OPTIONS}
            onChange={(v) => updateAdj({ wetlandsPercentage: v })}
          />
        </div>

        {/* Topography */}
        <div>
          <SectionLabel tooltip={FACTOR_TOOLTIPS.topography}>Topography / Buildability</SectionLabel>
          <RadioGroup
            value={adj.topography}
            options={TOPOGRAPHY_OPTIONS}
            onChange={(v) => updateAdj({ topography: v })}
          />
        </div>

        {/* Septic */}
        <div>
          <SectionLabel tooltip={FACTOR_TOOLTIPS.septic}>Septic</SectionLabel>
          <RadioGroup
            value={adj.septic}
            options={[
              { value: "pass", label: "Pass" },
              { value: "fail", label: "Fail" },
              { value: "unknown", label: "Unknown" },
            ]}
            onChange={(v) => updateAdj({ septic: v })}
          />
        </div>

        {/* Flood Zone */}
        <div>
          <SectionLabel tooltip={FACTOR_TOOLTIPS.floodZone}>Flood Zone</SectionLabel>
          <RadioGroup
            value={adj.floodZone}
            options={[
              { value: "out", label: "Outside flood zone" },
              { value: "partial", label: "Partial" },
              { value: "in", label: "Inside flood zone" },
            ]}
            onChange={(v) => updateAdj({ floodZone: v })}
          />
        </div>

        {/* Utilities */}
        <div>
          <SectionLabel tooltip={FACTOR_TOOLTIPS.utilities}>Utilities Available</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "electric", label: "Electric" },
                { key: "water", label: "Water" },
                { key: "sewer", label: "Sewer" },
                { key: "gas", label: "Gas" },
              ] as const
            ).map(({ key, label }) => (
              <ToggleCheckbox
                key={key}
                checked={adj.utilities[key]}
                onChange={(v) => updateUtility(key, v)}
                label={label}
              />
            ))}
          </div>
        </div>

        {/* Timber, Minerals, Zoning */}
        <div>
          <SectionLabel tooltip={FACTOR_TOOLTIPS.additional}>Additional Characteristics</SectionLabel>
          <div className="flex flex-wrap gap-2">
            <ToggleCheckbox
              checked={adj.timberMinerals.timber}
              onChange={(v) =>
                setAdj((prev) => ({
                  ...prev,
                  timberMinerals: { ...prev.timberMinerals, timber: v },
                }))
              }
              label="Timber value"
            />
            <ToggleCheckbox
              checked={adj.timberMinerals.minerals}
              onChange={(v) =>
                setAdj((prev) => ({
                  ...prev,
                  timberMinerals: { ...prev.timberMinerals, minerals: v },
                }))
              }
              label="Mineral rights"
            />
            <ToggleCheckbox
              checked={adj.zoningConfirmed}
              onChange={(v) => updateAdj({ zoningConfirmed: v })}
              label="Zoning confirmed"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="animate-spin inline-block">⟳</span>
              Recalculating your estimate…
            </>
          ) : (
            "See Updated Estimate"
          )}
        </button>
      </form>

      {/* API error */}
      {apiError && (
        <div className="mt-4 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">
          {apiError}
        </div>
      )}

      {/* Before / After comparison */}
      {result && (
        <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">
            Your Refined Estimate
          </h4>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {result.originalValue !== null && (
              <div className="bg-white rounded-lg px-4 py-3 border border-gray-200">
                <p className="text-xs text-gray-400 mb-1">Original estimate</p>
                <p className="text-lg font-bold text-gray-700">
                  {formatCurrency(result.originalValue)}
                </p>
              </div>
            )}
            <div
              className={`rounded-lg px-4 py-3 border ${
                result.originalValue !== null &&
                result.adjustedValue > result.originalValue
                  ? "bg-green-50 border-green-200"
                  : result.originalValue !== null &&
                    result.adjustedValue < result.originalValue
                  ? "bg-red-50 border-red-200"
                  : "bg-white border-gray-200"
              } ${result.originalValue === null ? "col-span-2" : ""}`}
            >
              <p className="text-xs text-gray-400 mb-1">Adjusted estimate</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(result.adjustedValue)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Range: {formatRange(result.adjustedValueMin, result.adjustedValueMax)}
              </p>
            </div>
          </div>

          {result.factors.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                What's driving the change
              </p>
              <div className="space-y-1.5">
                {result.factors.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{f.label}</span>
                    <ImpactBadge
                      impact={f.impact}
                      deltaPercent={f.deltaPercent}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3">
            This is an estimate based on the details you provided — your
            original report stays unchanged.{" "}
            <a href="/order" className="text-brand-600 hover:underline">
              Get a detailed report
            </a>{" "}
            for a professional-grade valuation.
          </p>
        </div>
      )}
    </div>
  );
}
