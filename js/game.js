// Игровой цикл: управление, забег, столкновения, камера
const G = { mode: 'menu', speed: 0, dist: 0, score: 0, coins: 0, objs: [], next: 0, chase: 0, shake: 0, t: 0,
  boost: { magnet: 0, shield: 0, x2: 0, dash: 0 }, p: { lane: 1, x: 0, y: 0, vy: 0, slide: 0, step: 0 } };
let hero = null, vanZ = 14;
const CAM = { menu: [[0, 1.9, 5.4], [0, .7, 0]], shop: [[0, 1.9, 5.4], [0, -.15, 0]], run: [[0, 4.6, 7.6], [0, .8, -6]] };
const look = new THREE.Vector3(0, .7, 0);

function setHero(i) {
  if (hero) scene.remove(hero);
  const a = ANIMALS[i], w = S.owned[a.id] ? (S.wear[a.id] ?? -1) : -1;
  hero = buildAnimal(a, w >= 0 ? costumesOf(i)[w] : null);
  hero.scale.setScalar(G.mode === 'play' || G.mode === 'pause' ? 1.1 : 1.6);
  hero.rotation.y = G.mode === 'play' || G.mode === 'pause' ? 0 : Math.PI;
  scene.add(hero);
}
function clearObjs() { G.objs.forEach(o => scene.remove(o.m)); G.objs = []; }

function add(t, lane, z, boost) {
  const m = makeObject(t, boost); m.position.set(lane * LW, 0, z); scene.add(m); G.objs.push({ t, m, boost });
}
function spawnRow() {
  const z = -95, L = [-1, 0, 1], free = pick(L);
  if (Math.random() < .3) { const l = pick(L); for (let i = 0; i < 7; i++) add('coin', l, z - i * 1.6); }
  else L.forEach(l => {
    if (l !== free) add(pick(['cage', 'cage', 'fence', 'bar']), l, z);
    else if (Math.random() < .7) for (let i = 0; i < 4; i++) add('coin', l, z - i * 1.6);
  });
  if (Math.random() < .14) add('boost', free, z - 9, pick(BOOSTS));
  G.next = rand(14, 20);
}

function startRun() {
  clearObjs();
  const th = pick(THEMES.filter(x => x !== curTheme)); applyTheme(th); Music.start(th); toast('Карта: ' + th.name);
  Object.assign(G, { dist: 0, score: 0, coins: 0, next: 12, chase: 0, shake: 0 });
  Object.assign(G.p, { lane: 1, x: 0, y: 0, vy: 0, slide: 0 });
  BOOSTS.forEach(b => { G.boost[b.id] = 0; if (ui.chosen[b.id] && S.boosts[b.id] > 0) { S.boosts[b.id]--; G.boost[b.id] = b.id === 'shield' ? 1 : b.dur; } });
  ui.chosen = {}; save();
  show(null); setHero(S.sel);
}
function gameOver() {
  Music.stop(); Music.sfx('over');
  prog('score', G.score, true);
  S.best = Math.max(S.best, Math.floor(G.score)); save();
  $('oScore').textContent = Math.floor(G.score); $('oCoins').textContent = G.coins; $('oBest').textContent = S.best;
  show('over');
}

function onMove(dir) {
  const P = G.p;
  if (dir === 'pause') {
    if (G.mode === 'play') { save(); show('pause'); Music.pause(); } else if (G.mode === 'pause') { show(null); Music.resume(); }
    return;
  }
  if (G.mode !== 'play') return;
  if (dir === 'left') P.lane = Math.max(0, P.lane - 1);
  if (dir === 'right') P.lane = Math.min(2, P.lane + 1);
  if (dir === 'up' && P.y === 0) { P.vy = 11; P.slide = 0; prog('jump', 1); }
  if (dir === 'down') { if (P.y > 0) P.vy = -14; else { P.slide = .7; prog('slide', 1); } }
}
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  const m = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'up', w: 'up', ' ': 'up', arrowdown: 'down', s: 'down', p: 'pause', escape: 'pause' }[k];
  if (m) onMove(m);
});
let tp = null;
appEl.addEventListener('touchstart', e => { tp = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }; }, { passive: true });
appEl.addEventListener('touchmove', e => {
  if (!tp) return;
  const dx = e.changedTouches[0].clientX - tp.x, dy = e.changedTouches[0].clientY - tp.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;
  onMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy < 0 ? 'up' : 'down')); tp = null;
}, { passive: true });
appEl.addEventListener('touchend', () => { tp = null; });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); if (G.mode === 'play') onMove('pause'); } });

function hit(o) {
  const B = G.boost;
  scene.remove(o.m); o.dead = true;
  if (B.dash > 0) return;
  Music.sfx('hit');
  if (B.shield) { B.shield = 0; toast('Щит спас тебя!'); return; }
  if (G.chase > 0) return gameOver();
  G.chase = 8; G.shake = .5; toast('Ловцы совсем рядом!');
}

