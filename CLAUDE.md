# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Senior Health Concierge (SHC) — a static website with serverless backend for senior health advocacy services. Three public-facing forms feed into a staff dashboard, with data stored in Google Sheets (primary) and Supabase (secondary, migration in progress).

## Commands

```bash
npm run dev          # Start Netlify Dev server on port 8889 (proxies functions + static files)
npm run serve        # Static-only server (no functions) on port 8889
```

No build step — the site is plain HTML/CSS/JS served directly. No test framework is configured.

## Architecture

### Frontend (static HTML, no framework)
- `index.html` — Main marketing site. All CSS is inline (no external stylesheet). Uses CSS custom properties defined in `:root` for the design system (navy/blue/gold/teal palette, Playfair Display + Inter fonts).
- `advocate-apply.html` — Advocate application form → `submit-application`
- `client-inquiry.html` — Client inquiry form → `submit-inquiry`
- `client-onboarding.html` — Client onboarding form → `submit-onboarding`
- `dashboard/` — Staff dashboard (JWT-protected). `login.html` + `index.html` + `app.js` + `styles.css`

### Backend (Netlify Functions — `netlify/functions/`)
All serverless functions use CommonJS (`require`/`module.exports`). Each form submission function follows the same pattern: validate → sanitize → generate PDFs → upload to S3 → append to Google Sheets → insert to Supabase → send email notification.

**Form handlers:**
- `submit-application.js` — Advocate applications (generates summary PDF + fillable packet)
- `submit-inquiry.js` — Client inquiries
- `submit-onboarding.js` — Client onboarding (generates summary PDF + client packet)
- `submit-contact.js` — General contact form (email only, no Sheets/Supabase)

**Dashboard API:**
- `dashboard-data.js` — CRUD for all three tabs (applications/inquiries/clients). Reads from Google Sheets with action query param (`list`, `stats`, `updateStatus`, `addNote`, `delete`).
- `dashboard-auth.js` — JWT login/verify using bcrypt password hash from env
- `dashboard-email.js` — Send templated emails from the dashboard

**Shared utilities (`netlify/functions/utils/`):**
- `sheets.js` — Google Sheets API wrapper with 60s in-memory cache
- `supabase.js` — Supabase REST insert (anon key, fire-and-forget; Sheets is still primary)
- `email.js` — Nodemailer SMTP transport (Gmail)
- `s3.js` — AWS S3 upload for generated PDFs
- `validate.js` — Input sanitization and required-field validation
- `auth.js` — Google service account auth
- `pdf.js`, `fillable-pdf.js` — Advocate application PDF generation (pdfkit/pdf-lib)
- `client-summary-pdf.js`, `client-packet-pdf.js` — Client PDF generation
- `dashboard-auth.js` — JWT session management
- `email-templates.js` — Email templates for dashboard

### Data Storage (dual-write)
- **Google Sheets** — Primary data store. Three tabs: "Advocate Applications", "Client Inquiries", "Client Onboarding". Column indices are hardcoded in `dashboard-data.js` TABS config.
- **Supabase** — Secondary store (migration target). Schema in `supabase-schema.sql`. Inserts are non-blocking and failures are logged but don't break the flow.
- **AWS S3** — PDF document storage

### Google Apps Script
- `google-apps-script/process-returned-applications.gs` — Processes returned advocate application packets in Google Drive

## Key Patterns

- All functions return responses via the shared `respond()` helper from `validate.js` which handles CORS headers
- Dashboard auth uses HTTP-only JWT cookies; `verifySession()` middleware checks auth on dashboard API calls
- Form data gets a `crypto.randomUUID()` ID assigned server-side, stored in the last column of each Sheets tab
- Google Sheets column indices are 0-based and hardcoded — changing sheet structure requires updating `TABS` in `dashboard-data.js`

## Environment Variables

See `.env.example` for the full list. Key groups: Google Sheets API (service account), SMTP (Gmail app password), Google Drive, S3 (AWS credentials), Dashboard auth (bcrypt hash + JWT secret), Supabase (URL + anon key). Variables are set in Netlify's environment settings for production.

## Deployment

Deployed on Netlify. Push to `main` triggers auto-deploy. The `netlify.toml` configures CORS headers for functions and `noindex` on `/dashboard/*`.

## Working Style
- I am non-technical and learning. Explain what you're doing before doing it.
- Make small testable changes, not large rewrites.
- Flag anything that could break form submissions or data going to Google Sheets.
- Current status: Supabase migration in progress — Sheets is still primary.