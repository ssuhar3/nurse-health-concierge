# LSA Advocate/Client App — Recommendation (2026-08-01)

**For:** Pat (founder), Legacy Senior Advocate (LSA)
**Prepared:** 2026-07-23 · **Decision due:** 2026-08-01
**Sources:** this document pulls every price and fact from three research files already in this repo — the HIPAA gap assessment (`docs/hipaa/gap-assessment.md`), the all-in-one platform research (`docs/app-eval/all-in-one.md`), and the best-of-breed stack research (`docs/app-eval/best-of-breed.md`). No new prices are invented here; where a number appears, it came from one of those three.

---

## The decision in one page

You have two honest ways to give advocates the tools they need — a real client portal, a shared family calendar, team chat, a time clock, and a way to capture doctor-visit recordings — while handling clients' health information safely.

- **Option 1 (best all-in-one): Carepatron + Google Workspace.** Carepatron is a polished, purpose-built platform with a real client portal and mobile apps. It costs **$62/mo for 2 advocates ($155/mo at 5)** for the platform itself. But Carepatron does not give you email, and consumer Gmail is our single biggest HIPAA gap — so you *still* have to move email to Google Workspace on top. All-in (Carepatron + Workspace Business Standard + a free time clock) that's about **$90/mo for 2 advocates ($225/mo at 5)**.

- **Option 2 (best stack): Google Workspace Business Standard + Clockify (free).** One Google subscription covers email, a shared per-client calendar, team chat, client-file storage, and — because Google's Gemini AI is bundled in and covered by the same agreement — visit transcription. A free time-clock app (Clockify) rounds it out. Total: **$28/mo for 2 advocates ($70/mo at 5)**.

### What we recommend, and why: **Option 2 (Google Workspace Business Standard + Clockify Free).**

1. **Cost.** Option 2 is roughly **one-third the price of Carepatron-plus-Workspace, and about one-seventh the price of the most feature-complete all-in-one (Healthie, $199.99/mo for 2 / $349.99/mo for 5) once you add the email you'd still need.** For a 1–5 person, cost-sensitive business, that gap is the headline. You're a founder who doesn't want to pay for features you won't use, and the all-in-one platforms are full clinical-practice software (billing, telehealth, treatment programs) built for licensed clinicians — far more than an advocacy team of five needs.

2. **HIPAA coverage — this is the key insight.** Moving email off consumer Gmail to Google Workspace is the **#1 must-fix item regardless of which option you choose** (from the gap assessment). Option 2 *is* that migration — so the thing you have to do anyway becomes almost the entire solution. It closes the two biggest gaps (consumer Gmail and the consumer Google Sheets that is currently your client database) as a side effect, under a single legal agreement (a "BAA," explained below). Option 1 makes you buy Workspace **and** Carepatron and manage two separate agreements for overlapping capabilities.

3. **Training burden.** Your advocates already know Gmail, Google Calendar, and Google Drive. Option 2 adds almost no new software to learn — mainly a new (paid) Google account and one simple time-clock app. Carepatron is rated easy for an all-in-one (2 out of 5 for difficulty), but it's still a whole new clinical platform to learn on top of the Google tools you'll be running anyway.

4. **Capability fit.** Option 2 covers all four required capabilities. Its two soft spots versus Carepatron are honest and worth stating: (a) client "portal" means a shared Google Drive folder, not a branded client-login app; and (b) transcription has a workflow wrinkle (long recordings must be uploaded in ~10-minute segments — see the pilot). Neither is a dealbreaker at your size, and both are things the 30-day pilot is designed to prove out before you commit.

**The honest trade-off:** Option 1 buys you a nicer client-facing portal and more polished mobile apps. Option 2 saves you roughly $60–155/month and one legal agreement, at the cost of a more do-it-yourself feel (Drive folders instead of a portal). Because you can build and host simple things yourself and are watching cost, Option 2 wins. **If** the pilot shows the Drive-folder experience feels too bare for clients and families, the clean upgrade path is a **hybrid**: keep Workspace as the backbone and add Carepatron *only* for its client portal — a decision the pilot will inform, not one you have to make blind today.

---

## Side-by-side

**Option 1 = Carepatron (Plus tier) + Google Workspace Business Standard for email + Clockify Free for the time clock.**
**Option 2 = Google Workspace Business Standard + Clockify Free.**

