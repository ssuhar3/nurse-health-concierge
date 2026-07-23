# LSA Rebrand Completion + HIPAA App Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Legacy Senior Advocate rebrand across all backend emails and generated legal PDFs, then produce a costed, HIPAA-focused recommendation (all-in-one platform vs best-of-breed app stack) for the advocate/client app by August 1, 2026.

**Architecture:** Phase 1 is targeted string replacement across Netlify Functions (CommonJS) — no logic changes, verified by grep sweeps and `node --check` syntax validation (repo has no test framework). Phase 2 is structured research producing markdown deliverables in `docs/app-eval/`, evaluated against four required capabilities (transcription→portal upload, time clock, shared calendar, group chat) plus a HIPAA gap assessment of the current stack.

**Tech Stack:** Static HTML + Netlify Functions (CommonJS), Google Sheets (primary store), Supabase (secondary), AWS S3 (PDFs), Gmail SMTP via Nodemailer, Google Apps Script.

## Global Constraints

- Business name is exactly **"Legacy Senior Advocate"** (singular "Advocate", per owner decision) — never "Advocates", never anything containing "Nurse" or "Health" (Florida policy prohibits those words in the business name).
- Short-form brand abbreviation is **"LSA"**.
- **NEVER modify:** contact email `srhealthconcierge@gmail.com`; any Supabase table/column name; Google Sheets tab names ("Advocate Applications", "Client Inquiries", "Client Onboarding") or column order; cookie name `nhc_session`.
- **Do NOT strip role/service wording:** "Health Advocate" (job title), "Healthcare Advocate", "healthcare system", "health goals" are legitimate service language, not the business name. Only replace the *business name* strings listed in each task.
- Google Apps Script Gmail query currently matches `subject:"SHC Application"` on Pat's manually-sent packet emails. Task 7 widens it to match both old and new conventions; the user must paste the update into the Apps Script editor manually (repo copy is not auto-deployed).
- Push to `main` auto-deploys to production Netlify. Commit per task; push only in Task 8 after the full verification sweep.
- No test framework exists. Verification = `grep` sweeps + `node --check <file>` on every edited JS file.
- User is non-technical: each task's executor should state in its report what was changed and what could have broken (form submissions, Sheets writes) and how it was verified safe.
- Phase 2 deliverables live in `docs/app-eval/` and `docs/hipaa/`. Deadline for the final recommendation: **2026-08-01**.

---

## Phase 1 — Rebrand Completion (backend)

### Task 1: Email transport from-name (`email.js`)

**Files:**
- Modify: `netlify/functions/utils/email.js:34` and `netlify/functions/utils/email.js:78`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing other tasks rely on (independent string change).

- [ ] **Step 1: Replace the sender display name (2 occurrences)**

In `netlify/functions/utils/email.js`, both `sendNotification` (line 34) and `sendEmail` (line 78) build the from header. Replace both:

```js
// OLD (appears twice):
    from: `"Senior Health Concierge" <${process.env.SMTP_USER}>`,
// NEW (both occurrences):
    from: `"Legacy Senior Advocate" <${process.env.SMTP_USER}>`,
```

- [ ] **Step 2: Verify syntax and no stragglers in this file**

Run: `node --check netlify/functions/utils/email.js && grep -n "Senior Health Concierge\|SHC" netlify/functions/utils/email.js`
Expected: `node --check` silent success; grep returns no matches (exit code 1).

- [ ] **Step 3: Commit**

```bash
git add netlify/functions/utils/email.js
git commit -m "rebrand: email sender name SHC -> Legacy Senior Advocate"
```

---

### Task 2: Dashboard email templates (`email-templates.js`)

**Files:**
- Modify: `netlify/functions/utils/email-templates.js` (lines 12, 19, 32, 44, 65, 70, 84, 88, 100, 104, 115, 116, 119, 147, 151 — all business-name occurrences)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing other tasks rely on.

- [ ] **Step 1: Apply these exact replacements throughout the file**

| Old string | New string |
|---|---|
| `Senior Health Concierge` | `Legacy Senior Advocate` |
| `Approved — SHC` | `Approved — Legacy Senior Advocate` |
| `Re: Your Consultation Request — SHC` | `Re: Your Consultation Request — Legacy Senior Advocate` |

