# LSA App Stage 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Stage 1 of the LSA App (spec: `docs/superpowers/specs/2026-07-23-lsa-app-stage1-design.md`): a new Next.js app with Supabase Auth where advocates clock in/out (GPS-captured) and see their client roster, and admins manage advocates, clients, assignments, and timesheets.

**Architecture:** New repo `lsa-app` (Next.js App Router + TypeScript + Tailwind), Supabase (existing project `rtulqglpbfeocbfskczu`) for Postgres + Auth, with Row Level Security enforcing the role matrix. All new tables prefixed `app_`. Deployed on Netlify.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, @supabase/supabase-js + @supabase/ssr, Vitest.

## Global Constraints

- Repo root: `C:\Users\ssuha\Projects\lsa-app` (new). GitHub: `ssuhar3/lsa-app`, private. The `nurse-health-concierge` repo is NOT modified by this plan.
- **No PHI:** the app's tables never store medical content. The onboarding import copies ONLY these `client_onboarding` columns: `client_name`, `phone`, `email`, `city`, and `id` (as `onboarding_ref`). Never `dob`, `medical_conditions`, `medications`, `pcp`, `specialists`, `allergies`, or any other field.
- Existing Supabase tables (`advocate_applications`, `client_inquiries`, `client_onboarding`) are never altered; they are read only via the service-role key in server code.
- All new tables/functions are prefixed `app_`.
- Roles are exactly: `admin`, `advocate`, `client`.
- Brand: navy `#1a365d`, gold `#b8913d`, cream `#f9f7f2`; mobile-first.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. URL is `https://rtulqglpbfeocbfskczu.supabase.co`. Anon key: copy from the `nurse-health-concierge` Netlify env (or its local `.env`). Service key: Supabase dashboard → Settings → API (user-assist if not on hand).
- SQL is applied via the Supabase dashboard SQL editor (paste `supabase/schema.sql`) — the `supabase-nhc` MCP is not authenticated. This is a **user-assist step**; the plan's executor prepares the file and asks.
- Tests: Vitest for lib functions (TDD), `scripts/rls-test.mjs` for the access matrix, `npm run build` as the per-task smoke gate.
- Commit after every task. Do not push until Task 12's checkpoint.

---

### Task 1: Scaffold the repo

**Files:**
- Create: entire `C:\Users\ssuha\Projects\lsa-app` via create-next-app
- Create: `.env.local` (git-ignored), `.env.example`, `vitest.config.ts`
- Modify: `package.json` (test script), `src/app/globals.css` (brand tokens)

**Interfaces:**
- Consumes: nothing.
- Produces: the repo every later task works in; `npm test` and `npm run build` both green.

- [ ] **Step 1: Scaffold**

```bash
cd C:\Users\ssuha\Projects
npx --yes create-next-app@15 lsa-app --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm --turbopack
cd lsa-app
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest
```

- [ ] **Step 2: Env files**

`.env.example` (committed):
```
NEXT_PUBLIC_SUPABASE_URL=https://rtulqglpbfeocbfskczu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=copy-from-nurse-health-concierge-env
SUPABASE_SERVICE_ROLE_KEY=copy-from-supabase-dashboard-settings-api
```
`.env.local` (git-ignored — verify `.gitignore` covers `.env*` except `.env.example`): same keys with real values. Copy the anon key from `C:\Users\ssuha\Projects\nurse-health-concierge\.env` (`SUPABASE_ANON_KEY`); if absent, STOP and report NEEDS_CONTEXT asking the user for the two keys.

- [ ] **Step 3: Vitest config + test script**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } });
```
In `package.json` scripts add: `"test": "vitest run"`.

- [ ] **Step 4: Brand tokens**

Append to `src/app/globals.css`:
```css
@theme {
  --color-navy: #1a365d;
  --color-gold: #b8913d;
  --color-cream: #f9f7f2;
}
```

- [ ] **Step 5: Verify**

Run: `npm run build` → succeeds. `npm test` → "no test files found" is acceptable at this task only.

- [ ] **Step 6: Init repo + commit**

```bash
git init -b main
git add -A
git commit -m "chore: scaffold lsa-app (Next.js 15 + Tailwind + Supabase deps + Vitest)"
```

---

### Task 2: Database schema + RLS (SQL file, user-applied)

**Files:**
- Create: `supabase/schema.sql`

**Interfaces:**
- Consumes: nothing.
- Produces: tables `app_profiles`, `app_clients`, `app_client_assignments`, `app_time_entries`, `app_client_users`; SQL function `app_role()`; the RLS matrix every later task relies on.

- [ ] **Step 1: Write `supabase/schema.sql` exactly:**

```sql
-- LSA App Stage 1 schema. All objects prefixed app_. Never touches existing tables.
create table app_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','advocate','client')),
  full_name text not null,
  phone text default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table app_clients (
  id uuid primary key default gen_random_uuid(),
  client_code text not null unique,
  full_name text not null,
  phone text default '',
  email text default '',
  city text default '',
  status text not null default 'active' check (status in ('active','paused','ended')),
  source text not null check (source in ('onboarding','manual')),
  onboarding_ref uuid null unique,
  drive_folder_url text null,
  created_at timestamptz not null default now()
);

create table app_client_assignments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references app_clients(id) on delete cascade,
  advocate_id uuid not null references app_profiles(id) on delete cascade,
  active boolean not null default true,
  assigned_at timestamptz not null default now()
);
create unique index app_one_active_advocate_per_client
  on app_client_assignments(client_id) where active;

create table app_time_entries (
  id uuid primary key default gen_random_uuid(),
  advocate_id uuid not null references app_profiles(id) on delete cascade,
  client_id uuid null references app_clients(id) on delete set null,
  clock_in_at timestamptz not null,
  clock_out_at timestamptz null,
  in_lat double precision null, in_lng double precision null, in_accuracy double precision null,
  out_lat double precision null, out_lng double precision null, out_accuracy double precision null,
  location_denied boolean not null default false,
  edited boolean not null default false,
  edit_note text null,
  created_at timestamptz not null default now(),
  check (clock_out_at is null or clock_out_at > clock_in_at)
);
create unique index app_one_open_entry_per_advocate
  on app_time_entries(advocate_id) where clock_out_at is null;

create table app_client_users (
  client_id uuid not null references app_clients(id) on delete cascade,
  user_id uuid not null references app_profiles(id) on delete cascade,
  primary key (client_id, user_id)
);

create or replace function app_role() returns text
language sql stable security definer set search_path = public as
$$ select role from app_profiles where id = auth.uid() $$;

alter table app_profiles enable row level security;
alter table app_clients enable row level security;
alter table app_client_assignments enable row level security;
alter table app_time_entries enable row level security;
alter table app_client_users enable row level security;

-- admin: full access everywhere
create policy admin_all_profiles on app_profiles for all
  using (app_role() = 'admin') with check (app_role() = 'admin');
create policy admin_all_clients on app_clients for all
  using (app_role() = 'admin') with check (app_role() = 'admin');
create policy admin_all_assignments on app_client_assignments for all
  using (app_role() = 'admin') with check (app_role() = 'admin');
create policy admin_all_entries on app_time_entries for all
  using (app_role() = 'admin') with check (app_role() = 'admin');
create policy admin_all_client_users on app_client_users for all
  using (app_role() = 'admin') with check (app_role() = 'admin');

-- everyone: read own profile
create policy read_own_profile on app_profiles for select
  using (id = auth.uid());

-- advocate: read clients assigned to them
create policy advocate_read_assigned_clients on app_clients for select
  using (app_role() = 'advocate' and exists (
    select 1 from app_client_assignments a
    where a.client_id = app_clients.id and a.advocate_id = auth.uid() and a.active));

