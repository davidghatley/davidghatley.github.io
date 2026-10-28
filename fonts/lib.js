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
  tester.querySelectorAll('[data-style]').forEach(function (b) { b.addEventListener('click', function () { out.style.fontWeight = b.dataset.style; only(b.parentNode, b); }); });
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
