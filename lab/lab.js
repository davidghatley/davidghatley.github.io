/* lab board: each glyph builds cell by cell as its card scrolls in, and on hover or focus the title steps into the
   project's own face one --dur-cell at a time (the index row's swap, site.js swapTitle), and back on leave. */
(function () {
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cards = [].slice.call(document.querySelectorAll('.lc'));
  function cell() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-cell')) || 70; }
  function replay(g) {
    g.classList.add('is-armed'); void g.getBoundingClientRect(); g.classList.remove('is-armed');
    g.querySelectorAll('rect').forEach(function (r) { r.style.animation = 'none'; void r.getBoundingClientRect(); r.style.animation = ''; });
  }
  function swap(card, on) {
    var cs = [].slice.call(card.querySelectorAll('.lc__t .ch'));
    if (!on) cs.reverse();
    clearInterval(card._swap);
    var todo = cs.filter(function (c) { return c.classList.contains('ch--on') !== on; });
    if (REDUCED || !todo.length) { todo.forEach(function (c) { c.classList.toggle('ch--on', on); }); return; }
    var i = 0;
    card._swap = setInterval(function () { var c = todo[i++]; if (c) c.classList.toggle('ch--on', on); if (i >= todo.length) clearInterval(card._swap); }, cell());
  }
  cards.forEach(function (c) {
    var g = c.querySelector('.glyph');
    if (g && !REDUCED) g.classList.add('is-armed');
    c.addEventListener('mouseenter', function () { swap(c, true); if (g && !REDUCED) replay(g); });
    c.addEventListener('mouseleave', function () { swap(c, false); });
    c.addEventListener('focusin', function () { swap(c, true); });
    c.addEventListener('focusout', function () { swap(c, false); });
  });
  // the step lists: always open from 640 up (the summary is hidden there), folded on phones
  var wide = window.matchMedia('(min-width: 640px)');
  function fold() { document.querySelectorAll('.lc__more').forEach(function (d) { d.open = wide.matches; }); }
  fold(); if (wide.addEventListener) wide.addEventListener('change', fold);
  if (REDUCED) return;
  if (!('IntersectionObserver' in window)) { cards.forEach(function (c) { var g = c.querySelector('.glyph'); if (g) g.classList.remove('is-armed'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting) return; var g = e.target.querySelector('.glyph'); if (g) g.classList.remove('is-armed'); io.unobserve(e.target); });
  }, { rootMargin: '0px 0px -10% 0px' });
  cards.forEach(function (c) { io.observe(c); });
})();
