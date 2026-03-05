# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static HTML landing/sales page for the **Gravity Forms Telegram Notifier** WordPress plugin. Single self-contained file with no build tooling, frameworks, or package managers.

## Structure

```
/
├── index.html                          # Entire site — HTML + embedded CSS
├── success.html                        # Post-purchase thank-you page (Stripe redirect target)
├── functions/
│   └── api/
│       └── webhook.js                  # Cloudflare Pages Function — Stripe webhook handler
├── gf-logo.png                         # Plugin logo assets
├── gf-logo-cropped.png
├── gf-logo-simple.png
└── gravity-forms-telegram-notifier-settings.png  # Plugin screenshot
```

## Development

No build step. Edit `index.html` directly.

**To preview locally:**
```bash
# Python (usually pre-installed)
python -m http.server 8080

# Node (if available)
npx serve .
```

## Architecture

Everything lives in `index.html`:
- All CSS is embedded in a `<style>` block in `<head>`
- No JavaScript (pure HTML/CSS)
- Responsive layout via CSS Grid and Flexbox
- Sections: Header → Hero → Problem/Solution → Features → How It Works → Screenshot → Message Preview → Pricing → Footer

**Checkout:** Stripe Payment Link — `https://buy.stripe.com/7sY9ATeD40sn1Gg95P5os02` ($29 one-time).

**Post-purchase flow:** Stripe redirects to `success.html` → buyer receives email via Brevo with plugin download link.

**Plugin download URL:** Always points to latest GitHub Release:
`https://github.com/josefresco/gravity-forms-telegram-notifier/releases/latest/download/gravity-forms-telegram-notifier.zip`

## Webhook Function (`functions/api/webhook.js`)

Cloudflare Pages Function. Handles `POST /api/webhook` from Stripe.
- Verifies Stripe signature using Web Crypto API (no npm dependencies)
- On `checkout.session.completed` → sends purchase email via Brevo API
- Always returns 200 to Stripe to prevent retries; Brevo errors are logged only

**Required Cloudflare Pages environment variables:**

| Variable | Description |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard → Webhooks |
| `BREVO_API_KEY` | From Brevo → SMTP & API → API Keys |
| `SENDER_EMAIL` | Verified Brevo sender address |
| `SENDER_NAME` | e.g. `GF Telegram Notifier` |

## Key Details

- The **plugin code itself is not in this repo**: `https://github.com/josefresco/gravity-forms-telegram-notifier`
- Live at: `https://jfnotify.com`
- GitHub repo: `https://github.com/josefresco/jf-notify-website`
- Target deployment: **Cloudflare Pages** (required for the Pages Function webhook handler — GitHub Pages cannot run serverless functions)

## Deployment Checklist

- [x] Domain `jfnotify.com` registered (Namecheap) — DNS → Cloudflare
- [x] Cloudflare Pages connected to `jf-notify-website` GitHub repo
- [x] Custom domain assigned, SSL live
- [x] Cloudflare Pages env vars set (`STRIPE_WEBHOOK_SECRET`, `BREVO_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME`)
- [x] Stripe webhook registered at `https://jfnotify.com/api/webhook`
- [ ] Stripe Payment Link success redirect → `https://jfnotify.com/success.html`
- [ ] Verify Brevo sender email is confirmed
- [ ] End-to-end test purchase
