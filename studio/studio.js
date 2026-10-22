import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const $ = (id) => document.getElementById(id);
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionQuery.matches;
motionQuery.addEventListener('change', (e) => { reducedMotion = e.matches; });
const DISC = 'Lines are synthetic, from models trained on public episodes, curated by David, not the hosts’ words.';
const expressions = ['neutral', 'happy', 'wink', 'excited', 'thinking', 'surprised'];
const fallbackDialog = {
  disclaimer: DISC,
  hosts: {
    ridd: { name: 'Ridd', greeting: [{ text: 'Hey, welcome to our little studio! Pick a question and let’s explore an idea.', expression: 'happy' }] },
    tommy: { name: 'Tommy', greeting: [{ text: 'Come on in! There’s a seat at the table and a whole wall of experiments to explore.', expression: 'wink' }] }
  },
  questions: [
    { id: 'q1', text: 'What is this little world?', answers: { ridd: [{ text: 'A playful interface for a persona-model experiment. The exhibits explain how it was made. These are curated synthetic lines, not our actual words.', expression: 'thinking' }], tommy: [{ text: 'Think of it as a walkable project page. A place to meet the characters, ask a few questions, and see the process behind the prototype.', expression: 'happy' }] } },
    { id: 'q2', text: 'How do you approach a prototype?', answers: { ridd: [{ text: 'Start with one question you can learn from. Make the smallest version that lets someone react to the idea.', expression: 'excited' }], tommy: [{ text: 'Make something tangible early. A rough interaction can start a much more useful conversation than an abstract description.', expression: 'thinking' }] } },
    { id: 'q3', text: 'Where should I explore next?', answers: { ridd: [{ text: 'The five framed exhibits behind the desk follow the experiment from public episodes to decision models. Walk up and press E, or tap Read.', expression: 'wink' }], tommy: [{ text: 'Have a look at the museum wall. Or take the portfolio shortcut whenever you’re ready. Thanks for stopping by!', expression: 'happy' }] } }
  ]
};
const fallbackExhibits = [
  { id: 'e1', title: 'Corpus', body: ['Scraped public episodes form the source corpus for this experiment.', 'Placeholder exhibit: source counts, links, and collection notes will be added here.'], stat: '01 / SOURCE MATERIAL' },
  { id: 'e2', title: 'Transcribe + diarize', body: ['Transcription turns audio into text. Diarization identifies who said what.', 'Placeholder exhibit: the transcription and speaker-labeling process will be documented here.'], stat: '02 / WHO SAID WHAT' },
  { id: 'e3', title: 'Persona LLMs', body: ['One LoRA per host adapts a base model toward each persona.', 'Placeholder exhibit: training details and evaluation notes will be added here.'], stat: '03 / TWO PERSONAS' },
  { id: 'e4', title: 'System One', body: ['Decision models from each persona use a Kev-4B pointer head.', 'Placeholder exhibit: architecture and decision-task details will be added here.'], stat: '04 / DECISION MODELS' },
  { id: 'e5', title: 'Results', body: ['This room is a prototype of the experience, not a claim of model performance.', 'Placeholder exhibit: measured results, limitations, and examples will be added here.'], stat: '05 / WORK IN PROGRESS' }
];