function update(dt) {
  const P = G.p, B = G.boost, dash = B.dash > 0;
  G.speed = (12 + Math.min(9, G.dist / 180)) * (dash ? 1.7 : 1);
  const ds = G.speed * dt; G.dist += ds; G.score += ds * (B.x2 > 0 ? 2 : 1); prog('dist', ds);
  ['magnet', 'x2', 'dash'].forEach(k => B[k] = Math.max(0, B[k] - dt));
  G.chase = Math.max(0, G.chase - dt); G.shake = Math.max(0, G.shake - dt);
  P.x += (P.lane - 1 - P.x) * Math.min(1, dt * 13);
  if (P.y > 0 || P.vy > 0) { P.vy -= 32 * dt; P.y += P.vy * dt; if (P.y <= 0) { P.y = 0; P.vy = 0; } }
  P.slide = Math.max(0, P.slide - dt); P.step += dt * G.speed * .9;
  G.next -= ds; if (G.next <= 0) spawnRow();
  scrollWorld(ds);
  const px = P.x * LW;
  for (const o of G.objs) {
    const p = o.m.position; p.z += ds;
    if (o.t === 'coin' || o.t === 'boost') o.m.rotation.y += dt * 4;
    if (o.t === 'coin' && B.magnet > 0 && p.z > -10 && Math.abs(p.x - px) < 3.6) { p.x += (px - p.x) * dt * 9; p.z += (0 - p.z) * dt * 3; }
    if (p.z < -.8 || p.z > .8 || o.dead) continue;
    const dx = Math.abs(p.x - px);
    if (o.t === 'coin') { if (dx < 1) { o.dead = true; scene.remove(o.m); const n = B.x2 > 0 ? 2 : 1; Music.sfx('coin'); G.coins += n; S.coins += n; G.score += 10 * n; prog('coins', n); } }
    else if (o.t === 'boost') {
      if (dx < 1) { o.dead = true; scene.remove(o.m); Music.sfx('boost'); const b = o.boost; B[b.id] = b.id === 'shield' ? 1 : b.dur; toast(`${b.ico} ${b.name}!`); prog('pick', 1); }
    } else if (dx < .95) {
      if (o.t === 'cage' || (o.t === 'fence' && P.y < .75) || (o.t === 'bar' && P.slide <= 0)) hit(o);
    }
  }
  G.objs = G.objs.filter(o => { if (o.dead) return false; if (o.m.position.z > 8) { scene.remove(o.m); return false; } return true; });
}

let hudKey = '', last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; G.t += dt;
  const run = G.mode === 'play' || G.mode === 'pause';
  if (G.mode === 'play') update(dt); else if (!run) scrollWorld(dt * 3);
  const P = G.p;
  if (hero) {
    const ud = hero.userData;
    if (run) {
      hero.position.set(P.x * LW, P.y, 0); hero.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), .2);
      const sl = P.slide > 0; hero.scale.y = sl ? .55 : 1.1;
      ud.legs.forEach((l, i) => l.rotation.x = P.y > 0 ? .6 * (i % 2 ? -1 : 1) : Math.sin(P.step * 1.6 + (i % 2) * 3.14) * .9);
      ud.body.position.y = P.y > 0 || sl ? 0 : Math.abs(Math.sin(P.step * 1.6)) * .06;
    } else {
      hero.position.set(0, Math.sin(G.t * 3) * .03, 0);
      hero.scale.lerp(new THREE.Vector3(1.6, 1.6, 1.6), .2);
      hero.rotation.y = Math.PI + (G.mode === 'shop' ? G.t * .9 : Math.sin(G.t * .8) * .5);
      ud.legs.forEach(l => l.rotation.x = 0);
    }
    ud.tail.rotation.z = Math.sin(G.t * (run ? 14 : 8)) * .4;
    if (run) hero.rotation.y = 0;
  }
  vanZ += ((G.chase > 0 && G.mode === 'play' ? 3.6 : 14) - vanZ) * Math.min(1, dt * 3);
  van.position.set(P.x * LW * .6, 0, vanZ);
  const c = CAM[run ? 'run' : G.mode === 'shop' ? 'shop' : 'menu'];
  camera.position.lerp(new THREE.Vector3(...c[0]), .08); look.lerp(new THREE.Vector3(...c[1]), .08);
  camera.position.x += (Math.random() - .5) * G.shake * .3;
  camera.lookAt(look);
  if (run) {
    const k = `${G.coins}|${Math.floor(G.score)}|${Object.values(G.boost).map(v => Math.ceil(v)).join()}`;
    if (k !== hudKey) {
      hudKey = k; $('hCoins').textContent = S.coins; $('hScore').textContent = Math.floor(G.score);
      $('hBoosts').innerHTML = BOOSTS.filter(b => G.boost[b.id] > 0).map(b => `<div class="hb">${b.ico} ${b.id === 'shield' ? '' : Math.ceil(G.boost[b.id])}</div>`).join('');
    }
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

$('playBtn').onclick = startRun; $('againBtn').onclick = startRun;
$('pauseBtn').onclick = () => onMove('pause'); $('resumeBtn').onclick = () => onMove('pause');
$('pauseMenuBtn').onclick = () => { Music.stop(); clearObjs(); G.chase = 0; show('menu'); };
document.addEventListener('click', e => { if (e.target.closest('[data-go="menu"]')) clearObjs(); });
show('menu');
requestAnimationFrame(frame);
