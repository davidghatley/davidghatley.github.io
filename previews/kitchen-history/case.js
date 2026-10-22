const CSS = `
.cs-kitchen-history{max-width:1100px;margin:0 auto;padding:24px 16px 56px;color:var(--ink);font:400 16px/26px var(--font-serif)}
.cs-kitchen-history .top{border-top:3px double var(--ink);border-bottom:1px solid var(--ink);padding:16px 0}
.cs-kitchen-history .kick{font:500 11px/16px var(--font-mono);letter-spacing:.18em;text-transform:uppercase;color:var(--ink-muted)}
.cs-kitchen-history h1{margin:8px 0;font:400 48px/52px var(--font-pixel);display:flex;gap:20px;align-items:center}
.cs-kitchen-history h1 svg{width:48px;height:48px;color:var(--ink-muted);flex:none}
.cs-kitchen-history .lede{margin:0;font-style:italic;font-size:20px;line-height:30px;color:var(--ink-muted)}
.cs-kitchen-history h2{margin:40px 0 8px;font:500 11px/16px var(--font-mono);letter-spacing:.18em;text-transform:uppercase;color:var(--ink-muted);border-bottom:1px solid var(--rule);padding-bottom:6px}
.cs-kitchen-history .note{max-width:66ch}
.cs-kitchen-history .note p{margin:0 0 14px}
.cs-kitchen-history .ledger{width:100%;border-collapse:collapse}
.cs-kitchen-history .ledger th{font:500 10px/14px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted);text-align:left;padding:6px 10px 6px 0;border-bottom:2px solid var(--ink)}
.cs-kitchen-history .ledger td{padding:12px 12px 12px 0;vertical-align:top;border-bottom:1px solid var(--rule);font-size:15px;line-height:22px}
.cs-kitchen-history .ledger .nm{font:600 13px/20px var(--font-mono);color:var(--ink)}
.cs-kitchen-history .ledger .px{font:400 16px/20px var(--font-pixel);white-space:nowrap}
.cs-kitchen-history .ledger .ep{font-style:italic;color:var(--ink-muted)}
.cs-kitchen-history .ledger .lb{font:400 12px/18px var(--font-mono);color:var(--ink-muted);display:block;margin-top:4px}
.cs-kitchen-history .ledger tr:hover td{background:var(--sheet)}
.cs-kitchen-history .ledger tr:hover .nm{color:var(--vermilion-text)}
.cs-kitchen-history .plate{border:1px solid var(--ink);background:var(--sheet);padding:12px 16px 16px;margin-top:8px}
.cs-kitchen-history .plate .cap{font:400 16px/24px var(--font-pixel);margin-bottom:8px}
.cs-kitchen-history .plates{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;align-items:start}
.cs-kitchen-history figure{margin:0;border:1px solid var(--rule);background:var(--sheet);padding:12px}
.cs-kitchen-history figure img{display:block;max-width:100%;height:auto;margin:0 auto}
.cs-kitchen-history figcaption{font-style:italic;font-size:14px;line-height:21px;color:var(--ink-muted);margin-top:8px}
.cs-kitchen-history .tally{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
.cs-kitchen-history .tally div{border-top:1px solid var(--ink);padding-top:8px}
.cs-kitchen-history .tally .v{font:400 32px/36px var(--font-pixel)}
.cs-kitchen-history .tally .l{font:500 11px/16px var(--font-mono);color:var(--ink)}
.cs-kitchen-history .tally small{display:block;font:400 11px/16px var(--font-mono);color:var(--ink-muted)}
.cs-kitchen-history a{color:var(--ink);text-underline-offset:3px;text-decoration-color:var(--vermilion)}
.cs-kitchen-history .colo{margin-top:40px;border-top:1px solid var(--ink);padding-top:8px;font:400 12px/18px var(--font-mono);color:var(--ink-muted)}
@media(max-width:720px){.cs-kitchen-history h1{font-size:32px;line-height:36px}.cs-kitchen-history .ledger thead{display:none}.cs-kitchen-history .ledger,.cs-kitchen-history .ledger tbody,.cs-kitchen-history .ledger tr,.cs-kitchen-history .ledger td{display:block}.cs-kitchen-history .ledger td{border:0;padding:2px 0}.cs-kitchen-history .ledger tr{border-bottom:1px solid var(--rule);padding:12px 0}}
`;
const ROWS = [
  ['gauntlet', '8850356', 'Standalone Python harness: propose, evaluate, criticize, verify, select over git worktrees, with resume. 67 tests pass.', 'To bonfire: loop phases, the Finding schema and verify rules, durable store and resume, the scripted-adapter test idea, the report template.', 'Left behind: the code, wholesale.', 'A loop worth keeping, never measured.'],
  ['system-a', 'b4407e5', 'Laya (ModernBERT) fine-tuned to predict a coding agent\'s next tool category. 458 files, 47 MB.', 'To nibble: the model-card evidence table and the positive-control-first rule. To bonfire: one line on durable retries.', 'Left behind: all code and data.', 'Meant to pick primitives; it cloned habits.'],
  ['system-one-mini', '4e08635', 'DistilBERT plus five fixed heads over synthetic diagnosis states. 4.95 ms p50; 44.5% on unseen wording at 97% confidence.', 'To nibble: the retrospective excerpt. To bonfire: one lesson on worktree noise.', 'Left behind: the 5-head code.', 'Fast, and wrong off the script.'],
  ['precision-canvas', '1ac4ce3', 'A conformance harness: 620 KB frozen spec, 473 capabilities, 14 invariants. No editor.', 'To napkin: INV-01/03/04/06/08, the AGT and COD checklists, a condensed transaction model, four test ideas.', 'Left behind: the spec and the governance.', 'A spec programme with no pixels.'],
  ['local-mobile-research', '29b6284', 'Offline Wikipedia QA retrieval tournament under a 1k-token budget. 518 + 94 tests.', 'To mise_en_place: the packing finding, the survival metric, real-token budgets. To nibble: a minimum-meaningful-difference rule. To playdough: lessons only.', 'Left behind: the app and the freeze process.', 'Packing, not search, lost the evidence.'],
];
const NS = 'http://www.w3.org/2000/svg';
function glyph(rows) { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 5 5'); s.setAttribute('shape-rendering', 'crispEdges'); s.setAttribute('fill', 'currentColor'); s.setAttribute('aria-hidden', 'true'); rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'X') { const e = document.createElementNS(NS, 'rect'); e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('width', 1); e.setAttribute('height', 1); s.appendChild(e); } })); return s; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default async function renderCase(root, { project: p, base }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('div'); el.className = 'cs-kitchen-history'; root.appendChild(el);
  el.innerHTML = `<div class="top"><div class="kick">Archive ledger / audit 2026-10-17 / ${esc(p.status)}</div>
    <h1><span class="gl"></span><span>${esc(p.title)}</span></h1><p class="lede">${esc(p.oneliner)}</p></div>
    <h2>Curator's note</h2><div class="note">${p.body.map(t => `<p>${esc(t)}</p>`).join('')}</div>
    <h2>The ledger</h2>
    <table class="ledger"><thead><tr><th>repo @ commit</th><th>what it was</th><th>what was carried</th><th>epitaph</th></tr></thead><tbody>
    ${ROWS.map(r => `<tr><td><span class="nm">${r[0]}</span><br><span class="px">@${r[1]}</span></td><td>${esc(r[2])}</td><td>${esc(r[3])}<span class="lb">${esc(r[4])}</span></td><td class="ep">${esc(r[5])}</td></tr>`).join('')}</tbody></table>
    <h2>Fold-out plate</h2><div class="plate"><div class="cap">SALVAGE MAP</div><div class="hero"></div></div>
    <h2>Plates</h2><div class="plates">${p.media.map((m, i) => `<figure><img src="${base + m.src}" alt="${esc(m.alt)}"><figcaption>Plate ${i + 1}. ${esc(m.caption)}</figcaption></figure>`).join('')}</div>
    <h2>Tallies</h2><div class="tally">${p.spec.map(s => `<div><div class="v">${esc(s.value)}</div><div class="l">${esc(s.label)}</div><small>${esc(s.source)}</small></div>`).join('')}</div>
    ${p.links.length ? `<h2>See also</h2><ul>${p.links.map(l => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('')}</ul>` : ''}
    <div class="colo">${esc(p.role)} ${esc(p.status_note)} ${esc(p.when)}</div>`;
  const g = glyph(p.glyph); g.style.viewTransitionName = 'glyph-' + p.slug; el.querySelector('.gl').appendChild(g);
  const hero = el.querySelector('.hero'); hero.style.viewTransitionName = 'hero-' + p.slug;
  let un = () => {};
  try { const m = await import('./preview.js'); un = m.default(hero, { mode: 'hero', base }) || un; } catch (e) { console.warn(e); }
  return () => { un(); el.remove(); style.remove(); };
}
