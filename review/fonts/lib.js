(function () {
  var G = window.SAUCE_GLYPHS || {}, NS = 'http://www.w3.org/2000/svg';
  document.querySelectorAll('#mk, [data-mk]').forEach(function (mk) {
    (G.mark || []).forEach(function (r, y) { for (var x = 0; x < 7; x++) if (r[x] === 'X') { var q = document.createElementNS(NS, 'rect');
      q.setAttribute('x', x); q.setAttribute('y', y); q.setAttribute('width', 1); q.setAttribute('height', 1); mk.appendChild(q); } });
  });
  // the door you are standing in reads as current
  var here = location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('.lib-nav a[href$="index.html"]').forEach(function (a) {
    if (new URL(a.href, location.href).pathname.replace(/index\.html$/, '') === here) a.setAttribute('aria-current', 'page');
  });
})();
(function () {
  // directory: plate 0.1 (construction, stepping), the bar (text, size, search, category, view), compare, keys
  var root = document.querySelector('.dx');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var store = { get: function (k) { try { return localStorage.getItem('dx.' + k); } catch (e) { return null; } },
                set: function (k, v) { try { localStorage.setItem('dx.' + k, v); } catch (e) {} } };

  // ---- plate 0.1: one slide at a time, stepped (a built thing changes whole, never fades)
  var slides = [].slice.call(document.querySelectorAll('.dx-hero__slide')), strip = [].slice.call(document.querySelectorAll('.dx-strip__b'));
  var cur = 0, timer = null, play = $('hero-play'), held = false;
  function show(i, focus) {
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.hidden = k !== cur; });
    strip.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === cur)); b.tabIndex = k === cur ? 0 : -1; });
    var s = slides[cur];
    $('hero-no').textContent = String(cur + 1).padStart(2, '0'); $('hero-name').textContent = s.dataset.name; $('hero-ch').textContent = s.dataset.ch;
    if (focus) strip[cur].focus();
  }
  function stop() { clearInterval(timer); timer = null; if (play) { play.textContent = 'Play'; play.setAttribute('aria-pressed', 'false'); } }
  function start() { if (timer || held) return; timer = setInterval(function () { if (!document.hidden) show(cur + 1); }, 2400);
    if (play) { play.textContent = 'Pause'; play.setAttribute('aria-pressed', 'true'); } }
  strip.forEach(function (b, k) {
    b.tabIndex = k === 0 ? 0 : -1;
    b.addEventListener('click', function () { held = true; stop(); show(k); });
    b.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (e.key === 'Home') d = -cur; if (e.key === 'End') d = slides.length - 1 - cur;
      if (d !== undefined) { e.preventDefault(); held = true; stop(); show(cur + d, true); }
    });
  });
  if (play) {
    play.hidden = reduce;
    play.addEventListener('click', function () { if (timer) { held = true; stop(); } else { held = false; start(); } });
  }
  var hero = $('hero');
  if (hero && !reduce && !document.documentElement.closest('[data-motion="still"]') && !document.querySelector('[data-motion="still"]')) {
    hero.addEventListener('pointerenter', function () { if (timer) { clearInterval(timer); timer = null; } });
    hero.addEventListener('pointerleave', function () { if (!held && seen) start(); });
    // it only starts stepping once someone is here (a pointer moves, a wheel turns, a key goes down; never on a programmatic scroll), and only while
    // the plate is on screen; a headless render or a still export keeps slide 01, which reads complete
    var seen = false, wake = function () { if (seen) return; seen = true; ['pointermove', 'wheel', 'keydown', 'touchstart'].forEach(function (t) { removeEventListener(t, wake); }); if (vis) start(); }, vis = true;
    ['pointermove', 'wheel', 'keydown', 'touchstart'].forEach(function (t) { addEventListener(t, wake, { passive: true }); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { vis = e.isIntersecting; if (vis && seen) start(); else if (!vis && timer) { clearInterval(timer); timer = null; } }); }).observe(hero);
  }

  // ---- the bar
  var cards = $('cards'), all = [].slice.call(cards.querySelectorAll('.dx-card')), pv = $('pv'), q = $('q'), count = $('count');
  var size = +(store.get('size') || (innerWidth < 560 ? 32 : 48)), on = {}, n = all.length;
  function lh(s) { return s <= 16 ? 24 : s <= 32 ? 40 : s <= 48 ? 56 : s <= 72 ? 80 : 128; }
  function pressIn(group, btn) { group.querySelectorAll('.seg').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); }); }
  function apply() {
    var t = pv.value, k = 0, term = q.value.trim().toLowerCase(), cats = Object.keys(on).filter(function (c) { return on[c]; });
    all.forEach(function (c) {
      var smp = c.querySelector('.dx-card__sample'); smp.textContent = t || smp.dataset.sample;
      smp.style.fontSize = size + 'px'; smp.style.lineHeight = lh(size) + 'px';
      // name the characters this face does not draw, so a fallback never passes for the face
      var miss = c.querySelector('.dx-card__miss'), have = c.dataset.chars, gone = [];
      if (t) Array.from(new Set(Array.from(t))).forEach(function (ch) { if (ch.trim() && have.indexOf(ch) < 0 && gone.length < 8) gone.push(ch); });
      miss.hidden = !gone.length; miss.textContent = gone.length ? 'Not in this face: ' + gone.join(' ') : '';
      var ok = (!term || c.dataset.name.indexOf(term) >= 0) && (!cats.length || cats.some(function (x) { return c.dataset.cats.split(' ').indexOf(x) >= 0; }));
      c.hidden = !ok; if (ok) k++;
    });
    count.textContent = k + ' of ' + n + ' families' + (cats.length ? ' · ' + cats.join(' + ') : '') + (term ? ' · “' + q.value.trim() + '”' : '');
    $('empty').hidden = k > 0;
    presets.querySelectorAll('.seg').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.text === t)); });
    drawCmp();
  }
  var presets = $('presets');
  presets.addEventListener('click', function (e) { var b = e.target.closest('.seg'); if (!b) return; pv.value = b.dataset.text; apply(); });
  var sz = $('sz');
  sz.querySelectorAll('.seg').forEach(function (b) { if (+b.dataset.size === size) pressIn(sz, b); });
  sz.addEventListener('click', function (e) { var b = e.target.closest('.seg'); if (!b) return; size = +b.dataset.size; store.set('size', size); pressIn(sz, b); apply(); });
  var view = $('view');
  function setView(v) { cards.dataset.view = v; store.set('view', v); view.querySelectorAll('.seg').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === v)); }); }
  view.addEventListener('click', function (e) { var b = e.target.closest('.seg'); if (b) setView(b.dataset.view); });
  if (store.get('view') === 'lines') setView('lines');
  [pv, q].forEach(function (e) { e.addEventListener('input', apply); });
  pv.addEventListener('keydown', function (e) { if (e.key === 'Escape') { pv.value = ''; apply(); } });
  document.querySelectorAll('.dx-chips .chip').forEach(function (b) { b.addEventListener('click', function () { on[b.dataset.cat] = !on[b.dataset.cat]; b.setAttribute('aria-pressed', String(!!on[b.dataset.cat])); apply(); }); });
  $('reset').addEventListener('click', function () { q.value = ''; on = {}; document.querySelectorAll('.dx-chips .chip').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); apply(); });

  // ---- plate 0.2: compare the picked faces on one column, each line measured
  var cmp = $('cmp'), rows = $('cmp-rows');
  function picked() { return all.filter(function (c) { return c.querySelector('.dx-cmp').checked; }); }
  function drawCmp() {
    var p = picked();
    cmp.hidden = p.length < 2; $('cmp-n').textContent = p.length;
    if (p.length < 2) { rows.textContent = ''; if (p.length === 1) count.textContent += ' · pick one more to compare'; return; }
    rows.textContent = '';
    p.forEach(function (c) {
      var smp = c.querySelector('.dx-card__sample'), row = document.createElement('div'); row.className = 'dx-cmp__row';
      row.innerHTML = '<div class="dx-cmp__who ss-label"><b></b><button type="button" class="dx-link ss-label dx-cmp__x">Remove</button></div><div class="dx-cmp__line"><span class="dx-cmp__txt"></span></div><div class="dx-cmp__bar"><i></i><span></span></div>';
      row.querySelector('b').textContent = c.querySelector('.dx-card__name').textContent;
      var tx = row.querySelector('.dx-cmp__txt'); tx.textContent = pv.value || 'Hamburgefonstiv 0123';
      tx.style.fontFamily = smp.style.fontFamily; tx.style.fontSize = size + 'px'; tx.style.lineHeight = lh(size) + 'px'; tx.dataset.grid = c.dataset.grid;
      row.querySelector('.dx-cmp__x').addEventListener('click', function () { c.querySelector('.dx-cmp').checked = false; apply(); });
      rows.appendChild(row);
    });
    var go = function () {
      var w = [].map.call(rows.querySelectorAll('.dx-cmp__txt'), function (t) { return t.getBoundingClientRect().width; }), mx = Math.max.apply(null, w) || 1;
      rows.querySelectorAll('.dx-cmp__bar').forEach(function (b, k) { b.querySelector('i').style.width = (w[k] / mx * 100 * 0.8).toFixed(1) + '%'; b.querySelector('span').textContent = Math.round(w[k]) + ' px'; });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
  }
  cards.addEventListener('change', function (e) { if (e.target.classList.contains('dx-cmp')) apply(); });
  $('cmp-clear').addEventListener('click', function () { all.forEach(function (c) { c.querySelector('.dx-cmp').checked = false; }); apply(); });

  // ---- keys: / types, arrows walk the cards, C picks one to compare
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' && e.target.type !== 'checkbox' || tag === 'textarea' || tag === 'select';
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/' && !typing) { e.preventDefault(); pv.focus(); pv.select(); return; }
    var card = e.target.closest && e.target.closest('.dx-card');
    if (!card || typing) return;
    var vis = all.filter(function (c) { return !c.hidden; }), i = vis.indexOf(card);
    var d = { ArrowDown: 1, ArrowRight: 1, j: 1, ArrowUp: -1, ArrowLeft: -1, k: -1 }[e.key];
    if (d) { e.preventDefault(); var nx = vis[Math.max(0, Math.min(vis.length - 1, i + d))]; nx.querySelector('.dx-card__name').focus(); nx.scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'c' || e.key === 'C') { var b = card.querySelector('.dx-cmp'); b.checked = !b.checked; apply(); }
  });
  apply();
})();
(function () {
  // family page: tester, feature toggles, pixel grid, character inspector
  var out = document.getElementById('tout');
  if (!out) return;
  function press(btn, on) { btn.setAttribute('aria-pressed', String(on)); }
  function only(group, btn) { group.querySelectorAll('.seg').forEach(function (b) { press(b, b === btn); }); }
  var tester = out.closest('.tester'), foot = document.getElementById('tfoot'), grid = tester.dataset.grid === '1';
  var pat = tester.querySelector('pattern'), pp = pat && pat.querySelector('path');
  var size = 72;
  function lh(s) { return grid ? s * 5 / 4 : ({16: 24, 20: 28, 25: 32, 32: 40, 48: 56, 72: 80, 120: 136})[s] || Math.round(s * 1.15); }
  function note() {
    var bits = [size + ' px'];
    if (grid) bits.push(size / 8 + ' px cells');
    tester.querySelectorAll('[data-feat="kern"],[data-feat="calt"]').forEach(function (b) {
      bits.push((b.dataset.feat === 'kern' ? 'kerning ' : 'alternates ') + (b.getAttribute('aria-pressed') === 'true' ? 'on' : 'off')); });
    bits.push('click the text to edit it');
    foot.textContent = bits.join(' · ');
  }
  function setGrid() { if (!pat) return; var c = size / 8; pat.setAttribute('width', c); pat.setAttribute('height', c); pp.setAttribute('d', 'M' + c + ' 0V' + c + 'H0'); }
  tester.querySelectorAll('[data-size]').forEach(function (b) { b.addEventListener('click', function () {
    size = +b.dataset.size; out.style.fontSize = size + 'px'; out.style.lineHeight = lh(size) + 'px'; only(b.parentNode, b); setGrid(); note(); }); });
  tester.querySelectorAll('[data-style]').forEach(function (b) { b.addEventListener('click', function () {
    out.style.fontWeight = b.dataset.style; out.style.fontFamily = b.dataset.family ? '"' + b.dataset.family + '", var(--ff)' : ''; only(b.parentNode, b); }); });
  tester.querySelectorAll('[data-feat]').forEach(function (b) { b.addEventListener('click', function () {
    var on = b.getAttribute('aria-pressed') !== 'true'; press(b, on);
    if (b.dataset.feat === 'grid') tester.classList.toggle('show-grid', on); else tester.classList.toggle('no-' + b.dataset.feat, !on);
    note(); }); });
  tester.querySelectorAll('[data-ground]').forEach(function (b) { b.addEventListener('click', function () {
    var on = b.getAttribute('aria-pressed') !== 'true'; press(b, on);
    var box = tester.querySelector('.tester__box'); if (on) box.setAttribute('data-theme', 'dark'); else box.removeAttribute('data-theme'); }); });
  // on a narrow screen, start at the largest offered size that sets the sample on one line
  (function () {
    var btns = Array.prototype.slice.call(tester.querySelectorAll('[data-size]')).reverse(), ws = out.style.whiteSpace;
    out.style.whiteSpace = 'nowrap';
    for (var k = 0; k < btns.length; k++) { var s = +btns[k].dataset.size; if (s > 72) continue;
      out.style.fontSize = s + 'px'; if (out.scrollWidth <= out.clientWidth || k === btns.length - 1) { out.style.whiteSpace = ws; if (s !== 72) btns[k].click(); else out.style.fontSize = '72px'; break; } }
    out.style.whiteSpace = ws;
  })();
  setGrid();

  // inspector: the selected glyph drawn from its outline with its metrics and advance
  var dataEl = document.getElementById('gdata'), svg = document.getElementById('isvg');
  if (!dataEl || !svg) return;
  var D = JSON.parse(dataEl.textContent), NS = 'http://www.w3.org/2000/svg', by = {};
  D.g.forEach(function (g) { by[g[0].toString(16).toUpperCase().padStart(4, '0')] = g; });
  function el(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function draw(g) {
    var u = D.upm, hi = Math.max(D.asc, D.cap) + u * 0.08, lo = Math.min(D.lo, D.desc || 0) - u * 0.08;
    var w = Math.max(g[2], u * 0.5), pad = (hi - lo - w) / 2, x0 = Math.min(-u * 0.06, -pad + 0), x1 = w + Math.max(u * 0.06, pad);
    if (pad < u * 0.06) { x0 = -u * 0.06; x1 = w + u * 0.06; }
    svg.setAttribute('viewBox', x0 + ' ' + (-hi) + ' ' + (x1 - x0) + ' ' + (hi - lo));
    svg.textContent = '';
    if (D.grid) { var c = u / 8; for (var x = Math.ceil(x0 / c) * c; x <= x1; x += c) svg.appendChild(el('line', {x1: x, x2: x, y1: -hi, y2: -lo, 'class': 'cg'}));
      for (var y = Math.ceil(lo / c) * c; y <= hi; y += c) svg.appendChild(el('line', {x1: x0, x2: x1, y1: -y, y2: -y, 'class': 'cg'})); }
    [D.cap, D.xh, D.desc].forEach(function (y) { if (y) svg.appendChild(el('line', {x1: x0, x2: x1, y1: -y, y2: -y, 'class': 'm'})); });
    svg.appendChild(el('line', {x1: x0, x2: x1, y1: 0, y2: 0, 'class': 'mb'}));
    [0, g[2]].forEach(function (x) { svg.appendChild(el('line', {x1: x, x2: x, y1: -hi, y2: -lo, 'class': 'adv'})); });
    if (g[7]) svg.appendChild(el('path', {d: g[7], transform: 'scale(1 -1)', 'class': 'gl'}));
    svg.setAttribute('aria-label', 'Glyph ' + g[1] + ', advance ' + g[2]);
  }
  function neg(v) { return v < 0 ? '−' + (-v) : String(v); }
  function pick(cp) {
    var g = by[cp]; if (!g) return; draw(g);
    svg.classList.remove('ss-carry'); void svg.getBoundingClientRect(); svg.classList.add('ss-carry');
    document.getElementById('i-ch').textContent = String.fromCodePoint(g[0]);
    document.getElementById('i-cp').textContent = 'U+' + cp;
    document.getElementById('i-nm').textContent = g[1];
    document.getElementById('i-adv').textContent = g[2];
    document.getElementById('i-sb').textContent = neg(g[3]) + ' · ' + neg(g[4]);
    document.getElementById('i-pt').textContent = g[5] + ' · ' + g[6];
  }
  var cur = document.querySelector('.cell[aria-pressed="true"]');
  document.querySelectorAll('.cell').forEach(function (c) { c.addEventListener('click', function () {
    document.querySelectorAll('.cell[aria-pressed]').forEach(function (x) { x.removeAttribute('aria-pressed'); });
    c.setAttribute('aria-pressed', 'true'); pick(c.dataset.cp); }); });
  if (cur) pick(cur.dataset.cp); else pick(Object.keys(by)[0]);
})();
(function () {
  // Stem 7's deep chapters: every figure is drawn from glyphs.json (written from the .s7 sources)
  if (!document.querySelector('[data-s7]')) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ink = 'fill:var(--ink)', faint = 'stroke:var(--rule-faint)', rule = 'stroke:var(--rule)';
  function rows9(r) { return r.length >= 9 ? r : r.concat(Array(9 - r.length).fill('.'.repeat((r[0] || '').length))); }
  function cp(u) { return String.fromCodePoint(parseInt(u, 16)); }
  function cells(parts, o) {
    o = o || {}; var cell = o.cell || 12, H = 9;
    var W = o.cols != null ? o.cols : Math.max.apply(null, parts.map(function (p) { return p.x + (p.rows[0] || '').length; }));
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W * cell + '" height="' + H * cell + '" viewBox="0 0 ' + W * cell + ' ' + H * cell + '" shape-rendering="crispEdges" aria-hidden="true">' + (o.extra || '');
    if (o.grid !== false) {
      for (var x = 0; x <= W; x++) s += '<line x1="' + (x * cell + .5) + '" y1="0" x2="' + (x * cell + .5) + '" y2="' + H * cell + '" style="' + faint + '"/>';
      for (var y = 0; y <= H; y++) s += '<line x1="0" y1="' + (y * cell + .5) + '" x2="' + W * cell + '" y2="' + (y * cell + .5) + '" style="' + faint + '"/>';
    }
    parts.forEach(function (p) { p.rows.forEach(function (r, y) { r.split('').forEach(function (c, x) {
      if (c === 'X') s += '<rect x="' + (p.x + x) * cell + '" y="' + y * cell + '" width="' + cell + '" height="' + cell + '" style="' + (p.style || ink) + '"/>'; }); }); });
    if (o.guides) [0, 3, 7].forEach(function (y) { s += '<line x1="0" y1="' + (y * cell + .5) + '" x2="' + W * cell + '" y2="' + (y * cell + .5) + '" style="stroke:var(--cobalt);stroke-width:1"/>'; });
    return s + '</svg>';
  }
  function gp(g, x, style) { return { x: (x || 0) + (g.l || 0), rows: rows9(g.r), style: style }; }
  function adv(g) { return g.w != null ? g.w : g.l + (g.r[0] || '').length + g.rs; }
  function wrapText(t, w) { var out = [], l = ''; t.split(/\s+/).forEach(function (word) { if ((l + ' ' + word).trim().length > w) { out.push(l); l = word; } else l = (l + ' ' + word).trim(); }); if (l) out.push(l); return out; }
  function tidy(t) { return t.split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { return l[0].toUpperCase() + l.slice(1); }).map(function (l) { return /[.!?:;)]$/.test(l) ? l : l + '.'; }).join(' '); }
  function pressOnly(host, b) { $$('.seg', host).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }

  // the clock and seed strip need no data
  var clock = $('[data-s7="clock"]');
  if (clock) {
    var t = 0, tick = function () { var d = new Date(); clock.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()].map(function (v) { return String(v).padStart(2, '0'); }).join(':'); };
    tick();
    if (!reduced) new IntersectionObserver(function (e) { clearInterval(t); if (e[0].isIntersecting) t = setInterval(tick, 1000); }).observe(clock);
  }
  var seed = $('[data-s7="seed"]');
  if (seed) { var v = +seed.dataset.seed, h = ''; for (var i = 0; i < 16; i++) h += '<i class="' + ((v >> (15 - i)) & 1 ? 'on' : '') + '"></i>'; seed.innerHTML = h; }
  // install tabs and copy buttons
  var tabs = $$('.s7-install [role="tab"]');
  function sel(tb) { tabs.forEach(function (x) { var on = x === tb; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; }); }
  tabs.forEach(function (tb, i) {
    tb.addEventListener('click', function () { sel(tb); });
    tb.addEventListener('keydown', function (e) { var d = { ArrowRight: 1, ArrowLeft: -1, Home: -i, End: tabs.length - 1 - i }[e.key]; if (d === undefined) return;
      var n = tabs[(i + d + tabs.length) % tabs.length]; sel(n); n.focus(); e.preventDefault(); });
  });
  $$('[data-s7-copy]').forEach(function (b) { b.addEventListener('click', function () {
    var text = b.closest('.ss-code').querySelector('pre').textContent;
    var done = function (m) { b.textContent = m; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
    try { navigator.clipboard.writeText(text).then(function () { done('Copied'); }, function () { done('Select and copy'); }); } catch (e) { done('Select and copy'); }
  }); });

  Promise.all([fetch('glyphs.json').then(function (r) { return r.json(); }),
               Promise.all(['400 32px "Stem 7"', '700 32px "Stem 7"', '400 48px "Stem 7 Grid"'].map(function (f) { return document.fonts.load(f).catch(function () {}); }))])
  .then(function (res) {
    var data = res[0], by = { regular: {}, bold: {} };
    ['regular', 'bold'].forEach(function (st) { data[st].forEach(function (g) { by[st][g.n] = g; }); });
    var narrow = innerWidth <= 640;

    // 1.1 the mark, then H x g and the mark on one grid with labelled guide lines
    var mark = by.regular['dh.mark'];
    $('[data-s7="mark"]').innerHTML = cells([{ x: 0, rows: mark.r }], { cell: narrow ? 14 : 20 });
    var parts = [], x = 1;
    ['H', 'x', 'g', 'dh.mark'].forEach(function (n) { var g = by.regular[n]; parts.push(gp(g, x)); x += adv(g) + 1; });
    var c = narrow ? 10 : 20, W = x;
    $('[data-s7="guides"]').innerHTML = '<div style="position:relative;width:' + (W * c + 128) + 'px">' +
      cells(parts, { cell: c, cols: W, guides: true, extra: '<rect x="0" y="' + 7 * c + '" width="' + W * c + '" height="' + 2 * c + '" style="fill:var(--cobalt-tint)"/>' }) +
      [['Cap · 7', 0], ['x-height · 4', 3], ['Baseline', 7], ['Descender · 2', 9]].map(function (a) { return '<span class="ss-label" style="left:' + (W * c + 12) + 'px;top:' + (a[1] * c - 8) + 'px">' + a[0] + '</span>'; }).join('') + '</div>';

    // 1.2 the source
    var picks = [['a', 'a'], ['g', 'g'], ['2', 'two'], ['&', 'ampersand'], ['@', 'at'], ['N', 'N']], host = $('[data-s7-pick="src"]');
    var lab = { 0: 'cap', 3: 'x-height', 6: 'baseline', 8: 'descender' };
    function showSrc(n) {
      var g = by.regular[n];
      var note = g.note ? [].concat.apply([], g.note.split('\n').map(function (l) { return wrapText(l, 46); })).map(function (l) { return '# ' + l; }) : [];
      var head = 'glyph ' + g.n + ' ' + g.u.map(function (u) { return 'U+' + u; }).join(',') + (g.l ? ' lsb=' + g.l : '') + (g.rs !== 1 ? ' rsb=' + g.rs : '');
      $('[data-s7="srctext"]').innerHTML = note.map(function (l) { return '<span class="c">' + esc(l) + '</span>'; }).concat([esc(head)],
        rows9(g.r).map(function (r, i) { return esc(r) + (lab[i] ? '   <span class="c"># ' + lab[i] + '</span>' : ''); })).join('\n');
      $('[data-s7="src"]').innerHTML = cells([gp(g, 1)], { cell: 14, cols: adv(g) + 2, guides: true });
      $('[data-s7="real"]').textContent = cp(g.u[0]);
      $$('.seg', host).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.n === n)); });
    }
    host.innerHTML = picks.map(function (p) { return '<button type="button" class="seg" data-n="' + p[1] + '" aria-label="Show ' + p[1] + '">' + esc(p[0]) + '</button>'; }).join('');
    host.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) showSrc(b.dataset.n); });
    showSrc('a');

    // 1.3 the ladder: H at true size at each step
    $('[data-s7="ladder"]').innerHTML = [16, 32, 48, 72, 120].map(function (s) { var cc = s / 8;
      return '<div class="s7-rung">' + cells([gp(by.regular.H, 0)], { cell: cc, grid: cc >= 6 }) + '<b>' + s + ' px</b><span>' + cc + ' px cells</span></div>'; }).join('');

    // 1.4 the loupe: render in this browser and count pixels that are neither ink nor paper
    var cv = $('[data-s7="loupe"]'), ln = $('[data-s7="loupen"]'), ll = $('[data-s7="loupel"]');
    var off = document.createElement('canvas'), ox = off.getContext('2d', { willReadFrequently: true }), cur = 32;
    function loupe(s) {
      var text = 'Stem 7'; ox.font = '400 ' + s + 'px "Stem 7"';
      var w = Math.ceil(ox.measureText(text).width) + 4, h = Math.ceil(s * 1.25) + 4;
      off.width = w; off.height = h; ox.font = '400 ' + s + 'px "Stem 7"'; ox.textBaseline = 'alphabetic'; ox.fillStyle = '#000';
      ox.fillText(text, 2, 2 + Math.round(s * 7 / 8));
      var px = ox.getImageData(0, 0, w, h).data, grey = 0, solid = 0, cs = getComputedStyle(document.body);
      var col = { ink: cs.getPropertyValue('--ink').trim(), bad: cs.getPropertyValue('--vermilion').trim(), line: cs.getPropertyValue('--rule-faint').trim() };
      var z = Math.max(2, Math.min(14, Math.floor(Math.min(720, cv.parentNode.clientWidth || 720) / w)));
      cv.width = w * z; cv.height = h * z; var g2 = cv.getContext('2d'); g2.clearRect(0, 0, cv.width, cv.height);
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var a = px[(y * w + x) * 4 + 3]; if (!a) continue;
        if (a === 255) { solid++; g2.fillStyle = col.ink; } else { grey++; g2.fillStyle = col.bad; } g2.fillRect(x * z, y * z, z, z); }
      if (z >= 6) { g2.fillStyle = col.line; for (var i = 0; i <= w; i++) g2.fillRect(i * z, 0, 1, cv.height); for (var j = 0; j <= h; j++) g2.fillRect(0, j * z, cv.width, 1); }
      ln.textContent = grey.toLocaleString(); ln.classList.toggle('is-bad', grey > 0);
      ll.textContent = 'grey pixels · ' + solid.toLocaleString() + ' solid ink · ' + s + ' px';
    }
    var lh = $('[data-s7-loupe]');
    lh.addEventListener('click', function (e) { var b = e.target.closest('.seg'); if (!b) return; pressOnly(lh, b); loupe(cur = +b.dataset.v); });
    loupe(cur);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { loupe(cur); });

    // 1.5 Grid gaps: one 3x3 patch per size, zoomed so a cell is 48px, device pixels ruled
    $('[data-s7="gaps"]').innerHTML = [16, 32, 48, 72, 120].map(function (s) {
      var cc = s / 8, gap = s <= 40 ? cc / 2 : cc / 3, z = (narrow ? 32 : 48) / cc, n = 3, W2 = n * cc * z;
      var r = '<svg width="' + W2 + '" height="' + W2 + '" viewBox="0 0 ' + W2 + ' ' + W2 + '" shape-rendering="crispEdges" aria-hidden="true">';
      for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) r += '<rect x="' + x * cc * z + '" y="' + (y * cc + gap) * z + '" width="' + (cc - gap) * z + '" height="' + (cc - gap) * z + '" style="' + ink + '"/>';
      for (var i = 0; i <= n * cc; i++) r += '<line x1="' + (i * z + .5) + '" y1="0" x2="' + (i * z + .5) + '" y2="' + W2 + '" style="' + rule + ';stroke-opacity:.6"/><line x1="0" y1="' + (i * z + .5) + '" x2="' + W2 + '" y2="' + (i * z + .5) + '" style="' + rule + ';stroke-opacity:.6"/>';
      return '<div class="s7-gap">' + r + '</svg><b>' + s + ' px · gap ' + gap + ' px</b><span>' + cc + ' px cells</span></div>';
    }).join('');

    // 1.6 revisions: round 0 beside 1.001
    var revs = [['a', 'a', "Was a cut-corner bowl that read as o. Now it is the mark's square bowl with a spur."],
      ['e', 'e', 'The bar stops short, which opens a 2-cell aperture.'], ['s', 's', 'Corners cut like S, so it stops reading as bold.'],
      ['t', 't', 'Starts a row lower, so t and l stop sharing a height.'], ['0', 'zero', 'The slash read as Ø at 120 px. Now it has a centre dot.'],
      ['2', 'two', 'Was a mirrored S. Now a hooked top and one step per row.'], ['7', 'seven', 'The 2-1-3 staircase looked broken. Now it steps evenly.'],
      ['N', 'N', 'One diagonal cell per row. The old 2-cell steps knotted at the stem.']];
    $('[data-s7="revs"]').innerHTML = revs.filter(function (r) { return data.round0[r[0]]; }).map(function (r) {
      var g = by.regular[r[1]];
      return '<div class="s7-rev"><div class="s7-pair">' + cells([{ x: 0, rows: rows9(data.round0[r[0]]), style: 'fill:var(--ink-muted)' }], { cell: 6, grid: false }) + '<i>→</i>' +
        cells([{ x: 0, rows: rows9(g.r) }], { cell: 6, grid: false }) + '</div><p>' + esc(r[2]) + '</p></div>'; }).join('');

    // 1.7 bold: auto-bold draft beside the drawn glyph, changed cells in cobalt
    var want = ['K', 'N', 'S', 's', 'f', 'two', 'seven', 'ampersand', 'at', 'dollar', 'question', 'asterisk'];
    $('[data-s7="nredrawn"]').textContent = Object.keys(data.drafts).length;
    $('[data-s7="bolds"]').innerHTML = want.filter(function (n) { return data.drafts[n] && by.bold[n]; }).map(function (n) {
      var d = rows9(data.drafts[n]), f = rows9(by.bold[n].r);
      var same = f.map(function (r, y) { return r.split('').map(function (ch, x) { return ch === 'X' && d[y] && d[y][x] === 'X' ? 'X' : '.'; }).join(''); });
      var diff = f.map(function (r, y) { return r.split('').map(function (ch, x) { return ch === 'X' && !(d[y] && d[y][x] === 'X') ? 'X' : '.'; }).join(''); });
      return '<div class="s7-bold"><div class="s7-pair">' + cells([{ x: 0, rows: d, style: 'fill:var(--ink-muted)' }], { cell: 5, grid: false }) + '<i>→</i>' +
        cells([{ x: 0, rows: same }, { x: 0, rows: diff, style: 'fill:var(--cobalt)' }], { cell: 5, grid: false }) + '</div><span>' + esc(cp(by.regular[n].u[0])) + '</span></div>'; }).join('');

    // 1.8 kerning: a pair with kerning off and on, the facing gap on each shared row shaded
    var pairs = [['F', 'a'], ['L', 'T'], ['T', 'o'], ['P', 'period']], kh = $('[data-s7-pick="kern"]');
    function kern(p) {
      var A = by.regular[p[0]], B = by.regular[p[1]], k = data.kern[p[0] + ' ' + p[1]] || [0, null], ra = rows9(A.r), rb = rows9(B.r), cz = narrow ? 9 : 14;
      function fig(kv) { var xb = adv(A) + kv, gap = '';
        for (var y = 0; y < 9; y++) { var ia = ra[y].lastIndexOf('X'), ib = rb[y].indexOf('X'); if (ia < 0 || ib < 0) continue;
          var from = A.l + ia + 1, to = xb + B.l + ib; if (to > from) gap += '<rect x="' + from * cz + '" y="' + y * cz + '" width="' + (to - from) * cz + '" height="' + cz + '" style="fill:var(--cobalt-tint)"/>'; }
        return cells([gp(A, 0), gp(B, xb)], { cell: cz, cols: xb + adv(B), extra: gap }); }
      $('[data-s7="kern"]').innerHTML = '<figure>' + fig(0) + '<figcaption>Kerning off</figcaption></figure><figure>' + fig(k[0]) + '<figcaption>Kerning on · <b>' +
        (k[0] ? (k[0] > 0 ? '+' : '−') + Math.abs(k[0]) + ' cell' + (Math.abs(k[0]) > 1 ? 's' : '') : 'none') + '</b></figcaption></figure>';
      var l = function (n) { return cp(by.regular[n].u[0]); };
      $('[data-s7="kerncap"]').textContent = (k[1] != null ? l(p[0]) + l(p[1]) + ': the average gap over the rows they share is ' + k[1] + ' cells, so it pulls in ' + Math.abs(k[0]) + '.' : '') +
        (p[0] === 'F' && p[1] === 'a' ? ' This is one of the 11 pairs that 1.001 fixed.' : '');
      $$('.seg', kh).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.p === p.join(' '))); });
    }
    kh.innerHTML = pairs.map(function (p) { return '<button type="button" class="seg" data-p="' + p.join(' ') + '">' + esc(cp(by.regular[p[0]].u[0]) + cp(by.regular[p[1]].u[0])) + '</button>'; }).join('');
    kh.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) kern(b.dataset.p.split(' ')); });
    kern(pairs[0]);
  }).catch(function () {});
})();
