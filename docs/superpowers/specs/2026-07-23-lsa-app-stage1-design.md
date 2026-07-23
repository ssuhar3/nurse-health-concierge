# LSA App — Stage 1 Design (Advocate Portal + Time Clock + Admin)

**Date:** 2026-07-23 · **Approved by:** Sheila (design conversation)
**Repo:** NEW repo `lsa-app` (Next.js). The existing `nurse-health-concierge` static site is untouched.

## Purpose

The LSA App is the working tool for Legacy Senior Advocate's team: advocates log in on their phones to clock in/out of appointments and see their client roster; an admin team (Pat + managers) oversees advocates, clients, assignments, and timesheets; clients (Stage 2) log in to see only their own information. Stage 1 delivers the advocate + admin halves.

## Non-negotiable constraint: no PHI in this app

Per the HIPAA gap assessment (`docs/hipaa/gap-assessment.md`) and the hybrid decision:

- The database stores **people, roles, contact info, assignments, client codes, and hours** — ordinary business records.
- It NEVER stores medical content: no visit transcripts, no medical documents, no diagnoses, no doctor names, no appointment medical context.
- Medical content lives in BAA-covered Google Drive; the app stores only **links** (`drive_folder_url`).
- Time entries reference clients by internal id/code; notes fields in this app must not be used for medical detail (UI copy will say so).
- This keeps the app's stack (Supabase free tier, Netlify) fully compliant with LSA's HIPAA-grade policy with **zero** BAA requirement.

## Architecture

- **Frontend/backend:** Next.js (App Router), single app, mobile-first responsive. Installable as a home-screen app (web manifest; no offline mode in Stage 1).
- **Hosting:** Netlify (existing LSA Netlify account; separate site from the marketing site). Push-to-main deploys.
- **Data + auth:** existing Supabase project `rtulqglpbfeocbfskczu` — new isolated tables + Supabase Auth (email/password). Row Level Security (RLS) enforces role access at the database.
- **No new recurring costs.** Supabase free tier and Netlify free tier cover Stage 1.

## Roles

| Role | Can see | Can do |
|---|---|---|
| `admin` | everything | invite/manage advocates; add/import/assign clients; view/export all timesheets; correct any time entry |
| `advocate` | own profile, assigned clients, own time entries | clock in/out; add/edit own entries (flagged); view roster + client contact cards |
| `client` | (Stage 2) own client record only | view advocate contact card, own info, Drive/Calendar links |

Admins are also profiles with role `admin`; the first admin is seeded manually.

## Data model (Supabase, all new tables prefixed `app_`)

- `app_profiles` — `id uuid` (= auth.users id), `role text` check in ('admin','advocate','client'), `full_name`, `phone`, `active bool default true`, `created_at`.
- `app_clients` — `id uuid`, `client_code text unique` (e.g. "DM-014"), `full_name`, `phone`, `email`, `city`, `status text` ('active','paused','ended'), `source text` ('onboarding','manual'), `onboarding_ref text null` (id of the originating `client_onboarding` row), `drive_folder_url text null`, `created_at`.
- `app_client_assignments` — `id uuid`, `client_id`, `advocate_id` (profile id), `active bool`, `assigned_at`. A client may have one active advocate (Stage 1 rule); history rows keep `active=false`.
- `app_time_entries` — `id uuid`, `advocate_id`, `client_id null` (null = non-client work, e.g. training), `clock_in_at timestamptz`, `clock_out_at timestamptz null`, `in_lat/in_lng/in_accuracy double null`, `out_lat/out_lng/out_accuracy double null`, `location_denied bool default false`, `edited bool default false`, `edit_note text null`, `created_at`.
- `app_client_users` — (Stage 2) `client_id`, `user_id` linking a client login to its `app_clients` row.

**RLS policies (the heart of the design):**
- `admin`: full read/write on all `app_*` tables.
- `advocate`: read own `app_profiles` row; read `app_clients` joined through an active assignment; read/insert/update only `app_time_entries` where `advocate_id = auth.uid()`; no delete (corrections are edits, deletions are admin-only).
- `client` (Stage 2): read own `app_clients` row via `app_client_users`; nothing else.
- Existing tables (`advocate_applications`, `client_onboarding`, …) get NO new exposure; the import reads them server-side with the service key, never from the browser.

## Client intake — "both" flows

1. **Import:** admin screen lists `client_onboarding` rows not yet linked to an `app_clients` record (matched via `onboarding_ref`); one click creates the client with non-sensitive fields (name, phone, email, city) and a generated `client_code`.
2. **Manual add:** form for phone intakes; same fields; code auto-generated (initials + sequence, editable).

## Time clock behavior

- One open entry per advocate at a time. Clock In → pick client (roster + "non-client work") → browser geolocation requested → entry created. Clock Out closes it with a second GPS point.
- Location denied/unavailable → entry saves anyway with `location_denied=true`; UI shows a small "no location" tag. Never block the clock on GPS.
- Manual add or edit of any entry sets `edited=true` (+ optional note). Admin timesheet views surface the flag. Original punch times are overwritten (no versioning in Stage 1 — the flag is the audit signal).
- Weekly view for the advocate; admin timesheets filter by advocate/date range; CSV export (advocate, client code, in, out, duration, edited, location-present).

## Screens (Stage 1)

**Advocate (phone-first):** Login → Home (status card + big Clock In/Out) → client picker → My Clients (roster; tap = contact card + Drive link if set) → My Hours (week list + add/edit) → Profile.
**Admin (desktop-friendly, works on phone):** Dashboard (currently clocked-in list) → Advocates (list, invite by email via Supabase invite, deactivate) → Clients (list, add, import, assign advocate) → Timesheets (filters, edited flags, CSV export).

## Error handling

- Failed clock request → clear retry message; no silent loss. (Offline queueing is deliberately out of scope for Stage 1.)
- Session expiry → redirect to login preserving the return path.
- All server actions validate role again server-side (defense in depth on top of RLS).

## Testing

- Unit tests (Vitest) for: client-code generation, duration/CSV computation, entry-overlap guard.
- RLS integration tests: scripted checks with three test users (admin/advocate/client) asserting the access matrix above — an advocate cannot read another advocate's clients/entries; a client can read only their row.
- Manual phone checklist per release: login, clock in with/without GPS permission, roster, edit entry, admin export.

## Stage roadmap

1. **Stage 1 (this spec):** auth + roles, advocate clock + roster, admin management + timesheets.
2. **Stage 2:** client logins + client portal page (advocate card, own info, Drive/Calendar links).
3. **Stage 3 (pilot-informed):** Drive file embeds; Healthie GraphQL integration if the 30-day pilot concludes a branded medical portal is worth the seat cost.

## Out of scope (Stage 1)

Payroll math beyond CSV, offline mode, push notifications, in-app chat (Google Chat covers it), any medical content, scheduling/calendar (Google Calendar covers it), client-facing anything.
