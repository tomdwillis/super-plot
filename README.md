# Super Plot — Web Portal

Self-serve web portal for the Super Plot property intelligence platform. Users enter a parcel APN or address, select a report tier, pay via Stripe, and receive a downloadable PDF report.

## Tech Stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **Styling**: Tailwind CSS
- **Payments**: Stripe Checkout
- **Database**: PostgreSQL (via `pg`)

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with value prop, pricing, and email capture |
| `/order` | 3-step report ordering flow (parcel → tier → checkout) |
| `/order/success` | Post-payment confirmation |
| `/dashboard` | Report delivery dashboard (lookup by email) |

## API Routes

| Endpoint | Description |
|---|---|
| `POST /api/stripe/checkout` | Create Stripe Checkout session |
| `POST /api/stripe/webhook` | Stripe webhook (payment confirmation → trigger pipeline) |
| `GET /api/reports?email=` | List reports for a user |
| `GET /api/reports/:id` | Get single report status |
| `POST /api/email-capture` | Landing page email capture |
| `POST /api/pipeline/process-orders` | Internal: sweep `generating` orders through the report pipeline (cron + webhook) |

## Report Tiers & Pricing

| Tier | Price | Turnaround |
|---|---|---|
| Basic | $29 | ~2 min |
| Professional | $59 | ~5 min |
| Premium | $99 | ~10 min |

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in DATABASE_URL, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET

# Run DB migration
psql $DATABASE_URL -f migrations/001_portal_schema.sql

# Start dev server
npm run dev
```

App runs at http://localhost:3000.

## Stripe Webhook

In local dev, use the Stripe CLI to forward events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret from the CLI output into `STRIPE_WEBHOOK_SECRET`.

## Pipeline Integration

The report pipeline is fully wired. When `checkout.session.completed` fires:

1. Stripe webhook sets `report_orders.status = 'generating'`
2. Webhook immediately calls `processGeneratingOrders()` (fire-and-forget)
3. Pipeline resolves the parcel (APN lookup or geocode), generates the report, sets `status='ready'` with `pdf_url`
4. Dashboard auto-refreshes every 15 seconds until the report is ready

`src/lib/pipeline.ts` contains the core logic. Stubs are used for parcel lookup and PDF generation until the external services are configured via env vars:

| Env var | Purpose |
|---|---|
| `PARCEL_LOOKUP_URL` | APN → parcel data service |
| `GEOCODE_SERVICE_URL` | Address → parcel data service |
| `PIPELINE_SERVICE_URL` | Report generation service |
| `PIPELINE_SECRET` | Bearer token protecting `/api/pipeline/process-orders` |

A Vercel cron job (`vercel.json`) calls `POST /api/pipeline/process-orders` every 5 minutes as a safety net for any orders the webhook fire-and-forget may have missed.

