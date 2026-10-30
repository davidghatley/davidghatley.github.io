/* Drawing mode: redraws the live page as a dimensional-drawing sheet. Loaded by site.js on the first toggle; nothing here
   runs before that. Every number comes from getBoundingClientRect / getComputedStyle at draw time; none is written here.
   The sheet conventions and the pen-draw idea are adapted from dimensional-drawing by Enes Ozturk (MIT):
   https://github.com/enesozturk/dimensional-drawing. Copyright (c) 2026 Enes Ozturk. Line kit, codes, tables and
   title block follow its rules; the measuring engine and the site's two inks are this site's own. */
(function () {
  var REV = '11e4550'; // build.py: git rev
  var NS = 'http://www.w3.org/2000/svg', root = document.documentElement;
  var LABEL_H = 12, CH = 6.6;
  var S = { on: false, dims: [], ro: null, t: 0, printing: false, first: true, lazy: [] };
  var over, svg, labels, foot, strip, probes, pageStyle, railL, railR, occ;

  function cs(e) { return getComputedStyle(e); }
  function px(v) { return parseFloat(v) || 0; }
  function box(e) { var r = e.getBoundingClientRect(), bx = S.ox, by = window.scrollY; return { l: r.left + bx, r: r.right + bx, t: r.top + by, b: r.bottom + by, w: r.width, h: r.height }; }
  function fmt(v) { return String(+(+v).toFixed(2)); }
  function snap(v) { return Math.floor(v) + 0.5; }
  function mk(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function h(t, c, html, p) { var e = document.createElement(t); if (c) e.className = c; if (html != null) e.innerHTML = html; if (p) p.appendChild(e); return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- names and codes: one variable per (kind, name, value), so a code can recur on the sheet ----------
  var IGNORE = /^(acc|has-|is-|px16|ss-page|t-a--x|an$|lm$)/;
  function nameOf(e) {
    var cl = String(e.className && e.className.baseVal != null ? e.className.baseVal : e.className || '').split(/\s+/).filter(function (c) { return c && !IGNORE.test(c); });
    if (cl[0] === 'tile' && cl[1]) cl.shift();
    var n = cl[0] || e.tagName.toLowerCase();
    if (!cl[0] && e.parentElement && e.parentElement.className && typeof e.parentElement.className === 'string' && e.parentElement.className) n = nameOf(e.parentElement) + ' ' + n;
    return n.replace(/__/g, '-').replace(/^t-(?=anime|lmr|tasty|fonts|vaasf)/, '').slice(0, 22);
  }
  var codes;
  function codeFor(prefix, name, value) {
    var key = prefix + '|' + name + '|' + fmt(value);
    if (codes.map[key]) return codes.map[key];
    if (prefix === 'COL' || prefix === 'M' || prefix === 'CELL') return (codes.map[key] = prefix);
    codes.n[prefix] = (codes.n[prefix] || 0) + 1;
    return (codes.map[key] = prefix + codes.n[prefix]);
  }

  // ---------- occupancy ----------
  function hit(r, list, pad) { pad = pad || 0; for (var i = 0; i < list.length; i++) { var q = list[i]; if (r.l < q.r + pad && q.l < r.r + pad && r.t < q.b + pad && q.t < r.b + pad) return true; } return false; }
  function inSheet(r) { return r.l >= 2 && r.r <= S.W - 2 && r.t >= 1 && r.b <= S.H - 1 && !hit(r, occ.mask); }
  function lab(cx, cy, w) { return { l: cx - w / 2, r: cx + w / 2, t: cy - LABEL_H / 2, b: cy + LABEL_H / 2 }; }
  function labelFree(r, strict) { return inSheet(r) && !hit(r, occ.labels, 1) && (!strict || (!hit(r, occ.h) && !hit(r, occ.v))); }
  function clampX(cx, w) { return Math.max(2 + w / 2, Math.min(S.W - 2 - w / 2, cx)); }

  // ---------- drawing primitives ----------
  function seq() { return S.anim ? Math.min(S.count++, 90) : 0; }
  function line(g, x1, y1, x2, y2, cls) { var l = mk('line', { x1: x1, y1: y1, x2: x2, y2: y2, 'class': cls, pathLength: 1 }, g); return l; }
  function arrow(g, x, y, dx, dy) { // tip at x,y pointing along dx,dy
    var a = 7, b = 2.3;
    mk('path', { d: 'M' + x + ',' + y + 'L' + (x - dx * a - dy * b) + ',' + (y - dy * a - dx * b) + 'L' + (x - dx * a + dy * b) + ',' + (y - dy * a + dx * b) + 'z', 'class': 'dwg-a' }, g);
  }
  function group(cls) { var g = mk('g', { 'class': cls || 'dwg-d' }, svg); g.style.setProperty('--i', seq()); return g; }
  function addLabel(code, r, i) {
    var e = h('span', 'dwg-l', esc(code), labels);
    e.style.cssText = 'left:' + r.l + 'px;top:' + r.t + 'px;width:' + (r.r - r.l) + 'px;--i:' + i;
    occ.labels.push(r);
    return e;
  }
  function commit(c, labelEl) {
    S.dims.push({ code: c.code, value: +fmt(c.value), prop: c.prop, el: c.el, labelEl: labelEl, name: c.name, group: c.group });
  }

  function placeH(c, x1, x2, ys, e1, e2) { // horizontal dimension, x1..x2 on one of the rows ys
    var w = c.code.length * CH + 4, span = x2 - x1;
    for (var i = 0; i < ys.length; i++) {
      var y = snap(ys[i]), row = { l: x1 - (span < w + 10 ? 12 : 0), r: x2 + (span < w + 10 ? 12 : 0), t: y - 2, b: y + 2 };
      if (hit(row, occ.h)) continue;
      var pos = null, strict, k, cs_;
      if (span >= w + 10) cs_ = [.5, .3, .7, .15, .85].map(function (t) { return x1 + span * t; });
      else cs_ = [x2 + 11 + w / 2, x1 - 11 - w / 2];
      for (strict = 1; strict >= 0 && !pos; strict--) for (k = 0; k < cs_.length && !pos; k++) { var r = lab(clampX(cs_[k], w), y, w); if (labelFree(r, !!strict)) pos = r; }
      if (!pos) continue;
      var g = group(), n = +g.style.getPropertyValue('--i');
      if (e1 != null) line(g, x1, e1 + (y > e1 ? 2 : -2), x1, y + (y > e1 ? 4 : -4), 'dwg-e');
      if (e2 != null) line(g, x2, e2 + (y > e2 ? 2 : -2), x2, y + (y > e2 ? 4 : -4), 'dwg-e');
      if (span >= 20) { line(g, x1, y, x2, y, 'dwg-m'); arrow(g, x1, y, -1, 0); arrow(g, x2, y, 1, 0); }
      else { line(g, x1 - 11, y, x2 + 11, y, 'dwg-m'); arrow(g, x1, y, 1, 0); arrow(g, x2, y, -1, 0); }
      occ.h.push(row);
      commit(c, addLabel(c.code, pos, n));
      return true;
    }
    return false;
  }
  function placeV(c, y1, y2, xs, e1, e2) { // vertical dimension, y1..y2 on one of the columns xs
    var w = c.code.length * CH + 4, span = y2 - y1;
    for (var i = 0; i < xs.length; i++) {
      var x = snap(xs[i]), col = { l: x - 2, r: x + 2, t: y1 - (span < 30 ? 12 : 0), b: y2 + (span < 30 ? 12 : 0) };
      if (hit(col, occ.v) || col.l < 2 || col.r > S.W - 2) continue;
      var pos = null, strict, k, opts;
      if (span >= LABEL_H + 12) opts = [.5, .3, .7, .15, .85].map(function (t) { return [x, y1 + span * t]; });
      else opts = [[x + w / 2 + 5, (y1 + y2) / 2], [x - w / 2 - 5, (y1 + y2) / 2], [x, y1 - 18], [x, y2 + 18]];
      for (strict = 1; strict >= 0 && !pos; strict--) for (k = 0; k < opts.length && !pos; k++) { var r = lab(clampX(opts[k][0], w), opts[k][1], w); if (labelFree(r, !!strict)) pos = r; }
      if (!pos) continue;
      var g = group(), n = +g.style.getPropertyValue('--i');
      if (e1 != null) line(g, e1 + (x > e1 ? 2 : -2), y1, x + (x > e1 ? 4 : -4), y1, 'dwg-e');
      if (e2 != null) line(g, e2 + (x > e2 ? 2 : -2), y2, x + (x > e2 ? 4 : -4), y2, 'dwg-e');
      if (span >= 20) { line(g, x, y1, x, y2, 'dwg-m'); arrow(g, x, y1, 0, -1); arrow(g, x, y2, 0, 1); }
      else { line(g, x, y1 - 11, x, y2 + 11, 'dwg-m'); arrow(g, x, y1, 0, 1); arrow(g, x, y2, 0, -1); }
      occ.v.push(col);
      commit(c, addLabel(c.code, pos, n));
      return true;
    }
    return false;
  }

  // ---------- candidates: what can be dimensioned, measured now ----------
  function visible(e) {
    if (!e || !e.getBoundingClientRect) return false;
    var r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
    var s = cs(e); return s.visibility !== 'hidden' && s.display !== 'none' && s.display !== 'inline';
  }
  var SKIP = '.sr-only,.ch,.tt,.t-link,.case-bar,.dwg-probes,script,style,defs,[hidden],input,.cmp-b,.cmp-l,.cmp-h,.seg,.ibtn,.parrow,.static';
  function mkc(prefix, nm, group, prop, el, value, run) { return { prefix: prefix, name: nm, group: group, prop: prop, el: el, value: value, run: run }; }
  function tracksFor(b) { // columns for a vertical dim on box b: nearest margin first, then inside the box
    var L = S.L, R = S.R, left = b.l + b.w / 2 < S.W / 2, out = [], gapL = b.l - L, gapR = R - b.r, maxReach = S.W < 640 ? 120 : 170;
    var lt = S.leftTracks, rt = S.rightTracks;
    if (left && gapL <= maxReach) out = out.concat(lt);
    if (!left && gapR <= maxReach) out = out.concat(rt);
    if (b.w > 40) out.push(b.l + 10, b.r - 10, b.l + b.w * .28, b.l + b.w * .72);
    return out;
  }
  function vExt(b, x) { return x < b.l ? b.l : x > b.r ? b.r : null; }
  function cHeight(e, nm) {
    return mkc('H', nm + ' h', 'SIZE', 'height', e, 0, function (c) {
      var b = box(e), xs = tracksFor(b);
      for (var i = 0; i < xs.length; i++) { var ex = vExt(b, xs[i]); if (placeV(c, b.t, b.b, [xs[i]], ex, ex)) return true; }
      return false;
    });
  }
  function cWidth(e, nm) {
    return mkc('W', nm + ' w', 'SIZE', 'width', e, 0, function (c) {
      var b = box(e), inside = b.h > 44;
      var ys = [b.t - 7, b.b + 7]; if (inside) ys.push(b.t + 12, b.b - 12, b.t + b.h * .5);
      for (var i = 0; i < ys.length; i++) { var yo = ys[i]; var ex = yo < b.t ? b.t : yo > b.b ? b.b : null; if (placeH(c, b.l, b.r, [yo], ex, ex)) return true; }
      return false;
    });
  }
  function cPad(e, side, nm) {
    var prop = 'padding-' + side;
    return mkc('S', nm + ' pad-' + side[0], 'SPACING', prop, e, 0, function (c) {
      var b = box(e), p = c.value;
      if (side === 'top') return placeV(c, b.t, b.t + p, [b.l + b.w * .18, b.l + b.w * .4, b.l + b.w * .62, b.l + b.w * .84], null, null);
      if (side === 'bottom') return placeV(c, b.b - p, b.b, [b.l + b.w * .18, b.l + b.w * .4, b.l + b.w * .62, b.l + b.w * .84], null, null);
      if (side === 'left') return placeH(c, b.l, b.l + p, [b.t + b.h * .5, b.t + b.h * .25, b.t + b.h * .75], null, null);
      return placeH(c, b.r - p, b.r, [b.t + b.h * .5, b.t + b.h * .25, b.t + b.h * .75], null, null);
    });
  }
  function kidsOf(e) { return Array.prototype.filter.call(e.children, function (k) { return visible(k) && !k.matches(SKIP) && cs(k).position !== 'absolute'; }); }
  function cGap(e, nm) { // the gap as drawn: only when two real neighbours actually sit that far apart
    var s = cs(e), col = px(s.columnGap), row = px(s.rowGap), val = col || row, kids = kidsOf(e), i;
    if (!val || kids.length < 2) return null;
    for (i = 0; i + 1 < kids.length; i++) {
      var a = kids[i].getBoundingClientRect(), q = kids[i + 1].getBoundingClientRect();
      if (Math.abs(q.left - a.right - val) < 1 && q.top < a.bottom && a.top < q.bottom) {
        return mkc('G', nm + ' gap', 'SPACING', 'gap', e, val, (function (k1, k2) { return function (c) {
          var A = box(k1), B = box(k2), t = Math.max(A.t, B.t), bt = Math.min(A.b, B.b);
          return placeH(c, A.r, B.l, [t + (bt - t) * .5, t + (bt - t) * .3, t + (bt - t) * .7, t + 8], null, null);
        }; })(kids[i], kids[i + 1]));
      }
      if (Math.abs(q.top - a.bottom - val) < 1 && !col) {
        return mkc('G', nm + ' gap', 'SPACING', 'gap', e, val, (function (k1, k2) { return function (c) {
          var A = box(k1), B = box(k2), L = Math.max(A.l, B.l), R = Math.min(A.r, B.r);
          return placeV(c, A.b, B.t, [L + (R - L) * .5, L + (R - L) * .25, L + (R - L) * .75, L + 12], null, null);
        }; })(kids[i], kids[i + 1]));
      }
    }
    return null;
  }
  function cMargin(e, nm) {
    var p = e.previousElementSibling, m = px(cs(e).marginTop);
    if (m < 4 || !visible(p) || p.matches(SKIP) || cs(p).position === 'absolute') return null;
    if (Math.abs(e.getBoundingClientRect().top - p.getBoundingClientRect().bottom - m) > 1) return null;
    return mkc('S', nm + ' mar-t', 'SPACING', 'margin-top', e, m, function (c) {
      var A = box(p), B = box(e), L = Math.max(A.l, B.l), R = Math.min(A.r, B.r);
      return placeV(c, A.b, B.t, [L + (R - L) * .1, L + (R - L) * .5, L + (R - L) * .9], null, null);
    });
  }
  function isMedia(e) { return /^(IMG|VIDEO|CANVAS|svg)$/.test(e.tagName); }
  // breadth first through one block; returns its candidates, most structural first
  function walk(rootEl, cap) {
    var out = [], q = [[rootEl, 0]], seen = [], media_ = [];
    while (q.length && out.length < cap) {
      var it = q.shift(), e = it[0], d = it[1];
      if (!visible(e) || e.matches(SKIP) || e.closest('.case-bar')) continue;
      var b = e.getBoundingClientRect(), sig = [b.left, b.top, b.width, b.height].map(Math.round).join();
      var dup = seen.indexOf(sig) >= 0; seen.push(sig);
      var s = cs(e), nm = nameOf(e), media = isMedia(e), classed = typeof e.className === 'string' ? !!e.className : !!(e.className && e.className.baseVal);
      if (media) {
        if (!dup && b.width >= 16 && b.height >= 16) { if (b.width >= 48) media_.push(cWidth(e, nm)); media_.push(cHeight(e, nm)); }
        continue;
      }
      if (!dup && (classed || d === 0) && b.height >= 12) {
        if (d < 3) out.push(cHeight(e, nm));
        if (d === 0 || b.width < rootEl.getBoundingClientRect().width - 1) { if (b.width >= 44) out.push(cWidth(e, nm)); }
      }
      if (!dup) {
        ['top', 'bottom', 'left', 'right'].forEach(function (sd) { var p = px(s['padding' + sd[0].toUpperCase() + sd.slice(1)]); if (p >= 4 && b.width > 40 && b.height > 2 * p) out.push(cPad(e, sd, nm)); });
        if (/grid|flex/.test(s.display)) { var g = cGap(e, nm); if (g) out.push(g); }
        var mg = cMargin(e, nm); if (mg) out.push(mg);
      }
      if (d < 4) Array.prototype.forEach.call(e.children, function (k) { q.push([k, d + 1]); });
    }
    out.splice.apply(out, [Math.min(2, out.length), 0].concat(media_));
    return out;
  }
  function roots() {
    var main = document.querySelector('main');
    if (window.PAGE === 'case') {
      var r = [], add = function (e, depth) {
        Array.prototype.forEach.call(e.children, function (k) {
          if (!visible(k) || k.matches(SKIP)) return;
          var kids = kidsOf(k);
          if (depth < 3 && k.getBoundingClientRect().width > main.getBoundingClientRect().width * .9 && kids.length >= 1 && k.getBoundingClientRect().height > 900) add(k, depth + 1);
          else r.push(k);
        });
      };
      add(main, 0);
      return r.slice(0, 30);
    }
    if (window.PAGE === 'lab') return Array.prototype.slice.call(document.querySelectorAll('.lab-intro,.lane .cat__head,.lc')).filter(visible);
    return Array.prototype.slice.call(document.querySelectorAll('.tile,.lab-line,.about,.bg__id,.bg__fig')).filter(visible);
  }

  // ---------- the sheet-wide dimensions and geometry ----------
  function drawGrid() {
    var col = probes.col.getBoundingClientRect().width, g = probes.g.getBoundingClientRect().width, n = Math.round(px(cs(document.querySelector('.site')).getPropertyValue('--n'))) || 12;
    var site = box(document.querySelector('.site')), x = site.l;
    var gb = mk('g', { 'class': 'dwg-grid' }, svg);
    for (var i = 0; i < n; i++) { mk('rect', { x: x, y: 0, width: col, height: S.H }, gb); x += col + g; }
    return { col: col, g: g, n: n, site: site };
  }
  function sheetDims(G) {
    var site = document.querySelector('.site'), head = document.querySelector('.site-head'), hb = box(head);
    var top = Math.min(14, px(cs(site).paddingTop) / 2 + 2);
    var mar = px(cs(site).marginLeft);
    function make(prefix, nm, grp, prop, el, val) { var c = mkc(prefix, nm, grp, prop, el, val); c.code = codeFor(prefix, nm, val); return c; }
    placeH(make('W', 'content-w', 'GRID', 'width', site, G.site.w), G.site.l, G.site.r, [top], hb.t, hb.t);
    if (S.W >= 640) placeH(make('M', 'margin', 'GRID', 'margin-left', site, mar), 0, G.site.l, [top], null, hb.t);
    // the column chain: every column is ticked, the first column and first gutter carry the codes
    var chainY = hb.b + 10, x = G.site.l, gt = mk('g', { 'class': 'dwg-d dwg-t' }, svg); gt.style.setProperty('--i', 2);
    for (var i = 0; i <= G.n; i++) {
      if (i > 0 && i < G.n) { line(gt, snap(x - G.g), chainY - 4, snap(x - G.g), chainY + 4, 'dwg-e'); }
      line(gt, snap(x), chainY - 4, snap(x), chainY + 4, 'dwg-e'); x += G.col + G.g;
    }
    placeH(make('COL', 'column', 'GRID', 'column-width', probes.col, G.col), G.site.l, G.site.l + G.col, [chainY], null, null);
    placeH(make('G', 'gutter', 'GRID', 'width', probes.g, G.g), G.site.l + G.col, G.site.l + G.col + G.g, [chainY], null, null);
    var sp = px(cs(site).paddingTop);
    placeV(make('S', 'site pad-t', 'SPACING', 'padding-top', site, sp), 0, sp, [G.site.r - 28], null, null);
    placeV(make('H', 'site-head h', 'SIZE', 'height', head, hb.h), hb.t, hb.b, [S.leftTracks[0]], hb.l, hb.l);
    var mk_ = document.querySelector('.ss-lockup__mark');
    if (visible(mk_)) { var mb = box(mk_); placeH(make('Z', 'mark', 'SIZE', 'width', mk_, mb.w), mb.l, mb.r, [mb.t - 6], null, null); }
  }
  function outlines() {
    var sel = '.tile,.lc,.about,.lane .cat__head,.dos__sheet,.dos__fig,.case-deep figure,.hero,.tally,.site-foot,main img,main video,main canvas';
    var g = mk('g', { 'class': 'dwg-d dwg-o' }, svg), n = 0, seen = {};
    g.style.setProperty('--i', 0);
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (e) {
      if (n > 90 || !visible(e) || e.closest('.case-bar')) return;
      var b = box(e), key = [b.l, b.t, b.w, b.h].map(Math.round).join(); if (seen[key] || b.w < 24 || b.h < 16) return; seen[key] = 1; n++;
      mk('rect', { x: snap(b.l), y: snap(b.t), width: Math.round(b.w) - 1, height: Math.round(b.h) - 1, pathLength: 1, 'class': isMedia(e) ? 'dwg-ob' : 'dwg-oo' }, g);
      if (isMedia(e) && n < 40 && b.w > 120 && b.h > 80) {
        line(g, b.l - 6, snap(b.t + b.h / 2), b.r + 6, snap(b.t + b.h / 2), 'dwg-c');
        line(g, snap(b.l + b.w / 2), b.t - 6, snap(b.l + b.w / 2), b.b + 6, 'dwg-c');
      }
    });
  }
  function frame() {
    var g = mk('g', { 'class': 'dwg-f' }, svg);
    mk('rect', { x: 3.5, y: 3.5, width: S.W - 7, height: S.H - 7, rx: 12, ry: 12 }, g);
    if (S.W >= 1024) for (var y = 400; y < S.H - 100; y += 400) line(g, 3.5, snap(y), 10, snap(y), 'dwg-e'); // zone ticks
  }

  // ---------- details: the two circles, drawn from the real elements ----------
  function detailTargets() {
    return {
      tile: ['.tile', '.lc', '.dos__fig', '.hero', 'main figure', 'main img'].reduce(function (f, q) { // the second of its kind: the first sits on the glyph
        if (f) return f; var a = Array.prototype.filter.call(document.querySelectorAll(q), visible); return a[1] || a[0] || null;
      }, null) || document.querySelector('main'),
      glyph: Array.prototype.find.call(document.querySelectorAll('.t-head .glyph,.lc__head .glyph,.dos__id .glyph,.dos__id svg'), function (g) { return visible(g) && g.querySelector('rect'); }) || document.querySelector('.ss-lockup__mark')
    };
  }
  function mark(x, y, letter) { // the small dashed circle on the page, with its letter
    var g = mk('g', { 'class': 'dwg-d dwg-ref' }, svg); g.style.setProperty('--i', 6);
    mk('circle', { cx: x, cy: y, r: 16, pathLength: 1 }, g);
    var px_ = Math.max(9, x - 16 - 10), r = lab(px_, y - 16, 12);
    if (hit(r, occ.labels) || !inSheet(r)) { r = lab(x + 22, y - 18, 12); }
    var e = h('span', 'dwg-l dwg-l--ref', letter, labels); e.style.cssText = 'left:' + r.l + 'px;top:' + r.t + 'px;width:12px;--i:6';
    occ.labels.push(r);
  }
  function detailCorner(e, code) {
    var b = e.getBoundingClientRect(), s = cs(e), R = px(s.borderTopLeftRadius), bw = px(s.borderTopWidth);
    var bf = getComputedStyle(e, '::before'), rule = px(bf.height) && bf.content !== 'none' ? px(bf.height) : 0;
    if (!rule && e.querySelector) { var t = e.querySelector('.t-a'); if (t) { var bt = getComputedStyle(t, '::before'); if (bt.content !== 'none') rule = px(bt.height); } }
    var B = bw || rule; // the top line as drawn: a border, or the 1px rule pseudo-element
    var inner = Array.prototype.find.call(e.querySelectorAll('*'), function (k) { var r = k.getBoundingClientRect(); return visible(k) && !k.matches(SKIP) && r.top - b.top + (r.left - b.left) > 0 && r.width > 4 && (r.left > b.left || r.top > b.top); });
    var ib = inner ? inner.getBoundingClientRect() : null, ix = ib ? ib.left - b.left : 0, iy = ib ? ib.top - b.top : 0;
    var M = 6, D = 152, c = D / 2, sv = mk('svg', { viewBox: '0 0 ' + D + ' ' + D, 'class': 'dwg-dsvg', role: 'img', 'aria-label': 'Corner magnified six times' });
    var id = 'dwgclipA'; var cp = mk('clipPath', { id: id }, mk('defs', {}, sv)); mk('circle', { cx: c, cy: c, r: c - 1 }, cp);
    var g = mk('g', { 'clip-path': 'url(#' + id + ')' }, sv);
    var ox = c - 18, oy = c - 18; // corner, in the circle
    var fx = ((b.left + S.ox) % 4 + 4) % 4, fy = ((b.top + window.scrollY) % 4 + 4) % 4;
    for (var i = -6; i < 8; i++) { line(g, ox + (i * 4 - fx) * M, 0, ox + (i * 4 - fx) * M, D, 'dwg-lat'); line(g, 0, oy + (i * 4 - fy) * M, D, oy + (i * 4 - fy) * M, 'dwg-lat'); }
    var r6 = R * M;
    mk('path', { d: 'M' + (D + 4) + ',' + oy + 'H' + (ox + r6) + (r6 ? 'A' + r6 + ',' + r6 + ' 0 0 0 ' + ox + ',' + (oy + r6) : '') + 'V' + (D + 4), 'class': 'dwg-ol' }, g);
    if (B) mk('rect', { x: ox, y: oy, width: D, height: B * M, 'class': 'dwg-fill' }, g);
    if (ib && (ix || iy)) mk('path', { d: 'M' + (D + 4) + ',' + (oy + iy * M) + 'H' + (ox + ix * M) + 'V' + (D + 4), 'class': 'dwg-in' }, g);
    mk('circle', { cx: c, cy: c, r: c - 1, 'class': 'dwg-ring' }, sv);
    var tx = mk('text', { x: ox - 8, y: oy - 8, 'class': 'dwg-dt', 'text-anchor': 'end' }, sv); tx.textContent = code;
    var nested = Math.max(0, R - B - Math.max(ix, iy));
    return { svg: sv, label: tx, caption: 'SCALE 6:1 · R = ' + fmt(R) + ' (MEASURED) · B = ' + fmt(B) + ' · NESTED = MAX(0, R − B − S) = ' + fmt(nested), R: R, title: 'DETAIL A · ' + nameOf(e).toUpperCase() + ' CORNER' };
  }
  function detailCell(glyph, code) {
    var D = 152, c = D / 2, vb = glyph.viewBox.baseVal, gb = glyph.getBoundingClientRect(), unit = gb.width / (vb.width || 1);
    var rects = Array.prototype.slice.call(glyph.querySelectorAll('rect')), M = Math.max(2, 92 / (vb.width * unit));
    var sv = mk('svg', { viewBox: '0 0 ' + D + ' ' + D, 'class': 'dwg-dsvg', role: 'img', 'aria-label': 'Glyph cells on the 4 pixel grid' });
    var id = 'dwgclipB'; var cp = mk('clipPath', { id: id }, mk('defs', {}, sv)); mk('circle', { cx: c, cy: c, r: c - 1 }, cp);
    var g = mk('g', { 'clip-path': 'url(#' + id + ')' }, sv), ox = c - vb.width * unit * M / 2, oy = c - vb.height * unit * M / 2;
    var bPx = probes.b.getBoundingClientRect().width;
    for (var i = -8; i < 24; i++) { line(g, ox + i * bPx * M, 0, ox + i * bPx * M, D, 'dwg-lat'); line(g, 0, oy + i * bPx * M, D, oy + i * bPx * M, 'dwg-lat'); }
    var pick = rects[0];
    rects.forEach(function (r) { var q = mk('rect', { x: ox + r.x.baseVal.value * unit * M, y: oy + r.y.baseVal.value * unit * M, width: r.width.baseVal.value * unit * M, height: r.height.baseVal.value * unit * M, 'class': r === pick ? 'dwg-cell' : 'dwg-fill' }, g); });
    mk('circle', { cx: c, cy: c, r: c - 1, 'class': 'dwg-ring' }, sv);
    var w = pick.getBoundingClientRect().width;
    var tx = mk('text', { x: ox + pick.x.baseVal.value * unit * M + w * M / 2, y: oy + pick.y.baseVal.value * unit * M - 6, 'class': 'dwg-dt', 'text-anchor': 'middle' }, sv); tx.textContent = code;
    return { svg: sv, label: tx, el: pick, w: w, caption: 'SCALE ' + fmt(M) + ':1 · ' + code + ' = ' + fmt(w) + ' = ' + fmt(w / bPx) + '·B · B = ' + fmt(bPx), title: 'DETAIL B · GLYPH CELL', bPx: bPx };
  }

  // ---------- title block, notes, tables ----------
  function pageTitle() { return window.PAGE === 'case' ? (window.SLUG || 'case') : window.PAGE === 'lab' ? 'lab' : 'home'; }
  function titleBlock(print) {
    var v = S.printing ? 'A3 PLAN' : innerWidth + '×' + innerHeight;
    return '<div class="dwg-tb"><div class="dwg-tb__t"><span class="dwg-k">PORTFOLIO · DIMENSIONAL DRAWING</span><b class="dwg-tb__n">' + esc(pageTitle()) + '</b></div>'
      + cell('DWG NO.', 'DH-001') + cell('REV', esc(REV)) + cell('SCALE', '1:1') + cell('UNITS', 'CSS PX') + cell('SHEETS', '1') + cell('VIEW', v) + '</div>';
    function cell(k, val) { return '<div class="dwg-tb__c"><span class="dwg-k">' + k + '</span><span class="dwg-v">' + val + '</span></div>'; }
  }
  function notes(G) {
    return '<div class="dwg-notes"><b>NOTES:</b> (UNLESS OTHERWISE SPECIFIED)<ol>'
      + '<li>EVERY VALUE IS MEASURED FROM THE LIVE PAGE AT THIS WIDTH. RESIZE AND IT REDRAWS.</li>'
      + '<li>WIDTH: W = ' + G.n + '·COL + ' + (G.n - 1) + '·G = ' + fmt(G.n * G.col + (G.n - 1) * G.g) + '.</li>'
      + '<li>BASELINE B = ' + fmt(probes.b.getBoundingClientRect().width) + '. BLOCK HEIGHTS AND GAPS LAND ON MULTIPLES OF B.</li>'
      + '<li>RADIUS IS MEASURED, NOT ASSUMED. SEE DETAIL A.</li>'
      + (S.printing ? '<li>PLAN VIEW PRINTED AT ' + fmt(S.printScale) + ':1, TRUNCATED AT Y = ' + Math.round(S.cropH) + '.</li>' : '')
      + '</ol><p class="dwg-credit">DRAWING STYLE AFTER DIMENSIONAL-DRAWING, E. OZTURK (MIT).</p></div>';
  }
  function tables() {
    var order = ['GRID', 'SIZE', 'SPACING', 'RADIUS'], out = '', seen = {};
    order.forEach(function (grp) {
      var rows = S.dims.filter(function (d) { if (d.group !== grp || seen[d.code]) return false; seen[d.code] = 1; return true; });
      if (!rows.length) return;
      out += '<table class="dwg-tbl"><caption>' + grp + '</caption><thead><tr><th scope="col">CODE</th><th scope="col">VARIABLE</th><th scope="col">VALUE</th></tr></thead><tbody>'
        + rows.map(function (d) { return '<tr><th scope="row">' + esc(d.code) + '</th><td>' + esc(d.name) + '</td><td>' + fmt(d.value) + '</td></tr>'; }).join('') + '</tbody></table>';
    });
    return out;
  }
  function detailFig(d) { var f = h('figure', 'dwg-det'); f.appendChild(d.svg); h('figcaption', '', '<b>' + esc(d.title) + '</b><span>' + esc(d.caption) + '</span>', f); return f; }

  // ---------- one full draw ----------
  function budget() {
    var base = S.printing ? 80 : S.W >= 1200 ? 66 : S.W >= 640 ? 34 : 22;
    return Math.round(Math.min(base * 2, base * Math.max(1, S.H / (S.W < 640 ? 3600 : 2400))));
  }
  function render(anim) {
    var site = document.querySelector('.site');
    if (!over) return;
    if (S.sheet) root.setAttribute('data-dwg-measure', ''); // measure the page at 1:1, then let it scale
    svg.textContent = ''; labels.textContent = ''; S.dims = []; codes = { map: {}, n: {} }; S.count = 0; S.anim = !!anim;
    occ = { labels: [], h: [], v: [], mask: [] };
    over.style.height = '0px';
    S.ox = window.scrollX;
    var sb = site.getBoundingClientRect();
    S.W = document.body.clientWidth; S.H = Math.ceil(sb.bottom + window.scrollY);
    if (S.printing) S.H = Math.min(S.H, Math.ceil(S.cropH));
    S.L = sb.left + S.ox; S.R = sb.right + S.ox;
    var marginW = S.L;
    S.rail = !S.printing && marginW >= 232 && S.W >= 1200;
    S.leftTracks = marginW >= 80 ? [S.L - 16, S.L - 44, S.L - 72] : [Math.max(8, S.L / 2)];
    S.rightTracks = [S.R + Math.max(8, Math.min(14, (S.W - S.R) / 2))];
    over.style.height = S.H + 'px'; over.style.width = S.W + 'px';
    svg.setAttribute('width', S.W); svg.setAttribute('height', S.H); svg.setAttribute('viewBox', '0 0 ' + S.W + ' ' + S.H);
    root.toggleAttribute('data-dwg-anim', !!anim && !matchMedia('(prefers-reduced-motion: reduce)').matches);
    railL.hidden = railR.hidden = !S.rail; strip.hidden = S.rail || S.printing; foot.hidden = S.rail && !S.printing;
    if (S.rail) { occ.mask.push({ l: 12, r: S.L - 84, t: 0, b: S.H }, { l: S.R + 24, r: S.W - 8, t: 16, b: S.H }); railL.style.width = (S.L - 84 - 16) + 'px'; railR.style.width = (S.W - S.R - 24 - 12) + 'px'; }

    var G = drawGrid(); if (!S.printing) frame(); outlines();
    var T = detailTargets(), tb = box(T.tile), gb = box(T.glyph);
    mark(tb.l, tb.t, 'A'); mark(gb.l + gb.w / 2, gb.t + gb.h / 2, 'B');
    sheetDims(G);

    // round robin over the page's blocks so the dimensions spread down the whole sheet
    var groups = roots().map(function (r) { return walk(r, S.W < 640 ? 8 : 16); }).filter(function (g) { return g.length; });
    var limit = budget(), i = 0;
    while (S.dims.length < limit && groups.some(function (g) { return g.length; })) {
      var g = groups[i++ % groups.length]; if (!g.length) continue;
      var c = g.shift(); if (!c) continue;
      if (S.printing && c.el.getBoundingClientRect().top + window.scrollY > S.cropH - 40) continue;
      var val = c.prop === 'width' ? c.el.getBoundingClientRect().width : c.prop === 'height' ? c.el.getBoundingClientRect().height : c.prop === 'gap' ? c.value : px(cs(c.el).getPropertyValue(c.prop));
      if (!val) continue;
      c.value = val; c.code = codeFor(c.prefix, c.name, val);
      c.run(c);
    }

    // details: their codes join the variables table
    var dA = detailCorner(T.tile, 'R1'), dB = detailCell(T.glyph, 'CELL');
    S.dims.push({ code: 'R1', value: dA.R, prop: 'border-radius', el: T.tile, labelEl: dA.label, name: nameOf(T.tile) + ' radius', group: 'RADIUS' });
    S.dims.push({ code: 'CELL', value: +fmt(dB.w), prop: 'width', el: dB.el, labelEl: dB.label, name: 'glyph cell', group: 'GRID' });
    var bProbe = dB.bPx;
    S.dims.push({ code: 'B', value: +fmt(bProbe), prop: 'width', el: probes.b, labelEl: bLabel(dB), name: 'baseline', group: 'GRID' });

    var hdr = titleBlock(), ntx = notes(G), tbl = tables(), figA = detailFig(dA), figB = detailFig(dB);
    if (S.rail) {
      railR.innerHTML = hdr + '<div class="dwg-tables">' + tbl + '</div>';
      railL.textContent = ''; railL.appendChild(figA); railL.appendChild(figB); railL.insertAdjacentHTML('beforeend', ntx);
      foot.textContent = '';
    } else {
      foot.innerHTML = hdr + '<div class="dwg-foot__g"><div class="dwg-foot__d"></div><div class="dwg-foot__n">' + ntx + '</div></div><div class="dwg-tables">' + tbl + '</div>';
      var fd = foot.querySelector('.dwg-foot__d'); fd.appendChild(figA); fd.appendChild(figB);
      if (!S.printing) { foot.style.marginLeft = S.L + 'px'; foot.style.width = (S.R - S.L) + 'px'; }
      strip.innerHTML = '<span>DWG DH-001</span><span>REV ' + esc(REV) + '</span><span>1:1</span><span>CSS PX</span><a href="#dwg-foot">VARIABLES ' + uniq() + '</a>';
    }
    root.removeAttribute('data-dwg-measure');
  }
  function uniq() { var o = {}; S.dims.forEach(function (d) { o[d.code] = 1; }); return Object.keys(o).length; }
  function bLabel(dB) { // the B tick drawn in detail B
    var t = mk('text', { x: 76, y: 146, 'class': 'dwg-dt', 'text-anchor': 'middle' }, dB.svg); t.textContent = 'B'; return t;
  }

  // ---------- on, off, resize, print ----------
  function later() { clearTimeout(S.t); S.t = setTimeout(function () { if (S.on && (!S.printing || S.sheet)) { if (S.sheet) eagerTop(); render(false); } }, 120); }
  function eagerTop() { // what the print view shows has to be there before the print dialog
    Array.prototype.forEach.call(document.querySelectorAll('main img[loading="lazy"]'), function (i) { if (i.getBoundingClientRect().top + scrollY < 2000) { i.loading = 'eager'; S.lazy.push(i); } });
  }
  function build() {
    var site = document.querySelector('.site');
    probes = { host: h('div', 'dwg-probes') };
    ['col', 'g', 'b'].forEach(function (k) { probes[k] = h('i', '', null, probes.host); probes[k].style.width = 'var(--' + k + ')'; });
    site.appendChild(probes.host);
    over = h('div', ''); over.id = 'dwg'; over.setAttribute('aria-hidden', 'false');
    svg = mk('svg', { 'class': 'dwg-svg', 'aria-hidden': 'true' }, over);
    labels = h('div', 'dwg-labels', null, over); labels.setAttribute('aria-hidden', 'true');
    railL = h('div', 'dwg-rail dwg-rail--l', null, over);
    railR = h('div', 'dwg-rail dwg-rail--r', null, over); railR.setAttribute('role', 'region'); railR.setAttribute('aria-label', 'Title block and variables'); railR.tabIndex = 0;
    document.body.appendChild(over);
    foot = h('div', 'dwg-foot'); foot.id = 'dwg-foot'; foot.setAttribute('role', 'region'); foot.setAttribute('aria-label', 'Title block and variables');
    site.parentNode.insertBefore(foot, site.nextSibling);
    strip = h('div', 'dwg-strip'); document.body.appendChild(strip);
    pageStyle = h('style', ''); pageStyle.textContent = '@page { size: A3 landscape; margin: 10mm; }'; document.head.appendChild(pageStyle);
  }
  function teardown() {
    [over, foot, strip, pageStyle, S.frame, probes && probes.host].forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
    over = foot = strip = pageStyle = probes = S.frame = null;
  }
  function on() {
    if (S.on) return; S.on = true;
    root.setAttribute('data-drawing', ''); build(); eagerTop();
    S.sheet = window.parent !== window && location.hash === '#dwg-sheet';
    if (S.sheet) setupSheet(); else setTimeout(function () { if (S.on) makeFrame(); }, 300);
    render(!S.sheet);
    S.ro = new ResizeObserver(later); S.ro.observe(document.querySelector('.site'));
    window.addEventListener('resize', later); window.addEventListener('beforeprint', bp); window.addEventListener('afterprint', ap);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    pressed(true);
  }
  function off() {
    if (!S.on) return; S.on = false; clearTimeout(S.t);
    if (S.ro) S.ro.disconnect();
    window.removeEventListener('resize', later); window.removeEventListener('beforeprint', bp); window.removeEventListener('afterprint', ap);
    S.lazy.forEach(function (i) { i.loading = 'lazy'; }); S.lazy = [];
    teardown(); S.dims = [];
    root.removeAttribute('data-drawing'); root.removeAttribute('data-dwg-anim');
    pressed(false);
  }
  function pressed(v) { var b = document.getElementById('draw-toggle'); if (b) b.setAttribute('aria-pressed', v ? 'true' : 'false'); }
  // printing: the plan lives in a hidden frame 1512 px wide (see drawing.css); it draws itself once and stays ready
  var PW = 1512, PH = 1046, PANEL = 776; // A3 landscape less 10mm margins, in CSS px
  function setupSheet() {
    S.printing = true;
    root.setAttribute('data-theme', 'light'); root.setAttribute('data-dwg-plan', '');
    var site = document.querySelector('.site').getBoundingClientRect(), left = site.left + scrollX, pad = 112;
    var sc = (PW - PANEL - 16) / (site.width + 2 * pad), v = root.style;
    S.printScale = sc; S.cropH = PH / sc;
    v.setProperty('--dwg-s', sc); v.setProperty('--dwg-tx', ((pad - left) * sc) + 'px'); v.setProperty('--dwg-ox', -left + 'px');
    foot.style.left = (PW - PANEL) + 'px';
  }
  function makeFrame() {
    if (window.parent !== window || innerWidth < 640 || S.frame) return; // phones print the sheet data alone
    var f = S.frame = document.createElement('iframe');
    f.className = 'dwg-printframe'; f.title = 'Print sheet'; f.tabIndex = -1; f.setAttribute('aria-hidden', 'true');
    f.src = location.pathname + location.search + '#dwg-sheet';
    document.body.appendChild(f);
  }
  function frameReady() { try { var w = S.frame && S.frame.contentWindow; return !!(w && w.__drawing && w.__drawing.isOn()); } catch (e) { return false; } }
  function bp() {
    if (S.sheet) return;
    root.setAttribute('data-dwg-print', '');
    S.theme = root.getAttribute('data-theme'); root.setAttribute('data-theme', 'light'); // paper is always light, margins included
    if (frameReady()) { root.setAttribute('data-dwg-frame', ''); return; }
    S.printing = true; S.printScale = 1; S.cropH = 1e6;
    render(false);
  }
  function ap() {
    if (S.sheet) return;
    var wasFrame = root.hasAttribute('data-dwg-frame');
    root.removeAttribute('data-dwg-print'); root.removeAttribute('data-dwg-frame');
    if (S.theme == null) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', S.theme);
    if (wasFrame) return;
    S.printing = false;
    render(false);
  }
  window.__drawing = {
    on: on, off: off, toggle: function () { if (S.on) off(); else on(); }, isOn: function () { return S.on; },
    list: function () { return S.dims.map(function (d) { return { code: d.code, value: d.value, prop: d.prop, el: d.el, labelEl: d.labelEl, name: d.name }; }); }
  };
})();
