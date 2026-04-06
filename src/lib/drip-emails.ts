/**
 * Resend drip email integration for Super Plot.
 *
 * 5-email sequence triggered when a lead submits their email on the landing page:
 *   1 — Welcome (immediate)
 *   2 — Value: flood zone education (day 2)
 *   3 — Social proof: $40K mistake story (day 5)
 *   4 — Upgrade CTA: free vs. paid comparison (day 7)
 *   5 — Wilco Land offer (day 10)
 *
 * Env vars required:
 *   RESEND_API_KEY   — Resend API key
 *   EMAIL_FROM       — sender address (default: Super Plot <hello@superplot.com>)
 *   NEXT_PUBLIC_BASE_URL — portal base URL for links (default: https://superplot.com)
 */

const RESEND_API_URL = "https://api.resend.com/emails";

export interface DripEmailConfig {
  sequence: 1 | 2 | 3 | 4 | 5;
  /** Days after sign-up to schedule this email */
  delayDays: number;
  subject: string;
  previewText: string;
}

export const DRIP_SEQUENCE: DripEmailConfig[] = [
  { sequence: 1, delayDays: 0, subject: "Your free Super Plot report is ready", previewText: "Here's what we found on your parcel — and what it means for your land." },
  { sequence: 2, delayDays: 2, subject: "Did you know your land might be in a flood zone?", previewText: "One data point can change what a parcel is worth. Here's why it matters." },
  { sequence: 3, delayDays: 5, subject: "How one investor avoided a $40K mistake on vacant land", previewText: "The data was all there. She just didn't know where to look." },
  { sequence: 4, delayDays: 7, subject: "Your free report only tells part of the story", previewText: "The valuation gap between what land lists for and what it sells for is real." },
  { sequence: 5, delayDays: 10, subject: "Thinking of selling your land? Get a cash offer.", previewText: "No listings, no commissions, no waiting. Just a direct cash offer." },
];

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://superplot.com";
}

