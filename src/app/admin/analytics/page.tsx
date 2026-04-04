"use client";

import { useState, useEffect } from "react";

interface FunnelData {
  funnel: {
    email_signups: number;
    crm_leads: number;
    crm_leads_converted: number;
    total_orders: number;
    free_orders: number;
    paid_orders: number;
    completed_paid_orders: number;
    total_revenue_cents: number;
  };
  conversion_rates: {
    signup_to_order: number | null;
    free_to_paid: number | null;
    paid_completion: number | null;
    lead_to_order: number | null;
    leads_who_ordered: number;
  };
  by_tier: { tier: string; count: number; revenue_cents: number }[];
  by_status: { status: string; count: number }[];
  daily_last_30: { day: string; orders: number; paid_orders: number; revenue_cents: number }[];
}

function fmt$(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtPct(rate: number | null) {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

function fmtNum(n: number) {
  return n.toLocaleString("en-US");
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ?? "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function FunnelStep({
  label,
  count,
  pct,
  isFirst,
}: {
  label: string;
  count: number;
  pct?: number | null;
  isFirst?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      {!isFirst && (
        <div className="flex flex-col items-center w-8">
          <div className="w-px h-4 bg-gray-200" />
          {pct !== undefined && pct !== null && (
            <span className="text-[10px] text-gray-400 font-medium">{fmtPct(pct)}</span>
          )}
          <div className="w-px h-4 bg-gray-200" />
        </div>
      )}
      {isFirst && <div className="w-8" />}
      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-lg font-bold text-gray-900">{fmtNum(count)}</span>
      </div>
    </div>
  );
}

const TIER_ORDER = ["free", "basic", "professional", "premium"];
const TIER_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  basic: "bg-blue-50 text-blue-700",
  professional: "bg-purple-50 text-purple-700",
  premium: "bg-amber-50 text-amber-700",
};

const STATUS_COLORS: Record<string, string> = {
  ready: "bg-green-50 text-green-700",
  generating: "bg-blue-50 text-blue-700",
  pending: "bg-yellow-50 text-yellow-700",
  failed: "bg-red-50 text-red-700",
  qa_pending: "bg-indigo-50 text-indigo-700",
  needs_review: "bg-orange-50 text-orange-700",
};

function MiniBarChart({
  data,
}: {
  data: { day: string; orders: number; revenue_cents: number }[];
}) {
  if (!data.length) return <p className="text-sm text-gray-400 text-center py-4">No data</p>;

  const maxOrders = Math.max(...data.map((d) => d.orders), 1);

  return (
    <div className="flex items-end gap-1 h-24 w-full">
      {data.map((d) => {
        const h = Math.max((d.orders / maxOrders) * 100, 4);
        const label = new Date(d.day).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        return (
          <div
            key={d.day}
            className="flex-1 flex flex-col items-center justify-end group relative"
          >
            <div
              className="w-full bg-brand-400 rounded-t group-hover:bg-brand-600 transition-colors"
              style={{ height: `${h}%` }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
              {label}: {d.orders} orders · {fmt$(d.revenue_cents)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);

  async function fetchAnalytics(token?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) {
        setError("Invalid analytics secret.");
        setAuthed(false);
        return;
      }
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setData(json);
      setAuthed(true);
    } catch (e) {
      setError((e as Error).message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  // Try unauthenticated first (works when ANALYTICS_SECRET is unset)
  useEffect(() => {
    fetchAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authed && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Analytics</h1>
          <p className="text-sm text-gray-500 mb-6">Enter your analytics secret to continue.</p>
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
          )}
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchAnalytics(secret)}
            placeholder="Analytics secret"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 mb-3"
          />
          <button
            onClick={() => fetchAnalytics(secret)}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            View Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading analytics…</div>
      </div>
    );
  }

  if (!data) return null;

  const { funnel, conversion_rates, by_tier, by_status, daily_last_30 } = data;

  const sortedTiers = [...by_tier].sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)
  );

  const totalOrdersForPct = Math.max(funnel.total_orders, 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Funnel Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Lead-to-order conversion · last updated now</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchAnalytics(secret || undefined)}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Refresh
            </button>
            <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
              User Dashboard →
            </a>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total Revenue"
            value={fmt$(funnel.total_revenue_cents)}
            sub={`${fmtNum(funnel.completed_paid_orders)} paid orders completed`}
            accent="text-brand-600"
          />
          <MetricCard
            label="Total Orders"
            value={fmtNum(funnel.total_orders)}
            sub={`${fmtNum(funnel.paid_orders)} paid · ${fmtNum(funnel.free_orders)} free`}
          />
          <MetricCard
            label="Email Signups"
            value={fmtNum(funnel.email_signups)}
            sub="Landing page captures"
          />
          <MetricCard
            label="CRM Leads"
            value={fmtNum(funnel.crm_leads)}
            sub={`${fmtNum(funnel.crm_leads_converted)} converted`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Funnel */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Conversion Funnel</h2>
            <div className="space-y-0">
              <FunnelStep
                label="Email Signups"
                count={funnel.email_signups}
                isFirst
              />
              <FunnelStep
                label="CRM Leads"
                count={funnel.crm_leads}
                pct={conversion_rates.lead_to_order !== null
                  ? funnel.crm_leads / Math.max(funnel.email_signups, 1)
                  : null}
              />
              <FunnelStep
                label="Any Order"
                count={funnel.total_orders}
                pct={conversion_rates.signup_to_order}
              />
              <FunnelStep
                label="Paid Order"
                count={funnel.paid_orders}
                pct={conversion_rates.free_to_paid}
              />
              <FunnelStep
                label="Completed Paid"
                count={funnel.completed_paid_orders}
                pct={conversion_rates.paid_completion}
              />
            </div>
          </div>

          {/* Orders by tier */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Orders by Tier</h2>
            <div className="space-y-3">
              {sortedTiers.map((t) => {
                const pct = (t.count / totalOrdersForPct) * 100;
                return (
                  <div key={t.tier}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          TIER_COLORS[t.tier] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {t.tier}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {fmtNum(t.count)}
                        </span>
                        {t.revenue_cents > 0 && (
                          <span className="text-xs text-gray-400 ml-1">
                            · {fmt$(t.revenue_cents)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-brand-400 h-1.5 rounded-full"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {sortedTiers.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
              )}
            </div>
          </div>

          {/* Orders by status */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Orders by Status</h2>
            <div className="space-y-2">
              {by_status.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {s.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{fmtNum(s.count)}</span>
                </div>
              ))}
              {by_status.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Daily chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Daily Orders — Last 30 Days</h2>
            <div className="text-xs text-gray-400">Hover bars for detail</div>
          </div>
          <MiniBarChart data={daily_last_30} />
          {daily_last_30.length > 0 && (
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>
                {new Date(daily_last_30[0].day).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span>
                {new Date(daily_last_30[daily_last_30.length - 1].day).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" }
                )}
              </span>
            </div>
          )}
        </div>

        {/* Conversion rate summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Conversion Rates</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {fmtPct(conversion_rates.signup_to_order)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Signup → Order</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {fmtPct(conversion_rates.free_to_paid)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Free → Paid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {fmtPct(conversion_rates.paid_completion)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Paid → Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {fmtPct(conversion_rates.lead_to_order)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Lead → Any Order</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
