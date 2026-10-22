const EX = 'studio/exhibits.json', DL = 'studio/dialog.json';
// Dive Club brand (dive.club, Framer): Be Vietnam Pro (display), Hind (body), Fragment Mono (mono) are all Google Fonts, loaded as-is.
// Wordmark: cropped from their public OG image (white, tinted by currentColor via mask). Teal #5cc8dc is the OG headline colour.
const FONTS = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700&family=Hind:wght@400;500&family=Fragment+Mono&display=swap';
const CSS = `
.pv-dive-club{--a:#2f5fa8;--at:#2f5fa8;display:grid;gap:16px;font-family:'Hind',var(--font-sans);color:var(--ink)}
.pv-dive-club .pv-dc-logo{display:block;background:currentColor;-webkit-mask:var(--logo) center/contain no-repeat;mask:var(--logo) center/contain no-repeat;aspect-ratio:148/47}
:root[data-theme="dark"] .pv-dive-club{--a:#5cc8dc;--at:#5cc8dc}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .pv-dive-club{--a:#5cc8dc;--at:#5cc8dc}}
.pv-dive-club.hero .pv-dc-main{grid-template-columns:minmax(0,1fr)}
.pv-dive-club .pv-dc-main{display:grid;gap:16px;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);align-items:start}
@media (max-width:760px){.pv-dive-club .pv-dc-main{grid-template-columns:minmax(0,1fr)}}
.pv-dive-club .pv-dc-stage{position:relative;aspect-ratio:1448/1086;border:1px solid var(--ink);background:var(--sheet);max-height:78vh;margin:0 auto;width:100%}
.pv-dive-club.hero .pv-dc-stage{max-width:min(100%,calc(78vh*1448/1086))}
.pv-dive-club .pv-dc-stage img,.pv-dive-club .pv-dc-stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;object-fit:contain;display:block}
.pv-dive-club .pv-dc-brand{position:absolute;left:50%;top:7%;transform:translateX(-50%);background:#121417;color:#f9f9f5;border:1px solid var(--ink);padding:8px 14px}
.pv-dive-club .pv-dc-brand i{width:72px}
.pv-dive-club .pv-dc-hd{display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--ink);padding-bottom:8px;font:500 12px/16px 'Fragment Mono',var(--font-mono);letter-spacing:.12em;text-transform:uppercase}
.pv-dive-club .pv-dc-hd i{width:44px;color:var(--at)}
.pv-dive-club .pv-dc-credit{font:400 12px/18px 'Fragment Mono',var(--font-mono);color:var(--ink-muted)}
.pv-dive-club .pv-dc-play{position:absolute;left:50%;bottom:8%;transform:translateX(-50%);background:var(--a);color:#f9f9f5;border:1px solid var(--ink);padding:12px 28px;font:600 14px/20px var(--font-mono);letter-spacing:.16em;text-transform:uppercase;cursor:pointer;border-radius:0}
:root[data-theme="dark"] .pv-dive-club .pv-dc-play{color:#121417}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .pv-dive-club .pv-dc-play{color:#121417}}
.pv-dive-club .pv-dc-play:hover,.pv-dive-club .pv-dc-play:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.pv-dive-club .pv-dc-cap{position:absolute;left:0;top:0;background:var(--sheet);border-right:1px solid var(--ink);border-bottom:1px solid var(--ink);font:500 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;padding:4px 10px}
.pv-dive-club .pv-dc-side{display:grid;gap:12px}
.pv-dive-club .pv-dc-bubble{border:1px solid var(--ink);background:var(--sheet);padding:12px 14px}
.pv-dive-club .pv-dc-q{font:400 12px/16px 'Fragment Mono',var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted)}
.pv-dive-club .pv-dc-who{font:600 11px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--at);margin-top:8px}
.pv-dive-club .pv-dc-line{font:400 17px/26px 'Hind',var(--font-sans);min-height:96px;margin:2px 0 0}
.pv-dive-club .pv-dc-line:after{content:"";display:inline-block;width:2px;height:1em;background:var(--ink);vertical-align:-2px;margin-left:2px}
.pv-dive-club .pv-dc-dis{font:400 12px/18px var(--font-mono);color:var(--ink-muted);border-top:1px solid var(--rule);padding-top:8px;margin-top:8px}
.pv-dive-club .pv-dc-dis b{color:var(--at);font-weight:600;letter-spacing:.1em;text-transform:uppercase}
.pv-dive-club .pv-dc-full{font:500 12px/18px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--at);text-decoration:underline;text-underline-offset:3px}
.pv-dive-club .pv-dc-ex{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;align-items:end}
@media (max-width:760px){.pv-dive-club .pv-dc-ex{grid-template-columns:repeat(2,minmax(0,1fr))}}
.pv-dive-club .pv-dc-card{border:1px solid var(--ink);background:var(--sheet);padding:8px 10px;display:flex;flex-direction:column;gap:4px;border-top:4px solid var(--a)}
.pv-dive-club .pv-dc-n{font:500 11px/16px var(--font-mono);letter-spacing:.12em;color:var(--ink-muted)}
.pv-dive-club .pv-dc-t{font:600 14px/18px 'Be Vietnam Pro',var(--font-sans)}
.pv-dive-club .pv-dc-s{font:400 12px/16px var(--font-pixel);color:var(--at)}
`;
export default function mount(root, { mode, base }) {
  const hero = mode === 'hero';
  const lk = document.createElement('link'); lk.rel = 'stylesheet'; lk.href = FONTS; document.head.appendChild(lk);
  const logo = `url(${base}public/media/dive-club/dive-logo.png)`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const el = document.createElement('div'); el.className = 'pv-dive-club' + (hero ? ' hero' : ''); el.style.setProperty('--logo', logo);
  const studio = base + 'studio/index.html';
  const GAME_LIVE = false; // the playable studio is back in the workshop for polish; flip to true to re-enable
  el.innerHTML = `<div class="pv-dc-main"><div class="pv-dc-stage"><img alt="Dive Club studio interior, pixel-art village style" src="${base}public/media/dive-club/interior.jpg"><span class="pv-dc-cap">Dive Club studio</span><span class="pv-dc-brand"><i class="pv-dc-logo" role="img" aria-label="Dive Club"></i></span>${GAME_LIVE ? '<button class="pv-dc-play" type="button">Press start</button>' : '<span class="pv-dc-play" aria-disabled="true">Playable studio: in the workshop</span>'}</div>
<div class="pv-dc-side"><div class="pv-dc-bubble" aria-live="off"><div class="pv-dc-q"></div><div class="pv-dc-who"></div><p class="pv-dc-line"></p><div class="pv-dc-dis"><b>Synthetic</b> <span></span></div></div>${GAME_LIVE ? `<a class="pv-dc-full" href="${studio}">Full screen game</a>` : ''}</div></div><div class="pv-dc-hd"><i class="pv-dc-logo" role="img" aria-label="Dive Club"></i><span>The museum: five exhibits</span></div><div class="pv-dc-ex"></div><div class="pv-dc-credit">Dive Club name and logo belong to Dive Club. Fan project, made for Ridd and Tommy.</div>`;
  root.appendChild(el);
  const stage = el.querySelector('.pv-dc-stage'), play = el.querySelector('.pv-dc-play');
  if (GAME_LIVE) play.onclick = () => {
    const f = document.createElement('iframe');
    f.src = studio; f.loading = 'lazy'; f.title = 'Dive Club studio game';
    f.setAttribute('allow', 'autoplay; fullscreen'); f.allowFullscreen = true;
    stage.replaceChildren(f); f.focus();
  };
  let dead = false, timer = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  fetch(base + EX).then(r => r.json()).then(ex => {
    if (dead) return;
    const box = el.querySelector('.pv-dc-ex');
    ex.forEach((e, i) => {
      const c = document.createElement('div'); c.className = 'pv-dc-card';
      c.style.marginTop = (hero ? 0 : (4 - i) * 6) + 'px';
      const n = document.createElement('div'); n.className = 'pv-dc-n'; n.textContent = 'EXHIBIT ' + (i + 1);
      const t = document.createElement('div'); t.className = 'pv-dc-t'; t.textContent = e.title;
      const s = document.createElement('div'); s.className = 'pv-dc-s'; s.textContent = e.stat;
      c.append(n, t, s); box.appendChild(c);
    });
  }).catch(() => {});
  fetch(base + DL).then(r => r.json()).then(d => {
    if (dead) return;
    el.querySelector('.pv-dc-dis span').textContent = d.disclaimer;
    const qs = [d.questions[0], d.questions[1], d.questions[4]];
    const picks = [[qs[0], 'ridd', 0], [qs[1], 'tommy', 1], [qs[2], 'ridd', 0]];
    const q = el.querySelector('.pv-dc-q'), w = el.querySelector('.pv-dc-who'), l = el.querySelector('.pv-dc-line');
    let i = 0;
    const run = () => {
      if (dead) return;
      const [qq, h, k] = picks[i % picks.length]; i++;
      const txt = qq.answers[h][k].text;
      q.textContent = 'Ask: ' + qq.text; w.textContent = d.hosts[h].name + ' (synthetic)';
      if (reduce) { l.textContent = txt; timer = setTimeout(run, 6000); return; }
      let n = 0; l.textContent = '';
      const tick = () => {
        if (dead) return;
        l.textContent = txt.slice(0, ++n);
        timer = setTimeout(n < txt.length ? tick : run, n < txt.length ? 28 : 4500);
      };
      tick();
    };
    run();
  }).catch(() => {});
  return () => { dead = true; clearTimeout(timer); el.remove(); st.remove(); lk.remove(); };
}
