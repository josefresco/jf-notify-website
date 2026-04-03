/**
 * Cloudflare Pages Middleware — pass-through
 *
 * A/B testing removed. All visitors see the unified homepage (index.html).
 */

export async function onRequest(context) {
  return context.next();
}
