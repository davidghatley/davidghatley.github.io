#!/bin/sh
# Push the portfolio to GitHub Pages every 3 minutes while agents work, but only when everything validates.
# Stop it with: pkill -f portfolio/autodeploy.sh
cd "$(dirname "$0")"
while true; do
  ok=1
  for f in site.js previews/*/preview.js; do node --check "$f" >/dev/null 2>&1 || { echo "$(date +%T) skip: $f"; ok=0; }; done
  for f in content/*.json previews/*/meta.json; do python3 -m json.tool "$f" >/dev/null 2>&1 || { echo "$(date +%T) skip: $f"; ok=0; }; done
  if [ $ok = 1 ]; then
    ./make_dive.sh >/dev/null 2>&1 && rm -f dive/previews/_harness.html
    git add -A
    if ! git diff --cached --quiet; then
      git -c user.name="David Hatley" -c user.email=davidhatley@me.com commit -qm "Auto-deploy $(date +%H:%M)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && git push -q && echo "$(date +%T) pushed"
    fi
  fi
  sleep 180
done
