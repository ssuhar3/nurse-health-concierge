# LSA Current-Stack HIPAA Gap Assessment (2026-07-23)

**Audience:** Pat / LSA leadership (non-technical). **Purpose:** before choosing advocate/client apps, know where today's systems fall short of HIPAA-grade handling of client health information, and what each fix costs. This list feeds the app recommendation (docs/app-eval/recommendation.md) — whatever we pick should close these gaps, not add new ones.

## Does HIPAA even apply to LSA? (confirm with attorney)

Probably not directly — and that's worth understanding. HIPAA binds "covered entities" (doctors, hospitals, insurers) and their "business associates" (companies handling health data *for* covered entities). LSA works for **families**, not for doctors, so LSA is most likely **neither** — the same reason most private patient-advocacy firms aren't technically HIPAA-regulated.

**But this doesn't mean we can be careless**, for three reasons:

1. **Our own paperwork promises it.** The advocate confidentiality agreement LSA has advocates sign already commits to HIPAA-grade protection of client information.
2. **Doctors will treat us as if it applies.** Providers release information to advocates via HIPAA authorizations; behaving to HIPAA standards keeps those doors open.
3. **Florida law and general liability.** Mishandling seniors' medical details is a lawsuit and reputation risk regardless of HIPAA's technical reach.

**Working policy: run LSA to HIPAA standards as a business choice.** Have the attorney confirm (a) LSA's non-covered status and (b) whether any contract with a provider or facility could make LSA a business associate.

## Component-by-component assessment

| Component | Health info exposure today | BAA status | Fix options + cost |
|---|---|---|---|
| **Consumer Gmail** (srhealthconcierge@gmail.com) | Client intake details and signed medical-authorization PDFs are emailed through it daily | ❌ Google offers **no BAA on free consumer Gmail** — it cannot be used for PHI ([HIPAA Journal](https://www.hipaajournal.com/is-google-workspace-hipaa-compliant/), retrieved 2026-07-23) | Move to **Google Workspace** — Google signs its BAA on **all paid plans**, including Business Starter at **$7/user/mo** (annual) or $8.40 monthly; Business Standard $14/$16.80 ([Google's own HIPAA BAA terms](https://workspace.google.com/terms/2015/1/hipaa_baa/); [HIPAA Journal](https://www.hipaajournal.com/is-google-workspace-hipaa-compliant/); [Name.com pricing guide](https://www.name.com/blog/google-workspace-pricing), retrieved 2026-07-23). BAA covers Gmail, Drive, Docs/Sheets, Calendar, Meet, Chat, Forms ([Accountable HQ](https://www.accountablehq.com/post/is-google-workspace-hipaa-compliant-baa-covered-apps-and-setup-steps), retrieved 2026-07-23) |
| **Google Sheets** (same consumer account) | All client intake rows, including health context — this is the PRIMARY database | ❌ Same consumer-account problem | Same fix: the Workspace BAA covers Sheets/Drive. Migrating the account also carries the existing spreadsheets over |
| **Google Apps Script + Drive** (auto-processes returned application packets) | Signed advocate packets (incl. background-check info) | ⚠️ Drive AND Apps Script are both on Google's "HIPAA Included Functionality" list, so a Workspace BAA covers this automation (see docs/app-eval/best-of-breed.md, Section 1) — but only after migrating off the consumer account | After Workspace migration the automation is BAA-covered. As a policy choice, still keep it to advocate-application packets (low health-info content) and don't extend it to client medical documents |
| **AWS S3** (stores generated agreement PDFs) | Client agreement packets containing medical authorizations | ⚠️ AWS signs BAAs **free, self-service** via AWS Artifact in the console; S3 is HIPAA-eligible ([AWS HIPAA compliance](https://aws.amazon.com/compliance/hipaa-compliance/); [Accountable HQ](https://www.accountablehq.com/post/how-to-get-a-baa-with-aws-steps-requirements-and-covered-hipaa-services), retrieved 2026-07-23) — but nobody has accepted it for this account yet, and the bucket config is unaudited | **$0**: accept the BAA in AWS Artifact, then audit the bucket: block public access, enable encryption (SSE-KMS recommended), enable access logging ([Patient Protect](https://patient-protect.com/post/is-aws-hipaa-compliant), retrieved 2026-07-23) |
| **Supabase** (secondary database, project rtulqglpbfeocbfskczu) | Mirror of client intake data | ❌ HIPAA requires the **Team plan ($599/mo) plus a paid HIPAA add-on** (reported ~$350/mo, custom-quoted); not available on Free/Pro ([Supabase discussion](https://github.com/orgs/supabase/discussions/35594); [MetaCTO pricing analysis](https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance), retrieved 2026-07-23) | ~$950+/mo is not justifiable at LSA's size. **Fix: stop mirroring health-context fields to Supabase** (keep only non-sensitive contact/status fields), or drop the mirror entirely. Decide in the app recommendation |
| **Netlify Functions** (form handling — PHI passes through at submit time, isn't stored) | Transit-only exposure | ⚠️ Netlify offers a HIPAA-compliant offering with BAA **only on Enterprise contracts** ([Netlify announcement](https://www.netlify.com/blog/netlify-launches-a-hipaa-compliant-service-offering/), retrieved 2026-07-23) — not on the current plan | Transit-only is a modest short-term risk. Long-term fix: intake of *medical* details should happen inside the chosen HIPAA platform's own forms; the website keeps only marketing + basic contact forms |
| **Email delivery of PDFs to clients** | Agreement packets emailed as attachments to clients' personal inboxes | ⚠️ Even with Workspace, email to a client's consumer inbox is only protected in transit | Prefer sharing via the chosen platform's portal (or Drive links with sign-in) over attachments; acceptable interim: keep attachments but minimize medical detail in them |

## Must-fix list (priority order)

1. **Google Workspace migration** (~$7-14/user/mo) — replaces consumer Gmail + Sheets, the two biggest gaps, with BAA-covered equivalents. Do this regardless of which app platform wins; it also gives shared calendars and Drive.
2. **AWS BAA + S3 audit** ($0, ~an hour of work) — accept the BAA in AWS Artifact; block public access, enable encryption and logging on the PDF bucket.
3. **Stop mirroring health data to Supabase** (code change in the form handlers) — or budget ~$950+/mo ($599 Team plan + custom-quoted HIPAA add-on, reported ~$350/mo — exact figure requires a Supabase quote), which we recommend against. Final call belongs in the app recommendation.
4. **Move future PHI-heavy workflows (visit transcripts, medical docs) into whatever BAA-covered platform is chosen** — never onto the current website stack (see the **Netlify Functions** row above: no BAA at our plan level, so the site's forms must not take in medical detail long-term). The website stays for marketing, inquiries, and advocate applications.
5. **Attorney confirmation** — LSA's covered-entity/business-associate status, plus Florida two-party recording consent for visit transcription (client + provider consent workflow).

*All prices and policies retrieved 2026-07-23; vendors change terms — re-verify before purchase.*
