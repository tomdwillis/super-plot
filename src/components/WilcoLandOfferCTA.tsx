"use client";

import { useState } from "react";

interface WilcoLandOfferCTAProps {
  reportId: string;
  parcelApn?: string;
}

type FormState = "idle" | "submitting" | "success" | "error";

export default function WilcoLandOfferCTA({
  reportId,
  parcelApn,
}: WilcoLandOfferCTAProps) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("submitting");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/wilco-land/offer-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportOrderId: reportId,
          parcelApn,
          contactName: name,
          contactEmail: email,
          contactPhone: phone,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "Submission failed"
        );
      }

      setFormState("success");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setFormState("error");
    }
  }

  if (formState === "success") {
    return (
      <div className="mt-4 rounded-xl bg-green-50 border border-green-200 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="text-green-600 text-lg">✓</span>
          <div>
            <p className="text-sm font-semibold text-green-800">Request submitted!</p>
            <p className="text-sm text-green-700 mt-0.5">
              A Wilco Land representative will contact you within 24 hours with a cash offer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 overflow-hidden">
      {/* Header / collapsed state */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand-900">
              Get a cash offer for your land in 24 hours
            </p>
            <p className="text-xs text-brand-700 mt-0.5">
              Wilco Land buys vacant land directly — no fees, no listings, no waiting.
            </p>
          </div>
          {!expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex-shrink-0 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              Get Instant Offer
            </button>
          )}
        </div>
      </div>

      {/* Expanded form */}
      {expanded && (
        <form
          onSubmit={handleSubmit}
          className="border-t border-brand-200 bg-white px-5 py-4 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-300 focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@email.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-300 focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-300 focus:outline-none focus:border-brand-400"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600">{errorMsg}</p>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formState === "submitting"}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {formState === "submitting" ? "Submitting…" : "Get My Offer"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
