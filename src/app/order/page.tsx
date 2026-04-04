"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const TIERS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceDisplay: "Free",
    badge: "Start Here",
    description: "Basic parcel data — no credit card required.",
    turnaround: "~2 minutes",
    features: [
      "APN, ownership & zoning",
      "Acreage & lot dimensions",
      "County assessed value",
      "Flood zone flag",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: 29,
    priceDisplay: "$29",
    popular: true,
    description: "Full intelligence for understanding your property's value.",
    turnaround: "~5 minutes",
    features: [
      "Everything in Free",
      "Comparable sales analysis",
      "Market value estimate",
      "Environmental risk summary",
      "HOA & deed restriction check",
      "Entitlement & permit history",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 49,
    priceDisplay: "$49",
    description: "Complete property insights for confident decisions.",
    turnaround: "~10 minutes",
    features: [
      "Everything in Standard",
      "Full valuation model",
      "Development feasibility analysis",
      "Title chain summary",
      "Infrastructure cost estimates",
      "Property insights summary",
    ],
  },
];

type Step = "parcel" | "tier" | "checkout";

function OrderForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("parcel");
  const [parcelInput, setParcelInput] = useState("");
  const [inputType, setInputType] = useState<"apn" | "address">("apn");
  const [selectedTier, setSelectedTier] = useState<string>("standard");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tier = searchParams.get("tier");
    if (tier && TIERS.find((t) => t.id === tier)) {
      setSelectedTier(tier);
    }
  }, [searchParams]);

  async function handleFreeReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          parcel_input: parcelInput,
          input_type: inputType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create free report");
      }

      const { reportId } = await res.json();
      window.location.href = `/dashboard?email=${encodeURIComponent(email)}&new=${reportId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: selectedTier,
          parcelInput,
          inputType,
          email,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create checkout session");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function handleSubmit() {
    if (selectedTier === "free") {
      handleFreeReport();
    } else {
      handleCheckout();
    }
  }

  const tier = TIERS.find((t) => t.id === selectedTier)!;
  const isFree = selectedTier === "free";

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <a href="/" className="text-sm text-brand-600 hover:underline">← Back to Super Plot</a>
          <h1 className="text-3xl font-bold text-gray-900 mt-3">Order a Property Report</h1>
          <p className="text-gray-500 mt-1">
            Instant intelligence on any US vacant land parcel.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {(["parcel", "tier", "checkout"] as Step[]).map((s, i) => {
            const labels = ["Parcel", "Report Tier", "Checkout"];
            const current = ["parcel", "tier", "checkout"].indexOf(step);
            const thisIdx = i;
            const done = thisIdx < current;
            const active = thisIdx === current;
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    done
                      ? "bg-brand-600 text-white"
                      : active
                      ? "bg-brand-600 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  className={`text-sm font-medium ${
                    active ? "text-gray-900" : done ? "text-brand-600" : "text-gray-400"
                  }`}
                >
                  {labels[i]}
                </span>
                {i < 2 && <div className="flex-1 h-px bg-gray-200" />}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {/* Step 1: Parcel */}
          {step === "parcel" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Which parcel?</h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter an APN (Assessor Parcel Number) or a street address.
              </p>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setInputType("apn")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    inputType === "apn"
                      ? "bg-brand-600 text-white border-brand-600"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  APN
                </button>
                <button
                  onClick={() => setInputType("address")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    inputType === "address"
                      ? "bg-brand-600 text-white border-brand-600"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Street Address
                </button>
              </div>

              <input
                type="text"
                value={parcelInput}
                onChange={(e) => setParcelInput(e.target.value)}
                placeholder={
                  inputType === "apn"
                    ? "e.g. 123-456-789 or 12345678"
                    : "e.g. 123 Ranch Road, Llano County, TX 78643"
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-300 focus:outline-none focus:border-brand-400"
              />

              <p className="text-xs text-gray-400 mt-2">
                {inputType === "apn"
                  ? "Find the APN on your county assessor website or tax bill."
                  : "Include county and state for best results."}
              </p>

              <button
                disabled={!parcelInput.trim()}
                onClick={() => setStep("tier")}
                className="w-full mt-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Tier selection */}
          {step === "tier" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Choose your report tier</h2>
              <p className="text-gray-500 text-sm mb-6">
                Parcel:{" "}
                <span className="font-medium text-gray-700">
                  {inputType === "apn" ? `APN ${parcelInput}` : parcelInput}
                </span>{" "}
                <button
                  onClick={() => setStep("parcel")}
                  className="text-brand-600 hover:underline ml-1 text-xs"
                >
                  Change
                </button>
              </p>

              <div className="space-y-3">
                {TIERS.map((t) => (
                  <label
                    key={t.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                      selectedTier === t.id
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tier"
                      value={t.id}
                      checked={selectedTier === t.id}
                      onChange={() => setSelectedTier(t.id)}
                      className="mt-1 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{t.name}</span>
                          {t.badge && (
                            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                              {t.badge}
                            </span>
                          )}
                          {t.popular && (
                            <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full">
                              Most Popular
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-gray-900">{t.priceDisplay}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{t.description}</p>
                      <p className="text-xs text-gray-400 mt-1">Turnaround: {t.turnaround}</p>
                      <ul className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5">
                        {t.features.map((f) => (
                          <li key={f} className="text-xs text-gray-500 flex items-start gap-1">
                            <span className="text-brand-500 flex-shrink-0">✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep("parcel")}
                  className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-600 font-semibold py-3 rounded-xl transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep("checkout")}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Checkout */}
          {step === "checkout" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Almost done</h2>
              <p className="text-gray-500 text-sm mb-6">
                {isFree
                  ? "Enter your email to receive your free report."
                  : "Review your order and enter your email to receive the report."}
              </p>

              {/* Order summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Parcel</span>
                    <span className="font-medium text-gray-900">
                      {inputType === "apn" ? `APN ${parcelInput}` : parcelInput}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Report tier</span>
                    <span className="font-medium text-gray-900">{tier.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Turnaround</span>
                    <span className="font-medium text-gray-900">{tier.turnaround}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                    <span className="text-gray-700">Total</span>
                    <span className="text-gray-900">{tier.priceDisplay}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-300 focus:outline-none focus:border-brand-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Your completed report will be sent here and available in My Reports.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("tier")}
                  className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-600 font-semibold py-3 rounded-xl transition-colors"
                  disabled={loading}
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!email || loading}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⟳</span>
                      {isFree ? "Generating…" : "Redirecting…"}
                    </>
                  ) : isFree ? (
                    <>Get Free Report →</>
                  ) : (
                    <>Pay {tier.priceDisplay} →</>
                  )}
                </button>
              </div>

              {!isFree && (
                <p className="text-xs text-center text-gray-400 mt-4">
                  Secured by Stripe. Your payment info is never stored on our servers.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading…</div>}>
      <OrderForm />
    </Suspense>
  );
}
