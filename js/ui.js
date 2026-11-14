// Интерфейс: меню, магазин, задания, подсказки
const ui = { tab: 'animals', idx: 0, chosen: {} };
let toastT = 0;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800);
}

function show(name) {
  ['menu', 'shop', 'missions', 'pause', 'over'].forEach(s => $(s).classList.toggle('hidden', s !== name));
  G.mode = name === 'shop' ? 'shop' : name === 'pause' ? 'pause' : name === 'over' ? 'over' : name ? 'menu' : 'play';
  $('hud').classList.toggle('hidden', G.mode !== 'play' && G.mode !== 'pause');
  if (name === 'menu') renderMenu();
  if (name === 'shop') { ui.idx = S.sel; renderShop(); }
  if (name === 'missions') renderMissions();
  if (name === 'pause') { $('pauseMissions').innerHTML = missionCards(); muteLabels(); }
  setHero(G.mode === 'shop' ? ui.idx : S.sel);
}

function muteLabels() { document.querySelectorAll('[data-mute]').forEach(b => b.textContent = S.mute ? '🔇' : '🔊'); }
function renderMenu() {
  muteLabels();
  $('mName').textContent = ANIMALS[S.sel].name;
  document.querySelectorAll('.cc').forEach(e => e.textContent = S.coins);
  $('startBoosts').innerHTML = BOOSTS.map(b =>
    `<button class="bchip ${ui.chosen[b.id] ? 'on' : ''}" data-chip="${b.id}">${b.ico}<small>${S.boosts[b.id]}</small></button>`).join('');
}

function missionCards() {
  return S.missions.map(m => {
    const t = MTPL.find(x => x.k === m.k), p = Math.min(m.g, Math.floor(m.p));
    return `<div class="card"><div class="ico">🎯</div><div class="grow">${t.t(m.g)}
      <div class="bar"><i style="width:${p / m.g * 100}%"></i></div><small>${p} / ${m.g}</small></div><b>+${m.r} 🪙</b></div>`;
  }).join('');
}
function renderMissions() {
  $('missions').innerHTML = `<div class="top"><button class="round" data-go="menu">←</button><h2>Задания</h2><div class="chip">${S.coins} 🪙</div></div>
    <div class="list">${missionCards()}</div><div class="spacer"></div>`;
}

function renderShop() {
  const a = ANIMALS[ui.idx], own = S.owned[a.id], cs = costumesOf(ui.idx), w = S.wear[a.id] ?? -1;
  let h = `<div class="top"><button class="round" data-go="menu">←</button>
    <div class="tabs"><button class="${ui.tab === 'animals' ? 'on' : ''}" data-tab="animals">Питомцы</button>
    <button class="${ui.tab === 'boosts' ? 'on' : ''}" data-tab="boosts">Бусты</button></div><div class="chip">${S.coins} 🪙</div></div>`;
  if (ui.tab === 'animals') {
    h += `<div class="navs"><button class="arrow" data-nav="-1">‹</button><button class="arrow" data-nav="1">›</button></div>
    <div class="panel"><h3>${a.name}</h3><p>${a.desc}</p>
    <div class="costs">${cs.map((c, j) => {
      const has = (S.cos[a.id] || [])[j], on = w === j;
      return `<button class="cos ${on ? 'on' : ''}" data-cos="${j}"><i style="background:#${c.color.toString(16).padStart(6, '0')}"></i>${c.name}
        <small>${has ? (on ? 'Надето' : 'Надеть') : c.price + ' 🪙'}</small></button>`;
    }).join('')}</div>
    <button class="play ${own && S.sel === ui.idx ? 'dis' : ''}" data-act="main">${own ? (S.sel === ui.idx ? 'Выбран' : 'Выбрать') : 'Купить · ' + a.price + ' 🪙'}</button>
    <div class="dots">${ANIMALS.map((_, i) => `<i class="${i === ui.idx ? 'on' : ''}"></i>`).join('')}</div></div>`;
  } else {
    h += `<div class="list">${BOOSTS.map(b => `<div class="card"><div class="ico">${b.ico}</div>
      <div class="grow">${b.name}<small>${b.desc} · есть: ${S.boosts[b.id]}</small></div>
      <button class="buy" data-bbuy="${b.id}">${b.price} 🪙</button></div>`).join('')}</div>
      <p class="nameplate">Купленные бусты включаются в меню перед забегом</p><div class="spacer"></div>`;
  }
  $('shop').innerHTML = h;
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-go],[data-nav],[data-tab],[data-cos],[data-act],[data-bbuy],[data-chip],[data-mute]');
  Music.init(); if (Music.ctx) Music.ctx.resume();
  if (!t) return;
  const d = t.dataset, a = ANIMALS[ui.idx];
  if (d.mute) { Music.toggle(); muteLabels(); }
  else if (d.go) show(d.go);
  else if (d.tab) { ui.tab = d.tab; renderShop(); }
  else if (d.nav) { ui.idx = (ui.idx + Number(d.nav) + ANIMALS.length) % ANIMALS.length; setHero(ui.idx); renderShop(); }
  else if (d.chip) {
    if (S.boosts[d.chip] > 0) { ui.chosen[d.chip] = !ui.chosen[d.chip]; renderMenu(); }
    else toast('Купи буст в магазине');
  } else if (d.bbuy) {
    const b = BOOSTS.find(x => x.id === d.bbuy);
    if (S.coins >= b.price) { S.coins -= b.price; S.boosts[b.id]++; save(); renderShop(); } else toast('Не хватает монет');
  } else if (d.act) {
    if (!S.owned[a.id]) {
      if (S.coins >= a.price) { S.coins -= a.price; S.owned[a.id] = 1; S.sel = ui.idx; save(); toast(`${a.name} теперь с тобой!`); } else toast('Не хватает монет');
    } else { S.sel = ui.idx; save(); }
    renderShop(); setHero(ui.idx);
  } else if (d.cos) {
    const j = Number(d.cos), c = costumesOf(ui.idx)[j];
    if (!S.owned[a.id]) return toast('Сначала купи питомца');
    S.cos[a.id] = S.cos[a.id] || [0, 0, 0];
    if (S.cos[a.id][j]) S.wear[a.id] = S.wear[a.id] === j ? -1 : j;
    else if (S.coins >= c.price) { S.coins -= c.price; S.cos[a.id][j] = 1; S.wear[a.id] = j; }
    else return toast('Не хватает монет');
    save(); renderShop(); setHero(ui.idx);
  }
});
