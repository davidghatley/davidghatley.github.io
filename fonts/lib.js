(function () {
  var G = window.SAUCE_GLYPHS || {}, NS = 'http://www.w3.org/2000/svg';
  document.querySelectorAll('#mk, [data-mk]').forEach(function (mk) {
    (G.mark || []).forEach(function (r, y) { for (var x = 0; x < 7; x++) if (r[x] === 'X') { var q = document.createElementNS(NS, 'rect');
      q.setAttribute('x', x); q.setAttribute('y', y); q.setAttribute('width', 1); q.setAttribute('height', 1); mk.appendChild(q); } });
  });
  function press(group, btn) { group.querySelectorAll('.seg').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); }); }
  // directory: preview text, size, search and category
  var cards = document.getElementById('cards');
  if (cards) {
    var pv = document.getElementById('pv'), sz = document.getElementById('sz'), q = document.getElementById('q'), count = document.getElementById('count');
    var on = {};
    function lh(s) { return s <= 16 ? 24 : s <= 32 ? 40 : s <= 48 ? 56 : s; }
    function apply() {
      var t = pv.value, s = +sz.value, n = 0, term = q.value.trim().toLowerCase(), cats = Object.keys(on).filter(function (k) { return on[k]; });
      cards.querySelectorAll('.card').forEach(function (c) {
        var smp = c.querySelector('.card__sample'); smp.textContent = t || smp.dataset.sample;
        smp.style.fontSize = s + 'px'; smp.style.lineHeight = lh(s) + 'px';
        var ok = (!term || c.dataset.name.indexOf(term) >= 0) && (!cats.length || cats.some(function (k) { return c.dataset.cats.split(' ').indexOf(k) >= 0; }));
        c.hidden = !ok; if (ok) n++;
      });
      count.textContent = n + (n === 1 ? ' family' : ' families');
    }
    [pv, sz, q].forEach(function (e) { e.addEventListener('input', apply); });
    document.querySelectorAll('.chip').forEach(function (b) { b.addEventListener('click', function () { on[b.dataset.cat] = !on[b.dataset.cat]; b.setAttribute('aria-pressed', String(!!on[b.dataset.cat])); apply(); }); });
  }
  // family page: tester and character set
  var out = document.getElementById('tout');
  if (out) {
    var tester = out.closest('.tester'), foot = document.getElementById('tfoot'), grid = !!document.querySelector('.plate-g .g');
    if (grid) tester.classList.add('is-grid');
    function note() { foot.textContent = parseInt(out.style.fontSize, 10) + ' px' + (grid ? ' · ' + parseInt(out.style.fontSize, 10) / 8 + ' px cells' : '') + ' · click the text to edit it'; }
    tester.querySelectorAll('[data-size]').forEach(function (b) { b.addEventListener('click', function () { var s = +b.dataset.size; out.style.fontSize = s + 'px'; out.style.lineHeight = (grid ? s : Math.round(s * 1.12 / 4) * 4) + 'px'; press(b.parentNode, b); note(); }); });
    tester.querySelectorAll('[data-style]').forEach(function (b) { b.addEventListener('click', function () { out.style.fontWeight = b.dataset.style; press(b.parentNode, b); }); });
    tester.querySelectorAll('[data-ground]').forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.ground === 'dark') out.setAttribute('data-theme', 'dark'); else out.removeAttribute('data-theme'); press(b.parentNode, b); }); });
    var big = document.getElementById('cbig'), info = document.getElementById('cinfo');
    document.querySelectorAll('.cell').forEach(function (c) { c.addEventListener('click', function () {
      document.querySelectorAll('.cell[aria-pressed]').forEach(function (x) { x.removeAttribute('aria-pressed'); });
      c.setAttribute('aria-pressed', 'true'); big.textContent = c.textContent; info.textContent = 'U+' + c.dataset.cp; }); });
  }
})();
