// Данные: животные, костюмы, бусты, задания, сохранение
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

const SHAPES = {
  cat:   { len: 1.0,  leg: .30, ear: 'point', snout: .08, tail: 'long' },
  corgi: { len: 1.15, leg: .18, ear: 'big',   snout: .20, tail: 'stub' },
  pug:   { len: .9,   leg: .25, ear: 'flop',  snout: .05, tail: 'curl' },
  dog:   { len: 1.2,  leg: .42, ear: 'flop',  snout: .28, tail: 'up' },
  dachs: { len: 1.9,  leg: .18, ear: 'flop',  snout: .30, tail: 'up' }
};

const ANIMALS = [
  { id: 'ryzhik', name: 'Рыжик',    type: 'cat',   body: 0xf08a24, belly: 0xffe2b8, price: 0,   desc: 'Ловкий рыжий кот. Знает все дыры в заборе.' },
  { id: 'korzhik',name: 'Коржик',   type: 'corgi', body: 0xe3943a, belly: 0xffffff, price: 150, desc: 'Корги с короткими лапами и огромным сердцем.' },
  { id: 'sonya',  name: 'Луна',     type: 'pug',   body: 0x1d1d24, belly: 0x1d1d24, mask: 0x15151a, ear: 0x15151a, eye: 0xf2c94c, price: 200, desc: 'Чёрный мопс. Ночью её никто не замечает.' },
  { id: 'husky',  name: 'Север',    type: 'dog',   body: 0x7d8da0, belly: 0xffffff, price: 300, desc: 'Хаски, которому тесно в любой клетке.' },
  { id: 'taksa',  name: 'Батон',    type: 'dachs', body: 0x7a4426, belly: 0x9a6038, price: 350, desc: 'Такса. Длинная, упрямая и очень быстрая.' },
  { id: 'lab',    name: 'Лаки',     type: 'dog',   body: 0xe9c46a, belly: 0xf3dc9a, price: 400, desc: 'Лабрадор. Дружит со всеми, даже с ловцами.' },
  { id: 'siam',   name: 'Сиама',    type: 'cat',   body: 0xf3e5cf, belly: 0xf3e5cf, mask: 0x4a3a30, ear: 0x4a3a30, price: 450, desc: 'Сиамская кошка с гордым характером.' },
  { id: 'shadow', name: 'Тень',     type: 'cat',   body: 0x2a2a33, belly: 0x2a2a33, price: 500, desc: 'Чёрный кот. Ловцы замечают его последним.' },
  { id: 'poodle', name: 'Пломбир',  type: 'dog',   body: 0xf4f0ff, belly: 0xf4f0ff, fluff: true, price: 650, desc: 'Пудель-красавчик. Бежит и не портит причёску.' },
  { id: 'dalm',   name: 'Пятнаш',   type: 'dog',   body: 0xffffff, belly: 0xffffff, spots: true, price: 800, desc: 'Далматинец. Самый быстрый в питомнике.' }
];

const KINDS = [['cap','Кепка'],['crown','Корона'],['cape','Плащ'],['scarf','Шарф'],['helmet','Шлем'],['glasses','Очки']];
const GEMS = [[0xe63946,'Рубин'],[0x2ecc71,'Изумруд'],[0x3a7bd5,'Сапфир'],[0xf4a300,'Янтарь'],
              [0x9b59b6,'Аметист'],[0x1abc9c,'Бирюза'],[0xffd23f,'Золото'],[0xff6f91,'Коралл']];
function costumesOf(i) {   // у каждого животного 3 своих костюма
  return [0, 1, 2].map(j => {
    const k = KINDS[(i + j * 2) % 6], g = GEMS[(i * 3 + j * 5) % 8];
    return { kind: k[0], name: `${k[1]} «${g[1]}»`, color: g[0], price: 50 * (j + 1) };
  });
}

const BOOSTS = [
  { id: 'magnet', name: 'Магнит',        ico: '🧲', dur: 9,  price: 40, color: 0xe63946, desc: 'Притягивает монеты' },
  { id: 'shield', name: 'Щит',           ico: '🛡️', dur: 0,  price: 50, color: 0x3a7bd5, desc: 'Спасает от одной поимки' },
  { id: 'x2',     name: 'Двойной приз',  ico: '✨', dur: 12, price: 60, color: 0xffd23f, desc: 'Очки и монеты ×2' },
  { id: 'dash',   name: 'Рывок',         ico: '⚡', dur: 4,  price: 70, color: 0x2ecc71, desc: 'Быстрый бег, ломает преграды' }
];

const MTPL = [
  { k: 'coins', t: n => `Собери ${n} монет`,           g: [30, 60, 100, 150] },
  { k: 'jump',  t: n => `Прыгни ${n} раз`,             g: [10, 20, 40, 60] },
  { k: 'slide', t: n => `Проскользни ${n} раз`,        g: [8, 15, 30, 45] },
  { k: 'dist',  t: n => `Пробеги ${n} м`,              g: [500, 1000, 2000, 3500] },
  { k: 'pick',  t: n => `Подбери ${n} бустов`,         g: [2, 4, 6, 8] },
  { k: 'score', t: n => `Набери ${n} очков за забег`,  g: [1000, 2500, 4500, 7000] }
];

const KEY = 'pobeg_v1';
const store = { get: () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
                set: v => { try { localStorage.setItem(KEY, v); } catch (e) {} } };
const S = Object.assign({ coins: 0, owned: { ryzhik: 1 }, cos: {}, wear: {}, sel: 0, best: 0, mdone: 0, missions: null,
  boosts: { magnet: 0, shield: 0, x2: 0, dash: 0 } }, (() => { try { return JSON.parse(store.get() || '{}'); } catch (e) { return {}; } })());
const save = () => store.set(JSON.stringify(S));

function newMission() {
  const used = (S.missions || []).map(m => m.k);
  const t = pick(MTPL.filter(x => !used.includes(x.k)));
  const idx = Math.min(t.g.length - 1, Math.floor(Math.random() * 2) + Math.floor(S.mdone / 4));
  return { k: t.k, g: t.g[idx], p: 0, r: 30 * (idx + 1) + 20 };
}
if (!S.missions) { S.missions = []; for (let i = 0; i < 3; i++) S.missions.push(newMission()); }

function prog(k, n, abs) {   // прогресс заданий
  S.missions.forEach((m, i) => {
    if (m.k !== k) return;
    m.p = abs ? Math.max(m.p, n) : m.p + n;
    if (m.p >= m.g) {
      S.coins += m.r; S.mdone++;
      toast(`Задание выполнено! +${m.r} 🪙`);
      S.missions[i] = newMission(); save();
    }
  });
}
