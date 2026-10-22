# Project preview contract (v2 home: an expanding index + custom previews)

The home page is an index list. Each row is: glyph (5x5, from content JSON) · a colour chip · title · oneliner · status.
Hovering a row (desktop) or tapping it (touch) expands it in place and mounts that project's custom preview.
Clicking the title (or "Open case study") goes to case.html?p=<slug> with a cross-document View Transition;
the case page mounts the same preview in "hero" mode at the top.

## Each project agent owns ONLY
- previews/<slug>/preview.js
- previews/<slug>/meta.json
- public/media/<slug>/ (add files; don't delete files that content/*.json references)

Never edit content/*.json, index.html, case.html, site.css, site.js or other projects' folders.

## previews/<slug>/meta.json
{ "accent": "#hex",        // the project's own colour on the shared plaster base; must pass 3:1 against #eeede7 and against #121417, or give both:
  "accent_dark": "#hex",   // optional dark-theme variant
  "on_accent": "#hex",     // text colour on a filled accent chip (ink #16181d or sheet #f9f9f5), 4.5:1
  "label": "2-4 words that name the visual, e.g. 'previz → final'" }
Pick the accent from the project's identity (~/Projects/secret-sauce/projects/<name>.json inks, the bonfire fire palette, VAASF's steel blue #587187, and so on). No violet or magenta, and no gradients.

## previews/<slug>/preview.js (ES module, no build, no external deps except three.js from
## https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js if truly needed)
export default function mount(root, { mode, base }) { ...; return () => { /* cleanup: stop loops, remove listeners */ } }
- mode: "row" (inside the expanded index row: full row width up to ~1100px; aim for 360-520px tall) or "hero" (case page top: up to 1200px wide, up to 80vh).
- base: URL prefix for assets (e.g. "./" or "../"). Build every asset URL as base + "public/media/<slug>/...".
- Build DOM inside root only. Scope any CSS by injecting one <style> tag with selectors prefixed `.pv-<slug>`, and remove it on cleanup.
- IMAGES ARE NEVER CROPPED: use object-fit: contain or natural aspect ratio. Show each asset at a size where it reads.
- Custom per project. Design a visual that fits what the project IS (a before/after slider, a looping GIF strip, a mini interactive demo, an animated diagram, a contact sheet, a page-flip, a terminal replay...). Never a generic carousel.
- Motion: loops are fine but respect prefers-reduced-motion (show a still). Pause when not mounted. No autoplay sound.
- Light and dark: read CSS vars from the page (--paper, --sheet, --ink, --ink-muted, --rule, --cobalt, --vermilion) plus your accent.
- Budget: preview.js under 25KB; media per project under 6MB total. GIFs: max 900px wide, at most 12fps, under 3MB each (ffmpeg palettegen/paletteuse). Prefer real outputs over made-up ones.
- Secret Sauce rules still apply: no gradients, glows, soft shadows, rounded cards or images, emoji, Inter. Type via var(--font-sans) / var(--font-mono) / var(--font-serif) / var(--font-pixel).

## Test harness
previews/_harness.html?slug=<slug>&mode=row|hero mounts one preview standalone (the shell agent writes it first;
until then, make your own temporary test page in previews/<slug>/test.html and delete it at the end).
Server: python3 -m http.server 8791 in ~/Projects/portfolio (probably already running).
Screenshot: chromium --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --screenshot=OUT --window-size=1280,900 URL
