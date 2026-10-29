#!/usr/bin/env python3
"""Static build for the portfolio. Python 3 stdlib only; safe to run any number of times (idempotent).

  python3 build.py

What it writes (all at the repo root, all committed; GitHub Pages still serves the repo as-is):
  index.html         the plain project list between <!-- build:work --> markers inside #work, for crawlers and
                     no-JS readers; site.js replaces it on load
  case/<slug>/       one share page per project: a copy of case.html with <base href="../../">, window.SLUG, and the
                     project's own <title>, description, canonical and Open Graph tags, plus its text as a static
                     fallback inside #case
  lab/index.html     the lab board between <!-- build:lab --> markers, from lab/lab.json, content/*.json and
                     previews/<slug>/meta.json (accent and display face)
  sitemap.xml        the index, the font library, the lab and every case page (case/fonts/ redirects, so fonts/ stands in)
  robots.txt         keeps Disallow: /dive/ and adds the Sitemap line
  site.js            the CASE_JS line: which projects ship previews/<slug>/case.js
  fonts/**/index.html  an absolute og:image when the generated page has none (fonts/ itself comes from
                     secret-sauce/tools/font/foundry/library.py; only this tag is added)

Order follows site.js: GROUPS for the files, CATS for sections, then `order`, then slug.
"""
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent
SITE = 'https://davidghatley.github.io/'
DEFAULT_IMAGE = 'public/media/meguri/hero.jpg'


def write(p, s):
    """Write only when the text changes, so a second run touches nothing."""
    p.parent.mkdir(parents=True, exist_ok=True)
    if not p.exists() or p.read_text() != s:
        p.write_text(s)
        print('wrote', p.relative_to(ROOT))


def js_list(src, name):
    m = re.search(r'var ' + name + r' = \[([^\]]*)\]', src)
    return re.findall(r"'([^']*)'", m.group(1))


def esc(s):
    return html.escape(str(s if s is not None else ''), quote=True)


def projects(site_js):
    groups, cats = js_list(site_js, 'GROUPS'), js_list(site_js, 'CATS')
    ps = []
    for g in groups:
        f = ROOT / 'content' / (g + '.json')
        if f.exists():
            ps += [p for p in json.loads(f.read_text()) if p and p.get('slug')]

    def cat(p):
        c = str(p.get('category') or '').lower()
        return cats.index(c) if c in cats else len(cats)
    ps.sort(key=lambda p: (cat(p), p.get('order') or 99, p['slug']))
    return ps, cats, cat


def between(s, name, body):
    a, b = '<!-- build:%s -->' % name, '<!-- /build:%s -->' % name
    i, j = s.index(a) + len(a), s.index(b)
    return s[:i] + body + s[j:]


def set_meta(s, attr, key, value):
    """Replace the content of <meta attr="key" ...>, or add it before </head>."""
    tag = '<meta %s="%s" content="%s">' % (attr, key, esc(value))
    pat = re.compile(r'<meta %s="%s" content="[^"]*">' % (attr, re.escape(key)))
    return pat.sub(lambda m: tag, s, count=1) if pat.search(s) else s.replace('</head>', tag + '\n</head>', 1)


def image_of(p):
    src = (p.get('hero') or {}).get('src') or DEFAULT_IMAGE
    if not (ROOT / src).exists():
        src = DEFAULT_IMAGE
    return SITE + src


def static_index(ps, cats, cat):
    out, cur = ['\n<div class="static">'], None
    for p in ps:
        c = cat(p)
        if c != cur:
            if cur is not None:
                out.append('</ul>')
            cur = c
            out.append('<h2 class="h2">%s</h2><ul class="static-list">' % esc(cats[c] if c < len(cats) else 'other'))
        out.append('<li><a href="case/%s/">%s</a>: %s</li>' % (esc(p['slug']), esc(p.get('title')), esc(p.get('oneliner'))))
    out.append('</ul></div>\n')
    return '\n'.join(out)


def static_case(p):
    out = ['\n<div class="static">', '<h1>%s</h1>' % esc(p.get('title')), '<p>%s</p>' % esc(p.get('oneliner'))]
    out += ['<p>%s</p>' % esc(t) for t in (p.get('body') or [])]
    links = [l for l in (p.get('links') or []) if l.get('url')]
    if links:
        out.append('<ul>' + ''.join('<li><a href="%s">%s</a></li>' % (esc(l['url']), esc(l.get('label'))) for l in links) + '</ul>')
    out.append('</div>\n')
    return '\n'.join(out)


