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
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
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
      <div className="mt-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <span className="text-green-600 text-sm mt-0.5">✓</span>
          <div>
            <p className="text-sm font-medium text-green-800">We received your request.</p>
            <p className="text-xs text-green-700 mt-0.5">
              Someone from our team will reach out within a few business days — no pressure, no obligation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-4">
      {/* Collapsible toggle — subtle, secondary placement */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Thinking about selling?
      </button>

      {open && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          {!showForm ? (
            <div>
              <p className="text-sm text-gray-700">
                If you&apos;re considering selling this property, you can request a
                no-obligation offer. We&apos;ll review your report data and reach
                out with a fair estimate — no fees, no pressure.
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-2.5 text-sm text-brand-600 hover:text-brand-700 font-medium hover:underline"
              >
                Get a no-obligation offer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-xs text-gray-500">
                Share your contact info and we&apos;ll follow up within a few business days.
              </p>
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
                  onClick={() => setShowForm(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formState === "submitting"}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {formState === "submitting" ? "Submitting…" : "Request Offer"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
