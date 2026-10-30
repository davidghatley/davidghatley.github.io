#!/bin/sh
# Build the review-only copy at /review (portfolio reviews with the Inflight feedback widget, inflight.co/portfolio).
# Runs build.py first (static index, case/<slug>/ share pages, sitemap), then copies the site into review/ and adds
# the Inflight widget, scoped to /review, plus noindex to every page head (index, case.html, case/*/, fonts/**).
# The case/<slug>/ pages use <base href="../../">, so inside review/ they resolve to review/ with no rewriting.
# David approved the widget on the review copy only (2026-10-22). Public pages never load it.
# The copy lived at /dive until 2026-10-28; dive/index.html stays as a redirect so the link already submitted keeps working.
set -e
cd "$(dirname "$0")"
python3 -I build.py
rm -rf review && mkdir review
cp index.html case.html site.css site.js drawing.js drawing.css review/
cp -r content public previews fonts case lab review/
rm -f review/previews/_harness.html
python3 -I - <<'PY'
import pathlib
tag = ('<meta name="robots" content="noindex, nofollow">\n'
       '<script src="https://inflight.co/widget.js" data-org="aius9qpt" data-path="/review" async></script>')
for p in sorted(pathlib.Path('review').rglob('*.html')):
    s = p.read_text()
    if 'inflight.co/widget.js' not in s:
        s = s.replace('<head>', '<head>\n' + tag, 1)
    p.write_text(s)
    print(p, 'inflight.co/widget.js' in s)
PY
# the old /dive/ address: one redirect page, kept out of search
rm -rf dive && mkdir dive
cat > dive/index.html <<'HTML'
<!doctype html>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<title>Moved to /review/</title>
<link rel="canonical" href="../review/">
<meta http-equiv="refresh" content="0; url=../review/">
<script>location.replace('../review/' + location.search + location.hash)</script>
<p>This copy moved to <a href="../review/">/review/</a>.</p>
HTML
