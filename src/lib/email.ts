/**
 * Email sending via Resend API.
 * Set RESEND_API_KEY and EMAIL_FROM in environment variables.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendMagicLinkEmail(
  to: string,
  magicLinkUrl: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Super Plot <noreply@superplot.com>";

  if (!apiKey) {
    // In development, log the link instead of failing
    console.log(`[email] Magic link for ${to}: ${magicLinkUrl}`);
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
      subject: "Your Super Plot report is ready — sign in",
      html: `
        <p>Hi,</p>
        <p>Your Super Plot land intelligence report is ready. Click the link below to sign in and view your report:</p>
        <p><a href="${magicLinkUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">View My Report</a></p>
        <p>This link expires in 1 hour and can only be used once.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
      text: `Your Super Plot land intelligence report is ready.\n\nSign in here: ${magicLinkUrl}\n\nThis link expires in 1 hour and can only be used once.`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Email send failed: ${res.status} ${err}`);
  }
}
