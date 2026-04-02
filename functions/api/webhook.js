const DOWNLOAD_URL =
  'https://github.com/josefresco/jf-notify/releases/latest/download/jf-notify.zip';

// Only handle POST requests
export async function onRequestPost(context) {
  const { request, env } = context;

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const isValid = await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response('Invalid signature', { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const name = session.customer_details?.name;

    if (email) {
      try {
        await sendPurchaseEmail(email, name, env.BREVO_API_KEY, env.SENDER_EMAIL, env.SENDER_NAME);
      } catch (err) {
        // Log but still return 200 — Stripe must not retry for delivery failures
        console.error('Brevo send failed:', err.message);
      }
    }
  }

  // Always return 200 so Stripe doesn't retry
  return new Response('OK', { status: 200 });
}

/**
 * Verifies a Stripe webhook signature using the Web Crypto API (no npm needed).
 * Rejects events with a timestamp older than 5 minutes (replay attack protection).
 */
async function verifyStripeSignature(body, signatureHeader, secret) {
  try {
    const parts = Object.fromEntries(
      signatureHeader.split(',').map((p) => p.split('=', 2))
    );
    const timestamp = parts['t'];
    const v1 = parts['v1'];

    if (!timestamp || !v1) return false;

    // Reject stale events (>5 min)
    const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
    if (age > 300) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signed = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(`${timestamp}.${body}`)
    );

    const computed = Array.from(new Uint8Array(signed))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return computed === v1;
  } catch {
    return false;
  }
}

/**
 * Sends the post-purchase email via Brevo with the plugin download link.
 */
async function sendPurchaseEmail(email, name, apiKey, senderEmail, senderName) {
  const firstName = name?.split(' ')[0] || 'there';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Plugin Download</title>
</head>
<body style="margin:0;padding:0;background:#0C0C16;font-family:'IBM Plex Mono',Courier,monospace;">
  <div style="max-width:560px;margin:40px auto;background:#131320;border:1px solid #1C1C2E;overflow:hidden;">
    <div style="background:#07070D;padding:28px 40px;border-bottom:1px solid #1C1C2E;">
      <div style="font-size:1.4rem;font-weight:800;letter-spacing:0.04em;color:#00D9F5;">JF<span style="color:#DDDDF0;">Notify</span></div>
    </div>
    <div style="padding:40px;">
      <p style="color:#DDDDF0;font-size:0.95rem;margin:0 0 20px;">Hi ${firstName},</p>
      <p style="color:#5C5C80;font-size:0.88rem;margin:0 0 32px;line-height:1.8;">
        Your copy of <strong style="color:#DDDDF0;">JF Notify</strong> is ready. Click below to download the plugin zip file.
      </p>
      <a href="${DOWNLOAD_URL}"
         style="display:inline-block;background:#00D9F5;color:#07070D;padding:14px 32px;text-decoration:none;font-weight:700;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;">
        Download Plugin
      </a>
      <div style="border-top:1px solid #1C1C2E;margin:40px 0;"></div>
      <p style="color:#00D9F5;font-size:0.78rem;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 14px;">Quick Setup</p>
      <ol style="color:#5C5C80;font-size:0.82rem;padding-left:20px;line-height:2;margin:0 0 28px;">
        <li>Upload and activate the plugin in WordPress</li>
        <li>Message <strong style="color:#DDDDF0;">@BotFather</strong> on Telegram to create a bot and get your API token</li>
        <li>Enter your bot token and chat ID in <strong style="color:#DDDDF0;">Settings → JF Notify</strong></li>
      </ol>
      <p style="color:#5C5C80;font-size:0.78rem;margin:0;line-height:1.7;">
        Questions? Reply to this email and I'll help you get set up.
      </p>
    </div>
  </div>
</body>
</html>`;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email, name: name || '' }],
      subject: 'Your JF Notify download',
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo API ${res.status}: ${text}`);
  }
}
