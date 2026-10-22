# Portfolio sprint brief (20 minutes, parallel agents). David Hatley.

Static site in ~/Projects/portfolio, deployed to GitHub Pages as-is (no build step). Reviewed live by the Dive Club podcast (Ridd + Tommy Geoco).

## Files (each agent owns ONLY its files)
- index.html, case.html, site.css, site.js -> SITE agent
- content/<group>.json -> one CONTENT agent per group (kitchen, tools, vaasf, anime, diveclub)
- public/media/<slug>/* -> the content agent for that slug (jpg/webp/png <=1600px wide, <400KB each; mp4 h264 <6MB, muted loop)
- studio/* -> STUDIO agent (three.js). studio/dialog.json -> DIALOG agent
- Design system: public/tokens.css, public/components.css, public/fonts/, public/glyphs.js (Secret Sauce; read ~/Projects/secret-sauce/AGENTS.md rules)

## Content schema: content/<group>.json = JSON array of projects
{ "slug": "kebab", "title": "...", "order": 1-99 (lower = earlier on home),
  "glyph": ["X.X.X", ".....", ...] 5 strings of 5 chars (use existing from ~/Projects/secret-sauce/build.py GLYPHS when the project has one; otherwise draw a new, simple, meaningful 5x5),
  "status": "shipped" | "working" | "prototype" | "research" | "concept",
  "status_note": "one honest line about how developed it is",
  "oneliner": "<=12 words, what it is",
  "role": "what David did, in 'I' voice, short",
  "when": "2026-10" or a range,
  "hero": {"src": "public/media/<slug>/hero.jpg", "alt": "..."},
  "media": [{"src": "...", "alt": "...", "caption": "Newsreader-italic caption, one sentence"}],
  "spec": [{"label": "commits", "value": "7", "source": "how it was measured"}],   // REAL numbers only
  "links": [{"label": "...", "url": "https://claude.ai/artifact/..."}],
  "body": ["paragraph strings, short; first = the steaming hot pie (result), then how, then what I learned"] }

## Rules (from the Dive Club portfolio guide, refs/portfolio-guide.md)
- Work first, big, one click. Pie first, process later. Say "I". Skimmable. No eyebrow labels everywhere, no device mockups, no testimonial carousels, no lorem, no "UI/UX".
- Real numbers only, with sources. Label maturity honestly.
- Never publish Ridd/Tommy model weights, data or raw outputs except the curated, labeled synthetic lines in studio/dialog.json.
- Never include private client emails/addresses or personal data of students/faculty.
- Secret Sauce: two inks (cobalt + vermilion) on plaster, vermilion once, no gradients/glows/soft shadows/rounded cards, no Inter, no emoji, signature line exactly "design · AI/ML · generative tools", no job title.
