// 3D-модели животных и костюмов из простых фигур
const MATS = {};
const mat = c => MATS[c] || (MATS[c] = new THREE.MeshLambertMaterial({ color: c }));
const place = (m, x, y, z) => { m.position.set(x || 0, y || 0, z || 0); return m; };
const bx = (w, h, d, c, x, y, z) => place(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)), x, y, z);
const sp = (r, c, x, y, z, sx = 1, sy = 1, sz = 1) => {
  const m = place(new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat(c)), x, y, z); m.scale.set(sx, sy, sz); return m;
};
const cone = (r, h, c, x, y, z) => place(new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), mat(c)), x, y, z);
const cyl = (rt, rb, h, c, x, y, z) => place(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 14), mat(c)), x, y, z);

function addCostume(r, h, by, L, kind, col) {
  if (kind === 'cap') { h.add(cyl(.23, .25, .16, col, 0, .36, 0)); h.add(cyl(.3, .3, .03, col, 0, .29, -.12)); }
  if (kind === 'crown') {
    h.add(cyl(.22, .2, .14, col, 0, .37, 0));
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; h.add(cone(.05, .13, col, Math.cos(a) * .2, .5, Math.sin(a) * .2)); }
  }
  if (kind === 'cape') { r.add(bx(.76, .7, .05, col, 0, by, L / 2 + .03)); r.add(bx(.7, .05, L * .8, col, 0, by + .3, .05)); }
  if (kind === 'scarf') {
    const t = new THREE.Mesh(new THREE.TorusGeometry(.3, .07, 8, 16), mat(col)); t.rotation.x = 1.57; t.position.set(0, -.27, .05);
    h.add(t); h.add(bx(.12, .32, .05, col, .2, -.45, -.02));
  }
  if (kind === 'helmet') h.add(place(new THREE.Mesh(new THREE.SphereGeometry(.37, 14, 8, 0, 6.283, 0, 1.57), mat(col)), 0, .03, 0));
  if (kind === 'glasses') {
    [-1, 1].forEach(s => { const l = cyl(.09, .09, .03, col, s * .14, .1, -.32); l.rotation.x = 1.57; h.add(l); });
    h.add(bx(.1, .025, .025, col, 0, .1, -.32));
  }
}

function buildAnimal(a, cost) {
  const S2 = SHAPES[a.type], g = new THREE.Group(), r = new THREE.Group(); g.add(r);
  const L = S2.len, by = S2.leg + .32, ear = a.ear || a.body, face = a.mask || a.belly;
  r.add(bx(.62, .56, L, a.body, 0, by, 0));
  if (a.belly !== a.body) r.add(bx(.5, .18, L * .8, a.belly, 0, by - .2, 0));
  if (a.spots) for (let i = 0; i < 10; i++) r.add(sp(.1, 0x222222, i % 2 ? .3 : -.3, by + ((i * 7) % 3 - 1) * .13, ((i * .37) % 1 - .5) * L * .9, .4, 1, 1));
  const h = new THREE.Group(); h.position.set(0, by + .38, -L / 2 - .12); r.add(h);
  h.add(sp(.34, a.body));
  h.add(bx(.24, .18, S2.snout + .12, face, 0, -.08, -.3 - S2.snout / 2 + .05));
  h.add(bx(.1, .07, .07, 0x111111, 0, -.03, -.31 - S2.snout));
  if (a.fluff) h.add(sp(.24, a.body, 0, .3, .02));
  [-1, 1].forEach(s => {
    h.add(sp(a.eye ? .06 : .05, a.eye || 0x111111, s * .14, .1, -.29));
    if (S2.ear === 'point') h.add(cone(.11, .28, ear, s * .2, .34, 0));
    else if (S2.ear === 'big') h.add(cone(.14, .42, ear, s * .2, .38, 0));
    else { const e = bx(.09, .3, .17, ear, s * .3, .05, .02); e.rotation.z = s * .25; h.add(e); }
  });
  g.userData.legs = [];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const lg = new THREE.Group(); lg.position.set(sx * .2, S2.leg + .08, sz * (L / 2 - .14));
    lg.add(bx(.15, S2.leg + .1, .15, a.body, 0, -(S2.leg + .1) / 2, 0));
    lg.add(bx(.16, .06, .2, a.belly, 0, -(S2.leg + .1) + .02, -.02));
    r.add(lg); g.userData.legs.push(lg);
  });
  const t = new THREE.Group(); t.position.set(0, by + .15, L / 2); r.add(t); g.userData.tail = t;
  if (S2.tail === 'long') { const m = bx(.08, .7, .08, a.body, 0, .3, .12); m.rotation.x = -.3; t.add(m); }
  else if (S2.tail === 'stub') t.add(sp(.11, a.belly, 0, .05, .08));
  else if (S2.tail === 'curl') { const m = new THREE.Mesh(new THREE.TorusGeometry(.1, .04, 8, 12), mat(a.body)); m.position.set(0, .15, .08); m.rotation.y = 1.57; t.add(m); }
  else { const m = bx(.08, .45, .08, a.body, 0, .2, .1); m.rotation.x = .5; t.add(m); }
  if (a.fluff) t.add(sp(.17, a.body, 0, .3, .22));
  if (cost) addCostume(r, h, by, L, cost.kind, cost.color);
  g.userData.body = r;
  return g;
}
