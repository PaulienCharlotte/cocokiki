---
name: cocokiki-natural-game-style
description: Apply CocoKiki's muted natural visual language when creating or changing CocoKiki game screens, controls, illustrated worlds, characters, and reusable UI components. Use only for CocoKiki product design and implementation.
---

# CocoKiki Natural Game Style

Keep CocoKiki playful and child-friendly without using loud primary colors.

## Color Direction

- Build a balanced natural palette from moss, fern, eucalyptus, muted berry, clay, soft ochre, water blue-green and broken white.
- Lower saturation before adding more colors. Preserve clear contrast for text, focus, answers and status.
- Use color by meaning: moss for primary actions and success, muted berry for identity and emphasis, ochre for rewards, clay for gentle errors, blue-green for water and calm space.
- Avoid pure red, blue, green or yellow; neon accents; large bright-white panels; and interfaces dominated by one hue.
- Keep shared surfaces warm and subdued: broken white rather than white, charcoal-plum rather than black.

## Components

- Use broken-white surfaces (`#fbfaf6`) and soft secondary surfaces (`#f2f3ec`) instead of pure white.
- Use one-pixel neutral borders and soft diffuse shadows. Avoid heavy outlines, hard offset shadows and stacked frames.
- Keep component corners at 8px or less. Circular controls are reserved for icon-only actions, avatars and game portals.
- Use familiar icons with concise Dutch labels. Keep touch targets at least 44 CSS pixels.
- Reserve strong contrast for the current answer, primary action and essential status. Secondary controls should recede.
- Keep cards at 8px radius or less and avoid cards nested inside cards.

## Dialogs And Menus

- Center task-blocking dialogs in the available game viewport on desktop, tablet and mobile.
- Keep at least 16px viewport clearance and allow internal scrolling when content is taller than the viewport.
- Use a maximum content width around 440-500px and padding of 30px on desktop or 18-22px on mobile.
- Give each dialog one visually dominant primary action. Secondary actions use a quiet light surface.
- Align headings, explanatory copy, controls and actions on a consistent spacing rhythm; do not let controls touch labels.
- Menus anchored to a control may remain attached to that control, but must use the same surface, border and shadow tokens as dialogs.
- HUDs and answer panels may use a lightly translucent surface over illustrated game worlds, with enough opacity to preserve text contrast.

## Shared Tokens

- Ink: charcoal-plum `#302b3b`.
- Muted text: `#706a78`.
- Primary surface: `#fbfaf6`.
- Secondary surface: `#f2f3ec`.
- Surface line: `#d8d5ce`.
- Moss action: approximately `#64725c` to `#69775f`.
- Muted berry emphasis: approximately `#674c5b` to `#735263`.
- Standard elevated shadow: soft and diffuse, approximately `0 18px 50px rgba(36, 55, 45, 0.18)`.

## Game Worlds

- Create depth with several coherent layers: distant silhouettes, trunks or terrain, midground bushes, foreground plants and small ambient details.
- Vary silhouettes, scale and movement. Do not fill space with repeated identical shapes.
- Use animation gently: breathing, leaf sway, water movement, dust and particles. Respect reduced-motion settings.
- Characters and obstacles must remain readable against the background at mobile size.

## Review

Before finishing, inspect desktop and a 375px portrait viewport. Check that panels match the world, dialogs are centered within safe viewport margins, text remains legible, controls do not overlap, and no single bright primary color visually dominates.
