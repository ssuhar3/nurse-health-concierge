# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Legacy Senior Advocates (LSA) — a static marketing website with serverless form handling. Three public-facing forms store submissions in Supabase (primary) and generate PDFs; staff review everything in the separate **LSA portal** (`lsa-portal.vercel.app`, repo `ssuhar3/nhc-portal`), which reads the same Supabase project. This repo has no staff-facing surface of its own — the old `/dashboard` was retired 2026-08-11 and now redirects to the portal login.

## Commands

```bash
npm run dev          # Start Netlify Dev server on port 8889 (proxies functions + static files)
npm run serve        # Static-only server (no functions) on port 8889
```

No build step — the site is plain HTML/CSS/JS served directly. No test framework is configured.

## Architecture

### Frontend (static HTML, no framework)
- `index.html` — Main marketing site. All CSS is inline (no external stylesheet). Uses CSS custom properties defined in `:root` for the design system (navy/blue/gold/teal palette, Playfair Display + Inter fonts).
- `advocate-apply.html` — Advocate application form → `submit-application` (page 301-redirects to the portal's `/apply`; the function remains live)
- `client-inquiry.html` — Client inquiry form → `submit-inquiry`
- `client-onboarding.html` — Client onboarding form → `submit-onboarding`

There is no staff UI in this repo. `/dashboard` and `/dashboard/*` 301-redirect to `https://lsa-portal.vercel.app/login` (see `netlify.toml`).

### Backend (Netlify Functions — `netlify/functions/`)
All serverless functions use CommonJS (`require`/`module.exports`). Each form submission function follows the same pattern: validate → sanitize → generate PDFs → upload to S3 → append to Google Sheets → insert to Supabase → send email notification.

**Form handlers:**
- `submit-application.js` — Advocate applications (generates summary PDF + fillable packet)
- `submit-inquiry.js` — Client inquiries
- `submit-onboarding.js` — Client onboarding (generates summary PDF + client packet)
- `submit-contact.js` — General contact form (email only, no Sheets/Supabase)

**Shared utilities (`netlify/functions/utils/`):**
- `sheets.js` — Google Sheets API wrapper with 60s in-memory cache (only `submit-application` still uses it)
- `supabase.js` — Supabase REST insert (anon key; primary store for all three forms)
- `email.js` — Nodemailer SMTP transport (Gmail)
- `s3.js` — AWS S3 upload for generated PDFs
- `validate.js` — Input sanitization and required-field validation
- `auth.js` — Google service account auth
- `pdf.js`, `fillable-pdf.js` — Advocate application PDF generation (pdfkit/pdf-lib)
- `client-summary-pdf.js`, `client-packet-pdf.js` — Client PDF generation
- `drive.js` — Google Drive upload (inquiry PDFs archive to the Workspace shared drive)

### Data Storage
- **Supabase** — Primary store for all three forms (`advocate_applications`, `client_inquiries`, `client_onboarding`). Schema in `supabase-schema.sql`. This is the same Supabase project the LSA portal reads.
- **Google Sheets** — Legacy: only advocate applications still append a row ("Advocate Applications" tab). Inquiry/onboarding Sheets writes were retired 2026-08 (`4bdac5f`).
- **Google Drive** — Inquiry submissions archive a PDF to the Workspace shared drive (non-fatal on failure; Supabase is authoritative).
- **AWS S3** — PDF document storage

### Google Apps Script
- `google-apps-script/process-returned-applications.gs` — Processes returned advocate application packets in Google Drive

## Key Patterns

- All functions return responses via the shared `respond()` helper from `validate.js` which handles CORS headers
- Form data gets a `crypto.randomUUID()` ID assigned server-side
- There is no auth code in this repo — staff authentication lives entirely in the LSA portal (nhc-portal)

## Environment Variables

See `.env.example` for the full list. Key groups: Google Sheets API (service account), SMTP (Gmail app password), Google Drive, S3 (AWS credentials), Supabase (URL + anon key). Variables are set in Netlify's environment settings for production. (Dashboard auth vars — `DASHBOARD_JWT_SECRET`, `DASHBOARD_PASSWORD_HASH` — are obsolete since the dashboard retirement; nothing reads them.)

## Deployment

Deployed on Netlify. Push to `main` triggers auto-deploy. The `netlify.toml` configures CORS headers for functions and 301 redirects: `/advocate-apply*` → the portal's `/apply`, `/dashboard*` → the portal's `/login`.

## Working Style
- I am non-technical and learning. Explain what you're doing before doing it.
- Make small testable changes, not large rewrites.
- Flag anything that could break form submissions or the data reaching Supabase.
- Current status: Supabase is primary for all forms; only advocate applications still dual-write to Sheets.