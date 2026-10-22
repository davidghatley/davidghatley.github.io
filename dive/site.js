(function () {
  var G = window.SAUCE_GLYPHS || {};
  var NS = 'http://www.w3.org/2000/svg';
  var GROUPS = ['diveclub', 'vaasf', 'kitchen', 'anime', 'tools'];
  var PILL = { shipped: 'ok', working: 'info', prototype: 'info', research: 'mute', concept: 'mute' };
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function glyphSvg(rows, anim) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 5 5'); s.setAttribute('class', 'glyph'); s.setAttribute('shape-rendering', 'crispEdges'); s.setAttribute('fill', 'currentColor'); s.setAttribute('aria-hidden', 'true');
    var n = 0;
    (rows || []).forEach(function (r, y) { for (var x = 0; x < 5; x++) if (r[x] === 'X') {
      var q = document.createElementNS(NS, 'rect'); q.setAttribute('x', x); q.setAttribute('y', y); q.setAttribute('width', 1); q.setAttribute('height', 1);
      q.style.setProperty('--i', n++); s.appendChild(q); } });
    if (anim) s.classList.add('is-armed');
    return s;
  }
  // header mark
  var mk = document.getElementById('mk');
  if (mk && G.mark) G.mark.forEach(function (r, y) { for (var x = 0; x < 7; x++) if (r[x] === 'X') { var q = document.createElementNS(NS, 'rect'); q.setAttribute('x', x); q.setAttribute('y', y); q.setAttribute('width', 1); q.setAttribute('height', 1); mk.appendChild(q); } });

  // zoom
  var zoom = document.getElementById('zoom');
  function openZoom(src, alt, cap) { zoom.querySelector('img').src = src; zoom.querySelector('img').alt = alt || ''; zoom.querySelector('.zoom__cap').textContent = cap || ''; zoom.hidden = false; }
  function closeZoom() { zoom.hidden = true; }
  zoom.addEventListener('click', closeZoom);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeZoom(); });
  function zoomBtn(m, cap) {
    var b = el('button', 'zoomable'); b.type = 'button'; b.setAttribute('aria-label', 'Zoom: ' + (m.alt || ''));
    var i = el('img'); i.src = m.src; i.alt = m.alt || ''; i.loading = 'lazy'; b.appendChild(i);
    b.addEventListener('click', function () { openZoom(m.src, m.alt, cap); }); return b;
  }
  function media(m, cap) {
    if (/\.mp4$/i.test(m.src)) { var v = el('video'); v.src = m.src; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.setAttribute('aria-label', m.alt || ''); return v; }
    return zoomBtn(m, cap);
  }
  function spec(list) {
    if (!list || !list.length) return null;
    var d = el('div', 'ss-spec');
    list.forEach(function (s) { var x = el('span', '', '<i>' + esc(s.label) + '</i> ' + esc(s.value)); if (s.source) x.title = 'Source: ' + s.source.replace(/~\/Projects\/|\/home\/[^ ]+?\/Projects\//g, ''); d.appendChild(x); });
    return d;
  }
  function head(p, n) {
    return el('div', 'ss-plate__head', '<span class="ss-label">PLATE ' + n + ' · ' + esc(p.title).toUpperCase() + '</span><span class="ss-pill ss-pill--' + (PILL[p.status] || 'mute') + '">' + esc(p.status) + '</span>');
  }
  function load() {
    return Promise.all(GROUPS.map(function (g) {
      return fetch('content/' + g + '.json').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
    })).then(function (a) { return [].concat.apply([], a).filter(function (p) { return p && p.slug; }).sort(function (x, y) { return (x.order || 99) - (y.order || 99); }); });
  }
  function arm(root) {
    var gs = root.querySelectorAll('.glyph');
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove('is-armed'); io.unobserve(e.target); } }); }, { threshold: 0.3 });
    gs.forEach(function (g) { g.classList.add('is-armed'); io.observe(g); });
  }

  function home() {
    var track = document.getElementById('work');
    load().then(function (ps) {
      track.innerHTML = '';
      ps.forEach(function (p, i) {
        var pl = el('article', 'ss-plate plate-work'); pl.id = p.slug;
        pl.appendChild(head(p, i + 1));
        var body = el('div', 'plate-work__body'), main = el('div', 'plate-work__main');
        body.appendChild(glyphSvg(p.glyph));
        if (p.hero) main.appendChild(zoomBtn(p.hero, p.title));
        main.appendChild(el('h2', 'work-title', '<a href="case.html?p=' + encodeURIComponent(p.slug) + '">' + esc(p.title) + '</a>'));
        main.appendChild(el('p', 'oneliner', esc(p.oneliner)));
        if (p.role) main.appendChild(el('p', 'role', esc(p.role)));
        if (p.status_note) main.appendChild(el('p', 'ss-plate__cap', esc(p.status_note)));
        var s = spec(p.spec); if (s) main.appendChild(s);
        main.appendChild(el('a', 'work-go', 'Case study &rarr;')).href = 'case.html?p=' + encodeURIComponent(p.slug);
        body.appendChild(main); pl.appendChild(body); track.appendChild(pl);
      });
      arm(track);
    });
  }

  function casePage() {
    var root = document.getElementById('case');
    var slug = new URLSearchParams(location.search).get('p');
    load().then(function (ps) {
      var i = ps.findIndex(function (p) { return p.slug === slug; });
      root.innerHTML = '';
      if (i < 0) { root.appendChild(el('p', '', 'No such project. <a href="index.html#work">Back to the work</a>.')); return; }
      var p = ps[i];
      document.title = p.title + ' · David Hatley';
      var pl = el('article', 'ss-plate'); pl.appendChild(head(p, i + 1));
      var body = el('div', 'plate-work__body'), main = el('div', 'plate-work__main');
      body.appendChild(glyphSvg(p.glyph));
      if (p.hero) main.appendChild(zoomBtn(p.hero, p.title));
      var s = spec(p.spec); if (s) main.appendChild(s);
      body.appendChild(main); pl.appendChild(body);
      root.appendChild(el('a', 'back', '&larr; All work')).href = 'index.html#work';
      root.appendChild(el('h1', 'case-h', esc(p.title)));
      root.appendChild(pl);
      var col = el('div', 'case-col');
      col.appendChild(el('p', 'oneliner', esc(p.oneliner)));
      if (p.role) col.appendChild(el('p', '', esc(p.role)));
      if (p.status_note) col.appendChild(el('p', 'ss-plate__cap', esc(p.status_note)));
      (p.body || []).forEach(function (t) { col.appendChild(el('p', '', esc(t))); });
      root.appendChild(col);
      var figs = el('div', 'figs');
      (p.media || []).forEach(function (m, k) {
        var f = el('figure', 'ss-plate fig'); f.style.margin = 0;
        f.appendChild(el('div', 'ss-plate__head', '<span class="ss-label">FIG ' + (k + 1) + ' · ' + esc(p.title).toUpperCase() + '</span>'));
        f.appendChild(media(m, m.caption));
        if (m.caption) f.appendChild(el('figcaption', 'ss-plate__cap', esc(m.caption)));
        figs.appendChild(f);
      });
      root.appendChild(figs);
      if (p.links && p.links.length) { var ul = el('ul', 'links'); p.links.forEach(function (l) { ul.appendChild(el('li', '', '<a href="' + esc(l.url) + '">' + esc(l.label) + ' &rarr;</a>')); }); root.appendChild(ul); }
      var pr = ps[i - 1], nx = ps[i + 1], pn = el('nav', 'pn');
      pn.appendChild(pr ? el('a', '', '&larr; ' + esc(pr.title)) : el('span')); if (pr) pn.firstChild.href = 'case.html?p=' + pr.slug;
      var nn = nx ? el('a', '', esc(nx.title) + ' &rarr;') : el('span'); if (nx) nn.href = 'case.html?p=' + nx.slug; pn.appendChild(nn);
      root.appendChild(pn);
      arm(root);
    });
  }
  if (window.PAGE === 'case') casePage(); else home();
})();