| | Option 1 (Carepatron + Workspace) | Option 2 (Workspace + Clockify) |
|---|---|---|
| **Monthly cost (2 advocates)** | **~$90/mo** — Carepatron $62 + Workspace Standard $28 + Clockify $0 | **$28/mo** — Workspace Standard $28 + Clockify $0 |
| **Monthly cost (5 advocates)** | **~$225/mo** — Carepatron $155 + Workspace Standard $70 + Clockify $0 | **$70/mo** — Workspace Standard $70 + Clockify $0 |
| **Transcription** | Carepatron AI Scribe is included on paid tiers ⚠️ — but, like every all-in-one, it's built to transcribe the platform's *own* session, **not** a doctor visit recorded on a phone somewhere else. Fallback that works: record on the phone, upload the file to the client's chart. **Must be tested in the pilot.** | Google Gemini (bundled in Workspace Standard, covered by the same Google agreement) ⚠️ — record on the phone, upload to Drive, ask Gemini to transcribe. **Friction to plan for: the upload caps around 10 minutes of audio per file**, so a 30–45 min visit is recorded in a few segments. Costs nothing extra. |
| **Time clock** | ❌ Carepatron has no staff clock-in feature → use **Clockify Free** (same as Option 2) | ✅ **Clockify Free** — mobile clock in/out, up to 5 users free, no PHI stored (uses client codes, see pilot) |
| **Shared family calendar** | ⚠️ Carepatron can link a family "relationship" contact who gets their own portal space, but whether that surfaces the *calendar* (vs. just documents/messages) is unconfirmed — **verify in a trial** | ✅ Google Calendar, one shared calendar per client. Family accepts a share to any Google account (their normal free Gmail is fine) or subscribes read-only with no account at all |
| **Team group chat** | ✅ Carepatron Team Chat (included on the Plus tier) | ✅ Google Chat (bundled, same login as email/calendar/drive) |
| **Client portal** | ✅ **Real, polished client portal** — this is Option 1's main advantage | ⚠️ Shared **Google Drive folder per client** (transcripts, PDFs, documents), access limited to the assigned advocate + Pat, optional read access for client/family. Functional, not a branded portal app |
| **# of logins for an advocate** | **3** — Carepatron, Google Workspace, Clockify | **2** — Google Workspace (one sign-on for email/calendar/drive/chat/transcription) + Clockify |
| **# of BAAs to manage** | **2** — Carepatron's BAA + Google Workspace's BAA (Clockify needs none) | **1** — the single Google Workspace BAA (Clockify needs none) |
| **Also fixes current-stack HIPAA gaps? (from gap-assessment.md)** | **Only because it includes Workspace.** Carepatron alone does not fix consumer Gmail or the Sheets database — the Workspace half of Option 1 does. You'd still run the same underlying fixes (AWS, Supabase, attorney) listed below. | **Yes — directly.** Option 2 *is* the #1 must-fix (Workspace migration), so it closes the consumer-Gmail and consumer-Sheets gaps by design, and Drive removes any need to make the website's database PHI-capable. The other fixes below still apply. |

> **What a "BAA" is, in plain English:** a Business Associate Agreement is a signed contract in which a vendor (Google, Carepatron) legally promises to protect health information and take on responsibility for safeguarding it. Consumer/free Gmail has no such contract available — that's exactly why it can't be used for client health details today. Fewer BAAs = fewer contracts and vendors to keep track of, which is why Option 2's "one agreement" is a real simplicity win.

### Both options share the same underlying HIPAA fixes (they are not either/or)

No matter which option you pick, these current-stack fixes from the gap assessment still have to happen — they're independent of the app choice:

- **AWS S3 (where generated PDFs are stored):** accept the free BAA in the AWS console and audit the bucket (block public access, turn on encryption and logging). **$0**, about an hour of work.
- **Supabase (the secondary database mirror):** stop copying health-context fields into it (keep only non-sensitive contact/status fields), because making Supabase itself HIPAA-covered would cost roughly **$600–950+/mo** — not justifiable at your size.
- **Attorney sign-off:** see the checklist at the end.

---

## The Starter-vs-Standard question (reconciled)

The two research files appear to disagree, so here is the plain resolution.

- The **gap assessment** says Google will sign its protective agreement (BAA) on **every paid Workspace plan**, including the cheapest — **Business Starter at $7/user/mo** (annual).
- The **best-of-breed research** conservatively recommends the pricier **Business Standard at $14/user/mo** for two reasons: (a) outside compliance advisors are *split* on whether Starter specifically qualifies in practice, and (b) the free Gemini transcription that makes Option 2 work is bundled at Standard, not Starter.

