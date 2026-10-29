#!/usr/bin/env python3
"""Static build for the portfolio. Python 3 stdlib only; safe to run any number of times (idempotent).

  python3 build.py

What it writes (all at the repo root, all committed; GitHub Pages still serves the repo as-is):
  index.html         the plain project list between <!-- build:work --> markers inside #work, for crawlers and
                     no-JS readers; site.js replaces it on load
  case/<slug>/       one share page per project: a copy of case.html with <base href="../../">, window.SLUG, and the
                     project's own <title>, description, canonical and Open Graph tags, plus its text as a static
                     fallback inside #case
  sitemap.xml        the index, the font library and every case page (case/fonts/ redirects, so fonts/ stands in)
  robots.txt         keeps Disallow: /review/ and /dive/ and adds the Sitemap line
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

    urls = [SITE, SITE + 'fonts/'] + [SITE + 'case/%s/' % s for s in slugs if s != 'fonts']
    write(ROOT / 'sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + ''.join('  <url><loc>%s</loc></url>\n' % u for u in urls) + '</urlset>\n')
    write(ROOT / 'robots.txt', 'User-agent: *\nDisallow: /review/\nDisallow: /dive/\n\nSitemap: %ssitemap.xml\n' % SITE)

    fonts_og()


if __name__ == '__main__':
    main()
