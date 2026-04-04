/**
 * GET /api/admin/analytics
 *
 * Internal analytics endpoint for the lead-to-order conversion funnel.
 * Aggregates data from email_captures, leads, and report_orders tables.
 *
 * Protected by ANALYTICS_SECRET env var (Bearer token).
 * If ANALYTICS_SECRET is unset, the endpoint is open (for local dev).
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ANALYTICS_SECRET;
  if (!secret) return true; // open if unset
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  return token === secret;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const [
    signupsRow,
    leadsRow,
    orderTotalsRow,
    revenueRow,
    byTierRows,
    byStatusRows,
    dailyRows,
    leadConversionRow,
  ] = await Promise.all([
    // Email signups
    query<{ count: string }>("SELECT COUNT(*) AS count FROM email_captures"),

    // CRM leads
    query<{ count: string; converted: string }>(
      `SELECT
        COUNT(*) AS count,
        COUNT(*) FILTER (WHERE status = 'converted') AS converted
       FROM leads`
    ),

    // Order totals: total, free, paid, completed_paid
    query<{
      total: string;
      free_orders: string;
      paid_orders: string;
      completed_paid: string;
    }>(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE price_cents = 0) AS free_orders,
        COUNT(*) FILTER (WHERE price_cents > 0) AS paid_orders,
        COUNT(*) FILTER (WHERE price_cents > 0 AND status = 'ready') AS completed_paid
       FROM report_orders`
    ),

    // Revenue: sum of price_cents for completed paid orders (in dollars)
    query<{ total_revenue_cents: string; stripe_orders: string }>(
      `SELECT
        COALESCE(SUM(price_cents), 0) AS total_revenue_cents,
        COUNT(*) FILTER (WHERE stripe_payment_intent_id IS NOT NULL AND status = 'ready') AS stripe_orders
       FROM report_orders
       WHERE price_cents > 0 AND status = 'ready'`
    ),

    // Orders by tier
    query<{ tier: string; count: string; revenue_cents: string }>(
      `SELECT
        tier,
        COUNT(*) AS count,
        COALESCE(SUM(price_cents) FILTER (WHERE status = 'ready'), 0) AS revenue_cents
       FROM report_orders
       GROUP BY tier
       ORDER BY COUNT(*) DESC`
    ),

    // Orders by status
    query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) AS count
       FROM report_orders
       GROUP BY status
       ORDER BY COUNT(*) DESC`
    ),

    // Daily orders + revenue for last 30 days
    query<{ day: string; orders: string; revenue_cents: string; paid_orders: string }>(
      `SELECT
        DATE_TRUNC('day', created_at)::date AS day,
        COUNT(*) AS orders,
        COUNT(*) FILTER (WHERE price_cents > 0) AS paid_orders,
        COALESCE(SUM(price_cents) FILTER (WHERE status = 'ready'), 0) AS revenue_cents
       FROM report_orders
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY day
       ORDER BY day ASC`
    ),

    // Lead-to-order conversion: leads who also placed an order
    query<{ converted_leads: string }>(
      `SELECT COUNT(DISTINCT l.email) AS converted_leads
       FROM leads l
       INNER JOIN report_orders ro ON ro.email = l.email`
    ),
  ]);

  const totalSignups = parseInt(signupsRow[0]?.count ?? "0", 10);
  const totalLeads = parseInt(leadsRow[0]?.count ?? "0", 10);
  const convertedLeads = parseInt(leadsRow[0]?.converted ?? "0", 10);

  const totals = orderTotalsRow[0];
  const totalOrders = parseInt(totals?.total ?? "0", 10);
  const freeOrders = parseInt(totals?.free_orders ?? "0", 10);
  const paidOrders = parseInt(totals?.paid_orders ?? "0", 10);
  const completedPaid = parseInt(totals?.completed_paid ?? "0", 10);

  const rev = revenueRow[0];
  const totalRevenueCents = parseInt(rev?.total_revenue_cents ?? "0", 10);

  const leadsOrdered = parseInt(leadConversionRow[0]?.converted_leads ?? "0", 10);

  // Conversion rates
  const signupToOrderRate =
    totalSignups > 0 ? totalOrders / totalSignups : null;
  const freeToPayRate = freeOrders > 0 ? paidOrders / freeOrders : null;
  const paidCompletionRate =
    paidOrders > 0 ? completedPaid / paidOrders : null;
  const leadToOrderRate = totalLeads > 0 ? leadsOrdered / totalLeads : null;

  return NextResponse.json({
    funnel: {
      email_signups: totalSignups,
      crm_leads: totalLeads,
      crm_leads_converted: convertedLeads,
      total_orders: totalOrders,
      free_orders: freeOrders,
      paid_orders: paidOrders,
      completed_paid_orders: completedPaid,
      total_revenue_cents: totalRevenueCents,
    },
    conversion_rates: {
      signup_to_order: signupToOrderRate,
      free_to_paid: freeToPayRate,
      paid_completion: paidCompletionRate,
      lead_to_order: leadToOrderRate,
      leads_who_ordered: leadsOrdered,
    },
    by_tier: byTierRows.map((r) => ({
      tier: r.tier,
      count: parseInt(r.count, 10),
      revenue_cents: parseInt(r.revenue_cents, 10),
    })),
    by_status: byStatusRows.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
    })),
    daily_last_30: dailyRows.map((r) => ({
      day: r.day,
      orders: parseInt(r.orders, 10),
      paid_orders: parseInt(r.paid_orders, 10),
      revenue_cents: parseInt(r.revenue_cents, 10),
    })),
  });
}