def case_page(tpl, p):
    slug = p['slug']
    url = SITE + ('fonts/' if slug == 'fonts' else 'case/%s/' % slug)   # the font library is the fonts case study
    title = '%s · David Hatley' % p.get('title')
    desc = p.get('oneliner') or ''
    s = tpl.replace('<head>', '<head>\n<base href="../../">', 1)
    s = re.sub(r'<title>[^<]*</title>', lambda m: '<title>%s</title>' % esc(title), s, count=1)
    s = set_meta(s, 'name', 'description', desc)
    s = set_meta(s, 'property', 'og:title', title)
    s = set_meta(s, 'property', 'og:description', desc)
    s = set_meta(s, 'property', 'og:url', url)
    s = set_meta(s, 'property', 'og:type', 'article')
    s = set_meta(s, 'property', 'og:image', image_of(p))
    s = s.replace('</head>', '<link rel="canonical" href="%s">\n</head>' % url, 1)
    s = s.replace('<script>window.PAGE="case"</script>', '<script>window.PAGE="case";window.SLUG=%s</script>' % json.dumps(slug), 1)
    return between(s, 'case', static_case(p))


def fonts_og():
    for f in sorted((ROOT / 'fonts').glob('**/index.html')):
        s = f.read_text()
        if 'property="og:image"' in s:
            continue
        rel = f.parent.relative_to(ROOT).as_posix() + '/'
        add = '<meta property="og:image" content="%s">\n' % (SITE + DEFAULT_IMAGE)
        if 'property="og:url"' not in s:
            add += '<meta property="og:url" content="%s">\n' % (SITE + rel)
        write(f, s.replace('</head>', add + '</head>', 1))



def svg_cells(rows, n, cls, extra=''):
    out, i = [], 0
    for y, r in enumerate(rows or []):
        for x in range(n):
            if x < len(r) and r[x] == 'X':
                out.append('<rect x="%d" y="%d" width="1" height="1" style="--i:%d"/>' % (x, y, i))
                i += 1
    return ('<svg class="%s" viewBox="0 0 %d %d" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"%s>%s</svg>'
            % (cls, n, n, extra, ''.join(out)))


def meta_of(slug):
    f = ROOT / 'previews' / slug / 'meta.json'
    try:
        return json.loads(f.read_text())
    except (OSError, ValueError):
        return {}


def acc_style(m):
    st = []
    if m.get('accent'):
        st.append('--acc-l:%s' % m['accent'])
    if m.get('accent_dark'):
        st.append('--acc-d:%s' % m['accent_dark'])
    if m.get('font_display'):
        st.append('--font-title:%s' % m['font_display'].replace('"', "'"))
    return ';'.join(st)


def lab_title(p, href):
    t = str(p.get('title'))
    chs = ''.join('<span class="ch">%s</span>' % esc(c) for c in t)
    return ('<h3 class="lc__t"><a href="%s"><span class="sr-only">%s</span><span class="lc__chs" aria-hidden="true">%s</span></a></h3>'
            % (esc(href), esc(t), chs))


def lab_card(it, p):
    slug = p['slug']
    m = meta_of(slug)
    steps = it['steps']
    done = sum(1 for s in steps if s[0])
    href = 'case/%s/' % slug
    o = ['<article class="lc acc" id="%s" style="%s">' % (esc(slug), esc(acc_style(m)))]
    o.append('<div class="lc__head">%s%s<span class="lc__n">%d/%d</span></div>' % (svg_cells(p.get('glyph'), 5, 'glyph'), lab_title(p, href), done, len(steps)))
    o.append('<p class="lc__what" data-draft="true">%s</p>' % esc(it['what']))
    if it.get('img'):
        im = it['img']
        o.append('<a class="lc__fig" href="%s" tabindex="-1"><img src="%s" alt="%s" loading="lazy" decoding="async" style="object-position:%s%s"></a>'
                 % (esc(href), esc(im['src']), esc(im['alt']), esc(im.get('pos', '50% 50%')),
                    ';transform:scale(%s);transform-origin:%s' % (im['zoom'], im.get('pos', '50% 50%')) if im.get('zoom') else ''))
    elif it.get('chart'):
        c = it['chart']
        rows = ''.join('<div class="lc__cr"><span>%s</span><span class="lc__cb"><i style="width:%.1f%%"></i></span><span>%s</span></div>' % (esc(a), b * 100, esc(v)) for a, b, v in c['rows'])
        o.append('<figure class="lc__fig lc__fig--chart" aria-label="%s"><figcaption class="lc__cap">%s</figcaption>%s<p class="lc__cap">%s</p></figure>'
                 % (esc(c['label'] + ': ' + ', '.join('%s %s' % (a, v) for a, b, v in c['rows'])), esc(c['label']), rows, esc(c['foot'])))
    elif it.get('log'):
        lg = it['log']
        o.append('<figure class="lc__fig lc__fig--log"><figcaption class="lc__cap">from <a href="%s">the recorded demo log</a></figcaption><pre>%s</pre></figure>'
                 % (esc(lg['src']), '\n'.join(esc(l) for l in lg['lines'])))
    cells = ''.join('<i class="%s"></i>' % ' '.join(c for c in ('is-done' if s[0] else '', 'is-bar' if k == len(steps) - 1 else '') if c)
                    for k, s in enumerate(steps))
    o.append('<div class="lc__track" role="img" aria-label="%d of %d steps done toward the demo bar">%s</div>' % (done, len(steps), cells))
    lis = ''.join('<li%s%s>%s</li>' % (' class="is-done"' if s[0] else '', ' data-draft="true"' if len(s) > 2 and s[2] else '', esc(s[1])) for s in steps)
    o.append('<ol class="lc__steps">%s</ol>' % lis)
    o.append('<p class="lc__bar"><span class="lc__k">Graduates when</span> %s</p>' % esc(it['bar']))
    o.append('</article>')
    return '\n'.join(o)


