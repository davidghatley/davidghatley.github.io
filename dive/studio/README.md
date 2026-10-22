# Dive Club Studio

A static, procedural three.js r170 village and studio. Deploy this directory with the portfolio to GitHub Pages; no build step. For local development, serve the repository over HTTP (`python3 -m http.server 8000`) and open `/studio/`. Opening `index.html` directly as a `file://` URL will not load JSON/modules reliably.

The importmap pins three.js and its addons to jsDelivr. Google Fonts supplies IBM Plex Mono and Nunito, with local font fallbacks. No external models, runtime AI service, analytics, or API keys. Reference images are development references only, never loaded by the scene.

## Controls

- **WASD / arrows:** move relative to the camera.
- **Click / tap ground:** walk there, routing around obstacles. Tap a host to approach and talk.
- **Walk through the blue door:** enter the studio. The front-center garden mat takes you outside. Nearby doors also have an interaction button.
- **E / Enter / tap prompt:** talk to a nearby host or read a nearby exhibit.
- **Continue / E:** reveal a typing line, then advance to the next line. Choose one of the question buttons after the answer.
- **Escape / ×:** close a dialog. Tab stays inside the open dialog.
- **Sound:** toggle the generated speech blips. Audio starts only after a user gesture.
- **Skip to portfolio:** always available, pointing to `../index.html`.

Reduced-motion preferences disable character bobbing, camera smoothing, fades, and letter-by-letter text. The scene uses one directional light and one hemisphere light, capped pixel density, and merged static geometry. WebGL and internet access to the module CDN are required.

## Dialog contract: `dialog.json`

```json
{
  "disclaimer": "Lines are synthetic, from models trained on public episodes, curated by David, not the hosts’ words.",
  "hosts": {
    "ridd": { "name": "Ridd", "greeting": [{ "text": "Welcome!", "expression": "happy" }] },
    "tommy": { "name": "Tommy", "greeting": [{ "text": "Hello!", "expression": "wink" }] }
  },
  "questions": [
    {
      "id": "q1",
      "text": "A question?",
      "answers": {
        "ridd": [{ "text": "An answer.", "expression": "thinking" }],
        "tommy": [{ "text": "Another answer.", "expression": "excited" }]
      }
    }
  ]
}
```

Use 3–4 questions. The UI displays up to four valid questions per host. Greeting and answer arrays support multiple lines. Expressions: `neutral`, `happy`, `wink`, `excited`, `thinking`, `surprised`; unknown expressions use `neutral`. Text is rendered as plain text, never HTML. The custom disclaimer appears on the first host dialog of each visit; the required provenance statement also remains permanently visible in the corner. Bundled fallback content keeps the scene usable if data cannot load. The scene preserves the separately supplied curated dialog. Its built-in fallback is placeholder synthetic copy, not quotations.

## Exhibit contract: `exhibits.json`

```json
[
  {
    "id": "e1",
    "title": "Corpus",
    "body": ["First paragraph.", "Second paragraph."],
    "image": "./images/corpus.png",
    "stat": "Optional highlighted statistic"
  }
]
```

Supply five entries in display order: Corpus; Transcribe + diarize; Persona LLMs; System One; Results. Each needs `id`, `title`, and a `body` array of strings. `image` and `stat` are optional. Image paths resolve relative to `/studio/`; HTTP(S) URLs also work. Missing images are hidden without interrupting the exhibit. Body and statistics appear in the reading dialog, and titles appear on the wall. Keep titles concise. The separately supplied exhibit data is preserved. The built-in fallback entries are clearly marked placeholders and contain no invented performance metrics.

## Checks

Run `node --check studio/studio.js` from the repository root. Browser smoke testing should cover entering/exiting, both host conversations, each exhibit, sound toggling, mobile taps, and reduced motion.