**Resolution: recommend Business Standard ($14/user/mo), and treat Starter as "possible, but verify."**

- Standard is the **safe** choice because it removes the tier-eligibility debate entirely **and** it's the tier that turns on the Gemini transcription Option 2 depends on. That's why every cost figure above uses Standard.
- Starter ($7/user/mo — half the price) is a legitimate way to cut the email bill **if** two things are true: you confirm the signed BAA directly in the Google Admin console for the Starter plan, **and** you don't need Google's Gemini for transcription (for example, in a Carepatron/Option-1 world, where Carepatron handles transcription and Workspace is only carrying email). Don't assume Starter — verify the BAA on the actual account before relying on it.

Bottom line for the pilot: **sign up for Business Standard.** Revisit Starter later only if you've confirmed its BAA and you're not leaning on Gemini.

---

## 30-day pilot plan

Goal of the pilot: prove the recommended stack (Option 2) works end-to-end on one mock client and one real client *before* you commit and before it touches many people. Concrete tools named below.

### Week 1 — Sign up, sign agreements, configure one test client
- **Sign up for Google Workspace Business Standard** at workspace.google.com. Use a Google promo if offered ("50% off first 3 months" was running — treat as a bonus, budget the regular $14/user/mo).
- **Sign the Google Workspace BAA** inside the Admin console (Account → legal/compliance). This is the single agreement that covers Gmail, Calendar, Drive, Chat, and Gemini.
- **Migrate email** off the consumer account (srhealthconcierge@gmail.com) to the new Workspace mailbox, and move the client-intake spreadsheet into Workspace Drive/Sheets. (This is HIPAA must-fix #1 — you're doing it here.)
- **Sign up for Clockify (Free)** at clockify.me and add each advocate.
- **Set up the "client-code" convention:** in a Drive spreadsheet, map each real client to an opaque code (e.g., "Dorothy Miller" → "DM-014"). Advocates only ever type the *code* into Clockify — no names, addresses, or health details go into the time-clock tool, which is what keeps it out of scope for a BAA.
- **Create one test client** end-to-end: a shared per-client Google Calendar, a client folder in Drive (access limited to the assigned advocate + Pat), and a team space in Google Chat.
- **Do the two option-independent fixes now** while you're in setup mode: accept the **AWS BAA in AWS Artifact** and audit the S3 bucket (block public access, encryption, logging); and confirm health-context fields are **no longer being mirrored to Supabase**.

### Week 2 — Pat + 1 advocate run a mock appointment end-to-end
Using a stand-in "client" (a staff member or willing volunteer), walk the full workflow once, in order:
1. **Clock in** on Clockify against the client *code* (e.g., "DM-014"), task "client visit."
2. **Record + transcribe:** state a verbal consent line ("everyone here consents to this recording") at the start — this is a legal requirement in Florida, see the attorney checklist — then record the mock visit on the phone's voice-memo app. Record in **short segments (under ~10 minutes each)** to fit Gemini's upload limit. Upload the audio files into the test client's Drive folder, open **Gemini** (the Workspace version), and have it transcribe/summarize each file into a Google Doc saved in the same folder.
3. **Upload to portal:** confirm the finished transcript Doc (plus a sample medical-document PDF) sits in the client's Drive folder with the right people able to see it and no one else.
4. **Calendar entry:** create the next "appointment" on the shared per-client calendar and share it with a test "family member" (use a personal Gmail address to simulate a real family member accepting the share). Confirm they can actually see it.
5. **Team chat question:** in the Google Chat team space, post a question about the mock client (using the code, not the name) and confirm the other advocate sees and can reply.
6. **Clock out** and export the time entry to confirm reporting works.

**What you're checking:** does the 10-minute-segment transcription feel workable? Can a family member really see the calendar? Does the Drive folder feel "portal enough" for a client — or is this where a hybrid with Carepatron's portal is worth the extra money? Write down the answers.

### Weeks 3–4 — First real client, feedback, go/no-go
- Onboard **one real, consenting client** through the same flow. Get the recording consent properly (per attorney guidance).
- Collect feedback from the advocate and, gently, from the client/family: was the calendar sharing clear? Did they want a login-style portal?
- **Go/no-go decision:** if the flow held up, roll out to all advocates on Option 2. If the client-portal experience was the weak point, decide on the **hybrid** (add Carepatron for its portal only) rather than abandoning the cheap, working backbone.

### Training checklist per advocate (Option 2)
- [ ] Sign in to the new Google Workspace account (email, Calendar, Drive, Chat, Gemini — all one login).
- [ ] Know the **recording-consent script** and say it at the start of every recording (Florida law — see below).
- [ ] Practice: record a visit in short segments → upload to the client's Drive folder → transcribe with Gemini → save the Doc.
- [ ] Practice: create/share a per-client calendar event with a family member's email.
- [ ] Practice: post and reply in the Google Chat team space.
- [ ] Sign in to **Clockify**; clock in/out using the **client code** only — never a real name or any health detail.
- [ ] Know the rule: client names, addresses, diagnoses, and documents live **only** in Workspace (Drive/Docs), never in Clockify.

---

## What stays in the LSA website/portal vs. moves to the platform

- **Website (no change):** marketing pages, the general inquiry/contact form, and advocate applications. These stay on the current Netlify site. Advocate-application processing (the Apps Script automation, which handles low-sensitivity packets) can keep running — just don't extend it to client medical documents.

- **Platform (everything involving health information):** visit transcripts, medical documents, client-to-advocate messaging, and the shared client/family calendar all move into the chosen platform — Google Workspace (Drive/Docs/Calendar/Chat/Gemini) under Option 2. Client health details should not be typed into or stored on the current website stack.

### Current flows that must CHANGE to close HIPAA gaps (from the gap assessment)

1. **Consumer Gmail → Google Workspace Gmail.** The daily emailing of intake details and signed medical-authorization PDFs through free Gmail is the #1 gap. Fixed by the Workspace migration (must-fix #1).
2. **Consumer Google Sheets (the primary client database) → Workspace Sheets/Drive.** Same consumer-account problem; the migration carries the spreadsheets over into BAA-covered Workspace (must-fix #1).
3. **AWS S3 (stored PDFs) → accept the BAA + audit the bucket.** Free; block public access, turn on encryption and logging (must-fix #2).
4. **Supabase mirror → stop copying health-context fields.** Keep only non-sensitive contact/status fields, or drop the mirror; do not pay ~$600–950+/mo to make Supabase itself HIPAA-covered (must-fix #3).
5. **Website medical intake → move into the platform's forms.** Netlify Functions carry PHI in transit at submit time and there's no BAA at the current plan level, so long-term the website should collect only marketing/basic-contact info; any *medical* detail should be gathered inside the BAA-covered platform (must-fix #4).
6. **Emailing PDF packets to clients as attachments → share via the portal/Drive link instead.** Even with Workspace, an attachment sent to a client's personal inbox is only protected in transit; prefer a Drive link that requires sign-in, and minimize medical detail in anything emailed.

---

## Attorney checklist (surfaced by the research — confirm before going live)

1. **Covered-entity / business-associate status.** LSA works for *families*, not for doctors, so it is most likely **neither** a HIPAA "covered entity" nor a "business associate" — the same reason most private patient-advocacy firms aren't technically HIPAA-regulated. We still recommend running to HIPAA standards as a business choice (your own confidentiality agreement promises it, doctors will treat you as if it applies, and Florida liability is real). **Have the attorney confirm** (a) LSA's non-covered status, and (b) whether any contract with a provider or facility could turn LSA into a "business associate."
2. **Florida all-party recording consent.** Florida is an **all-party (two-party) consent state** — recording a private conversation without everyone's consent is a felony under Fla. Stat. § 934.03. A doctor visit involves the client, the advocate, and clinical staff, all of whom must consent before recording. **Confirm the consent workflow with the attorney** (e.g., a documented verbal or written consent step captured at the start of every recording) before the transcription feature goes live. This applies to *any* transcription tool, in either option.
3. **Business name on legal documents — already fixed.** The rebrand from the earlier "nurse/health"-based names to **Legacy Senior Advocate (LSA)** has already been carried through, resolving the Florida naming concern; no further action needed beyond confirming the current documents all read "Legacy Senior Advocate."

---

*All prices and policies were retrieved 2026-07-23 from the three source files cited at the top. Vendors change terms — re-verify pricing and BAA availability in the Google Admin console and on Carepatron/Clockify before signing anything.*
