"use client";

import { useState, useEffect, useCallback } from "react";
import ChallengeReportPanel from "@/components/ChallengeReportPanel";
import WilcoLandOfferCTA from "@/components/WilcoLandOfferCTA";

type ReportStatus = "pending" | "generating" | "ready" | "failed";
type ReportTier = "free" | "basic" | "professional" | "premium";

interface Report {
  id: string;
  parcel_input: string;
  input_type: "apn" | "address";
  tier: ReportTier;
  status: ReportStatus;
  title: string;
  pdf_url: string | null;
  price_cents: number;
  created_at: string;
}

const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; color: string; icon: string }
> = {
  pending: { label: "Queued", color: "text-yellow-700 bg-yellow-50", icon: "⏳" },
  generating: { label: "Generating", color: "text-blue-700 bg-blue-50", icon: "⚙️" },
  ready: { label: "Ready", color: "text-green-700 bg-green-50", icon: "✓" },
  failed: { label: "Failed", color: "text-red-700 bg-red-50", icon: "✕" },
};

const TIER_LABELS: Record<ReportTier, string> = {
  free: "Free",
  basic: "Basic",
  professional: "Professional",
  premium: "Premium",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeOpenId, setChallengeOpenId] = useState<string | null>(null);

  const fetchReports = useCallback(async (emailToFetch: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/reports?email=${encodeURIComponent(emailToFetch)}`
      );
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      setReports(data.reports || []);
    } catch {
      setError("Could not load your reports. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh in-progress reports every 15 seconds
  useEffect(() => {
    if (!submittedEmail) return;
    const hasActive = reports.some(
      (r) => r.status === "pending" || r.status === "generating"
    );
    if (!hasActive) return;
    const interval = setInterval(() => fetchReports(submittedEmail), 15000);
    return () => clearInterval(interval);
  }, [submittedEmail, reports, fetchReports]);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setSubmittedEmail(email);
    fetchReports(email);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <a href="/" className="text-sm text-brand-600 hover:underline">
            ← Back to Super Plot
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mt-3">My Reports</h1>
          <p className="text-gray-500 mt-1">
            Enter the email you used at checkout to view your reports.
          </p>
        </div>

        {/* Email lookup */}
        <form onSubmit={handleLookup} className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your email address
          </label>
          <div className="flex gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-300 focus:outline-none focus:border-brand-400 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {loading ? "Loading…" : "View Reports"}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Reports list */}
        {submittedEmail && !loading && (
          <>
            {reports.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="font-semibold text-gray-700 mb-2">No reports found</h3>
                <p className="text-sm text-gray-400 mb-6">
                  No reports are associated with {submittedEmail}.
                </p>
                <a
                  href="/order"
                  className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors inline-block"
                >
                  Order Your First Report
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  {reports.length} report{reports.length !== 1 ? "s" : ""} for{" "}
                  <span className="font-medium">{submittedEmail}</span>
                </p>
                {reports.map((report) => {
                  const sc = STATUS_CONFIG[report.status];
                  return (
                    <div
                      key={report.id}
                      className="bg-white rounded-2xl border border-gray-200 p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${sc.color}`}
                            >
                              <span>{sc.icon}</span>
                              {sc.label}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2.5 py-0.5 rounded-full">
                              {TIER_LABELS[report.tier]}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mt-2 text-sm">
                            {report.title ||
                              (report.input_type === "apn"
                                ? `APN ${report.parcel_input}`
                                : report.parcel_input)}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">
                            Ordered {formatDate(report.created_at)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {report.status === "ready" && report.pdf_url ? (
                            <a
                              href={report.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                            >
                              <span>↓</span> Download PDF
                            </a>
                          ) : report.status === "generating" ||
                            report.status === "pending" ? (
                            <div className="flex items-center gap-1.5 text-sm text-gray-400">
                              <span className="animate-spin inline-block">⟳</span>
                              In progress…
                            </div>
                          ) : report.status === "failed" ? (
                            <a
                              href="mailto:hello@superplot.com"
                              className="text-sm text-red-600 hover:underline"
                            >
                              Contact support
                            </a>
                          ) : null}
                        </div>
                      </div>

                      {(report.status === "pending" ||
                        report.status === "generating") && (
                        <div className="mt-4">
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`bg-brand-500 h-1.5 rounded-full transition-all duration-500 ${
                                report.status === "generating" ? "w-2/3" : "w-1/6"
                              }`}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5">
                            {report.status === "generating"
                              ? "Analyzing parcel data…"
                              : "Queued for processing…"}
                          </p>
                        </div>
                      )}

                      {report.status === "ready" && (
                        <div className="mt-4">
                          {challengeOpenId === report.id ? (
                            <ChallengeReportPanel
                              reportId={report.id}
                              reportTitle={report.title}
                              onClose={() => setChallengeOpenId(null)}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setChallengeOpenId(report.id)}
                              className="text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline"
                            >
                              Challenge this valuation →
                            </button>
                          )}
                          <WilcoLandOfferCTA
                            reportId={report.id}
                            parcelApn={
                              report.input_type === "apn"
                                ? report.parcel_input
                                : undefined
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="text-center pt-4">
                  <a
                    href="/order"
                    className="text-sm text-brand-600 hover:underline font-medium"
                  >
                    + Order another report
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
