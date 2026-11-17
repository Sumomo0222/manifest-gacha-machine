"use strict";

/* ============================================================
   显化扭蛋机 · Manifestation Gacha
   状态机:idle → coined → spinning → dropped → opened
   ============================================================ */

/* ---------- 祝福数据 ---------- */
const TYPES = {
  inspiration: { label: "灵感胶囊", c1: "#53d8ff", c2: "#bdf0ff" },
  courage:     { label: "勇气胶囊", c1: "#ff6b7a", c2: "#ffc2ca" },
  luck:        { label: "好运胶囊", c1: "#ffd166", c2: "#fff0c2" },
  energy:      { label: "能量胶囊", c1: "#ffa94d", c2: "#ffe0b8" },
  wish:        { label: "心愿胶囊", c1: "#c77dff", c2: "#ecd2ff" },
  joy:         { label: "快乐胶囊", c1: "#ff8fb1", c2: "#ffd3e0" },
};

const BLESSINGS = [
  { id: "b01", type: "inspiration", name: "灵感爆发", desc: "今天适合开始一个新想法。", quote: "把脑子里闪光的那件事,今天就写下第一行。" },
  { id: "b02", type: "inspiration", name: "灵感显影", desc: "一个模糊的念头正在慢慢变清晰。", quote: "别急,轮廓正在显影,再给它一点时间。" },
  { id: "b03", type: "inspiration", name: "创意补给", desc: "换个角度,旧问题会有新答案。", quote: "绕个路走走,答案可能就在另一条街上。" },
  { id: "b04", type: "courage", name: "勇气到账", desc: "适合迈出一个小但关键的行动。", quote: "先迈出小小一步,风会替你把门推开。" },
  { id: "b05", type: "courage", name: "心跳加速", desc: "那件让你有点紧张的事,值得试一次。", quote: "紧张说明你在乎,试过就不亏。" },
  { id: "b06", type: "courage", name: "表达时刻", desc: "今天适合把心里话说出来。", quote: "你的声音,比你想象的更值得被听见。" },
  { id: "b07", type: "luck", name: "好运显影", desc: "你会更容易看见身边的机会。", quote: "机会藏在日常的缝隙里,今天它们格外显眼。" },
  { id: "b08", type: "luck", name: "贵人靠近", desc: "留意那个愿意帮你的人。", quote: "有人正准备向你伸手,记得也挥挥手。" },
  { id: "b09", type: "luck", name: "惊喜盲盒", desc: "今天可能遇到计划外的小美好。", quote: "给意外留个位置,它会带着礼物来。" },
  { id: "b10", type: "energy", name: "能量回血", desc: "给自己一点休息和补给。", quote: "电量低不是你的错,充会儿电再出发。" },
  { id: "b11", type: "energy", name: "状态回温", desc: "身体和心情都在慢慢回暖。", quote: "像热牛奶一样,慢慢暖起来就好。" },
  { id: "b12", type: "energy", name: "轻装上阵", desc: "放下一点多余的负担,走得更快。", quote: "背包里不需要的东西,今天可以放下一些。" },
  { id: "b13", type: "wish", name: "心愿发芽", desc: "一个长期愿望正在积累势能。", quote: "种子在土里没动静,不代表它没在生长。" },
  { id: "b14", type: "wish", name: "显化加速", desc: "你近期的专注正在悄悄成形。", quote: "你认真许过愿的事,正在赶来的路上。" },
  { id: "b15", type: "wish", name: "时机将至", desc: "保持留意,合适的窗口快出现了。", quote: "门快开了,记得站在门口。" },
  { id: "b16", type: "joy", name: "快乐补给", desc: "今天适合做一件让自己开心的小事。", quote: "奶茶、散步、一首歌,快乐可以很小但很真。" },
  { id: "b17", type: "joy", name: "笑点爆棚", desc: "今天的笑点会特别低,请珍惜。", quote: "笑出声的那一刻,星星都在替你鼓掌。" },
  { id: "b18", type: "joy", name: "温柔时刻", desc: "会有人或某件小事温柔地接住你。", quote: "世界今天对你格外温柔,记得收下。" },
];