function emailWrapper(previewText: string, body: string): string {
  const base = baseUrl();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Super Plot</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;color:#f9fafb;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;">
<tr><td align="center" style="padding:40px 16px;">
<table width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
  <!-- Header -->
  <tr>
    <td style="background:#166534;padding:24px 32px;">
      <a href="${base}" style="text-decoration:none;">
        <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Super Plot</span>
        <span style="color:#86efac;font-size:13px;margin-left:8px;">Property Intelligence</span>
      </a>
    </td>
  </tr>
  <!-- Body -->
  <tr>
    <td style="padding:40px 32px;color:#1f2937;font-size:15px;line-height:1.7;">
      ${body}
    </td>
  </tr>
  <!-- Footer -->
  <tr>
    <td style="background:#f3f4f6;padding:24px 32px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
        Super Plot &middot; Property intelligence for vacant land<br/>
        <a href="${base}/unsubscribe" style="color:#6b7280;">Unsubscribe</a> &middot;
        <a href="${base}" style="color:#6b7280;">Visit superplot.com</a>
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<p style="margin:28px 0;">
    <a href="${href}" style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;">${label}</a>
  </p>`;
}

function buildHtml(sequence: number): string {
  const base = baseUrl();
  const orderUrl = `${base}/order`;

  switch (sequence) {
    case 1:
      return emailWrapper(DRIP_SEQUENCE[0].previewText, `
        <p>Hi,</p>
        <p>Your free Super Plot report is ready. We've pulled the key intelligence on your parcel so you don't have to.</p>
        <p><strong>Here's what's included in every free report:</strong></p>
        <ul style="padding-left:20px;margin:12px 0;">
          <li style="margin-bottom:6px;"><strong>Zoning summary</strong> — what can legally be built or used on this land</li>
          <li style="margin-bottom:6px;"><strong>Topography overview</strong> — slope, elevation, and drainage flags</li>
          <li style="margin-bottom:6px;"><strong>Road access</strong> — public vs. private access status</li>
          <li style="margin-bottom:6px;"><strong>Utility proximity</strong> — water, electric, and sewer distance estimates</li>
          <li style="margin-bottom:6px;"><strong>Recent comparable sales</strong> — what nearby parcels have actually sold for</li>
        </ul>
        <p>This is the baseline every smart land investor checks before making a move.</p>
        ${ctaButton(orderUrl, "View My Free Report →")}
        <p>Want the full picture? Our Standard ($59) and Premium ($99) reports go deeper — with multi-method valuations, flood zone overlays, mineral rights notes, and a written investment summary.</p>
        <p>More on that soon.</p>
        <p style="margin-top:32px;">— The Super Plot Team</p>
      `);

    case 2:
      return emailWrapper(DRIP_SEQUENCE[1].previewText, `
        <p>Hi,</p>
        <p>One of the most overlooked risks in vacant land investment is flood zone designation.</p>
        <p>A parcel inside FEMA's Special Flood Hazard Area (SFHA) can:</p>
        <ul style="padding-left:20px;margin:12px 0;">
          <li style="margin-bottom:6px;"><strong>Wipe out buildability</strong> — many lenders won't finance construction in high-risk zones</li>
          <li style="margin-bottom:6px;"><strong>Kill resale value</strong> — buyers price in mandatory flood insurance</li>
          <li style="margin-bottom:6px;"><strong>Trigger holding costs</strong> — even if you never build, flood insurance may apply</li>
        </ul>
        <p>This is the kind of insight that separates investors who lose money on land from those who don't.</p>
        <p>Our <strong>Standard and Premium reports</strong> include a full FEMA flood zone overlay for your specific parcel — not just a county-level estimate. They also include:</p>
        <ul style="padding-left:20px;margin:12px 0;">
          <li style="margin-bottom:6px;">Three-method valuation (investor offer price, public market listing price, auction estimate)</li>
          <li style="margin-bottom:6px;">Wetlands and environmental flags</li>
          <li style="margin-bottom:6px;">County zoning contact information</li>
          <li style="margin-bottom:6px;">A written investment summary you can forward to a partner or lender</li>
        </ul>
        ${ctaButton(`${orderUrl}?tier=standard`, "Upgrade to a Full Report — Starting at $59 →")}
        <p>No subscription. No hidden fees. Just the data you need on the land you're evaluating.</p>
        <p style="margin-top:32px;">— The Super Plot Team</p>
      `);

    case 3:
      return emailWrapper(DRIP_SEQUENCE[2].previewText, `
        <p>Hi,</p>
        <p>Here's a scenario we hear from land investors all the time.</p>
        <blockquote style="border-left:4px solid #d1fae5;margin:24px 0;padding:16px 20px;background:#f0fdf4;border-radius:0 8px 8px 0;color:#374151;font-style:italic;">
          <p style="margin:0 0 12px;">A land investor — let's call her Sarah — found a 5-acre parcel listed at $28,000 in a rural Texas county. The listing looked clean. Price per acre was in line with comps she found on Zillow. She almost made an offer.</p>
          <p style="margin:0 0 12px;">Before she did, she ran a full parcel intelligence report.</p>
          <p style="margin:0 0 12px;">What she found: the parcel had no legal road access. A neighboring landowner had closed off the informal track years ago. The county had no plans to add a road easement. Without access, the land was effectively landlocked — worth a fraction of the asking price.</p>
          <p style="margin:0;">She passed. Six months later, the parcel sold to someone else for $11,000.</p>
        </blockquote>
        <p>That's what good due diligence looks like.</p>
        <p>Super Plot was built to surface exactly these flags — access issues, zoning conflicts, utility gaps, flood exposure — before you commit capital.</p>
        <p><strong>What investors use Super Plot for:</strong></p>
        <ul style="padding-left:20px;margin:12px 0;">
          <li style="margin-bottom:6px;">Pre-offer due diligence on parcels they're actively evaluating</li>
          <li style="margin-bottom:6px;">Portfolio screening to quickly triage a list of potential acquisitions</li>
          <li style="margin-bottom:6px;">Seller conversations — understanding what a parcel is really worth before listing</li>
        </ul>
        ${ctaButton(orderUrl, "Get a Full Report on Your Parcel →")}
        <p>Standard reports start at $59. Takes about 5 minutes to order.</p>
        <p style="margin-top:32px;">— The Super Plot Team</p>
        <p style="font-size:13px;color:#6b7280;">We're in beta. Your feedback makes the product better — reply to this email anytime.</p>
      `);

    case 4:
      return emailWrapper(DRIP_SEQUENCE[3].previewText, `
        <p>Hi,</p>
        <p>Your free Super Plot report gave you a solid foundation.</p>
        <p>But here's what it didn't include — and why it matters.</p>
        <p><strong>Free report vs. paid report:</strong></p>
        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:13px;margin:16px 0;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="text-align:left;border:1px solid #e5e7eb;padding:10px 12px;"></th>
              <th style="text-align:center;border:1px solid #e5e7eb;padding:10px 12px;">Free</th>
              <th style="text-align:center;border:1px solid #e5e7eb;padding:10px 12px;background:#f0fdf4;">Standard ($59)</th>
              <th style="text-align:center;border:1px solid #e5e7eb;padding:10px 12px;">Premium ($99)</th>
            </tr>
          </thead>
          <tbody>
            ${[
              ["Zoning summary", "✓", "✓", "✓"],
              ["Topography overview", "✓", "✓", "✓"],
              ["Road access status", "✓", "✓", "✓"],
              ["Utility proximity", "✓", "✓", "✓"],
              ["Comparable sales", "Basic", "Full", "Full"],
              ["FEMA flood zone overlay", "—", "✓", "✓"],
              ["Wetlands / environmental flags", "—", "✓", "✓"],
              ["Investor offer valuation", "—", "✓", "✓"],
              ["Public market listing valuation", "—", "✓", "✓"],
              ["Auction estimate", "—", "—", "✓"],
              ["Written investment summary", "—", "—", "✓"],
              ["Mineral rights overview", "—", "—", "✓"],
            ].map(([label, free, standard, premium], i) => `
            <tr style="background:${i % 2 === 0 ? '#ffffff' : '#fafafa'};">
              <td style="border:1px solid #e5e7eb;padding:8px 12px;">${label}</td>
              <td style="border:1px solid #e5e7eb;padding:8px 12px;text-align:center;color:${free === '—' ? '#9ca3af' : '#16a34a'};">${free}</td>
              <td style="border:1px solid #e5e7eb;padding:8px 12px;text-align:center;color:${standard === '—' ? '#9ca3af' : '#16a34a'};background:#f0fdf4;">${standard}</td>
              <td style="border:1px solid #e5e7eb;padding:8px 12px;text-align:center;color:${premium === '—' ? '#9ca3af' : '#16a34a'};">${premium}</td>
            </tr>`).join('')}
          </tbody>
        </table>
        <p>The valuation section alone is worth the price. Most land investors are working off gut feel and a few Zillow comps. Our multi-method valuation gives you a defensible number — whether you're making an offer, setting a listing price, or walking away.</p>
        ${ctaButton(`${orderUrl}?tier=standard`, "Order a Standard Report — $59 →")}
        ${ctaButton(`${orderUrl}?tier=premium`, "Order a Premium Report — $99 →")}
        <p style="font-size:13px;color:#6b7280;">One report. No subscription. Instant access.</p>
        <p style="margin-top:32px;">— The Super Plot Team</p>
        <p style="font-size:13px;color:#6b7280;">Questions? Reply to this email — we read every one.</p>
      `);

    case 5:
      return emailWrapper(DRIP_SEQUENCE[4].previewText, `
        <p>Hi,</p>
        <p>One last thing — and this one's only for landowners who are open to selling.</p>
        <p>If you've been thinking about exiting your parcel, <strong>Wilco Land</strong> makes direct cash offers on vacant land across the U.S.</p>
        <p><strong>Here's how it works:</strong></p>
        <ol style="padding-left:20px;margin:12px 0;">
          <li style="margin-bottom:8px;">Submit your parcel details (takes 2 minutes)</li>
          <li style="margin-bottom:8px;">Wilco's team reviews the property — typically within 48 hours</li>
          <li style="margin-bottom:8px;">You receive a no-obligation cash offer</li>
          <li style="margin-bottom:8px;">If you accept, closing happens fast — typically 2–3 weeks</li>
        </ol>
        <p><strong>Why land owners sell to Wilco Land:</strong></p>
        <ul style="padding-left:20px;margin:12px 0;">
          <li style="margin-bottom:6px;">No real estate agent, no commissions</li>
          <li style="margin-bottom:6px;">No repairs, surveys, or clean-up required</li>
          <li style="margin-bottom:6px;">No waiting months for a retail buyer</li>
          <li style="margin-bottom:6px;">Simple, transparent process</li>
        </ul>
        <p>This isn't for everyone. If you're holding land for appreciation or development, keep holding.</p>
        <p>But if you've got a parcel that's been sitting — paying taxes, generating nothing — a cash offer might be worth knowing.</p>
        ${ctaButton(`${base}/wilco-land`, "Get a Cash Offer from Wilco Land →")}
        <p style="font-size:13px;color:#6b7280;">No obligation. Takes 2 minutes.</p>
        <p style="margin-top:32px;">— The Super Plot Team</p>
        <p style="font-size:13px;color:#6b7280;">Super Plot is a property intelligence platform. Wilco Land is an affiliated land investment company.</p>
      `);

    default:
      throw new Error(`Unknown drip sequence: ${sequence}`);
  }
}

function buildText(sequence: number): string {
  const base = baseUrl();
  const orderUrl = `${base}/order`;

  const texts: Record<number, string> = {
    1: `Your free Super Plot report is ready.\n\nWe've pulled zoning, topography, road access, utility proximity, and comparable sales for your parcel.\n\nView your report: ${orderUrl}\n\nWant deeper analysis? Standard ($59) and Premium ($99) reports include flood zone overlays, multi-method valuations, and written investment summaries.\n\n— The Super Plot Team\n\nUnsubscribe: ${base}/unsubscribe`,
    2: `Did you know your land might be in a flood zone?\n\nA FEMA flood zone designation can wipe out buildability, kill resale value, and trigger mandatory flood insurance.\n\nOur Standard and Premium reports include a full FEMA flood zone overlay — plus wetlands flags, three-method valuations, and a written investment summary.\n\nUpgrade: ${orderUrl}?tier=standard\n\n— The Super Plot Team\n\nUnsubscribe: ${base}/unsubscribe`,
    3: `How one investor avoided a $40K mistake on vacant land.\n\nA land investor found a 5-acre parcel listed at $28,000. It looked clean. But a parcel intelligence report revealed it had no legal road access — effectively landlocked. She passed. The parcel sold 6 months later for $11,000.\n\nSuper Plot surfaces these flags before you commit capital: access issues, zoning conflicts, utility gaps, flood exposure.\n\nGet a full report: ${orderUrl}\n\n— The Super Plot Team\n\nUnsubscribe: ${base}/unsubscribe`,
    4: `Your free report only tells part of the story.\n\nFree reports include zoning, topography, road access, utility proximity, and basic comparable sales.\n\nStandard ($59) adds: full comparable sales, FEMA flood zone, wetlands flags, investor offer valuation, and public market listing valuation.\n\nPremium ($99) adds: auction estimate, written investment summary, and mineral rights overview.\n\nOrder Standard: ${orderUrl}?tier=standard\nOrder Premium: ${orderUrl}?tier=premium\n\n— The Super Plot Team\n\nUnsubscribe: ${base}/unsubscribe`,
    5: `Thinking of selling your land? Wilco Land makes direct cash offers on vacant land across the U.S.\n\nNo agent, no commissions, no waiting. Submit your parcel details, get a cash offer within 48 hours, close in 2–3 weeks.\n\nGet a cash offer: ${base}/wilco-land\n\n— The Super Plot Team\n\nUnsubscribe: ${base}/unsubscribe`,
  };

  return texts[sequence] ?? "";
}

export async function sendDripEmail(
  to: string,
  sequence: 1 | 2 | 3 | 4 | 5
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Super Plot <hello@superplot.com>";
  const config = DRIP_SEQUENCE[sequence - 1];

  if (!apiKey) {
    console.log(`[drip] No RESEND_API_KEY — skipping email ${sequence} to ${to}`);
    return;
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: config.subject,
      html: buildHtml(sequence),
      text: buildText(sequence),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error (seq ${sequence}): ${res.status} ${err}`);
  }
}
