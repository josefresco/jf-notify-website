/**
 * Cloudflare Pages Middleware — A/B Test Router
 *
 * Intercepts requests to / and randomly assigns visitors to one of 5 variants.
 * Sticky via cookie (30 days) so returning visitors always see the same version.
 * Conversion tracking via ?ref=v{n} appended to all Stripe links in each variant.
 *
 * Variants:
 *   v1 — Fear       ("You're losing leads right now")
 *   v2 — ROI        ("$29 pays for itself with one saved lead")
 *   v3 — Simplicity ("Set up in 5 minutes, works forever")
 *   v4 — Technical  ("Direct API. No middleware.")
 *   v5 — Urgency    ("The plugin serious site owners rely on")
 */

const COOKIE_NAME = 'jfn_ab';
const VARIANTS    = ['1', '2', '3', '4', '5'];

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Only intercept the homepage — pass everything else through
  if (url.pathname !== '/' && url.pathname !== '/index.html') {
    return next();
  }

  // Read existing variant cookie
  const cookies = request.headers.get('Cookie') || '';
  const match   = cookies.match(new RegExp(`${COOKIE_NAME}=v([1-5])`));
  const isNew   = !match;
  const variant = match
    ? match[1]
    : VARIANTS[Math.floor(Math.random() * VARIANTS.length)];

  // Fetch the variant's static HTML from Pages assets
  const assetUrl = new URL(`/index-v${variant}.html`, url.origin);
  const asset    = await env.ASSETS.fetch(new Request(assetUrl.toString()));

  const res = new Response(asset.body, {
    status:  asset.status,
    headers: new Headers(asset.headers),
  });

  // Prevent Cloudflare from caching the A/B response — each visitor must hit the function
  res.headers.set('Cache-Control', 'no-store');
  // Vary on Cookie so CDN knows responses differ per visitor
  res.headers.set('Vary', 'Cookie');

  // Set cookie on first visit
  if (isNew) {
    res.headers.append(
      'Set-Cookie',
      `${COOKIE_NAME}=v${variant}; Path=/; Max-Age=2592000; SameSite=Lax`
    );
  }

  return res;
}