def lab_exp(p):
    slug = p['slug']
    m = meta_of(slug)
    note = re.sub(r'^Experiment, finished\.\s*', '', p.get('status_note') or '')
    o = ['<article class="lc lc--x acc" id="%s" style="%s">' % (esc(slug), esc(acc_style(m)))]
    o.append('<div class="lc__head">%s%s</div>' % (svg_cells(p.get('glyph'), 5, 'glyph'), lab_title(p, 'case/%s/' % slug)))
    o.append('<p class="lc__what">%s</p>' % esc(p.get('oneliner')))
    if p.get('became'):
        o.append('<p class="lc__to"><span class="tag tag--to">&rarr; %s</span><span>%s</span></p>' % (esc(p['became']), esc(note)))
    o.append('</article>')
    return '\n'.join(o)


def lab_page(ps):
    f = ROOT / 'lab' / 'lab.json'
    if not f.exists():
        return
    d = json.loads(f.read_text())
    by = {p['slug']: p for p in ps}
    o = ['\n<p class="lab-intro" data-draft="true">%s</p>' % esc(d['intro']), '<div class="board">']
    for g in d['groups']:
        items = [it for it in g['items'] if it['slug'] in by]
        o.append('<section class="lane" id="%s" aria-labelledby="h-%s"><div class="cat__head"><h2 class="cat__label" id="h-%s">%s</h2><span class="cat__n">%d</span></div>'
                 % (esc(g['id']), esc(g['id']), esc(g['id']), esc(g['title']), len(items)))
        o.append('<p class="lane__note" data-draft="true">%s</p>' % esc(g['note']))
        o += [lab_card(it, by[it['slug']]) for it in items]
        o.append('</section>')
    o.append('</div>')
    x = d['experiments']
    exps = [by[s] for s in x['slugs'] if s in by]
    o.append('<section class="lane lane--x" id="experiments" aria-labelledby="h-x"><div class="cat__head"><h2 class="cat__label" id="h-x">%s</h2><span class="cat__n">%d</span></div>'
             % (esc(x['title']), len(exps)))
    o.append('<p class="lane__note" data-draft="true">%s</p><div class="xgrid">' % esc(x['note']))
    o += [lab_exp(p) for p in exps]
    o.append('</div></section>\n')
    idx = ROOT / 'lab' / 'index.html'
    write(idx, between(idx.read_text(), 'lab', '\n'.join(o)))


def main():
    sjs = ROOT / 'site.js'
    site_js = sjs.read_text()
    ps, cats, cat = projects(site_js)

    # site.js: which projects have a bespoke case.js
    have = sorted(d.parent.name for d in (ROOT / 'previews').glob('*/case.js') if not d.parent.name.startswith('_'))
    line = 'var CASE_JS = [%s]; // build.py: case.js list' % ', '.join("'%s'" % h for h in have)
    write(sjs, re.sub(r'var CASE_JS = \[[^\]]*\]; // build\.py: case\.js list', lambda m: line, site_js, count=1))

    idx = ROOT / 'index.html'
    write(idx, between(idx.read_text(), 'work', static_index(ps, cats, cat)))

    tpl = (ROOT / 'case.html').read_text()
    slugs = [p['slug'] for p in ps]
    for p in ps:
        write(ROOT / 'case' / p['slug'] / 'index.html', case_page(tpl, p))
    # drop pages for projects that no longer exist
    for d in sorted((ROOT / 'case').iterdir()):
        if d.is_dir() and d.name not in slugs:
            for f in d.iterdir():
                f.unlink()
            d.rmdir()
            print('removed', d.relative_to(ROOT))

    lab_page(ps)

    urls = [SITE, SITE + 'lab/', SITE + 'fonts/'] + [SITE + 'case/%s/' % s for s in slugs if s != 'fonts']
    write(ROOT / 'sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + ''.join('  <url><loc>%s</loc></url>\n' % u for u in urls) + '</urlset>\n')
    write(ROOT / 'robots.txt', 'User-agent: *\nDisallow: /dive/\n\nSitemap: %ssitemap.xml\n' % SITE)

    fonts_og()


if __name__ == '__main__':
    main()
