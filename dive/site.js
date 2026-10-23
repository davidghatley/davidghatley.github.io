(function () {
  var G = window.SAUCE_GLYPHS || {};
  var NS = 'http://www.w3.org/2000/svg';
  var GROUPS = ['vaasf', 'kitchen', 'anime', 'tools', 'lmr', 'experiments'];
  // index sections, in this order; a section shows only when it has projects
  var CATS = ['software', 'design system', 'client work', 'generative art', 'hardware', 'experiments'];
  var TAGS = ['prototype', 'archived'];
  function catIndex(p) { var i = CATS.indexOf(String(p.category || '').toLowerCase()); return i < 0 ? CATS.length : i; }
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function caseUrl(slug) { return 'case.html?p=' + encodeURIComponent(slug); }
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
  function replay(g) { g.classList.add('is-armed'); void g.getBoundingClientRect(); g.classList.remove('is-armed'); g.querySelectorAll('rect').forEach(function (r) { r.style.animation = 'none'; void r.getBoundingClientRect(); r.style.animation = ''; }); }
  var mk = document.getElementById('mk');
  if (mk && G.mark) G.mark.forEach(function (r, y) { for (var x = 0; x < 7; x++) if (r[x] === 'X') { var q = document.createElementNS(NS, 'rect'); q.setAttribute('x', x); q.setAttribute('y', y); q.setAttribute('width', 1); q.setAttribute('height', 1); mk.appendChild(q); } });

  // zoom (pinch, drag, double-tap, close button)
  var zoom = document.getElementById('zoom'), zimg = zoom.querySelector('img');
  var zs = { k: 1, x: 0, y: 0 }, pts = {}, d0 = 0, k0 = 1, drag = null, lastTap = 0, moved = false;
  function zapply() { zimg.style.transform = 'translate(' + zs.x + 'px,' + zs.y + 'px) scale(' + zs.k + ')'; }
  function zreset() { zs = { k: 1, x: 0, y: 0 }; zapply(); }
  function openZoom(src, alt, cap) { zimg.src = src; zimg.alt = alt || ''; zoom.querySelector('.zoom__cap').textContent = cap || ''; zreset(); zoom.hidden = false; document.documentElement.style.overflow = 'hidden'; }
  function closeZoom() { zoom.hidden = true; document.documentElement.style.overflow = ''; }
  document.getElementById('zoomx').addEventListener('click', function (e) { e.stopPropagation(); closeZoom(); });
  zoom.addEventListener('click', function (e) { if (e.target !== zimg && !moved) closeZoom(); });
  function dist() { var a = Object.keys(pts).map(function (k) { return pts[k]; }); return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); }
  zimg.addEventListener('pointerdown', function (e) { zimg.setPointerCapture(e.pointerId); pts[e.pointerId] = { x: e.clientX, y: e.clientY }; moved = false;
    if (Object.keys(pts).length === 2) { d0 = dist(); k0 = zs.k; } else { drag = { x: e.clientX - zs.x, y: e.clientY - zs.y }; var n = Date.now(); if (n - lastTap < 300) { zs.k > 1 ? zreset() : (zs.k = 2, zapply()); } lastTap = n; } });
  zimg.addEventListener('pointermove', function (e) { if (!pts[e.pointerId]) return; pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (Object.keys(pts).length === 2) { zs.k = Math.min(6, Math.max(1, k0 * dist() / d0)); moved = true; zapply(); }
    else if (drag && zs.k > 1) { zs.x = e.clientX - drag.x; zs.y = e.clientY - drag.y; moved = true; zapply(); } });
  function pend(e) { delete pts[e.pointerId]; if (Object.keys(pts).length < 2) drag = null; if (zs.k <= 1.01) { zs.x = zs.y = 0; zs.k = 1; zapply(); } setTimeout(function () { moved = false; }, 50); }
  zimg.addEventListener('pointerup', pend); zimg.addEventListener('pointercancel', pend);
  zimg.addEventListener('wheel', function (e) { e.preventDefault(); zs.k = Math.min(6, Math.max(1, zs.k * (e.deltaY < 0 ? 1.15 : 0.87))); zapply(); }, { passive: false });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeZoom(); });
  // back to top
  var tt = document.getElementById('totop');
  if (tt) { tt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }); });
    window.addEventListener('scroll', function () { tt.hidden = window.scrollY < 600; }, { passive: true }); }
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
  // only the maturity tags that change how you read a project; the category is the section it sits in
  function tags(p) {
    if (p.became) return '<span class="tag tag--to">&rarr; ' + esc(p.became) + '</span>';   // experiments: what it turned into
    var st = String(p.status || '').toLowerCase(); return TAGS.indexOf(st) < 0 ? '' : '<span class="tag">' + esc(st) + '</span>';
  }
  // the pixel arrow: 7 x 7 cells of 2px (Stem 7's cell at 16px), drawn on whole pixels
  var ARROW = ['...X...', '....X..', '.....X.', 'XXXXXXX', '.....X.', '....X..', '...X...'];
  function parrow(left) {
    var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 7 7'); s.setAttribute('class', 'parrow' + (left ? ' parrow--l' : ''));
    s.setAttribute('shape-rendering', 'crispEdges'); s.setAttribute('fill', 'currentColor'); s.setAttribute('aria-hidden', 'true');
    ARROW.forEach(function (r, y) { for (var x = 0; x < 7; x++) if (r[x] === 'X') { var q = document.createElementNS(NS, 'rect'); q.setAttribute('x', x); q.setAttribute('y', y); q.setAttribute('width', 1); q.setAttribute('height', 1); s.appendChild(q); } });
    return s;
  }
  // a row title: the real text once for assistive tech, and one aria-hidden span per character for the stepped
  // swap into the project's own face. Per-project open styles that meta.json doesn't carry live here.
  var TITLE_OPEN = { vaasf: { tcase: 'uppercase', d: '48px', p: '32px' } };   // DM Serif Display in capitals, a step up
  function titleEl(p) {
    var h = el('h3', 'row__title'); h.appendChild(el('span', 'sr-only', esc(p.title)));
    var v = el('span', 'tt'); v.setAttribute('aria-hidden', 'true');
    Array.from(String(p.title)).forEach(function (c) { var q = el('span', 'ch'); q.textContent = c; v.appendChild(q); });
    h.appendChild(v);
    if (p.title_sub) h.appendChild(el('span', 'row__sub', esc(p.title_sub)));   // experiments: the dataset line
    return h;
  }
  function swapTitle(r, on) {
    clearInterval(r._swap); r._swap = 0;
    var m = r._p.meta || {};
    if (!m.font_display) return;
    var cs = [].slice.call(r.querySelectorAll('.row__title .ch'));
    var todo = cs.filter(function (c) { return c.classList.contains('ch--on') !== on; });
    if (!on) todo.reverse();   // in left to right, out right to left
    if (REDUCED || !todo.length) { todo.forEach(function (c) { c.classList.toggle('ch--on', on); }); return; }
    var dur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-cell')) || 70, i = 0;
    function tick() { var c = todo[i++]; if (c) c.classList.toggle('ch--on', on); if (i >= todo.length) { clearInterval(r._swap); r._swap = 0; } }
    tick(); if (i < todo.length) r._swap = setInterval(tick, dur);
  }
  // keep a block of unknown height (a preview, a bespoke case page) a whole number of 4px baselines tall,
  // so everything after it stays on the baseline grid
  function snap4(node) {
    if (!window.ResizeObserver) return;
    var ro = new ResizeObserver(function () {
      node.style.minHeight = '';
      var h = node.getBoundingClientRect().height, q = Math.ceil(h / 4 - 0.01) * 4;
      if (q > h + 0.01) node.style.minHeight = q + 'px';
    });
    ro.observe(node); return ro;
  }
  function load() {
    return Promise.all(GROUPS.map(function (g) {
      return fetch('content/' + g + '.json').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
    })).then(function (a) { return [].concat.apply([], a).filter(function (p) { return p && p.slug; }).sort(function (x, y) { return (catIndex(x) - catIndex(y)) || ((x.order || 99) - (y.order || 99)) || (x.slug < y.slug ? -1 : 1); }); });
  }
  function loadMeta(p) {
    return fetch('previews/' + p.slug + '/meta.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (m) { p.meta = m || {}; return p; });
  }
  function applyFonts(m, base) {
    (m.fonts || []).forEach(function (u) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = String(u).replace('{base}', base || './'); document.head.appendChild(l); });
  }
  function applyAccent(node, m) {
    if (m.font_display) node.style.setProperty('--font-title', m.font_display);
    node.classList.add('acc');
    if (m.accent) node.style.setProperty('--acc-l', m.accent);
    if (m.accent_dark) node.style.setProperty('--acc-d', m.accent_dark);
    var to = TITLE_OPEN[node.id];
    if (to) { node.style.setProperty('--to-case', to.tcase); node.style.setProperty('--to-d', to.d); node.style.setProperty('--to-p', to.p); }
  }
  // mount a preview into root; resolves to a cleanup fn. Falls back to the hero image, uncropped.
  function mountPreview(p, root, mode, base) {
    return import('./previews/' + p.slug + '/preview.js').then(function (mod) {
      var c = mod.default(root, { mode: mode, base: base });
      return typeof c === 'function' ? c : function () {};
    }).catch(function () {
      root.innerHTML = '';
      if (p.hero) { var i = el('img'); i.src = p.hero.src; i.alt = p.hero.alt || ''; root.appendChild(i); }
      return function () {};
    });
  }

  // ---------- the ascii field: one fixed canvas behind the page ----------
  // Characters from a ramp, chosen by slow value noise over (column, row, time), on 16px cells that start at the
  // content's left edge and the page top, so every column line and every 4th baseline is a cell edge.
  // It steps (2 x --dur-cell, about 7 fps), never glides; static under reduced motion and while the tab is hidden.
  // Colours come from the tokens: paper nudged ~4-5 L* toward ink, half that inside the text column.
  var FIELD = { open: null, ms: 0 };
  function field() {
    var site = document.querySelector('.site'); if (!site || !window.HTMLCanvasElement) return;
    var cv = document.createElement('canvas'); cv.className = 'field'; cv.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(cv, document.body.firstChild);
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var C = 16, RAMP = ' .:-=+*#', NR = RAMP.length;
    var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    var dpr = 1, W = 0, H = 0, x0 = 0, cw = 0, atlas = null, t = 0, r0 = -1, dirty = true, timer = 0, visible = true;
    var mouse = { x: -1e5, y: -1e5 }, seed = (Math.random() * 1e4) | 0, verm = null;
    // colours: resolve the tokens through a probe so any token format works, then mix in sRGB
    function rgb(v) { var d = document.createElement('i'); d.style.color = 'var(' + v + ')'; d.style.display = 'none'; document.body.appendChild(d);
      var m = getComputedStyle(d).color.match(/[\d.]+/g) || [0, 0, 0]; d.remove(); return m.slice(0, 3).map(Number); }
    function mix(a, b, f) { return 'rgb(' + a.map(function (x, i) { return Math.round(x + (b[i] - x) * f); }).join(',') + ')'; }
    function build() {
      var paper = rgb('--paper'), ink = rgb('--ink'), dark = paper[0] + paper[1] + paper[2] < 384;
      var f = dark ? 0.055 : 0.06;   // light: about 4.5 L* darker; dark: about 5.9 L* lighter
      var cols = [mix(paper, ink, f), mix(paper, ink, f * 0.5), mix(paper, rgb('--cobalt'), dark ? 0.5 : 0.4), mix(paper, rgb('--vermilion'), dark ? 0.6 : 0.5)];
      atlas = document.createElement('canvas'); atlas.width = NR * C * dpr; atlas.height = cols.length * C * dpr;
      var a = atlas.getContext('2d'); a.scale(dpr, dpr); a.font = '16px "Stem 7"'; a.textBaseline = 'alphabetic';
      cols.forEach(function (c, k) { a.fillStyle = c; for (var i = 1; i < NR; i++) { var ch = RAMP[i], w = a.measureText(ch).width; a.fillText(ch, i * C + Math.round((C - w) / 2), k * C + 14); } });
      dirty = true;
    }
    function size() {
      dpr = Math.max(1, Math.round((window.devicePixelRatio || 1) * 2) / 2);
      W = document.documentElement.clientWidth; H = window.innerHeight + C;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
      var b = site.getBoundingClientRect(); x0 = Math.round(b.left); cw = Math.round(b.width);
      verm = x0 >= 6 * C ? { c: -Math.round(x0 / C / 2), r: Math.round(window.innerHeight / C * 0.62) + 3 } : null;   // one vermilion cell, mid left margin
      build();
    }
    function hash(x, y, z) { var h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
    // the field: four slow plane waves at odd angles. Each cos(kx*c + ky*r + w*t) splits into per-column and
    // per-row tables (cos a cos b - sin a sin b), so a frame costs O(columns + rows) trig and two multiplies a cell.
    var WAVES = [[0.13, 0.21, 0.07, 0.32], [-0.23, 0.09, -0.05, 0.26], [0.07, -0.17, 0.04, 0.22], [0.41, 0.33, 0.11, 0.2]];
    var tc = [], tr = [];
    function tables(cMin, cMax, rTop, nR) {
      WAVES.forEach(function (wv, k) {
        var ac = tc[k] || (tc[k] = { c: [], s: [] }), ar = tr[k] || (tr[k] = { c: [], s: [] }), ph = wv[2] * t + seed;
        for (var c = cMin; c < cMax; c++) { var a = wv[0] * c + ph; ac.c[c - cMin] = Math.cos(a); ac.s[c - cMin] = Math.sin(a); }
        for (var j = 0; j < nR; j++) { var b = wv[1] * (rTop + j); ar.c[j] = Math.cos(b); ar.s[j] = Math.sin(b); }
      });
    }
    var prev = null;   // last frame's code per cell; only cells whose code changes are cleared and redrawn
    function draw() {
      var t0 = performance.now(), sy = Math.round(window.scrollY), rTop = Math.floor(sy / C);
      var cMin = -Math.ceil(x0 / C), cMax = Math.ceil((W - x0) / C), nR = Math.ceil(H / C), s = C * dpr, nC = cMax - cMin;
      cv.style.transform = 'translate3d(0,' + (rTop * C - sy) + 'px,0)';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (dirty || !prev || prev.length !== nC * nR || Math.abs(rTop - r0) >= nR) { ctx.clearRect(0, 0, cv.width, cv.height); prev = new Int16Array(nC * nR); }
      else if (rTop !== r0) {   // scrolled by whole cells: move the pixels and the codes, then only new rows draw
        var d = rTop - r0, sh = d * s, keep = cv.height - Math.abs(sh);
        ctx.globalCompositeOperation = 'copy';
        ctx.drawImage(cv, 0, Math.max(0, sh), cv.width, keep, 0, Math.max(0, -sh), cv.width, keep);
        ctx.globalCompositeOperation = 'source-over';
        if (d > 0) { prev.copyWithin(0, d * nC); prev.fill(-1, (nR - d) * nC); ctx.clearRect(0, keep, cv.width, cv.height - keep); }
        else { prev.copyWithin(-d * nC, 0, (nR + d) * nC); prev.fill(-1, 0, -d * nC); ctx.clearRect(0, 0, cv.width, -sh); }
      }
      r0 = rTop;
      if (!atlas) return;
      tables(cMin, cMax, rTop, nR);
      var lo = x0 - C, hi = x0 + cw + C, ob = null, nW = WAVES.length;
      if (FIELD.open) { var rb = FIELD.open.getBoundingClientRect(); ob = [rb.top + sy, rb.bottom + sy]; }
      var mx = mouse.x, my = mouse.y + sy, R = 6 * C, R2 = R * R;
      for (var j = 0; j < nR; j++) {
        var r = rTop + j, yDoc = r * C, dy = Math.round(j * s), band = ob && yDoc + C > ob[0] && yDoc < ob[1], ddy = yDoc + 8 - my;
        for (var c = cMin; c < cMax; c++) {
          var q = c - cMin, xs = x0 + c * C, inCol = xs >= lo && xs + C <= hi, v = 0;
          for (var k = 0; k < nW; k++) { var A = tc[k], B = tr[k]; v += WAVES[k][3] * (A.c[q] * B.c[j] - A.s[q] * B.s[j]); }
          v = 0.5 + v * 0.5;
          var ddx = xs + 8 - mx, d2 = ddx * ddx + ddy * ddy;
          if (d2 < R2) v += 0.28 * (1 - Math.sqrt(d2) / R);
          if (band && !inCol) v += 0.12;
          if (inCol) v -= 0.16;   // the text column keeps only the peaks, at half strength
          var i = Math.floor((v - 0.5) * 2.4 * NR), kk = inCol ? 1 : 0, code = 0;
          if (verm && c === verm.c && r === verm.r) i = 5;
          if (i >= 1) { if (i >= NR) i = NR - 1;
            if (!inCol) { if (verm && c === verm.c && r === verm.r) kk = 3; else if (i > 2 && hash(c, r, 7) < 0.02) kk = 2; }
            code = kk * NR + i; }
          var at = j * nC + q; if (prev[at] === code) continue; prev[at] = code;
          var dx = Math.round(xs * dpr); ctx.clearRect(dx, dy, s, s);
          if (code) ctx.drawImage(atlas, i * s, kk * s, s, s, dx, dy, s, s);
        }
      }
      FIELD.ms = window.__fieldms = performance.now() - t0; dirty = false;
    }
    function step() { if (mq.matches || !visible || document.hidden) { timer = 0; return; } t++; draw(); timer = setTimeout(step, 2 * cell()); }
    function cell() { var d = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-cell')) || 70; return Math.max(60, d); }
    function start() { if (!timer && !mq.matches && !document.hidden && visible) timer = setTimeout(step, 2 * cell()); }
    var raf = 0; function later() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; if (Math.floor(Math.round(window.scrollY) / C) !== r0 || dirty) draw(); else cv.style.transform = 'translate3d(0,' + (r0 * C - Math.round(window.scrollY)) + 'px,0)'; }); }
    window.addEventListener('scroll', later, { passive: true });
    window.addEventListener('resize', function () { size(); later(); });
    window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { mouse.x = e.clientX; mouse.y = e.clientY; } }, { passive: true });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { clearTimeout(timer); timer = 0; } else start(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }).observe(cv);
    function retheme() { build(); draw(); }
    if (window.matchMedia) { var cs = matchMedia('(prefers-color-scheme: dark)'); (cs.addEventListener ? cs.addEventListener('change', retheme) : cs.addListener(retheme)); }
    if (mq.addEventListener) mq.addEventListener('change', function () { draw(); start(); });
    (document.fonts && document.fonts.load ? document.fonts.load('16px "Stem 7"') : Promise.resolve()).then(function () { size(); draw(); start(); }, function () { size(); draw(); start(); });
  }

  // ---------- ?grid=1: draws the columns, the margins and the 4px baselines over the page ----------
  function gridOverlay() {
    var site = document.querySelector('.site'); if (!site) return;
    var cv = document.createElement('canvas'); cv.className = 'gridx'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    function col(v) { var d = document.createElement('i'); d.style.color = 'var(' + v + ')'; document.body.appendChild(d); var c = getComputedStyle(d).color; d.remove(); return c; }
    function draw() {
      var dpr = window.devicePixelRatio || 1, W = document.documentElement.clientWidth, H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var cs = getComputedStyle(site), n = parseInt(cs.getPropertyValue('--n'), 10), cw = parseFloat(cs.getPropertyValue('--col')), g = parseFloat(cs.getPropertyValue('--g'));
      var x0 = site.getBoundingClientRect().left, w = site.getBoundingClientRect().width, sy = window.scrollY, cob = col('--cobalt'), ver = col('--vermilion');
      ctx.fillStyle = cob; ctx.globalAlpha = 0.07;
      for (var k = 0; k < n; k++) ctx.fillRect(x0 + k * (cw + g), 0, cw, H);
      for (var y = Math.ceil(sy / 4) * 4; y < sy + H; y += 4) { ctx.globalAlpha = y % 16 === 0 ? 0.32 : 0.13; ctx.fillRect(0, y - sy, W, 1); }
      ctx.globalAlpha = 0.8; ctx.fillStyle = ver; ctx.fillRect(x0, 0, 1, H); ctx.fillRect(x0 + w - 1, 0, 1, H);
      ctx.globalAlpha = 1; ctx.fillStyle = ver; ctx.font = '500 11px "IBM Plex Mono"';
      ctx.fillText(n + ' x ' + cw + ' + ' + g + ' · x0 ' + x0 + ' · w ' + w + ' · 4px · field ' + FIELD.ms.toFixed(2) + 'ms', 8, H - 8);
    }
    window.addEventListener('scroll', function () { requestAnimationFrame(draw); }, { passive: true });
    window.addEventListener('resize', draw); setInterval(draw, 1000); draw();
  }

  function home() {
    var track = document.getElementById('work');
    var open = null, hoverT = null;
    var touch = window.matchMedia && matchMedia('(hover: none)').matches;
    function expand(r) {
      if (open && open !== r) collapse(open);
      if (r.classList.contains('is-open')) return;
      open = r; r.classList.add('is-open'); FIELD.open = r; r.querySelector('.row__bar').setAttribute('aria-expanded', 'true');
      var g = r.querySelector('.glyph'); if (g) replay(g); if (!r._fonts) { r._fonts = 1; applyFonts(r._p.meta, './'); }
      swapTitle(r, true);
      var pv = r.querySelector('.row__preview'), p = r._p;
      r._token = {};
      var t = r._token;
      mountPreview(p, pv, 'row', './').then(function (c) { if (r._token === t && r.classList.contains('is-open')) r._cleanup = c; else c(); });
    }
    function collapse(r) {
      r.classList.remove('is-open'); r.querySelector('.row__bar').setAttribute('aria-expanded', 'false'); swapTitle(r, false);
      var c = r._cleanup; r._cleanup = null; r._token = null;
      if (c) c();
      var pv = r.querySelector('.row__preview');
      setTimeout(function () { if (!r.classList.contains('is-open')) pv.innerHTML = ''; }, 300);
      if (open === r) open = null;
      if (FIELD.open === r) FIELD.open = null;
    }
    function go(r, e) {
      var p = r._p;
      var g = r.querySelector('.glyph'); if (g) g.style.viewTransitionName = 'glyph-' + p.slug;
      var pv = r.querySelector('.row__preview'); if (r.classList.contains('is-open')) pv.style.viewTransitionName = 'hero-' + p.slug;
    }
    load().then(function (ps) { return Promise.all(ps.map(loadMeta)); }).then(function (ps) {
      track.innerHTML = '';
      var sec = null, cat = null;
      ps.forEach(function (p, idx) {
        var c = catIndex(p);
        if (c !== cat) {
          cat = c; var name = CATS[c] || 'other';
          var n = ps.filter(function (q) { return catIndex(q) === c; }).length;
          sec = el('section', 'cat'); sec.setAttribute('aria-label', name);
          sec.appendChild(el('div', 'cat__head', '<h2 class="cat__label">' + esc(name) + '</h2><span class="cat__n">' + String(n).padStart(2, '0') + '</span>'));
          track.appendChild(sec);
        }
        var r = el('article', 'row'); r.id = p.slug; r._p = p; applyAccent(r, p.meta);
        var bar = el('div', 'row__bar'); bar.tabIndex = 0; bar.setAttribute('role', 'button'); bar.setAttribute('aria-expanded', 'false'); bar.setAttribute('aria-controls', 'pn-' + p.slug);
        bar.appendChild(el('span', 'row__n', String(idx + 1).padStart(2, '0')));
        bar.appendChild(glyphSvg(p.glyph));
        bar.appendChild(titleEl(p));
        bar.appendChild(el('p', 'row__one', esc(p.oneliner)));
        var tg = tags(p); if (tg) bar.appendChild(el('span', 'row__tags', tg));
        var ar = el('a', 'row__arrow'); ar.appendChild(parrow()); ar.href = caseUrl(p.slug); ar.tabIndex = -1; ar.setAttribute('aria-hidden', 'true'); bar.appendChild(ar);
        var panel = el('div', 'row__panel'); panel.id = 'pn-' + p.slug;
        var inner = el('div', 'row__inner'), pad = el('div', 'row__pad');
        pad.appendChild(el('p', 'row__one-m', esc(p.oneliner)));
        var pvw = el('div', 'row__preview'); pad.appendChild(pvw); snap4(pvw);
        if (p.status_note) pad.appendChild(el('p', 'row__note', esc(p.status_note)));
        var ac = actions(p); if (ac) pad.appendChild(ac);
        var ob = el('a', 'open-btn', '<span>Open case study</span>'); ob.appendChild(parrow()); ob.href = caseUrl(p.slug); pad.appendChild(ob);
        inner.appendChild(pad); panel.appendChild(inner);
        r.appendChild(bar); r.appendChild(panel); sec.appendChild(r);
        // interactions
        bar.addEventListener('click', function (e) { if (e.target.closest('a')) { go(r); return; } if (r.classList.contains('is-open')) collapse(r); else expand(r); });
        bar.addEventListener('keydown', function (e) {
          if (e.target !== bar) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); r.classList.contains('is-open') ? collapse(r) : expand(r); }
        });
        ob.addEventListener('click', function () { go(r); });
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) collapse(open); });
      var q = new URLSearchParams(location.search).get('open');
      if (q) { /* test hook only */ var t = document.getElementById(q); if (t && t._p) { expand(t); t.scrollIntoView({ block: 'nearest' }); } }
      if (location.hash && !q) { var hh = document.getElementById(location.hash.slice(1)); if (hh) hh.scrollIntoView(); }
    });
  }

  // optional buttons a project asks for (a download, its own website), shown in the open row and on the case page
  function actions(p) {
    if (!p.actions || !p.actions.length) return null;
    var d = el('div', 'acts');
    p.actions.forEach(function (a) { var b = el('a', 'act' + (a.primary ? ' act--primary' : ''), esc(a.label)); b.href = a.url; d.appendChild(b); });
    return d;
  }
  window.projectActions = actions;

  function casePage() {
    var root = document.getElementById('case');
    var slug = new URLSearchParams(location.search).get('p');
    load().then(function (ps) {
      var i = ps.findIndex(function (p) { return p.slug === slug; });
      root.innerHTML = '';
      if (i < 0) { root.appendChild(el('p', '', 'No such project. <a href="index.html#work">Back to the work</a>.')); return; }
      var p = ps[i], pr = ps[i - 1], nx = ps[i + 1];
      return Promise.all([loadMeta(p), pr ? loadMeta(pr) : 0, nx ? loadMeta(nx) : 0]).then(function () {
        var bar0 = el('div', 'case-bar'); var top0 = el('a', 'back'); top0.appendChild(parrow(true)); top0.appendChild(el('span', '', 'INDEX')); top0.href = 'index.html#work'; bar0.appendChild(top0);
        bar0.appendChild(el('span', 'case-bar__t', esc(p.title)));
        function ib(q, left, lbl) { var a = el(q ? 'a' : 'span', 'ibtn' + (q ? '' : ' is-off')); a.appendChild(parrow(left)); a.setAttribute('aria-label', lbl + (q ? ': ' + q.title : '')); if (q) a.href = caseUrl(q.slug); return a; }
        bar0.appendChild(ib(pr, true, 'Previous')); bar0.appendChild(ib(nx, false, 'Next'));
        root.appendChild(bar0);
        var sx = 0, sy = 0, st = 0;
        document.addEventListener('touchstart', function (e) { if (e.touches.length !== 1 || !zoom.hidden || e.target.closest('video,iframe,input')) { st = 0; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = 1; }, { passive: true });
        document.addEventListener('touchend', function (e) { if (!st) return; st = 0; var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; if (Math.abs(dx) < 80 || Math.abs(dy) > 50 || Math.abs(dx) < 2 * Math.abs(dy)) return; var q = dx < 0 ? nx : pr; if (q) location.href = caseUrl(q.slug); }, { passive: true });
        var m = el('div', 'case-body'); root.appendChild(m); snap4(m);
        document.title = p.title + ' · David Hatley';
        applyAccent(root, p.meta); applyFonts(p.meta, './');
                function template() {
        var top = el('div', 'case-top'); var g = glyphSvg(p.glyph); g.style.viewTransitionName = 'glyph-' + p.slug; top.appendChild(g);
        top.appendChild(el('h1', 'case-h', esc(p.title)));
        var tg = tags(p); if (tg) top.appendChild(el('span', '', tg).firstChild);
        top.appendChild(el('span', 'px16 case-n', 'No. ' + String(i + 1).padStart(2, '0') + ' / ' + ps.length));
        m.appendChild(top);
        var hero = el('div', 'case-hero'); hero.style.viewTransitionName = 'hero-' + p.slug; m.appendChild(hero);
        mountPreview(p, hero, 'hero', './');
        var col = el('div', 'case-col');
        col.appendChild(el('p', 'oneliner', esc(p.oneliner)));
        if (p.role) col.appendChild(el('p', '', esc(p.role)));
        if (p.status_note) col.appendChild(el('p', 'ss-plate__cap', esc(p.status_note)));
        (p.body || []).forEach(function (t) { col.appendChild(el('p', '', esc(t))); });
        var s = spec(p.spec); if (s) col.appendChild(s);
        m.appendChild(col);
        var figs = el('div', 'figs');
        (p.media || []).forEach(function (m, k) {
          var f = el('figure', 'ss-plate fig');
          f.appendChild(el('div', 'ss-plate__head', '<span class="ss-label">FIG ' + (k + 1) + ' · ' + esc(p.title).toUpperCase() + '</span>'));
          f.appendChild(media(m, m.caption));
          if (m.caption) f.appendChild(el('figcaption', 'ss-plate__cap', esc(m.caption)));
          figs.appendChild(f);
        });
        m.appendChild(figs);
        var yt = (p.links || []).map(function (l) { var m = /youtube\.com\/watch\?(?:[^#]*&)?v=([\w-]{6,20})/.exec(l.url || ''); return m ? { id: m[1], l: l } : null; }).filter(Boolean);
        yt.forEach(function (y) { var f = el('figure', 'ss-plate fig fig--yt'); f.appendChild(el('div', 'ss-plate__head', '<span class="ss-label">VIDEO · ' + esc(y.l.label).toUpperCase() + '</span>')); var w = el('div', 'yt'); var fr = el('iframe'); fr.src = 'https://www.youtube-nocookie.com/embed/' + y.id; fr.loading = 'lazy'; fr.title = y.l.label || 'Video'; fr.setAttribute('allow', 'accelerometer; encrypted-media; picture-in-picture'); fr.allowFullscreen = true; fr.referrerPolicy = 'strict-origin-when-cross-origin'; w.appendChild(fr); f.appendChild(w); m.appendChild(f); });
        if (p.links && p.links.length) { var ul = el('ul', 'links'); p.links.forEach(function (l) { ul.appendChild(el('li', '', '<a href="' + esc(l.url) + '">' + esc(l.label) + ' &rarr;</a>')); }); m.appendChild(ul); }
        var ac = actions(p); if (ac) m.appendChild(ac);
        }
        var done = function () { template(); };
        var cu = 'previews/' + p.slug + '/case.js';
        fetch(cu, { method: 'HEAD' }).then(function (r) { if (!r.ok) throw 0; return import('./' + cu); }).then(function (mod) {
          try { var c = mod.default(m, { project: p, base: './', meta: p.meta }); if (typeof c === 'function') window.addEventListener('pagehide', c); }
          catch (e) { m.innerHTML = ''; template(); }
        }).catch(function () { m.innerHTML = ''; template(); });
        var pn = el('nav', 'pn'); pn.setAttribute('aria-label', 'More work');
        function link(q, left) {
          if (!q) return el('span');
          var a = el('a'); a.href = caseUrl(q.slug);
          var gg = glyphSvg(q.glyph); gg.style.color = q.meta.accent || ''; var t = el('span', '', esc(q.title));
          if (left) { a.appendChild(parrow(true)); a.appendChild(gg); a.appendChild(t); } else { a.appendChild(t); a.appendChild(gg); a.appendChild(parrow()); }
          a.addEventListener('click', function () { gg.style.viewTransitionName = 'glyph-' + q.slug; });
          return a;
        }
        pn.appendChild(link(pr, true)); pn.appendChild(link(nx, false));
        root.appendChild(pn);
      });
    });
  }
  if (window.PAGE === 'case') casePage(); else home();
  field();
  if (/[?&]grid=1\b/.test(location.search)) gridOverlay();
})();