Keep untouched: "Health Advocate" as a role title (e.g., "joining Senior Health Concierge as a Health Advocate" becomes "joining Legacy Senior Advocate as a Health Advocate").

- [ ] **Step 2: Verify**

Run: `node --check netlify/functions/utils/email-templates.js && grep -n "Senior Health Concierge\|SHC" netlify/functions/utils/email-templates.js`
Expected: syntax OK; grep returns no matches.

- [ ] **Step 3: Commit**

```bash
git add netlify/functions/utils/email-templates.js
git commit -m "rebrand: dashboard email templates SHC -> Legacy Senior Advocate"
```

---

### Task 3: Form-handler emails (`submit-application.js`, `submit-inquiry.js`, `submit-onboarding.js`)

**Files:**
- Modify: `netlify/functions/submit-application.js:140,154,190`
- Modify: `netlify/functions/submit-inquiry.js:143,147,150,153,160`
- Modify: `netlify/functions/submit-onboarding.js:64,160,161,166,190,238`

**Interfaces:**
- Consumes: nothing.
- Produces: new S3 packet filename prefix `LSA_Client_Packet_` (cosmetic; only affects newly generated files, nothing parses this name).

- [ ] **Step 1: Apply these exact replacements in all three files**

| File | Old | New |
|---|---|---|
| all three | `Senior Health Concierge` | `Legacy Senior Advocate` |
| submit-application.js:190 | `subject: 'Application Received — Senior Health Concierge'` | `subject: 'Application Received — Legacy Senior Advocate'` |
| submit-inquiry.js:160 | `subject: 'Thank You for Your Inquiry - Senior Health Concierge'` | `subject: 'Thank You for Your Inquiry - Legacy Senior Advocate'` |
| submit-onboarding.js:64 | `` `onboarding/${safeName}/SHC_Client_Packet_${Date.now()}.pdf` `` | `` `onboarding/${safeName}/LSA_Client_Packet_${Date.now()}.pdf` `` |
| submit-onboarding.js:160 | `<h2 style="margin:0">Your SHC Client Agreement Packet</h2>` | `<h2 style="margin:0">Your LSA Client Agreement Packet</h2>` |
| submit-onboarding.js:238 | `subject: 'Your SHC Client Agreement Packet'` | `subject: 'Your LSA Client Agreement Packet'` |

- [ ] **Step 2: Verify**

Run: `node --check netlify/functions/submit-application.js && node --check netlify/functions/submit-inquiry.js && node --check netlify/functions/submit-onboarding.js && grep -n "Senior Health Concierge\|SHC" netlify/functions/submit-application.js netlify/functions/submit-inquiry.js netlify/functions/submit-onboarding.js`
Expected: all three syntax OK; grep returns no matches.

- [ ] **Step 3: Commit**

```bash
git add netlify/functions/submit-application.js netlify/functions/submit-inquiry.js netlify/functions/submit-onboarding.js
git commit -m "rebrand: form-handler emails and packet filename SHC -> LSA"
```

---

### Task 4: Client legal PDFs (`client-packet-pdf.js`, `client-summary-pdf.js`)

**Files:**
- Modify: `netlify/functions/utils/client-packet-pdf.js:51,97,169,177,181,200,201,203,276,302,361`
- Modify: `netlify/functions/utils/client-summary-pdf.js:31,126`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing other tasks rely on.

These are the signed client agreements — the contracting-party name must be correct.

- [ ] **Step 1: Apply these exact replacements in both files**

| Old | New |
|---|---|
| `Senior Health Concierge` | `Legacy Senior Advocate` |
| `SHC will provide reasonable assistance` (line 203) | `Legacy Senior Advocate will provide reasonable assistance` |

Keep untouched: "Health Advocate" / "assigned Health Advocate" role wording inside the legal text.

- [ ] **Step 2: Verify**

Run: `node --check netlify/functions/utils/client-packet-pdf.js && node --check netlify/functions/utils/client-summary-pdf.js && grep -n "Senior Health Concierge\|SHC" netlify/functions/utils/client-packet-pdf.js netlify/functions/utils/client-summary-pdf.js`
Expected: syntax OK; grep returns no matches.