-- advocate: read own assignments
create policy advocate_read_own_assignments on app_client_assignments for select
  using (app_role() = 'advocate' and advocate_id = auth.uid());

-- advocate: read/insert/update own time entries; no delete
create policy advocate_read_own_entries on app_time_entries for select
  using (app_role() = 'advocate' and advocate_id = auth.uid());
create policy advocate_insert_own_entries on app_time_entries for insert
  with check (app_role() = 'advocate' and advocate_id = auth.uid());
create policy advocate_update_own_entries on app_time_entries for update
  using (app_role() = 'advocate' and advocate_id = auth.uid())
  with check (app_role() = 'advocate' and advocate_id = auth.uid());

-- client (Stage 2): read own client row via link table
create policy client_read_own_link on app_client_users for select
  using (user_id = auth.uid());
create policy client_read_own_client on app_clients for select
  using (app_role() = 'client' and exists (
    select 1 from app_client_users cu
    where cu.client_id = app_clients.id and cu.user_id = auth.uid()));
```

- [ ] **Step 2: Apply (user-assist)**

Report to the controller: ask the user to paste `supabase/schema.sql` into the Supabase dashboard SQL editor (project `rtulqglpbfeocbfskczu`) and run it. Do not proceed to verification until the user confirms.

- [ ] **Step 3: Verify**

After user confirmation, run (Node one-off with service key from `.env.local`):
```bash
node -e "const{createClient}=require('@supabase/supabase-js');require('dotenv').config({path:'.env.local'});const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);s.from('app_profiles').select('id').limit(1).then(r=>console.log(r.error??'schema OK'))"
```
Expected: `schema OK`. (Install `dotenv` as a devDependency if missing: `npm i -D dotenv`.)

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql package.json package-lock.json
git commit -m "feat: Stage 1 schema + RLS (app_ tables, role function, access matrix)"
```

---

### Task 3: Supabase clients + auth middleware + login page

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/service.ts`, `src/lib/auth.ts`, `src/middleware.ts`, `src/app/login/page.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: Task 2 tables.
- Produces: `getSessionProfile(): Promise<{ userId: string; role: 'admin'|'advocate'|'client'; fullName: string } | null>` from `src/lib/auth.ts`; `requireRole(role)` helper; service client `createServiceClient()`; login at `/login`; `/` redirects by role.

- [ ] **Step 1: Supabase client helpers**

`src/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr';
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

`src/lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all) => {
          try { all.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* called from a Server Component; middleware refreshes instead */ }
        },
      },
    }
  );
}
```

`src/lib/supabase/service.ts` (server-only; never imported by client components):
```ts
import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```
Run `npm i server-only`.

- [ ] **Step 2: Auth helpers**

`src/lib/auth.ts`:
```ts
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Role = 'admin' | 'advocate' | 'client';
export type SessionProfile = { userId: string; role: Role; fullName: string };

export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('app_profiles').select('role, full_name, active').eq('id', user.id).single();
  if (!profile || !profile.active) return null;
  return { userId: user.id, role: profile.role as Role, fullName: profile.full_name };
}

export async function requireRole(role: Role): Promise<SessionProfile> {
  const p = await getSessionProfile();
  if (!p) redirect('/login');
  if (p.role !== role) redirect('/');
  return p;
}

export function homeFor(role: Role): string {
  return role === 'admin' ? '/admin' : role === 'advocate' ? '/advocate' : '/client';
}
```

- [ ] **Step 3: Middleware (session refresh + auth gate)**

`src/middleware.ts`:
```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (all) => {
          all.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          all.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith('/admin') || pathname.startsWith('/advocate') || pathname.startsWith('/client');
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json).*)'] };
```

- [ ] **Step 4: Login page + role-routed root**

`src/app/login/page.tsx`:
```tsx
'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError('Email or password is incorrect.'); setBusy(false); return; }
    router.replace(params.get('next') ?? '/');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-4">
      <h1 className="font-serif text-2xl text-navy">Legacy Senior Advocate</h1>
      <p className="text-sm text-gray-600">Sign in to the LSA App</p>
      <input className="w-full rounded border border-gray-300 p-3" type="email" placeholder="Email"
        value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      <input className="w-full rounded border border-gray-300 p-3" type="password" placeholder="Password"
        value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="w-full rounded bg-navy p-3 font-semibold text-white disabled:opacity-50" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-6">
      <Suspense><LoginForm /></Suspense>
    </main>
  );
}
```

`src/app/page.tsx` (replace scaffold content):
```tsx
import { redirect } from 'next/navigation';
import { getSessionProfile, homeFor } from '@/lib/auth';

export default async function Root() {
  const profile = await getSessionProfile();
  redirect(profile ? homeFor(profile.role) : '/login');
}
```

- [ ] **Step 5: Verify**

Run: `npm run build` → succeeds. Note: `/admin`, `/advocate` don't exist yet — that's fine; middleware only gates them.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Supabase auth wiring, middleware gate, login page, role-routed root"
```

---

### Task 4: Lib utilities — client codes, time math, CSV (TDD)

**Files:**
- Create: `src/lib/client-code.ts`, `src/lib/client-code.test.ts`, `src/lib/time.ts`, `src/lib/time.test.ts`, `src/lib/csv.ts`, `src/lib/csv.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `generateClientCode(fullName: string, existingCodes: string[]): string` — initials + zero-padded sequence, e.g. "DM-001"; skips taken codes.
  - `durationMinutes(inISO: string, outISO: string): number`
  - `formatDuration(mins: number): string` — "3h 25m"
  - `weekStartISO(dateISO: string): string` — Monday 00:00 UTC of that date's week, as YYYY-MM-DD
  - `entriesToCsv(rows: TimesheetRow[]): string` where `TimesheetRow = { advocateName: string; clientCode: string; clockInAt: string; clockOutAt: string; edited: boolean; hasLocation: boolean }`

- [ ] **Step 1: Write the failing tests**

`src/lib/client-code.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { generateClientCode } from './client-code';

describe('generateClientCode', () => {
  it('uses initials plus 001 when free', () => {
    expect(generateClientCode('Dorothy Miller', [])).toBe('DM-001');
  });
  it('skips taken sequence numbers', () => {
    expect(generateClientCode('Dorothy Miller', ['DM-001', 'DM-002'])).toBe('DM-003');
  });
  it('handles single names', () => {
    expect(generateClientCode('Cher', [])).toBe('C-001');
  });
  it('ignores codes with other initials', () => {
    expect(generateClientCode('Dorothy Miller', ['AB-001'])).toBe('DM-001');
  });
});
```

`src/lib/time.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { durationMinutes, formatDuration, weekStartISO } from './time';

describe('time utils', () => {
  it('computes duration in whole minutes', () => {
    expect(durationMinutes('2026-07-23T14:00:00Z', '2026-07-23T17:25:00Z')).toBe(205);
  });
  it('formats durations', () => {
    expect(formatDuration(205)).toBe('3h 25m');
    expect(formatDuration(45)).toBe('0h 45m');
  });
  it('finds Monday of the week', () => {
    expect(weekStartISO('2026-07-23')).toBe('2026-07-20'); // Thursday -> Monday
    expect(weekStartISO('2026-07-20')).toBe('2026-07-20'); // Monday stays
    expect(weekStartISO('2026-07-26')).toBe('2026-07-20'); // Sunday belongs to prior Monday
  });
});
```

`src/lib/csv.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { entriesToCsv } from './csv';

