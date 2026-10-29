"""The home page's instrument panel: five projects as small working instruments, rendered at build time.

build.py calls render() and writes the result between the <!-- build:work --> markers in index.html. Every tile is
one link to its case page and is drawn in its finished state (the payoff), so the panel is complete with no JS,
under reduced motion and for crawlers. site.js only adds motion: the clip plays, the run log scans, the token bar
packs, the cover plate draws itself, the specimen cycles faces and the schedule rows find their place on the page.

Data, all read here and nowhere else:
  content/panel.json             the tiles: order, result lines, the lmr packing example, the vaasf schedule rows
  content/runlog.json            aggregates of the anime pipeline run log (runlog_json(); the log itself is never copied)
  public/media/tasty_tunez/songs.json   pitch and loudness per song, for the cover plates
  fonts/files/families.json      the font library, for the specimen
  previews/<slug>/meta.json      accent, accent_dark, font_display, font_weight
"""
import html
import json
import collections
import datetime

VRAM_TOTAL = 12288   # MiB on the RTX 3060 12 GB (BRIEF.md: peak 11,868 of 12,288 MiB)
NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
ARROW = ['...X...', '....X..', '.....X.', 'XXXXXXX', '.....X.', '....X..', '...X...']


def esc(s):
    return html.escape(str(s if s is not None else ''), quote=True)


def n(v):
    return '{:,}'.format(v)


# ---------- the run log: aggregates only ----------
def runlog_json(log, out):
    """Aggregate ~/anime-pipeline/logs/runs.jsonl (read-only) into per-day counts and totals. When the log is not
    on this machine, keep the last aggregates as they are."""
    if not log.exists():
        return out.read_text() if out.exists() else '{}\n'
    rs = [json.loads(l) for l in log.read_text().splitlines() if l.strip()]
    days, peak = collections.Counter(), collections.defaultdict(int)
    for r in rs:
        d = r['time'][:10]; days[d] += 1; peak[d] = max(peak[d], r.get('peak_vram_mib') or 0)
    d0 = datetime.date.fromisoformat(min(days)); d1 = datetime.date.fromisoformat(max(days))
    span = [(d0 + datetime.timedelta(k)).isoformat() for k in range((d1 - d0).days + 1)]
    oom = sum(1 for r in rs if any('out of memory' in str(e).lower() for e in (r.get('errors') or [])))
    o = {
        'source': 'anime-pipeline/logs/runs.jsonl, aggregated by build.py (panel.py runlog_json)',
        'runs': len(rs),
        'succeeded': sum(1 for r in rs if r.get('status') == 'success'),
        'cuda_oom': oom,
        'gpu_hours': round(sum(r.get('seconds') or 0 for r in rs) / 3600, 1),
        'peak_vram_mib': max(r.get('peak_vram_mib') or 0 for r in rs),
        'vram_total_mib': VRAM_TOTAL,
        'first': span[0], 'last': span[-1],
        'days': [{'d': d, 'runs': days.get(d, 0), 'peak_mib': peak.get(d, 0)} for d in span],
    }
    return json.dumps(o, indent=1) + '\n'


# ---------- small drawing helpers ----------
def glyph(rows, cls='glyph'):
    out, i = [], 0
    for y, r in enumerate(rows or []):
        for x, c in enumerate(r[:5]):
            if c == 'X':
                out.append('<rect x="%d" y="%d" width="1" height="1" style="--i:%d"/>' % (x, y, i)); i += 1
    return ('<svg class="%s" viewBox="0 0 5 5" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">%s</svg>'
            % (cls, ''.join(out)))


def parrow():
    rs = ''.join('<rect x="%d" y="%d" width="1" height="1"/>' % (x, y) for y, r in enumerate(ARROW) for x, c in enumerate(r) if c == 'X')
    return '<svg class="parrow" viewBox="0 0 7 7" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">%s</svg>' % rs


def name_html(t, faces=None):
    """The tile name: real text for assistive tech, one aria-hidden span per character for the stepped swap."""
    chs = []
    for k, c in enumerate(t):
        st = ' style="--f:&quot;%s&quot;"' % esc(faces[k % len(faces)]) if faces and c != ' ' else ''
        chs.append('<span class="ch"%s>%s</span>' % (st, esc(c)))
    return '<span class="tt" aria-hidden="true">%s</span>' % ''.join(chs)


def style_vars(m):
    v = []
    if m.get('accent'): v.append('--acc-l:%s' % m['accent'])
    if m.get('accent_dark'): v.append('--acc-d:%s' % m['accent_dark'])
    if m.get('font_display'): v.append('--font-title:%s' % m['font_display'])
    if m.get('font_weight'): v.append('--to-w:%s' % m['font_weight'])
    return esc(';'.join(v))


