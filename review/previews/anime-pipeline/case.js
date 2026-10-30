const OPENED = (a) => !!(a[1] && a[1].opened);   // the dossier already opens on the instrument
// anime pipeline deep dive, under the shared dossier header (site.js), which owns the title, the best frame and clip,
// the result, my decisions and the outputs list (meguri, shuto). This is the machine behind them. Pipeline, models, techniques, hardware, what carried over.
// Numbers are from ship/anime-pipeline-facts.md.
const CSS = `
.cs-anime{--acc:var(--cs-acc,#00728a);max-width:944px;margin:0 auto;padding:0 0 64px;color:var(--ink);font:400 16px/24px var(--font-sans)}
:root[data-theme="dark"] .cs-anime{--cs-acc:#4ccbe0}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .cs-anime{--cs-acc:#4ccbe0}}
.cs-anime *{box-sizing:border-box}
.cs-anime .hero{margin-top:0}
.cs-anime .tally{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:16px;margin-top:48px}
.cs-anime .tally>div{border-top:2px solid var(--ink);padding-top:8px;min-width:0}
.cs-anime .tally .v{font:400 32px/40px var(--font-pixel);-webkit-font-smoothing:none;white-space:nowrap}
.cs-anime .tally .l{font:400 13px/20px var(--font-sans)}
.cs-anime section{margin-top:64px}
.cs-anime h2{margin:0 0 16px;padding-bottom:8px;border-bottom:1px solid var(--ink);display:flex;gap:16px;align-items:baseline;font:400 32px/40px var(--font-pixel);-webkit-font-smoothing:none}
.cs-anime h2 span{color:var(--acc);font-size:16px;line-height:16px}
.cs-anime h3{margin:32px 0 8px;font:500 12px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}
.cs-anime section>p{margin:0 0 16px;max-width:64ch}
.cs-anime figure{margin:16px 0 0;border:1px solid var(--rule);background:var(--sheet);padding:12px;min-width:0}
.cs-anime figure img{display:block;width:100%;height:auto}
.cs-anime figcaption{margin-top:8px;font:italic 400 16px/24px var(--font-serif);color:var(--ink-muted);max-width:64ch}
.cs-anime figcaption b{font:500 12px/16px var(--font-mono);font-style:normal;letter-spacing:.12em;text-transform:uppercase;color:var(--ink);margin-right:8px}
.cs-anime .pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px}
.cs-anime .pair figure{margin:0}
.cs-anime .pair.tall{max-width:640px}
.cs-anime .tag{display:inline-block;font:500 12px/16px var(--font-mono);letter-spacing:.1em;text-transform:uppercase;padding:0 6px;border:1px solid var(--ink);margin-bottom:4px}
.cs-anime .tag.on{border-color:var(--acc);color:var(--acc)}
.cs-anime .tw{overflow-x:auto;margin-top:16px}
.cs-anime table{border-collapse:collapse;width:100%;min-width:640px;font:400 13px/20px var(--font-sans);font-variant-numeric:tabular-nums}
.cs-anime th{font:500 12px/16px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted);text-align:left;padding:8px 12px 8px 0;border-bottom:2px solid var(--ink);border-top:1px solid var(--ink);vertical-align:bottom}
.cs-anime td{padding:8px 12px 8px 0;border-bottom:1px solid var(--rule);vertical-align:top}
.cs-anime td.m{font:400 12px/16px var(--font-mono)}
.cs-anime td b{font-weight:600}
.cs-anime td.k{white-space:nowrap}
.cs-anime .cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 32px;margin-top:16px}
.cs-anime .cols h3{margin:0 0 8px;padding-bottom:4px;border-bottom:1px solid var(--ink);font:500 12px/16px var(--font-mono);letter-spacing:.14em;text-transform:uppercase}
.cs-anime .cols h3 i{font-style:normal;color:var(--acc)}
.cs-anime section ul{margin:0;padding:0;list-style:none;display:grid;gap:8px}
.cs-anime section li{font:400 13px/20px var(--font-sans);padding-left:16px;position:relative;max-width:64ch}
.cs-anime section li::before{content:'';position:absolute;left:0;top:7px;width:6px;height:6px;background:var(--acc)}
.cs-anime .cols .no li::before{background:transparent;border:1px solid var(--ink)}
.cs-anime .spec{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:16px 0 0}
.cs-anime .spec div{border-top:1px solid var(--ink);padding-top:8px}
.cs-anime .spec b{display:block;font:400 16px/20px var(--font-pixel);-webkit-font-smoothing:none}
.cs-anime .spec span{font:400 13px/20px var(--font-sans);color:var(--ink-muted)}
.cs-anime .note{border-left:3px solid var(--acc);padding:4px 0 4px 16px;margin:24px 0 0;max-width:64ch}
.cs-anime .note p{margin:0;max-width:64ch}
.cs-anime .carry a{color:var(--ink);text-decoration-color:var(--acc);text-underline-offset:4px}
.cs-anime .carry a:hover,.cs-anime .carry a:focus-visible{color:var(--acc)}
@media(max-width:639px){
  .cs-anime .cols,.cs-anime .spec{grid-template-columns:1fr}
 .cs-anime h2{font-size:16px;line-height:20px}
 .cs-anime table{min-width:0}.cs-anime thead{display:none}.cs-anime tr{display:grid;grid-template-columns:minmax(0,1fr);padding:8px 0;border-bottom:1px solid var(--rule)}.cs-anime td{border:0;padding:2px 0}.cs-anime tbody{border-top:2px solid var(--ink);display:block}.cs-anime .pair{grid-template-columns:1fr}
}
`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TALLY = [['37.9', 'GPU hours'], ['66', 'video clips'], ['1,384', 'stills'], ['18', 'hand-built workflows'], ['8', 'model families run'], ['37', 'commits']];
// §1
const STAGES = [
  ['1', 'Story + lint', 'story bible and a prompt linter', 'no named shows, studios or artists in prompts', 'CPU, minutes'],
  ['2', 'Storyboard (gate)', 'storyboard page builder; I approve before any video', 'speech under each frame; teaser v3 = 20 frames', 'CPU'],
  ['3', 'World', '<b>Blender 5.2.2 LTS</b> with my own town kits', 'master seed 4127, fingerprint lock; 717k faces, 1,990 plants', 'core build 12 s'],
  ['4', 'Previz', 'Blender camera operator rig + composition solver', 'passes: depth, lineart (reference only), colour ID, beauty; 124 frames', 'Cycles on CPU 15–20 min/shot; EEVEE ~0.2 s/frame'],
  ['5a', 'Keys (default)', '<b>Krea 2 Turbo</b> int8 + Qwen3-VL 4B fp8 text encoder', '8 steps, cfg 1, 1920×1088; img2img over previz at denoise 0.7 (Meguri), 0.62 (SHUTO)', 'median 25.4 s a still (1,384 runs)'],
  ['5b', 'Keys that must follow previz', '<b>Qwen-Image 2.1</b> int8 + Qwen3-VL 8B int8 + <b>Fun ControlNet Union</b> int8 (depth)', '1024², 25 steps, ControlNet 1.0', '51–59 s; Turbo 20–22 s; median 55.5 s (139 runs)'],
  ['6', 'Review (gate)', 'an agent looks at every image', 'rejects moved aside, never deleted', 'per batch'],
  ['7', 'Motion', '<b>MiniMax H3</b> pruned int8, ref2va / fl2va (21 GB DiT) + Qwen3-VL 32B NVFP4 text encoder (15.7 GB) + <b>H3 Fun ControlNet Union</b> (depth) + Turbo LoRAs', '1344×768, 24 fps, 124 frames (5.17 s); ref2va 8 steps or more; ControlNet at Turbo 4', 'ref2va median 28.5 min (23 runs); i2v Turbo 8 ≈16.3 min'],
  ['8', 'Upscale', '<b>Real-ESRGAN</b> animevideov3 (previews) / <b>SeedVR2 3B</b> fp8 (finals, BlockSwap 16)', 'to 1920×1080', '38 s / 15 min a 124-frame clip'],
  ['9', 'Sound + cut', '<b>Qwen3-TTS 1.7B</b> VoiceDesign, GPT-SoVITS, <b>ACE-Step 1.5</b> turbo; EDL to Kdenlive, JP + EN subs', 'H3 also makes native audio from an audio line', 'ACE-Step ≈15 s a cue'],
];
// §2
const TECH = [
  ['Previz depth video into H3 Fun ControlNet', 'standard, applied', 'the strongest setup in round 2; H3 follows the Blender camera exactly'],
  ['Depth vs lineart control', 'test', 'depth wins; lineart edges become objects (Fig. 2)'],
  ['Structured H3 brief, six sections, with a linter', 'standard + mine', 'the brief overrode a mis-tilted previz ramp that a freeform prompt painted as a canopy'],
  ['Resolution diagnosis', 'mine', '864×480 clips were mushy; at 1344×768, Turbo 8 ≈ base 20 at 42% of the time (16.4 vs 39.0 min)'],
  ['Reference-sheet leak fix', 'mine', 'ref2va at 4 steps dissolves into the sheet in the last 1–2 s; 8+ steps or split sheets fix it'],
  ['Styled keys over previz (Krea img2img)', 'mine', 'denoise 0.7 keeps the layout, 0.8 adds a second figure; an explicit head count fixed 3 rejects'],
  ['Two-ink look by stripping colour words', 'mine', 'colour words pull H3 back to full colour within ~30 frames; stripping them holds the palette'],
  ['View-aware costume briefs', 'mine', 'front garment drawn on the back: 7/18 → 0/18 (Fig. 3)'],
  ['Camera operator rig (steadicam, dolly, locked)', 'mine', 'bounce 3.75 → 0.34 cm; H3 jitter 2.1–4.2 px → 0.16 px'],
  ['Composition solver', 'mine', 'comp error 0–2.47% of frame width'],
  ['Seeded, fingerprint-locked world', 'mine', 'the check fails on drift; 820 wet lots rejected at plan time'],
  ['Line art from passes (numpy) instead of Freestyle', 'mine', 'Freestyle hit 41 GB RAM; passes stay under 2 GB'],
  ['Effects baked into 3D + per-rider facing prompts', 'mine', 'facing held ~45% → ~85% of keys; weapons in 172/180 keys'],
  ['Guides at frame 0, every story event and the end', 'mine', 'look held 4/4 clips; every keyed event happened'],
  ['One-variable lessons bench (14 tests, fixed seed 7)', 'mine; tests adapted from two tutorials', 'grey sheet beats riso sheet for identity; 8-step i2v holds the key (f0→f20 change 2.7 vs 20.4 at 4 steps)'],
  ['Run log with peak VRAM and RAM, skip-existing', 'mine', '1,822 rows, Oct 12 to 30 (read Oct 30): 0 CUDA out-of-memory errors, 38.1 GPU hours'],
  ['ComfyUI-channel technique study', 'research', 'bullet-time orbit and split-stack shorts done; keyframes to animation and blockout-first piloted; others proposed or skipped'],
];
// §3b
const HW = [
  ['8-bit weights', 'int8 on Ampere (no FP8 maths); Q8_0 GGUF for Wan; NVFP4 text encoder dequantized; fp8 for SeedVR2', 'not A/B logged; makes 21 GB + 15.7 GB of H3 weights runnable on 12 GB', 'kept, house rule'],
  ['Dynamic offload to RAM', 'ComfyUI default; <code>--lowvram</code> banned. Krea offloads 13.5 GB', '<code>--lowvram</code> was slower here and not needed (no number)', 'kept'],
  ['<code>--disable-pinned-memory</code>', 'stop pinning ~37 GB of offloaded H3 weights', 'RAM 52 → 13 GB; time 3.0 → 3.2 min', 'kept'],
  ['Tiled VAE decode', 'in every workflow; images 512/64, video 256/64', 'not A/B logged', 'kept'],
  ['Turbo / distill LoRAs', 'H3 Turbo 8 vs base 20 at 1344×768', '39.0 → 16.4 min, quality ≈ equal; 4-step 768p 8.4 min but invents camera moves. 8 steps for ref2va and i2v, 4 under ControlNet', 'kept'],
  ['Qwen Turbo for drafts', '25 → 8 steps', '51–59 s → 20–22 s', 'drafts only'],
  ['Low res, then upscale', 'H3 at 864×480, upscale to 1080p', '3.2 vs 16.4 min, but 480p was mushy, artifact-heavy', 'rejected'],
  ['SeedVR2 BlockSwap', '16 blocks swapped, tiled encode/decode', '1080p in 15 min at 11.8 GB', 'finals only'],
  ['SageAttention', 'with int8 weights it causes morphing, per the H3 docs', '—', 'not used'],
  ['Cheaper model for drafts', 'SDXL: 23 s, 8.9 GB, no offload, vs Krea 49 s', '2× faster but follows the subject loosely', 'not adopted'],
  ['Clip-length ceiling', 'H3 trained on 124–362 frames', '243-frame clips untested on 12 GB', '124 frames only'],
  ['Model unload between stages', 'ComfyUI idle cache ~7.8 GB', 'required before Blender EEVEE and TTS', 'kept'],
  ['One GPU lock for every session', 'one queue across projects; asks for MiB, can wait; batches under ~30 min', 'an OOM in another project when ComfyUI reloaded ~9.6 GB mid-run; fixed by going through the lock', 'kept, machine-wide'],
  ['RAM caps', '12 G for Blender, 20 G default for GPU jobs', 'Freestyle town at 41 GB killed, not the machine; H3 server peaks stay uncapped', 'kept'],
  ['Freestyle → numpy lines', 'line art from render passes', '41 GB → under 2 GB a look', 'kept'],
  ['Previz on CPU', 'Cycles on CPU leaves the GPU to ComfyUI', '15–20 min a shot', 'kept'],
];
const NOPE = /^(rejected|not used|not adopted)/;
const CARRY = [['playdough', 'playdough'], ['mise_en_place', 'mise en place'], ['bonfire', 'bonfire'], ['nibble', 'nibble'], ['napkin', 'napkin']];

