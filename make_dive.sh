#!/bin/sh
# Build the review-only copy at /dive for the Dive Club portfolio review (inflight.co/portfolio).
# Copies the site into dive/ and adds the Inflight widget, scoped to /dive, plus noindex to every page head.
# David approved the widget on /dive only (2026-10-22). Public pages never load it.
set -e
cd "$(dirname "$0")"
rm -rf dive && mkdir dive
cp index.html case.html site.css site.js dive/
cp -r content public studio previews dive/
rm -rf dive/studio/refs
python3 -I - <<'PY'
import pathlib
tag = ('<meta name="robots" content="noindex, nofollow">\n'
       '<script src="https://inflight.co/widget.js" data-org="aius9qpt" data-path="/dive" async></script>')
for p in pathlib.Path('dive').rglob('*.html'):
    s = p.read_text()
    if 'inflight.co/widget.js' not in s:
        s = s.replace('<head>', '<head>\n' + tag, 1)
    p.write_text(s)
    print(p, 'inflight.co/widget.js' in s)
PY
