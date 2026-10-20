---
name: Legacy Senior Advocates
description: Warm, readable public pages for seniors and their families.
colors:
  navy: "#0B1D3A"
  navy-light: "#16304F"
  cream: "#F7F5F1"
  white: "#FDFBF8"
  ink: "#1A1E2C"
  muted: "#4A4E5C"
  teal: "#276B6B"
  line: "#D6D8D7"
typography:
  display:
    fontFamily: "Playfair Display, serif"
    fontSize: "clamp(64px, 7vw, 96px)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-.035em"
  headline:
    fontFamily: "Playfair Display, serif"
    fontSize: "clamp(32px, 3.1vw, 44px)"
    fontWeight: 500
    lineHeight: 1.18
    letterSpacing: "-.025em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  control: "6px"
spacing:
  compact: "12px"
  content: "28px"
  wide: "48px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "13px 20px"
  button-primary-hover:
    backgroundColor: "{colors.navy-light}"
  button-outline:
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
---

# Design System: Legacy Senior Advocates

## Overview

The established brand is warm, clear, reassuring, and credible. Spacious public pages support seniors and family caregivers with readable copy, human photography, and direct actions. This document records the approved press implementation; it does not introduce a new visual identity or replace BRAND.md, the canonical brand authority.

**Key Characteristics:**
- Navy framing with warm light surfaces.
- Playfair Display headings and readable Inter body copy.
- Text wordmark on new surfaces, generous controls, and visible keyboard focus.

The extracted tokens above describe press.html. Broader brand decisions remain in BRAND.md; press composition and asset provenance remain in .impeccable/surfaces/press.md.

## Colors

### Primary
Navy frames the header and primary action; navy-light is the action's hover state. Teal supports links and publication attribution.

### Neutral
Warm white is the page surface, cream separates the footer, ink carries body copy, and muted ink carries secondary copy. The line color is reserved for dividers.

**The Readable Color Rule.** Use dark text on light surfaces and warm white on navy. BRAND.md excludes gold and light gray as text; this page does not use gold.

## Typography

Playfair Display supplies display and headline roles; Inter supplies body and controls. The frontmatter records the implemented desktop type ramp. On the press page, introductory text is 20px, returning to the body size on mobile. Article headlines become 34px at the mobile breakpoint; media-contact headings are 30px. Paragraphs are limited to 65ch where implemented.

**The Readable Body Rule.** Body copy stays at least 18px, with line-height at least 1.6 and weight at least 400. Compact wordmark lettering is identity treatment, not a body-copy size precedent.

## Layout

The public-page container is capped at 1320px. Desktop side gutters are 48px, reduced to 28px at 1000px and 24px at 700px. The press article uses two columns (1fr / 1.04fr), becoming one column at 700px with the article copy before the image. Its photograph retains its original aspect ratio. These article composition details are surface-specific, not a requirement for other pages.

## Elevation & Depth

The press page uses flat surfaces, navy framing, and thin dividers, with no shadows. BRAND.md permits soft navy-tinted shadows elsewhere; this page's flat treatment does not revoke that rule.

## Shapes

Controls use gently rounded corners as recorded in the frontmatter. Article content remains an open editorial layout, without a surrounding card. BRAND.md's large-card radius remains applicable where actual cards are used.

## Components

### Primary action
The original-article link uses navy with warm white text, medium-weight Inter, and a minimum height of 48px. Hover changes the background to navy-light and adds an underline. Its directional arrow is inline SVG. On mobile it fills the available width.

### Navigation
The header uses a text wordmark and medium-weight links with minimum 44px targets. Hover and current-page states are underlined. Consultation uses a thin outlined control. At 700px, native details/summary navigation replaces the desktop list. Footer links remain underlined on cream.

### Keyboard focus
Links and menu summaries use a 3px teal outline with 5px offset, changing to warm white in the navy header. The skip link becomes visible on focus.

## Do's and Don'ts

### Do:
- Do preserve BRAND.md as the brand authority.
- Do use readable body copy, visible keyboard focus, and controls at least 44px tall.
- Do retain original photograph proportions and document asset provenance in the surface brief.

### Don't:
- Don't use gold or light gray as text.
- Don't inherit older homepage logo or small-body-type drift into new surfaces.
- Don't promote the press article's composition into a mandatory site-wide layout.