export default async function renderCase(root, { project: p, base, meta }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('article'); el.className = 'cs-anime'; root.appendChild(el);
  const M = base + 'public/media/anime-pipeline/';
  const plate = (name, alt) => `<picture data-plate="${name}"><source media="(prefers-color-scheme: dark)" srcset="${M}${name}-dark.png"><img src="${M}${name}-light.png" alt="${esc(alt)}" loading="lazy" width="2240"></picture>`;
  const img = (f, alt) => `<img src="${M}${f}" alt="${esc(alt)}" loading="lazy">`;
  const tag = k => `<span class="tag${NOPE.test(k) ? '' : ' on'}">${esc(k)}</span>`;
  el.innerHTML = `<div class="hero"></div>
    <div class="tally">${TALLY.map(t => `<div><div class="v">${t[0]}</div><div class="l">${t[1]}</div></div>`).join('')}</div>

    <section><h2><span>01</span>The pipeline</h2>
    <p>The CPU stages make the decisions and the GPU stages only paint. Story, storyboard, world and previz are scripted and checked before a model runs; two gates stop bad work early, and the video model only ever gets a camera and a layout it has to follow.</p>
    <figure>${plate('plate-pipeline', 'Plate 2.1: the production pipeline in eight stages, from story bible to sound and cut, with CPU and GPU stages marked and measured times.')}<figcaption><b>Fig. 1</b>Plate 2.1, eight stages and two gates with measured times.</figcaption></figure>
    <div class="tw"><table><thead><tr><th>#</th><th>Stage</th><th>Model / tool</th><th>Settings</th><th>Time</th></tr></thead><tbody>
    ${STAGES.map(r => `<tr><td class="m">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td class="m">${r[3]}</td><td class="m">${r[4]}</td></tr>`).join('')}</tbody></table></div>
    <p style="margin-top:16px">The pipeline that won, from round 2 on: a Blender previz depth video drives H3 ref2va with Fun ControlNet and a Krea reference key, under a structured brief, then frames 0–1 are trimmed and the clip is upscaled. In the later recipe the camera comes from the previz, layout and look from a key painted over the set's first frame, and identity from a flat grey character sheet.</p></section>

    <section><h2><span>02</span>The models</h2>
    <p>Everything runs locally on one card. Eight model families made it into the run log; more were installed, tried by hand or downloaded and never run.</p>
    <div class="cols">
      <div><h3><i>Adopted</i></h3><ul>
        <li><b>Krea 2 Turbo</b> int8: default keys, 1,384 stills</li>
        <li><b>Qwen-Image 2.1</b> int8 + Fun ControlNet Union int8: keys that must follow a previz still, 139 runs</li>
        <li><b>MiniMax H3</b> pruned int8 (ref2va, fl2va, i2v) + H3 Fun ControlNet Union and Turbo LoRAs: all 66 clips</li>
        <li><b>Real-ESRGAN</b> animevideov3 for previews, <b>SeedVR2 3B</b> fp8 for finals</li>
        <li><b>Qwen3-TTS 1.7B</b> VoiceDesign (designed voices only), GPT-SoVITS, <b>ACE-Step 1.5</b> turbo for music</li>
        <li><b>Blender 5.2.2 LTS</b> for world and previz, on the CPU</li></ul></div>
      <div class="no"><h3>Tested, not adopted</h3><ul>
        <li>SDXL: Animagine XL 4.0, Illustrious XL 2.0. 23 s and 8.9 GB with no offload, but they follow the subject loosely (32 runs)</li>
        <li>10 Krea style LoRAs and 12 more Krea-2 style LoRAs in the SHUTO look lab</li>
        <li>The retroanime LoRA: a purple cast</li>
        <li>An ink-wash / dark-brush LoRA: flipped facing 8/10</li>
        <li>YuE2 music: one test cue. BiRefNet masks: two runs</li></ul></div>
      <div class="no"><h3>Installed, not used in production</h3><ul>
        <li><b>Wan 2.2 I2V A14B</b> Q8_0 GGUF with 4-step LoRAs: the fallback, 6.0 min for a 5 s clip at 832×480, no audio, brightness pumping</li>
        <li>TRELLIS.2 and Pixal3D image-to-3D: blocked, the DINOv3 encoder is gated</li>
        <li>The hosted H3 API: never run</li></ul></div>
      <div class="no"><h3>Downloaded, never run</h3><ul>
        <li>FastH3 8-step int8 (22 GB)</li>
        <li>LTX-2.3 22B distilled fp8 (29.5 GB)</li>
        <li>SAM 3.1</li></ul></div>
    </div>
    <h3>Failed or rejected settings</h3>
    <ul><li>Lineart ControlNet. H3 at 864×480. ref2va at 4 steps.</li>
      <li>Prompted print texture ("print block": no effect). Prop sheets when the start frame already holds the prop.</li>
      <li>Krea cannot stage head-on clashes (6/6 fail) or thrown riders (6/6), so those come from previz. A high drone view became a low rear view in every look.</li></ul></section>

    <section><h2><span>03</span>Techniques</h2>
    <p>Most of the work is technique, not models: getting a video model to follow a camera, a layout and a costume it did not invent. "Mine" means a rule or tool I wrote for this pipeline; "standard, applied" means a known technique I adopted.</p>
    <div class="tw"><table><thead><tr><th>Technique</th><th>Whose</th><th>Result</th></tr></thead><tbody>
    ${TECH.map(r => `<tr><td><b>${r[0]}</b></td><td class="k">${r[1].startsWith('mine') ? `<span class="tag on">${r[1]}</span>` : `<span class="tag">${r[1]}</span>`}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>
    <div class="pair">
      <figure>${img('control-lineart.jpg', 'Anime frame inside a train car generated under lineart control: two students on a bench, with extra rails and bars drawn along the edges of the seats.')}<figcaption><b>Fig. 2a</b>Lineart control. Edges become objects: a bench edge drawn as a rail.</figcaption></figure>
      <figure>${img('control-depth.jpg', 'The same train-car shot generated under depth control: the bench and car interior read as surfaces.')}<figcaption><b>Fig. 2b</b>Depth control, same shot. Depth only, never lineart.</figcaption></figure>
    </div>
    <div class="pair tall">
      <figure>${img('costume-before.jpg', 'Back view of a girl in a yellow raincoat walking down a lane, with the sailor collar and red front scarf drawn on her back.')}<figcaption><b>Fig. 3a</b>Back view, one brief for every view: the front garment lands on the back, 7 of 18.</figcaption></figure>
      <figure>${img('costume-after.jpg', 'The same back view with a view-aware costume brief: the back of the raincoat and uniform, no front details.')}<figcaption><b>Fig. 3b</b>View-aware costume brief: 0 of 18.</figcaption></figure>
    </div></section>

    <section><h2><span>04</span>Hardware</h2>
    <div class="spec"><div><b>RTX 3060</b><span>12,288 MiB VRAM, Ampere (sm_86)</span></div><div><b>64 GB DDR5</b><span>RAM; i5-12500 CPU</span></div><div><b>12 + ~48 GB</b><span>budget: 12 GB VRAM plus ~48 GB RAM offload, ~16 GB left for the OS and Blender</span></div></div>
    <p style="margin-top:16px">The animated meters at the top step through what I tried. The finding held across all 1,644 successful runs: VRAM ran near full and never failed. RAM and time set the limits. No logged run hit a CUDA out-of-memory error; the only memory kills were Blender RAM. A typical H3 clip peaks at 26.1 GiB of machine RAM, the worst at 58.7 GiB, and one 5 s clip takes 8.4–48 minutes, which is why there are 66 clips and 1,384 stills.</p>
    <figure>${plate('plate-memory', 'Plate 9.1: peak RAM per job and median peak VRAM per model family, with the 20 GB cap, the 12 GB memory cap and the 16 GB reserve marked, and GPU hours by family.')}<figcaption><b>Fig. 4</b>Plate 9.1, memory and time per model family. The plate counts 49 H3 clips and 18.1 h because it files the round-2 clips under "other"; I count all 66 as H3 (23.0 h). The plate was drawn from the log as read on Oct 22 (37.5 GPU hours); the full log to Oct 26 sums to 37.9.</figcaption></figure>
    <div class="tw"><table><thead><tr><th>Method</th><th>What</th><th>Before → after</th><th>Kept?</th></tr></thead><tbody>
    ${HW.map(r => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="m">${r[2]}</td><td class="k">${tag(r[3])}</td></tr>`).join('')}</tbody></table></div>
    <div class="note"><p>How memory was measured: peak VRAM is the whole GPU from nvidia-smi, including 0.4–1 GB of desktop; peak RAM is machine-wide, so other sessions and Blender are included. Both are sampled every 0.25 s.</p></div></section>

    <section class="carry"><h2><span>05</span>What carried over</h2>
    <ul>
      <li>The GPU lock became the machine-wide rule. ${CARRY.map(c => `<a href="case.html?p=${c[0]}">${c[1]}</a>`).join(', ')} all run GPU jobs only through it, and carry the same house rules: ask before downloads over 10 GB, never the system Python.</li>
      <li>Another project now frees VRAM through ComfyUI instead of killing it, and waits while ComfyUI has a job, after it hit an OOM when ComfyUI reloaded ~9.6 GB mid-run.</li>
      <li>playdough blocks the non-commercial models in code, the same list this pipeline keeps.</li>
      <li>The illustrated technical-manual style of this pipeline's manual is the one the other projects point to.</li>
    </ul></section>`;
  // plates follow the page theme: an explicit data-theme beats the OS preference
  const syncPlates = () => {
    const t = document.documentElement.dataset.theme;
    el.querySelectorAll('picture[data-plate]').forEach(pc => {
      const n = pc.dataset.plate, src = pc.querySelector('source'), im = pc.querySelector('img');
      if (t === 'dark' || t === 'light') { src.media = 'not all'; im.src = M + n + '-' + t + '.png'; }
      else { src.media = '(prefers-color-scheme: dark)'; im.src = M + n + '-light.png'; }
    });
  };
  syncPlates();
  const mo = new MutationObserver(syncPlates); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const hero = el.querySelector('.hero');
  let un = () => {};
  if (OPENED(arguments)) hero.remove(); else try { const mod = await import('./preview.js'); un = mod.default(hero, { mode: 'hero', base }) || un; } catch (e) { console.warn(e); }
  return () => { un(); mo.disconnect(); el.remove(); style.remove(); };
}
