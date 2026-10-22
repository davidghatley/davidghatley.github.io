export default function mount(root, { mode, base }) {
  const M = base + 'public/media/vaasf/';
  const S = [
    ['Cover', 's0.jpg', 595], ['Pages 2-3', 's1.jpg', 1190], ['Pages 4-5', 's2.jpg', 1190], ['Pages 6-7', 's3.jpg', 1190],
    ['Pages 8-9', 's4.jpg', 1190], ['Pages 10-11', 's5.jpg', 1190], ['Pages 12-13', 's6.jpg', 1190], ['Page 14', 's7.jpg', 595], ['Back cover', 's8.jpg', 595]
  ];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const maxH = mode === 'hero' ? 'min(70vh,720px)' : '440px';
  const st = document.createElement('style');
  st.textContent = `
.pv-vaasf{--a:#587187;display:block}
:root[data-theme=dark] .pv-vaasf,.pv-vaasf.dk{--a:#587187}
.pv-vaasf .tabs{display:flex;gap:0;margin-bottom:12px;border-bottom:1px solid var(--rule)}
.pv-vaasf .tabs button{font:400 17px/20px 'EB Garamond',serif;font-variant:all-small-caps;letter-spacing:.09em;padding:8px 14px;background:none;border:0;border-bottom:3px solid transparent;color:var(--ink-muted);cursor:pointer}
.pv-vaasf .tabs button[aria-selected=true]{color:var(--a);font-family:'DM Serif Display',serif;font-variant:normal;letter-spacing:0;font-size:19px;border-bottom-color:var(--a)}
.pv-vaasf .stage{display:flex;justify-content:center;align-items:center;height:${maxH};background:#f4efe2;border:1px solid #d8d0bb;padding:12px;box-sizing:border-box}
.pv-vaasf .book{position:relative;height:100%;display:flex;align-items:center;justify-content:center;max-width:100%}
.pv-vaasf .book img{display:block;max-height:100%;max-width:100%;object-fit:contain;border:1px solid var(--rule)}
.pv-vaasf .book img.new{position:absolute;inset:auto;left:50%;top:50%;transform:translate(-50%,-50%)}
.pv-vaasf .book img.new.f{animation:pvv-f .42s steps(6,end) both}
.pv-vaasf .book img.new.b{animation:pvv-b .42s steps(6,end) both}
@keyframes pvv-f{from{clip-path:inset(0 0 0 100%)}to{clip-path:inset(0)}}
@keyframes pvv-b{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0)}}
.pv-vaasf .nav{display:flex;align-items:center;gap:12px;margin-top:10px;font:400 16px/20px 'EB Garamond',serif;font-variant:all-small-caps;letter-spacing:.09em;color:var(--a)}
.pv-vaasf .nav button{font:600 16px/20px 'EB Garamond',serif;font-variant:all-small-caps;letter-spacing:.09em;padding:8px 14px;background:var(--a);color:#f9f9f5;border:0;cursor:pointer}
.pv-vaasf .nav button:disabled{background:var(--rule);color:var(--ink-muted);cursor:default}
.pv-vaasf .nav span{flex:1;text-align:center}
.pv-vaasf .note{margin-top:8px;font:italic 400 15px/20px 'EB Garamond',serif;color:var(--ink-muted)}
.pv-vaasf .web{max-height:${maxH};overflow-y:auto;border:1px solid #d8d0bb}.pv-vaasf .web img{display:block;width:100%;max-width:760px;margin:0 auto;height:auto};margin:0 auto;object-fit:contain;border:1px solid var(--rule)}
.pv-vaasf .vid{aspect-ratio:16/9;max-height:${maxH};margin:0 auto;background:var(--ink);position:relative}
.pv-vaasf .vid button{position:absolute;inset:0;width:100%;height:100%;border:0;background:none;cursor:pointer;color:#f9f9f5;font:400 17px/20px 'EB Garamond',serif;font-variant:all-small-caps;letter-spacing:.09em}
.pv-vaasf .vid img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.pv-vaasf .vid button b{position:relative;background:var(--a);padding:10px 18px;font-weight:600}
.pv-vaasf .vid iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.pv-vaasf .pv-vaasf .nav span b{font:400 19px/20px 'DM Serif Display',serif;font-variant:normal;letter-spacing:0}button:focus-visible{outline:2px solid var(--ink);outline-offset:2px}`;
  const fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.href = M + 'fonts/fonts.css'; document.head.appendChild(fl);
  document.head.appendChild(st);
  const el = document.createElement('div'); el.className = 'pv-vaasf'; root.appendChild(el);
  el.innerHTML = `<div class="tabs" role="tablist"><button role="tab" data-t="book" aria-selected="true">Program</button><button role="tab" data-t="web" aria-selected="false">Web</button><button role="tab" data-t="video" aria-selected="false">Video</button></div><div class="pane"></div>`;
  const pane = el.querySelector('.pane');
  let i = 0, tab = 'book', timer;
  const q = (s) => el.querySelector(s);
  function book() {
    pane.innerHTML = `<div class="stage"><div class="book"></div></div><div class="nav"><button data-d="-1" aria-label="Previous spread">Prev</button><span></span><button data-d="1" aria-label="Next spread">Next</button></div><div class="note">16-page saddle-stitched program, designed in code. Award page omitted.</div>`;
    show(0, 0);
  }
  function show(d, first) {
    const b = q('.book'); if (!b) return;
    const img = new Image(); img.src = M + S[i][1]; img.alt = 'VAASF 2026 program, ' + S[i][0].toLowerCase();
    img.className = 'new';
    const old = b.querySelector('img:not(.new)');
    if (old && d && !reduce) {
      img.classList.add(d > 0 ? 'f' : 'b'); b.appendChild(img);
      clearTimeout(timer);
      timer = setTimeout(() => { old.remove(); img.classList.remove('new', 'f', 'b'); }, 440);
    } else { b.innerHTML = ''; img.classList.remove('new'); b.appendChild(img); }
    pane.querySelector('.nav span').innerHTML = '<b>' + S[i][0] + '</b> &nbsp;' + (i + 1) + ' of ' + S.length;
    pane.querySelector('[data-d="-1"]').disabled = i === 0;
    pane.querySelector('[data-d="1"]').disabled = i === S.length - 1;
  }
  function web() {
    pane.innerHTML = `<div class="web"><img src="${M}site-full.jpg" alt="Full-page screenshot of the VAASF Webflow site" loading="lazy"></div><div class="note">vaasf-site.webflow.io, built in Webflow. Scroll the page.</div>`;
  }
  function video() {
    pane.innerHTML = `<div class="vid"><img src="${M}video.jpg" alt=""><button><b>Play promo video</b></button></div><div class="note">Loads from youtube-nocookie.com only when you press play.</div>`;
    pane.querySelector('.vid button').onclick = () => {
      const v = pane.querySelector('.vid');
      v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/N6dR2XRocNI?autoplay=1" title="VAASF promo video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    };
  }
  function setTab(t) {
    tab = t; clearTimeout(timer);
    el.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.t === t));
    ({ book, web, video })[t]();
  }
  const onClick = (e) => {
    const t = e.target.closest('[data-t]'); if (t) return setTab(t.dataset.t);
    const n = e.target.closest('[data-d]'); if (n && !n.disabled) { const d = +n.dataset.d; i += d; show(d); }
  };
  const onKey = (e) => {
    if (tab !== 'book' || !el.contains(document.activeElement)) return;
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (d && i + d >= 0 && i + d < S.length) { i += d; show(d); }
  };
  el.addEventListener('click', onClick); el.addEventListener('keydown', onKey);
  setTab('book');
  return () => { clearTimeout(timer); el.removeEventListener('click', onClick); el.removeEventListener('keydown', onKey); st.remove(); fl.remove(); el.remove(); };
}