const MSG = {
  idle: "投入心愿币,开始今天的显化",
  coined: "已投币 ✦ 转动旋钮吧",
  spinning: "扭转中 · 好运搅拌中…",
  dropped: "胶囊已送达 · 点它打开",
  opened: "祝福已显化 ✦ 收好啦",
};

const SPIN_MS = 1300;      // 旋钮旋转时长
const DROP_SETTLE_MS = 850; // 胶囊掉落到停稳
const OPEN_CARD_MS = 430;   // 打开胶囊到弹出卡片

/* ---------- 安全的 localStorage ---------- */
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 忽略 */ }
  },
};

/* ---------- Web Audio 合成音效 ---------- */
const AudioFX = (() => {
  let ctx = null;
  let enabled = store.get("gacha-sound", true);

  function ac() {
    if (!enabled) return null;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      if (!ctx) ctx = new Ctx();
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }

  function tone(freq, { dur = 0.15, type = "sine", gain = 0.12, when = 0, slide = 0 } = {}) {
    const c = ac();
    if (!c) return;
    try {
      const t0 = c.currentTime + when;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(c.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    } catch { /* 忽略 */ }
  }

  return {
    coin() {
      tone(1240, { dur: 0.09, type: "square", gain: 0.07 });
      tone(1860, { dur: 0.16, type: "square", gain: 0.06, when: 0.09 });
    },
    ratchet() {
      for (let i = 0; i < 9; i++) tone(210 + i * 14, { dur: 0.05, type: "square", gain: 0.045, when: i * 0.14 });
    },
    drop() {
      tone(320, { dur: 0.18, type: "sine", gain: 0.13, slide: -180 });
      tone(150, { dur: 0.22, type: "triangle", gain: 0.15, when: 0.02 });
    },
    open() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, { dur: 0.28, type: "triangle", gain: 0.09, when: i * 0.09 }));
    },
    copy() {
      tone(880, { dur: 0.08, type: "sine", gain: 0.08 });
      tone(1174, { dur: 0.12, type: "sine", gain: 0.08, when: 0.08 });
    },
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      store.set("gacha-sound", enabled);
      return enabled;
    },
  };
})();

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
const starsWrap = $("stars");
const sparklesWrap = $("sparkles");
const domeCaps = $("domeCaps");
const machine = $("machine");
const dome = $("dome");
const screenText = $("screenText");
const coin = $("coin");
const knob = $("knob");
const outlet = $("outlet");
const dropped = $("droppedCapsule");
const tapHint = $("tapHint");
const legendEl = $("legend");
const collectCount = $("collectCount");
const collectTotal = $("collectTotal");
const btnCoin = $("btnCoin");
const btnTurn = $("btnTurn");
const overlay = $("overlay");
const card = $("card");
const cardBadge = $("cardBadge");
const cardName = $("cardName");
const cardDesc = $("cardDesc");
const cardQuote = $("cardQuote");
const btnCopy = $("btnCopy");
const btnAgain = $("btnAgain");
const cardClose = $("cardClose");
const toast = $("toast");
const btnSound = $("btnSound");

/* ---------- 状态 ---------- */
const state = { phase: "idle", current: null, spinTimer: null, settleTimer: null, cardTimer: null };
const collected = new Set(Array.isArray(store.get("gacha-collected", [])) ? store.get("gacha-collected", []) : []);

/* ---------- 屏幕:打字机效果 ---------- */
let typeTimer = null;
function setScreen(text) {
  clearInterval(typeTimer);
  screenText.textContent = "";
  let i = 0;
  typeTimer = setInterval(() => {
    i += 1;
    screenText.textContent = text.slice(0, i);
    if (i >= text.length) clearInterval(typeTimer);
  }, 34);
}

/* ---------- 按钮可用性 ---------- */
function setControls(coinOn, turnOn) {
  btnCoin.disabled = !coinOn;
  btnTurn.disabled = !turnOn;
  knob.disabled = !turnOn;
}