describe('entriesToCsv', () => {
  it('produces header + quoted rows with duration', () => {
    const csv = entriesToCsv([{
      advocateName: 'Ann "AJ" Jones', clientCode: 'DM-001',
      clockInAt: '2026-07-23T14:00:00Z', clockOutAt: '2026-07-23T15:30:00Z',
      edited: true, hasLocation: false,
    }]);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe('Advocate,Client Code,Clock In (UTC),Clock Out (UTC),Duration,Edited,Location');
    expect(lines[1]).toBe('"Ann ""AJ"" Jones",DM-001,2026-07-23T14:00:00Z,2026-07-23T15:30:00Z,1h 30m,yes,no');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/lib/client-code.ts`:
```ts
export function generateClientCode(fullName: string, existingCodes: string[]): string {
  const initials = fullName.trim().split(/\s+/).map((w) => w[0]!.toUpperCase()).join('');
  const taken = new Set(existingCodes);
  for (let n = 1; ; n++) {
    const code = `${initials}-${String(n).padStart(3, '0')}`;
    if (!taken.has(code)) return code;
  }
}
```

`src/lib/time.ts`:
```ts
export function durationMinutes(inISO: string, outISO: string): number {
  return Math.round((new Date(outISO).getTime() - new Date(inISO).getTime()) / 60000);
}

export function formatDuration(mins: number): string {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function weekStartISO(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  const day = d.getUTCDay(); // Sun=0 … Sat=6
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}
```

`src/lib/csv.ts`:
```ts
import { durationMinutes, formatDuration } from './time';

export type TimesheetRow = {
  advocateName: string; clientCode: string;
  clockInAt: string; clockOutAt: string;
  edited: boolean; hasLocation: boolean;
};

function q(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
}

export function entriesToCsv(rows: TimesheetRow[]): string {
  const header = 'Advocate,Client Code,Clock In (UTC),Clock Out (UTC),Duration,Edited,Location';
  const lines = rows.map((r) => [
    q(r.advocateName), q(r.clientCode), r.clockInAt, r.clockOutAt,
    formatDuration(durationMinutes(r.clockInAt, r.clockOutAt)),
    r.edited ? 'yes' : 'no', r.hasLocation ? 'yes' : 'no',
  ].join(','));
  return [header, ...lines].join('\n') + '\n';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib
git commit -m "feat: client-code, time, and CSV utilities (TDD)"
```

---

### Task 5: Advocate clock — server actions + home screen

**Files:**
- Create: `src/app/advocate/layout.tsx`, `src/app/advocate/page.tsx`, `src/app/advocate/actions.ts`, `src/app/advocate/ClockCard.tsx`

**Interfaces:**
- Consumes: `requireRole` (Task 3), tables (Task 2).
- Produces: server actions `clockIn(formData)` / `clockOut(formData)` (fields: `clientId` optional uuid or "none", `lat`, `lng`, `accuracy`, `denied`); layout with bottom tab nav used by Tasks 6–7 (tabs: Clock `/advocate`, Clients `/advocate/clients`, Hours `/advocate/hours`).

- [ ] **Step 1: Advocate layout with tab nav**

`src/app/advocate/layout.tsx`:
```tsx
import Link from 'next/link';
import { requireRole } from '@/lib/auth';

export default async function AdvocateLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole('advocate');
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="bg-navy p-4 text-white">
        <p className="text-xs uppercase tracking-widest text-gold">Legacy Senior Advocate</p>
        <p className="font-semibold">{profile.fullName}</p>
      </header>
      <main className="flex-1 p-4 pb-24">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-3 border-t border-gray-200 bg-white text-center text-sm">
        <Link className="p-4" href="/advocate">Clock</Link>
        <Link className="p-4" href="/advocate/clients">Clients</Link>
        <Link className="p-4" href="/advocate/hours">Hours</Link>
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Server actions**

`src/app/advocate/actions.ts`:
```ts
'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

function num(v: FormDataEntryValue | null): number | null {
  const n = typeof v === 'string' && v !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

export async function clockIn(formData: FormData): Promise<{ error?: string }> {
  const profile = await requireRole('advocate');
  const supabase = await createClient();
  const clientIdRaw = formData.get('clientId');
  const clientId = typeof clientIdRaw === 'string' && clientIdRaw !== 'none' ? clientIdRaw : null;
  const { error } = await supabase.from('app_time_entries').insert({
    advocate_id: profile.userId,
    client_id: clientId,
    clock_in_at: new Date().toISOString(),
    in_lat: num(formData.get('lat')), in_lng: num(formData.get('lng')), in_accuracy: num(formData.get('accuracy')),
    location_denied: formData.get('denied') === 'true',
  });
  if (error) {
    return { error: error.code === '23505' ? 'You are already clocked in.' : 'Could not clock in — try again.' };
  }
  revalidatePath('/advocate');
  return {};
}

export async function clockOut(formData: FormData): Promise<{ error?: string }> {
  const profile = await requireRole('advocate');
  const supabase = await createClient();
  const { data: open } = await supabase.from('app_time_entries')
    .select('id, location_denied').eq('advocate_id', profile.userId).is('clock_out_at', null).single();
  if (!open) return { error: 'No open entry found.' };
  const denied = formData.get('denied') === 'true';
  const { error } = await supabase.from('app_time_entries').update({
    clock_out_at: new Date().toISOString(),
    out_lat: num(formData.get('lat')), out_lng: num(formData.get('lng')), out_accuracy: num(formData.get('accuracy')),
    location_denied: open.location_denied || denied,
  }).eq('id', open.id);
  if (error) return { error: 'Could not clock out — try again.' };
  revalidatePath('/advocate');
  return {};
}
```

- [ ] **Step 3: Clock UI**

`src/app/advocate/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { ClockCard } from './ClockCard';

export default async function AdvocateHome() {
  const profile = await requireRole('advocate');
  const supabase = await createClient();
  const [{ data: open }, { data: assignments }] = await Promise.all([
    supabase.from('app_time_entries')
      .select('id, clock_in_at, client_id').eq('advocate_id', profile.userId).is('clock_out_at', null).maybeSingle(),
    supabase.from('app_client_assignments')
      .select('client_id, app_clients(id, full_name, client_code)').eq('advocate_id', profile.userId).eq('active', true),
  ]);
  const clients = (assignments ?? []).map((a) => {
    const c = a.app_clients as unknown as { id: string; full_name: string; client_code: string };
    return { id: c.id, name: c.full_name, code: c.client_code };
  });
  return <ClockCard openEntry={open ?? null} clients={clients} />;
}
```

`src/app/advocate/ClockCard.tsx`:
```tsx
'use client';
import { useState, useTransition } from 'react';
import { clockIn, clockOut } from './actions';

type Client = { id: string; name: string; code: string };
type OpenEntry = { id: string; clock_in_at: string; client_id: string | null };

function getPosition(): Promise<{ lat?: number; lng?: number; accuracy?: number; denied: boolean }> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve({ denied: true });
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, denied: false }),
      () => resolve({ denied: true }),
      { timeout: 8000, maximumAge: 60000 }
    );
  });
}

export function ClockCard({ openEntry, clients }: { openEntry: OpenEntry | null; clients: Client[] }) {
  const [clientId, setClientId] = useState('none');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(action: (fd: FormData) => Promise<{ error?: string }>) {
    startTransition(async () => {
      setError(null);
      const pos = await getPosition();
      const fd = new FormData();
      fd.set('clientId', clientId);
      if (pos.lat !== undefined) { fd.set('lat', String(pos.lat)); fd.set('lng', String(pos.lng)); fd.set('accuracy', String(pos.accuracy)); }
      fd.set('denied', String(pos.denied));
      const result = await action(fd);
      if (result.error) setError(result.error);
    });
  }

  if (openEntry) {
    const client = clients.find((c) => c.id === openEntry.client_id);
    return (
      <div className="space-y-4 rounded-lg bg-white p-6 shadow">
        <p className="text-sm text-gray-600">Clocked in since</p>
        <p className="text-2xl font-semibold text-navy">{new Date(openEntry.clock_in_at).toLocaleTimeString()}</p>
        <p className="text-sm">{client ? `${client.name} (${client.code})` : 'Non-client work'}</p>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button onClick={() => submit(clockOut)} disabled={pending}
          className="w-full rounded-lg bg-red-700 p-5 text-xl font-bold text-white disabled:opacity-50">
          {pending ? 'Working…' : 'Clock Out'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg bg-white p-6 shadow">
      <label className="block text-sm text-gray-600">Who is this time for?</label>
      <select value={clientId} onChange={(e) => setClientId(e.target.value)}
        className="w-full rounded border border-gray-300 p-3">
        <option value="none">Non-client work</option>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
      </select>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button onClick={() => submit(clockIn)} disabled={pending}
        className="w-full rounded-lg bg-navy p-5 text-xl font-bold text-white disabled:opacity-50">
        {pending ? 'Working…' : 'Clock In'}
      </button>
      <p className="text-xs text-gray-500">Location is captured at clock-in if your phone allows it. Never put client names or health details in this app's notes.</p>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run build` → succeeds. Run `npm test` → still green.

- [ ] **Step 5: Commit**

```bash
git add src/app/advocate
git commit -m "feat: advocate clock in/out with GPS capture and open-entry guard"
```

---

### Task 6: Advocate — My Hours (weekly list, add/edit with flag)

**Files:**
- Create: `src/app/advocate/hours/page.tsx`, `src/app/advocate/hours/EntryForm.tsx`
- Modify: `src/app/advocate/actions.ts` (add `saveManualEntry`)

**Interfaces:**
- Consumes: Task 4 utils (`weekStartISO`, `durationMinutes`, `formatDuration`), Task 5 layout/actions file.
- Produces: `saveManualEntry(formData)` — fields `entryId` (empty = new), `clientId`, `clockInLocal`, `clockOutLocal` (datetime-local strings), `editNote`; always sets `edited=true`.

- [ ] **Step 1: Add `saveManualEntry` to `src/app/advocate/actions.ts`**

```ts
export async function saveManualEntry(formData: FormData): Promise<{ error?: string }> {
  const profile = await requireRole('advocate');
  const supabase = await createClient();
  const inLocal = String(formData.get('clockInLocal') ?? '');
  const outLocal = String(formData.get('clockOutLocal') ?? '');
  if (!inLocal || !outLocal) return { error: 'Both start and end times are required.' };
  const clockIn = new Date(inLocal), clockOut = new Date(outLocal);
  if (!(clockOut > clockIn)) return { error: 'End time must be after start time.' };
  const clientIdRaw = formData.get('clientId');
  const clientId = typeof clientIdRaw === 'string' && clientIdRaw !== 'none' ? clientIdRaw : null;
  const entryId = String(formData.get('entryId') ?? '');
  const row = {
    client_id: clientId,
    clock_in_at: clockIn.toISOString(),
    clock_out_at: clockOut.toISOString(),
    edited: true,
    edit_note: String(formData.get('editNote') ?? '') || null,
  };
  const { error } = entryId
    ? await supabase.from('app_time_entries').update(row).eq('id', entryId).eq('advocate_id', profile.userId)
    : await supabase.from('app_time_entries').insert({ ...row, advocate_id: profile.userId, location_denied: true });
  if (error) return { error: 'Could not save the entry — try again.' };
  revalidatePath('/advocate/hours');
  return {};
}
```

- [ ] **Step 2: Hours page**

`src/app/advocate/hours/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { durationMinutes, formatDuration, weekStartISO } from '@/lib/time';
import { EntryForm } from './EntryForm';

export default async function HoursPage() {
  const profile = await requireRole('advocate');
  const supabase = await createClient();
  const [{ data: entries }, { data: assignments }] = await Promise.all([
    supabase.from('app_time_entries')
      .select('id, client_id, clock_in_at, clock_out_at, edited, location_denied')
      .eq('advocate_id', profile.userId).not('clock_out_at', 'is', null)
      .order('clock_in_at', { ascending: false }).limit(100),
    supabase.from('app_client_assignments')
      .select('app_clients(id, full_name, client_code)').eq('advocate_id', profile.userId).eq('active', true),
  ]);
  const clients = (assignments ?? []).map((a) => {
    const c = a.app_clients as unknown as { id: string; full_name: string; client_code: string };
    return { id: c.id, name: c.full_name, code: c.client_code };
  });
  const byWeek = new Map<string, NonNullable<typeof entries>>();
  for (const e of entries ?? []) {
    const wk = weekStartISO(e.clock_in_at.slice(0, 10));
    if (!byWeek.has(wk)) byWeek.set(wk, []);
    byWeek.get(wk)!.push(e);
  }
  return (
    <div className="space-y-6">
      <EntryForm clients={clients} />
      {[...byWeek.entries()].map(([week, rows]) => (
        <section key={week} className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-2 font-semibold text-navy">Week of {week}</h2>
          <p className="mb-3 text-sm text-gray-600">
            Total: {formatDuration(rows.reduce((m, e) => m + durationMinutes(e.clock_in_at, e.clock_out_at!), 0))}
          </p>
          <ul className="divide-y divide-gray-100 text-sm">
            {rows.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2">
                <span>
                  {new Date(e.clock_in_at).toLocaleString()} · {formatDuration(durationMinutes(e.clock_in_at, e.clock_out_at!))}
                  {' '}· {clients.find((c) => c.id === e.client_id)?.code ?? 'Non-client'}
                </span>
                <span className="flex gap-1 text-xs">
                  {e.edited && <span className="rounded bg-yellow-100 px-2 py-0.5 text-yellow-800">edited</span>}
                  {e.location_denied && <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">no location</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Manual entry form**

`src/app/advocate/hours/EntryForm.tsx`:
```tsx
'use client';
import { useState, useTransition } from 'react';
import { saveManualEntry } from '../actions';

type Client = { id: string; name: string; code: string };

export function EntryForm({ clients }: { clients: Client[] }) {
  const [openForm, setOpenForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!openForm) {
    return <button onClick={() => setOpenForm(true)} className="w-full rounded-lg border-2 border-dashed border-gray-300 p-3 text-sm text-gray-600">+ Add a missed entry</button>;
  }
  return (
    <form className="space-y-3 rounded-lg bg-white p-4 shadow"
      action={(fd) => startTransition(async () => {
        setError(null);
        const r = await saveManualEntry(fd);
        if (r.error) setError(r.error); else setOpenForm(false);
      })}>
      <input type="hidden" name="entryId" value="" />
      <select name="clientId" className="w-full rounded border border-gray-300 p-2">
        <option value="none">Non-client work</option>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
      </select>
      <label className="block text-sm">Start<input name="clockInLocal" type="datetime-local" required className="mt-1 w-full rounded border border-gray-300 p-2" /></label>
      <label className="block text-sm">End<input name="clockOutLocal" type="datetime-local" required className="mt-1 w-full rounded border border-gray-300 p-2" /></label>
      <input name="editNote" placeholder="Reason (optional — no client health details)" className="w-full rounded border border-gray-300 p-2 text-sm" />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className="flex-1 rounded bg-navy p-2 font-semibold text-white disabled:opacity-50">Save</button>
        <button type="button" onClick={() => setOpenForm(false)} className="flex-1 rounded border border-gray-300 p-2">Cancel</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Verify + commit**

Run: `npm run build && npm test` → both green.
```bash
git add src/app/advocate
git commit -m "feat: advocate hours page with weekly totals and flagged manual entries"
```

---

### Task 7: Advocate — My Clients roster + client card

**Files:**
- Create: `src/app/advocate/clients/page.tsx`, `src/app/advocate/clients/[id]/page.tsx`

**Interfaces:**
- Consumes: Task 5 layout; RLS guarantees only assigned clients are visible.
- Produces: roster list; detail card with phone/email links + optional Drive link.

- [ ] **Step 1: Roster page**

`src/app/advocate/clients/page.tsx`:
```tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export default async function ClientsPage() {
  await requireRole('advocate');
  const supabase = await createClient();
  const { data: clients } = await supabase.from('app_clients')
    .select('id, full_name, client_code, city, status').order('full_name');
  return (
    <ul className="space-y-2">
      {(clients ?? []).map((c) => (
        <li key={c.id}>
          <Link href={`/advocate/clients/${c.id}`} className="block rounded-lg bg-white p-4 shadow">
            <p className="font-semibold text-navy">{c.full_name} <span className="text-sm font-normal text-gray-500">({c.client_code})</span></p>
            <p className="text-sm text-gray-600">{c.city || '—'} · {c.status}</p>
          </Link>
        </li>
      ))}
      {(clients ?? []).length === 0 && <p className="text-sm text-gray-600">No clients assigned yet.</p>}
    </ul>
  );
}
```

- [ ] **Step 2: Client card**

`src/app/advocate/clients/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export default async function ClientCard({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('advocate');
  const { id } = await params;
  const supabase = await createClient();
  const { data: c } = await supabase.from('app_clients')
    .select('full_name, client_code, phone, email, city, status, drive_folder_url').eq('id', id).maybeSingle();
  if (!c) notFound();
  return (
    <div className="space-y-3 rounded-lg bg-white p-6 shadow">
      <h1 className="text-xl font-semibold text-navy">{c.full_name} <span className="text-sm text-gray-500">({c.client_code})</span></h1>
      <p className="text-sm text-gray-600">{c.city || 'City not set'} · {c.status}</p>
      {c.phone && <a className="block rounded bg-navy p-3 text-center font-semibold text-white" href={`tel:${c.phone}`}>Call {c.phone}</a>}
      {c.email && <a className="block rounded border border-navy p-3 text-center font-semibold text-navy" href={`mailto:${c.email}`}>Email</a>}
      {c.drive_folder_url
        ? <a className="block rounded border border-gold p-3 text-center font-semibold text-gold" href={c.drive_folder_url} target="_blank" rel="noreferrer">Client documents (Google Drive)</a>
        : <p className="text-xs text-gray-500">No document folder linked yet — documents live in Google Drive, never in this app.</p>}
    </div>
  );
}
```

- [ ] **Step 3: Verify + commit**

Run: `npm run build && npm test` → green.
```bash
git add src/app/advocate/clients
git commit -m "feat: advocate client roster and contact card with Drive link-out"
```

---

### Task 8: Admin — layout, dashboard (clocked-in now), advocate management

**Files:**
- Create: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/advocates/page.tsx`, `src/app/admin/advocates/actions.ts`, `src/app/admin/advocates/InviteForm.tsx`

**Interfaces:**
- Consumes: `requireRole('admin')`, `createServiceClient` (Task 3).
- Produces: admin nav (Dashboard `/admin`, Advocates `/admin/advocates`, Clients `/admin/clients`, Timesheets `/admin/timesheets`); server actions `inviteAdvocate(formData)` (fields `email`, `fullName`, `role` in 'advocate'|'admin') and `setAdvocateActive(formData)` (fields `profileId`, `active`).

- [ ] **Step 1: Admin layout**

`src/app/admin/layout.tsx`:
```tsx
import Link from 'next/link';
import { requireRole } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole('admin');
  return (
    <div className="min-h-screen bg-cream">
      <header className="flex flex-wrap items-center justify-between gap-2 bg-navy p-4 text-white">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">LSA Admin</p>
          <p className="font-semibold">{profile.fullName}</p>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/advocates">Advocates</Link>
          <Link href="/admin/clients">Clients</Link>
          <Link href="/admin/timesheets">Timesheets</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl p-4">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Dashboard — who's clocked in**

`src/app/admin/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export default async function AdminDashboard() {
  await requireRole('admin');
  const supabase = await createClient();
  const { data: open } = await supabase.from('app_time_entries')
    .select('id, clock_in_at, location_denied, app_profiles(full_name), app_clients(client_code, full_name)')
    .is('clock_out_at', null).order('clock_in_at');
  return (
    <section className="rounded-lg bg-white p-4 shadow">
      <h1 className="mb-3 font-semibold text-navy">Clocked in right now</h1>
      {(open ?? []).length === 0 && <p className="text-sm text-gray-600">Nobody is clocked in.</p>}
      <ul className="divide-y divide-gray-100 text-sm">
        {(open ?? []).map((e) => {
          const adv = e.app_profiles as unknown as { full_name: string } | null;
          const cli = e.app_clients as unknown as { client_code: string; full_name: string } | null;
          return (
            <li key={e.id} className="flex justify-between py-2">
              <span>{adv?.full_name} — {cli ? `${cli.full_name} (${cli.client_code})` : 'Non-client work'}</span>
              <span className="text-gray-500">
                since {new Date(e.clock_in_at).toLocaleTimeString()}{e.location_denied ? ' · no location' : ''}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: Advocate management actions**

`src/app/admin/advocates/actions.ts`:
```ts
'use server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';

export async function inviteAdvocate(formData: FormData): Promise<{ error?: string }> {
  await requireRole('admin');
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const fullName = String(formData.get('fullName') ?? '').trim();
  const roleRaw = String(formData.get('role') ?? 'advocate');
  const role = roleRaw === 'admin' ? 'admin' : 'advocate';
  if (!email || !fullName) return { error: 'Email and full name are required.' };
  const service = createServiceClient();
  const { data, error } = await service.auth.admin.inviteUserByEmail(email);
  if (error || !data.user) return { error: `Invite failed: ${error?.message ?? 'unknown error'}` };
  const { error: profileError } = await service.from('app_profiles')
    .insert({ id: data.user.id, role, full_name: fullName });
  if (profileError) return { error: 'User invited but profile creation failed — contact support.' };
  revalidatePath('/admin/advocates');
  return {};
}

export async function setAdvocateActive(formData: FormData): Promise<{ error?: string }> {
  await requireRole('admin');
  const service = createServiceClient();
  const { error } = await service.from('app_profiles')
    .update({ active: formData.get('active') === 'true' })
    .eq('id', String(formData.get('profileId')));
  if (error) return { error: 'Update failed.' };
  revalidatePath('/admin/advocates');
  return {};
}
```

- [ ] **Step 4: Advocates page + invite form**

`src/app/admin/advocates/InviteForm.tsx`:
```tsx
'use client';
import { useState, useTransition } from 'react';
import { inviteAdvocate } from './actions';

export function InviteForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <form className="flex flex-wrap items-end gap-2 rounded-lg bg-white p-4 shadow"
      action={(fd) => startTransition(async () => {
        setError(null); setDone(false);
        const r = await inviteAdvocate(fd);
        if (r.error) setError(r.error); else setDone(true);
      })}>
      <label className="text-sm">Full name<input name="fullName" required className="mt-1 block rounded border border-gray-300 p-2" /></label>
      <label className="text-sm">Email<input name="email" type="email" required className="mt-1 block rounded border border-gray-300 p-2" /></label>
      <label className="text-sm">Role
        <select name="role" className="mt-1 block rounded border border-gray-300 p-2">
          <option value="advocate">Advocate</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <button disabled={pending} className="rounded bg-navy px-4 py-2 font-semibold text-white disabled:opacity-50">Send invite</button>
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
      {done && <p className="w-full text-sm text-green-700">Invite sent — they'll get an email to set a password.</p>}
    </form>
  );
}
```

`src/app/admin/advocates/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { InviteForm } from './InviteForm';
import { setAdvocateActive } from './actions';

export default async function AdvocatesPage() {
  await requireRole('admin');
  const supabase = await createClient();
  const { data: profiles } = await supabase.from('app_profiles')
    .select('id, role, full_name, active, created_at').in('role', ['advocate', 'admin']).order('full_name');
  return (
    <div className="space-y-4">
      <InviteForm />
      <section className="rounded-lg bg-white p-4 shadow">
        <h1 className="mb-3 font-semibold text-navy">Team</h1>
        <ul className="divide-y divide-gray-100 text-sm">
          {(profiles ?? []).map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2">
              <span>{p.full_name} <span className="text-gray-500">· {p.role}{p.active ? '' : ' · deactivated'}</span></span>
              <form action={setAdvocateActive}>
                <input type="hidden" name="profileId" value={p.id} />
                <input type="hidden" name="active" value={String(!p.active)} />
                <button className="rounded border border-gray-300 px-3 py-1 text-xs">{p.active ? 'Deactivate' : 'Reactivate'}</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Verify + commit**

Run: `npm run build && npm test` → green.
```bash
git add src/app/admin
git commit -m "feat: admin layout, live clocked-in dashboard, advocate invites + deactivation"
```

---

### Task 9: Admin — clients (list, add, import, assign)

**Files:**
- Create: `src/app/admin/clients/page.tsx`, `src/app/admin/clients/actions.ts`, `src/app/admin/clients/AddClientForm.tsx`, `src/app/admin/clients/AssignSelect.tsx`

**Interfaces:**
- Consumes: `generateClientCode` (Task 4), `createServiceClient` (Task 3).
- Produces: server actions `addClient(formData)` (fields `fullName`, `phone`, `email`, `city`, `driveFolderUrl`), `importOnboardingClient(formData)` (field `onboardingId`), `assignAdvocate(formData)` (fields `clientId`, `advocateId` or "unassigned").

- [ ] **Step 1: Actions — `src/app/admin/clients/actions.ts`**

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { generateClientCode } from '@/lib/client-code';

async function nextCode(service: ReturnType<typeof createServiceClient>, fullName: string): Promise<string> {
  const { data } = await service.from('app_clients').select('client_code');
  return generateClientCode(fullName, (data ?? []).map((r) => r.client_code));
}

export async function addClient(formData: FormData): Promise<{ error?: string }> {
  await requireRole('admin');
  const fullName = String(formData.get('fullName') ?? '').trim();
  if (!fullName) return { error: 'Full name is required.' };
  const service = createServiceClient();
  const { error } = await service.from('app_clients').insert({
    client_code: await nextCode(service, fullName),
    full_name: fullName,
    phone: String(formData.get('phone') ?? ''),
    email: String(formData.get('email') ?? ''),
    city: String(formData.get('city') ?? ''),
    drive_folder_url: String(formData.get('driveFolderUrl') ?? '') || null,
    source: 'manual',
  });
  if (error) return { error: 'Could not add the client.' };
  revalidatePath('/admin/clients');
  return {};
}

// Copies ONLY non-sensitive fields from client_onboarding: client_name, phone, email, city, id.
// NEVER copy dob, medical_conditions, medications, pcp, specialists, allergies, or any other column.
export async function importOnboardingClient(formData: FormData): Promise<{ error?: string }> {
  await requireRole('admin');
  const onboardingId = String(formData.get('onboardingId') ?? '');
  const service = createServiceClient();
  const { data: src } = await service.from('client_onboarding')
    .select('id, client_name, phone, email, city').eq('id', onboardingId).maybeSingle();
  if (!src) return { error: 'Onboarding record not found.' };
  const { error } = await service.from('app_clients').insert({
    client_code: await nextCode(service, src.client_name),
    full_name: src.client_name,
    phone: src.phone ?? '',
    email: src.email ?? '',
    city: src.city ?? '',
    source: 'onboarding',
    onboarding_ref: src.id,
  });
  if (error) return { error: error.code === '23505' ? 'Already imported.' : 'Import failed.' };
  revalidatePath('/admin/clients');
  return {};
}

export async function assignAdvocate(formData: FormData): Promise<{ error?: string }> {
  await requireRole('admin');
  const clientId = String(formData.get('clientId') ?? '');
  const advocateId = String(formData.get('advocateId') ?? '');
  const service = createServiceClient();
  await service.from('app_client_assignments').update({ active: false }).eq('client_id', clientId).eq('active', true);
  if (advocateId !== 'unassigned') {
    const { error } = await service.from('app_client_assignments')
      .insert({ client_id: clientId, advocate_id: advocateId, active: true });
    if (error) return { error: 'Assignment failed.' };
  }
  revalidatePath('/admin/clients');
  return {};
}
```

- [ ] **Step 2: Clients page**

`src/app/admin/clients/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { AddClientForm } from './AddClientForm';
import { AssignSelect } from './AssignSelect';
import { importOnboardingClient } from './actions';

export default async function AdminClientsPage() {
  await requireRole('admin');
  const supabase = await createClient();
  const service = createServiceClient();
  const [{ data: clients }, { data: advocates }, { data: assignments }] = await Promise.all([
    supabase.from('app_clients').select('id, full_name, client_code, city, status, source').order('full_name'),
    supabase.from('app_profiles').select('id, full_name').eq('role', 'advocate').eq('active', true).order('full_name'),
    supabase.from('app_client_assignments').select('client_id, advocate_id').eq('active', true),
  ]);
  const importedRefs = new Set(
    (await service.from('app_clients').select('onboarding_ref').not('onboarding_ref', 'is', null))
      .data?.map((r) => r.onboarding_ref) ?? []);
  const { data: onboarding } = await service.from('client_onboarding')
    .select('id, client_name, city, created_at').order('created_at', { ascending: false }).limit(50);
  const pendingImport = (onboarding ?? []).filter((o) => !importedRefs.has(o.id));
  const assignedTo = new Map((assignments ?? []).map((a) => [a.client_id, a.advocate_id]));

  return (
    <div className="space-y-4">
      <AddClientForm />
      {pendingImport.length > 0 && (
        <section className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-2 font-semibold text-navy">Import from onboarding ({pendingImport.length})</h2>
          <ul className="divide-y divide-gray-100 text-sm">
            {pendingImport.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2">
                <span>{o.client_name} · {o.city || '—'} · {new Date(o.created_at).toLocaleDateString()}</span>
                <form action={importOnboardingClient}>
                  <input type="hidden" name="onboardingId" value={o.id} />
                  <button className="rounded bg-gold px-3 py-1 text-xs font-semibold text-white">Import</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="rounded-lg bg-white p-4 shadow">
        <h1 className="mb-3 font-semibold text-navy">Clients</h1>
        <ul className="divide-y divide-gray-100 text-sm">
          {(clients ?? []).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{c.full_name} ({c.client_code}) <span className="text-gray-500">· {c.city || '—'} · {c.status}</span></span>
              <AssignSelect clientId={c.id} advocates={advocates ?? []} current={assignedTo.get(c.id) ?? 'unassigned'} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Add + assign client components**

`src/app/admin/clients/AddClientForm.tsx`:
```tsx
'use client';
import { useState, useTransition } from 'react';
import { addClient } from './actions';

export function AddClientForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form className="flex flex-wrap items-end gap-2 rounded-lg bg-white p-4 shadow"
      action={(fd) => startTransition(async () => {
        setError(null);
        const r = await addClient(fd);
        if (r.error) setError(r.error);
      })}>
      <label className="text-sm">Full name<input name="fullName" required className="mt-1 block rounded border border-gray-300 p-2" /></label>
      <label className="text-sm">Phone<input name="phone" className="mt-1 block rounded border border-gray-300 p-2" /></label>
      <label className="text-sm">Email<input name="email" type="email" className="mt-1 block rounded border border-gray-300 p-2" /></label>
      <label className="text-sm">City<input name="city" className="mt-1 block rounded border border-gray-300 p-2" /></label>
      <label className="text-sm">Drive folder URL<input name="driveFolderUrl" className="mt-1 block rounded border border-gray-300 p-2" /></label>
      <button disabled={pending} className="rounded bg-navy px-4 py-2 font-semibold text-white disabled:opacity-50">Add client</button>
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
    </form>
  );
}
```

`src/app/admin/clients/AssignSelect.tsx`:
```tsx
'use client';
import { useTransition } from 'react';
import { assignAdvocate } from './actions';

export function AssignSelect({ clientId, advocates, current }:
  { clientId: string; advocates: { id: string; full_name: string }[]; current: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <select defaultValue={current} disabled={pending}
      className="rounded border border-gray-300 p-1 text-xs"
      onChange={(e) => {
        const fd = new FormData();
        fd.set('clientId', clientId);
        fd.set('advocateId', e.target.value);
        startTransition(async () => { await assignAdvocate(fd); });
      }}>
      <option value="unassigned">Unassigned</option>
      {advocates.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
    </select>
  );
}
```

- [ ] **Step 4: Verify + commit**

Run: `npm run build && npm test` → green.
```bash
git add src/app/admin/clients
git commit -m "feat: admin clients — add, PHI-safe onboarding import, advocate assignment"
```

---

### Task 10: Admin — timesheets + CSV export

**Files:**
- Create: `src/app/admin/timesheets/page.tsx`, `src/app/admin/timesheets/export/route.ts`

**Interfaces:**
- Consumes: Task 4 (`entriesToCsv`, `durationMinutes`, `formatDuration`).
- Produces: `/admin/timesheets?advocate=<id|all>&from=YYYY-MM-DD&to=YYYY-MM-DD` and `/admin/timesheets/export` with the same query params returning `text/csv`.

- [ ] **Step 1: Timesheets page**

`src/app/admin/timesheets/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { durationMinutes, formatDuration } from '@/lib/time';

export default async function TimesheetsPage({ searchParams }:
  { searchParams: Promise<{ advocate?: string; from?: string; to?: string }> }) {
  await requireRole('admin');
  const { advocate = 'all', from = '', to = '' } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from('app_time_entries')
    .select('id, clock_in_at, clock_out_at, edited, edit_note, location_denied, in_lat, app_profiles(full_name), app_clients(client_code)')
    .not('clock_out_at', 'is', null).order('clock_in_at', { ascending: false }).limit(500);
  if (advocate !== 'all') query = query.eq('advocate_id', advocate);
  if (from) query = query.gte('clock_in_at', `${from}T00:00:00Z`);
  if (to) query = query.lte('clock_in_at', `${to}T23:59:59Z`);
  const [{ data: entries }, { data: advocates }] = await Promise.all([
    query,
    supabase.from('app_profiles').select('id, full_name').eq('role', 'advocate').order('full_name'),
  ]);
  const exportHref = `/admin/timesheets/export?advocate=${advocate}&from=${from}&to=${to}`;
  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-end gap-2 rounded-lg bg-white p-4 shadow" method="get">
        <label className="text-sm">Advocate
          <select name="advocate" defaultValue={advocate} className="mt-1 block rounded border border-gray-300 p-2">
            <option value="all">All</option>
            {(advocates ?? []).map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
          </select>
        </label>
        <label className="text-sm">From<input name="from" type="date" defaultValue={from} className="mt-1 block rounded border border-gray-300 p-2" /></label>
        <label className="text-sm">To<input name="to" type="date" defaultValue={to} className="mt-1 block rounded border border-gray-300 p-2" /></label>
        <button className="rounded bg-navy px-4 py-2 font-semibold text-white">Filter</button>
        <a href={exportHref} className="rounded border border-navy px-4 py-2 font-semibold text-navy">Download CSV</a>
      </form>
      <section className="overflow-x-auto rounded-lg bg-white p-4 shadow">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="text-left text-xs uppercase text-gray-500">
            <th className="p-2">Advocate</th><th className="p-2">Client</th><th className="p-2">In</th><th className="p-2">Out</th><th className="p-2">Duration</th><th className="p-2">Flags</th>
          </tr></thead>
          <tbody>
            {(entries ?? []).map((e) => {
              const adv = e.app_profiles as unknown as { full_name: string } | null;
              const cli = e.app_clients as unknown as { client_code: string } | null;
              return (
                <tr key={e.id} className="border-t border-gray-100">
                  <td className="p-2">{adv?.full_name}</td>
                  <td className="p-2">{cli?.client_code ?? 'Non-client'}</td>
                  <td className="p-2">{new Date(e.clock_in_at).toLocaleString()}</td>
                  <td className="p-2">{new Date(e.clock_out_at!).toLocaleString()}</td>
                  <td className="p-2">{formatDuration(durationMinutes(e.clock_in_at, e.clock_out_at!))}</td>
                  <td className="p-2 text-xs">
                    {e.edited && <span className="mr-1 rounded bg-yellow-100 px-2 py-0.5 text-yellow-800" title={e.edit_note ?? ''}>edited</span>}
                    {(e.location_denied || e.in_lat === null) && <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">no location</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: CSV route**

`src/app/admin/timesheets/export/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth';
import { entriesToCsv } from '@/lib/csv';

export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });
  const p = request.nextUrl.searchParams;
  const advocate = p.get('advocate') ?? 'all';
  const from = p.get('from') ?? '';
  const to = p.get('to') ?? '';
  const supabase = await createClient();
  let query = supabase.from('app_time_entries')
    .select('clock_in_at, clock_out_at, edited, in_lat, app_profiles(full_name), app_clients(client_code)')
    .not('clock_out_at', 'is', null).order('clock_in_at').limit(5000);
  if (advocate !== 'all') query = query.eq('advocate_id', advocate);
  if (from) query = query.gte('clock_in_at', `${from}T00:00:00Z`);
  if (to) query = query.lte('clock_in_at', `${to}T23:59:59Z`);
  const { data } = await query;
  const csv = entriesToCsv((data ?? []).map((e) => ({
    advocateName: (e.app_profiles as unknown as { full_name: string } | null)?.full_name ?? '',
    clientCode: (e.app_clients as unknown as { client_code: string } | null)?.client_code ?? 'NON-CLIENT',
    clockInAt: e.clock_in_at, clockOutAt: e.clock_out_at!,
    edited: e.edited, hasLocation: e.in_lat !== null,
  })));
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="lsa-timesheet-${from || 'all'}-${to || 'all'}.csv"`,
    },
  });
}
```

- [ ] **Step 3: Verify + commit**

Run: `npm run build && npm test` → green.
```bash
git add src/app/admin/timesheets
git commit -m "feat: admin timesheets with filters, flags, and CSV export"
```

---

### Task 11: RLS access-matrix integration test + seed script

**Files:**
- Create: `scripts/rls-test.mjs`, `scripts/seed-admin.mjs`

**Interfaces:**
- Consumes: Task 2 schema (applied), `.env.local` keys.
- Produces: `node scripts/rls-test.mjs` exits 0 with all assertions passing; `node scripts/seed-admin.mjs <email> <password> "<Full Name>"` creates the first admin.

- [ ] **Step 1: Seed script — `scripts/seed-admin.mjs`**

```js
// Usage: node scripts/seed-admin.mjs pat@example.com STRONG_PASSWORD "Pat Dobbins"
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const [email, password, fullName] = process.argv.slice(2);
if (!email || !password || !fullName) { console.error('Usage: node scripts/seed-admin.mjs <email> <password> "<Full Name>"'); process.exit(1); }
const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
if (error) { console.error('createUser failed:', error.message); process.exit(1); }
const { error: pErr } = await service.from('app_profiles').insert({ id: data.user.id, role: 'admin', full_name: fullName });
if (pErr) { console.error('profile insert failed:', pErr.message); process.exit(1); }
console.log('Admin created:', email);
```

- [ ] **Step 2: RLS test — `scripts/rls-test.mjs`**

```js
// Creates temp users (admin/advocate2x/client), a temp client, assignments, and entries;
// asserts the access matrix; cleans everything up. Exits non-zero on any failure.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const PW = 'RlsTest!12345';
const stamp = Date.now();
let failures = 0;
const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failures++; };

async function makeUser(role, name) {
  const { data, error } = await service.auth.admin.createUser({
    email: `rls-${role}-${name}-${stamp}@example.com`, password: PW, email_confirm: true });
  if (error) throw new Error(error.message);
  await service.from('app_profiles').insert({ id: data.user.id, role, full_name: `RLS ${role} ${name}` });
  const client = createClient(URL, ANON);
  await client.auth.signInWithPassword({ email: data.user.email, password: PW });
  return { id: data.user.id, client };
}

const admin = await makeUser('admin', 'a');
const adv1 = await makeUser('advocate', 'one');
const adv2 = await makeUser('advocate', 'two');
const clientUser = await makeUser('client', 'c');

const { data: c1 } = await service.from('app_clients')
  .insert({ client_code: `RLS-${stamp}`, full_name: 'RLS Test Client', source: 'manual' }).select().single();
await service.from('app_client_assignments').insert({ client_id: c1.id, advocate_id: adv1.id, active: true });
await service.from('app_client_users').insert({ client_id: c1.id, user_id: clientUser.id });
const { data: e1 } = await service.from('app_time_entries').insert({
  advocate_id: adv1.id, client_id: c1.id,
  clock_in_at: new Date(Date.now() - 3600000).toISOString(), clock_out_at: new Date().toISOString(),
}).select().single();

// Matrix assertions
{ const { data } = await adv1.client.from('app_clients').select('id'); check('advocate1 sees assigned client', (data ?? []).some((r) => r.id === c1.id)); }
{ const { data } = await adv2.client.from('app_clients').select('id'); check('advocate2 sees NO clients', (data ?? []).length === 0); }
{ const { data } = await adv2.client.from('app_time_entries').select('id'); check('advocate2 sees NO entries', (data ?? []).length === 0); }
{ const { error } = await adv2.client.from('app_time_entries')
    .insert({ advocate_id: adv1.id, client_id: c1.id, clock_in_at: new Date().toISOString() });
  check('advocate2 cannot insert entry for advocate1', error !== null); }
{ const { error } = await adv1.client.from('app_time_entries').delete().eq('id', e1.id);
  const { data } = await service.from('app_time_entries').select('id').eq('id', e1.id);
  check('advocate cannot delete entries', error !== null || (data ?? []).length === 1); }
{ const { data } = await clientUser.client.from('app_clients').select('id'); check('client sees own row only', (data ?? []).length === 1 && data[0].id === c1.id); }
{ const { data } = await clientUser.client.from('app_time_entries').select('id'); check('client sees NO time entries', (data ?? []).length === 0); }
{ const { data } = await admin.client.from('app_time_entries').select('id'); check('admin sees entries', (data ?? []).length >= 1); }
{ const { data } = await adv1.client.from('app_profiles').select('id'); check('advocate sees only own profile', (data ?? []).length === 1 && data[0].id === adv1.id); }

// Cleanup
await service.from('app_clients').delete().eq('id', c1.id);
for (const u of [admin, adv1, adv2, clientUser]) await service.auth.admin.deleteUser(u.id);
console.log(failures === 0 ? 'ALL RLS CHECKS PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 3: Run it**

Run: `node scripts/rls-test.mjs`
Expected: every line `PASS`, final line `ALL RLS CHECKS PASSED`, exit 0. If Supabase email-domain validation rejects `example.com`, switch the test emails' domain to `lsa-rls-test.dev` and re-run.

- [ ] **Step 4: Commit**

```bash
git add scripts
git commit -m "test: RLS access-matrix integration script + first-admin seed script"
```

---

### Task 12: GitHub repo, Netlify deploy, seed, smoke checklist (user-assisted)

**Files:**
- Create: `netlify.toml`, `public/manifest.json`
- Modify: `src/app/layout.tsx` (manifest link + metadata)

**Interfaces:**
- Consumes: everything prior.
- Produces: live app URL; first admin account; documented smoke checklist.

- [ ] **Step 1: Netlify config + manifest**

`netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

`public/manifest.json`:
```json
{
  "name": "LSA App",
  "short_name": "LSA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f9f7f2",
  "theme_color": "#1a365d",
  "icons": []
}
```

In `src/app/layout.tsx` metadata export, set:
```ts
export const metadata: Metadata = {
  title: 'LSA App',
  description: 'Legacy Senior Advocate — advocate and admin portal',
  manifest: '/manifest.json',
};
```

- [ ] **Step 2: Create GitHub repo + push**

```bash
gh repo create ssuhar3/lsa-app --private --source . --push
```

- [ ] **Step 3: Netlify site (user-assist)**

Ask the user to: log into the LSA Netlify account → Add new site → Import from GitHub → `ssuhar3/lsa-app` → set env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (values from `.env.local`) → deploy. Alternative if the Netlify CLI is authenticated to the right account: `netlify init` + `netlify env:set` for the three vars + `netlify deploy --build --prod`.

- [ ] **Step 4: Seed the first admin**

Run: `node scripts/seed-admin.mjs <PatEmail> <ChosenStrongPassword> "Pat Dobbins"` (get real values from the user).

- [ ] **Step 5: Smoke checklist (report to user to run on a phone)**

1. Log in as the admin on the live URL → Dashboard loads.
2. Invite a test advocate (a real email you control) → invite email arrives → set password → advocate login lands on the Clock screen.
3. Admin: add a test client, assign the advocate.
4. Advocate phone: Clock In (allow location) → shows on admin dashboard → Clock Out → appears in Hours with duration.
5. Advocate phone: Clock In with location DENIED → entry saves with "no location" tag.
6. Hours: add a manual entry → "edited" tag appears; admin timesheet shows the flag; CSV downloads and opens.
7. Confirm the advocate cannot open `/admin` (redirected).
8. Delete/deactivate the test data via admin screens.

- [ ] **Step 6: Commit**

```bash
git add netlify.toml public/manifest.json src/app/layout.tsx
git commit -m "chore: Netlify config, PWA manifest, deploy metadata"
git push origin main
```

---

## Self-review notes (performed at authoring time)

- **Spec coverage:** roles/RLS (T2, T11), login (T3), clock + GPS + flags (T5, T6), roster + Drive link-out (T7), admin dashboard/advocates (T8), clients add/import/assign with PHI-safe field list (T9), timesheets + CSV (T10), deploy + seed + manual checklist (T12). Client portal is Stage 2 (out of scope) — `app_client_users` table and RLS ship now so Stage 2 is additive.
- **Type consistency:** `SessionProfile`/`requireRole` (T3) used in T5–T10; `generateClientCode(fullName, existingCodes)` (T4) used in T9; `entriesToCsv(TimesheetRow[])` (T4) used in T10; action field names match between forms and actions.
- **Known environmental risks called out, not hidden:** schema application and Netlify site creation are user-assist steps; Supabase invite emails on the free tier are rate-limited (~a few/hour) — fine for a 1-5 person team.
