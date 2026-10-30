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
  // projects with a bespoke previews/<slug>/case.js; build.py rewrites this line from `ls previews/*/case.js`,
  // so the case page imports only what exists (no HEAD probe, no 404 in the console)
  var CASE_JS = ['anime-pipeline', 'benchlet', 'bonfire', 'fonts', 'gauntlet', 'lmr', 'meguri', 'mise_en_place', 'napkin', 'nibble', 'playdough', 'precision-canvas', 'primitive', 'rack10', 'secret-sauce', 'shuto', 'stem7', 'system-a', 'system-one-mini', 'vaasf']; // build.py: case.js list
  // prev/next on case pages walk one of these orders: the index (the finished work), the lab board, or a parent
  // project and its outputs (anime pipeline -> meguri, shuto; font library -> secret sauce)
  var INDEX = ['anime-pipeline', 'lmr', 'tasty_tunez', 'fonts', 'vaasf'];
  var LAB = ['napkin', 'nibble', 'playdough', 'bonfire', 'mise_en_place', 'rack10', 'system-one-mini', 'system-a', 'benchlet', 'gauntlet', 'primitive', 'precision-canvas']; // build.py: lab order
  // each project has a static share page at case/<slug>/ (build.py), with its own title and link preview
  function caseUrl(slug) { return 'case/' + encodeURIComponent(slug) + '/'; }
  // cross-document view transitions: the font library (fonts/) doesn't opt in, so a transition into it (the fonts
  // case page redirects there with location.replace) gets skipped by the new page and Chrome reports the rejection
  // as an uncaught "Transition was skipped". Skip it ourselves on the way out, and swallow the promises nobody awaits.
  function quietVT(e) {
    var t = e.viewTransition; if (!t) return;
    [t.ready, t.finished, t.updateCallbackDone].forEach(function (q) { if (q && q.catch) q.catch(function () {}); });
    var a = e.activation, to = a && a.entry && a.entry.url ? new URL(a.entry.url).pathname : '';
    if (e.type === 'pageswap' && ((a && a.navigationType === 'replace') || /\/fonts\//.test(to))) t.skipTransition();
  }
  window.addEventListener('pageswap', quietVT); window.addEventListener('pagereveal', quietVT);
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
  if (mk && !mk.firstChild && G.mark) G.mark.forEach(function (r, y) { for (var x = 0; x < 7; x++) if (r[x] === 'X') { var q = document.createElementNS(NS, 'rect'); q.setAttribute('x', x); q.setAttribute('y', y); q.setAttribute('width', 1); q.setAttribute('height', 1); mk.appendChild(q); } });

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
    // reduced motion: no autoplay, the controls instead
    if (/\.mp4$/i.test(m.src)) { var v = el('video'); v.src = m.src; v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('aria-label', m.alt || ''); if (m.poster) v.poster = m.poster;
      if (REDUCED) { v.controls = true; v.preload = 'metadata'; } else v.autoplay = true; return v; }
    return zoomBtn(m, cap);
  }
  // the spec strip, then its sources as a numbered list under it: visible text, so touch and keyboard readers get
  // them too (the title tooltip stays for mouse users)
  function spec(list) {
    if (!list || !list.length) return null;
    var w = el('div', 'spec'), d = el('div', 'ss-spec'), ol = el('ol', 'spec-src'), n = 0;
    list.forEach(function (s) {
      var x = el('span', '', '<i>' + esc(s.label) + '</i> ' + esc(s.value)); d.appendChild(x);
      if (!s.source) return;
      var src = s.source.replace(/~\/Projects\/|\/home\/[^ ]+?\/Projects\//g, ''); n++;
      x.title = 'Source: ' + src; x.appendChild(el('sup', 'spec-n', String(n)));
      ol.appendChild(el('li', '', '<i>' + esc(s.label) + '</i> ' + esc(src)));
    });
    w.appendChild(d); if (n) w.appendChild(ol);
    return w;
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
    // the heading holds the row's toggle: a real button, so the heading stays a heading and the control is native
    var h = el('h3', 'row__title'), b = el('button', 'row__btn'); b.type = 'button';
    b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'pn-' + p.slug);
    b.appendChild(el('span', 'sr-only', esc(p.title)));
    var v = el('span', 'tt'); v.setAttribute('aria-hidden', 'true');
    Array.from(String(p.title)).forEach(function (c) { var q = el('span', 'ch'); q.textContent = c; v.appendChild(q); });
    b.appendChild(v); h.appendChild(b);
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
    if (m.font_weight) node.style.setProperty('--to-w', m.font_weight);   // library faces ship one weight: no synthetic bold
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

  // ---------- home: the instrument panel ----------
  // panel.py renders every tile in its finished state; this only runs them. Each instrument starts when its tile
  // scrolls into view and stops when it leaves (or the tab hides). Under reduced motion nothing runs: the payoff
  // states stay, the clip shows its poster, and hover swaps the name all at once.
  function home() {
    var tiles = [].slice.call(document.querySelectorAll('.tile')); if (!tiles.length) return;
    var still = REDUCED, CELL = function () { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-cell')) || 70; };
    function arm(n) { n.classList.remove('is-armed'); void n.getBoundingClientRect(); n.classList.add('is-armed'); }
    function swapName(t, on) {
      clearInterval(t._swap); t._swap = 0;
      var cs = [].slice.call(t.querySelectorAll('.t-name .ch')).filter(function (c) { return c.textContent !== ' ' && c.classList.contains('ch--on') !== on; });
      if (!on) cs.reverse();   // in left to right, out right to left
      if (still || !cs.length) { cs.forEach(function (c) { c.classList.toggle('ch--on', on); }); return; }
      var i = 0; function tick() { var c = cs[i++]; if (c) c.classList.toggle('ch--on', on); if (i >= cs.length) { clearInterval(t._swap); t._swap = 0; } }
      tick(); t._swap = setInterval(tick, CELL());
    }
    tiles.forEach(function (t) {
      var a = t.querySelector('.t-a'), lk = t.querySelector('.t-link') || a, g = t.querySelector('.t-head .glyph');
      function on() { if (t.classList.contains('is-hot')) return; t.classList.add('is-hot'); FIELD.open = t;
        if (!t._fonts) { t._fonts = 1; applyFonts({ fonts: (t.dataset.fonts || '').split(' ').filter(Boolean) }, './'); }
        if (g && !still) replay(g); swapName(t, true); }
      function off() { t.classList.remove('is-hot'); if (FIELD.open === t) FIELD.open = null; swapName(t, false); }
      a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') on(); });
      a.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && document.activeElement !== lk) off(); });
      lk.addEventListener('focus', function () { if (lk.matches(':focus-visible')) on(); });
      lk.addEventListener('blur', off);
      lk.addEventListener('click', function () { if (g) g.style.viewTransitionName = 'glyph-' + t.id; });
    });
    [].forEach.call(document.querySelectorAll('.cmp'), function (fr) { fr._wipe = wipe(fr, still); });
    // the font library's stylesheet comes with its tile: sixteen specimen faces nobody needs on the first screen
    var fl = document.querySelector('.t-fonts');
    function fontlib() { if (document.querySelector('link[data-fontlib]')) return; var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'fonts/files/fonts.css'; l.dataset.fontlib = '1'; document.head.appendChild(l); }
    if (fl && 'IntersectionObserver' in window) { var fio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { fio.disconnect(); fontlib(); } }, { rootMargin: '400px 0px' }); fio.observe(fl); }
    else fontlib();
    if (still) return;

    // each instrument: start() when visible, stop() when not
    var RUN = {
      'anime-pipeline': function (t) {
        var fr = t.querySelector('.an-frame'), ro = t.querySelector('.an-ro'), scan = t.querySelector('.ro-spark .scan'), lbl = t.querySelector('.ro-scanl');
        var days = JSON.parse(ro.dataset.days || '[]'), idx = days.map(function (d, i) { return d[1] ? i : -1; }).filter(function (i) { return i >= 0; });
        var k = 0, timer = 0, built = false;
        function count(n) { var to = parseInt(n.dataset.count, 10), s = 0, steps = 12; (function f() { s++; n.textContent = Math.round(to * s / steps).toLocaleString('en-US'); if (s < steps) setTimeout(f, CELL()); })(); }
        function step() { var i = idx[k++ % idx.length], d = days[i]; scan.setAttribute('x', i * 10);
          lbl.textContent = d[0] + ' · ' + d[1].toLocaleString('en-US') + ' runs · peak ' + d[2].toLocaleString('en-US') + ' MiB'; timer = setTimeout(step, 1100); }
        return {
          start: function () {
            // the clip loads only once the tile is on screen; until then (and without JS) the two stills stand in
            if (fr._wipe) fr._wipe.play();
            if (!built) { built = true; arm(ro); ro.querySelectorAll('[data-count]').forEach(count); timer = setTimeout(step, 2400); }
            else if (!timer) step();
          },
          stop: function () { if (fr._wipe) fr._wipe.pause(); clearTimeout(timer); timer = 0; }
        };
      },
      lmr: function (t) {
        var b = t.querySelector('.lm'), timer = 0;
        function loop() { arm(b); timer = setTimeout(loop, 7000); }
        return { start: function () { if (!timer) loop(); }, stop: function () { clearTimeout(timer); timer = 0; } };
      },
      tasty_tunez: function (t) {
        var b = t.querySelector('.tz'), songs = [].slice.call(b.querySelectorAll('.tz-song')), k = 0, timer = 0;
        function show() { songs.forEach(function (s, i) { s.hidden = i !== k; }); arm(b); k = (k + 1) % songs.length; timer = setTimeout(show, 6400); }
        return { start: function () { if (!timer) show(); }, stop: function () { clearTimeout(timer); timer = 0; } };
      },
      fonts: function (t) {
        var b = t.querySelector('.ty'), list = b.querySelector('.ty-rows'), nb = b.querySelector('.ty-n b'), strip = [].slice.call(b.querySelectorAll('.ty-strip i'));
        var fams = JSON.parse(b.dataset.fams || '[]'), W = list.children.length, k = 0, timer = 0, alive = false;
        function row(i, on) { var f = fams[i], li = el('li', 'ty-row' + (on ? ' on' : '') + (f[4] ? ' is-px' : ''));
          li.innerHTML = '<span class="ty-i">' + String(i + 1).padStart(2, '0') + '</span><span class="ty-m">' + esc(f[0]) + '<br><i>' + esc(f[1]) + ' · ' + f[2] + '</i></span>';
          var sm = el('span', 'ty-s'); sm.style.fontFamily = '"' + f[0] + '", var(--font-mono)'; sm.textContent = f[3]; li.appendChild(sm); return li; }
        function set() { list.innerHTML = ''; for (var j = 0; j < W; j++) list.appendChild(row((k + j) % fams.length, j === 0));
          nb.textContent = String(k + 1).padStart(2, '0');
          strip.forEach(function (s, j) { var d = (j - k + fams.length) % fams.length; s.className = d === 0 ? 'on' : d < W ? 'w' : ''; }); }
        function next() { var i = (k + 1) % fams.length, f = fams[(i + W - 1) % fams.length];
          var go = function () { if (!alive) return; k = i; set(); timer = setTimeout(next, 1600); };
          (document.fonts && document.fonts.load ? document.fonts.load('32px "' + f[0] + '"', f[3]) : Promise.resolve()).then(go, go); }
        return { start: function () { alive = true; if (!timer) timer = setTimeout(next, 1600); }, stop: function () { alive = false; clearTimeout(timer); timer = 0; } };
      },
      vaasf: function (t) {
        var b = t.querySelector('.va'), rows = [].slice.call(b.querySelectorAll('.va-rows li')), boxes = [].slice.call(b.querySelectorAll('.va-page i')), k = 0, timer = 0;
        function step() { rows.forEach(function (r, i) { r.classList.toggle('on', i === k); }); boxes.forEach(function (x, i) { x.classList.toggle('on', i === k); });
          k = (k + 1) % rows.length; timer = setTimeout(step, 1400); }
        return { start: function () { b.classList.add('is-run'); if (!timer) step(); }, stop: function () { clearTimeout(timer); timer = 0; } };
      }
    };
    var ctl = new Map();
    tiles.forEach(function (t) { if (RUN[t.id]) ctl.set(t, RUN[t.id](t)); });
    var seen = new Set();
    function sync() { ctl.forEach(function (c, t) { if (seen.has(t) && !document.hidden && !document.documentElement.hasAttribute('data-drawing')) c.start(); else c.stop(); }); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); }); sync(); }, { threshold: 0.35 });
      tiles.forEach(function (t) { io.observe(t); });
    }
    document.addEventListener('visibilitychange', sync);
  }

  // the previz wipe: drag (or arrow keys on the hidden range) to move --x. Previz is left of the line, final right.
  // The clip is one file with previz stacked over final, drawn to a canvas each frame, so the halves stay in sync.
  // The clip starts loading about 2 s after the page has loaded, when the browser is idle, or at the first sign of a
  // person if that comes sooner. Save-Data waits for a person. Reduced motion never gets here (home() returns first).
  var awake = false, wakers = [];
  function wake(f) { if (wakers.push(f) > 1) return;
    var evs = ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'scroll'];
    function go() { awake = true; evs.forEach(function (n) { window.removeEventListener(n, go, true); }); wakers.forEach(function (w) { w(); }); wakers = []; }
    evs.forEach(function (n) { window.addEventListener(n, go, { capture: true, passive: true }); });
    var c = navigator.connection; if (c && c.saveData) return;
    function idle() { setTimeout(function () { if (awake) return; if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 1000 }); else go(); }, 2000); }
    if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle, { once: true }); }
  function wipe(fr, still) {
    var r = fr.querySelector('.cmp-r'), x = +r.value, x0 = x, v = null, cv = null, cx = null, raf = 0, drag = false, touched = false, hinted = still;
    function draw() { if (!cx || v.readyState < 2) return; var W = cv.width, H = cv.height, s = Math.round(W * x / 100), k = v.videoWidth / W;   // the phone clip is smaller than the canvas
      cx.drawImage(v, 0, H * k, W * k, H * k, 0, 0, W, H);
      if (s > 0) cx.drawImage(v, 0, 0, s * k, H * k, 0, 0, s, H); }
    function set(n, user) { x = Math.max(0, Math.min(100, n)); if (user) touched = true;
      fr.style.setProperty('--x', x + '%'); r.value = Math.round(x);
      r.setAttribute('aria-valuetext', Math.round(x) + '% previz, ' + (100 - Math.round(x)) + '% final'); if (v && v.paused) draw(); }
    function at(e) { var b = fr.getBoundingClientRect(); return (e.clientX - b.left) / b.width * 100; }
    function hint() { var t0 = 0; (function f(ts) { if (touched) return; t0 = t0 || ts; var k = Math.min(1, (ts - t0) / 1800);
      set(x0 + 22 * Math.sin(k * Math.PI * 2), false); if (k < 1) requestAnimationFrame(f); })(performance.now()); }
    fr.addEventListener('pointerdown', function (e) { if (e.button) return; drag = true; try { fr.setPointerCapture(e.pointerId); } catch (_) {}
      if (e.pointerType === 'mouse') { e.preventDefault(); set(at(e), true); } });
    fr.addEventListener('pointermove', function (e) { if (drag) { fr.classList.add('is-drag'); set(at(e), true); } });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { fr.addEventListener(n, function () { drag = false; fr.classList.remove('is-drag'); }); });
    r.addEventListener('input', function () { set(+r.value, true); });
    function hintLater() { if (!hinted) { hinted = true; setTimeout(function () { requestAnimationFrame(hint); }, 900); } }
    var wanted = false, api = {
      play: function () {
        wanted = true; if (!awake) { wake(function () { if (wanted) api.play(); }); hintLater(); return; }
        if (!v) { v = fr.querySelector('.cmp-v'); v.muted = true; v.preload = 'auto'; v.hidden = false; v.src = window.innerWidth < 640 ? fr.dataset.src.replace('.mp4', '-720.mp4') : fr.dataset.src;
          v.addEventListener('playing', function () { if (cx) return; cv = fr.querySelector('.cmp-c'); cv.hidden = false; cx = cv.getContext('2d'); draw(); }); }
        var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        cancelAnimationFrame(raf); (function f() { draw(); raf = requestAnimationFrame(f); })();
        hintLater();
      },
      pause: function () { wanted = false; if (v) v.pause(); cancelAnimationFrame(raf); raf = 0; }
    };
    return api;
  }

  // ---------- home: the background strip ----------
  // Two small pixel instruments, one canvas pixel per cell. A Fourier series adds odd harmonics to a square wave;
  // single photons land one at a time on a detector and the counts build two-slit fringes. They run only while
  // on screen; under reduced motion each draws its finished state once.
  // The gas chromatograph sits on the bench as a poster, tile-sized. Expand opens the working figure in a modal
  // dialog (native: Esc closes, focus returns); its 870 KB loads then, not before.
  function benchGC() {
    var open = document.querySelector('.bg__gc-open'); if (!open || !window.HTMLDialogElement) return;
    var dk = window.matchMedia('(prefers-color-scheme: dark)'), dlg = null, live = null, h = null;
    function theme() { return document.documentElement.getAttribute('data-theme') || (dk.matches ? 'dark' : 'light'); }
    function sync() { if (live && live.classList.contains('iso')) live.dataset.theme = theme(); }
    function build() {
      dlg = el('dialog', 'gc-dlg'); dlg.setAttribute('aria-labelledby', 'gc-dlg-t');
      dlg.innerHTML = '<div class="gc-dlg__head"><h2 id="gc-dlg-t">Gas chromatograph</h2><button type="button" class="gc-dlg__x">Close</button></div><div class="gc-dlg__body"><div class="gc-live"></div></div>';
      document.body.appendChild(dlg); live = dlg.querySelector('.gc-live');
      dlg.querySelector('.gc-dlg__x').addEventListener('click', function () { dlg.close(); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener('close', function () { document.documentElement.style.overflow = ''; open.focus(); });
      // the figure keeps its own keys; Esc always closes the dialog
      dlg.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); dlg.close(); } }, true);
      import('./gc/gc-embed.mjs').then(function (m) {
        h = m.mountGC(live, { theme: theme() });
        var sv = live.querySelector('svg.gc-svg'); if (sv) sv.setAttribute('role', 'group');   // it holds focusable peaks, so it can't be one image
        // the figure's long disclosure folds under it
        var lg = live.querySelector('.iso-legend');
        if (lg) { var dt = el('details', 'bg__gc-note', '<summary>How this figure is computed</summary>'), body = el('div', 'iso-legend'); body.innerHTML = lg.innerHTML; lg.remove(); dt.appendChild(body); live.parentNode.appendChild(dt); }
      }).catch(function () { live.textContent = 'The figure did not load. Please try again.'; dlg.addEventListener('close', function () { dlg.remove(); dlg = null; }, { once: true }); });
    }
    open.hidden = false;
    open.addEventListener('click', function () {
      if (document.documentElement.hasAttribute('data-drawing')) { var t = document.getElementById('draw-toggle'); if (t) t.click(); }
      if (!dlg) build();
      document.documentElement.style.overflow = 'hidden'; dlg.showModal();
    });
    dk.addEventListener('change', sync);
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  function background() {
    benchGC();
    var figs = [].slice.call(document.querySelectorAll('.bg__fig')); if (!figs.length) return;
    function ink(c, v) { return getComputedStyle(c).getPropertyValue(v).trim() || '#16181d'; }
    var VIZ = {
      fourier: function (f) {
        var c = f.querySelector('canvas'), x = c.getContext('2d'), out = f.querySelector('b'), W = c.width, H = c.height;
        var cx = 26, cy = 32, R = 17, X0 = 60, hist = [], t = 0, n = 1, since = 0;
        function px(a, b) { x.fillRect(Math.round(a), Math.round(b), 1, 1); }
        function ring(a, b, r) { var k = Math.max(12, Math.ceil(r * 6)); for (var i = 0; i < k; i++) { var q = i / k * 2 * Math.PI; px(a + r * Math.cos(q), b + r * Math.sin(q)); } }
        function frame(still) {
          var lo = ink(c, '--rule'), hi = ink(c, '--cobalt-text'), mu = ink(c, '--ink-muted');
          x.clearRect(0, 0, W, H);
          var a = cx, b = cy;
          for (var k = 1; k <= n; k++) { var h = 2 * k - 1, r = R * 4 / (Math.PI * h); x.fillStyle = lo; ring(a, b, r);
            a += r * Math.cos(h * t); b -= r * Math.sin(h * t); }
          x.fillStyle = mu; for (var i = Math.round(a) + 2; i < X0; i += 2) px(i, b);
          x.fillStyle = hi; px(a, b); px(a + 1, b); px(a, b + 1); px(a + 1, b + 1);
          hist.unshift(b); if (hist.length > W - X0) hist.length = W - X0;
          for (var j = 0; j < hist.length; j++) { var y0 = Math.round(hist[j]), y1 = Math.round(j + 1 < hist.length ? hist[j + 1] : hist[j]);
            for (var y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) px(X0 + j, y); }
          out.textContent = String(2 * n - 1);
        }
        return {
          still: function () { n = 8; for (var i = 0; i < W - X0; i++) { t += .045; frame(); } },
          step: function () { t += .045; since++; if (since > 280) { since = 0; n = n >= 8 ? 1 : n + 1; hist.length = 0; } frame(); }
        };
      },
      photons: function (f) {
        var c = f.querySelector('canvas'), x = c.getContext('2d'), out = f.querySelector('b'), W = c.width, H = c.height;
        var cnt = new Uint16Array(W * H), total = 0, seed = 7;
        function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
        function I(u) { var s = 9.5 * u, e = 2.6 * u; var sinc = e === 0 ? 1 : Math.sin(e) / e; return Math.pow(Math.cos(s), 2) * sinc * sinc; }
        function hit() { for (;;) { var u = rnd() * 2 - 1; if (rnd() < I(u)) { var i = Math.min(W - 1, Math.floor((u + 1) / 2 * W)), j = Math.floor(rnd() * H); cnt[j * W + i]++; total++; return; } } }
        function draw() { var hi = ink(c, '--cobalt-text'); x.clearRect(0, 0, W, H); x.fillStyle = hi;
          for (var j = 0; j < H; j++) for (var i = 0; i < W; i++) { var v = cnt[j * W + i]; if (v) { x.globalAlpha = Math.min(1, .35 + .3 * v); x.fillRect(i, j, 1, 1); } }
          x.globalAlpha = 1; out.textContent = total.toLocaleString('en-US'); }
        return {
          still: function () { while (total < 3000) hit(); draw(); },
          step: function () { var k = total < 200 ? 1 : total < 1200 ? 4 : 12; for (var q = 0; q < k; q++) hit();
            if (total > 4200) { cnt.fill(0); total = 0; } draw(); }
        };
      },
      taper: function (f) {
        // A tapered fiber whose waist is coated in carbon nanotubes, a saturable absorber: weak light is soaked up,
        // intense light bleaches the nanotubes and passes. Noisy light in on the left, clean pulses out on the right.
        var c = f.querySelector('canvas'), x = c.getContext('2d'), out = f.querySelector('b'), W = c.width, H = c.height, cy = 32;
        var I = new Float32Array(W), seed = 11, tick = 0, pulses = 0, A = 58, B = 102;
        function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
        function w(i) { if (i < A - 22 || i > B + 22) return 12; if (i >= A && i <= B) return 3; var u = i < A ? (A - i) / 22 : (i - B) / 22; return 3 + 9 * (1 - Math.cos(u * Math.PI)) / 2; }
        var cnt = []; for (var i = A - 4; i <= B + 4; i++) for (var k = 0; k < 2; k++) if (rnd() < .55) cnt.push([i, rnd() < .5 ? -1 : 1, 5 + Math.floor(rnd() * 2)]);
        function adv() { tick++;
          for (var i = W - 1; i > 0; i--) I[i] = I[i - 1];
          I[0] = .12 + .2 * rnd() + (tick % 30 < 2 ? .85 : 0);
          for (var i = A; i <= B; i++) I[i] *= I[i] / (I[i] + .008);
          if (I[W - 1] > .35 && I[W - 2] <= .35) pulses++; }
        function draw() { var lo = ink(c, '--rule'), mu = ink(c, '--ink-muted'), hi = ink(c, '--cobalt-text');
          x.clearRect(0, 0, W, H); x.fillStyle = lo;
          for (var i = 0; i < W; i++) { var h = Math.round(w(i)); x.fillRect(i, cy - h - 1, 1, 1); x.fillRect(i, cy + h + 1, 1, 1); }
          x.fillStyle = mu; cnt.forEach(function (q) { x.fillRect(q[0], cy + q[1] * q[2], 1, 1); });
          x.fillStyle = hi;
          for (var i = 0; i < W; i++) { var v = Math.min(1, I[i]); if (v < .04) continue; var h = Math.max(0, Math.round(v * w(i)));
            x.globalAlpha = .25 + .75 * v; x.fillRect(i, cy - h, 1, 2 * h + 1);
            if (i >= A && i <= B && v > .3) { x.globalAlpha = .5 * v; x.fillRect(i, cy - 4, 1, 1); x.fillRect(i, cy + 4, 1, 1); } }
          x.globalAlpha = 1; out.textContent = pulses.toLocaleString('en-US'); }
        return {
          still: function () { for (var i = 0; i < W * 2; i++) adv(); draw(); },
          step: function () { adv(); adv(); draw(); }
        };
      },
      modelock: function (f) {
        // Twelve longitudinal modes of a laser cavity. With random phases their sum is noise; as the phases lock,
        // the same modes add up to a train of short pulses (the Fourier series again, run backwards).
        var c = f.querySelector('canvas'), x = c.getContext('2d'), out = f.querySelector('b'), W = c.width, H = c.height, N = 12;
        var ph = [], seed = 5, lam = 0, t = 0, hold = 0;
        function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
        function shuffle() { for (var n = 0; n < N; n++) ph[n] = rnd() * 2 * Math.PI; }
        shuffle();
        function draw() { var lo = ink(c, '--rule'), hi = ink(c, '--cobalt-text');
          x.clearRect(0, 0, W, H); x.fillStyle = lo; for (var i = 0; i < W; i += 2) x.fillRect(i, H - 2, 1, 1);
          x.fillStyle = hi;
          for (var i = 0; i < W; i++) { var re = 0, im = 0, q = (i - t) / 53 * 2 * Math.PI;
            for (var n = 0; n < N; n++) { var a = n * q + ph[n] * (1 - lam); re += Math.cos(a); im += Math.sin(a); }
            var v = (re * re + im * im) / (N * N), h = Math.round(v * (H - 6));
            if (h > 0) x.fillRect(i, H - 2 - h, 1, h); }
          out.textContent = Math.round(lam * 100) + '%'; }
        return {
          still: function () { lam = 1; draw(); },
          step: function () { t += 1.5;
            if (lam < 1) lam = Math.min(1, lam + .004); else if (++hold > 150) { hold = 0; lam = 0; shuffle(); }
            draw(); }
        };
      }
    };
    figs.forEach(function (f) {
      var v = VIZ[f.dataset.viz] && VIZ[f.dataset.viz](f); if (!v) return;
      if (REDUCED || !('IntersectionObserver' in window)) { v.still(); return; }
      v.still();   // the resting frame, until it scrolls into view
      var on = false, last = 0;
      function loop(ts) { if (!on) return; if (ts - last > 33) { last = ts; v.step(); } requestAnimationFrame(loop); }
      new IntersectionObserver(function (es) { var vis = es[0].isIntersecting && !document.hidden; if (vis && !on) { on = true; requestAnimationFrame(loop); } else if (!vis) on = false; }, { threshold: .2 }).observe(f);
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

  // the dossier: one header, the same structure on every case page that has `decisions` in its content.
  // Left the finished work (content `work`, else the hero), right a compact sheet: title, one-line result,
  // my decisions and the one thing I changed from the AI's output, what it's built with, outputs, status, links.
  // The project's case.js renders below it as the deep dive. Text David hasn't confirmed carries data-draft.
  var OPENS = { 'anime-pipeline': 1, lmr: 0, tasty_tunez: 0, fonts: 0 };
  var TILE_FACE = { 'anime-pipeline': 1, tasty_tunez: 1 };   // these titles stay in their home tile's face: nothing to step into
  function dossier(p, ps, base) {
    var d = el('section', 'dos'); d.setAttribute('aria-label', p.title + ', summary');
    var w = el('div', 'dos__work' + (p.work_row ? ' dos__work--row' : '')); w.style.viewTransitionName = 'hero-' + p.slug;
    (p.work && p.work.length ? p.work : p.hero ? [p.hero] : []).forEach(function (it) {
      var f = el('figure', 'dos__fig'); f.appendChild(media(it, it.caption));
      if (it.caption) f.appendChild(el('figcaption', '', esc(it.caption)));
      w.appendChild(f);
    });
    // the project's working instrument opens the page: first in the column, or second under a moving clip
    if (OPENS[p.slug] != null) {
      var inst = el('div', 'dos__inst'), probe = el('div'); inst.appendChild(probe);
      w.insertBefore(inst, w.children[OPENS[p.slug]] || null);
      mountPreview(p, probe, 'hero', base).then(function (f) { window.addEventListener('pagehide', f); });
    }
    var s = el('div', 'dos__sheet');
    var id = el('div', 'dos__id'), g = glyphSvg(p.glyph); g.style.viewTransitionName = 'glyph-' + p.slug; id.appendChild(g);
    var h = el('h1', 'dos__h' + (String(p.title).split(' ').some(function (wd) { return wd.length > 6; }) ? ' dos__h--long' : '') + (String(p.title).split(' ').some(function (wd) { return wd.length > 9; }) ? ' dos__h--xl' : ''));   // a long word steps down to 32 so it never breaks mid-word
    h.appendChild(el('span', 'sr-only', esc(p.title)));
    var tt = el('span', 'tt'); tt.setAttribute('aria-hidden', 'true');
    // words hold together; dosHold below keeps each character's box at its final width, so the step moves nothing
    String(p.title).split(/( )/).forEach(function (wd) {
      if (!wd) return;
      if (wd === ' ') { var sp = el('span', 'ch'); sp.textContent = ' '; tt.appendChild(sp); return; }
      // a snake_case name may break after its underscore instead of running off the column
      wd.split(/(?<=_)/).forEach(function (pt) { var wr = el('span', 'w'); Array.from(pt).forEach(function (c) { var q = el('span', 'ch'); q.textContent = c; wr.appendChild(q); }); tt.appendChild(wr); });
    });
    h.appendChild(tt); id.appendChild(h); s.appendChild(id);
    var dr = function (n, on) { if (on) n.setAttribute('data-draft', 'true'); return n; };
    s.appendChild(dr(el('p', 'dos__result', esc(p.result || p.oneliner)), p.result_draft));
    var ls = (p.links || []).filter(function (l) { return l.url; });
    if (ls.length || (p.actions && p.actions.length)) {
      var lk = el('div', 'acts dos__links'), pri = ls.filter(function (l) { return /live|site|demo|play/i.test(l.label); })[0] || ls[0];
      ls.forEach(function (l) {
        var ext = /^https?:/.test(l.url), a = el('a', 'act' + (l === pri ? ' act--primary' : ''), esc(l.label) + (ext ? ' ↗' : ''));
        a.href = l.url; if (ext) { a.target = '_blank'; a.rel = 'noopener'; }
        if (l === pri) lk.insertBefore(a, lk.firstChild); else lk.appendChild(a);
      });
      // an action that repeats a link's address is left out
      (p.actions || []).filter(function (a0) { return !ls.some(function (l) { return l.url === a0.url; }); }).forEach(function (a0) { var b = el('a', 'act', esc(a0.label)); b.href = a0.url; lk.appendChild(b); });
      s.appendChild(lk);
    }
    var outs = (p.outputs || []).map(function (sl) { return ps.filter(function (q) { return q.slug === sl; })[0]; }).filter(Boolean);
    if (outs.length) {
      var ov = el('div', 'dos__out'); ov.appendChild(el('h2', 'dos__k', esc(p.outputs_label || 'Outputs')));
      var ol = el('ul');
      outs.forEach(function (q) {
        var li = el('li'), a = el('a'); a.href = caseUrl(q.slug);
        var og = glyphSvg(q.glyph); a.appendChild(og);   // only the glyph wears the show's own colour
        var gen = (q.spec || []).filter(function (x) { return /generations/.test(x.label); })[0];
        a.appendChild(el('span', '', '<b>' + esc(q.title) + '</b>' + (gen ? '<em>' + esc(gen.value) + ' ' + esc(gen.label) + '</em>' : '')));
        a.appendChild(parrow()); li.appendChild(a); ol.appendChild(li);
        loadMeta(q).then(function () { applyAccent(og, q.meta); });
      });
      ov.appendChild(ol); s.appendChild(ov);
    }
    var dc = p.decisions || {};
    if (dc.items && dc.items.length) {
      var dv = el('div', 'dos__dec'); dv.appendChild(el('h2', 'dos__k', 'My decisions'));
      var ul = el('ul'); dc.items.forEach(function (t) { ul.appendChild(dr(el('li', '', esc(t)), dc.draft)); }); dv.appendChild(ul);
      if (dc.changed) dv.appendChild(dr(el('p', 'dos__ai', '<b>' + esc(dc.changed_label || 'Changed from the AI.') + '</b> ' + esc(dc.changed)), dc.draft));
      s.appendChild(dv);
    }
    // one quiet foot: status, then when and what it's built with on one mono line
    if (p.status_note) s.appendChild(el('p', 'dos__status', esc(p.status_note)));
    s.appendChild(el('p', 'dos__built', [p.when].concat(p.built_with || []).filter(Boolean).map(function (b) { return '<span>' + esc(b) + '</span>'; }).join(' · ')));
    d.appendChild(s); d.appendChild(w);
    // the signature moment: the glyph builds cell by cell (CSS), then the title steps into the project's own face
    var cs = [].slice.call(tt.querySelectorAll('.ch')), k = 0;
    if (TILE_FACE[p.slug]) { /* the glyph still builds; the title is final from the first frame */ }
    else if (REDUCED) cs.forEach(function (c) { c.classList.add('ch--on'); });
    else {
      dosHold(h, cs);
      // short enough that no one reads a half-stepped title
      var dt = Math.min(70, 360 / (cs.length || 1));
      setTimeout(function step() { if (k < cs.length) { cs[k++].classList.add('ch--on'); setTimeout(step, dt); } else cs.forEach(function (c) { c.style.width = ''; }); }, Math.min(480, 70 * (g.childNodes.length + 2)));
    }
    return d;
  }

  // once the title is on the page and its face has loaded, pin each character to its width in that face
  function dosHold(h, cs) {
    function pin() {
      if (!h.isConnected) return requestAnimationFrame(pin);
      var was = cs.map(function (c) { return c.classList.contains('ch--on'); });
      cs[0].classList.add('ch--on'); var f = getComputedStyle(cs[0]); var spec = f.fontWeight + ' ' + f.fontSize + ' ' + f.fontFamily; cs[0].classList.toggle('ch--on', was[0]);
      var go = function () {
        cs.forEach(function (c) { c.classList.add('ch--on'); });
        var ws = cs.map(function (c) { return c.getBoundingClientRect().width; });
        cs.forEach(function (c, i) { c.classList.toggle('ch--on', was[i]); c.style.width = ws[i] + 'px'; });
      };
      var done = false, once = function () { if (!done) { done = true; go(); } };
      if (document.fonts && document.fonts.load) document.fonts.load(spec, 'a').then(once, once);
      setTimeout(once, 500);
    }
    pin();
  }

  function order(ps, p) {
    var by = {}; ps.forEach(function (q) { by[q.slug] = q; });
    var pick = function (l) { return l.map(function (sl) { return by[sl]; }).filter(Boolean); };
    if (INDEX.indexOf(p.slug) >= 0) return pick(INDEX);
    if (LAB.indexOf(p.slug) >= 0) return pick(LAB);
    var par = ps.filter(function (q) { return (q.outputs || []).indexOf(p.slug) >= 0; })[0];
    return par ? pick([par.slug].concat(par.outputs)) : ps;
  }

  function casePage() {
    var root = document.getElementById('case');
    // case/<slug>/ share pages set window.SLUG; case.html?p=<slug> keeps old links working
    var slug = window.SLUG || new URLSearchParams(location.search).get('p');
    // asset prefix for previews and case.js, absolute so it resolves the same under <base> (case/<slug>/) and /review/
    var base = new URL('./', document.baseURI).href;
    if (!window.SLUG && slug) { var cl = document.createElement('link'); cl.rel = 'canonical'; cl.href = base + caseUrl(slug); document.head.appendChild(cl); }
    load().then(function (ps) {
      var i = ps.findIndex(function (p) { return p.slug === slug; });
      root.innerHTML = '';
      if (i < 0) { root.appendChild(el('p', '', 'No such project. <a href="index.html#work">Back to the work</a>.')); return; }
      var p = ps[i], sq = order(ps, p), j = sq.indexOf(p), pr = sq[j - 1], nx = sq[j + 1];
      return Promise.all([loadMeta(p), pr ? loadMeta(pr) : 0, nx ? loadMeta(nx) : 0]).then(function () {
        var bar0 = el('div', 'case-bar'); var top0 = el('a', 'back'); top0.appendChild(parrow(true)); top0.appendChild(el('span', '', 'INDEX')); top0.href = 'index.html#work'; bar0.appendChild(top0);
        bar0.appendChild(el('span', 'case-bar__t', esc(p.title)));
        function ib(q, left, lbl) { var a = el(q ? 'a' : 'span', 'ibtn' + (q ? '' : ' is-off')); a.appendChild(parrow(left)); if (q) { a.setAttribute('aria-label', lbl + ': ' + q.title); a.href = caseUrl(q.slug); } else a.setAttribute('aria-hidden', 'true'); return a; }
        bar0.appendChild(ib(pr, true, 'Previous')); bar0.appendChild(ib(nx, false, 'Next'));
        root.appendChild(bar0);
        var sx = 0, sy = 0, st = 0;
        document.addEventListener('touchstart', function (e) { if (e.touches.length !== 1 || !zoom.hidden || e.target.closest('video,iframe,input')) { st = 0; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = 1; }, { passive: true });
        document.addEventListener('touchend', function (e) { if (!st) return; st = 0; var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; if (Math.abs(dx) < 80 || Math.abs(dy) > 50 || Math.abs(dx) < 2 * Math.abs(dy)) return; var q = dx < 0 ? nx : pr; if (q) location.href = caseUrl(q.slug); }, { passive: true });
        var m = el('div', 'case-body'); root.appendChild(m); snap4(m);
        document.title = p.title + ' · David Hatley';
        applyAccent(root, p.meta); applyFonts(p.meta, base);
        // the shared template; under a dossier (slim) it drops what the dossier already shows: title, hero,
        // status, links and the media that are already in the work column
        function template(slim) {
        var m0 = m; if (slim) m = deep;
        var shown = slim ? (p.work || []).map(function (x) { return x.src; }) : [];
        if (!slim) {
        var top = el('div', 'case-top'); var g = glyphSvg(p.glyph); g.style.viewTransitionName = 'glyph-' + p.slug; top.appendChild(g);
        top.appendChild(el('h1', 'case-h', esc(p.title)));
        var tg = tags(p); if (tg) top.appendChild(el('span', '', tg).firstChild);
        top.appendChild(el('span', 'px16 case-n', 'No. ' + String(j + 1).padStart(2, '0') + ' / ' + sq.length));
        m.appendChild(top);
        var hero = el('div', 'case-hero'); hero.style.viewTransitionName = 'hero-' + p.slug; m.appendChild(hero);
        mountPreview(p, hero, 'hero', base);
        }
        var col = el('div', 'case-col');
        if (!slim) col.appendChild(el('p', 'oneliner', esc(p.oneliner)));
        if (p.role) col.appendChild(el('p', '', esc(p.role)));
        if (p.status_note && !slim) col.appendChild(el('p', 'ss-plate__cap', esc(p.status_note)));
        (p.body || []).forEach(function (t) { col.appendChild(el('p', '', esc(t))); });
        var s = spec(p.spec); if (s) col.appendChild(s);
        m.appendChild(col);
        var figs = el('div', 'figs');
        (p.media || []).filter(function (x) { return shown.indexOf(x.src) < 0; }).forEach(function (m, k) {
          var f = el('figure', 'ss-plate fig');
          f.appendChild(el('div', 'ss-plate__head', '<span class="ss-label">FIG ' + (k + 1) + ' · ' + esc(p.title).toUpperCase() + '</span>'));
          f.appendChild(media(m, m.caption));
          if (m.caption) f.appendChild(el('figcaption', 'ss-plate__cap', esc(m.caption)));
          figs.appendChild(f);
        });
        m.appendChild(figs);
        var yt = (p.links || []).map(function (l) { var m = /youtube\.com\/watch\?(?:[^#]*&)?v=([\w-]{6,20})/.exec(l.url || ''); return m ? { id: m[1], l: l } : null; }).filter(Boolean);
        yt.forEach(function (y) { var f = el('figure', 'ss-plate fig fig--yt'); f.appendChild(el('div', 'ss-plate__head', '<span class="ss-label">VIDEO · ' + esc(y.l.label).toUpperCase() + '</span>')); var w = el('div', 'yt'); var fr = el('iframe'); fr.src = 'https://www.youtube-nocookie.com/embed/' + y.id; fr.loading = 'lazy'; fr.title = y.l.label || 'Video'; fr.setAttribute('allow', 'accelerometer; encrypted-media; picture-in-picture'); fr.allowFullscreen = true; fr.referrerPolicy = 'strict-origin-when-cross-origin'; w.appendChild(fr); f.appendChild(w); m.appendChild(f); });
        if (p.links && p.links.length && !slim) { var ul = el('ul', 'links'); p.links.forEach(function (l) { ul.appendChild(el('li', '', '<a href="' + esc(l.url) + '">' + esc(l.label) + ' &rarr;</a>')); }); m.appendChild(ul); }
        var ac = slim ? null : actions(p); if (ac) m.appendChild(ac);
        m = m0;
        }
        var done = function () { template(); };
        var cu = 'previews/' + p.slug + '/case.js';
        // a project with `decisions` gets the shared dossier header; its case.js renders below it as the deep dive
        // (a project without case.js gets the slim template as its deep dive)
        var deep = m;
        if (p.decisions) { m.appendChild(dossier(p, ps, base)); deep = el('div', 'case-deep'); m.appendChild(deep); }
        if (CASE_JS.indexOf(p.slug) < 0) { template(!!p.decisions); } else import('./' + cu).then(function (mod) {
          try { var c = mod.default(deep, { project: p, base: base, meta: p.meta, opened: OPENS[p.slug] != null }); if (c && typeof c.then === 'function') c.then(function (f) { if (typeof f === 'function') window.addEventListener('pagehide', f); }, function () {}); else if (typeof c === 'function') window.addEventListener('pagehide', c); }
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
  // Drawing mode: a switch in the header and the D key. drawing.js and drawing.css load on first use, not before.
  (function () {
    var head = document.querySelector('.site-head'); if (!head) return;
    var b = el('button', 'draw-t', '<span class="draw-t__tease">see how this page is built</span><span class="draw-t__tease2">see specs</span><span class="draw-t__b"><span>Drawing</span><i aria-hidden="true"></i><kbd>D</kbd></span><span class="sr-only"> mode: redraws this page as a dimensioned engineering sheet</span>'); b.type = 'button'; b.id = 'draw-toggle'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-keyshortcuts', 'd'); b.title = 'Drawing mode (D)';
    head.appendChild(b);
    // the switch says so once a session: one ink pulse (CSS, none under reduced motion)
    try { if (!sessionStorage.getItem('dwg-seen')) { sessionStorage.setItem('dwg-seen', '1'); b.classList.add('draw-t--pulse'); } } catch (e) {}
    var want = false, loading = false, sheet = window.parent !== window && location.hash === '#dwg-sheet';   // the print frame drawing.js opens
    function apply() { var d = window.__drawing; if (d) { if (want) d.on(); else d.off(); } }
    function toggle() {
      want = !want; b.setAttribute('aria-pressed', want ? 'true' : 'false');
      // shareable: #drawing opens the page in this mode; turning it off clears the hash
      if (!sheet && (want ? !location.hash : /^#(drawing|dwg-v[123])$/.test(location.hash))) history.replaceState(null, '', location.pathname + location.search + (want ? '#drawing' : ''));
      if (window.__drawing) return apply();
      if (loading) return; loading = true;
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'drawing.css';
      var s = document.createElement('script'); s.src = 'drawing.js';
      var n = 2; function ready() { if (!--n) apply(); }
      l.onload = l.onerror = ready; s.onload = ready; s.onerror = function () { loading = false; want = false; b.setAttribute('aria-pressed', 'false'); };
      document.head.appendChild(l); document.head.appendChild(s);
    }
    b.addEventListener('click', toggle);
    window.__dwgSheet = sheet; window.__dwgPages = INDEX.concat(LAB);
    if (sheet || /^#(drawing|dwg-v[123])$/.test(location.hash)) toggle();
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && want && document.getElementById('zoom').hidden) { toggle(); return; }
      if ((e.key !== 'd' && e.key !== 'D') || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      var t = e.target; if (t && t.closest && t.closest('input,textarea,select,dialog,[contenteditable],[role=textbox]')) return;
      toggle();
    });
  })();
  if (window.PAGE === 'case') casePage(); else if (window.PAGE !== 'lab') { home(); background(); }
  field();
  if (/[?&]grid=1\b/.test(location.search)) gridOverlay();
})();