- [ ] **Step 3: Commit**

```bash
git add netlify/functions/utils/client-packet-pdf.js netlify/functions/utils/client-summary-pdf.js
git commit -m "rebrand: client legal PDFs SHC -> Legacy Senior Advocate"
```

---

### Task 5: Advocate legal PDFs (`fillable-pdf.js`, `pdf.js`)

**Files:**
- Modify: `netlify/functions/utils/fillable-pdf.js:53,100,291,301,303,344,348,354,401,403,404,405,406`
- Modify: `netlify/functions/utils/pdf.js:36,131`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing other tasks rely on.

- [ ] **Step 1: Apply this exact replacement in both files**

| Old | New |
|---|---|
| `Senior Health Concierge` | `Legacy Senior Advocate` |

Keep untouched: "Health Advocate position", "Health Advocate with", and all other role wording. The header at fillable-pdf.js:110 ("Health Advocate Application Packet") stays as-is (role title, not business name).

- [ ] **Step 2: Verify**

Run: `node --check netlify/functions/utils/fillable-pdf.js && node --check netlify/functions/utils/pdf.js && grep -n "Senior Health Concierge\|SHC" netlify/functions/utils/fillable-pdf.js netlify/functions/utils/pdf.js`
Expected: syntax OK; grep returns no matches.

- [ ] **Step 3: Commit**

```bash
git add netlify/functions/utils/fillable-pdf.js netlify/functions/utils/pdf.js
git commit -m "rebrand: advocate legal PDFs SHC -> Legacy Senior Advocate"
```

---

### Task 6: Housekeeping files

**Files:**
- Modify: `package.json:4`
- Modify: `CLAUDE.md:7` (Project Overview paragraph)
- Modify: `supabase-schema.sql:2`
- Modify: `dashboard/app.js:2`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing other tasks rely on.

- [ ] **Step 1: Apply these exact edits**

`package.json` line 4:
```json
// OLD:
  "description": "Senior Health Concierge website with serverless form handling",
// NEW:
  "description": "Legacy Senior Advocate website with serverless form handling",
```

`CLAUDE.md` line 7 — replace the sentence opener:
```markdown
<!-- OLD: -->
Senior Health Concierge (SHC) — a static website with serverless backend for senior health advocacy services.
<!-- NEW: -->
Legacy Senior Advocate (LSA) — a static website with serverless backend for senior advocacy services.
```

`supabase-schema.sql` line 2:
```sql
-- OLD:
-- SHC Portal — Supabase Database Schema
-- NEW:
-- LSA Portal — Supabase Database Schema
```

`dashboard/app.js` line 2:
```js
// OLD:
   SHC Staff Dashboard — Client-Side Application
// NEW:
   LSA Staff Dashboard — Client-Side Application
```

- [ ] **Step 2: Verify**

Run: `node --check dashboard/app.js && node -e "JSON.parse(require('fs').readFileSync('package.json'))" && grep -n "Senior Health Concierge" package.json CLAUDE.md supabase-schema.sql dashboard/app.js`
Expected: no errors; grep returns no matches.

- [ ] **Step 3: Commit**

```bash
git add package.json CLAUDE.md supabase-schema.sql dashboard/app.js
git commit -m "rebrand: housekeeping files SHC -> LSA"
```

---

### Task 7: Apps Script query widening (repo copy + manual instructions)

**Files:**
- Modify: `google-apps-script/process-returned-applications.gs:33`

**Interfaces:**
- Consumes: nothing.
- Produces: a NEW manual email-subject convention for Pat: outgoing packet emails should use subject containing `LSA Application` going forward.

