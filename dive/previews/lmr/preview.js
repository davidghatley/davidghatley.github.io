// Live packing visual. Rows are the real example from the UI screenshot (docs/img/ui.png):
// BM25 ranks 7, 18, 9, 12, 62 were packed (259+281+246+154+37 = 977 of 1,000 tokens).
// Grey rows are other BM25 hits, drawn at the manual's average paragraph size (about 280 tokens).
const Q = 'Why is the apple associated with the Garden of Eden?';
// bm: BM25 order, rr: reranked order, tok: tokens
const ITEMS = [
  { id: 'a', bm: 0, rr: 0, rank: 7, t: 'Apple · Christian art', tok: 259, c: 0 },
  { id: 'h1', bm: 1, rr: 5, rank: 8, t: 'other hit', tok: 280, c: -1 },
  { id: 'p', bm: 2, rr: 2, rank: 9, t: 'Apple Inc. · Products', tok: 246, c: 2 },
  { id: 'k', bm: 3, rr: 3, rank: 12, t: 'Apple Inc. · Criticism', tok: 154, c: 3 },
  { id: 'g', bm: 4, rr: 1, rank: 18, t: 'Apple · Greek mythology', tok: 281, c: 1 },
  { id: 'h2', bm: 5, rr: 6, rank: 42, t: 'other hit', tok: 280, c: -1 },
  { id: 'h3', bm: 6, rr: 7, rank: 50, t: 'other hit', tok: 280, c: -1 },
  { id: 'e', bm: 7, rr: 4, rank: 62, t: 'Ebola · Diagnosis', tok: 37, c: 4 },
];
const STEPS = [
  ['1', 'Question', 'The question goes to a keyword index over 297 articles.'],
  ['2', 'BM25 hits', 'BM25 returns 500 candidates in 24 ms. Eight of them are drawn here, in BM25 order. It found 70 of the 73 paragraphs the dev questions needed.'],
  ['3', 'Reranker', 'A 17M reranker reorders the top 100 in 1.1 s. It adds nothing new. It only changes the order.'],
  ['4', 'Packing', 'Paragraphs are packed in reranked order into 1,000 tokens. The next one does not fit, so it is dropped.'],
];
const CSS = `
.pv-lmr{--a:var(--acc-l,#2c4a86);display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:24px;align-items:start;color:var(--ink);font:400 13px/18px var(--font-sans)}
html[data-theme=dark] .pv-lmr,.pv-lmr.dk{--a:#8fa9e0}
@media (prefers-color-scheme:dark){html:not([data-theme=light]) .pv-lmr{--a:#8fa9e0}}
.pv-lmr *{box-sizing:border-box}
.pv-lmr.is-narrow{grid-template-columns:1fr}
.pv-lmr .k{font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.pv-lmr .q{font:italic 400 17px/24px var(--font-serif);margin:6px 0 10px;min-height:24px;border-left:3px solid var(--a);padding-left:10px}
.pv-lmr .steps{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}
.pv-lmr button{font:500 11px/16px var(--font-mono);letter-spacing:.06em;color:var(--ink);background:transparent;border:1px solid var(--ink);padding:5px 9px;cursor:pointer;border-radius:0}
.pv-lmr button[aria-pressed=true]{background:var(--a);border-color:var(--a);color:var(--paper,#f9f9f5)}
.pv-lmr button:focus-visible{outline:2px solid var(--a);outline-offset:2px}
.pv-lmr .list{position:relative;height:calc(8 * 30px);border-top:1px solid var(--ink)}
.pv-lmr .it{position:absolute;left:0;right:0;height:28px;display:grid;grid-template-columns:44px minmax(0,1fr) 54px;gap:8px;align-items:center;border-bottom:1px solid var(--rule);transition:transform .7s cubic-bezier(.3,.7,.2,1),opacity .4s;opacity:1}
.pv-lmr .it .rk{font:500 11px/14px var(--font-mono);color:var(--ink-muted)}
.pv-lmr .it .nm{font:500 13px/16px var(--font-sans);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pv-lmr .it.o .nm{color:var(--ink-muted);font-weight:400}
.pv-lmr .it .tk{font:400 11px/14px var(--font-mono);color:var(--ink-muted);text-align:right}
.pv-lmr .it .sw{display:inline-block;width:10px;height:10px;margin-right:6px;background:var(--cc,var(--ink-muted))}
.pv-lmr .it.o .sw{background:var(--rule)}
.pv-lmr .it.gone{opacity:.28}
.pv-lmr .bar{position:relative;height:30px;margin-top:42px;border:1px solid var(--ink);background:var(--sheet)}
.pv-lmr .seg{position:absolute;top:0;bottom:0;background:var(--cc);border-right:2px solid var(--sheet);width:0;transition:width .6s ease-out;overflow:hidden;white-space:nowrap;font:400 16px/28px var(--font-pixel);color:#fff;padding-left:4px}
.pv-lmr .nofit{position:absolute;top:-30px;height:24px;right:0;width:48%;white-space:nowrap;border:2px dashed var(--vermilion);color:var(--vermilion-text,var(--vermilion));font:500 10px/14px var(--font-mono);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .4s;background:var(--paper)}
.pv-lmr .bl{display:flex;justify-content:space-between;font:500 11px/16px var(--font-mono);color:var(--ink-muted);margin-top:4px}
.pv-lmr .stats{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px}
.pv-lmr .stats div{border-top:1px solid var(--ink);padding-top:6px;opacity:.25;transition:opacity .4s}
.pv-lmr .stats div.on{opacity:1}
.pv-lmr .stats b{display:block;font:400 32px/36px var(--font-pixel)}
.pv-lmr .stats span{font:500 11px/15px var(--font-mono);color:var(--ink-muted)}
.pv-lmr .say{font:400 13px/19px var(--font-sans);margin:10px 0 0;min-height:56px;max-width:60ch}
.pv-lmr .shot{margin:0}
.pv-lmr .shot img{display:block;width:100%;height:auto;border:1px solid var(--ink)}
.pv-lmr .shot figcaption{font:italic 400 12px/17px var(--font-serif);color:var(--ink-muted);margin-top:6px}
@media (prefers-reduced-motion:reduce){.pv-lmr .it,.pv-lmr .seg,.pv-lmr .nofit,.pv-lmr .stats div{transition:none}}
`;
export default function mount(root, { mode, base }) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const el = document.createElement('div'); el.className = 'pv-lmr'; root.appendChild(el);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COL = ['#4c6fc4', '#7f96d9', '#c46a14', '#e0883a', '#1fa88f'];
  el.innerHTML = `<div class="pipe"><div class="k">One real question, four stages</div>
    <p class="q"></p><div class="steps"></div>
    <div class="list"></div>
    <div class="bar" aria-hidden="true"></div><div class="bl"><span>0</span><span class="free"></span><span>1,000 tokens</span></div>
    <div class="stats"><div class="s1"><b>70 / 73</b><span>needed paragraphs BM25 found</span></div><div class="s2"><b>54 / 73</b><span>reach the model (dev, BM25 order)</span></div></div>
    <p class="say" aria-live="polite"></p></div>
    <figure class="shot"><img src="${base}public/media/lmr/ui.png" alt="The lmr web UI: an answer, rank movement from BM25 to the reranker, and the token budget"><figcaption>The real UI, same question: the reranker lifts five paragraphs into view; they fill 977 of 1,000 tokens.</figcaption></figure>`;
  const $ = s => el.querySelector(s);
  const list = $('.list'), bar = $('.bar'), steps = $('.steps');
  const fit = () => el.classList.toggle('is-narrow', el.getBoundingClientRect().width < 640);
  const ro = new ResizeObserver(fit); ro.observe(el); fit();
  const rows = ITEMS.map(it => {
    const d = document.createElement('div'); d.className = 'it' + (it.c < 0 ? ' o' : '');
    if (it.c >= 0) d.style.setProperty('--cc', COL[it.c]);
    d.innerHTML = `<span class="rk">#${it.rank}</span><span class="nm"><i class="sw"></i>${it.t}</span><span class="tk">${it.c < 0 ? '~' : ''}${it.tok} tok</span>`;
    list.appendChild(d); return d;
  });
  const segs = ITEMS.filter(i => i.c >= 0).sort((a, b) => a.rr - b.rr).map(it => {
    const s = document.createElement('div'); s.className = 'seg'; s.style.setProperty('--cc', COL[it.c]);
    bar.appendChild(s); return [it, s];
  });
  const nf = document.createElement('div'); nf.className = 'nofit'; nf.textContent = 'next ~280 tok: no fit'; bar.appendChild(nf);
  let step = 0, timer = 0, playing = !reduce, auto = playing;
  STEPS.forEach(([n, l], i) => { const b = document.createElement('button'); b.textContent = n + ' ' + l; b.onclick = () => { auto = false; go(i); }; steps.appendChild(b); });
  function go(i) {
    step = i;
    [...steps.children].forEach((b, j) => b.setAttribute('aria-pressed', j === i));
    $('.q').textContent = i === 0 ? '“' + Q + '”' : '“' + Q + '”';
    $('.say').textContent = STEPS[i][2];
    const sorted = ITEMS.slice().sort((a, b) => a.rr - b.rr);
    rows.forEach((r, k) => {
      const it = ITEMS[k], pos = i >= 2 ? it.rr : it.bm;
      r.style.transform = `translateY(${pos * 30}px)`;
      r.style.opacity = i === 0 ? .15 : '';
      r.classList.toggle('gone', i === 3 && it.c < 0);
    });
    // packing: first five (reranked order), the sixth does not fit
    let used = 0;
    segs.forEach(([it, s]) => { const w = it.tok / 1000 * 100; s.style.left = used / 10 + '%'; s.style.width = i === 3 ? w + '%' : '0'; s.textContent = i === 3 && it.tok > 150 ? it.tok : ''; used += it.tok; });
    $('.free').textContent = i === 3 ? '977 used, 23 left' : '';
    nf.style.opacity = i === 3 ? 1 : 0;
    nf.title = 'The next paragraph (about 280 tokens) does not fit in the 23 tokens left';
    $('.s1').classList.toggle('on', i >= 1); $('.s2').classList.toggle('on', i === 3);
    clearTimeout(timer);
    if (auto && i < 3) timer = setTimeout(() => go(i + 1), 2600);
    else if (auto) timer = setTimeout(() => go(0), 4200);
  }
  go(reduce ? 3 : 0);
  return () => { clearTimeout(timer); ro.disconnect(); el.remove(); st.remove(); };
}
