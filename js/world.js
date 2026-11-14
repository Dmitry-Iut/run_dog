// 3D-мир: сцена, дорога, декорации, препятствия, фургон ловцов
const appEl = $('app');
const renderer = new THREE.WebGLRenderer({ canvas: $('game'), antialias: true });
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fdcf5);
scene.fog = new THREE.Fog(0x9fdcf5, 28, 100);
const camera = new THREE.PerspectiveCamera(75, 1, .1, 200);
scene.add(new THREE.HemisphereLight(0xffffff, 0x88aa77, .95));
const sun = new THREE.DirectionalLight(0xffffff, .7); sun.position.set(4, 10, 6); scene.add(sun);

function resize() {
  const W = appEl.clientWidth || innerWidth, H = appEl.clientHeight || innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.fov = W / H < 1 ? 75 : 60; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
if (window.ResizeObserver) new ResizeObserver(resize).observe(appEl);
resize();

const LW = 1.8;   // ширина дорожки
const roadTex = (() => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#6d6a73'; x.fillRect(0, 0, 128, 256);
  x.fillStyle = '#fff'; [43, 85].forEach(p => { x.fillRect(p - 2, 20, 4, 90); x.fillRect(p - 2, 148, 4, 90); });
  x.fillStyle = '#9a97a3'; x.fillRect(0, 0, 6, 256); x.fillRect(122, 0, 6, 256);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 22); return t;
})();
const road = new THREE.Mesh(new THREE.PlaneGeometry(LW * 3, 176), new THREE.MeshLambertMaterial({ map: roadTex }));
road.rotation.x = -Math.PI / 2; road.position.z = -80; scene.add(road);
const grassMat = new THREE.MeshLambertMaterial({ color: 0x86d36f });
[-1, 1].forEach(s => {
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(60, 176), grassMat);
  gr.rotation.x = -Math.PI / 2; gr.position.set(s * (2.7 + 30), -.02, -80); scene.add(gr);
});

// Карты: меняются при каждом забеге
const SC = { maj: [0, 2, 4, 7, 9], min: [0, 3, 5, 7, 10], dor: [0, 2, 3, 7, 10] };
const THEMES = [
  { name: 'Парк',  sky: 0x9fdcf5, grass: 0x86d36f, road: 0xffffff, decor: ['tree', 'house', 'post'],  tempo: 132, root: 60, scale: SC.maj },
  { name: 'Пляж',  sky: 0x8fe3f0, grass: 0xf3dc9a, road: 0xfff1dd, decor: ['palm', 'hut', 'post'],    tempo: 112, root: 62, scale: SC.maj },
  { name: 'Зима',  sky: 0xdfeaf5, grass: 0xf4f8fc, road: 0xd8dde6, decor: ['snowtree', 'house', 'post'], tempo: 100, root: 57, scale: SC.min },
  { name: 'Город', sky: 0xb9c3d6, grass: 0x8f98a6, road: 0xe4e4e4, decor: ['tower', 'tower', 'post'], tempo: 140, root: 55, scale: SC.min },
  { name: 'Закат', sky: 0xff9a6b, grass: 0x6f9e5a, road: 0xffd9c0, decor: ['tree', 'house', 'post'],  tempo: 120, root: 59, scale: SC.dor }
];
let curTheme = null;
const side = [];
function makeDecor(i, t) {
  const g = new THREE.Group(), k = t.decor[i % 3];
  if (k === 'tree') { g.add(cyl(.15, .2, 1.2, 0x8a5a3a, 0, .6, 0)); g.add(cone(.9, 2.2, t.name === 'Закат' ? 0x3d7a44 : 0x2fa84f, 0, 2.1, 0)); }
  else if (k === 'snowtree') { g.add(cyl(.15, .2, 1.2, 0x6b4a33, 0, .6, 0)); g.add(cone(.95, 2.2, 0xe3f0f8, 0, 2.1, 0)); g.add(cone(.6, 1.3, 0xc4d9e8, 0, 3, 0)); }
  else if (k === 'palm') {
    g.add(cyl(.12, .18, 2.4, 0x9a6a3f, 0, 1.2, 0));
    for (let j = 0; j < 5; j++) { const l = bx(1.5, .06, .4, 0x2fb04f, Math.cos(j * 1.26) * .6, 2.5, Math.sin(j * 1.26) * .6); l.rotation.y = -j * 1.26; l.rotation.z = .25; g.add(l); }
  }
  else if (k === 'house') { g.add(bx(2.2, 1.6, 2, pick([0xf4c58a, 0xd9e4f0, 0xf0a8a0]), 0, .8, 0)); const r = cone(1.6, 1, 0xb5483b, 0, 2.05, 0); r.rotation.y = .78; g.add(r); }
  else if (k === 'hut') { g.add(bx(1.8, 1.2, 1.8, 0xd9a066, 0, .6, 0)); const r = cone(1.5, .9, 0xc7a14a, 0, 1.65, 0); r.rotation.y = .78; g.add(r); }
  else if (k === 'tower') {
    const h = 4 + Math.random() * 5; g.add(bx(2.2, h, 2.2, pick([0x7a8aa6, 0x93a0b5, 0x6a7690]), 0, h / 2, 0));
    for (let y = 1; y < h - .5; y += 1.2) g.add(bx(2.24, .35, 2.24, 0xcfeaff, 0, y, 0));
  }
  else g.add(bx(.2, 1, .2, 0xb08a5a, 0, .5, 0));
  g.userData.s = i % 2 ? 1 : -1; g.userData.post = k === 'post'; return g;
}
function applyTheme(t) {
  curTheme = t;
  scene.background.setHex(t.sky); scene.fog.color.setHex(t.sky);
  grassMat.color.setHex(t.grass); road.material.color.setHex(t.road);
  side.forEach(g => scene.remove(g)); side.length = 0;
  for (let i = 0; i < 48; i++) {
    const g = makeDecor(i, t);
    g.position.set(g.userData.s * (g.userData.post ? 2.95 : 4.6 + (i % 5) * .7), 0, -(i * 3.6));
    scene.add(g); side.push(g);
  }
}
applyTheme(THEMES[0]);

