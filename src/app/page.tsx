"use client";

import { useState } from "react";

const TIERS = [
  {
    id: "free",
    name: "Free",
    price: "Free",
    badge: "Start Here",
    description: "Basic parcel data — no credit card required.",
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
    price: "$29",
    popular: true,
    description: "Full intelligence for understanding your property's value.",
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
    price: "$49",
    description: "Complete property insights for confident decisions.",
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

const TESTIMONIALS = [
  {
    quote:
      "I inherited 40 acres and had no idea what it was worth. Super Plot gave me a full report in minutes — comps, zoning, everything. I finally feel informed.",
    author: "Mark T.",
    role: "Landowner, Texas",
  },
  {
    quote:
      "The environmental and flood data showed me my property was in better shape than I thought. I used the report to negotiate a higher sale price.",
    author: "Sarah K.",
    role: "Property owner, Oregon",
  },
  {
    quote:
      "I own several rural parcels and needed quick valuations on all of them. The Basic tier is perfect — fast, affordable, and gives me what I need to make decisions.",
    author: "James R.",
    role: "Landowner, Arizona",
  },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleEmailCapture(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/email-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true); // Optimistic — never block the user
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block bg-brand-100 text-brand-700 text-sm font-semibold px-3 py-1 rounded-full mb-6">
            Now in beta — join 200+ landowners
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Know exactly what your land is worth{" "}
            <span className="text-brand-600">before you make a decision.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Super Plot delivers instant property intelligence reports for your vacant land — ownership,
            valuation, environmental risk, zoning, and more. Free basic report, paid tiers from $29.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/order"
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-brand-100"
            >
              Order a Report →
            </a>
            <a
              href="#pricing"
              className="border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              See Pricing
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Free basic report — no credit card required. Results in under 5 minutes.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            From APN to full report in minutes
          </h2>
          <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
            Our pipeline pulls data from county assessors, environmental databases, comparable sales,
            and title records — then distills it into a clear, actionable report.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: "📍",
                title: "Enter the parcel",
                desc: "Provide the APN or street address. We support all US counties.",
              },
              {
                step: "2",
                icon: "🔍",
                title: "Choose your tier",
                desc: "Start free, or unlock full intelligence with Standard ($29) or Premium ($49).",
              },
              {
                step: "3",
                icon: "📄",
                title: "Download your report",
                desc: "Receive a PDF report with full data, analysis, and valuation within minutes.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Report Preview */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            See what&apos;s in a Super Plot report
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Every report is built from live county, environmental, and market data — then distilled
            into a clear, actionable PDF.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: simulated report page */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center text-lg">
                  🗺️
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Property Intelligence Report</p>
                  <p className="text-xs text-gray-400">Super Plot — Generated Apr 2026</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Parcel
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    APN 087-230-015 &middot; Lassen County, CA
                  </p>
                  <p className="text-xs text-gray-500">40.2 acres &middot; Agricultural zoning (A-1)</p>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Market Valuation
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-brand-600">$48,500</span>
                    <span className="text-xs text-gray-400">estimated market value</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Range: $38,000 — $62,000 &middot; Based on 12 comparable sales
                  </p>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Environmental
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      No flood zone
                    </span>
                    <span className="bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      No wetlands
                    </span>
                    <span className="bg-yellow-50 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      Moderate fire risk
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Access & Utilities
                  </p>
                  <p className="text-xs text-gray-500">
                    Paved road access &middot; Electric at lot line &middot; Well required &middot;
                    Septic required
                  </p>
                </div>
              </div>
              {/* Faded overlay at bottom to suggest more content */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
            </div>

            {/* Right: report highlights list */}
            <div className="flex flex-col justify-center space-y-6">
              {[
                {
                  title: "Ownership & Parcel Data",
                  desc: "APN, lot dimensions, acreage, zoning, tax assessed value, and deed restrictions — pulled from county records.",
                },
                {
                  title: "Market Valuation",
                  desc: "Comparable sales analysis with value range estimate. See exactly which comps were used and why.",
                },
                {
                  title: "Environmental & Risk Screening",
                  desc: "Flood zone, wetlands, fire risk, soil contamination, and endangered species — flagged with clear pass/fail indicators.",
                },
                {
                  title: "Development Feasibility",
                  desc: "Access roads, utility availability, septic/well requirements, and estimated infrastructure costs.",
                },
                {
                  title: "Property Insights",
                  desc: "Premium reports include a concise summary of your property's strengths, risks, and recommended next steps.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center mt-0.5">
                    <span className="text-brand-600 text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
              <a
                href="/order"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors w-fit mt-2"
              >
                Order Your Report →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Simple, per-report pricing</h2>
          <p className="text-center text-gray-500 mb-12">
            Pay only for what you need. No subscriptions required.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`bg-white rounded-2xl border p-8 flex flex-col relative ${
                  tier.popular
                    ? "border-brand-500 shadow-xl shadow-brand-50"
                    : "border-gray-200"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {tier.badge}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
                  <div className="text-4xl font-extrabold text-gray-900 mt-2">{tier.price}</div>
                  <p className="text-sm text-gray-500 mt-1">{tier.price === "Free" ? "no credit card" : "per report"}</p>
                  <p className="text-sm text-gray-600 mt-3">{tier.description}</p>
                </div>
                <ul className="space-y-2 flex-1 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-brand-500 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`/order?tier=${tier.id}`}
                  className={`text-center font-semibold py-3 rounded-xl transition-colors ${
                    tier.popular
                      ? "bg-brand-600 hover:bg-brand-700 text-white"
                      : tier.id === "free"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "border border-gray-200 hover:border-brand-500 hover:text-brand-600 text-gray-700"
                  }`}
                >
                  {tier.id === "free" ? "Get Free Report" : `Order ${tier.name}`}
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">
            Need bulk pricing? Email us at{" "}
            <a href="mailto:hello@superplot.com" className="text-brand-600 hover:underline">
              hello@superplot.com
            </a>
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Trusted by landowners
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.author} className="bg-gray-50 rounded-2xl p-6">
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email capture CTA */}
      <section className="bg-brand-700 px-6 py-20 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Get your first report free
          </h2>
          <p className="text-brand-100 mb-8">
            Join our beta and get one free Basic report on any US parcel. No credit card required.
          </p>
          {submitted ? (
            <div className="bg-white/10 text-white rounded-xl px-6 py-4 font-medium">
              ✓ You&apos;re on the list! We&apos;ll be in touch shortly.
            </div>
          ) : (
            <form onSubmit={handleEmailCapture} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 border-0 focus:ring-2 focus:ring-brand-300 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors disabled:opacity-60"
              >
                {loading ? "Joining…" : "Get Free Report"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