# ---------- tasty_tunez: the cover plate, from the song's own pitch and loudness (port of the preview's prep) ----------
def plate(s, cols=26):
    dig = lambda t: [(int(c) + 0.5) / 10 for c in t]
    def bin_(row):
        out = []
        for i in range(cols):
            a = (i * len(row)) // cols; b = max(a + 1, ((i + 1) * len(row)) // cols)
            out.append(max(row[a:b]))
        return out
    chroma = [bin_(dig(r)) for r in s['chroma']]; energy = bin_(dig(s['energy'])); pe = max(energy)
    top = [[p for _, p in sorted([(chroma[p][c], p) for p in range(12)], key=lambda x: -x[0])[:3]] for c in range(cols)]
    peak, pv = (0, 0), -1
    for c in range(cols):
        if energy[c] / pe <= 0.15: continue
        for p in top[c]:
            v = chroma[p][c] * energy[c] / pe
            if v > pv: pv, peak = v, (c, p)
    C, D = 8, 6   # cell and dot, in viewBox units
    W, gy, ly = cols * C, 0, 12 * C + 6
    H = ly + 6 * 4
    dots, cols_g = [], []
    for c in range(cols):
        live = energy[c] / pe > 0.15
        on = []
        for j in range(12):
            p = 11 - j; x, y = c * C, gy + j * C
            if live and p in top[c]:
                cls = ' class="pk"' if (c, p) == peak else ''
                on.append('<rect%s x="%d" y="%d" width="%d" height="%d"/>' % (cls, x, y, D, D))
            else:
                dots.append('<rect x="%d" y="%d" width="2" height="2"/>' % (x + 2, y + 2))
        k = max(1, round(energy[c] / pe * 6))
        on += ['<rect class="ld" x="%d" y="%d" width="%d" height="3"/>' % (c * C, ly + (5 - q) * 4, D) for q in range(k)]
        cols_g.append('<g style="--i:%d">%s</g>' % (c, ''.join(on)))
    mm = lambda v: '%d:%02d' % (v // 60, v % 60)
    pk_t = mm(int((peak[0] + 0.5) / cols * s['duration']))
    svg = ('<svg class="tz-plate" viewBox="0 -2 %d %d" shape-rendering="crispEdges" aria-hidden="true">'
           '<g class="off">%s</g><g class="on">%s</g></svg>' % (W, H + 2, ''.join(dots), ''.join(cols_g)))
    return svg, NOTES[peak[1]], pk_t


# ---------- tiles ----------
def head(p, t, k, faces=None):
    return ('<div class="t-head">%s<h3 class="t-name"><span class="sr-only">%s</span>%s</h3><span class="t-n">%02d</span></div>'
            % (glyph(p.get('glyph')), esc(t.get('label') or t['name']), name_html(t['name'], faces), k))


def res(t):
    return '<p class="t-res"%s>%s</p>' % (' data-draft="true"' if t.get('draft') else '', esc(t['result']))


def anime_body(t, R):
    days, mx = R['days'], max(d['runs'] for d in R['days'])
    cells, i = [], 0
    for k, d in enumerate(days):
        h = 0 if not d['runs'] else max(1, -(-d['runs'] * 10 // mx))   # ceil to 10 cells
        x = k * 10
        if not h:
            cells.append('<rect class="z" x="%d" y="39" width="8" height="1"/>' % x)
        for q in range(h):
            cells.append('<rect x="%d" y="%d" width="8" height="3" style="--i:%d"/>' % (x, 36 - q * 4, k + q)); i += 1
    spark = ('<svg class="ro-spark" viewBox="0 0 %d 40" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">'
             '<rect class="scan" x="%d" y="0" width="8" height="40"/>%s</svg>' % (len(days) * 10 - 2, 10 * max(range(len(days)), key=lambda k: days[k]['runs']), ''.join(cells)))
    total, peak = R['vram_total_mib'], R['peak_vram_mib']
    NC = 48; fill = int(peak / total * NC)
    vr = ''.join('<rect%s x="%d" y="0" width="3" height="8" style="--i:%d"/>' % ('' if q < fill else ' class="e"', q * 4, q) for q in range(NC))
    vram = ('<svg class="ro-vram" viewBox="0 -2 %d 12" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">%s'
            '<rect class="ceil" x="%d" y="-2" width="1" height="12"/></svg>' % (NC * 4, vr, NC * 4 - 1))
    d0 = datetime.date.fromisoformat(R['first']); d1 = datetime.date.fromisoformat(R['last'])
    top = max(days, key=lambda d: d['runs'])
    dd = esc(json.dumps([[datetime.date.fromisoformat(d['d']).strftime('%b %-d').upper(), d['runs'], d['peak_mib']] for d in days]))
    return (
        '<div class="t-body an">'
        '<figure class="an-vid"><div class="an-frame" data-src="%s"><img src="%s" width="1152" height="658" alt="%s" fetchpriority="high" decoding="async"></div>'
        '<figcaption class="t-cap">%s</figcaption></figure>'
        '<div class="an-ro" data-days="%s">'
        '<p class="ro-k"><span>run log</span><span>%s–%s, %s</span></p>'
        '<p class="ro-big"><b data-count="%d">%s</b><span>runs on one 12 GB GPU</span></p>'
        '%s'
        '<p class="ro-axis"><span>%s</span><span class="ro-scanl">%s · %s runs · peak %s MiB</span><span>%s</span></p>'
        '<dl class="ro-cells"><div><dt>succeeded</dt><dd data-count="%d">%s</dd></div><div><dt>CUDA OOM</dt><dd>%d</dd></div><div><dt>GPU hours</dt><dd>%s</dd></div></dl>'
        '<p class="ro-k ro-vk"><span>peak VRAM</span><span><b>%s</b> / %s MiB</span></p>%s'
        '</div></div>'
    ) % (esc(t['video']), esc(t['poster']), esc(t['alt']), esc(t['caption']), dd,
         d0.strftime('%b %-d'), d1.strftime('%-d'), d1.year, R['runs'], n(R['runs']), spark,
         d0.strftime('%b %-d').upper(), datetime.date.fromisoformat(top['d']).strftime('%b %-d').upper(), n(top['runs']), n(top['peak_mib']), d1.strftime('%b %-d').upper(),
         R['succeeded'], n(R['succeeded']), R['cuda_oom'], R['gpu_hours'],
         n(peak), n(total), vram)


def lmr_body(t):
    B, used, segs = t['budget'], 0, []
    for k, tok in enumerate(t['packed']):
        segs.append('<i class="seg" style="left:%.1f%%;width:%.1f%%;--i:%d"><span>%s</span></i>' % (used / B * 100, tok / B * 100, k, tok if tok > 150 else ''))
        used += tok
    return (
        '<div class="t-body lm">'
        '<p class="lm-q">“%s”</p>'
        '<div class="lm-pack"><span class="lm-nofit">next ~280 tok: no fit</span><div class="lm-bar">%s</div>'
        '<p class="lm-scale"><span>0</span><span>%s used, %d left</span><span>%s tokens</span></p></div>'
        '<div class="lm-stats"><p><b>70 / 73</b><span>needed paragraphs search found</span></p><p><b>54 / 73</b><span>reach the model</span></p></div>'
        '</div>'
    ) % (esc(t['question']), ''.join(segs), n(used), B - used, n(B))


def tasty_body(songs):
    plates = []
    mm = lambda v: '%d:%02d' % (v // 60, v % 60)
    for k, s in enumerate(songs):
        svg, pn, pt = plate(s)
        ro = [('tempo', '%d BPM' % round(s['bpm'])), ('key', s['key'].upper()), ('model', s['model']), ('peak', '%s · %s' % (pn, pt)), ('length', mm(int(s['duration'])))]
        plates.append(
            '<div class="tz-song"%s data-i="%d"><p class="tz-top"><b class="tz-title">%s</b><span class="ro-k"><span>song <b>%d</b> / %d</span></span></p>%s<div class="tz-side">'
            '<dl class="tz-ro">%s</dl></div></div>'
            % ('' if k == 0 else ' hidden', k, esc(s['title']), k + 1, len(songs), svg,
               ''.join('<div><dt>%s</dt><dd>%s</dd></div>' % (esc(a), esc(b)) for a, b in ro)))
    return '<div class="t-body tz"><div class="tz-stack">%s</div></div>' % ''.join(plates)


def ty_row(k, f, on=False):
    px = ' is-px' if f.get('grid') or 'Pixel' in (f.get('cats') or []) else ''
    return ('<li class="ty-row%s%s"><span class="ty-i">%02d</span><span class="ty-m">%s<br><i>%s · %s</i></span>'
            '<span class="ty-s" style="font-family:&quot;%s&quot;, var(--font-mono)">%s</span></li>'
            % (' on' if on else '', px, k + 1, esc(f['name']), esc((f.get('cats') or [''])[0]), f.get('glyphs') or '', esc(f['name']), esc(f.get('sample') or f['name'])))


def type_body(t, fams, sauce, fonts_p):
    W = 4   # rows in the window
    strip = ''.join('<i%s></i>' % (' class="on"' if k == 0 else (' class="w"' if k < W else '')) for k in range(len(fams)))
    lint = next((s['value'] for s in sauce.get('spec', []) if s['label'] == 'lint rules'), '')
    glyphs = next((s['value'] for s in fonts_p.get('spec', []) if s['label'] == 'glyphs drawn'), '')   # content/tools.json, not a sum of the specimen counts
    data = [[x['name'], (x.get('cats') or [''])[0], x.get('glyphs') or '', x.get('sample') or x['name'], bool(x.get('grid') or 'Pixel' in (x.get('cats') or []))] for x in fams]
    return (
        '<div class="t-body ty" data-fams="%s">'
        '<p class="ro-k"><span>specimen · each face sets its own line</span><span class="ty-n"><b>01</b> / %d</span></p>'
        '<ol class="ty-rows">%s</ol>'
        '<p class="ty-strip" aria-hidden="true">%s</p>'
        '<p class="ro-k ty-sum"><span>%d families · %s glyphs drawn · OFL</span><span>secret sauce · %s lint rules</span></p>'
        '</div>'
    ) % (esc(json.dumps(data)), len(fams), ''.join(ty_row(k, fams[k], k == 0) for k in range(W)), strip, len(fams), glyphs, lint)


def vaasf_body(t):
    rows = ''.join('<li style="--i:%d"><span>%s %s</span>%s</li>' % (k, esc(r['d']), esc(r['t']), esc(r['e'])) for k, r in enumerate(t['rows']))
    boxes = ''.join('<i style="left:%s%%;top:%s%%;width:%s%%;height:%s%%;--i:%d"></i>' % (r['box'][0], r['box'][1], r['box'][2], r['box'][3], k) for k, r in enumerate(t['rows']))
    return (
        '<div class="t-body va">'
        '<img class="va-cover" src="public/media/vaasf/hero.jpg" width="850" height="1100" loading="lazy" decoding="async" alt="Cover of the 2026 VAASF program, Canciones Españolas.">'
        '<div class="va-flow"><p class="ro-k"><span>16 pages from data</span><span>schedule → page 2</span></p>'
        '<div class="va-map"><ol class="va-rows">%s</ol>%s'
        '<div class="va-page"><img src="public/media/vaasf/schedule.jpg" width="680" height="880" loading="lazy" decoding="async" alt="Program page 2: the schedule of events for all three festival days.">%s</div></div></div>'
        '</div>'
    ) % (rows, parrow(), boxes)


def render(root, ps):
    cfg = json.loads((root / 'content' / 'panel.json').read_text())
    R = json.loads((root / 'content' / 'runlog.json').read_text())
    songs = json.loads((root / 'public' / 'media' / 'tasty_tunez' / 'songs.json').read_text())
    fams = json.loads((root / 'fonts' / 'files' / 'families.json').read_text())
    by = {p['slug']: p for p in ps}
    meta = lambda s: json.loads((root / 'previews' / s / 'meta.json').read_text()) if (root / 'previews' / s / 'meta.json').exists() else {}
    faces = [f['name'] for f in fams if not f.get('grid')] or None
    out = ['\n<ol class="pnl">']
    for k, t in enumerate(cfg['tiles'], 1):
        s = t['slug']; p = by.get(s, {}); m = meta(s)
        if s == 'anime-pipeline': body = anime_body(t, R)
        elif s == 'lmr': body = lmr_body(t)
        elif s == 'tasty_tunez': body = tasty_body(songs)
        elif s == 'fonts': body = type_body(t, fams, by.get('secret-sauce', {}), p)
        else: body = vaasf_body(t)
        out.append(
            '<li class="tile t-%s acc%s" id="%s" style="%s" data-fonts="%s"><a class="t-a" href="case/%s/" aria-label="%s: %s">%s%s%s</a></li>'
            % (s, ' has-l' if s in ('tasty_tunez', 'vaasf') else '', s, style_vars(m), esc(' '.join(m.get('fonts') or [])), esc(s), esc(t.get('label') or t['name']), esc(t['result']),
               head(p, t, k, faces if s == 'fonts' else None), res(t), body))
    out.append('</ol>')
    lab = cfg['lab']
    out.append('<p class="lab-line"><a href="%s"><span>%s</span>%s</a></p>\n' % (esc(lab['href']), esc(lab['text']), parrow()))
    return '\n'.join(out)