// Фургон ловцов
const van = new THREE.Group();
van.add(bx(1.9, 1.2, 2.6, 0xf2f2f2, 0, .9, 0)); van.add(bx(1.9, .9, 1, 0xe8483f, 0, .75, -1.5));
van.add(bx(1.92, .25, 2.62, 0x3a7bd5, 0, .8, 0)); van.add(bx(.4, .2, .4, 0xffd23f, 0, 1.6, 0));
van.add(bx(1.2, .5, .05, 0xbfe6ff, 0, 1.1, -2.01));
van.position.set(0, 0, 14); scene.add(van);

// Объекты на дороге
const coinGeo = new THREE.CylinderGeometry(.3, .3, .08, 16), coinMat = new THREE.MeshLambertMaterial({ color: 0xffc82e, emissive: 0x553d00 });
function makeObject(t, boost) {
  const g = new THREE.Group();
  if (t === 'coin') { const c = new THREE.Mesh(coinGeo, coinMat); c.rotation.x = 1.57; c.position.y = .8; g.add(c); }
  else if (t === 'boost') {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(.4), new THREE.MeshLambertMaterial({ color: boost.color, emissive: boost.color, emissiveIntensity: .35 }));
    m.position.y = 1; g.add(m);
  } else if (t === 'cage') {
    g.add(bx(1.5, 1.6, 1.4, 0x8d99a6, 0, .8, 0));
    for (let i = 0; i < 5; i++) g.add(bx(.06, 1.5, .06, 0xdfe6ee, -.6 + i * .3, .8, .72));
    g.add(bx(1.5, .2, 1.4, 0xff8a1f, 0, 1.7, 0));
  } else if (t === 'fence') {
    for (let i = 0; i < 4; i++) g.add(bx(.4, .6, .25, i % 2 ? 0xffffff : 0xe8483f, -.6 + i * .4, .55, 0));
    g.add(bx(.1, .55, .1, 0x555b66, -.7, .28, 0)); g.add(bx(.1, .55, .1, 0x555b66, .7, .28, 0));
  } else {   // bar: нужно проскользнуть снизу
    g.add(bx(.12, 1.9, .12, 0x555b66, -.85, .95, 0)); g.add(bx(.12, 1.9, .12, 0x555b66, .85, .95, 0));
    g.add(bx(1.8, .35, .25, 0xffd23f, 0, 1.55, 0));
    for (let i = 0; i < 4; i++) g.add(bx(.2, .35, .27, 0x222222, -.65 + i * .43, 1.55, 0));
  }
  return g;
}

function scrollWorld(ds) {
  roadTex.offset.y += ds / 8;
  side.forEach(g => { g.position.z += ds; if (g.position.z > 8) g.position.z -= 48 * 3.6; });
}
