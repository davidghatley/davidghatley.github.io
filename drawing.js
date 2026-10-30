/* Drawing mode: redraws the live page as a dimensional-drawing sheet. Loaded by site.js on the first toggle; nothing here
   runs before that. Every number comes from getBoundingClientRect / getComputedStyle at draw time; none is written here.
   The sheet conventions (codes, variable tables, title block, X-box slots, exploded axonometric projection, pen-draw) are
   adapted from dimensional-drawing by Enes Ozturk (MIT): https://github.com/enesozturk/dimensional-drawing.
   Copyright (c) 2026 Enes Ozturk. The measuring engine and the site's inks are this site's own. */
(function () {
  var REV = '7bdae3e'; // build.py: git rev
  var NS = 'http://www.w3.org/2000/svg', root = document.documentElement;
  var LABEL_H = 12, CH = 6.6, PW = 1512, PH = 1046, PANEL = 640, PAD = 76, S2 = 738 / (944 + 152);
  var S = { on: false, dims: [], lazy: [], extras: [], held: [], vids: [] };
  var over, svg, labels, foot, strip, probes, pageStyle, colL, colR, railR, gridHost, legend, stage, occ, nativeRAF;

  function cs(e) { return getComputedStyle(e); }
  function px(v) { return parseFloat(v) || 0; }
  function box(e) { var r = e.getBoundingClientRect(), y = window.scrollY, x = window.scrollX; return { l: r.left + x, r: r.right + x, t: r.top + y, b: r.bottom + y, w: r.width, h: r.height }; }
  function fmt(v) { return String(+(+v).toFixed(2)); }
  function snap(v) { return Math.floor(v) + 0.5; }
  function mk(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function h(t, c, html, p) { var e = document.createElement(t); if (c) e.className = c; if (html != null) e.innerHTML = html; if (p) p.appendChild(e); return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function all(q, r) { return Array.prototype.slice.call((r || document).querySelectorAll(q)); }

  // ---------- human names: the table never shows a CSS class ----------
  var NAMES = [['.ro-spark', 'run sparkline'], ['.ro-vram', 'VRAM bar'], ['.ro-big', 'figure'], ['.ro-k', 'readout label'], ['.ro-axis', 'chart axis'], ['.t-cap', 'caption'], ['.t-res', 'summary'], ['.t-name', 'tile name'], ['.lc__what', 'card text'], ['.lc__track', 'progress track'], ['.lc__t', 'card title'], ['.lc__n', 'card count'], ['.dos__h', 'title'], ['.dos__result', 'result'], ['.dos__out', 'outputs'], ['.dos__dec', 'decisions'], ['.lm-bar', 'token bar'], ['.site-head', 'header'], ['.t-head', 'tile head'], ['.t-body', 'tile body'], ['.t-a,.tile', 'tile'], ['.an-vid', 'clip'], ['.an-frame', 'clip frame'], ['.an-ro', 'run log'],
    ['.ro-cells', 'readout cells'], ['.lm-stats', 'stat pair'], ['.lm-pack', 'context bar'], ['.lab-line', 'lab link'], ['.about', 'about'], ['.ss-prose', 'prose'], ['.bg__body', 'bench'], ['.bg__fig', 'bench figure'],
    ['.bg__id', 'degree'], ['.bg', 'background'], ['.lc__head', 'card head'], ['.lc__foot', 'card foot'], ['.lc__fig', 'card figure'], ['.lc', 'card'], ['.cat__head', 'section head'], ['.lane__cards', 'card row'],
    ['.lane__note', 'section note'], ['.xgrid', 'experiment grid'], ['.board', 'board'], ['.lab-h1,.site-h1', 'H1'], ['.site-sub', 'subline'], ['.pnl', 'panel grid'], ['.panel', 'panel'], ['.site-foot', 'footer'],
    ['.dos__sheet', 'dossier notes'], ['.dos__work', 'dossier work'], ['.dos__id', 'dossier title'], ['.dos__fig', 'dossier figure'], ['.dos', 'dossier'], ['.case-deep', 'deep dive'], ['.hero', 'hero'], ['.tally', 'tally'], ['.pn', 'next and previous'],
    ['figure', 'figure'], ['p', 'paragraph'], ['ul,ol,dl', 'list'], ['section,article', 'section'], ['.glyph', 'glyph'], ['.ss-lockup__mark', 'mark']];
  function nameOf(e) { if (e.matches('.lc--x .lc__head')) return 'experiment head'; if (e.matches('.lc--x')) return 'experiment card'; for (var i = 0; i < NAMES.length; i++) if (e.matches(NAMES[i][0])) return NAMES[i][1]; return 'block'; }

  // ---------- occupancy ----------
  function hit(r, list, pad) { pad = pad || 0; for (var i = 0; i < list.length; i++) { var q = list[i]; if (r.l < q.r + pad && q.l < r.r + pad && r.t < q.b + pad && q.t < r.b + pad) return true; } return false; }
  function inSheet(r) { return r.l >= 2 && r.r <= S.W - 2 && r.t >= 1 && r.b <= S.H - 1 && !hit(r, occ.mask); }
  function lab(cx, cy, w) { return { l: cx - w / 2, r: cx + w / 2, t: cy - LABEL_H / 2, b: cy + LABEL_H / 2 }; }
  function labelFree(r) { return inSheet(r) && !hit(r, occ.labels, 1) && !hit(r, occ.text, 2) && !hit(r, occ.obj, 1) && !hit(r, occ.edge); }
  function clampX(cx, w) { return Math.max(2 + w / 2, Math.min(S.W - 2 - w / 2, cx)); }
  function collectText() { // the same page text a reader sees; a dimension label never lands on it
    var out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), rg = document.createRange(), x = scrollX, y = scrollY;
    while (w.nextNode()) {
      var t = w.currentNode, p = t.parentElement;
      if (!t.textContent.trim() || !p || p.closest('[data-dwg-ui],script,style')) continue;
      var st = cs(p); if (st.visibility === 'hidden' || st.display === 'none') continue;
      rg.selectNodeContents(t); var q = rg.getClientRects();
      for (var i = 0; i < q.length; i++) if (q[i].width > 0) out.push({ l: q[i].left + x, r: q[i].right + x, t: q[i].top + y, b: q[i].bottom + y });
    }
    return out;
  }

  // ---------- drawing primitives ----------
  function delay(ms) { return Math.round(ms); }
  function line(g, x1, y1, x2, y2, cls) { return mk('line', { x1: x1, y1: y1, x2: x2, y2: y2, 'class': cls, pathLength: 1 }, g); }
  function arrow(g, x, y, dx, dy) { var a = 7, b = 2.3; mk('path', { d: 'M' + x + ',' + y + 'L' + (x - dx * a - dy * b) + ',' + (y - dy * a - dx * b) + 'L' + (x - dx * a + dy * b) + ',' + (y - dy * a + dx * b) + 'z', 'class': 'dwg-a' }, g); }
  function group(cls, ms, code) { var g = mk('g', { 'class': cls }, svg); g.style.setProperty('--d', delay(ms) + 'ms'); if (code) g.setAttribute('data-code', code); return g; }
  function dimMs() { return 620 + Math.min(S.count++, 50) * 11; } // after frame, grid, objects and slots: the dimensions, one at a time
  function addLabel(text, r, ms, cls, code) {
    var e = h('span', 'dwg-l' + (cls ? ' ' + cls : ''), esc(text), labels);
    e.style.cssText = 'left:' + r.l + 'px;top:' + r.t + 'px;width:' + (r.r - r.l) + 'px;--d:' + (ms + 260) + 'ms';
    if (code) e.setAttribute('data-code', code);
    occ.labels.push(r); return e;
  }
  function extHits(x, e, y) { if (e == null) return false; var r = { l: x - .5, r: x + .5, t: Math.min(e, y), b: Math.max(e, y) }; return hit(r, occ.text, 0) || hit(r, occ.obj, -1); }
  function extHitsV(y, e, x) { if (e == null) return false; var r = { l: Math.min(e, x) + (x > e ? 3 : 0), r: Math.max(e, x) - (x < e ? 3 : 0), t: y - .5, b: y + .5 }; return hit(r, occ.text, 1) || hit(r, occ.obj, -1); }
  function inRun(e, y, dir) { // carries an extension line on to the feature: into the box, until it would meet type or a picture
    var d = 0; while (d < 32) { var a = e + dir * d, b = e + dir * (d + 4), r = { l: Math.min(a, b), r: Math.max(a, b), t: y - 1, b: y + 1 }; if (hit(r, occ.text) || hit(r, occ.obj)) break; d += 4; } return d;
  }
  function lineCrossesText(r) { return hit(r, occ.text, 1); }
  function placeH(c, x1, x2, ys, e1, e2, opt) {
    opt = opt || {};
    var w = c.text.length * CH + 4, span = x2 - x1, small = span < w + 10, once = c.text + 'h' + Math.round(x1) + ',' + Math.round(x2);
    if (S.once[once]) return false; // dimensioned once; the table's QTY counts the rest
    for (var i = 0; i < ys.length; i++) {
      var y = snap(ys[i]), row = { l: x1 - (small ? 12 : 0), r: x2 + (small ? 12 : 0), t: y - 2, b: y + 2 };
      if (hit(row, occ.h) || row.l < 0 || row.r > S.W || y < 2 || y > S.H - 2 || lineCrossesText(row) || hit(row, occ.mask)) continue;
      if (hit(row, occ.obj) || extHits(x1, e1, y) || extHits(x2, e2, y)) continue; // an extension line never strikes through type
      var pos = null, cands = small ? [x2 + 11 + w / 2, x1 - 11 - w / 2] : [.5, .3, .7, .15, .85].map(function (t) { return x1 + span * t; });
      for (var k = 0; k < cands.length && !pos; k++) { var r = lab(clampX(cands[k], w), y, w); if (labelFree(r)) pos = r; }
      if (!pos) continue;
      var ms = dimMs(), g = group('dwg-d', ms, c.code);
      if (e1 != null) line(g, x1, e1 + (y > e1 ? 2 : -2), x1, y + (y > e1 ? 4 : -4), 'dwg-e');
      if (e2 != null) line(g, x2, e2 + (y > e2 ? 2 : -2), x2, y + (y > e2 ? 4 : -4), 'dwg-e');
      if (span >= 20) { line(g, x1, y, x2, y, 'dwg-m'); arrow(g, x1, y, -1, 0); arrow(g, x2, y, 1, 0); }
      else { line(g, x1 - 11, y, x2 + 11, y, 'dwg-m'); arrow(g, x1, y, 1, 0); arrow(g, x2, y, -1, 0); }
      occ.h.push(row); S.once[once] = 1;
      commit(c, addLabel(c.text, pos, ms, c.word ? 'dwg-l--w' : '', c.code));
      return true;
    }
    return false;
  }
  function placeV(c, y1, y2, xs, e1, e2) {
    var w = c.text.length * CH + 4, span = y2 - y1, small = span < LABEL_H + 12, once = c.text + 'v' + Math.round(y1) + ',' + Math.round(y2);
    if (S.once[once] || (!c.word && S.vspan[Math.round(y1) + ',' + Math.round(y2)])) return false; // one dimension for one span
    for (var i = 0; i < xs.length; i++) {
      var x = snap(xs[i]), col = { l: x - 2, r: x + 2, t: y1 - (small ? 12 : 0), b: y2 + (small ? 12 : 0) };
      if (hit(col, occ.v) || col.l < 2 || col.r > S.W - 2 || hit(col, occ.text, 4) || hit(col, occ.obj) || hit(col, occ.mask)) continue;
      if (extHitsV(y1, e1, x) || extHitsV(y2, e2, x)) continue;
      var pos = null, opts = small ? [[x, y1 - 19], [x, y2 + 19], [x - w / 2 - 5, (y1 + y2) / 2], [x + w / 2 + 5, (y1 + y2) / 2]] : [[x, y1 + span * .5], [x, y1 + span * .3], [x, y1 + span * .7], [x, y1 - 10], [x, y2 + 10], [x + w / 2 + 4, y1 + span * .5], [x - w / 2 - 4, y1 + span * .5]];
      for (var k = 0; k < opts.length && !pos; k++) { var r = lab(clampX(opts[k][0], w), opts[k][1], w); if (labelFree(r)) pos = r; }
      if (!pos) continue;
      var ms = dimMs(), g = group('dwg-d', ms, c.code);
      if (e1 != null) line(g, e1 - (x > e1 ? 1 : -1) * inRun(e1, y1, x > e1 ? -1 : 1), y1, x + (x > e1 ? 4 : -4), y1, 'dwg-e');
      if (e2 != null) line(g, e2 - (x > e2 ? 1 : -1) * inRun(e2, y2, x > e2 ? -1 : 1), y2, x + (x > e2 ? 4 : -4), y2, 'dwg-e');
      if (span >= 20) { line(g, x, y1, x, y2, 'dwg-m'); arrow(g, x, y1, 0, -1); arrow(g, x, y2, 0, 1); }
      else { line(g, x, y1 - 11, x, y2 + 11, 'dwg-m'); arrow(g, x, y1, 0, 1); arrow(g, x, y2, 0, -1); }
      occ.v.push(col); S.once[once] = 1; if (!c.word) S.vspan[Math.round(y1) + ',' + Math.round(y2)] = 1;
      commit(c, addLabel(c.text, pos, ms, c.word ? 'dwg-l--w' : '', c.code));
      return true;
    }
    return false;
  }
  function commit(c, labelEl) { S.use[c.code] = (S.use[c.code] || 0) + 1; if (c.unlisted) { S.extra.push({ code: c.code, value: +fmt(c.value), group: c.group, role: c.role }); return; } if (!c.word) S.dims.push({ code: c.code, value: +fmt(c.value), prop: c.prop, el: c.el, labelEl: labelEl, group: c.group, role: c.role, f: c.f }); }

  // ---------- the variable system ----------
  // Grid: W M COL G B L. Spans: C<k> = k columns. Spacing: S<n>, one code per value, sorted by value. Sizes: H and Z, only
  // for designed sizes. Content heights get the word HUG and no code; widths off the columns get FLEX.
  function visible(e) {
    if (!e || !e.getBoundingClientRect) return false;
    var r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
    var st = cs(e); return st.visibility !== 'hidden' && st.display !== 'none' && st.display !== 'inline';
  }
  var SKIP = '.gc-root,.sr-only,.ch,.tt,.t-link,.case-bar,.dwg-probes,script,style,defs,[hidden],input,.cmp-b,.cmp-l,.cmp-h,.seg,.ibtn,.parrow,.static,#draw-toggle';
  var FIXEDH = '.site-head,.t-head,.lc__head,.cat__head';
  function spanOf(b) { // k if this box is exactly k columns wide and starts on a column line
    var G = S.G, k = Math.round((b.w + G.g) / (G.col + G.g));
    if (k < 1 || k > G.n || Math.abs(k * G.col + (k - 1) * G.g - b.w) > .75) return 0;
    var at = (b.l - G.site.l) / (G.col + G.g); return Math.abs(at - Math.round(at)) * (G.col + G.g) < .75 ? k : 0;
  }
  function tracks(b) {
    var left = b.l + b.w / 2 <= S.W / 2, reach = S.W < 640 ? 200 : 420, out = [];
    if (left && b.l - S.L <= reach) out = out.concat(S.leftTracks);
    if (!left && S.R - b.r <= reach) out = out.concat(S.rightTracks);
    if (!out.length) out = left ? S.leftTracks : S.rightTracks;
    if (b.w > 60) out = out.concat([b.r - 8, b.l + 8, b.r - 28, b.l + 28]); // then open space inside the part; a line that would meet type is refused
    return out;
  }
  function vExt(b, x) { return x < b.l ? b.l : x > b.r ? b.r : null; }
  function rowsFor(b) { return [b.t - 8, b.b + 8, b.t - 20, b.b + 20, b.t + 8, b.b - 8]; }
  function cand(kind, prefix, value, role, group, prop, el, run) { return { kind: kind, prefix: prefix, value: value, role: role, group: group, prop: prop, el: el, run: run }; }
  function cSpan(e, k) {
    return cand('span', 'C' + k, e.getBoundingClientRect().width, k + ' columns', 'SPANS', 'width', e, function (c) {
      var b = box(e), ys = rowsFor(b);
      for (var i = 0; i < ys.length; i++) { var ex = ys[i] < b.t ? b.t : ys[i] > b.b ? b.b : null; if (placeH(c, b.l, b.r, [ys[i]], ex, ex)) return true; }
      return false;
    });
  }
  function cSizeV(e, prefix, role) {
    return cand('size', prefix, e.getBoundingClientRect().height, role, 'SIZES', 'height', e, function (c) {
      var b = box(e), xs = tracks(b);
      for (var i = 0; i < xs.length; i++) { var ex = vExt(b, xs[i]); if (placeV(c, b.t, b.b, [xs[i]], ex, ex)) return true; }
      return false;
    });
  }
  function cSpaceV(e, prop, value, role, y1Fn) { // vertical spacing, carried out to the margin on extension lines
    return cand('space', 'S', value, role, 'SPACING', prop, e, function (c) {
      var q = y1Fn(), xs = tracks(box(e));
      for (var i = 0; i < xs.length; i++) { var b = box(e), ex = vExt(b, xs[i]); if (placeV(c, q[0], q[1], [xs[i]], ex, ex)) return true; }
      return false;
    });
  }
  function cGapH(e, A, B, value, role, code) { // a column gap: drawn on a clear row above or below the pair
    return cand(code ? 'grid' : 'space', code || 'S', value, role, code ? 'GRID' : 'SPACING', 'gap', e, function (c) {
      var a = box(A), q = box(B), t = Math.max(a.t, q.t), bt = Math.min(a.b, q.b);
      return placeH(c, a.r, q.l, [t - 8, bt + 8, t - 20, t + (bt - t) * .5, t + (bt - t) * .25, t + (bt - t) * .75], t, t);
    });
  }
  var mctx;
  function typeOf(e) { // measured type of the first text in this element
    var w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), n = null;
    while (w.nextNode()) { var pt = w.currentNode.parentElement; if (w.currentNode.textContent.trim() && !pt.closest('.sr-only')) { n = w.currentNode; break; } }
    if (!n) return null;
    var rg = document.createRange(); rg.selectNodeContents(n); var q = rg.getClientRects()[0]; if (!q) return null;
    var st = cs(n.parentElement), lh = px(st.lineHeight), fs = px(st.fontSize); if (!lh || !fs) return null;
    mctx = mctx || document.createElement('canvas').getContext('2d'); mctx.font = st.fontWeight + ' ' + st.fontSize + ' ' + st.fontFamily;
    var m = mctx.measureText('H'), asc = m.fontBoundingBoxAscent, cap = m.actualBoundingBoxAscent;
    // the whole line of type: its right end and the box it sits in
    var rs = e.getBoundingClientRect(), y0 = q.top + scrollY, x0 = q.left + scrollX, base = y0 + asc, right = 0; Array.prototype.forEach.call(document.createRange ? (function () { var r2 = document.createRange(); r2.selectNodeContents(e); return r2.getClientRects(); })() : [], function (c) { if (Math.abs(c.top - q.top) < 8) right = Math.max(right, c.right); });
    var mid_ = y0 + (q.bottom - q.top) / 2, rr = (right || q.right) + scrollX;
    occ.text.forEach(function (a) { if (a.t < mid_ && a.b > mid_ && a.l >= rs.left + scrollX - 1 && a.r <= rs.right + scrollX + 1 && a.r > rr) rr = a.r; }); // the real end of the line
    return { el: n.parentElement, lh: lh, fs: fs, cap: cap, base: base, mid: mid_, l: x0, r: rr };
  }
  function cType(e, nm) { // leading, and the cap height as the eye reads it; both carried beside the line of type
    var t = typeOf(e); if (!t) return [];
    var xs = function () { return [t.r + 7, t.r + 26, t.l - 8].concat(tracks({ l: t.l, r: t.r, w: t.r - t.l })); };
    function tryV(c, a, b) { var q = xs(); for (var i = 0; i < q.length; i++) { var ex = q[i] > t.r ? t.r : q[i] < t.l ? t.l : null; if (placeV(c, a, b, [q[i]], ex, ex)) return true; } return false; }
    var out = [];
    out.push(cand('type', 'CAP' + Math.round(t.cap), t.cap, nm + ' cap', 'TYPE', 'height', e, function (c) { c.unlisted = true; return tryV(c, t.base - t.cap, t.base); }));
    out.push(cand('type', 'LH' + Math.round(t.lh), t.lh, nm + ' leading', 'TYPE', 'line-height', t.el, function (c) { return tryV(c, t.mid - t.lh / 2, t.mid + t.lh / 2); }));
    out.push(cand('type', 'T' + Math.round(t.fs), t.fs, nm + ' size', 'TYPE', 'font-size', t.el, function (c) {
      var w = c.text.length * CH + 4, opts = [[t.r + 28 + w, t.mid], [t.r + 56 + w, t.mid], [t.l + 40, t.mid - t.lh / 2 - 8], [t.l + 40, t.mid + t.lh / 2 + 8]];
      for (var i = 0; i < opts.length; i++) { var r = lab(clampX(opts[i][0], w), opts[i][1], w); if (!labelFree(r)) continue;
        var ms = dimMs(), g = group('dwg-d', ms, c.code), ax = Math.min(t.r, r.l - 4); mk('circle', { cx: Math.min(t.r, ax), cy: t.mid, r: 1.5, 'class': 'dwg-dot' }, g); if (opts[i][1] === t.mid) line(g, Math.min(t.r, ax), t.mid, r.l - 1, t.mid, 'dwg-e');
        commit(c, addLabel(c.text, r, ms, '', c.code)); return true; }
      return false;
    }));
    return out;
  }
  function kidsOf(e) { return Array.prototype.filter.call(e.children, function (k) { return visible(k) && !k.matches(SKIP) && cs(k).position !== 'absolute'; }); }
  function whole(v) { return Math.abs(v - Math.round(v)) < .01; }
  // what one block contributes, structure first
  function walk(block, cap, hero) {
    var out = [], q = [[block, 0]], seen = {};
    function push(c) { if (c && out.length < cap) out.push(c); }
    while (q.length && out.length < cap) {
      var it = q.shift(), e = it[0], d = it[1];
      if (!visible(e) || e.matches(SKIP) || e.closest('.case-bar')) continue;
      var r = e.getBoundingClientRect(), sig = [r.left, r.top, r.width, r.height].map(Math.round).join(), dup = seen[sig]; seen[sig] = 1;
      if (/^(IMG|VIDEO|CANVAS)$/.test(e.tagName)) continue;
      if (e.matches('.glyph,.ss-lockup__mark')) { if (!dup) push(cSizeV(e, 'Z', nameOf(e))); continue; }
      if (e.tagName === 'svg') { if (hero && !dup && !e.matches('.parrow') && r.height >= 8) { var sb_ = box(e), sk = spanOf(sb_); push(cSizeV(e, 'H', nameOf(e))); if (sk && sk < S.G.n) push(cSpan(e, sk)); } continue; }
      var st = cs(e), nm = nameOf(e), b = box(e), kids = kidsOf(e);
      if (!dup) {
        var k = spanOf(b); if (k && k < S.G.n && (d === 0 || b.w < block.getBoundingClientRect().width - 1) && b.h >= 16) push(cSpan(e, k));
        if ((e.matches(FIXEDH) || (hero && d > 0 && nm !== 'block' && nm !== 'paragraph')) && whole(b.h) && b.h >= 12) push(cSizeV(e, 'H', nm));
        var pb = px(st.paddingBottom), pt = px(st.paddingTop);
        if (whole(pb) && pb >= 4 && b.h > pb * 2) push(cSpaceV(e, 'padding-bottom', pb, nm + ' bottom', (function (el, p) { return function () { var z = box(el); return [z.b - p, z.b]; }; })(e, pb)));
        if (whole(pt) && pt >= 4 && b.h > pt * 2) push(cSpaceV(e, 'padding-top', pt, nm + ' top', (function (el, p) { return function () { var z = box(el); return [z.t, z.t + p]; }; })(e, pt)));
        var mt = px(st.marginTop), pv = e.previousElementSibling;
        if (whole(mt) && mt >= 4 && visible(pv) && !pv.matches(SKIP) && cs(pv).position !== 'absolute' && Math.abs(r.top - pv.getBoundingClientRect().bottom - mt) < 1)
          push(cSpaceV(e, 'margin-top', mt, 'above ' + nm, (function (el, p) { return function () { var z = box(el); return [z.t - p, z.t]; }; })(e, mt)));
        if (/grid|flex/.test(st.display)) {
          var col = px(st.columnGap), row = px(st.rowGap), val = col || row;
          if (val && whole(val)) for (var i = 0; i + 1 < kids.length; i++) {
            var A = kids[i].getBoundingClientRect(), B = kids[i + 1].getBoundingClientRect();
            if (col && Math.abs(B.left - A.right - col) < 1 && B.top < A.bottom && A.top < B.bottom) { push(cGapH(e, kids[i], kids[i + 1], col, nm + ' gap', Math.abs(col - S.G.g) < .01 ? 'G' : '')); break; }
            if (!col && Math.abs(B.top - A.bottom - row) < 1) { push(cSpaceV(e, 'gap', row, nm + ' gap', (function (a, z) { return function () { return [box(a).b, box(z).t]; }; })(kids[i], kids[i + 1]))); break; }
          }
        }
      }
      if (d < 4) Array.prototype.forEach.call(e.children, function (k) { q.push([k, d + 1]); });
    }
    return out;
  }
  function roots() {
    var main = document.querySelector('main');
    if (window.PAGE === 'case') {
      var r = [], add = function (e, depth) {
        Array.prototype.forEach.call(e.children, function (k) {
          if (!visible(k) || k.matches(SKIP)) return;
          if (depth < 3 && k.getBoundingClientRect().width > main.getBoundingClientRect().width * .9 && kidsOf(k).length >= 1 && k.getBoundingClientRect().height > 900) add(k, depth + 1); else r.push(k);
        });
      };
      add(main, 0); return r.slice(0, 30);
    }
    if (window.PAGE === 'lab') return all('.cat__head,.lc,.board,.xgrid').filter(visible);
    return all('.pnl,.tile,.about,.bg__body').filter(visible);
  }
  // HUG and FLEX: real boxes, drawn, carrying a word and no variable
  function words(blocks) {
    blocks.slice(0, S.W < 640 ? 8 : 24).forEach(function (e) {
      var b = box(e); if (b.h < 60) return;
      var c = { text: 'HUG', word: true }, xs = tracks(b).slice().reverse();
      for (var i = 0; i < xs.length; i++) { var ex = vExt(b, xs[i]); if (placeV(c, b.t, b.b, [xs[i]], ex, ex)) { S.hug++; break; } }
    });
  }

  // ---------- geometry of the page: grid, frame, objects, slots ----------
  function measureGrid() {
    var col = probes.col.getBoundingClientRect().width, g = probes.g.getBoundingClientRect().width, n = Math.round(px(cs(document.querySelector('.site')).getPropertyValue('--n'))) || 12;
    return { col: col, g: g, n: n, site: box(document.querySelector('.site')) };
  }
  function drawGrid(G) {
    // behind the page: the columns never run over type
    gridHost.textContent = ''; gridHost.style.height = S.H + 'px'; gridHost.style.width = S.W + 'px';
    var x = G.site.l; for (var i = 0; i < G.n; i++) { h('i', '', null, gridHost).style.cssText = 'left:' + x + 'px;width:' + G.col + 'px'; x += G.col + G.g; }
  }
  function objects() {
    var g = group('dwg-d dwg-o', 240), seen = {}, n = 0;
    all('.tile,.lc,.about,.cat__head,.dos__sheet,.dos__work,.hero,.tally,.site-foot,.bg__fig,.bg__id,.pn,main section').forEach(function (e) {
      if (n > 70 || !visible(e) || e.closest('.case-bar')) return;
      var b = box(e), key = [b.l, b.t, b.w, b.h].map(Math.round).join(); if (seen[key] || b.w < 24 || b.h < 16) return; seen[key] = 1; n++;
      mk('rect', { x: snap(b.l) - 1, y: snap(b.t) - 1, width: Math.round(b.w) + 1, height: Math.round(b.h) + 1, pathLength: 1, 'class': 'dwg-oo' }, g);
      S.boxes.push(b); occ.edge.push({ l: b.l - 2, r: b.r + 2, t: b.t - 2, b: b.t + 1 }, { l: b.l - 2, r: b.r + 2, t: b.b - 1, b: b.b + 2 }, { l: b.l - 2, r: b.l + 1, t: b.t, b: b.b }, { l: b.r - 1, r: b.r + 2, t: b.t, b: b.b });
    });
    // anything that had a fill on the page is drawn as its outline
    var g2 = group('dwg-d dwg-o2', 340), m = 0;
    all('main .seg, main .lc__track i, main .ty-strip i, main .lm-bar, main .va-page i').forEach(function (e) {
      if (m > 220 || !visible(e)) return; var b = box(e); if (b.w < 3 || b.h < 3) return; m++;
      mk('rect', { x: snap(b.l), y: snap(b.t), width: Math.max(1, Math.round(b.w) - 1), height: Math.max(1, Math.round(b.h) - 1), pathLength: 1, 'class': 'dwg-ot' }, g2);
    });
  }
  function slots() {
    var g = group('dwg-d dwg-s', 420), seen = {}, n = 0;
    all('main .cmp').forEach(function (fr) { if (visible(fr)) wipeSlot(fr, g, seen); });
    all('main img,main video,main canvas,main picture,main .gc-stage').forEach(function (e) {
      if (n > 80 || e.closest('.case-bar') || (e.tagName === 'CANVAS' && e.closest('.gc-stage'))) return;
      var st = cs(e); if (st.display === 'none') return;
      var b = box(e); if (b.w < 16 || b.h < 16) return;
      var key = [b.l, b.t, b.w, b.h].map(Math.round).join(); if (seen[key]) return; seen[key] = 1; n++;
      var x = snap(b.l), y = snap(b.t), w = Math.round(b.w) - 1, hh = Math.round(b.h) - 1;
      mk('rect', { x: x, y: y, width: w, height: hh, pathLength: 1, 'class': 'dwg-sl' }, g);
      line(g, x, y, x + w, y + hh, 'dwg-sx'); line(g, x + w, y, x, y + hh, 'dwg-sx');
      S.slots.push(b); occ.obj.push(b);
      if (w > 110 && hh > 50) {
        var txt = (e.tagName === 'CANVAS' || e.classList.contains('gc-stage') ? 'INSTRUMENT' : e.tagName === 'VIDEO' ? 'VIDEO' : 'IMAGE') + ' ' + Math.round(b.w) + '×' + Math.round(b.h);
        var tw = txt.length * 5.6 + 8, cx = b.l + b.w / 2, cy = b.t + b.h / 2;
        var cap = h('span', 'dwg-l dwg-l--slot', esc(txt), labels); cap.style.cssText = 'left:' + (cx - tw / 2) + 'px;top:' + (cy - 6) + 'px;width:' + tw + 'px;--d:680ms';
      }
    });
    all('main svg:not(.gc-svg),.ss-lockup__mark,main .lm-bar,main .lc__track,main .ty-strip,main .va-page,.ibtn,.tag,#draw-toggle').forEach(function (e) { if (visible(e) || e.tagName === 'svg') { var q = box(e); if (q.w > 0 && q.h > 0) occ.obj.push(q); } });
  }
  function frame(fh) {
    var g = group('dwg-d dwg-f', 0);
    mk('rect', { x: 3.5, y: 3.5, width: S.W - 7, height: fh - 7, pathLength: 1 }, g);
    if (S.W >= 1024) for (var y = 400; y < fh - 100; y += 400) line(g, 3.5, snap(y), 10, snap(y), 'dwg-e');
  }
  // the wipe still works: it moves the line between the two slots it wipes between
  function wipeSlot(fr, g, seen) {
    var b = box(fr), sub = fr.querySelector('.cmp-h'), inner = fr.querySelector('img') || fr, ib = box(inner); seen[[ib.l, ib.t, ib.w, ib.h].map(Math.round).join()] = 1; seen[[b.l, b.t, b.w, b.h].map(Math.round).join()] = 1;
    var parts = {}, y1 = snap(ib.t), y2 = snap(ib.b) - 1, L = snap(ib.l), R = snap(ib.r) - 1;
    function ln(k, c) { parts[k] = line(g, 0, 0, 0, 0, c); }
    ['d1', 'd2', 'd3', 'd4'].forEach(function (k) { ln(k, 'dwg-sx'); }); ln('m', 'dwg-wipe');
    mk('rect', { x: L, y: y1, width: R - L, height: y2 - y1, 'class': 'dwg-sl', pathLength: 1 }, g);
    var grip = mk('circle', { r: 7, 'class': 'dwg-grip' }, g);
    function set(k, a, c, d, e) { var q = parts[k]; q.setAttribute('x1', a); q.setAttribute('y1', c); q.setAttribute('x2', d); q.setAttribute('y2', e); }
    function draw() { if (!sub || !sub.isConnected) return; var hx = snap(box(sub).l); set('d1', L, y1, hx, y2); set('d2', hx, y1, L, y2); set('d3', hx, y1, R, y2); set('d4', R, y1, hx, y2); set('m', hx, y1, hx, y2); grip.setAttribute('cx', hx); grip.setAttribute('cy', (y1 + y2) / 2); }
    draw(); S.wipes.push(draw); S.slots.push(ib); occ.obj.push(ib);
  }
  function onWipe() { S.wipes.forEach(function (f) { f(); }); }
  function refMark(x, y, letter, leaderTo) { // the circle on the plan, its big letter, and a leader when a clear row exists
    var g = group('dwg-d dwg-ref', 560, 'DET-' + letter);
    mk('circle', { cx: x, cy: y, r: 14, pathLength: 1 }, g);
    occ.obj.push({ l: x - 20, r: x + 20, t: y - 20, b: y + 20 });
    var opts = [[x - 26, y - 14], [x + 26, y - 14], [x - 26, y + 14], [x + 26, y + 14], [x, y - 28], [x, y + 28]], placed = false;
    for (var i = 0; i < opts.length && !placed; i++) {
      var r = { l: opts[i][0] - 9, r: opts[i][0] + 9, t: opts[i][1] - 9, b: opts[i][1] + 9 };
      if (inSheet(r) && !hit(r, occ.text, 1) && !hit(r, occ.labels, 1)) { var e = h('span', 'dwg-tag', letter, labels); e.style.cssText = 'left:' + r.l + 'px;top:' + r.t + 'px;--d:560ms'; e.setAttribute('data-code', 'DET-' + letter); occ.labels.push(r); placed = true; }
    }
    if (leaderTo == null) return null;
    var ys = [y - 6, y - 14, y + 6, y, y + 14, y - 20];
    for (var k = 0; k < ys.length; k++) {
      var row = { l: leaderTo, r: x - 14, t: ys[k] - 1, b: ys[k] + 1 };
      if (hit(row, occ.text, 1)) continue;
      var yy = snap(ys[k]); line(g, leaderTo, yy, x - 13, yy, 'dwg-lead'); if (yy !== y) line(g, x - 13, yy, x - 10, y, 'dwg-lead');
      occ.h.push({ l: leaderTo, r: x - 14, t: yy - 2, b: yy + 2 });
      return yy;
    }
    return null;
  }

  // ---------- details ----------
  function junctionPair() { // two neighbours and the gap between them
    var pairs = [['.tile.t-lmr', '.tile.t-tasty_tunez'], ['.lc:nth-child(1)', '.lc:nth-child(2)'], ['.dos__sheet', '.dos__work'], ['.tile.t-anime-pipeline', '.tile.t-lmr']];
    for (var i = 0; i < pairs.length; i++) { var a = document.querySelector(pairs[i][0]), b = document.querySelector(pairs[i][1]); if (visible(a) && visible(b)) return [a, b]; }
    var m = document.querySelector('main'), k = kidsOf(m); return [k[0] || m, k[1] || k[0] || m]; // a case page still mounting
  }
  function ruleOf(e) { // the object line at the top of a box: its border, or the 1px rule the tiles draw with a pseudo-element
    var bw = px(cs(e).borderTopWidth); if (bw) return { w: bw, how: 'border' };
    var bf = getComputedStyle(e, '::before'); if (bf.content !== 'none' && px(bf.height) && px(bf.height) < 4) return { w: px(bf.height), how: 'rule' };
    return { w: 0, how: 'none' };
  }
  function detailJunction(pair) {
    if (box(pair[1]).b <= box(pair[0]).t + 1) pair = [pair[1], pair[0]]; // stacked in reverse order at this width
    var A = box(pair[0]), B = box(pair[1]), across = B.l >= A.r - 1, gap = Math.max(0, across ? B.l - A.r : B.t - A.b), ra = ruleOf(pair[0]), rb = ruleOf(pair[1]);
    var D = 152, c = D / 2, M = 4, sv = mk('svg', { viewBox: '0 0 ' + D + ' ' + D, 'class': 'dwg-dsvg', role: 'img', 'aria-label': 'Where two blocks meet, magnified' });
    var cp = mk('clipPath', { id: 'dwgclipA' }, mk('defs', {}, sv)); mk('circle', { cx: c, cy: c, r: c - 1 }, cp);
    var g = mk('g', { 'clip-path': 'url(#dwgclipA)' }, sv), bPx = probes.b.getBoundingClientRect().width;
    var cx = across ? A.r + gap / 2 : A.l + 8, cy = across ? Math.max(A.t, B.t) + 8 : A.b + gap / 2; // page point at the circle's centre
    var X = function (x) { return c + (x - cx) * M; }, Y = function (y) { return c + (y - cy) * M; };
    for (var k = -12; k <= 12; k++) { var lx = Math.round(cx / bPx + k) * bPx, ly = Math.round(cy / bPx + k) * bPx; line(g, X(lx), 0, X(lx), D, 'dwg-lat'); line(g, 0, Y(ly), D, Y(ly), 'dwg-lat'); }
    if (across) {
      mk('rect', { x: X(A.r), y: 0, width: gap * M, height: D, 'class': 'dwg-gapf' }, g);
      var top = Math.max(A.t, B.t);
      // both blocks' real edges, as thin object lines, whether or not they carry a rule
      mk('path', { d: 'M0,' + Y(top) + 'H' + X(A.r) + 'V' + D, 'class': 'dwg-edge' }, g); mk('path', { d: 'M' + D + ',' + Y(top) + 'H' + X(B.l) + 'V' + D, 'class': 'dwg-edge' }, g);
      if (ra.w) mk('rect', { x: 0, y: Y(top), width: X(A.r), height: ra.w * M, 'class': 'dwg-fill' }, g);
      if (rb.w) mk('rect', { x: X(B.l), y: Y(top), width: D, height: rb.w * M, 'class': 'dwg-fill' }, g);
      if (ra.how === 'border') mk('rect', { x: X(A.r) - ra.w * M, y: Y(top), width: ra.w * M, height: D, 'class': 'dwg-fill' }, g);
      if (rb.how === 'border') mk('rect', { x: X(B.l), y: Y(top), width: rb.w * M, height: D, 'class': 'dwg-fill' }, g);
      var af = getComputedStyle(pair[1], '::after');
      if (af.content !== 'none' && px(af.width)) { var hx = B.l + px(af.left); mk('rect', { x: X(hx), y: Y(top), width: px(af.width) * M, height: D, 'class': 'dwg-rule' }, g); }
    } else {
      mk('rect', { x: 0, y: Y(A.b), width: D, height: gap * M, 'class': 'dwg-gapf' }, g);
      if (rb.w) mk('rect', { x: 0, y: Y(B.t), width: D, height: rb.w * M, 'class': 'dwg-fill' }, g);
    }
    mk('circle', { cx: c, cy: c, r: c - 1, 'class': 'dwg-ring' }, sv);
    var tl = mk('text', { x: c, y: across ? D - 20 : c + 4, 'class': 'dwg-dt', 'text-anchor': 'middle' }, sv); tl.textContent = 'G';
    var L = ra.w || rb.w, ll = null;
    if (L) { ll = mk('text', { x: 30, y: Math.max(26, Math.min(D - 26, across ? Y(Math.max(A.t, B.t)) - 6 : Y(B.t) - 6)), 'class': 'dwg-dt' }, sv); ll.textContent = 'L'; }
    var off = across ? (A.r + gap / 2) % bPx : A.b % bPx;
    return { key: 'DET-A', svg: sv, labelG: tl, labelL: ll, L: L, ruleEl: ra.w ? pair[0] : pair[1], ruleHow: (ra.w ? ra : rb).how, gap: gap, rawEl: pair[0].parentElement, short: 'A JOIN: ' + nameOf(pair[0]).replace('dossier ', '').toUpperCase() + ' + ' + nameOf(pair[1]).replace('dossier ', '').toUpperCase(), title: 'DETAIL A · ' + (nameOf(pair[0]).replace('dossier ', '') + ' MEETS ' + nameOf(pair[1]).replace('dossier ', '')).toUpperCase(),
      caption: 'SCALE ' + M + ':1. GAP ' + fmt(gap) + ', ' + fmt(gap / bPx) + '·B. LINE ' + fmt(L) + ' (' + (ra.w ? ra : rb).how.toUpperCase() + '). EDGES ' + (A.r % bPx === 0 || !across ? 'ON' : 'OFF') + ' THE ' + fmt(bPx) + ' PX LATTICE.' };
  }
  function detailCell(glyph) {
    var D = 152, c = D / 2, vb = glyph.viewBox.baseVal, gb = glyph.getBoundingClientRect(), unit = gb.width / (vb.width || 1);
    var rects = all('rect', glyph), M = Math.max(2, 92 / (vb.width * unit));
    var sv = mk('svg', { viewBox: '0 0 ' + D + ' ' + D, 'class': 'dwg-dsvg', role: 'img', 'aria-label': 'Glyph cells on the 4 pixel grid' });
    var cp = mk('clipPath', { id: 'dwgclipB' }, mk('defs', {}, sv)); mk('circle', { cx: c, cy: c, r: c - 1 }, cp);
    var g = mk('g', { 'clip-path': 'url(#dwgclipB)' }, sv), ox = c - vb.width * unit * M / 2, oy = c - vb.height * unit * M / 2, bPx = probes.b.getBoundingClientRect().width;
    for (var i = -8; i < 24; i++) { line(g, ox + i * bPx * M, 0, ox + i * bPx * M, D, 'dwg-lat'); line(g, 0, oy + i * bPx * M, D, oy + i * bPx * M, 'dwg-lat'); }
    var pick = rects[0];
    rects.forEach(function (r) { mk('rect', { x: ox + r.x.baseVal.value * unit * M, y: oy + r.y.baseVal.value * unit * M, width: r.width.baseVal.value * unit * M, height: r.height.baseVal.value * unit * M, 'class': r === pick ? 'dwg-cell' : 'dwg-fill' }, g); });
    mk('circle', { cx: c, cy: c, r: c - 1, 'class': 'dwg-ring' }, sv);
    var w = pick.getBoundingClientRect().width;
    var tx = mk('text', { x: ox + pick.x.baseVal.value * unit * M + w * M / 2, y: oy + pick.y.baseVal.value * unit * M - 6, 'class': 'dwg-dt', 'text-anchor': 'middle' }, sv); tx.textContent = 'CELL';
    var bl = mk('text', { x: 76, y: 146, 'class': 'dwg-dt', 'text-anchor': 'middle' }, sv); bl.textContent = 'B';
    return { key: 'DET-B', svg: sv, label: tx, labelB: bl, el: pick, w: w, short: 'B GLYPH CELL', title: 'DETAIL B · GLYPH CELL', caption: 'SCALE ' + fmt(M) + ':1. CELL = ' + fmt(w) + ' = ' + fmt(w / bPx) + '·B. B = ' + fmt(bPx) + '.' };
  }
  function detailFig(d) { var f = h('figure', 'dwg-det'); f.setAttribute('data-code', d.key); h('span', 'dwg-tag dwg-tag--fig', d.key.slice(-1), f); f.appendChild(d.svg); h('figcaption', '', '<b class="dwg-long">' + esc(d.title) + '</b><b class="dwg-short">' + esc(d.short) + '</b><span>' + esc(d.caption) + '</span>', f); return f; }

  // ---------- exploded axonometric: the real layout, lifted into its layers ----------
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 'S'); }
  function axo(G, large) {
    var hc = Math.min(S.H, S.W * (large ? .62 : .95)), phone = large && S.W < 640, s = (large ? 760 : 560) / S.W, Z = phone ? 230 : large ? 130 : 190, inH = function (b) { return b.t < hc; };
    var long = function (r) { return Math.max(r.r - r.l, r.b - r.t) > 60; }, dh = occ.h.filter(long), dv = occ.v.filter(long);
    var tops = S.boxes.filter(function (b) { return !S.boxes.some(function (q) { return q !== b && q.l <= b.l + 1 && q.r >= b.r - 1 && q.t <= b.t + 1 && q.b >= b.b - 1 && q.w * q.h > b.w * b.h; }); });
    var nowText = occ.text.filter(function (t) { return t.t < hc && t.b - t.t > 6; }), inner = all('main .t-head,main .t-body > *,main .ro-k,main .ro-big,main .ro-cells > *,main .lm-pack,main .lm-stats > *,main .lc__head,main .lc__fig,main .lc__what,main .lc__foot,main .dos__id,main .dos__result,main .dos__out,main .dos__dec').filter(visible).map(box).filter(inH);
    var svgsAll = all('main svg:not(.parrow)').filter(visible).map(box).filter(inH), slotIn = S.slots.filter(inH);
    var names = [['L4', 'OVERLAY', (dh.filter(inH).length + dv.filter(inH).length) + ' LONG DIMENSIONS'], ['L3', 'INSTRUMENTS', plural(slotIn.length, 'SLOT') + ', ' + plural(svgsAll.length, 'MARK')], ['L2', 'TILES', plural(tops.filter(inH).length, 'BLOCK') + ', ' + plural(inner.length, 'PART')], ['L1', 'PAGE', G.n + ' COLUMNS, ' + nowText.length + ' TEXT RUNS'], ['L0', 'CANVAS FIELD', '16 PX CELLS']];
    function P(x, y, z) { return [.94 * s * x - .34 * s * y, .17 * s * x + .47 * s * y - z]; }
    var cx = [[0, 0], [S.W, 0], [S.W, hc], [0, hc]], xs = [], ys = [];
    for (var i = 0; i < 5; i++) cx.forEach(function (q) { var p = P(q[0], q[1], i * Z); xs.push(p[0]); ys.push(p[1]); });
    var minX = Math.min.apply(0, xs), maxX = Math.max.apply(0, xs), minY = Math.min.apply(0, ys), maxY = Math.max.apply(0, ys), LP = phone ? 12 : large ? 280 : 196;
    var vbW = maxX - minX + LP + 16, vbH = maxY - minY + 24, tx = -minX + LP, ty = -minY + 12;
    var sv = mk('svg', { viewBox: '0 0 ' + vbW + ' ' + vbH, 'class': 'dwg-axo', role: 'img', 'aria-label': 'Exploded view of the page: canvas field, page, tiles, instruments and overlay, drawn from the real layout' });
    var mtx = function (z) { return 'matrix(' + [.94 * s, .17 * s, -.34 * s, .47 * s, tx, ty - z].join(' ') + ')'; };
    var plates = []; function layer(z) { var g = mk('g', { transform: mtx(z) }, sv); plates.push({ g: g, z: z }); mk('rect', { x: 0, y: 0, width: S.W, height: hc, 'class': 'dwg-ax-plate' }, g); return g; }
    function rect(g, b, cls) { if (b.t < hc) mk('rect', { x: b.l, y: b.t, width: b.w, height: Math.min(b.h, hc - b.t), 'class': cls }, g); }
    var g0 = layer(0);
    for (var yy = 32; yy < hc; yy += 64) for (var xx = 32; xx < S.W; xx += 64) mk('rect', { x: xx, y: yy, width: 16, height: 16, 'class': (xx < G.site.l || xx > G.site.r) ? 'dwg-ax-f' : 'dwg-ax-f2' }, g0);
    var g1 = layer(Z), x = G.site.l;
    for (var c = 0; c < G.n; c++) { mk('rect', { x: x, y: 0, width: G.col, height: hc, 'class': 'dwg-ax-col' }, g1); x += G.col + G.g; }
    nowText.forEach(function (t) { mk('rect', { x: t.l, y: t.t + (t.b - t.t) * .2, width: t.r - t.l, height: (t.b - t.t) * .6, 'class': 'dwg-ax-t' }, g1); });
    var g2 = layer(Z * 2); inner.forEach(function (b) { rect(g2, b, 'dwg-ax-p'); }); tops.forEach(function (b) { rect(g2, b, 'dwg-ax-b'); });
    var g3 = layer(Z * 3); svgsAll.forEach(function (b) { rect(g3, b, 'dwg-ax-m'); }); S.slots.forEach(function (b) { if (b.t >= hc) return; rect(g3, b, 'dwg-ax-s'); var bb = Math.min(b.b, hc); mk('line', { x1: b.l, y1: b.t, x2: b.r, y2: bb, 'class': 'dwg-ax-x' }, g3); mk('line', { x1: b.r, y1: b.t, x2: b.l, y2: bb, 'class': 'dwg-ax-x' }, g3); });
    var g4 = layer(Z * 4);
    S.dims.forEach(function (d) { var q = d.labelEl && d.labelEl.closest && d.labelEl.closest('.dwg-labels') && d.labelEl.getBoundingClientRect(); if (!q) return; var ly = q.top + scrollY; if (ly >= hc) return; mk('rect', { x: q.left + scrollX - 4, y: ly - 4, width: q.width + 8, height: q.height + 8, 'class': 'dwg-ax-lb' }, g4); });
    dh.forEach(function (r) { if (r.t < hc) mk('line', { x1: r.l, y1: (r.t + r.b) / 2, x2: r.r, y2: (r.t + r.b) / 2, 'class': 'dwg-ax-d' }, g4); });
    dv.forEach(function (r) { if (r.t < hc) mk('line', { x1: (r.l + r.r) / 2, y1: r.t, x2: (r.l + r.r) / 2, y2: Math.min(r.b, hc), 'class': 'dwg-ax-d' }, g4); });
    var chrome = mk('g', { 'class': 'dwg-ax-chrome' }, sv);
    for (var k = 0; k < 4; k++) [[0, 0], [S.W, 0], [S.W, hc], [0, hc]].forEach(function (q) { var a = P(q[0], q[1], k * Z), b = P(q[0], q[1], (k + 1) * Z); mk('line', { x1: a[0] + tx, y1: a[1] + ty, x2: b[0] + tx, y2: b[1] + ty, 'class': 'dwg-ax-c' }, chrome); });
    names.forEach(function (n, j) {
      var z = (4 - j) * Z, p = P(0, hc * .5, z), px_ = p[0] + tx, py = p[1] + ty, lx = phone ? 12 : LP - 20;
      if (phone) { var pt = mk('text', { x: lx, y: py - Z * .42, 'class': 'dwg-ax-n dwg-ax-n--p' }, chrome); pt.textContent = n[0] + ' · ' + n[1]; var pu = mk('text', { x: lx, y: py - Z * .42 + 32, 'class': 'dwg-ax-u dwg-ax-u--p' }, chrome); pu.textContent = n[2]; return; }
      mk('polyline', { points: px_ + ',' + py + ' ' + (lx + 8) + ',' + py, 'class': 'dwg-ax-lead' }, chrome);
      mk('circle', { cx: px_, cy: py, r: 2, 'class': 'dwg-ax-dot' }, chrome);
      var t = mk('text', { x: lx, y: py - 2, 'text-anchor': 'end', 'class': 'dwg-ax-n' + (large ? ' dwg-ax-n--l' : '') }, chrome); t.textContent = n[0] + ' · ' + n[1];
      var u = mk('text', { x: lx, y: py + (large ? 19 : 15), 'text-anchor': 'end', 'class': 'dwg-ax-u' + (large ? ' dwg-ax-u--l' : '') }, chrome); u.textContent = n[2];
    });
    if (large) sv.__lift = function () { // the plates lift apart from the plan
      var fit = Math.min(vbW / S.W, vbH / hc) * .86, M0 = [fit, 0, 0, fit, (vbW - S.W * fit) / 2 + LP / 3, (vbH - hc * fit) / 2], ease = function (u) { return u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; };
      function frame(t) { plates.forEach(function (pl, i) { var u = ease(Math.max(0, Math.min(1, (t - (4 - i) * .07) / .72))), M1 = [.94 * s, .17 * s, -.34 * s, .47 * s, tx, ty - pl.z]; pl.g.setAttribute('transform', 'matrix(' + M0.map(function (a, k) { return a + (M1[k] - a) * u; }).join(' ') + ')'); }); chrome.style.opacity = Math.max(0, (t - .72) / .28); }
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { frame(1); return; }
      var t0 = 0, run = S.viewRun = {}, raf = nativeRAF || window.requestAnimationFrame; frame(0);
      (function tick(now) { if (run !== S.viewRun) return; if (!t0) t0 = now; var q = (now - t0) / 1500; frame(Math.min(1, q)); if (q < 1) raf.call(window, tick); })(performance.now());
    };
    return viewFig(large ? 'dwg-axo-l' : 'dwg-v2', '2', 'EXPLODED VIEW', 'AXONOMETRIC. Z GAPS NOT TO SCALE. REAL POSITIONS, FIRST ' + Math.round(hc) + ' PX OF THE PAGE.', sv);
  }
  function cutRow() { // the first row of real neighbours on the page
    var c = all('.t-body.an,.dos,.lane__cards,.pnl').filter(visible);
    for (var i = 0; i < c.length; i++) { var k = kidsOf(c[i]); if (k.length > 1) { var a = k[0].getBoundingClientRect(), b = k[1].getBoundingClientRect(); if (b.left >= a.right - 1 && b.top < a.bottom) { var row = [k[0]]; k.slice(1).forEach(function (q) { if (q.getBoundingClientRect().top < a.bottom) row.push(q); }); return row; } } }
    return null;
  }
  function section(G) { // section A-A: the row the plane cuts, in elevation: its rules, parts and gutters, with its heights
    if (!S.cutRow) return null;
    var MX = 56, W_ = 900 + 2 * MX, sc = 900 / (S.R - S.L), kids = S.cutRow.map(box), t0 = Math.min.apply(0, kids.map(function (b) { return b.t; })), rowH = Math.max.apply(0, kids.map(function (b) { return b.b; })) - t0, T = 8, base = T + rowH * sc;
    var sv = mk('svg', { viewBox: '0 0 ' + W_ + ' ' + (base + 34), 'class': 'dwg-sec', role: 'img', 'aria-label': 'Section through the first row of the page, showing its parts' });
    var X = function (x) { return MX + (x - S.L) * sc; }, Y = function (y) { return T + (y - t0) * sc; };
    var pat = mk('pattern', { id: 'dwgh', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, mk('defs', {}, sv)); mk('line', { x1: 0, y1: 0, x2: 0, y2: 6, 'class': 'dwg-hatch' }, pat);
    mk('rect', { x: X(S.L), y: T, width: 900, height: rowH * sc, fill: 'url(#' + pat.id + ')' }, sv);
    var chain = [], c0 = S.L, nParts = 0;
    S.cutRow.forEach(function (el, i) {
      var b = kids[i];
      if (b.l > c0 + .5) chain.push({ a: c0, b: b.l, gap: true });
      var k = spanOf(b); chain.push({ a: b.l, b: b.r, code: k ? (k === G.n ? 'W' : 'C' + k) : '' }); c0 = b.r;
      mk('rect', { x: X(b.l), y: Y(b.t), width: b.w * sc, height: b.h * sc, 'class': 'dwg-sec-o' }, sv);
      all('*', el).forEach(function (e) { // the real internals
        if (e.closest('svg') && e.tagName !== 'svg') return; if (!visible(e) && e.tagName !== 'svg' && !/^(IMG|VIDEO|CANVAS)$/.test(e.tagName)) return; if (e.matches(SKIP)) return;
        var q = box(e); if (q.w < 6 || q.h < 3 || q.b > b.b + 1) return; nParts++;
        var media = /^(IMG|VIDEO|CANVAS)$/.test(e.tagName), bordered = px(cs(e).borderTopWidth) > 0;
        mk('rect', { x: X(q.l), y: Y(q.t), width: q.w * sc, height: q.h * sc, 'class': media ? 'dwg-sec-m' : bordered ? 'dwg-sec-r' : 'dwg-sec-i' }, sv);
        if (media) { mk('line', { x1: X(q.l), y1: Y(q.t), x2: X(q.r), y2: Y(q.b), 'class': 'dwg-sx' }, sv); mk('line', { x1: X(q.r), y1: Y(q.t), x2: X(q.l), y2: Y(q.b), 'class': 'dwg-sx' }, sv); }
      });
      occ.text.forEach(function (a) { if (a.l >= b.l - 1 && a.r <= b.r + 1 && a.t >= b.t - 1 && a.b <= b.b + 1 && a.b - a.t > 5) mk('rect', { x: X(a.l), y: Y(a.t + (a.b - a.t) * .25), width: (a.r - a.l) * sc, height: (a.b - a.t) * .5 * sc, 'class': 'dwg-sec-t' }, sv); });
      // heights: down the outside of the first and last parts, each child and the space after it
      if (i === 0 || i === S.cutRow.length - 1) {
        var side = i === 0 ? X(S.L) - 16 : X(S.R) + 16, ch = kidsOf(el).map(box).sort(function (u, v) { return u.t - v.t; }), y0 = b.t, lastY = -99;
        ch.concat([{ t: b.b, b: b.b }]).forEach(function (q) {
          [[y0, q.t], [q.t, q.b]].forEach(function (sp) { var d = sp[1] - sp[0]; if (d < 1) return; var ya = Y(sp[0]), yb = Y(sp[1]);
            mk('line', { x1: side, y1: ya, x2: side, y2: yb, 'class': 'dwg-m' }, sv); mk('line', { x1: side - 4, y1: ya, x2: side + 4, y2: ya, 'class': 'dwg-e' }, sv); mk('line', { x1: side - 4, y1: yb, x2: side + 4, y2: yb, 'class': 'dwg-e' }, sv);
            var my = (ya + yb) / 2; if (my - lastY >= 11) { var tl = mk('text', { x: side + (i === 0 ? -7 : 7), y: my + 3.5, 'text-anchor': i === 0 ? 'end' : 'start', 'class': 'dwg-sec-v' }, sv); tl.textContent = fmt(d); lastY = my; } });
          y0 = q.b;
        });
      }
    });
    if (c0 < S.R - .5) chain.push({ a: c0, b: S.R, gap: true });
    chain.forEach(function (c) {
      var x = X(c.a), w = (c.b - c.a) * sc, yy = base + 16; mk('line', { x1: x, y1: base, x2: x, y2: yy + 4, 'class': 'dwg-e' }, sv); mk('line', { x1: x + w, y1: base, x2: x + w, y2: yy + 4, 'class': 'dwg-e' }, sv); mk('line', { x1: x, y1: yy, x2: x + w, y2: yy, 'class': 'dwg-m' }, sv);
      var g = Math.abs(c.b - c.a - G.g) < .5, tt = c.gap && g ? 'G' : (c.code || ''), t = mk('text', { x: x + w / 2, y: yy + (w < 60 ? 14 : -3), 'text-anchor': 'middle', 'class': 'dwg-dt' }, sv); t.textContent = (tt ? tt + ' = ' : '') + fmt(c.b - c.a);
    });
    var sum = kids.reduce(function (a, b) { return a + b.w; }, 0), gaps = kids.length - 1, close = Math.abs(sum + gaps * G.g - (S.R - S.L)) < 1;
    return viewFig('dwg-v3', '3', 'SECTION A–A', 'SCALE ' + fmt(sc) + ':1. ' + nParts + ' BOXES IN ' + kids.length + ' PARTS, ' + gaps + '·G. WIDTH ' + fmt(sum + gaps * G.g) + (close ? ', CLOSES ON W.' : ', W IS ' + fmt(S.R - S.L) + '.') + ' HEIGHTS MEASURED.', sv);
  }
  function viewFig(id, num, title, sub, sv) {
    var f = h('figure', 'dwg-view'); f.id = id; f.appendChild(sv);
    h('figcaption', '', '<span class="dwg-tag dwg-tag--view">' + num + '</span><span><b>' + title + '</b><span>' + sub + '</span></span>', f);
    return f;
  }

  // ---------- title block, notes, tables ----------
  function pageTitle() { return window.PAGE === 'case' ? (window.SLUG || 'case').replace(/[_-]/g, ' ') : window.PAGE === 'lab' ? 'lab' : 'home'; }
  function pageNo() { // one number per page of the site, the same on screen and on paper
    if (window.PAGE === 'lab') return 2; if (window.PAGE !== 'case') return 1;
    var i = (window.__dwgPages || []).indexOf(window.SLUG); return i < 0 ? 'X' : i + 3;
  }
  function sheetCount() { return S.sheet ? S.sheets : (S.parentSheets || (S.W >= 1024 ? planFor(S.H, S.R - S.L).sheets : 1)); }
  function planFor(H, w) { // sheet 1 carries the plan large beside the data; the rest of the page runs on two windows a sheet
    var s1 = S.forceS || (PW - PANEL - 16) / (w + 2 * PAD), s2 = Math.min(S2, 738 / (w + 2 * PAD)), crop = (PH - 24) / s1, crop2 = (PH - 24 - 38) / s2;
    return { sc: s1, s2: s2, crop: crop, crop2: crop2, sheets: H <= crop + 1 ? 1 : 1 + Math.ceil(Math.ceil((H - crop) / crop2) / 2) };
  }
  function titleBlock() {
    function cell(k, val) { return '<div class="dwg-tb__c"><span class="dwg-k">' + k + '</span><span class="dwg-v">' + val + '</span></div>'; }
    return '<div class="dwg-tb"><div class="dwg-tb__t"><span class="dwg-k">PORTFOLIO · DIMENSIONAL DRAWING</span><b class="dwg-tb__n">' + esc(pageTitle()) + '</b></div>'
      + cell('DWG NO.', 'DH-001/' + pageNo()) + cell('REV', esc(REV)) + cell('SCALE', S.sheet ? fmt(S.printScale) + ':1' : '1:1') + cell('UNITS', 'CSS PX') + cell('SHEETS', sheetCount()) + cell('WIDTH', S.sheet ? PW : innerWidth) + '</div>';
  }
  function conformance() {
    var blocks = all('main *').filter(function (e) { return visible(e) && !e.matches(SKIP) && /block|flex|grid|list-item/.test(cs(e).display) && !e.closest('svg'); });
    var bPx = probes.b.getBoundingClientRect().width, onB = 0, round = 0;
    blocks.forEach(function (e) { var hh = e.getBoundingClientRect().height, q = hh / bPx; if (Math.abs(q - Math.round(q)) < .01) onB++; if (px(cs(e).borderTopLeftRadius) > 0) round++; });
    return { n: blocks.length, onB: onB, round: round };
  }
  function notes(G) {
    var W = G.n * G.col + (G.n - 1) * G.g, c = conformance(), bPx = probes.b.getBoundingClientRect().width, pct = c.n ? Math.round(100 * c.onB / c.n) : 0, gk = G.g / bPx;
    var off = S.dims.filter(function (d) { return d.code.charAt(0) === 'X'; }).length;
    return '<div class="dwg-notes"><b>NOTES:</b> (UNLESS OTHERWISE SPECIFIED)<ol>'
      + '<li>DO NOT SCALE. EVERY VALUE IS MEASURED FROM THE LIVE PAGE AT THIS WIDTH.</li>'
      + '<li>W = ' + G.n + '·COL + ' + (G.n - 1) + '·G = ' + fmt(W) + (Math.abs(W - G.site.w) < .5 ? ', AS MEASURED.' : '; MEASURED ' + fmt(G.site.w) + '.') + '</li>'
      + '<li>S, H AND Z CODES COUNT B: S' + fmt(gk) + ' = ' + fmt(gk) + '·B = ' + fmt(G.g) + ' = G. THE SAME CODE MEANS THE SAME VALUE ON EVERY PAGE.' + (off ? ' X CODES ARE OFF THE LATTICE.' : '') + '</li>'
      + '<li>' + c.onB + ' OF ' + c.n + ' BOXES (' + pct + '%) ARE WHOLE MULTIPLES OF B. THE REST HUG THEIR CONTENT AND CARRY NO VARIABLE.</li>'
      + '<li>' + (c.round ? c.round + ' OF ' + c.n + ' BOXES ARE ROUNDED.' : 'NO RADII: 0 OF ' + c.n + ' BOXES ARE ROUNDED.') + '</li>'
      + '<li>' + counts().note + ' A SPAN IS DIMENSIONED ONCE. QTY COUNTS EVERY INSTANCE FOUND, TYP.</li>'
      + (heroName() ? '<li>' + heroName() + ' IS DRAWN IN FULL, TYPE INCLUDED.</li>' : '')
      + (S.shift ? '<li>PLAN SHIFTED ' + fmt(S.shift) + ' LEFT IN THE FRAME TO FIT THE SHEET. M IS ' + fmt(px(cs(document.querySelector('.site')).marginLeft)) + ' ON THE PAGE; NOTHING REFLOWS.</li>' : '')
      + '<li>REV IS THE LAST COMMIT THAT CHANGED THE SOURCE.</li>'
      + (S.sheet ? '<li>PLAN AT ' + fmt(S.printScale) + ':1 ON THIS SHEET' + (S.sheets > 1 ? ', ' + fmt(S.s2) + ':1 ON THE OTHER ' + (S.sheets - 1) + '.' : '.') + '</li>' : (sheetCount() > 1 ? '<li>PRINTS ON ' + sheetCount() + ' A3 SHEETS.</li>' : '<li>PRINTS ON ONE A3 SHEET.</li>'))
      + '</ol><p class="dwg-credit">DRAWING STYLE AFTER DIMENSIONAL-DRAWING, E. OZTURK (MIT).</p></div>';
  }
  function natural(a, b) { return String(a).localeCompare(String(b), 'en', { numeric: true }); }
  var SCALE = { 1: 'inset', 2: 'text gap', 3: 'row gap', 4: 'stack unit', 5: 'paragraph step', 6: 'tile bottom', 8: 'block gap', 12: 'section gap', 16: 'section gap' };
  function roleName(v, bPx) { // the commonest measured role; generic ones fall back to the step's name on the scale
    if (v.code === 'G') return 'gutter';
    var tally = {}; v.roles.forEach(function (r) { tally[r] = (tally[r] || 0) + 1; });
    var top = Object.keys(tally).sort(function (a, b) { return tally[b] - tally[a]; })[0] || '';
    if (v.group === 'SPACING' && (/block|paragraph|prose|list/.test(top) || Object.keys(tally).length > 2 || top.length > 12)) return SCALE[v.value / bPx] || top.replace('block', 'space').replace(' top', ' inset');
    return top;
  }
  function tables(G) {
    var byCode = {}, bPx = probes.b.getBoundingClientRect().width;
    S.dims.concat(S.extra).forEach(function (d) { var v = byCode[d.code] || (byCode[d.code] = { code: d.code, value: d.value, group: d.group, roles: [], n: 0 }); v.n++; if (d.role) v.roles.push(d.role); });
    var flags = [], out = '';
    ['GRID', 'SPANS', 'SPACING', 'SIZES', 'TYPE'].forEach(function (grp) {
      var rows = Object.keys(byCode).map(function (k) { return byCode[k]; }).filter(function (v) { return v.group === grp; }).sort(function (a, b) { return grp === 'GRID' ? 0 : natural(a.code, b.code); });
      if (!rows.length) return;
      out += '<table class="dwg-tbl"><caption>' + grp.toLowerCase() + '</caption><thead><tr><th scope="col">CODE</th><th scope="col">VARIABLE</th><th scope="col">QTY</th><th scope="col">VALUE</th></tr></thead><tbody>'
        + (function () { var seen = {}; rows.forEach(function (v) { var nm = roleName(v, bPx); (seen[nm] = seen[nm] || []).push(v); }); Object.keys(seen).forEach(function (k) { if (seen[k].length > 1) seen[k].sort(function (a, b) { return a.value - b.value; }).forEach(function (v, i) { v.alias = k + (seen[k].length === 2 ? (i ? ', tall' : ', short') : ' ' + (i + 1)); }); }); return ''; })()
        + rows.map(function (v) {
          var m = /^C(\d+)$/.exec(v.code), nm = v.alias || roleName(v, bPx), val = fmt(v.value);
          if (m) { var k = +m[1], nom = k * G.col + (k - 1) * G.g; nm = k + '·COL+' + (k - 1) + '·G'; if (Math.abs(nom - v.value) >= .01) { val += '†'; flags.push(v.code + ' MEASURED ' + fmt(v.value) + ', NOMINAL ' + fmt(nom)); } }
          return '<tr tabindex="0" data-code="' + esc(v.code) + '"><th scope="row">' + esc(v.code) + '</th><td title="' + esc(nm) + '">' + esc(nm) + '</td><td>' + (S.qty[v.code] || v.n) + '</td><td>' + val + '</td></tr>';
        }).join('') + '</tbody></table>';
    });
    if (flags.length) out += '<p class="dwg-flag">† DEVIATION: ' + flags.map(esc).join('; ') + '.</p>';
    return out;
  }

  // ---------- one full draw ----------
  function budget() {
    var base = S.sheet ? 60 : S.W >= 1200 ? 48 : S.W >= 640 ? 30 : 18;
    return Math.round(Math.min(base * 2.5, base * Math.max(1, S.H / (S.W < 640 ? 3600 : 2400))));
  }
  function capFor() { return S.W >= 1200 ? 28 : S.W >= 700 ? 20 : 14; }
  function render(anim) {
    var site = document.querySelector('.site');
    if (!over) return;
    if (S.sheet) root.setAttribute('data-dwg-measure', '');
    svg.textContent = ''; labels.textContent = ''; S.dims = []; S.count = 0; S.boxes = []; S.slots = []; S.once = {}; S.vspan = {}; S.hug = 0; S.extra = []; S.use = {}; S.wipes = [];
    occ = { labels: [], h: [], v: [], mask: [], text: [], obj: [], edge: [] };
    // laptops: the margins can't hold the sheet, so the plan moves left inside the frame. Relative offset only: nothing
    // reflows, every value is still measured in CSS px, and off removes it.
    site.style.position = ''; site.style.left = '';
    var mar0 = px(cs(site).marginLeft), bw = document.body.clientWidth;
    S.shift = !S.sheet && bw >= 1200 && mar0 < 232 ? Math.max(0, mar0 - 48) : 0;
    if (S.shift) { site.style.position = 'relative'; site.style.left = -S.shift + 'px'; }
    var sb = site.getBoundingClientRect();
    S.W = document.body.clientWidth; S.H = Math.ceil(sb.bottom + window.scrollY);
    S.L = sb.left + scrollX; S.R = sb.right + scrollX;
    S.rail = !S.sheet && S.W >= 1200; S.detailsLeft = S.rail && !S.shift;
    if (S.sheet) setupScale();
    S.leftTracks = S.L >= 80 ? [S.L - 16, S.L - 44, S.L - 72] : S.L >= 44 ? [S.L - 14, S.L - 34] : [Math.max(8, S.L / 2)];
    S.rightTracks = S.W - S.R >= 80 ? [S.R + 14] : [S.R + Math.max(8, (S.W - S.R) / 2)];
    over.style.height = S.H + 'px'; over.style.width = S.W + 'px';
    svg.setAttribute('width', S.W); svg.setAttribute('height', S.H); svg.setAttribute('viewBox', '0 0 ' + S.W + ' ' + S.H);
    root.toggleAttribute('data-dwg-anim', !!anim && !matchMedia('(prefers-reduced-motion: reduce)').matches);
    colL.hidden = !S.detailsLeft; colR.hidden = !S.rail; strip.hidden = S.rail || S.sheet;
    if (S.rail) { occ.mask.push({ l: S.R + 34, r: S.W - 8, t: 0, b: S.H }); colR.style.width = (S.W - S.R - 34 - 12) + 'px'; }
    occ.text = collectText();
    if (!S.sheet) { var maxB = occ.text.reduce(function (m, t) { return Math.max(m, t.b); }, 0); foot.style.marginTop = Math.max(0, Math.ceil(maxB - S.H) + (maxB > S.H ? 16 : 0)) + 'px'; } // some page text overhangs its box; the sheet starts below it

    var G = S.G = measureGrid();
    drawGrid(G); objects(); slots();
    var pair = junctionPair(), glyph = all('.t-head .glyph,.lc__head .glyph,.dos__id .glyph,.dos__id svg').filter(function (g) { return visible(g) && g.querySelector('rect'); })[0] || document.querySelector('.ss-lockup__mark');
    var pa = box(pair[0]), pb = box(pair[1]), gb = box(glyph), acr = pb.l >= pa.r - 1;
    var ax_ = acr ? (pa.r + pb.l) / 2 : pa.l + 8, ay_ = acr ? Math.max(pa.t, pb.t) : (pa.b + pb.t) / 2, gx_ = gb.l + gb.w / 2, gy_ = gb.t + gb.h / 2;
    var figW = S.L - 104, figH = figW + 78, lead = S.detailsLeft ? 16 + figW + 2 : null;
    S.figB = Math.max(40, gy_ - figW / 2);
    refMark(gx_, gy_, 'B', lead);
    var ly = refMark(ax_, ay_, 'A', lead);
    S.figA = Math.max(S.figB + figH + 8, (ly == null ? ay_ : ly) - figW / 2);
    if (S.detailsLeft) occ.mask.push({ l: 12, r: 16 + figW, t: S.figB, b: S.figB + figH }, { l: 12, r: 16 + figW, t: S.figA, b: S.figA + figH });
    // the cutting plane: both ends in the margins, across the first row that has neighbours
    S.cutRow = cutRow();
    if (S.cutRow) { var rb_ = S.cutRow.reduce(function (a, k) { var q = box(k); return { t: Math.min(a.t, q.t), b: Math.min(a.b, q.b) }; }, { t: 1e9, b: 1e9 }), cy = snap((rb_.t + rb_.b) / 2), cg = group('dwg-d dwg-cut', 540);
      [[S.L - 4, -1], [S.R + 4, 1]].forEach(function (a) { var o = a[0] + a[1] * 12; line(cg, a[0], cy, o, cy, 'dwg-cutl'); line(cg, o, cy, o, cy - 10, 'dwg-cutl'); arrow(cg, o, cy - 11, 0, -1);
        var tr = lab(clampX(o + a[1] * 10, 14), cy - 4, 14); if (labelFree(tr)) { h('span', 'dwg-l dwg-l--ref', 'A', labels).style.cssText = 'left:' + tr.l + 'px;top:' + tr.t + 'px;width:14px;--d:560ms'; occ.labels.push(tr); } occ.v.push({ l: o - 2, r: o + 2, t: cy - 14, b: cy + 2 }); }); }

    // the grid chain first: W, M, COL, G
    var hb = box(document.querySelector('.site-head')), topY = Math.min(14, px(cs(site).paddingTop) / 2 + 2);
    function fix(code, role, grp, prop, el, val) { return { code: code, text: code, role: role, group: grp, prop: prop, el: el, value: val }; }
    placeH(fix('W', 'content width', 'GRID', 'width', site, G.site.w), G.site.l, G.site.r, [topY], hb.t, hb.t);
    if (S.W >= 640 && !S.shift) placeH(fix('M', 'margin', 'GRID', 'margin-left', site, px(cs(site).marginLeft)), 0, G.site.l, [topY], null, hb.t);
    var chainY = hb.b + 10, gt = group('dwg-d', 500); var cx_ = G.site.l;
    for (var i = 0; i <= G.n; i++) { if (i > 0 && i < G.n) line(gt, snap(cx_ - G.g), chainY - 4, snap(cx_ - G.g), chainY + 4, 'dwg-e'); line(gt, snap(cx_), chainY - 4, snap(cx_), chainY + 4, 'dwg-e'); cx_ += G.col + G.g; }
    placeH(fix('COL', 'column', 'GRID', 'column-width', probes.col, G.col), G.site.l, G.site.l + G.col, [chainY], null, null);
    placeH(fix('G', 'gutter', 'GRID', 'width', probes.g, G.g), G.site.l + G.col, G.site.l + G.col + G.g, [chainY], null, null);

    // gather what the page offers, then decide the vocabulary: most-used values first, up to the cap
    // gather what the page offers. Codes come from the value, so they never change between pages, widths or paper.
    var bPx = probes.b.getBoundingClientRect().width;
    function codeOf(c) {
      if (c.prefix === 'S' || c.prefix === 'H' || c.prefix === 'Z') { var q = c.value / bPx, ok = Math.abs(q - Math.round(q)) < .01; if (ok) return c.prefix + Math.round(q); return c.prefix === 'S' ? 'X' + Math.round(c.value) : null; }
      return c.prefix;
    }
    var perBlock = S.W < 640 ? 4 : 8, heroEl = all('.tile,.lc,.dos__sheet,.hero').filter(visible)[0], heroC = [];
    // one part is drawn in full: the first block on the page, with its type. Everything else gets the system, not the inventory.
    all('.site-h1,.lab-h1,.dos__h,.ro-big b,.t-name').filter(function (e) { return e.getBoundingClientRect().width > 0 && (!heroEl || !e.matches('.t-name') || heroEl.contains(e)); }).slice(0, S.W < 640 ? 2 : 3).forEach(function (e) { heroC = heroC.concat(cType(e, nameOf(e.closest('.site-h1,.lab-h1,.dos__h,.ro-big,.t-name') || e))); });
    if (heroEl) heroC = heroC.concat(walk(heroEl, 70, true));
    var groups = roots().filter(function (r) { return r !== heroEl; }).map(function (r) { return walk(r, 60); }).filter(function (g) { return g.length; });
    var freq = {}, heroCodes = {}, seenC = [];
    groups.concat([heroC]).forEach(function (g) { g.forEach(function (c) { if (c.kind === 'type') { c.code = c.prefix; } else c.code = codeOf(c); if (c.code) { var dupW = c.prop === 'width' && seenC.indexOf(c.el) >= 0; if (!dupW) freq[c.code] = (freq[c.code] || 0) + 1; } seenC.push(c.el); }); });
    heroC.forEach(function (c) { if (c.code) heroCodes[c.code] = 1; });
    S.qty = freq;
    var room = Math.max(0, capFor() - 7), keep = { G: 1 }; // W M COL G B L CELL are always there
    var heroFirst = Object.keys(heroCodes).filter(function (k) { return k !== 'G' && !/^CAP/.test(k); }), restC = Object.keys(freq).filter(function (k) { return k !== 'G' && !heroCodes[k] && !/^CAP/.test(k); }).sort(function (a, b) { return freq[b] - freq[a]; });
    heroFirst.concat(restC).slice(0, room).forEach(function (k) { keep[k] = 1; }); Object.keys(freq).forEach(function (k) { if (/^CAP/.test(k)) keep[k] = 1; });
    var limit = budget(), ri = 0;
    heroC.forEach(function (c) { if (!c.code || !keep[c.code]) return; c.text = c.code; c.run(c); });
    groups = groups.map(function (g) { return g.slice(0, perBlock * 2); });
    while (S.dims.length < limit && groups.some(function (g) { return g.length; })) {
      var g = groups[ri++ % groups.length]; if (!g.length) continue;
      var c = g.shift(); if (!c || !c.code || !keep[c.code]) continue;
      if (/^[SX]\d/.test(c.code) && (S.use[c.code] || 0) >= 4) continue; // a spacing step has made its point after a few
      c.text = c.code; c.run(c);
    }
    words(roots().filter(function (e) { return !e.matches('.pnl,.board,.xgrid,.cat__head'); }));

    // details: their codes join the table
    var dA = detailJunction(pair), dB = detailCell(glyph);
    S.dims.push({ code: 'G', value: +fmt(G.g), prop: 'width', el: probes.g, labelEl: dA.labelG, group: 'GRID', role: 'gutter' });
    if (dA.L) S.dims.push({ code: 'L', value: +fmt(px(cs(probes.l).borderTopWidth)), prop: 'border-top-width', el: probes.l, labelEl: dA.labelL, group: 'GRID', role: 'hairline' });
    S.dims.push({ code: 'CELL', value: +fmt(dB.w), prop: 'width', el: dB.el, labelEl: dB.label, group: 'GRID', role: 'glyph cell' });
    S.dims.push({ code: 'B', value: +fmt(bPx), prop: 'width', el: probes.b, labelEl: dB.labelB, group: 'GRID', role: 'baseline' });

    if (S.sheet && S.fitH !== S.H) { // sheet 1's scale: the largest whose window ends on a clean break and stays full
      S.fitH = S.H; var pw = S.R - S.L, top = (PW - PANEL - 16) / (pw + 2 * PAD), best = top, bestF = 0;
      for (var sc_ = top; sc_ >= S2 - .001; sc_ -= .01) { var cr = (PH - 24) / sc_, f = Math.min(1, cutsFor(cr)[1] / cr); if (f > bestF + .02) { bestF = f; best = sc_; } }
      S.forceS = best; root.removeAttribute('data-dwg-measure'); return render(false);
    }
    if (S.sheet) { S.cuts = cutsFor(); S.sheets = S.cuts.length <= 2 ? 1 : 1 + Math.ceil((S.cuts.length - 2) / 2); root.style.setProperty('--dwg-clip', S.cuts[1] + 'px'); }
    var hdr = titleBlock(), ntx = notes(G), tbl = tables(G), figA = detailFig(dA), figB = detailFig(dB), ax = axo(G), sec = section(G);
    foot.innerHTML = '<p class="dwg-v1"><span class="dwg-tag dwg-tag--view">1</span><span><b>PLAN</b><span>' + (S.sheet ? 'THE LIVE PAGE AT LEFT, ' + fmt(S.printScale) : 'THE LIVE PAGE ABOVE, 1') + ':1.</span></span></p>';
    S.hasSec = !!sec;
    var vw = h('div', 'dwg-views', null, foot), left = h('div', 'dwg-views__m', null, vw), side = h('div', 'dwg-views__s', null, vw);
    if (S.sheet) left.appendChild(ax); else vw.classList.add('dwg-views--one');
    if (S.rail) {
      railR.innerHTML = '<div class="dwg-rt">' + hdr + '</div>' + viewSwitch(!!sec) + '<div class="dwg-rd"></div><div class="dwg-tables">' + tbl + '</div><div class="dwg-more" aria-hidden="true">MORE ↓</div>';
      if (S.detailsLeft) {
        figA.style.cssText = 'top:' + S.figA + 'px;width:' + (S.L - 104) + 'px'; figB.style.cssText = 'top:' + S.figB + 'px;width:' + (S.L - 104) + 'px';
        colL.textContent = ''; colL.appendChild(figB); colL.appendChild(figA);
      } else { var rd = railR.querySelector('.dwg-rd'); rd.appendChild(figA); rd.appendChild(figB); }
      side.insertAdjacentHTML('beforeend', ntx);
      if (sec) foot.appendChild(sec);
    } else {
      var dd = h('div', 'dwg-foot__d', null, side); dd.appendChild(figA); dd.appendChild(figB);
      side.insertAdjacentHTML('beforeend', ntx);
      if (sec) foot.appendChild(sec);
      foot.insertAdjacentHTML('beforeend', '<div class="dwg-tables">' + tbl + '</div>' + hdr);
      strip.innerHTML = '<span>DH-001/' + pageNo() + '</span><span>REV ' + esc(REV) + '</span>' + viewSwitch(!!sec, true) + '<button class="dwg-varb" type="button" aria-expanded="' + (S.legend ? 'true' : 'false') + '">VARIABLES ' + uniqAll() + '</button>';
      legend.hidden = !S.legend; legend.innerHTML = tbl;
      strip.querySelector('.dwg-varb').onclick = function () { S.legend = !S.legend; legend.hidden = !S.legend; this.setAttribute('aria-expanded', S.legend ? 'true' : 'false'); };
    }
    if (!S.sheet) { var fl = S.rail ? 16 : S.L; foot.style.marginLeft = fl + 'px'; foot.style.width = (S.R - fl) + 'px'; }
    // the frame goes round everything: plan, views, tables and title block are one sheet
    if (!S.sheet) {
      var fh = Math.ceil(foot.getBoundingClientRect().bottom + window.scrollY);
      over.style.height = fh + 'px'; svg.setAttribute('height', fh); svg.setAttribute('viewBox', '0 0 ' + S.W + ' ' + fh);
      frame(fh);
    }
    if (S.sheet) { // the title block must stay on the sheet: views give way until the panel fits
      var fsec = foot.querySelector('.dwg-sec'), fax = foot.querySelector('.dwg-axo'), mh = 180, ma = 330;
      for (var fi = 0; fi < 12 && foot.scrollHeight > foot.clientHeight + 1; fi++) { mh = Math.max(84, mh - 16); ma = Math.max(210, ma - 16); if (fsec) fsec.style.maxHeight = mh + 'px'; if (fax) fax.style.setProperty('max-height', ma + 'px', 'important'); }
    }
    syncMore();
    if (S.view > 1 && !S.sheet) openView(S.view, true);
    root.removeAttribute('data-dwg-measure');
    if (S.sheet) { try { if (window.parent.__drawing) window.parent.__drawing._sheetDrawn(); } catch (e) {} }
  }
  function counts() { // one count, from the same arrays the sheet is drawn from and list() returns
    var plan = S.dims.filter(function (d) { return d.labelEl && d.labelEl.closest && d.labelEl.closest('.dwg-labels'); }).length, det = S.dims.length - plan, cap = S.extra.length;
    return { list: S.dims.length, plan: plan, details: det, cap: cap, hug: S.hug, variables: uniqAll(), note: S.dims.length + ' MEASURED DIMENSIONS (' + plan + ' ON THE PLAN, ' + det + ' IN THE DETAILS), ' + cap + ' CAP HEIGHT' + (cap === 1 ? '' : 'S') + ' FROM FONT METRICS, ' + S.hug + ' HUG, ' + uniqAll() + ' VARIABLES.' };
  }
  function heroName() { var e = all('.tile,.lc,.dos__sheet,.hero').filter(visible)[0]; if (!e) return ''; var t = e.querySelector('.t-name .tt,.lc__chs,.dos__h .tt'); return (t ? t.textContent.trim() : nameOf(e)).toUpperCase(); }
  function uniqAll() { var o = {}; S.dims.concat(S.extra).forEach(function (d) { o[d.code] = 1; }); return Object.keys(o).length; }
  // ---------- views: plan, exploded, section. The chosen one fills the first screen over the plan; the page is never touched. ----------
  function viewSwitch(sec, tiny) {
    var names = [['1', 'PLAN'], ['2', 'EXPLODED']].concat(sec ? [['3', 'SECTION']] : []);
    return '<div class="dwg-seg' + (tiny ? ' dwg-seg--tiny' : '') + '" role="group" aria-label="Views">' + names.map(function (n) { return '<button type="button" data-view="' + n[0] + '" aria-pressed="' + (S.view === +n[0] ? 'true' : 'false') + '"><kbd>' + n[0] + '</kbd>' + (tiny ? n[1].slice(0, 4) : n[1]) + '</button>'; }).join('') + '</div>';
  }
  function setViewHash(n) { var t = n > 1 ? '#dwg-v' + n : '#drawing'; if (location.hash !== t) history.replaceState(null, '', location.pathname + location.search + t); }
  function openView(n, quiet) {
    if (S.sheet) return;
    if (n === 3 && !S.hasSec) n = 1;
    S.view = n; S.viewRun = null;
    all('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-view') === n ? 'true' : 'false'); });
    if (!quiet) setViewHash(n);
    if (n === 1) { stage.hidden = true; stage.textContent = ''; return; }
    stage.textContent = '';
    var rightOff = S.rail ? (S.W - S.R - 34 + 8) : 8;
    stage.style.cssText = 'left:8px;top:8px;right:' + rightOff + 'px;bottom:' + (S.rail ? 8 : 32) + 'px';
    var fig = n === 2 ? axo(S.G, true) : section(S.G);
    fig.classList.add('dwg-stagefig'); stage.appendChild(fig); stage.hidden = false;
    if (!quiet) window.scrollTo(0, 0);
    var sv = fig.querySelector('svg'); if (sv.__lift) sv.__lift();
  }
  function onView(e) { var b = e.target.closest && e.target.closest('[data-view]'); if (b) openView(+b.getAttribute('data-view')); }
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return; var t = e.target; if (t && t.closest && t.closest('input,textarea,select,[contenteditable],[role=textbox]')) return;
    if (/^[123]$/.test(e.key)) { openView(+e.key); }
    else if (e.key === 'Escape' && S.view > 1) { e.stopImmediatePropagation(); openView(1); }
  }
  function uniq() { var o = {}; S.dims.forEach(function (d) { o[d.code] = 1; }); return Object.keys(o).length; }
  function syncMore() { var m = railR && railR.querySelector('.dwg-more'); if (m) m.hidden = railR.scrollTop + railR.clientHeight >= railR.scrollHeight - 4; }

  // ---------- code <-> dimension, both ways ----------
  function setHot(code, from) {
    all('.is-hot', over).concat(all('.is-hot', foot)).forEach(function (e) { e.classList.remove('is-hot'); });
    all('.dwg-hotbox', labels).forEach(function (e) { e.remove(); });
    if (gridHost) gridHost.classList.toggle('is-on', code === 'COL' || code === 'G');
    if (!code) return;
    S.dims.forEach(function (d) { if (d.code !== code || !d.el.isConnected || d.el.closest('.dwg-probes')) return; var b = box(d.el); if (b.w < 1 || b.h < 1) return; h('i', 'dwg-hotbox', null, labels).style.cssText = 'left:' + b.l + 'px;top:' + b.t + 'px;width:' + b.w + 'px;height:' + b.h + 'px'; });
    var q = '[data-code="' + code + '"]';
    all(q, over).concat(all(q, foot)).forEach(function (e) { e.classList.add('is-hot'); });
    if (from === 'label') { var row = over.querySelector('tr' + q) || null; if (row && railR && !colR.hidden) { var r = row.getBoundingClientRect(), o = railR.getBoundingClientRect(); if (r.top < o.top || r.bottom > o.bottom) railR.scrollTop += r.top - o.top - 40; } }
  }
  function onHover(e) { var t = e.target.closest && e.target.closest('[data-code]'); setHot(t ? t.getAttribute('data-code') : '', t && t.tagName === 'TR' ? 'row' : 'label'); }

  // ---------- freeze: instruments hold still under the dimensions, and pick up again on the way out ----------
  function holdVideo(ev) { ev.target.pause(); }
  function freeze() {
    document.dispatchEvent(new Event('visibilitychange')); // site.js stops its instruments while html[data-drawing] is set
    all('video').forEach(function (v) { if (!v.paused) S.vids.push(v); v.pause(); v.addEventListener('play', holdVideo); });
    nativeRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function (f) { S.held.push(f); return 0; };
  }
  function thaw() {
    window.requestAnimationFrame = nativeRAF;
    var hd = S.held; S.held = []; hd.forEach(function (f) { nativeRAF.call(window, f); });
    all('video').forEach(function (v) { v.removeEventListener('play', holdVideo); });
    S.vids.forEach(function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }); S.vids = [];
    document.dispatchEvent(new Event('visibilitychange'));
  }

  // ---------- lifecycle ----------
  function later() { clearTimeout(S.t); S.t = setTimeout(function () { if (S.on) { if (S.sheet) eagerAll(); render(false); } }, 120); }
  function eagerAll() { all('main img[loading="lazy"]').forEach(function (i) { i.loading = 'eager'; S.lazy.push(i); }); }
  function build() {
    var site = document.querySelector('.site');
    probes = { host: h('div', 'dwg-probes') }; probes.host.setAttribute('data-dwg-ui', '');
    ['col', 'g', 'b'].forEach(function (k) { probes[k] = h('i', '', null, probes.host); probes[k].style.width = 'var(--' + k + ')'; });
    probes.l = h('i', 'dwg-probe-l', null, probes.host);
    site.appendChild(probes.host);
    over = h('div', ''); over.id = 'dwg'; over.setAttribute('data-dwg-ui', '');
    svg = mk('svg', { 'class': 'dwg-svg', 'aria-hidden': 'true' }, over);
    labels = h('div', 'dwg-labels', null, over);
    colL = h('div', 'dwg-col dwg-col--l', null, over);
    colR = h('div', 'dwg-col dwg-col--r', null, over); railR = h('div', 'dwg-rail dwg-rail--r', null, colR);
    railR.setAttribute('role', 'region'); railR.setAttribute('aria-label', 'Title block and variables'); railR.tabIndex = 0; railR.addEventListener('scroll', syncMore, { passive: true });
    document.body.appendChild(over);
    gridHost = h('div', 'dwg-gridh'); gridHost.setAttribute('data-dwg-ui', ''); document.body.appendChild(gridHost);
    foot = h('div', 'dwg-foot'); foot.id = 'dwg-foot'; foot.setAttribute('data-dwg-ui', ''); foot.setAttribute('role', 'region'); foot.setAttribute('aria-label', 'Drawing data');
    site.parentNode.insertBefore(foot, site.nextSibling);
    strip = h('div', 'dwg-strip'); strip.setAttribute('data-dwg-ui', ''); document.body.appendChild(strip);
    stage = h('div', 'dwg-stage'); stage.setAttribute('data-dwg-ui', ''); stage.hidden = true; document.body.appendChild(stage);
    legend = h('div', 'dwg-legend'); legend.setAttribute('data-dwg-ui', ''); legend.hidden = true; document.body.appendChild(legend);
    pageStyle = h('style', ''); pageStyle.textContent = '@page { size: A3 landscape; margin: 10mm; }'; document.head.appendChild(pageStyle);
    document.addEventListener('click', onView); window.addEventListener('keydown', onKey, true);
    document.addEventListener('input', onWipe, true); document.addEventListener('pointermove', onWipe, { passive: true });
    over.addEventListener('pointerover', onHover); foot.addEventListener('pointerover', onHover);
    over.addEventListener('focusin', onHover); foot.addEventListener('focusin', onHover);
  }
  function teardown() {
    document.removeEventListener('click', onView); window.removeEventListener('keydown', onKey, true);
    document.removeEventListener('input', onWipe, true); document.removeEventListener('pointermove', onWipe);
    [over, foot, strip, legend, stage, pageStyle, gridHost, S.frame, probes && probes.host].concat(S.extras).forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
    over = foot = strip = legend = stage = pageStyle = probes = S.frame = null; S.extras = [];
  }
  function on() {
    if (S.on) return; S.on = true;
    S.sheet = !!window.__dwgSheet; var hv = /^#dwg-v([123])$/.exec(location.hash); S.view = hv ? +hv[1] : 1;
    root.setAttribute('data-drawing', ''); build();
    if (S.sheet) { root.setAttribute('data-theme', 'light'); root.setAttribute('data-dwg-plan', ''); eagerAll(); }
    else { freeze(); all('main img[loading="lazy"]').forEach(function (i) { if (i.getBoundingClientRect().top + scrollY < 2000) { i.loading = 'eager'; S.lazy.push(i); } }); }
    render(!S.sheet && S.view === 1);
    S.ro = new ResizeObserver(later); S.ro.observe(document.querySelector('.site'));
    window.addEventListener('resize', later); window.addEventListener('beforeprint', bp); window.addEventListener('afterprint', ap);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    if (!S.sheet) setTimeout(function () { if (S.on) makeFrame(); }, 300);
    pressed(true);
  }
  function off() {
    if (!S.on) return; S.on = false; clearTimeout(S.t); clearTimeout(S.xt);
    if (S.ro) S.ro.disconnect();
    window.removeEventListener('resize', later); window.removeEventListener('beforeprint', bp); window.removeEventListener('afterprint', ap);
    S.lazy.forEach(function (i) { i.loading = 'lazy'; }); S.lazy = [];
    var st_ = document.querySelector('.site'); st_.style.position = ''; st_.style.left = '';
    teardown(); S.dims = [];
    root.removeAttribute('data-drawing'); root.removeAttribute('data-dwg-anim');
    thaw();
    pressed(false);
  }
  function pressed(v) { var b = document.getElementById('draw-toggle'); if (b) b.setAttribute('aria-pressed', v ? 'true' : 'false'); }

  // ---------- print: real sheets. See drawing.css for why these are frames. ----------
  function setupScale() { // inside the first frame
    var site = document.querySelector('.site').getBoundingClientRect(), left = site.left + scrollX, v = root.style, pl = planFor(S.H, site.width), sc = pl.sc;
    S.printScale = +sc.toFixed(3); S.cropH = pl.crop; S.crop2 = pl.crop2; S.s2 = pl.s2; S.left = left; S.sheets = pl.sheets;
    v.setProperty('--dwg-s', sc); v.setProperty('--dwg-tx', ((PAD - left) * sc) + 'px'); v.setProperty('--dwg-ox', -left + 'px');
    var fl = Math.ceil((site.width + 2 * PAD) * sc) + 12; foot.style.left = fl + 'px'; foot.style.width = (PW - fl - 12) + 'px';
  }
  function cutsFor(c1) { // where the sheets break: between blocks, never through type or a picture
    var ys = all('main > *, main section, main figure, main table, main article > *, .tile, .lc, .tally, .hero, .site-foot, main p').filter(visible).map(function (e) { return box(e).t - 2; });
    ys = ys.concat(occ.text.map(function (t) { return t.b + 2; })).filter(function (y, i, a) { return a.indexOf(y) === i; }).sort(function (a, b) { return a - b; });
    var solid = S.boxes.filter(function (b) { return b.h < S.cropH * .9; }).concat(S.slots);
    function safe(y) { var r = { l: 0, r: S.W, t: y - .5, b: y + .5 }; return !hit(r, occ.text) && !hit(r, S.slots) && !solid.some(function (b) { return b.t < y - 3 && b.b > y + 3 && b.h < S.cropH * .6; }); }
    var cuts = [0], later_ = S.crop2, guard = 0;
    while (guard++ < 40) {
      var start = cuts[cuts.length - 1], room = cuts.length === 1 ? (c1 || S.cropH) : later_, end = start + room;
      if (end >= S.H) { cuts.push(S.H); break; }
      var best = null; for (var i = ys.length - 1; i >= 0; i--) { if (ys[i] <= end && ys[i] > start + room * .5 && safe(ys[i])) { best = ys[i]; break; } }
      cuts.push(best == null ? end : best);
    }
    return cuts;
  }
  function sheetInfo() { return { sheets: S.sheets, cuts: S.cuts, s: S.s2, left: S.left, html: root.outerHTML }; }
  function makeFrame() {
    if (window.parent !== window || innerWidth < 640 || S.frame) return; // phones print the sheet data alone
    var f = S.frame = document.createElement('iframe');
    f.className = 'dwg-printframe'; f.title = 'Print sheet 1'; f.tabIndex = -1; f.setAttribute('aria-hidden', 'true');
    f.src = location.pathname + location.search + '#dwg-sheet';
    document.body.appendChild(f);
  }
  function frameDrawn() { clearTimeout(S.xt); S.xt = setTimeout(makeExtras, 700); }
  function makeExtras() { // continuation sheets: static copies of the first frame, two windows a sheet, no scripts and no second page load
    S.extras.forEach(function (x) { if (x.parentNode) x.parentNode.removeChild(x); }); S.extras = [];
    var w; try { w = S.frame.contentWindow; } catch (e) { return; }
    if (!w || !w.__drawing || !w.__drawing.sheetInfo) return;
    var info = w.__drawing.sheetInfo(); S.ready = true;
    if (S.parentSheets !== info.sheets && innerWidth >= 640) { S.parentSheets = info.sheets; render(false); }
    if (info.sheets < 2) return;
    var parsed = new DOMParser().parseFromString('<!doctype html>' + info.html, 'text/html');
    all('script,iframe,video source', parsed).forEach(function (n) { n.remove(); });
    all('video', parsed).forEach(function (n) { n.removeAttribute('src'); n.setAttribute('preload', 'none'); });
    var base = parsed.querySelector('base') || parsed.head.insertBefore(parsed.createElement('base'), parsed.head.firstChild);
    base.href = new URL(document.baseURI).href;
    var site = parsed.querySelector('.site'), dw = parsed.getElementById('dwg'), ft = parsed.getElementById('dwg-foot'); if (ft) ft.remove();
    all('.dwg-col,.dwg-strip,.dwg-legend,.dwg-gridh,.dwg-probes', parsed).forEach(function (n) { n.remove(); });
    var body = parsed.body, proto = [site, dw]; proto.forEach(function (n) { n.remove(); });
    var win = 1, cuts = info.cuts;
    for (var sh = 2; sh <= info.sheets; sh++) {
      var d = parsed.cloneNode(true), b = d.body; b.textContent = '';
      d.documentElement.style.setProperty('--dwg-s', info.s); d.documentElement.style.setProperty('--dwg-tx', ((PAD - info.left) * info.s) + 'px');
      for (var slot = 0; slot < 2 && win + slot < cuts.length - 1; slot++) {
        var a_ = cuts[win + slot], b_ = cuts[win + slot + 1], box_ = d.createElement('div'); box_.className = 'dwg-win'; box_.style.left = (12 + slot * 750) + 'px'; box_.style.height = Math.ceil((b_ - a_) * info.s) + 'px'; box_.style.setProperty('--dwg-ty', (-a_ * info.s) + 'px');
        box_.appendChild(d.importNode(site, true)); box_.appendChild(d.importNode(dw, true)); b.appendChild(box_);
      }
      win += 2;
      var st = d.createElement('div'); st.className = 'dwg-stamp'; st.innerHTML = 'DWG NO. DH-001/' + pageNo() + ' · REV ' + esc(REV) + ' · ' + esc(pageTitle()).toUpperCase() + ' · SCALE ' + fmt(info.s) + ':1 · SHEET ' + sh + ' OF ' + info.sheets; b.appendChild(st);
      var fr = document.createElement('iframe'); fr.className = 'dwg-printframe'; fr.title = 'Print sheet ' + sh; fr.tabIndex = -1; fr.setAttribute('aria-hidden', 'true');
      fr.srcdoc = '<!doctype html>' + d.documentElement.outerHTML;
      document.body.appendChild(fr); S.extras.push(fr);
    }
  }
  function bp() {
    if (S.sheet) return;
    root.setAttribute('data-dwg-print', '');
    S.theme = root.getAttribute('data-theme'); root.setAttribute('data-theme', 'light');
    if (S.ready && S.frame) root.setAttribute('data-dwg-frame', '');
    else { S.fallback = true; render(false); }
  }
  function ap() {
    if (S.sheet) return;
    root.removeAttribute('data-dwg-print'); root.removeAttribute('data-dwg-frame');
    if (S.theme == null) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', S.theme);
    if (S.fallback) { S.fallback = false; render(false); }
  }
  window.__drawing = {
    on: on, off: off, toggle: function () { if (S.on) off(); else on(); }, isOn: function () { return S.on; },
    list: function () { return S.dims.map(function (d) { return { code: d.code, value: d.value, prop: d.prop, el: d.el, labelEl: d.labelEl, name: d.role }; }); },
    counts: counts, sheetInfo: sheetInfo, _sheetDrawn: frameDrawn
  };
})();
