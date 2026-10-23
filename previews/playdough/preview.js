// playdough preview: a scripted replay of six chat sessions (prompt → agent steps → render).
// Nothing here is live input; numbers come from the scene files.
const V = [
  // slug, chat title, prompt, tiles, props, seed
  ['a-frog-pond', 'frog pond', 'a frog hops across lily pads and a frozen pond to catch flies', '8 × 6', 9, 7],
  ['b-lighthouse', 'lighthouse', 'a lighthouse keeper rows between islands to relight the lanterns', '9 × 7', 9, 11],
  ['c-hedge-tank', 'hedge tank', 'a tiny tank must escape a hedge maze before the timer runs out', '8 × 8', 5, 3],
  ['d-sheepdog', 'sheepdog', 'a sheepdog herds the flock into the pen before sundown', '8 × 6', 12, 21],
  ['e-sled-mail', 'sled mail', 'a postie crosses a snowy valley, delivering one letter to every chimney', '8 × 7', 12, 5],
  ['f-oasis-race', 'oasis race', 'race a camel caravan across the dunes to the oasis before the water runs dry', '8 × 6', 12, 13],
];
const steps = v => [`read the prompt`, `lay out ${v[3]} tiles`, `place ${v[4]} props`, `seed ${v[5]}`, `render the diorama`];
const HOLD = 4200; // time to look at a finished session before the next one opens
const CSS = `
.pv-playdough{--pd-side:168px;color:var(--ink);border:1px solid var(--ink);background:var(--paper);display:grid;grid-template-columns:var(--pd-side) minmax(240px,300px) minmax(0,1fr);position:relative}
.pv-playdough.hero{--pd-side:200px;grid-template-columns:var(--pd-side) minmax(260px,340px) minmax(0,1fr)}
.pv-playdough *{box-sizing:border-box}
.pv-playdough .pd-side{border-right:1px solid var(--rule);display:flex;flex-direction:column;min-width:0;background:var(--sheet)}
.pv-playdough .pd-brand{display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid var(--rule);font:400 16px/16px var(--font-pixel);text-transform:lowercase}
.pv-playdough .pd-brand svg{width:16px;height:16px;fill:var(--ink);flex:none}
.pv-playdough .pd-new{margin:12px 12px 8px;padding:7px 8px;border:1px solid var(--rule);font:400 13px/16px var(--font-mono);color:var(--ink-muted);transition:background .12s,color .12s}
.pv-playdough .pd-new.press{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.pv-playdough .pd-list{list-style:none;margin:0;padding:0 0 12px;display:flex;flex-direction:column}
.pv-playdough .pd-list button{all:unset;box-sizing:border-box;width:100%;display:block;padding:7px 12px;font:400 13px/16px var(--font-mono);color:var(--ink-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:default;position:relative}
.pv-playdough.free .pd-list button{cursor:pointer}
.pv-playdough.free .pd-list button:hover{color:var(--ink)}
.pv-playdough .pd-list button[aria-current=true]{color:var(--ink);background:var(--paper)}
.pv-playdough .pd-list button[aria-current=true]::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--pd)}
.pv-playdough .pd-list button:focus-visible{outline:2px solid var(--pd);outline-offset:-2px}
.pv-playdough .pd-list li{animation:pdin .18s steps(3)}
@keyframes pdin{from{opacity:0}}
.pv-playdough .pd-chat{display:flex;flex-direction:column;min-width:0;border-right:1px solid var(--rule)}
.pv-playdough .pd-thread{flex:1;padding:16px;display:flex;flex-direction:column;gap:16px;min-height:0;overflow:hidden}
.pv-playdough .pd-empty{margin:auto 0;font:400 16px/24px var(--font-sans);color:var(--ink-muted);text-align:center}
.pv-playdough .pd-user{align-self:flex-end;max-width:92%;background:var(--sheet);border:1px solid var(--rule);padding:8px 12px;font:400 16px/24px var(--font-sans)}
.pv-playdough .pd-agent{display:flex;flex-direction:column;gap:6px}
.pv-playdough .pd-who{font:400 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.pv-playdough .pd-step{display:flex;align-items:center;gap:8px;font:400 13px/16px var(--font-mono);color:var(--ink-muted)}
.pv-playdough .pd-step i{width:8px;height:8px;border:1px solid currentColor;flex:none}
.pv-playdough .pd-step.on{color:var(--ink)}
.pv-playdough .pd-step.ok{color:var(--ink)}
.pv-playdough .pd-step.ok i{background:var(--pd);border-color:var(--pd)}
.pv-playdough .pd-done{font:400 16px/24px var(--font-sans);margin:4px 0 0}
.pv-playdough .pd-comp{margin:0 16px 16px;border:1px solid var(--ink);display:flex;align-items:flex-end;gap:8px;padding:8px 8px 8px 12px;min-height:56px;background:var(--sheet)}
.pv-playdough .pd-in{flex:1;font:400 16px/24px var(--font-sans);min-height:24px}
.pv-playdough .pd-in:empty::before{content:'Describe a game…';color:var(--ink-muted)}
.pv-playdough .pd-in.typing::after{content:'';display:inline-block;width:2px;height:18px;background:var(--pd);vertical-align:-3px;margin-left:1px}
.pv-playdough .pd-send{width:32px;height:32px;flex:none;display:grid;place-items:center;border:1px solid var(--rule);color:var(--ink-muted);font:400 16px/16px var(--font-mono);transition:background .12s}
.pv-playdough .pd-send.on{background:var(--pd);border-color:var(--pd);color:var(--pd-on)}
.pv-playdough .pd-out{display:flex;flex-direction:column;min-width:0}
.pv-playdough .pd-bar{display:flex;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid var(--rule);font:400 13px/16px var(--font-mono);color:var(--ink-muted);white-space:nowrap;overflow:hidden}
.pv-playdough .pd-bar b{font-weight:400;color:var(--ink)}
.pv-playdough .pd-stage{position:relative;aspect-ratio:1/1;background:var(--sheet)}
.pv-playdough .pd-stage img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:pixelated;opacity:0;transition:opacity .3s steps(3)}
.pv-playdough .pd-stage img.on{opacity:1}
.pv-playdough .pd-ph{position:absolute;inset:0;display:grid;place-items:center;font:400 13px/16px var(--font-mono);color:var(--ink-muted)}
.pv-playdough .pd-prog{position:absolute;left:0;right:0;bottom:-1px;height:2px;pointer-events:none}
.pv-playdough .pd-prog i{display:block;height:100%;width:100%;background:var(--pd);transform:scaleX(0);transform-origin:left}
.pv-playdough .pd-prog i.run{animation:pdprog var(--hold) linear forwards}
.pv-playdough.paused .pd-prog i{animation-play-state:paused}
@keyframes pdprog{to{transform:scaleX(1)}}
@media(max-width:720px){
 .pv-playdough,.pv-playdough.hero{grid-template-columns:1fr}
 .pv-playdough .pd-side{border-right:0;border-bottom:1px solid var(--rule);flex-direction:row;align-items:center;overflow-x:auto}
 .pv-playdough .pd-brand{border:0;padding:12px}
 .pv-playdough .pd-new{margin:8px;white-space:nowrap}
 .pv-playdough .pd-list{flex-direction:row;padding:0}
 .pv-playdough .pd-list button{width:auto}
 .pv-playdough .pd-list button[aria-current=true]::before{top:auto;right:0;width:auto;height:3px}
 .pv-playdough .pd-chat{border-right:0;border-bottom:1px solid var(--rule)}
 .pv-playdough .pd-thread{min-height:200px}
 .pv-playdough .pd-spec{display:none}
}
`;
const GL = ['.XXX.', 'XXXXX', 'X.X.X', 'XXXXX', 'X...X'].map((r, y) => [...r].map((c, x) => c === 'X' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : '').join('')).join('');
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default function mount(root, { mode, base }) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const dark = document.documentElement.dataset.theme === 'dark' || (document.documentElement.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const w = document.createElement('div');
  w.className = 'pv-playdough' + (mode === 'hero' ? ' hero' : '');
  w.style.setProperty('--pd', dark ? '#f2c81b' : '#836800');
  w.style.setProperty('--pd-on', dark ? '#16181d' : '#f9f9f5');
  w.style.setProperty('--hold', HOLD + 'ms');
  w.setAttribute('aria-label', 'Scripted replay of six playdough sessions');
  w.innerHTML = `<aside class="pd-side"><div class="pd-brand"><svg viewBox="0 0 5 5" shape-rendering="crispEdges" aria-hidden="true">${GL}</svg>playdough</div>
    <div class="pd-new" aria-hidden="true">+ New chat</div><ul class="pd-list"></ul></aside>
  <section class="pd-chat"><div class="pd-thread"></div><div class="pd-comp" aria-hidden="true"><div class="pd-in"></div><div class="pd-send">↑</div></div></section>
  <section class="pd-out"><div class="pd-bar"><span class="pd-file">untitled</span><span class="pd-spec"></span></div>
    <div class="pd-stage"><div class="pd-ph">output appears here</div><img alt=""></div></section>
  <div class="pd-prog" aria-hidden="true"><i></i></div>`;
  root.appendChild(w);
  const $ = s => w.querySelector(s);
  const list = $('.pd-list'), nw = $('.pd-new'), thread = $('.pd-thread'), input = $('.pd-in'), send = $('.pd-send');
  const file = $('.pd-file'), spec = $('.pd-spec'), img = $('.pd-stage img'), ph = $('.pd-ph'), prog = $('.pd-prog i');
  const items = [];
  let alive = true, vis = true, timer = 0;

  // one pausable timer: steps wait while the preview is off screen
  const wait = ms => new Promise(res => {
    const go = () => { if (!alive) return; if (!vis) { timer = setTimeout(go, 300); return; } res(); };
    timer = setTimeout(go, ms);
  });

  function addChat(i) {
    const li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.textContent = 'New chat'; b.tabIndex = -1;
    b.onclick = () => { if (w.classList.contains('free')) show(i); };
    li.appendChild(b); list.prepend(li); items[i] = b; select(i);
  }
  function select(i) { items.forEach((b, j) => b && b.setAttribute('aria-current', j === i)); }
  function clearOut() {
    img.classList.remove('on'); ph.style.display = ''; ph.textContent = 'output appears here';
    file.textContent = 'untitled'; spec.textContent = '';
  }
  function renderOut(i) {
    const v = V[i];
    img.src = base + 'public/media/playdough/vig-' + v[0] + '.jpg';
    img.alt = 'Isometric render of the game: ' + v[2];
    ph.style.display = 'none'; img.classList.add('on');
    file.innerHTML = `<b>${v[1].replace(/ /g, '-')}</b>/scene.json`;
    spec.textContent = `${v[3]} · ${v[4]} props · seed ${v[5]}`;
  }
  const userMsg = s => `<div class="pd-user">${esc(s)}</div>`;
  const agentMsg = (i, n) => `<div class="pd-agent"><span class="pd-who">playdough</span>${steps(V[i]).map((s, k) =>
    `<div class="pd-step${k < n ? ' ok' : ''}"><i></i>${s}</div>`).join('')}${n >= 5 ? `<p class="pd-done">Scene ready: <b>${V[i][1]}</b>.</p>` : ''}</div>`;

  // a finished session, for the free-switching state at the end
  function show(i) {
    select(i); thread.innerHTML = userMsg(V[i][2]) + agentMsg(i, 5); renderOut(i);
  }

  async function play() {
    for (let i = 0; i < V.length && alive; i++) {
      const v = V[i];
      // fresh chat
      nw.classList.add('press'); await wait(140); nw.classList.remove('press');
      addChat(i); thread.innerHTML = '<p class="pd-empty">What should we build?</p>'; clearOut(); input.textContent = '';
      await wait(380);
      // type the prompt into the composer
      input.classList.add('typing'); send.classList.add('on');
      for (let n = 1; n <= v[2].length && alive; n += 2) { input.textContent = v[2].slice(0, n); await wait(16); }
      input.textContent = v[2]; await wait(220);
      // send: message moves into the thread, the chat gets its title
      input.classList.remove('typing'); input.textContent = ''; send.classList.remove('on');
      thread.innerHTML = userMsg(v[2]);
      retitle(items[i], v[1]);
      await wait(260);
      // agent works through its steps
      thread.insertAdjacentHTML('beforeend', agentMsg(i, 0));
      const rows = thread.querySelectorAll('.pd-step');
      ph.textContent = 'building…';
      for (let k = 0; k < rows.length && alive; k++) {
        rows[k].classList.add('on'); await wait(k === rows.length - 1 ? 380 : 230); rows[k].classList.replace('on', 'ok');
      }
      thread.querySelector('.pd-agent').insertAdjacentHTML('beforeend', `<p class="pd-done">Scene ready: <b>${v[1]}</b>.</p>`);
      renderOut(i);
      // hold so there's time to look, with a quiet progress line
      if (i < V.length - 1) {
        prog.classList.remove('run'); void prog.offsetWidth; prog.classList.add('run');
        await wait(HOLD);
        prog.classList.remove('run');
      }
    }
    finish();
  }
  function finish() {
    if (!alive) return;
    w.classList.add('free');
    items.forEach(b => { b.tabIndex = 0; });
  }
  // the sidebar title swaps from "New chat" one character at a time
  async function retitle(b, t) {
    const from = b.textContent;
    for (let n = 0; n <= Math.max(from.length, t.length) && alive; n++) {
      b.textContent = t.slice(0, n) + from.slice(n);
      await new Promise(r => setTimeout(r, 22));
    }
    b.textContent = t;
  }

  const io = new IntersectionObserver(e => { vis = e[0].isIntersecting; w.classList.toggle('paused', !vis); });
  io.observe(w);
  if (reduce) { V.forEach((_, i) => addChat(i)); items.forEach((b, i) => { b.textContent = V[i][1]; }); finish(); show(V.length - 1); }
  else play();
  return () => { alive = false; clearTimeout(timer); io.disconnect(); w.remove(); st.remove(); };
}