/* ---------- 氛围:星星 / 粒子 / 罩内胶囊 ---------- */
function buildStars() {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 80; i++) {
    const s = document.createElement("i");
    s.className = "star";
    const size = (Math.random() * 2 + 1).toFixed(1);
    s.style.cssText =
      `left:${(Math.random() * 100).toFixed(2)}vw;top:${(Math.random() * 100).toFixed(2)}vh;` +
      `width:${size}px;height:${size}px;--dur:${(2 + Math.random() * 3).toFixed(2)}s;--delay:${(-Math.random() * 4).toFixed(2)}s;`;
    frag.appendChild(s);
  }
  starsWrap.appendChild(frag);
}

function buildMotes() {
  const colors = ["#ffd166", "#8f7bff", "#6ee7ff", "#ff8fb1"];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 16; i++) {
    const s = document.createElement("i");
    s.className = "mote";
    s.style.cssText =
      `left:${(Math.random() * 100).toFixed(2)}vw;--c1:${colors[i % colors.length]};` +
      `--s:${(2 + Math.random() * 4).toFixed(1)}px;--dur:${(10 + Math.random() * 10).toFixed(1)}s;` +
      `--delay:${(-Math.random() * 18).toFixed(1)}s;--dx:${(Math.random() * 120 - 60).toFixed(0)}px;`;
    frag.appendChild(s);
  }
  sparklesWrap.appendChild(frag);
}

function buildDomeCapsules() {
  const keys = Object.keys(TYPES);
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * 32; // 控制在圆心附近
    const x = 50 + Math.cos(angle) * radius;
    const y = 52 + Math.sin(angle) * radius * 0.9;
    const t = TYPES[keys[i % keys.length]];
    const s = document.createElement("span");
    s.className = "mini-cap";
    s.style.cssText =
      `left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;--c1:${t.c1};--c2:${t.c2};` +
      `--s:${(14 + Math.random() * 8).toFixed(0)}px;--dur:${(3 + Math.random() * 2.5).toFixed(2)}s;` +
      `--delay:${(-Math.random() * 4).toFixed(2)}s;`;
    frag.appendChild(s);
  }
  domeCaps.appendChild(frag);
}

/* ---------- 收藏进度与图例 ---------- */
function buildLegend() {
  const frag = document.createDocumentFragment();
  Object.entries(TYPES).forEach(([key, t]) => {
    const chip = document.createElement("span");
    chip.className = "legend-chip";
    chip.dataset.type = key;
    chip.style.setProperty("--c1", t.c1);
    const dot = document.createElement("i");
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(t.label));
    frag.appendChild(chip);
  });
  legendEl.appendChild(frag);
}

function renderCollection() {
  collectCount.textContent = String(collected.size);
  collectTotal.textContent = String(BLESSINGS.length);
  document.querySelectorAll(".legend-chip").forEach((chip) => {
    const got = BLESSINGS.some((b) => b.type === chip.dataset.type && collected.has(b.id));
    chip.classList.toggle("got", got);
  });
}

function saveCollected() {
  store.set("gacha-collected", [...collected]);
  renderCollection();
}

/* ---------- 提示 toast ---------- */
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ---------- 音效开关 ---------- */
function renderSoundChip() {
  btnSound.textContent = AudioFX.enabled ? "🔊 音效开" : "🔇 音效关";
  btnSound.setAttribute("aria-pressed", String(AudioFX.enabled));
}

/* ---------- 流程 ---------- */
function setIdle() {
  state.phase = "idle";
  setControls(true, false);
  dropped.hidden = true;
  dropped.classList.remove("open", "drop-in", "idle-wiggle");
  tapHint.hidden = true;
  setScreen(MSG.idle);
}

function insertCoin() {
  if (state.phase !== "idle") return;
  state.phase = "coined";
  setControls(false, true);
  AudioFX.coin();
  coin.classList.remove("fly");
  void coin.offsetWidth; // 重启动画
  coin.classList.add("fly");
  setScreen(MSG.coined);
}

function turn() {
  if (state.phase !== "coined") return;
  state.phase = "spinning";
  setControls(false, false);
  AudioFX.ratchet();
  knob.classList.remove("spin");
  void knob.offsetWidth;
  knob.classList.add("spin");
  machine.classList.add("shake");
  dome.classList.add("rumble");
  setScreen(MSG.spinning);
  clearTimeout(state.spinTimer);
  state.spinTimer = setTimeout(finishSpin, SPIN_MS);
}

