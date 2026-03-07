# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Marketing site for the **Gravity Forms Telegram Notifier** WordPress plugin. Built with **Eleventy 3.x** (SSG). Blog/resource pages use shared Nunjucks layouts. Homepage A/B variants are passthrough-copied static HTML files.

## Structure

```
/
├── src/                                # Eleventy input directory
│   ├── index.html                      # Main homepage (passthrough — dark theme)
│   ├── index-v1.html … index-v5.html   # A/B test variants (passthrough)
│   ├── success.html                    # Post-purchase thank-you (passthrough)
│   ├── robots.txt / sitemap.xml / llms.txt
│   ├── *.png                           # Plugin logo/screenshot assets
│   ├── assets/
│   │   └── css/blog.css               # All styles for blog/resource pages
│   ├── _includes/
│   │   ├── layouts/
│   │   │   ├── base.njk               # HTML shell (head, fonts, shared partials)
│   │   │   └── post.njk               # Blog post layout (extends base)
│   │   └── partials/
│   │       ├── header.njk             # Dark branded header (shared)
│   │       └── footer.njk             # Dark branded footer (shared)
│   └── blog/
│       ├── blog.11tydata.json         # Default front matter for all posts
│       ├── index.njk                  # Blog listing page (/blog/)
│       └── *.njk                      # Individual blog post templates
├── _site/                              # Eleventy build output (gitignored)
├── functions/
│   ├── _middleware.js                  # A/B test router (Cloudflare Pages Function)
│   └── api/
│       └── webhook.js                 # Stripe webhook handler
├── eleventy.config.js
├── package.json
└── .eleventyignore                     # Excludes homepage HTML from template processing
```

## Development

```bash
npm install        # First time
npm run dev        # Serve locally with live reload (http://localhost:8080)
npm run build      # Production build to _site/
```

## Architecture

### Blog / Resource Pages
- **Light/white design** with dark branded header and footer
- Layout chain: post content → `post.njk` → `base.njk`
- All styles in `src/assets/css/blog.css` (external file, not embedded)
- Blog post front matter: `title`, `description`, `date`, `tag`, `readTime`, `ctaTitle`, `ctaText`, `related[]`, `schema`
- Permalink pattern: `/blog/{{ page.fileSlug }}.html` (preserves existing links in A/B variants)

### Homepage A/B Testing
- `functions/_middleware.js` intercepts `/` requests and randomly assigns one of 5 variants
- Variant files (`index-v1.html` through `index-v5.html`) are passthrough-copied to `_site/`
- Listed in `.eleventyignore` to prevent Eleventy from treating them as templates

### Cloudflare Pages Functions
- `functions/` directory stays at repo root (not in `src/`) — Cloudflare Pages reads it independently
- Build command: `npm run build`
- Output directory: `_site`

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
- Target deployment: **Cloudflare Pages**

## Deployment Checklist

- [x] Domain `jfnotify.com` registered (Namecheap) — DNS → Cloudflare
- [x] Cloudflare Pages connected to `jf-notify-website` GitHub repo
- [x] Custom domain assigned, SSL live
- [x] Cloudflare Pages env vars set (`STRIPE_WEBHOOK_SECRET`, `BREVO_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME`)
- [x] Stripe webhook registered at `https://jfnotify.com/api/webhook`
- [x] Eleventy build configured (build command: `npm run build`, output: `_site`)
- [ ] Stripe Payment Link success redirect → `https://jfnotify.com/success.html`
- [ ] Verify Brevo sender email is confirmed
- [ ] End-to-end test purchase
