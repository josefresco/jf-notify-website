# JF Notify — Marketing Site

Marketing site for the **[Gravity Forms Telegram Notifier](https://github.com/josefresco/gravity-forms-telegram-notifier)** WordPress plugin, live at [jfnotify.com](https://jfnotify.com).

Static site built with **[Eleventy 3.x](https://www.11ty.dev/)**, deployed to **Cloudflare Pages**.

## Quick start

```bash
npm install
npm run dev     # http://localhost:8080 with live reload
npm run build   # production build to _site/
```

## What's here

- **Homepage** (`src/index.html`) — single unified landing page, passthrough-copied (not templated). No A/B testing is active; `functions/_middleware.js` is a plain pass-through.
- **Blog / resources** (`src/blog/*.njk`) — Nunjucks templates sharing `post.njk` → `base.njk` layouts and `src/assets/css/blog.css`.
- **Post-purchase page** (`src/success.html`) — Stripe redirect target after checkout.
- **Cloudflare Pages Functions** (`functions/`) — stays at repo root; `functions/api/webhook.js` handles the Stripe → Brevo purchase-email flow.

Full architecture notes, front-matter reference, and deployment details live in [`CLAUDE.md`](./CLAUDE.md).

## Checkout & purchase flow

- Checkout: Stripe Payment Link, $29 one-time
- On purchase, Stripe webhook (`functions/api/webhook.js`) sends a download-link email via Brevo
- Plugin download always points to the latest GitHub Release of `gravity-forms-telegram-notifier`

## Environment variables (Cloudflare Pages)

| Variable | Description |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard → Webhooks |
| `BREVO_API_KEY` | From Brevo → SMTP & API → API Keys |
| `SENDER_EMAIL` | Verified Brevo sender address |
| `SENDER_NAME` | e.g. `GF Telegram Notifier` |

## Deployment

Push to `main` — Cloudflare Pages builds automatically (`npm run build`, output `_site`).
