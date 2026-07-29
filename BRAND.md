# Legacy Senior Advocates — Brand & Design System

**This file is the source of truth for LSA's brand.** Paste the block below into
Claude Design (as the first message, or as project context) so every screen it
builds is on-brand. Also usable as reference for Claude Code sessions.

> Note on the live site: the tokens here are canonical and already include the
> accessibility fixes for our senior audience (18px body, no light font weights,
> gold/light-gray excluded as text). The live site's inline CSS predates some of
> these, so when they differ, **this file wins.**

---

## Paste-ready brief for Claude Design

```
Design everything to this brand system. Legacy Senior Advocates (LSA) helps seniors
and their adult children navigate care, benefits, and life decisions with a trusted
human advocate.

AUDIENCE: Seniors 65+ and their adult children/caregivers. Design for aging eyes and
low tech-confidence. Accessibility is not optional.

VOICE: Warm, clear, reassuring, credible. Plain language. No jargon, no hype.

TWO MODES (one brand, two densities):
- Public pages = spacious, warm, image-forward, ONE primary action per screen.
- Staff portal = compact, data-dense, fast, utilitarian.

COLORS
- Navy #0B1D3A — primary: headers, buttons, footer (white text on it)
- Blue #3D7AB5 — links/actions (bold or large sizes only)
- Teal #276B6B — secondary accent, text-safe
- Gold #C9A54E — ACCENT ONLY: hairlines, rules, small marks. NEVER use as text.
- Ink #1A1E2C — body text
- Ink-mid #4A4E5C — secondary/"muted" text (do NOT use light gray for text)
- Cream #F7F5F1 — section backgrounds
- Warm white #FDFBF8 — page background
Supporting tints: navy #0F2444/#16304F, blue #6BA3D6/#A8CCE8/#E8F1F8,
gold #D4B76A/#F5EDDA, teal #E4F0F0.

TYPOGRAPHY
- Headings: Playfair Display (serif), weights 400-600
- Body/UI: Inter (sans), MINIMUM weight 400, prefer 500. Never light/thin.
- Body size minimum 18px. Line-height 1.6+.

SHAPE: border-radius 6px (12px for large cards). Soft navy-tinted shadows. No neon glow.

ACCESSIBILITY (non-negotiable):
- Body text 18px minimum. Contrast AA minimum, AAA for body copy.
- Tap/click targets 44px minimum.
- Never use gold or light gray as text.

DON'T:
- No clinical imagery (stethoscopes, scrubs, crosses, hospital scenes).
- Never use the words "nurse" or "health" in the brand name (Florida policy).
- No em dashes in customer-facing copy. Use commas or full stops.
- Not clinical, not salesy. Human, calm, trustworthy.
```

---

## References

- **Public site (source of brand tokens):** repo `ssuhar3/nurse-health-concierge`
  · live URL: https://inquisitive-gumdrop-453bf4.netlify.app/
- **Staff portal:** repo `ssuhar3/nhc-portal` · live: https://lsa-portal.vercel.app
- Fonts loaded via Google Fonts: Playfair Display + Inter.

> How Claude Design uses the URL: the design agent builds from the context you
> paste, not by browsing the live site, so the URL is a human reference and
> directional cue rather than a token source. The COLORS/TYPOGRAPHY sections above
> are what actually steer it. Keep them as the source of truth.
