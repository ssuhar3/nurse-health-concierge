# Legacy Senior Advocates marketing website

Read AGENTS.md and BRAND.md before changes. This file describes the current source; it does not confirm a production deployment.

## Architecture

The public marketing website uses plain HTML, inline CSS and JavaScript, and local images. There is no build step. Mocked tests use the built-in Node.js test runner. Netlify publishes the repository root and runs CommonJS functions from netlify/functions.

- index.html contains the marketing content and a contact request form accepting name, email, and a fixed topic only. It does not accept an open-ended message or medical details.
- Consultation links open https://lsa-portal.vercel.app/intake?kind=inquiry.
- Client onboarding opens https://lsa-portal.vercel.app/intake?kind=onboarding.
- client-inquiry.html and client-onboarding.html are static handoff pages with no form fields or analytics. Netlify forces temporary 302 redirects for both extensionless and .html paths to the corresponding portal form.
- privacy.html and terms.html remain static policy pages.
- The retired advocate application and dashboard paths redirect to the portal's /apply and /login pages.

## Form handling

The portal owns secure medical intake. The new intake flow stores submitted intake in the portal's separate Neon database and provides an authenticated staff intake queue at /dashboard?tab=intake. This is separate from the older Supabase inquiry/onboarding pipeline. Do not assume a new intake submission appears in that old pipeline.

The marketing site's submit-inquiry and submit-onboarding functions are retired. They return HTTP 410 and a fixed portal link without parsing, forwarding, storing, emailing, or logging submitted payloads. Stale browser forms must be filled out again on the portal; never forward their medical answers through a redirect or query string.

submit-contact remains active and emails administrative contact requests only. utils/public-form.js checks an allowlist, scalar strings, length limits, and fixed topics before any side effects. Unknown fields, including old free-text messages and clinical fields, are rejected. Errors use fixed messages rather than logging submitted data or upstream response bodies.

Legacy PDF, Drive, S3, and Supabase helpers remain in the repository but are not invoked by the retired intake endpoints. The Supabase insert helper now throws a generic error on unsuccessful writes rather than silently claiming success. No historical records, PDFs, emails, or archives are changed by this source update.

## Local checks

- npm run dev starts Netlify Dev on port 8889, including functions.
- npm run serve starts static-only serving on port 8889.
- npm test runs the mocked handler and persistence tests without live submissions. Test source paths are protected by a forced 404 redirect.
- Use node --check for changed function files.
- Static handoff links lead to the production portal; do not submit test medical information there.

## Release order

This source change is not a deployment. Release the coordinated changes in this order:

1. Apply the portal's Neon migration 0025 for secure intake.
2. Deploy the portal implementation and verify the intake page/API and authenticated staff queue.
3. Deploy this marketing-site handoff and verify the redirects and retired endpoints.

Pushes to main deploy directly to production. Use feature branches and PRs. All configured data services must be treated as production. Do not deploy the website handoff before the portal destination and its migration are ready.

## Rules

- PHI belongs in the BAA-covered Neon database, never Supabase, logs, email, or marketing-site archives.
- Never send SMS to clients or families.
- Follow BRAND.md: senior accessibility, wordmark-only logo, and no em dashes in customer-facing copy.
- publish = "." serves the repository root. Preserve forced 404 protections for internal source and documents, including AGENTS.md. Keep test fixtures and internal artifacts outside the public root or explicitly protect them.
- Explain changes plainly, keep changes testable, and flag anything affecting form delivery.
