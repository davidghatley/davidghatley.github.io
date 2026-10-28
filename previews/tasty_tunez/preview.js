// tasty_tunez preview: the cover plate, playable. Pick a song and press play; the plate draws itself as the song runs,
// one column per slice of the song, with the live loudness in the bar row and the one vermilion cell arriving at the peak.
// Click any column to jump there. At rest the plate is complete (a still frame reads complete).
const CSS = `
.pv-tasty_tunez{display:grid;grid-template-columns:minmax(0,auto) minmax(0,1fr);gap:32px;align-items:start;color:var(--ink)}
.pv-tasty_tunez *{box-sizing:border-box}
.pv-tasty_tunez canvas{display:block;max-width:100%;height:auto;background:var(--sheet);border:1px solid var(--rule);cursor:pointer;touch-action:manipulation}
.pv-tasty_tunez .tt-side{display:grid;gap:16px;align-content:start;min-width:0}
.pv-tasty_tunez .tt-k{font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.pv-tasty_tunez .tt-songs{display:grid;gap:0;border-top:1px solid var(--rule)}
.pv-tasty_tunez .tt-song{display:grid;grid-template-columns:16px minmax(0,1fr);gap:12px;align-items:start;text-align:left;padding:12px 0;border:0;border-bottom:1px solid var(--rule);background:none;color:var(--ink);font:inherit;cursor:pointer}
.pv-tasty_tunez .tt-song i{width:12px;height:12px;margin-top:6px;border:2px solid var(--ink-muted)}
.pv-tasty_tunez .tt-song[aria-pressed=true] i{background:var(--cobalt);border-color:var(--cobalt)}
.pv-tasty_tunez .tt-song b{display:block;color:var(--ink);font-family:var(--font-pixel);font-weight:400;font-size:32px;line-height:32px;font-synthesis:none;-webkit-font-smoothing:none}
.pv-tasty_tunez .tt-song span{display:block;font:400 13px/20px var(--font-mono);color:var(--ink-muted);margin-top:4px}
.pv-tasty_tunez .tt-song:focus-visible,.pv-tasty_tunez .tt-play:focus-visible,.pv-tasty_tunez canvas:focus-visible{outline:2px solid var(--cobalt);outline-offset:2px}
.pv-tasty_tunez .tt-row{display:flex;flex-wrap:wrap;align-items:center;gap:16px}
.pv-tasty_tunez .tt-play{height:40px;padding:0 16px;border:1px solid var(--ink);background:var(--ink);color:var(--paper);font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;cursor:pointer}
.pv-tasty_tunez .tt-time{font-family:var(--font-pixel);font-size:32px;line-height:32px;font-variant-numeric:tabular-nums;font-synthesis:none;-webkit-font-smoothing:none}
.pv-tasty_tunez .tt-cap{margin:0;font:italic 400 16px/24px var(--font-serif);color:var(--ink-muted);max-width:28rem}
.pv-tasty_tunez .tt-promo{margin:0;display:grid;gap:8px}
.pv-tasty_tunez .tt-promo video{display:block;width:100%;height:auto;aspect-ratio:16/9;background:var(--sheet);border:1px solid var(--rule)}
@media(max-width:719px){.pv-tasty_tunez{grid-template-columns:minmax(0,1fr)}}
`;
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const COLS = 26;
const mmss = (v) => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`;
const digits = (s) => [...s].map((c) => (+c + 0.5) / 10);

function prep(s) {
  const raw = s.chroma.map(digits), en = digits(s.energy);
  const bin = (row) => Array.from({ length: COLS }, (_, i) => {
    const a = Math.floor((i * row.length) / COLS), b = Math.max(a + 1, Math.floor(((i + 1) * row.length) / COLS));
    let m = 0; for (let j = a; j < b; j++) m = Math.max(m, row[j]); return m;
  });
  const chroma = raw.map(bin), energy = bin(en), peakE = Math.max(...energy);
  const top = energy.map((_, c) => chroma.map((r, p) => [r[c], p]).sort((x, y) => y[0] - x[0]).slice(0, 3).map((x) => x[1]));
  let peak = { v: -1, p: 0, c: 0 };
  top.forEach((ps, c) => { if (energy[c] / peakE <= 0.15) return; ps.forEach((p) => { const v = chroma[p][c] * energy[c] / peakE; if (v > peak.v) peak = { v, p, c }; }); });
  return { ...s, chroma, energy, peakE, top, peak, level: digits(s.level) };
}

export default function mount(root, { mode, base }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('div'); el.className = 'pv-tasty_tunez'; root.appendChild(el);
  const hero = mode === 'hero';
  const narrow = () => (root.clientWidth || innerWidth) < 720;
  const size = () => { const w = root.clientWidth || innerWidth; return Math.max(240, Math.min(hero ? 560 : 440, narrow() ? w : w * 0.55)); };
  el.innerHTML = `<canvas role="img" tabindex="0" aria-label="Cover plate for the selected song: pitch over time"></canvas>
    <div class="tt-side"><span class="tt-k">Generated songs · cover drawn from each</span><div class="tt-songs" data-songs></div>
    <div class="tt-row"><button class="tt-play" type="button" data-play disabled>Loading</button><span class="tt-time" data-time>0:00</span><span class="tt-k" data-hover></span></div>
    <p class="tt-cap">Press play and the plate draws itself from the song: a column per slice, its three strongest notes, the loudness underneath. Click the grid to jump.</p>
    <figure class="tt-promo"><video muted loop playsinline preload="metadata" controls aria-label="A 37-second silent walkthrough of the app: a written brief, the live app and a cover plate drawing itself from the song"></video><figcaption class="tt-cap">The app in 37 seconds.</figcaption></figure></div>`;
  const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
  const songsEl = el.querySelector('[data-songs]'), playB = el.querySelector('[data-play]'), timeEl = el.querySelector('[data-time]'), hoverEl = el.querySelector('[data-hover]');
  const vid = el.querySelector('video'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  vid.poster = base + 'public/media/tasty_tunez/promo.jpg'; vid.muted = true; vid.src = base + 'public/media/tasty_tunez/promo.mp4';
  // autoplay only with motion allowed, and only while the video is on screen
  const io = new IntersectionObserver(([e]) => { if (still) return; if (e.isIntersecting) vid.play().catch(() => {}); else vid.pause(); });
  io.observe(vid);
  const audio = new Audio(); audio.preload = 'none';
  let songs = [], cur = null, raf = 0, alive = true, geo = null, hoverCol = -1, lastFrame = -1;

  const tok = () => { const cs = getComputedStyle(root); const g = (n, d) => cs.getPropertyValue(n).trim() || d;
    return { sheet: g('--sheet', '#f9f9f5'), ink: g('--ink', '#16181d'), muted: g('--ink-muted', '#555a61'), rule: g('--rule', '#c9c9c0'), faint: g('--rule-faint', '#e0e0d8'), cobalt: g('--cobalt', '#2236b0'), verm: g('--vermilion', '#ee5228'), onV: '#16181d' }; };

  function layout() {
    const S = Math.round(size()), dpr = Math.min(2, devicePixelRatio || 1);
    const pad = Math.round(S * 0.06), lab = Math.round(S * 0.07);
    const cell = Math.floor((S - pad * 2 - lab) / COLS), step = Math.max(3, Math.round(cell * 0.5)), gy = pad + 48;
    const H = gy + 12 * cell + 12 + 6 * step + 16 + 56 + pad; // drawing height: grid, loudness, title, spec
    cv.width = S * dpr; cv.height = H * dpr; cv.style.width = S + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    geo = { S, H, pad, lab, cell, gx: pad + lab, gy, dot: Math.max(2, cell - Math.max(2, Math.round(cell / 5))) };
  }

  // t: seconds played, or null for the complete plate
  function draw(t) {
    if (!cur || !geo) return;
    const C = tok(), { S, pad, cell, gx, gy, dot } = geo, live = t != null;
    const tcol = live ? Math.min(COLS, Math.floor((t / cur.duration) * COLS)) : COLS;
    ctx.clearRect(0, 0, S, geo.H); ctx.fillStyle = C.sheet; ctx.fillRect(0, 0, S, geo.H);
    ctx.font = '500 11px "IBM Plex Mono", monospace'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.muted;
    ctx.fillText(`PLATE · ${cur.title.toUpperCase()} · ${Math.round(cur.bpm)} BPM`, pad, pad + 8);
    ctx.fillStyle = C.rule; ctx.fillRect(pad, pad + 20, S - pad * 2, 1);
    for (let j = 0; j < 12; j++) {
      const p = 11 - j, y = gy + j * cell;
      if (cell >= 12) { ctx.fillStyle = C.muted; ctx.fillText(NOTES[p], pad, y + dot / 2 + 4); }
      for (let c = 0; c < COLS; c++) {
        const x = gx + c * cell, on = cur.top[c].includes(p) && cur.energy[c] / cur.peakE > 0.15;
        if (on && c <= tcol) { ctx.fillStyle = cur.peak.c === c && cur.peak.p === p ? C.verm : C.cobalt; ctx.fillRect(x, y, dot, dot); }
        else { ctx.fillStyle = C.faint; ctx.fillRect(x + dot / 2 - 1, y + dot / 2 - 1, 2, 2); }
      }
    }
    if (live && tcol < COLS) { ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(gx + tcol * cell - 2.5, gy - 2.5, cell, 12 * cell); }
    if (hoverCol >= 0) { ctx.strokeStyle = C.muted; ctx.setLineDash([2, 2]); ctx.strokeRect(gx + hoverCol * cell - 2.5, gy - 2.5, cell, 12 * cell); ctx.setLineDash([]); }
    // loudness row: six steps
    const ey = gy + 12 * cell + 12, step = Math.max(3, Math.round(cell * 0.5));
    for (let c = 0; c < COLS && c <= tcol; c++) {
      const lv = live && c === tcol ? cur.level[Math.min(cur.level.length - 1, Math.floor(t * cur.fps))] : cur.energy[c] / cur.peakE;
      const n = Math.max(1, Math.round(lv * 6));
      ctx.fillStyle = C.ink; for (let k = 0; k < n; k++) ctx.fillRect(gx + c * cell, ey + (5 - k) * step, dot, step - 2);
    }
    // peak callout, once reached
    if (cur.peak.c <= tcol) {
      const px = gx + cur.peak.c * cell + dot / 2, py = gy + (11 - cur.peak.p) * cell;
      ctx.fillStyle = C.verm; ctx.fillRect(px - 0.5, gy - 18, 1, py - gy + 18);
      ctx.beginPath(); ctx.arc(px, gy - 26, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.onV; ctx.textAlign = 'center'; ctx.fillText('1', px, gy - 22); ctx.textAlign = 'left';
      ctx.fillStyle = C.muted; const lbl = `PEAK ${NOTES[cur.peak.p]} · ${mmss(((cur.peak.c + 0.5) / COLS) * cur.duration)}`;
      const w = ctx.measureText(lbl).width; ctx.fillText(lbl, px + 16 + w > S - pad ? px - 16 - w : px + 16, gy - 22);
    }
    // title in Stem 7 on whole cells (32 px), spec line
    const ty = ey + 6 * step + 16;
    ctx.fillStyle = C.ink; ctx.font = '400 32px "Stem 7", monospace'; ctx.fillText(cur.title, pad, ty + 28);
    ctx.font = '500 11px "IBM Plex Mono", monospace'; ctx.fillStyle = C.muted;
    ctx.fillText(`${cur.key.toUpperCase()} · ${live ? mmss(t) : mmss(cur.duration)} · ${cur.model} · SEED ${(cur.seed & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`, pad, ty + 56);
  }

  function loop() {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    if (audio.paused) return;
    const f = Math.floor(audio.currentTime * 12); // step motion: 12 frames a second
    if (f === lastFrame) return; lastFrame = f;
    draw(audio.currentTime); timeEl.textContent = mmss(audio.currentTime);
  }

  function select(i, play) {
    cur = songs[i]; lastFrame = -1;
    songsEl.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    audio.pause(); audio.src = base + 'public/media/tasty_tunez/' + cur.file;
    timeEl.textContent = '0:00'; playB.textContent = 'Play';
    draw(null);
    if (play) start(0);
  }
  function start(at) {
    if (at != null) { try { audio.currentTime = at; } catch {} }
    audio.play().then(() => { playB.textContent = 'Pause'; }).catch(() => {});
  }
  playB.addEventListener('click', () => { if (audio.paused) start(); else { audio.pause(); playB.textContent = 'Play'; } });
  audio.addEventListener('ended', () => { playB.textContent = 'Play'; draw(null); timeEl.textContent = mmss(cur.duration); });

  const colAt = (e) => { const r = cv.getBoundingClientRect(), k = geo.S / r.width; const x = (e.clientX - r.left) * k - geo.gx; const c = Math.floor(x / geo.cell); return c >= 0 && c < COLS ? c : -1; };
  cv.addEventListener('click', (e) => { const c = colAt(e); if (c < 0 || !cur) return; lastFrame = -1; start(((c + 0.02) / COLS) * cur.duration); });
  cv.addEventListener('pointermove', (e) => {
    if (!cur) return; const c = colAt(e); if (c === hoverCol) return; hoverCol = c;
    hoverEl.textContent = c < 0 ? '' : `${cur.top[c].map((p) => NOTES[p]).join(' ')} · ${mmss(((c + 0.5) / COLS) * cur.duration)}`;
    lastFrame = -1; if (audio.paused) draw(audio.currentTime > 0 ? audio.currentTime : null);
  });
  cv.addEventListener('pointerleave', () => { hoverCol = -1; hoverEl.textContent = ''; if (audio.paused) draw(audio.currentTime > 0 ? audio.currentTime : null); });
  cv.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); playB.click(); } });

  const ro = new ResizeObserver(() => { layout(); draw(audio.paused && !audio.currentTime ? null : audio.currentTime); });
  const themeMq = matchMedia('(prefers-color-scheme: dark)');
  const retheme = () => draw(audio.paused && !audio.currentTime ? null : audio.currentTime);
  themeMq.addEventListener('change', retheme);
  const mo = new MutationObserver(retheme); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  layout();
  Promise.all([fetch(base + 'public/media/tasty_tunez/songs.json').then((r) => r.json()), document.fonts.load('32px "Stem 7"').catch(() => {})])
    .then(([data]) => {
      if (!alive) return;
      songs = data.map(prep);
      songsEl.innerHTML = songs.map((s, i) => `<button class="tt-song" type="button" aria-pressed="false" data-i="${i}"><i></i><span><b>${s.title}</b><span>${Math.round(s.bpm)} BPM · ${s.key} · ${s.model}${s.sub === 'instrumental' ? ' · instrumental' : ''}</span></span></button>`).join('');
      songsEl.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => select(+b.dataset.i, true)));
      playB.disabled = false; select(0, false); ro.observe(root); loop();
    }).catch(() => { playB.textContent = 'Unavailable'; });

  return () => {
    alive = false; cancelAnimationFrame(raf); audio.pause(); audio.removeAttribute('src');
    io.disconnect(); vid.pause(); vid.removeAttribute('src');
    ro.disconnect(); mo.disconnect(); themeMq.removeEventListener('change', retheme); style.remove(); el.remove();
  };
}
