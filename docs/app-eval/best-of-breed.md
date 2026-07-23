# LSA Best-of-Breed HIPAA App Stack Research (Option 2)

**Prepared:** 2026-07-23 | All prices and BAA claims below were verified against current vendor sources on this date (see citations). Vendor pricing changes often — re-verify before signing anything.

**Context:** Legacy Senior Advocate (LSA) is a small, NON-CLINICAL senior-advocacy business in Florida with 1-5 advocates and a cost-sensitive owner (Pat). This document tests whether LSA can assemble its own stack from individual best-of-breed apps more cheaply than an all-in-one platform (Task 10), while still covering all four required capabilities under proper HIPAA Business Associate Agreements (BAAs):

1. Phone transcription of doctor visits, uploaded to a client portal
2. Time clock
3. Calendar shared with client + family members
4. Advocate team group chat

## Bottom line up front

**The hypothesis holds — and turns out even stronger than assumed.** A single Google Workspace Business Standard subscription, with its BAA signed, covers email, shared per-client calendars, team chat, and client-file/transcript storage. It also turns out to cover **transcription**, because Google's Gemini AI is bundled into Business Standard at no extra cost *and* is itself one of Google's HIPAA-covered services — so a transcript can be generated inside the same BAA instead of needing a second, specialist vendor. The only other tool needed is a free time-clock app that never touches PHI. Net result: **one BAA, two logins per advocate, near-zero marginal cost beyond the Workspace subscription itself.**

---

## 1. Google Workspace: verifying the core hypothesis

### Which edition, and what does it cost

Google Workspace has four paid business tiers (personal/free Gmail is never eligible for a BAA and cannot be used for anything client-related):

| Edition | Price/user/mo (1-yr commit) | Price/user/mo (pay-monthly, no commit) | Pooled Drive storage |
|---|---|---|---|
| Business Starter | $7.00 | $8.40 | 30 GB |
| **Business Standard** | **$14.00** | **$16.80** | **2 TB** |
| Business Plus | $22.00 | $26.40 | 5 TB |