**Context for the executor:** This script runs inside Google Apps Script (Pat's Gmail), NOT on Netlify. It searches Gmail for returned application packets by subject. Pat manually emails packets with a subject containing "SHC Application"; replies match. Widening the query keeps old threads working while allowing the new "LSA Application" convention. The repo copy is documentation only — the user must paste the change into script.google.com.

- [ ] **Step 1: Widen the search query in the repo copy**

```js
// OLD (line 33):
    searchQuery: 'has:attachment filename:pdf subject:"SHC Application" -label:nhc-processed',
// NEW:
    searchQuery: 'has:attachment filename:pdf subject:("SHC Application" OR "LSA Application") -label:nhc-processed',
```

Leave `processedLabel: 'nhc-processed'` (line 32) exactly as-is.

- [ ] **Step 2: Commit**

```bash
git add google-apps-script/process-returned-applications.gs
git commit -m "rebrand: widen Apps Script query to match LSA Application subjects"
```

- [ ] **Step 3: Report the manual action for the user**

Include in the task report, verbatim: "Manual step for you: open script.google.com → the process-returned-applications project → change line 33's searchQuery to match the repo copy → Save. Going forward, send application packets with a subject containing 'LSA Application' (e.g., 'LSA Application Packet — Jane Doe'). Old 'SHC Application' threads keep working."

---

### Task 8: Full verification sweep + deploy

**Files:**
- No new modifications (verification + push only).

**Interfaces:**
- Consumes: all Task 1–7 commits present on `main`.
- Produces: production deploy.

- [ ] **Step 1: Repo-wide grep sweep**

Run: `grep -rn "Senior Health Concierge" --include="*.js" --include="*.html" --include="*.json" --include="*.md" --include="*.sql" --include="*.gs" --exclude-dir=node_modules --exclude-dir=docs .`
Expected: zero matches. (`docs/` is excluded because this plan document intentionally quotes the old name.)

Run: `grep -rn "SHC\b" netlify/ dashboard/ *.html *.json *.sql CLAUDE.md`
Expected: zero matches. (`google-apps-script/` intentionally excluded — "SHC Application" remains in the widened OR query. `.claude/launch.json`'s `nhc-site` name is local config, harmless, leave it.)

- [ ] **Step 2: Syntax-check every function file**

Run (Git Bash): `for f in netlify/functions/*.js netlify/functions/utils/*.js; do node --check "$f" || echo "FAIL: $f"; done`
Expected: no FAIL lines.

- [ ] **Step 3: Push to deploy**

```bash
git push origin main
```

Netlify auto-deploys. Confirm in the report that push succeeded.

- [ ] **Step 4: Live smoke test (report to user for assisted verification)**

Ask the user to submit the client-inquiry form on the live site with test data (name "TEST Rebrand", their own email) and confirm the confirmation email arrives with sender "Legacy Senior Advocate" and no SHC text. This exercises email + Sheets + Supabase paths end-to-end. The TEST row can then be deleted from the dashboard.

---

## Phase 2 — HIPAA App Evaluation (deliverable by 2026-08-01)

Phase 2 tasks are research, not code. Each produces a markdown deliverable committed to the repo. Executors should use web search and official vendor pricing pages; cite sources with URLs and a retrieved-on date. Evaluation lens for every candidate, in priority order: (1) will vendor sign a BAA at the price tier considered, (2) monthly cost for 2 advocates and for 5 advocates, (3) covers which of the four required capabilities, (4) training burden for non-technical advocates, (5) client/family-facing portal quality.

**The four required capabilities (from the owner's outline):**
1. **Transcription** — record/transcribe doctor's appointments on the advocate's phone, then upload the transcript to the client's portal record.
2. **Time clock** — advocate starts/stops a timer around appointments for accurate billing of hours.
3. **Shared calendar** — upcoming appointments visible to client, advocate, AND family members.
4. **Group chat** — advocate at an appointment can broadcast a question to all other advocates (team channel), plus advocate↔client/family messaging.

### Task 9: Current-stack HIPAA gap assessment

**Files:**
- Create: `docs/hipaa/gap-assessment.md`

**Interfaces:**
- Consumes: nothing.
- Produces: a "must-fix" list that Task 12's recommendation must address.

- [ ] **Step 1: Assess each current component and write the deliverable**

Create `docs/hipaa/gap-assessment.md` answering, for each component, three questions: does it store/transmit PHI today, is a BAA in place or available, and what is the remediation option + rough cost. Components to cover (this is the complete checklist — investigate each):

```markdown
# LSA Current-Stack HIPAA Gap Assessment (2026-07)

| Component | PHI exposure today | BAA status | Remediation options |
|---|---|---|---|
| Consumer Gmail (srhealthconcierge@gmail.com) | Client intake details, medical authorization PDFs emailed | ❌ Google offers NO BAA on consumer Gmail | Google Workspace Business ($7-14/user/mo) WITH BAA signed, or route PHI out of email entirely into the chosen platform |
| Google Sheets (consumer account) | All client intake rows incl. health context | ❌ same as above | Same as above — Workspace BAA covers Sheets/Drive |
| AWS S3 (generated PDFs) | Client agreement packets with medical authorizations | ⚠️ AWS signs BAAs free, but must be configured (account-level BAA in AWS Artifact + encryption + access controls) — verify current bucket is private + encrypted | Accept AWS BAA in Artifact; audit bucket policy |
| Supabase (project rtulqglpbfeocbfskczu) | Mirror of intake data | ⚠️ Supabase HIPAA/BAA requires Team plan ($599/mo) or higher — free/pro tiers are NOT covered | Either upgrade (expensive), stop mirroring PHI fields, or migrate PHI to the chosen platform |
| Netlify Functions | PHI transits at submit time (not stored) | ⚠️ Netlify does not sign BAAs on standard plans | Transit-only may be acceptable short-term; long-term move PHI intake into the chosen platform's own forms |
| Google Apps Script + Drive (returned packets) | Signed application packets | ❌ consumer account | Covered by Workspace BAA if migrated |
```

Verify each claim above via current vendor documentation before finalizing (pricing and BAA policies change); correct anything outdated and cite sources. Close the doc with a prioritized must-fix list.

- [ ] **Step 2: Commit**

```bash
git add docs/hipaa/gap-assessment.md
git commit -m "docs: current-stack HIPAA gap assessment"
```

---

### Task 10: All-in-one platform research (Option 1)

**Files:**
- Create: `docs/app-eval/all-in-one.md`

**Interfaces:**
- Consumes: the four required capabilities defined in the Phase 2 preamble.
- Produces: per-platform scorecards consumed by Task 12.

- [ ] **Step 1: Research each candidate and write scorecards**

Candidates (evaluate all; add others found during research that sign BAAs and target care-coordination/wellness practices — note LSA is a non-clinical advocacy business, so platforms must not require an NPI/license):

1. **Healthie** — known baseline ~$50-100/provider/mo; check BAA tier, client portal, scheduling, chat, document storage, whether family members can share calendar access
2. **Carepatron** — reportedly much cheaper (~$19-29/user/mo) with BAA; same checks
3. **SimplePractice** — ~$49-99/user/mo; historically clinician-oriented; check non-clinician eligibility
4. **Practice Better / IntakeQ** — mid-range; strong forms + portal
5. **Spruce Health** — HIPAA phone/text/chat-first platform (~$24-50/user/mo); weaker on portal/docs but strong on the chat requirement

For each, fill this exact scorecard:

```markdown
## <Platform>
- Pricing (2 advocates / 5 advocates, monthly): $X / $Y — tier name, source URL, retrieved YYYY-MM-DD
- BAA: included at that tier? (yes/no/higher tier required)
- Capability coverage: transcription ❌/⚠️/✅ | time clock ❌/⚠️/✅ | shared family calendar ❌/⚠️/✅ | team group chat ❌/⚠️/✅ | client portal ❌/⚠️/✅
- Gaps needing an add-on app: ...
- Non-clinical advocacy business eligible: yes/no
- Training burden (1=easy, 5=hard): N — why
- Mobile app quality (advocate works from phone): notes
```

- [ ] **Step 2: Commit**

```bash
git add docs/app-eval/all-in-one.md
git commit -m "docs: all-in-one HIPAA platform research"
```

---

### Task 11: Best-of-breed stack research (Option 2)

**Files:**
- Create: `docs/app-eval/best-of-breed.md`

**Interfaces:**
- Consumes: the four required capabilities defined in the Phase 2 preamble.
- Produces: a costed best-stack proposal consumed by Task 12.

- [ ] **Step 1: Research per-capability candidates and write the deliverable**

Key insight to verify and build around: **Google Workspace Business (with BAA signed) may cover email + shared Calendar + Drive storage for ~$7-14/user/mo**, and a **time clock app that stores no PHI (client initials/codes only, e.g., Clockify free tier or QuickBooks Time) needs no BAA at all**. That leaves only transcription and HIPAA chat needing specialist tools.

Candidates per capability (evaluate all, same citation rules as Task 10):

```markdown
## Transcription (medical-visit capture on phone)
- Abridge (patient/consumer product status?), Freed (~$90/mo), Nabla, Heidi Health, 
  Otter.ai Business w/ BAA?, Google Recorder (no BAA — disqualify if PHI)
- Required: BAA, phone recording, export/upload of transcript

## Shared calendar (client + advocate + family)
- Google Calendar under Workspace BAA (shared per-client calendars)
- The chosen chat platform's scheduling feature, if any

## Team group chat + client messaging
- Spruce Health, Google Chat under Workspace BAA, Signal (❌ no BAA — document why rejected)

## Time clock (no-PHI design)
- Clockify (free), QuickBooks Time, Homebase — confirm no client PHI stored (use client codes)

## Client portal / transcript storage
- Google Drive shared folders under Workspace BAA (lean option), or keep in LSA portal 
  question: what would it take for the existing Netlify/Supabase portal to hold transcripts? 
  (ties back to Task 9 Supabase BAA finding — likely NOT viable cheaply; document)
```

Close with a "recommended stack" table: one pick per capability + total monthly cost at 2 and at 5 advocates + number of separate BAAs/logins to manage.

- [ ] **Step 2: Commit**

```bash
git add docs/app-eval/best-of-breed.md
git commit -m "docs: best-of-breed HIPAA app stack research"
```

---

### Task 12: Comparison, recommendation, and pilot plan

**Files:**
- Create: `docs/app-eval/recommendation.md`

**Interfaces:**
- Consumes: `docs/hipaa/gap-assessment.md` (Task 9), `docs/app-eval/all-in-one.md` (Task 10), `docs/app-eval/best-of-breed.md` (Task 11).
- Produces: the decision document for Pat, due 2026-08-01.

- [ ] **Step 1: Write the comparison + recommendation**

Structure of `docs/app-eval/recommendation.md` (write in plain language — audience is non-technical):

```markdown
# LSA Advocate/Client App — Recommendation (2026-08-01)

## The decision in one page
- Option 1 (best all-in-one): <platform> at $X/mo for 2 advocates ($Y at 5)
- Option 2 (best stack): <apps> at $X/mo for 2 advocates ($Y at 5)
- What we recommend and why (cost, HIPAA coverage, training burden, capability fit)

## Side-by-side
| | Option 1 | Option 2 |
|---|---|---|
| Monthly cost (2 advocates) | | |
| Monthly cost (5 advocates) | | |
| Transcription | | |
| Time clock | | |
| Shared family calendar | | |
| Team group chat | | |
| Client portal | | |
| # of logins for an advocate | | |
| # of BAAs to manage | | |
| Also fixes current-stack HIPAA gaps? (from gap-assessment.md) | | |

## 30-day pilot plan
- Week 1: sign up (free trials where available), sign BAAs, configure 1 test client
- Week 2: Pat + 1 advocate run a mock appointment end-to-end 
  (clock in → record/transcribe → upload to portal → calendar entry → team chat question)
- Week 3-4: first real client, feedback, go/no-go
- Training checklist per advocate (per the chosen option)

## What stays in the LSA website/portal vs moves to the platform
- Website: marketing, inquiry form, advocate applications (no change)
- Platform: everything PHI (transcripts, medical docs, client messaging, calendar)
- Explicit list of current flows that must CHANGE to close HIPAA gaps (from Task 9)
```

- [ ] **Step 2: Commit and present**

```bash
git add docs/app-eval/recommendation.md
git commit -m "docs: advocate/client app recommendation + pilot plan"
git push origin main
```

Present the one-page summary to the user in chat and offer to walk through it with Pat.

---

## Deferred / follow-ups (tracked, not in this plan)

- GitHub repo rename `nurse-health-concierge` → e.g. `legacy-senior-advocate` (user action; local remotes + Netlify link must be updated after — do together in a session)
- Delete stray Vercel `nhc-portal` project under team `shc-6a63ad9f` (user action; MCP cannot reach that account)
- Supabase migration completion — pause until Task 9/12 decide whether PHI belongs in Supabase at all
- Logo art still reads "Advocates" (plural) — designer task