function finishSpin() {
  machine.classList.remove("shake");
  dome.classList.remove("rumble");
  knob.classList.remove("spin");

  // 随机抽取一条祝福
  state.current = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)];
  const t = TYPES[state.current.type];
  dropped.style.setProperty("--c1", t.c1);
  dropped.style.setProperty("--c2", t.c2);

  dropped.hidden = false;
  dropped.classList.remove("open", "idle-wiggle", "drop-in");
  outlet.classList.add("push");
  AudioFX.drop();
  void dropped.offsetWidth;
  dropped.classList.add("drop-in");

  clearTimeout(state.settleTimer);
  state.settleTimer = setTimeout(() => {
    outlet.classList.remove("push");
    dropped.classList.remove("drop-in");
    dropped.classList.add("idle-wiggle");
    tapHint.hidden = false;
    state.phase = "dropped";
    setScreen(MSG.dropped);
  }, DROP_SETTLE_MS);
}

function burstSparks() {
  const rect = dropped.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const color = TYPES[state.current.type].c2;
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("span");
    s.className = "spark";
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 90;
    s.style.left = `${cx}px`;
    s.style.top = `${cy}px`;
    s.style.setProperty("--tx", `${(Math.cos(angle) * dist).toFixed(0)}px`);
    s.style.setProperty("--ty", `${(Math.sin(angle) * dist).toFixed(0)}px`);
    s.style.setProperty("--c1", color);
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}

function openCapsule() {
  if (state.phase !== "dropped") return;
  state.phase = "opened";
  tapHint.hidden = true;
  dropped.classList.remove("idle-wiggle");
  dropped.classList.add("open");
  AudioFX.open();
  burstSparks();

  const b = state.current;
  const t = TYPES[b.type];
  card.style.setProperty("--glow", t.c1);
  card.style.setProperty("--glow-soft", `${t.c1}66`);
  cardBadge.textContent = t.label;
  cardName.textContent = b.name;
  cardDesc.textContent = b.desc;
  cardQuote.textContent = b.quote;

  clearTimeout(state.cardTimer);
  state.cardTimer = setTimeout(() => {
    overlay.hidden = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add("show"));
    });
  }, OPEN_CARD_MS);

  collected.add(b.id);
  saveCollected();
  setScreen(MSG.opened);
}

function hideOverlay(done) {
  overlay.classList.remove("show");
  setTimeout(() => {
    overlay.hidden = true;
    if (typeof done === "function") done();
  }, 280);
}

function resetMachine(toCoined) {
  dropped.hidden = true;
  dropped.classList.remove("open", "drop-in", "idle-wiggle");
  tapHint.hidden = true;
  state.phase = "idle";
  if (toCoined) {
    insertCoin(); // 自动投币,直接进入可转状态
  } else {
    setIdle();
  }
}

function closeCard() {
  hideOverlay(() => resetMachine(false));
}

function again() {
  hideOverlay(() => resetMachine(true));
}

/* ---------- 复制祝福 ---------- */
async function copyBlessing() {
  const b = state.current;
  if (!b) return;
  const text = `🎁 我在「显化扭蛋机」抽到了【${b.name}】\n${b.desc}\n✦ ${b.quote}\n——也祝你今天顺利 ✨`;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch { /* 忽略 */ }
    ta.remove();
  }
  AudioFX.copy();
  showToast("已复制祝福,去分享吧 ✨");
}

/* ---------- 事件绑定 ---------- */
btnCoin.addEventListener("click", insertCoin);
btnTurn.addEventListener("click", turn);
knob.addEventListener("click", turn);
dropped.addEventListener("click", openCapsule);
btnCopy.addEventListener("click", copyBlessing);
btnAgain.addEventListener("click", again);
cardClose.addEventListener("click", closeCard);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeCard();
});
btnSound.addEventListener("click", () => {
  AudioFX.toggle();
  renderSoundChip();
  if (AudioFX.enabled) AudioFX.copy();
});

/* ---------- 初始化 ---------- */
buildStars();
buildMotes();
buildDomeCapsules();
buildLegend();
renderCollection();
renderSoundChip();
setControls(true, false);
setScreen(MSG.idle);