Source: [Google Workspace Pricing](https://workspace.google.com/pricing) (retrieved 2026-07-23). Google is currently running a "50% off first 3 months" promo on Starter/Standard/Plus — treat that as a bonus, not the steady-state price used in this report's cost table.

**Recommended edition: Business Standard**, not Starter, for one specific reason — see the Gemini/transcription finding below. Business Standard is exactly the top of the brief's "$7-14/user/mo" hypothesis range.

### Does the BAA cover Gmail, Calendar, Drive, Chat, and Meet?

Yes. Google's own "HIPAA Included Functionality" list — the attachment referenced directly inside the BAA legal text — names Gmail, Google Calendar, Google Chat, Google Drive (Docs/Sheets/Slides/Forms/Vids), Google Meet, Google Vault, Google Tasks, Google Groups, Apps Script, **and Gemini in Workspace / the Gemini app** as covered services. Source: [Google Workspace HIPAA Business Associate Amendment](https://workspace.google.com/terms/2015/1/hipaa_baa/) and the linked [Covered Services list](https://workspace.google.com/terms/2015/1/hipaa_functionality.html) (retrieved 2026-07-23).

### Which editions can actually sign the BAA

Google's own documentation does not gate BAA eligibility by SKU name in the legal text itself — any paid Workspace edition (Business or Enterprise) can request one through the Admin console. Secondary compliance-advisory sources are split on whether Business Starter specifically qualifies in practice; several third-party HIPAA consultants recommend Business Standard or higher as the practical floor because it's the tier where the compliance-relevant features (full Gemini access, better endpoint controls) actually turn on. Sources: [HIPAA Journal — Is Google Workspace HIPAA Compliant?](https://www.hipaajournal.com/is-google-workspace-hipaa-compliant/), [Patient Protect](https://patient-protect.com/post/is-google-workspace-hipaa-compliant), [BAA Generator](https://baagenerator.com/blog/does-google-workspace-sign-a-baa) (all retrieved 2026-07-23). **Practical takeaway for LSA: go with Business Standard — it removes any tier-eligibility ambiguity and is the tier that unlocks full Gemini transcription (see below).**

### How family members get calendar access

Two options, verified against Google's own Calendar help docs (retrieved 2026-07-23, [Share your calendar](https://support.google.com/calendar/answer/37082)):

- **Full sharing (see event details, optionally edit):** the advocate shares a specific per-client calendar with the family member's email address under "Share with specific people." The family member needs *a* Google account to accept this — it can be their personal free Gmail, it does not need to be a Workspace account. This is the recommended default.
- **View-only, no Google account needed:** the advocate copies the calendar's "secret address in iCal format" and sends it to the family member, who subscribes to it from Outlook, Apple Calendar, or any calendar app. No Google account required, but it's read-only and the link itself should be treated as sensitive (anyone with the link can view it).

A Workspace admin setting controls whether calendars can be shared outside the organization at all — this needs to be confirmed as enabled during setup (it's on by default for Business Standard but admins can lock it down).

---

## 2. Transcription (medical-visit capture on phone)

**Consent note first, because it changes how any of this gets used:** Florida is an all-party (often called "two-party") consent state under Fla. Stat. § 934.03 — recording a private conversation without the consent of everyone party to it is a third-degree felony. A doctor's visit involves the client, the advocate, and clinical staff, all of whom would need to consent before an advocate hits record. **This is a real legal exposure for the core workflow this document is evaluating and should be confirmed with LSA's attorney before any recording feature goes live** — e.g., a documented verbal or written consent step at the start of every visit, captured as part of the recording itself. (Source: [RecordingLaw.com — Florida](https://www.recordinglaw.com/party-two-party-consent-states/florida-recording-laws/), [Florida Statute § 934.03](https://www.flsenate.gov/laws/statutes/2012/934.03), retrieved 2026-07-23.)

### The five candidates named in the brief — all disqualified for this specific use case

These tools are all built as **ambient AI scribes for the treating clinician's own documentation** (auto-generating a SOAP note into *their* EHR), not as a general-purpose recorder for a bystander/companion. That mismatch, plus access-tier problems, disqualifies every one of them:

| Candidate | Price | BAA | Verdict for LSA |
|---|---|---|---|
| **Abridge** | ~$200-800/provider/mo, reportedly ~$2,500/clinician/yr on enterprise contracts | Yes, but only through enterprise/health-system procurement | ❌ Not self-serve — sold exclusively through a health system's IT department, cannot be signed up for directly. Its patient-facing companion app has reportedly been retired. Source: [DeepCura Abridge review](https://www.deepcura.com/resources/abridge-ai-review), [Marvix](https://www.marvix.ai/blog/abridge-pricing-review) (2026-07-23) |
| **Freed** | $39 / $79 / $119 per provider/mo, published tiers | Yes, BAA is built into the signup flow at all paid tiers | ❌ Self-serve and BAA-capable, but its Terms of Use frame it strictly as an adjunct to a *clinician's* own professional judgment — it is designed and licensed for the treating provider documenting their own patient, not for a non-clinician companion recording someone else's visit. Using it that way is a plausible Terms-of-Use mismatch, not a supported workflow. Source: [Freed Platform Terms of Use](https://help.getfreed.ai/en/articles/9879697-platform-terms-of-use-scribe-clinician-assistant) (2026-07-23) |
| **Nabla** | Reported $0-$119+/mo band, but no public self-serve individual rate | Yes, signs BAAs "as standard" | ❌ Oriented entirely toward organizational/enterprise procurement — no individual self-serve signup exists even for small practices; onboarding is a 2-4 week sales-and-security-review process. Source: [SaaSworthy — Nabla pricing](https://www.saasworthy.com/product/nabla/pricing), [trytwofold Nabla review](https://www.trytwofold.com/compare/nabla-copilot-review) (2026-07-23) |
| **Heidi Health** | Clinician plan $150/mo (2026 repricing); Evidence Plus $40/mo | **No** signed BAA below the custom-quoted "Practice" tier and up | ❌ The only self-serve, published-price tier (Clinician, $150/mo) explicitly does **not** include a signed BAA — it runs on Heidi's standard terms of service instead, which is not sufficient for PHI. Getting an actual BAA means jumping to a custom-quoted organizational tier. Source: [trytwofold Heidi review](https://www.trytwofold.com/compare/heidi-health-pricing-2026-guide) (2026-07-23) |
| **Otter.ai (Business)** | Business plan, published self-serve pricing | **No** — BAA is Enterprise-only, custom quote | ❌ Otter's own Help Center is explicit: users on Basic, Pro, or Business cannot get a BAA and cannot use Otter for PHI. Only the sales-quoted Enterprise plan includes one. Source: [Otter.ai HIPAA Help Center article](https://help.otter.ai/hc/en-us/articles/33975072019991-HIPAA-Otter-ai) (2026-07-23) |
| Google Recorder (named in the brief) | Free | **No** — consumer app, no BAA path exists | ❌ Confirmed disqualified as the brief anticipated. |

**All five named candidates fail** — either the BAA doesn't exist at an affordable/self-serve tier, or the tool's whole design assumes the recording clinician is the account holder. None of them fit "a non-clinician advocate recording someone else's doctor visit on a phone."

### The workaround that actually satisfies the brief's cost hypothesis: use Gemini inside the Workspace BAA already being paid for

Because **Gemini in Workspace is itself a HIPAA-covered service** under the same Google BAA that covers Gmail/Calendar/Drive/Chat (confirmed in Section 1), the practical, no-extra-vendor path is:

1. Advocate records the visit audio on their phone using its native voice-memo app (after getting the required consent — see above). Nothing leaves the phone at this point, so no BAA is implicated yet.
2. Advocate uploads the audio file into the client's shared folder in **Google Drive** (Workspace-BAA-covered).
3. Advocate opens **Gemini** (the Workspace-licensed version, not a personal Gemini account) and asks it to transcribe/summarize the uploaded audio file directly.
4. The transcript, saved as a Doc, lives in the same client folder — no separate portal, no separate BAA.

This is included in Business Standard at no extra cost — Google folded the old $20-30/user "Gemini add-on" into the base Workspace price in 2025. Source: [eesel AI — Gemini for Workspace pricing](https://www.eesel.ai/blog/gemini-workspace-pricing), [buildfastwithai — Gemini Workspace features](https://www.buildfastwithai.com/blogs/gemini-google-workspace-features-guide) (retrieved 2026-07-23).

**Real limitation to plan around:** the consumer Gemini app UI currently caps direct file transcription at roughly 10 minutes of audio per upload. Source: [Sally — Gemini Transcription guide](https://www.sally.io/blog/google-gemini-transcription) (2026-07-23). A 30-45 minute doctor visit will need to be recorded/uploaded in a few natural-break segments (e.g., pause the recorder between the doctor's exam and the wrap-up discussion) rather than as one file. This is a real workflow friction, but it costs nothing extra and needs no additional BAA, versus paying for a specialist tool that, per the table above, isn't actually accessible to LSA anyway.

**Fallback if this friction proves unworkable in practice:** Otter.ai Enterprise (custom quote, requires sales negotiation) is a purpose-built transcription tool with a real BAA — but it adds a second vendor BAA to manage and an unknown (likely higher) monthly cost. Recommend piloting the Gemini path first since it's already paid for.

---

## 3. Shared calendar (client + advocate + family)

Covered in full in Section 1 — **Google Calendar under the Workspace BAA**, using per-client shared calendars. No additional app or cost. The chosen chat platform (Google Chat, see below) does not have its own separate scheduling feature worth using instead — Calendar is the right tool for this job on its own.

---

## 4. Team group chat + client messaging

| Candidate | Price | BAA | Verdict |
|---|---|---|---|
| **Google Chat** (under Workspace BAA) | $0 marginal — bundled into the Business Standard subscription already needed | Yes, covered under the same single Workspace BAA (confirmed in Section 1) | ✅ **Recommended.** Zero extra cost, zero extra BAA, zero extra login (same account as email/calendar/drive) for internal advocate team chat. |
| **Spruce Health** | Basic $24/user/mo, Communicator $49/user/mo | Yes — BAA is automatic on all trials and paid plans | ⚠️ Strong option, but not needed for the *required* capability (internal team chat only). Its real value is HIPAA-compliant texting/calling/video **with clients and their families**, who won't have Workspace accounts. Worth revisiting if LSA later wants to text clients directly — not part of this task's scope, so it's a deliberate cost avoided for now, not a gap. |
| **Signal** | Free | **No** — Signal will not sign BAAs with anyone, for any tier, at any price. | ❌ Disqualified. Signal's strong end-to-end encryption is a privacy feature, not a HIPAA-compliance one — HIPAA requires a signed Business Associate Agreement, audit logging, and administrative safeguards that Signal explicitly does not offer as a matter of policy. No configuration fixes this; it's a business decision Signal has made, not a technical gap. Source: [Paubox — Is Signal HIPAA compliant?](https://www.paubox.com/blog/is-signal-hipaa-compliant) (2026-07-23) |

**Recommended: Google Chat**, for the internal team-chat requirement as scoped. Flag Spruce Health as a documented, priced option to revisit if/when LSA wants direct client texting.

---

## 5. Time clock (no-PHI design)

The brief's premise is correct: if the time-clock app never receives a client's name, diagnosis, address, or any other identifying health detail, it isn't handling PHI and doesn't need a BAA at all. This works via a **client-code convention**: instead of a real client name, each advocate logs time against an opaque project code (e.g., client "Dorothy Miller" → code "DM-014"). The code-to-real-identity crosswalk is kept in a single spreadsheet inside the BAA-covered Google Drive, never inside the time-clock tool itself. Time entries and task labels stay generic ("client visit," "care coordination call," "documentation") — no diagnosis, no address, no health detail, ever, in the time-clock tool.

| Candidate | Price | Verdict |
|---|---|---|
| **Clockify (Free)** | $0 — unlimited projects/clients/tasks; Clockify itself now describes the free plan as best suited to solo users and small teams up to 5 | ✅ **Recommended.** Free tier ceiling (~5 users) matches LSA's stated team size exactly. Mobile clock-in/out, CSV/PDF export, no BAA needed if the code convention is followed. Source: [Clockify Free Plan Features](https://clockify.me/learn/resources/clockify-free-plan-features/) (2026-07-23) |
| QuickBooks Time | $10/user/mo + $20 (Premium) or $40 (Elite) monthly base fee, on top of a required QuickBooks Online subscription | ⚠️ Only worth it if LSA already runs payroll through QuickBooks Online and wants hours to flow straight into payroll — otherwise it's pure added cost over Clockify for the same clock-in/out function. Worth a follow-up question to Pat about current payroll software. Source: [OnTheClock — QuickBooks Time 2026 price increase](https://www.ontheclock.com/blog/quickbooks-time-price-increase-2026), [SaaSWorthy](https://www.saasworthy.com/blog/quickbooks-time-pricing) (2026-07-23) |
| Homebase | Free "Basic" single-location tier exists; paid tiers start at $24.95/location/mo (Essentials) for GPS/scheduling extras | ⚠️ Viable free-tier fallback, but its free plan is scheduling-light compared to Clockify's genuinely unlimited free projects/tasks; no clear advantage for LSA's simple clock-in/out need. Source: [ITQlick — Homebase pricing 2026](https://www.itqlick.com/homebase/pricing) (2026-07-23) |

**Recommended: Clockify Free**, using the client-code convention. $0/mo regardless of team size up to 5 advocates, and needs no BAA.

---

## 6. Client portal / transcript storage

| Option | Cost | Verdict |
|---|---|---|
| **Google Drive shared per-client folders (under Workspace BAA)** | $0 marginal — 2 TB pooled storage already included in Business Standard | ✅ **Recommended.** Same BAA, same login as everything else. A folder per client holds the transcript Doc, PDFs, and any other client documents; permissions restricted to the assigned advocate + Pat, with optional read access for the client/family if Pat decides that's appropriate. |
| **Extend the existing LSA Netlify/Supabase portal to hold transcripts** | Not cheaply viable — see below | ❌ Not recommended. |

**What it would take, and why it's ruled out on cost:** This ties directly to Task 9's current-stack gap-assessment finding, independently re-verified here on 2026-07-23:

- **Supabase's HIPAA/BAA coverage requires the Team plan ($599/mo) or Enterprise, and HIPAA itself is a paid add-on on top of that** — one source puts the add-on starting around $350/mo, others say it's a custom quote layered on the $599/mo Team plan base. Either way, that's roughly **$600-950+/mo just for the database's BAA**, before any other cost. Source: [Supabase HIPAA add-on discussion](https://github.com/orgs/supabase/discussions/35594), [ComparEdge — Supabase pricing 2026](https://comparedge.com/tools/supabase/pricing) (2026-07-23).
- **Netlify only offers a BAA on its Enterprise plan**, which is custom-quoted and sales-negotiated — no published price exists, and third-party spend-tracking data puts the median Netlify customer's overall spend around $16,500/year, which is directionally the scale of commitment Enterprise plans run at. Source: [Netlify — HIPAA-compliant service offering announcement](https://www.netlify.com/blog/netlify-launches-a-hipaa-compliant-service-offering/), [Vendr — Netlify pricing 2026](https://www.vendr.com/marketplace/netlify) (2026-07-23).

Put together, making the current LSA portal PHI-capable would mean paying for **two separate enterprise-tier BAAs (Supabase + Netlify)** that, combined, would cost several times more per month than the entire rest of this recommended stack put together — for a 2-5 person business. **The existing portal should stay non-PHI** (marketing site, inquiry form, advocate applications) and all client transcripts/health-related documents should live in Google Drive under the Workspace BAA instead.

---

## Recommended stack

| Capability | Pick | Notes |
|---|---|---|
| Transcription (doctor-visit recording → transcript) | **Gemini, bundled in Google Workspace Business Standard** | Covered by the same Workspace BAA (Section 2); pilot the ~10-min-per-file limitation before relying on it (note: the 10-min figure comes from consumer-Gemini sources — the Workspace-specific cap isn't independently confirmed, so verify during the pilot) |
| Shared calendar (client + advocate + family) | **Google Calendar** (Workspace Business Standard) | Per-client shared calendars; family members invited by email (Section 3) |
| Team group chat | **Google Chat** (Workspace Business Standard) | Same account, same BAA (Section 4); Spruce Health documented as the paid upgrade path if client-facing texting is later wanted |
| Time clock | **Clockify (Free)**, with client-code convention | $0, no BAA needed — never stores PHI (Section 5) |
| Client portal / transcript storage | **Google Drive shared folders** (Workspace Business Standard) | One BAA-covered folder per client, shared with client + family (Section 6) |
| (Bonus) Email | **Gmail** (Workspace Business Standard) | Replaces the consumer-Gmail HIPAA gap identified in docs/hipaa/gap-assessment.md |

Four of the five capability picks are the same product — **one Google Workspace Business Standard subscription** ($14/user/mo on a 1-yr commit; $16.80/user/mo pay-monthly) covers transcription, calendar, chat, portal storage, and email under a single BAA and login.

### Total monthly cost

| | 2 advocates | 5 advocates |
|---|---|---|
| Google Workspace Business Standard (annual commitment, $14/user/mo) | **$28/mo** | **$70/mo** |
| Google Workspace Business Standard (pay-monthly, no commit, $16.80/user/mo) | $33.60/mo | $84/mo |
| Clockify Free | $0 | $0 |
| **Total (annual commit)** | **$28/mo** | **$70/mo** |
| **Total (pay-monthly)** | **$33.60/mo** | **$84/mo** |

### BAAs and logins to manage

- **Separate BAAs required: 1** — the single Google Workspace BAA covers Gmail, Calendar, Drive, Chat, and Gemini. Clockify needs no BAA because the client-code convention keeps PHI out of it entirely.
- **Logins per advocate: 2** — one Google Workspace account (Gmail/Calendar/Drive/Chat/Gemini, single sign-on across all of them) and one Clockify account.

### If the Gemini transcription workaround doesn't hold up in practice

Add **Otter.ai Enterprise** (custom quote — get a number from their sales team before committing) as a second BAA and a third login. That would raise "BAAs to manage" to 2 and "logins per advocate" to 3, and add an unknown but likely non-trivial monthly cost on top of the $28-84/mo Workspace+Clockify base above. Recommend piloting the Gemini path first, since it costs nothing extra to try.

---

## Self-review notes

- Every price and every BAA claim above cites a specific source URL and was checked against a 2026-07-23 search/fetch; conflicting secondary sources are called out explicitly (e.g., Business Starter BAA eligibility) rather than silently picking one.
- Stack-total arithmetic: Business Standard annual $14 × 2 = $28, × 5 = $70; pay-monthly $16.80 × 2 = $33.60, × 5 = $84. Clockify and Google Chat and Gemini and Calendar sharing all confirmed $0 marginal since they ride on the Workspace subscription already counted.
- Language kept non-technical throughout per Pat's working-style preference (plain explanations, no unexplained jargon); technical steps (e.g., the Gemini transcription workflow) are written as a numbered how-to rather than assumed knowledge.
- Two deviations worth flagging back to the requester: (1) all five brief-named transcription vendors are disqualified, which is a stronger/different finding than the brief anticipated ("only transcription and chat need specialist tools") — chat turned out not to need a specialist tool either, and transcription's answer is a workaround inside Workspace, not a vendor pick; (2) the Florida two-party-consent recording law is a legal exposure on the *entire* transcription capability, independent of which app is chosen, and needs attorney sign-off before this ships to real clients.
