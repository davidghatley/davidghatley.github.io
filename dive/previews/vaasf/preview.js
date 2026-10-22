export default function mount(root, { mode, base }) {
  const M = base + 'public/media/vaasf/';
  const hero = mode === 'hero';
  const fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.href = M + 'fonts/fonts.css'; document.head.appendChild(fl);
  const st = document.createElement('style');
  st.textContent = `
.pv-vaasf{--cr:#f4efe2;--tx:#1d2a36;--mu:#4d5a66;--bl:#587187;--ln:#c9bfa6;background:var(--cr);color:var(--tx);font:400 16px/22px 'EB Garamond',serif;padding:${hero ? '40px' : '14px'};border:1px solid var(--ln);box-sizing:border-box}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .pv-vaasf{--cr:#1a2027;--tx:#ece5d4;--mu:#a9b0b7;--bl:#8aa3b8;--ln:#3a4450}}
:root[data-theme=dark] .pv-vaasf{--cr:#1a2027;--tx:#ece5d4;--mu:#a9b0b7;--bl:#8aa3b8;--ln:#3a4450}
.pv-vaasf *{box-sizing:border-box}
.pv-vaasf img{display:block;width:100%;height:auto;border:1px solid var(--ln);background:#fff}
.pv-vaasf img.site{border:1px solid var(--bl)}
.pv-vaasf figure{margin:0;min-width:0}
.pv-vaasf figcaption{margin-top:${hero ? '10px' : '5px'};font-size:${hero ? '15px' : '12.5px'};line-height:${hero ? '20px' : '15px'};font-style:italic;color:var(--mu)}
.pv-vaasf figcaption b{display:block;font-style:normal;font-weight:400;font-variant:all-small-caps;letter-spacing:.12em;color:var(--bl);font-size:${hero ? '17px' : '13px'}}
.pv-vaasf .board{display:grid;grid-template-columns:340fr 327fr 244fr;gap:${hero ? '40px 36px' : '0 14px'};align-items:start}
.pv-vaasf .mid{display:grid;gap:${hero ? '36px' : '10px'}}
.pv-vaasf .small{grid-column:1/3;display:${hero ? 'flex' : 'none'};flex-wrap:wrap;align-items:flex-start;gap:28px;border-top:1px solid var(--ln);padding-top:28px}
.pv-vaasf .small figure{flex:0 0 auto}
.pv-vaasf .small img{height:200px;width:auto;max-width:100%}
.pv-vaasf .site-col{grid-row:span 2}
.pv-vaasf .head{display:${hero ? 'flex' : 'none'};justify-content:space-between;align-items:baseline;margin-bottom:28px;border-bottom:1px solid var(--ln);padding-bottom:10px}
.pv-vaasf .head h3{margin:0;font:italic 400 28px/32px 'DM Serif Display',serif;color:var(--tx)}
.pv-vaasf .head span{font-variant:all-small-caps;letter-spacing:.12em;color:var(--bl)}
@media (max-width:760px){
 .pv-vaasf{padding:16px}
 .pv-vaasf .board{grid-template-columns:minmax(0,1fr);gap:28px}
 .pv-vaasf .small,.pv-vaasf .site-col{grid-column:auto;grid-row:auto}
 .pv-vaasf .small{flex-wrap:wrap;gap:20px}
 .pv-vaasf .small img{height:150px}
 .pv-vaasf .cover,.pv-vaasf .site-col{max-width:340px}
}`;
  document.head.appendChild(st);
  const f = (src, alt, b, c, cls) => `<figure><img ${cls ? `class="${cls}"` : ''} src="${M + src}" alt="${alt}"><figcaption><b>${b}</b>${c}</figcaption></figure>`;
  const el = document.createElement('div'); el.className = 'pv-vaasf'; root.appendChild(el);
  el.innerHTML = `<div class="head"><h3>Canciones Españolas</h3><span>Program and site, 2026</span></div>
<div class="board">
<div class="cover">${f('hero.jpg', 'Cover of the 2026 VAASF program, Canciones Españolas.', 'Cover', 'Program, 16 pp., saddle-stitched')}</div>
<div class="mid">
${f('s1.jpg', 'Spread of pages 2 and 3: Schedule of Events and the first day of listings.', 'Pages 2-3', 'Schedule of Events, with Friday&rsquo;s listings')}
${f('s4.jpg', 'Photo spread of pages 8 and 9 from the program.', 'Pages 8-9', 'Festivals Past, set photo-led')}
</div>
<div class="site-col">${f('site-full.jpg', 'Full-page screenshot of the live VAASF Webflow site.', 'The website', 'Webflow; events schedule rebuilt', 'site')}</div>
<div class="small">
${f('masterclass.jpg', 'Master Classes page with a black and white rehearsal photograph.', 'Page 6', 'Master Classes')}
${f('s2.jpg', 'Spread of pages 4 and 5, Young Artists Division listings.', 'Pages 4-5', 'Listings')}
${f('s6.jpg', 'Spread of pages 12 and 13, high school and middle school listings.', 'Pages 12-13', 'Listings, continued')}
${f('thanks.jpg', 'Back cover reading Gracias over a blue painted figure with sponsor logos.', 'Page 16', 'Back cover')}
</div></div>`;
  return () => { st.remove(); fl.remove(); el.remove(); };
}
