"use client";

import { useState } from "react";

const TIERS = [
  {
    name: "Basic",
    price: "$29",
    description: "Essential parcel data for quick screening.",
    features: [
      "APN, ownership & zoning",
      "Acreage & lot dimensions",
      "County assessed value",
      "Flood zone & wetland flags",
      "Access & utility notes",
    ],
  },
  {
    name: "Professional",
    price: "$59",
    popular: true,
    description: "Full intelligence for active deal evaluation.",
    features: [
      "Everything in Basic",
      "Comparable sales analysis",
      "Market value estimate",
      "Environmental risk summary",
      "HOA & deed restriction check",
      "Entitlement & permit history",
    ],
  },
  {
    name: "Premium",
    price: "$99",
    description: "Comprehensive due diligence for serious buyers.",
    features: [
      "Everything in Professional",
      "Full valuation model",
      "Development feasibility analysis",
      "Title chain summary",
      "Infrastructure cost estimates",
      "Investment thesis memo",
    ],
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I used to spend 3 hours per parcel just gathering basic data. Super Plot gives me a Professional report in minutes. It's changed how I screen deals.",
    author: "Mark T.",
    role: "Land investor, Texas",
  },
  {
    quote:
      "The environmental and flood data alone saved me from a $200K mistake on a parcel I almost closed on. Worth every penny.",
    author: "Sarah K.",
    role: "Acquisitions, Western States Land Co.",
  },
  {
    quote:
      "I run 20–30 preliminary screens a week. The Basic tier is perfect — fast, cheap, and tells me whether to keep looking.",
    author: "James R.",
    role: "Wholesale land investor",
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
            Now in beta — join 200+ land investors
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Know everything about a vacant parcel{" "}
            <span className="text-brand-600">before you make an offer.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Super Plot delivers instant property intelligence reports for vacant land — ownership,
            valuation, environmental risk, zoning, and more. From $29 per report.
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
            No account required for Basic reports. Results in under 5 minutes.
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
                desc: "Select Basic ($29), Professional ($59), or Premium ($99) based on your needs.",
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
                className={`bg-white rounded-2xl border p-8 flex flex-col ${
                  tier.popular
                    ? "border-brand-500 shadow-xl shadow-brand-50 relative"
                    : "border-gray-200"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
                  <div className="text-4xl font-extrabold text-gray-900 mt-2">{tier.price}</div>
                  <p className="text-sm text-gray-500 mt-1">per report</p>
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
                  href={`/order?tier=${tier.name.toLowerCase()}`}
                  className={`text-center font-semibold py-3 rounded-xl transition-colors ${
                    tier.popular
                      ? "bg-brand-600 hover:bg-brand-700 text-white"
                      : "border border-gray-200 hover:border-brand-500 hover:text-brand-600 text-gray-700"
                  }`}
                >
                  Order {tier.name}
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
            Trusted by land investors
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