let renderer, scene, camera, outdoor, indoor, player, hosts = {}, room = 'outside';
let dialogData = fallbackDialog, exhibitData = fallbackExhibits;
let obstacles = { outside: [], inside: [] }, targets = [], activeTarget = null;
let keys = new Set(), route = [], transition = false, opened = false, speakerId = null;
let lines = [], lineIndex = 0, fullText = '', typed = 0, typeElapsed = 0, typing = false;
let seenDisclaimer = false, audio = null, muted = false, pendingTarget = null;
let time = 0, lastTime = 0, cameraFocus = new THREE.Vector3(0, 0, 0);
const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const cameraOffset = new THREE.Vector3(8, 12.5, 17);
const matCache = new Map();
const geo = { box: new THREE.BoxGeometry(1, 1, 1), sphere: new THREE.SphereGeometry(1, 12, 8), cylinder: new THREE.CylinderGeometry(1, 1, 1, 10), cone: new THREE.ConeGeometry(1, 1, 8) };
function material(color) {
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshLambertMaterial({ color, flatShading: true }));
  return matCache.get(color);
}
function mesh(parent, geometry, color, pos, scale = [1, 1, 1]) {
  const m = new THREE.Mesh(geometry, typeof color === 'string' || typeof color === 'number' ? material(color) : color);
  m.position.set(...pos); m.scale.set(...scale); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const box = (p, c, xyz, whd) => mesh(p, geo.box, c, xyz, whd);
const ball = (p, c, xyz, scale) => mesh(p, geo.sphere, c, xyz, typeof scale === 'number' ? [scale, scale, scale] : scale);
const cyl = (p, c, xyz, scale) => mesh(p, geo.cylinder, c, xyz, scale);
function group(parent, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
let seed = 52;
function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
function texture(draw, w = 768, h = 256) {
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function panel(parent, map, x, y, z, w, h) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, transparent: true }));
  m.position.set(x, y, z); parent.add(m); return m;
}
function signTexture(title, subtitle = '', dark = false) {
  return texture((ctx, w, h) => {
    ctx.fillStyle = dark ? '#263e40' : '#d9a967'; ctx.fillRect(0, 0, w, h);
    if (!dark) { ctx.strokeStyle = '#a6763e44'; ctx.lineWidth = 3; for (let y = 25; y < h; y += 45) { ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(200, y - 10, 500, y + 8, w, y); ctx.stroke(); } }
    ctx.fillStyle = dark ? '#fff3d9' : '#473725'; ctx.textAlign = 'center'; ctx.font = '800 65px Nunito, sans-serif'; ctx.fillText(title, w / 2, subtitle ? 112 : 150);
    if (subtitle) { ctx.font = '500 29px "IBM Plex Mono", monospace'; ctx.fillStyle = dark ? '#b2d6df' : '#6a5034'; ctx.fillText(subtitle, w / 2, 185); }
  });
}
function submarine(parent, x, y, z, s = 1) {
  const g = group(parent, x, y, z); g.scale.setScalar(s);
  ball(g, '#f5c344', [0, 0, 0], [.55, .32, .26]);
  box(g, '#e1a32f', [-.55, 0, 0], [.18, .34, .18]);
  box(g, '#f5c344', [.06, .35, 0], [.13, .23, .14]); box(g, '#f5c344', [.14, .45, 0], [.25, .1, .14]);
  cyl(g, '#345965', [.14, 0, .24], [.19, .08, .19]).rotation.x = Math.PI / 2;
  cyl(g, '#69b5ce', [.14, 0, .29], [.13, .04, .13]).rotation.x = Math.PI / 2;
  return g;
}
function plant(parent, x, y, z, s = 1) {
  const g = group(parent, x, y, z); g.scale.setScalar(s);
  cyl(g, '#e8d5b4', [0, .26, 0], [.3, .52, .3]); cyl(g, '#63513c', [0, .53, 0], [.26, .02, .26]);
  for (let i = 0; i < 7; i++) { const a = i * 2.4; const leaf = ball(g, i % 2 ? '#588b55' : '#789e59', [Math.sin(a) * .26, .75 + i * .06, Math.cos(a) * .26], [.15, .4, .12]); leaf.rotation.z = Math.sin(a) * .8; leaf.rotation.x = Math.cos(a) * .8; }
}
function obstacle(which, x, z, w, d) { obstacles[which].push({ x, z, w: w / 2, d: d / 2 }); }
function tree(x, z, s = 1) {
  const g = group(outdoor, x, 0, z); g.scale.setScalar(s);
  cyl(g, '#997047', [0, 1, 0], [.23, 2, .23]);
  for (let i = 0; i < 5; i++) { const a = i * 2.4; ball(g, ['#73a16a', '#82ae70', '#659560'][i % 3], [Math.cos(a) * .6, 2.6 + (i % 2) * .65, Math.sin(a) * .6], [1.12, 1.1, 1.06]); }
  obstacle('outside', x, z, .65 * s, .65 * s);
}
function buildOutdoor() {
  outdoor = group(scene);
  box(outdoor, '#8fb67b', [0, -.25, 0], [28, .5, 25]);
  box(outdoor, '#b4c88e', [0, -.55, 0], [28.2, .35, 25.2]);
  // A miniature creek along the edge of the garden.
  box(outdoor, '#82bcc5', [11.2, -.02, 0], [4, .05, 25]);
  for (let i = 0; i < 24; i++) { const z = i - 11.5; ball(outdoor, '#b7bd9b', [8.9 + Math.sin(i) * .15, .05, z], [.35, .2, .6]); box(outdoor, '#b3d6d4', [10 + rand() * 2, .016, z], [.5 + rand(), .015, .035]); }
  for (let i = 0; i < 8; i++) { const x = Math.sin(i * 1.7) * .3; const stone = cyl(outdoor, i % 2 ? '#c8c4a9' : '#d3cfb6', [x, .025, 1.2 + i * 1.1], [.75, .12, .47]); stone.rotation.y = i * .65; }
  const cabin = group(outdoor, 0, 0, -3.1);
  box(cabin, '#aa8355', [0, .12, 0], [8.6, .3, 6.2]);
  box(cabin, '#ba884f', [0, 1.7, 0], [8, 3.3, 5.7]);
  for (let i = 0; i < 11; i++) {
    box(cabin, i % 2 ? '#d29c5c' : '#c79355', [0, .35 + i * .29, 2.88], [8, .27, .12]);
    box(cabin, i % 2 ? '#bd8b50' : '#c39154', [4.04, .35 + i * .29, 0], [.12, .27, 5.7]);
  }
  for (const x of [-3.85, 3.85]) box(cabin, '#e1ac6b', [x, 1.8, 2.98], [.22, 3.55, .25]);
  // Gabled corrugated roof, with each batten following the slope.
  const slope = .49, roofLength = 3.65;
  for (const side of [-1, 1]) {
    const roof = box(cabin, '#416e97', [0, 4.15, side * 1.58], [8.9, .16, roofLength]); roof.rotation.x = side * slope;
    for (let i = 0; i < 36; i++) { const rib = box(cabin, i % 2 ? '#4d7faa' : '#5688ae', [-4.36 + i * .25, 4.23, side * 1.58], [.085, .095, roofLength + .05]); rib.rotation.x = side * slope; }
    const trim = box(cabin, '#335a7b', [0, 3.32, side * 3.2], [9, .18, .18]); trim.rotation.x = side * slope;
  }
  cyl(cabin, '#3b658a', [0, 5.03, 0], [.13, 9.05, .13]).rotation.z = Math.PI / 2;
  box(cabin, '#537d91', [2.7, 4.9, -1], [.65, 1.7, .65]); box(cabin, '#37566b', [2.7, 5.76, -1], [.83, .18, .83]);
  box(cabin, '#745133', [0, 1.35, 3.01], [1.65, 2.7, .15]);
  box(cabin, '#507e91', [0, 1.26, 3.11], [1.36, 2.5, .1]);
  for (const x of [-.78, .78]) box(cabin, '#e7b877', [x, 1.4, 3.16], [.17, 2.8, .2]);
  box(cabin, '#e7b877', [0, 2.78, 3.17], [1.8, .18, .2]);
  box(cabin, '#f5d391', [0, 1.94, 3.18], [.74, .65, .04]);
  box(cabin, '#8bbac3', [0, 1.94, 3.21], [.6, .5, .03]);
  ball(cabin, '#e8bf65', [.47, 1.05, 3.25], .09);
  box(cabin, '#b8b6a0', [0, .1, 3.35], [2, .2, .8]);
  for (const x of [-2.55, 2.55]) {
    box(cabin, '#f0bd77', [x, 1.8, 3.01], [1.65, 1.6, .18]); box(cabin, '#92bcc1', [x, 1.8, 3.12], [1.35, 1.3, .08]);
    box(cabin, '#f4ca8a', [x, 1.8, 3.2], [.08, 1.35, .08]); box(cabin, '#f4ca8a', [x, 1.8, 3.2], [1.4, .08, .08]);
    box(cabin, '#e9b471', [x, 1.04, 3.2], [1.85, .15, .35]);
    box(cabin, '#a77545', [x, .78, 3.26], [1.6, .35, .42]);
    for (let j = 0; j < 5; j++) { ball(cabin, '#658f51', [x - .55 + j * .27, 1.02, 3.3], [.21, .18, .21]); ball(cabin, j % 2 ? '#edc76e' : '#e4a39a', [x - .55 + j * .27, 1.15, 3.34], .1); }
  }
  box(cabin, '#805a36', [0, 3.52, 3.28], [4.4, 1.05, .18]);
  panel(cabin, signTexture('Dive Club', 'GOOD QUESTIONS LIVE HERE'), .47, 3.53, 3.39, 3.25, .97);
  submarine(cabin, -1.55, 3.56, 3.47, .75);
  obstacle('outside', -2.55, -3.1, 3, 6.2); obstacle('outside', 2.55, -3.1, 3, 6.2); obstacle('outside', 0, -4.1, 2.1, 4.2);
  const chalk = group(outdoor, 3.1, 0, 2.1); chalk.rotation.y = -.18;
  for (const x of [-.65, .65]) { const leg = box(chalk, '#b48a55', [x, .83, 0], [.13, 1.8, .17]); leg.rotation.x = -.15; const back = box(chalk, '#966f44', [x, .7, -.5], [.12, 1.55, .12]); back.rotation.x = .35; }
  box(chalk, '#ca9a60', [0, 1.05, .08], [1.5, 1.5, .15]);
  panel(chalk, signTexture('Inflight', '☑ prototype   ☑ feedback', true), 0, 1.06, .17, 1.28, 1.25);
  obstacle('outside', 3.1, 2.1, 1.6, 1);
  plant(outdoor, -4.7, 0, .4, 1.4); plant(outdoor, 4.8, 0, .5, 1.5);
  const trees = [[-7,-4,1.15],[-6.8,1,1],[-9,5,1.2],[-5.6,7.5,.85],[6,-5,1.1],[7.1,4,.9],[-10,-8,1.3],[5.8,-8,1.1],[1,-9,1.15],[-4,-9,.9],[6.7,9,.8]];
  trees.forEach(t => tree(...t));
  for (let i = 0; i < 100; i++) {
    const x = rand() * 22 - 12, z = rand() * 21 - 10;
    if ((Math.abs(x) < 4.8 && z < 1) || (Math.abs(x) < 1.1 && z > 0) || x > 8.5) continue;
    const flower = i % 3 === 0; const g = group(outdoor, x, 0, z);
    if (flower) {
      cyl(g, '#5d8552', [0, .18, 0], [.025, .36, .025]);
      for (let j = 0; j < 5; j++) { const a = j * Math.PI * 2 / 5; ball(g, i % 2 ? '#fff2ce' : '#e8b1a6', [Math.cos(a) * .11, .37, Math.sin(a) * .11], [.09, .05, .09]); }
      ball(g, '#e8bd4b', [0, .4, 0], .065);
    } else { for (let j = 0; j < 3; j++) { const grass = mesh(g, geo.cone, '#7da466', [j * .06, .12, 0], [.06, .25 + rand() * .12, .04]); grass.rotation.z = (j - 1) * .3; } }
  }
  // Low fence at the back: a soft boundary around the diorama.
  for (let i = -11; i <= 7; i++) box(outdoor, '#e2d0a0', [i, .58, -10.4], [.15, 1.16, .17]);
  for (const y of [.3, .83]) box(outdoor, '#d7c393', [-2, y, -10.4], [19, .12, .12]);
}
function buildInterior() {
  indoor = group(scene); indoor.visible = false;
  box(indoor, '#956d49', [0, -.2, 0], [16, .4, 12]);
  for (let z = 0; z < 24; z++) for (let x = 0; x < 4; x++) box(indoor, ['#cca16c', '#d4ab77', '#c49965'][(z + x) % 3], [-6 + x * 4, .02, -5.75 + z * .5], [3.97, .07, .477]);
  for (let i = 0; i < 11; i++) { box(indoor, i % 2 ? '#cea16b' : '#c59a63', [0, .2 + i * .32, -6], [16, .3, .24]); box(indoor, '#c39865', [-8, .2 + i * .32, -.2], [.24, .3, 11.6]); }
  for (const x of [-7.8, 0, 7.8]) box(indoor, '#a57a4e', [x, 1.8, -5.8], [.2, 3.6, .3]);
  box(indoor, '#ad8050', [0, 3.6, -5.9], [16.3, .22, .35]);
  box(indoor, '#ad8050', [-7.9, 3.6, -.1], [.3, .22, 12]);
  box(indoor, '#567e9c', [0, .09, .25], [7.7, .07, 5.2]);
  for (const x of [-3.7, 3.7]) box(indoor, '#8baabb', [x, .133, .25], [.06, .01, 5]);
  for (const z of [-2.15, 2.65]) box(indoor, '#8baabb', [0, .133, z], [7.45, .01, .07]);
  const desk = group(indoor, 0, 0, -.5);
  box(desk, '#a97a46', [0, 1.12, 0], [6.3, .25, 1.65]); box(desk, '#e1b374', [0, 1.28, 0], [6.5, .13, 1.8]);
  for (const x of [-2.8, 2.8]) for (const z of [-.6, .6]) box(desk, '#a97c48', [x, .55, z], [.22, 1.1, .22]);
  for (const x of [-1.9, 1.9]) {
    box(desk, '#b9c1bd', [x, 1.39, 0], [1.18, .08, .8]);
    const screen = box(desk, '#cbd0c9', [x, 1.8, -.32], [1.18, .78, .065]); screen.rotation.x = -.15;
    const display = box(desk, '#375b65', [x, 1.8, -.272], [1.04, .63, .025]); display.rotation.x = -.15;
    for (let j = 0; j < 4; j++) box(desk, j === 0 ? '#e6bf61' : '#88b0b2', [x - .12, 1.99 - j * .12, -.215], [.55 - j * .07, .035, .025]);
    cyl(desk, '#3b4745', [x + .78, 1.4, .28], [.22, .06, .22]); cyl(desk, '#3b4745', [x + .78, 1.69, .28], [.045, .55, .045]);
    const mic = ball(desk, '#354241', [x + .78, 1.99, .28], [.16, .27, .16]); mic.rotation.z = -.4;
    cyl(desk, '#f3e5c8', [x - .75, 1.53, .2], [.13, .34, .13]);
  }
  box(desk, '#3c4b4b', [0, 1.48, .2], [.95, .23, .62]);
  for (let i = 0; i < 5; i++) { box(desk, '#9ca59a', [-.34 + i * .17, 1.61, .18], [.025, .025, .35]); box(desk, i % 2 ? '#dab35c' : '#81b799', [-.34 + i * .17, 1.64, .2 - i * .04], [.09, .04, .06]); }
  obstacle('inside', 0, -.5, 6.5, 1.8);
  for (const x of [-2, 2]) {
    box(indoor, '#416d89', [x, .62, -2.1], [.9, .18, .9]); box(indoor, '#537e96', [x, 1.03, -2.48], [.95, 1, .15]);
    for (const dx of [-.33, .33]) for (const dz of [-.33, .33]) box(indoor, '#936c46', [x + dx, .3, -2.1 + dz], [.1, .6, .1]);
    obstacle('inside', x, -2.1, 1, 1);
    cyl(indoor, '#4e5044', [x, 3.67, -.4], [.025, 1.15, .025]);
    mesh(indoor, new THREE.CylinderGeometry(.16, .4, .42, 12), '#40504b', [x, 3.12, -.4]);
    cyl(indoor, new THREE.MeshBasicMaterial({ color: '#ffe4a2' }), [x, 2.91, -.4], [.33, .035, .33]);
  }
  // Bookshelf and a small submarine on the left.
  for (const y of [.25, 1, 1.75]) box(indoor, '#a67b4e', [-6.7, y, -1.2], [1.75, .13, .75]);
  for (const x of [-7.6, -5.8]) box(indoor, '#ba8d58', [x, 1, -1.2], [.13, 2, .8]);
  for (let i = 0; i < 7; i++) box(indoor, ['#547f92', '#d4b35a', '#7b956a', '#ca8868'][i % 4], [-7.4 + i * .22, 1.35, -1.2], [.17, .57 + (i % 2) * .1, .5]);
  submarine(indoor, -6.75, .59, -.96, .7); plant(indoor, -6.7, 1.83, -1.2, .8);
  obstacle('inside', -6.7, -1.2, 2, 1);
  plant(indoor, 6.7, 0, -3.7, 1.8); plant(indoor, -6.7, 0, 3.7, 1.6);
  obstacle('inside', 6.7, -3.7, .9, .9); obstacle('inside', -6.7, 3.7, .9, .9);
  submarine(indoor, 4.9, .55, .2, 1.1);
  box(indoor, '#af8654', [4.9, .17, .2], [1.65, .3, 1]); obstacle('inside', 4.9, .2, 1.7, 1);
  panel(indoor, signTexture('THE MAKING OF', 'FIVE SMALL STOPS · ONE BIG EXPERIMENT', true), 0, 3.1, -5.74, 4.2, .5);
  for (let i = 0; i < 5; i++) {
    const x = -6 + i * 3, data = exhibitData[i] || fallbackExhibits[i];
    box(indoor, '#795b3e', [x, 1.95, -5.76], [2.35, 1.62, .15]);
    panel(indoor, texture((ctx, w, h) => {
      ctx.fillStyle = '#f6edcf'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = ['#527d8c', '#b28b4f', '#6c8d69', '#6b7d9c', '#b77c62'][i]; ctx.fillRect(18, 18, w - 36, 145);
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff6da'; ctx.font = '700 87px monospace'; ctx.fillText(String(i + 1).padStart(2, '0'), w / 2, 125);
      ctx.fillStyle = '#42534b'; ctx.font = '800 29px Nunito, sans-serif'; ctx.fillText(data.title, w / 2, 213, w - 28);
    }, 512, 256), x, 1.95, -5.67, 2.13, 1.4);
    targets.push({ type: 'exhibit', id: data.id, data, position: new THREE.Vector3(x, 0, -4.65), radius: 1.35, label: `Read · ${data.title}` });
    cyl(indoor, '#dcbf7c', [x, .08, -4.6], [.32, .05, .32]);
  }
  // An open threshold at the front of the cutaway room.
  box(indoor, '#5c8290', [0, .08, 5.35], [2.6, .06, .85]);
  const exit = panel(indoor, signTexture('GARDEN  ↓', '', true), 0, .12, 5.32, 2.2, .6); exit.rotation.x = -Math.PI / 2;
}
// Merge static props by material: hundreds of small primitives become a few dozen draws.
function batchStatic(root) {
  root.updateMatrixWorld(true);
  const batches = new Map();
  root.traverse(obj => { if (!obj.isMesh) return; const key = obj.material.uuid; if (!batches.has(key)) batches.set(key, { material: obj.material, geometries: [] }); const g = obj.geometry.clone(); g.applyMatrix4(obj.matrixWorld); batches.get(key).geometries.push(g); });
  root.clear();
  for (const { material: mat, geometries } of batches.values()) {
    const merged = mergeGeometries(geometries, false);
    if (merged) { const m = new THREE.Mesh(merged, mat); m.castShadow = !mat.isMeshBasicMaterial; m.receiveShadow = true; root.add(m); }
    geometries.forEach(g => g.dispose());
  }
}
const faces = {};
function faceTexture(expression) {
  if (faces[expression]) return faces[expression];
  faces[expression] = texture((c) => {
    c.fillStyle = '#df9780'; c.globalAlpha = .66;
    for (const x of [49, 207]) { c.beginPath(); c.ellipse(x, 160, 24, 15, 0, 0, Math.PI * 2); c.fill(); } c.globalAlpha = 1;
    c.strokeStyle = '#3f3b33'; c.fillStyle = '#3f3b33'; c.lineWidth = 8; c.lineCap = 'round';
    for (const [i, x] of [80, 176].entries()) {
      c.beginPath();
      if (expression === 'excited' || (expression === 'wink' && i === 1)) { c.moveTo(x - 14, 120); c.quadraticCurveTo(x, 95, x + 14, 120); c.stroke(); }
      else { c.ellipse(x, expression === 'thinking' ? 109 : 116, 9, expression === 'surprised' ? 16 : 13, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff6df'; c.beginPath(); c.arc(x + 2, 111, 2.5, 0, Math.PI * 2); c.fill(); c.fillStyle = '#3f3b33'; }
      if (expression === 'thinking' || expression === 'surprised') { c.beginPath(); c.moveTo(x - 10, 85 - i * 6); c.lineTo(x + 10, 80 + i * 6); c.stroke(); }
    }
    c.fillStyle = '#d7855e'; c.beginPath(); c.moveTo(128, 128); c.lineTo(119, 148); c.lineTo(137, 148); c.closePath(); c.fill();
    c.strokeStyle = '#5d4235'; c.fillStyle = '#925149'; c.lineWidth = 5;
    c.beginPath();
    if (expression === 'surprised') { c.ellipse(128, 177, 12, 16, 0, 0, Math.PI * 2); c.fill(); }
    else if (['happy', 'wink', 'excited'].includes(expression)) { c.moveTo(102, 169); c.quadraticCurveTo(128, 180, 154, 169); c.quadraticCurveTo(130, 211, 102, 169); c.fill(); c.stroke(); }
    else if (expression === 'thinking') { c.moveTo(115, 179); c.lineTo(137, 175); c.stroke(); }
    else { c.moveTo(114, 174); c.quadraticCurveTo(128, 185, 142, 174); c.stroke(); }
  }, 256, 256);
  return faces[expression];
}
function character(kind) {
  const root = new THREE.Group(), body = group(root);
  const skin = kind === 'tommy' ? '#e5ad7c' : '#f2c49c', hair = kind === 'ridd' ? '#b48752' : kind === 'tommy' ? '#493e32' : '#8b644a';
  const shirt = kind === 'ridd' ? '#eee5ce' : kind === 'tommy' ? '#7a8258' : '#c47e63';
  for (const x of [-.17, .17]) { cyl(body, kind === 'tommy' ? '#4e657c' : '#50524b', [x, .35, 0], [.14, .5, .14]); ball(body, '#f0e8d6', [x, .13, .09], [.19, .13, .29]); }
  ball(body, shirt, [0, .85, 0], [.38, .48, .26]);
  if (kind === 'tommy') { box(body, '#f0e5cd', [0, .91, .245], [.2, .6, .035]); for (const x of [-.23, .23]) box(body, '#69764e', [x, .94, .24], [.13, .19, .035]); }
  if (kind === 'ridd') { ball(body, '#ded6bd', [0, 1.13, -.16], [.3, .25, .24]); submarine(body, .13, .92, .26, .21); for (const x of [-.07, .07]) box(body, '#faf0db', [x, 1.02, .26], [.025, .23, .025]); }
  for (const x of [-.44, .44]) { const arm = ball(body, shirt, [x, .85, 0], [.15, .31, .16]); arm.rotation.z = Math.sign(x) * .35; ball(body, skin, [x * 1.15, .63, .03], .16); }
  ball(body, skin, [0, 1.57, 0], [.55, .53, .46]);
  for (const x of [-.53, .53]) ball(body, skin, [x, 1.52, 0], [.13, .17, .12]);
  ball(body, hair, [0, 1.75, -.12], [.55, .43, .4]);
  if (kind === 'ridd') {
    for (let i = 0; i < 17; i++) { const a = i * 2.4; ball(body, i % 2 ? '#bc915f' : hair, [Math.sin(a) * (.2 + (i % 3) * .1), 1.95 + Math.cos(a) * .12, Math.cos(a) * .25], [.19, .17, .19]); }
  } else {
    for (let i = 0; i < 11; i++) { const a = i * 2.4; const spike = mesh(body, geo.cone, hair, [Math.sin(a) * .35, 1.99, Math.cos(a) * .22], [.17, .47, .17]); spike.rotation.z = -.5 + Math.sin(a) * .45; spike.rotation.x = Math.cos(a) * .5; }
  }
  const face = panel(body, faceTexture('happy'), 0, 1.58, .475, .83, .83);
  root.userData = { body, face, kind };
  return root;
}
function setExpression(host, expression) { if (host) host.userData.face.material.map = faceTexture(expressions.includes(expression) ? expression : 'neutral'); }
async function loadData(url, fallback, valid) {
  try { const response = await fetch(url, { signal: AbortSignal.timeout(7000) }); if (!response.ok) throw new Error(response.status); const data = await response.json(); if (!valid(data)) throw new Error('Invalid data contract'); return data; }
  catch (error) { console.warn(`Using bundled placeholder for ${url}:`, error.message); return fallback; }
}
function normalizeLines(value) { return Array.isArray(value) ? value.filter(l => l && typeof l.text === 'string').map(l => ({ text: l.text, expression: expressions.includes(l.expression) ? l.expression : 'neutral' })) : []; }
async function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6)); renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.domElement.tabIndex = 0; renderer.domElement.setAttribute('aria-label', 'Village. Move with WASD or arrow keys. Press E near the door, hosts, or exhibits.');
  $('world').append(renderer.domElement);
  scene = new THREE.Scene(); scene.background = new THREE.Color('#d7e6cb');
  camera = new THREE.OrthographicCamera(-12, 12, 9, -9, .1, 100);
  scene.add(new THREE.HemisphereLight('#fff5dc', '#7e9271', 2.35));
  const sun = new THREE.DirectionalLight('#fff1d0', 2.5); sun.position.set(-9, 16, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 55 }); sun.shadow.normalBias = .035; sun.shadow.bias = -.0002; sun.shadow.radius = 2; scene.add(sun);
  [dialogData, exhibitData] = await Promise.all([
    loadData('./dialog.json', fallbackDialog, d => d && d.hosts?.ridd && d.hosts?.tommy && Array.isArray(d.questions)),
    loadData('./exhibits.json', fallbackExhibits, d => Array.isArray(d) && d.length >= 5 && d.slice(0, 5).every(e => e && typeof e.title === 'string' && Array.isArray(e.body)))
  ]);
  await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1200))]);
  $('disclaimer').textContent = DISC;
  buildOutdoor(); buildInterior(); batchStatic(outdoor); batchStatic(indoor);
  player = character('visitor'); scene.add(player); player.position.set(0, 0, 6.3); player.rotation.y = Math.PI;
  for (const [id, x] of [['ridd', -2], ['tommy', 2]]) {
    const host = character(id); host.position.set(x, .14, 1.5); host.rotation.y = .16; indoor.add(host); hosts[id] = host;
    targets.push({ type: 'host', id, position: host.position, radius: 1.8, label: `Talk to ${dialogData.hosts[id].name || id}` });
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture((c, w, h) => { c.fillStyle = '#fff5db'; c.beginPath(); c.roundRect(0, 0, w, h, 45); c.fill(); c.fillStyle = '#43544a'; c.font = '800 54px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText(dialogData.hosts[id].name || id, w / 2, 74); }, 256, 112), depthTest: false }));
    label.position.set(x, 2.65, 1.5); label.scale.set(1.05, .46, 1); indoor.add(label);
  }
  const markerMaterial = new THREE.MeshBasicMaterial({ color: '#fff4c5', transparent: true, opacity: .75, depthWrite: false });
  const marker = new THREE.Mesh(new THREE.RingGeometry(.24, .31, 24), markerMaterial); marker.rotation.x = -Math.PI / 2; marker.position.y = .16; marker.visible = false; scene.add(marker); scene.userData.marker = marker;
  resize(); cameraFocus.set(0, .8, 1.1); updateCamera(1, true);
  bindEvents(); clearTimeout(window.studioLoadTimeout); $('loading').hidden = true;
  renderer.setAnimationLoop(frame);
}
function resize() {
  if (!renderer) return;
  const aspect = innerWidth / innerHeight;
  const h = aspect < .8 ? 24 : aspect < 1.2 ? 18 : 16;
  camera.left = -h * aspect / 2; camera.right = h * aspect / 2; camera.top = h / 2; camera.bottom = -h / 2;
  camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
}
function walkable(x, z) {
  const bound = room === 'outside' ? { l: -11.5, r: 8.3, t: -9.8, b: 10.8 } : { l: -7.45, r: 7.45, t: -5.15, b: 5.65 };
  if (x < bound.l || x > bound.r || z < bound.t || z > bound.b) return false;
  return !obstacles[room].some(o => Math.abs(x - o.x) < o.w + .28 && Math.abs(z - o.z) < o.d + .28);
}
function segmentClear(a, b) {
  const d = a.distanceTo(b), n = Math.ceil(d / .16);
  for (let i = 1; i <= n; i++) { const t = i / n; if (!walkable(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false; }
  return true;
}
// Small A* grid makes a ground click route around the cabin, furniture, and trees.
function pathTo(destination) {
  const start = player.position.clone(); start.y = 0; destination.y = 0;
  if (!walkable(destination.x, destination.z)) return [];
  if (segmentClear(start, destination)) return [destination];
  const step = .45, encode = (x, z) => `${x},${z}`;
  const sx = Math.round(start.x / step), sz = Math.round(start.z / step), gx = Math.round(destination.x / step), gz = Math.round(destination.z / step);
  const open = [{ x: sx, z: sz, g: 0, f: 0, parent: null }], best = new Map([[encode(sx, sz), 0]]), closed = new Set();
  let end = null;
  for (let count = 0; open.length && count < 5000; count++) {
    let min = 0; for (let i = 1; i < open.length; i++) if (open[i].f < open[min].f) min = i;
    const node = open.splice(min, 1)[0], key = encode(node.x, node.z); if (closed.has(key)) continue; closed.add(key);
    if (Math.abs(node.x - gx) <= 1 && Math.abs(node.z - gz) <= 1 && segmentClear(new THREE.Vector3(node.x * step, 0, node.z * step), destination)) { end = node; break; }
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (!dx && !dz) continue;
      const x = node.x + dx, z = node.z + dz, k = encode(x, z), g = node.g + Math.hypot(dx, dz);
      if (closed.has(k) || (best.has(k) && best.get(k) <= g) || !walkable(x * step, z * step)) continue;
      if (dx && dz && (!walkable(node.x * step, z * step) || !walkable(x * step, node.z * step))) continue;
      best.set(k, g); open.push({ x, z, g, f: g + Math.hypot(x - gx, z - gz), parent: node });
    }
  }
  if (!end) return [];
  const path = [destination]; for (let n = end; n.parent; n = n.parent) path.unshift(new THREE.Vector3(n.x * step, 0, n.z * step));
  const smooth = []; let anchor = start;
  while (path.length) { let i = path.length - 1; while (i > 0 && !segmentClear(anchor, path[i])) i--; anchor = path[i]; smooth.push(anchor); path.splice(0, i + 1); }
  return smooth;
}
function unlockAudio() {
  if (!audio) { const AudioContext = window.AudioContext || window.webkitAudioContext; if (AudioContext) audio = new AudioContext(); }
  if (audio?.state === 'suspended') audio.resume().catch(() => {});
}
function blip(letter) {
  if (!audio || muted || audio.state !== 'running' || !/[a-z0-9]/i.test(letter) || !speakerId) return;
  const now = audio.currentTime, osc = audio.createOscillator(), gain = audio.createGain();
  const vowel = 'aeiou'.indexOf(letter.toLowerCase());
  osc.type = 'triangle'; osc.frequency.setValueAtTime((speakerId === 'ridd' ? 480 : 290) * (1 + (letter.charCodeAt(0) % 9) * .045 + (vowel >= 0 ? .17 + vowel * .04 : 0)), now);
  osc.frequency.exponentialRampToValueAtTime(osc.frequency.value * .78, now + .045);
  gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.035, now + .005); gain.gain.exponentialRampToValueAtTime(.001, now + .055);
  osc.connect(gain); gain.connect(audio.destination); osc.start(now); osc.stop(now + .06); osc.onended = () => { osc.disconnect(); gain.disconnect(); };
}
function stopMovement() { keys.clear(); route = []; pendingTarget = null; if (scene?.userData.marker) scene.userData.marker.visible = false; }
function openShell(name, caption) {
  stopMovement(); opened = true; $('dialog').hidden = false; $('speaker').textContent = name; $('dialog-caption').textContent = caption;
  $('choices').replaceChildren(); $('exhibit-content').replaceChildren(); $('exhibit-content').hidden = true; $('speech').hidden = false; $('first-disclaimer').hidden = true; $('continue').hidden = true; $('interact').hidden = true; $('close-dialog').focus();
}
function closeDialog() {
  opened = false; typing = false; $('dialog').hidden = true; if (speakerId) setExpression(hosts[speakerId], 'happy'); speakerId = null;
  renderer.domElement.focus();
}
function startHost(id) {
  const data = dialogData.hosts[id]; openShell(data.name || id, 'A SYNTHETIC CONVERSATION'); speakerId = id;
  if (!seenDisclaimer) { $('first-disclaimer').textContent = typeof dialogData.disclaimer === 'string' ? `${dialogData.disclaimer} ${dialogData.disclaimer === DISC ? '' : DISC}` : DISC; $('first-disclaimer').hidden = false; seenDisclaimer = true; }
  hosts[id].rotation.y = Math.atan2(player.position.x - hosts[id].position.x, player.position.z - hosts[id].position.z);
  lines = normalizeLines(data.greeting); if (!lines.length) lines = normalizeLines(fallbackDialog.hosts[id].greeting); lineIndex = 0; showLine();
}
function showLine() {
  const line = lines[lineIndex]; fullText = line.text; typed = 0; typeElapsed = 0; $('speech').textContent = ''; $('choices').replaceChildren(); $('continue').hidden = false; $('continue').textContent = 'Show full line ↓';
  setExpression(hosts[speakerId], line.expression); typing = !reducedMotion;
  if (reducedMotion) finishLine();
}
function finishLine() { typing = false; typed = fullText.length; $('speech').textContent = fullText; $('speech-announcement').textContent = fullText; if (lineIndex < lines.length - 1) { $('continue').textContent = 'Continue ↓'; } else { showQuestions(); if (document.activeElement === $('continue')) $('choices').firstElementChild?.focus(); } }
function showQuestions() {
  $('continue').hidden = true; $('choices').replaceChildren();
  const valid = dialogData.questions.filter(q => q && typeof q.text === 'string' && normalizeLines(q.answers?.[speakerId]).length).slice(0, 4);
  for (const question of valid) { const b = document.createElement('button'); b.type = 'button'; b.textContent = question.text; b.addEventListener('click', () => { unlockAudio(); lines = normalizeLines(question.answers[speakerId]); lineIndex = 0; showLine(); $('continue').focus(); }); $('choices').append(b); }
  if (!valid.length) { const b = document.createElement('button'); b.textContent = 'See you around!'; b.addEventListener('click', closeDialog); $('choices').append(b); }
}
function advance() { if (!opened || !speakerId) return; if (typing) finishLine(); else if (lineIndex < lines.length - 1) { lineIndex++; showLine(); } }
function showExhibit(data) {
  speakerId = null; openShell(data.title, 'THE MAKING OF · EXHIBIT'); $('speech').hidden = true; $('exhibit-content').hidden = false;
  for (const text of data.body) { const p = document.createElement('p'); p.textContent = String(text); $('exhibit-content').append(p); }
  if (data.stat) { const p = document.createElement('p'); p.className = 'stat'; p.textContent = data.stat; $('exhibit-content').append(p); }
  if (typeof data.image === 'string' && data.image.trim()) {
    const url = new URL(data.image, location.href);
    if (['http:', 'https:'].includes(url.protocol)) { const img = document.createElement('img'); img.src = url.href; img.alt = data.title; img.loading = 'lazy'; img.onerror = () => img.remove(); $('exhibit-content').append(img); }
  }
  $('speech-announcement').textContent = `${data.title}. ${data.body.join(' ')}`;
}
function interact() { unlockAudio(); if (opened) { advance(); return; } if (transition || !activeTarget) return; if (activeTarget.type === 'host') startHost(activeTarget.id); else if (activeTarget.type === 'exhibit') showExhibit(activeTarget.data); else changeRoom(); }
async function changeRoom() {
  if (transition || opened) return; transition = true; stopMovement(); $('interact').hidden = true; $('fade').classList.add('active');
  await new Promise(r => setTimeout(r, reducedMotion ? 0 : 310));
  room = room === 'outside' ? 'inside' : 'outside'; indoor.visible = room === 'inside'; outdoor.visible = room === 'outside';
  player.position.set(0, 0, room === 'inside' ? 4.45 : 1.35); player.rotation.y = room === 'inside' ? Math.PI : 0;
  scene.background.set(room === 'inside' ? '#d7d6c2' : '#d7e6cb');
  $('location').textContent = room === 'inside' ? 'THE STUDIO & MUSEUM' : 'THE GARDEN';
  $('objective').textContent = room === 'inside' ? 'Say hello to a host. Explore the five exhibits behind the desk.' : 'Make yourself at home. Walk through the blue door.';
  updateCamera(1, true); $('fade').classList.remove('active');
  await new Promise(r => setTimeout(r, reducedMotion ? 0 : 310)); transition = false;
}
function bindEvents() {
  addEventListener('resize', resize);
  addEventListener('blur', () => keys.clear());
  document.addEventListener('visibilitychange', () => { keys.clear(); lastTime = 0; });
  addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (opened) {
      if (key === 'escape') { e.preventDefault(); closeDialog(); return; }
      if (key === 'tab') {
        const nodes = [...$('dialog').querySelectorAll('button:not([hidden]), a[href]')].filter(n => !n.disabled), first = nodes[0], last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      if (key === 'e' || (key === 'enter' && !['BUTTON','A'].includes(document.activeElement.tagName))) { e.preventDefault(); if (!e.repeat) advance(); }
      return;
    }
    if (['BUTTON', 'A'].includes(document.activeElement.tagName)) return;
    if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) { e.preventDefault(); keys.add(key); route = []; pendingTarget = null; unlockAudio(); }
    if (key === 'e' || key === 'enter') { e.preventDefault(); if (!e.repeat) interact(); }
  });
  addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  renderer.domElement.addEventListener('pointerdown', e => {
    if (e.button !== 0 || opened || transition) return;
    renderer.domElement.focus(); unlockAudio(); mouse.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); raycaster.setFromCamera(mouse, camera);
    let point = new THREE.Vector3(); pendingTarget = null;
    const doorHit = room === 'outside' && raycaster.ray.intersectBox(new THREE.Box3(new THREE.Vector3(-.75, 0, -.1), new THREE.Vector3(.75, 2.7, .25)), new THREE.Vector3());
    if (room === 'inside') {
      const hits = raycaster.intersectObjects(Object.values(hosts), true);
      if (hits.length) { let object = hits[0].object; while (object.parent && !object.userData.kind) object = object.parent; pendingTarget = targets.find(t => t.type === 'host' && t.id === object.userData.kind); if (pendingTarget) point.copy(pendingTarget.position).add(new THREE.Vector3(0, 0, 1.2)); }
    }
    if (doorHit) point.set(0, 0, .2);
    else if (!pendingTarget && !raycaster.ray.intersectPlane(groundPlane, point)) return;
    route = pathTo(point);
    if (route.length) { scene.userData.marker.position.set(point.x, .16, point.z); scene.userData.marker.visible = true; }
    else if (pendingTarget && player.position.distanceTo(pendingTarget.position) < pendingTarget.radius) { activeTarget = pendingTarget; interact(); }
  });
  $('interact').addEventListener('click', interact); $('close-dialog').addEventListener('click', closeDialog); $('continue').addEventListener('click', advance);
  $('sound').addEventListener('click', () => { unlockAudio(); muted = !muted; $('sound').textContent = `Sound: ${muted ? 'off' : 'on'}`; $('sound').setAttribute('aria-pressed', String(muted)); renderer.domElement.focus(); });
  $('help').addEventListener('click', () => { speakerId = null; openShell('Make yourself at home', 'A LITTLE FIELD GUIDE'); $('speech').textContent = 'WASD or arrow keys to stroll. Click or tap the ground to walk there; tap a host to approach. Walk through the blue cabin door to enter. Near a host or framed exhibit, press E / Enter or tap the prompt. During a conversation, choose a question. Escape closes the box. Walk to the front-center garden mat to go outside.'; });
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); renderer.setAnimationLoop(null); $('loading').hidden = false; $('load-status').textContent = 'The graphics context was interrupted. Reload to return to the garden.'; });
}
function updateCamera(dt, instant = false) {
  const desired = new THREE.Vector3(player.position.x * .55, .8, room === 'inside' ? player.position.z * .35 - .55 : player.position.z * .48 - 1.8);
  if (instant || reducedMotion) cameraFocus.copy(desired); else cameraFocus.lerp(desired, 1 - Math.exp(-dt * 3.5));
  camera.position.copy(cameraFocus).add(cameraOffset); camera.lookAt(cameraFocus);
}
const movement = new THREE.Vector3(), forward = new THREE.Vector3(-cameraOffset.x, 0, -cameraOffset.z).normalize(), right = new THREE.Vector3(-forward.z, 0, forward.x);
function frame(now) {
  const dt = lastTime ? Math.min((now - lastTime) / 1000, .05) : .016; lastTime = now; time += dt;
  let moving = false;
  if (!opened && !transition) {
    movement.set(0, 0, 0);
    if (keys.has('w') || keys.has('arrowup')) movement.add(forward);
    if (keys.has('s') || keys.has('arrowdown')) movement.sub(forward);
    if (keys.has('d') || keys.has('arrowright')) movement.add(right);
    if (keys.has('a') || keys.has('arrowleft')) movement.sub(right);
    if (movement.lengthSq()) movement.normalize().multiplyScalar(3.3 * dt);
    else if (route.length) { movement.copy(route[0]).sub(player.position); movement.y = 0; const distance = movement.length(); if (distance < .08) route.shift(); else movement.normalize().multiplyScalar(Math.min(distance, 3.3 * dt)); }
    if (movement.lengthSq() > .000001) {
      const beforeX = player.position.x, beforeZ = player.position.z;
      if (walkable(player.position.x + movement.x, player.position.z)) player.position.x += movement.x;
      if (walkable(player.position.x, player.position.z + movement.z)) player.position.z += movement.z;
      moving = Math.abs(beforeX - player.position.x) + Math.abs(beforeZ - player.position.z) > .00001;
      if (moving) { const desired = Math.atan2(movement.x, movement.z); const delta = Math.atan2(Math.sin(desired - player.rotation.y), Math.cos(desired - player.rotation.y)); player.rotation.y += delta * Math.min(1, dt * 14); }
      else if (route.length) { route = []; pendingTarget = null; }
    }
    if (room === 'outside' && Math.abs(player.position.x) < .7 && player.position.z < .38 && player.position.z > -1.1) changeRoom();
    if (room === 'inside' && Math.abs(player.position.x) < 1.05 && player.position.z > 5.12) changeRoom();
    activeTarget = null;
    if (room === 'inside') { let nearest = Infinity; for (const target of targets) { const distance = Math.hypot(player.position.x - target.position.x, player.position.z - target.position.z); if (distance < target.radius && distance < nearest) { activeTarget = target; nearest = distance; } } }
    if (!activeTarget && Math.abs(player.position.x) < 1.5 && (room === 'outside' ? player.position.z < 2 && player.position.z > -.8 : player.position.z > 4.1)) activeTarget = { type: 'door', label: room === 'outside' ? 'Enter the studio' : 'Back to the garden' };
    $('interact').hidden = !activeTarget || transition;
    if (activeTarget) $('interact').querySelector('span').textContent = activeTarget.label;
    if (!route.length) { scene.userData.marker.visible = false; if (pendingTarget && activeTarget === pendingTarget) { pendingTarget = null; interact(); } }
  }
  player.userData.body.position.y = reducedMotion ? 0 : moving ? Math.abs(Math.sin(time * 11)) * .075 : Math.sin(time * 2.2) * .025;
  for (const [i, host] of Object.values(hosts).entries()) host.userData.body.position.y = reducedMotion ? 0 : Math.sin(time * 2.1 + i * 2) * .035;
  if (typing) {
    typeElapsed += dt;
    while (typeElapsed > .032 && typed < fullText.length) { typeElapsed -= .032; const char = fullText[typed++]; blip(char); }
    $('speech').textContent = fullText.slice(0, typed); if (typed >= fullText.length) finishLine();
  }
  updateCamera(dt); renderer.render(scene, camera);
}
init().catch(error => { console.error(error); clearTimeout(window.studioLoadTimeout); $('load-status').textContent = 'The studio could not open. Please enable WebGL and reload, or take the portfolio shortcut.'; });
