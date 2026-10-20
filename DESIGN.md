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
  blue: "#3D7AB5"
  blue-lt: "#6BA3D6"
  gold: "#C9A54E"
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
  button-navigation:
    backgroundColor: "{colors.blue}"
    textColor: "#fff"
    rounded: "{rounded.control}"
    padding: "10px 24px"
---

# Design System: Legacy Senior Advocates

## Overview

The established brand is warm, clear, reassuring, and credible. Spacious public pages support seniors and family caregivers with readable copy, human photography, and direct actions. This document records the approved press implementation; it does not introduce a new visual identity or replace BRAND.md, the canonical brand authority.

**Key Characteristics:**
- Navy framing with warm light surfaces.
- Playfair Display headings and readable Inter body copy.
- Existing homepage header and logo on the Press page, readable article controls, and visible keyboard focus.

The extracted tokens above describe press.html. Broader brand decisions remain in BRAND.md, with the user-requested homepage header superseding the earlier custom header direction on this page; press composition and asset provenance remain in .impeccable/surfaces/press.md.

## Colors

### Primary
Navy frames the header and primary action; navy-light is the action's hover state. Teal supports links and publication attribution.

### Neutral
Warm white is the page surface, cream separates the footer, ink carries body copy, and muted ink carries secondary copy. The line color is reserved for dividers.

**The Readable Color Rule.** Use dark text on light surfaces and warm white on navy. BRAND.md excludes gold and light gray as body text. The existing gold-and-white logo and compact homepage navigation colors are retained at the user's explicit request.

## Typography

Playfair Display supplies display and headline roles; Inter supplies body and controls. The frontmatter records the implemented desktop type ramp. On the press page, introductory text is 20px, returning to the body size on mobile. Article headlines become 34px at the mobile breakpoint; media-contact headings are 30px. Paragraphs are limited to 65ch where implemented.

**The Readable Body Rule.** Body copy stays at least 18px, with line-height at least 1.6 and weight at least 400. Lettering within the logo is identity treatment, not a body-copy size precedent.

## Layout

The public-page container is capped at 1320px. Desktop side gutters are 48px, reduced to 28px at 1000px and 24px at 700px. The press article uses two columns (1fr / 1.04fr), becoming one column at 700px with the article copy before the image. Its photograph retains its original aspect ratio. These article composition details are surface-specific, not a requirement for other pages.

## Elevation & Depth

The press content uses flat surfaces and thin dividers. The incumbent fixed header retains its translucent navy background, backdrop blur, and soft shadow when scrolled. BRAND.md permits soft navy-tinted shadows elsewhere; this page's flat treatment does not revoke that rule.

## Shapes

Controls use gently rounded corners as recorded in the frontmatter. Article content remains an open editorial layout, without a surrounding card. BRAND.md's large-card radius remains applicable where actual cards are used.

## Components

### Primary action
The original-article link uses navy with warm white text, medium-weight Inter, and a minimum height of 48px. Hover changes the background to navy-light and adds an underline. Its directional arrow is inline SVG. On mobile it fills the available width.

### Navigation
The Press header reuses the homepage navigation: fixed across the viewport, 80px high at rest and 72px after scrolling 60px, with 60px side padding. Its existing logo is 60px high, reducing to 56px at 1280px. At 1024px the side padding is 32px; at 720px the header is 64px (56px scrolled), with 20px side padding. The inherited logo specificity keeps it 56px high at smaller widths.

The desktop links retain the homepage's 11px medium-weight uppercase Inter, 0.2em tracking, and established color treatments. The consultation link uses the homepage's filled blue style. Navigation collapses to a hamburger at 1160px and opens the same full-screen navy overlay, including Home, all section links, Press, Join Our Team, and consultation. Press carries aria-current. Cross-page section links point to index.html anchors. The button supports keyboard activation, Escape, focus containment, and expanded state. This compact header is a user-requested exception, not a new body-type precedent. Footer links remain underlined on cream.

### Article speakers
The article contains a named roster, with Scott Dobbins identified as moderator and the five panelists presented by name and role. The open list uses three columns on desktop, two below 1000px, and one below 700px; thin dividers separate entries without enclosing cards. Speaker names are 25px Playfair Display; roles retain 18px body type.

### Keyboard focus
Links and buttons use a 3px teal outline with 5px offset, changing to warm white in the navy header and menu. The skip link becomes visible on focus.

## Do's and Don'ts

### Do:
- Do preserve BRAND.md as the brand authority.
- Do use readable body copy, visible keyboard focus, and new content controls at least 44px tall.
- Do retain original photograph proportions and document asset provenance in the surface brief.

### Don't:
- Don't use gold or light gray for new content text; preserve the explicitly approved incumbent header.
- Don't inherit small-body-type drift from older pages. The homepage header is explicitly approved for Press.
- Don't promote the press article's composition into a mandatory site-wide layout.
