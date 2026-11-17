/* ================= 祝福显化扭蛋机 · app.js ================= */
(() => {
  'use strict';

  /* ---------- 显化祝福库（可自由增删） ---------- */
  const BLESSINGS = [
    { name: '星轨祝福',   tip: '把心愿写成现在进行时，像它已经悄悄发生那样', act: '睡前 30 秒，闭上眼睛想象愿望实现的画面', share: '我的心愿币已投币，宇宙正在慢慢排单 ✨' },
    { name: '月光满格祝福', tip: '把焦虑交给月亮，心里只留真正想要的',       act: '把三个小烦恼写在便签上，揉一揉丢掉',     share: '今晚月亮替我值班，我只做美梦 🌙' },
    { name: '桃桃微风祝福', tip: '先对世界笑一笑，温柔的人会循声而来',       act: '给一位很久没联系的朋友发句“最近好吗”',   share: '微风带来了好同伴，今天也很温柔 🍑' },
    { name: '钱包暖烘祝福', tip: '对每一笔进账开心，对每一笔花掉觉得值得',   act: '记下今天最觉得“花得值”的一笔小钱',       share: '我的小金库正在一点点升温 💰' },
    { name: '高铁靠窗祝福', tip: '好心情是最好的出行护身符',               act: '计划一次说走就走的周边小旅行',           share: '出发和抵达，都顺利刚刚好 🚄' },
    { name: '奶茶头一口祝福', tip: '微小的快乐常喝常新，就是大幸福',       act: '给自己买一份小甜头，不带负罪感',         share: '今天的甜，先干为敬 🧋' },
    { name: '一路绿灯祝福', tip: '提前五分钟出发，把节奏还给自己',         act: '明天早出门十分钟，看看路上有什么不同',   share: '我出门全绿，心情高速通行 🚦' },
    { name: '小猫蹭裤祝福', tip: '接住扑面而来的温柔，你值得被喜欢',       act: '摸摸猫猫狗狗，或看 30 秒小动物视频',     share: '软乎乎的生物都爱贴贴我 🐱' },
    { name: '热乎面包祝福', tip: '生活要有刚出炉的热气',                   act: '今晚吃顿热乎的晚饭，慢慢吃完',           share: '愿你被热气腾腾包围 🍞' },
    { name: '海浪倾听祝福', tip: '心静下来，答案会自己浮上来',             act: '睡前做 5 轮慢呼吸：吸 4 拍、呼 6 拍',    share: '我心里有海，不怕小风浪 🌊' },
    { name: '热汤感冒祝福', tip: '被照顾常常藏在细节里，去发现它',         act: '对今天帮过你的人认真说一次“谢谢”',       share: '这个世界总有汤为我保温 🍲' },
    { name: '最后一块曲奇祝福', tip: '把最后一点甜留给自己，你已经很努力', act: '写下今天做得不错的一件小事',             share: '连最后一块曲奇都愿意归我 🍪' },
    { name: '充电满格祝福', tip: '休息不是偷懒，是为你想做的事蓄电',       act: '今晚提前半小时上床，不带手机',           share: '满电复活，能量拉满 🔋' },
    { name: '彩虹转角祝福', tip: '美好常在半步之外，慢一点就看见了',       act: '出门时抬头看看天，找一朵有意思的云',     share: '我找到了彩虹的隐藏转角 🌈' },
    { name: '免费升级祝福', tip: '用“我值得”来迎接惊喜',                   act: '今天提一个小小的、平时不好意思提的请求', share: '惊喜加载中：▓▓▓▓▓░░ 🎁' },
    { name: '晨光叫醒祝福', tip: '用一个小小的确定，温柔地开启一天',       act: '明早喝杯温水，对自己说声“早上好”',       share: '一睁眼就有阳光，今日已领先 ☀️' },
    { name: '灵感泉涌祝福', tip: '灵感偏爱放松的人',                       act: '随手把脑海里第一个画面画下来 3 分钟',    share: '灵感排队来敲我的门 💡' },
    { name: '稳稳守护祝福', tip: '你等的事正在成型，再给它一点时间',       act: '为目标做一个小小的具体动作，多小都算',   share: '慢慢来，比较快，我在路上 🌱' },
  ];
  const CAP_PALETTE = ['#ff6ec7', '#ffd257', '#3ec9ff', '#a86bff', '#6ee7a0', '#ff9d6e', '#7dd3fc'];

  /* ---------- 工具 ---------- */
  const $ = (s) => document.querySelector(s);
  const rand = (n) => Math.floor(Math.random() * n);

  /* ---------- 音效（WebAudio 合成，无外部资源） ---------- */
  const fx = {
    ctx: null,
    muted: false,
    ensure() {
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return null;
          this.ctx = new AC();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
      } catch (e) { return null; }
    },
    blip(freq, dur = .1, type = 'sine', gain = .12, delay = 0, slide) {
      if (this.muted) return;
      const c = this.ensure(); if (!c) return;
      try {
        const t0 = c.currentTime + delay;
        const o = c.createOscillator(), g = c.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t0);
        if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
        g.gain.setValueAtTime(.0001, t0);
        g.gain.exponentialRampToValueAtTime(gain, t0 + .012);
        g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
        o.connect(g).connect(c.destination);
        o.start(t0); o.stop(t0 + dur + .05);
      } catch (e) { /* 静默失败 */ }
    },
    coin()  { this.blip(1244, .12, 'triangle', .14); this.blip(1864, .18, 'triangle', .12, .09); },
    click() { this.blip(320, .05, 'square', .055, 0, 170); },
    deny()  { this.blip(210, .16, 'sawtooth', .06, 0, 130); },
    fall()  { this.blip(740, .5, 'sine', .06, 0, 170); },
    thud()  { this.blip(130, .18, 'sine', .17, 0, 60); },
    pop()   { [523, 659, 784, 1046].forEach((f, i) => this.blip(f, .13, 'triangle', .1, i * .07)); },
    ratchet() { for (let i = 0; i < 6; i++) this.blip(330 - i * 8, .05, 'square', .05, i * .16, 170); },
  };

  /* ---------- 元素 ---------- */
  const machine = $('#machine'), dome = $('#dome'), coinSlot = $('#coinSlot'),
    knob = $('#knob'), knobLabel = $('#knobLabel'), flap = $('#flap'),
    outlet = $('#outlet'), tray = $('#tray'), cap = $('#capsuleLive'),
    coin = $('#coin'), hint = $('#hint'), overlay = $('#overlay'),
    bName = $('#bName'), bTip = $('#bTip'), bAct = $('#bAct'), bShare = $('#bShare'),
    copyBtn = $('#copyBtn'), againBtn = $('#againBtn'),
    toast = $('#toast'), muteBtn = $('#muteBtn');

  let state = 'idle';   // idle -> coined -> busy -> ready -> open
  let lastIdx = -1, current = null, toastTimer = null;

  function setHint(t) {
    hint.textContent = t;
    hint.classList.remove('swap');
    void hint.offsetWidth;
    hint.classList.add('swap');
  }
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
  }

  /* ---------- 第一步：投币 ---------- */
  function insertCoin() {
    if (state !== 'idle') {
      if (state === 'coined') { fx.deny(); setHint('心愿币已经投进去啦，快去点旋钮转动吧 🔧'); }
      return;
    }
    state = 'busy';
    fx.coin();
    coinSlot.classList.remove('want');

    const m = machine.getBoundingClientRect();
    const s = coinSlot.querySelector('.slot-slit').getBoundingClientRect();
    const cx = s.left - m.left + s.width / 2;
    coin.style.left = (cx - coin.offsetWidth / 2) + 'px';
    coin.style.top = (s.bottom - m.top + 8) + 'px';
    coin.style.opacity = '1';

    const rise = -(s.height * .55 + 16);
    coin.animate([
      { transform: 'translate(0,0) rotate(-16deg) scale(1)', opacity: 1, offset: 0 },
      { transform: 'translate(-1px,' + (rise * .5) + 'px) rotate(12deg) scale(.97)', opacity: 1, offset: .55 },
      { transform: 'translate(0,' + rise + 'px) rotate(0deg) scale(.5)', opacity: 0, offset: 1 },
    ], { duration: 640, easing: 'cubic-bezier(.42,.08,.58,1)' });

    setTimeout(() => {
      machine.classList.add('shaking');
      fx.thud();
      setTimeout(() => machine.classList.remove('shaking'), 520);
      coin.style.opacity = '0';
      state = 'coined';
      knob.classList.remove('idle');
      knob.classList.add('want');
      knobLabel.textContent = 'TURN me!';
      setHint('✨ 投币成功！点一下粉色旋钮，转出你的胶囊');
    }, 300);
  }

  /* ---------- 第二步：转旋钮 ---------- */
  function turnKnob() {
    if (state === 'idle') {
      fx.deny();
      knob.classList.add('deny');
      setTimeout(() => knob.classList.remove('deny'), 420);
      setHint('旋钮表示罢工：先投一枚心愿币！🪙');
      return;
    }
    if (state !== 'coined') return;
    state = 'busy';
    knob.classList.remove('want');
    knob.classList.add('spinning');
    knobLabel.textContent = '转动中…';
    fx.ratchet();
    dome.classList.add('tumbling');
    machine.classList.add('shaking');
    setTimeout(() => machine.classList.remove('shaking'), 520);
    setHint('咕噜咕噜——胶囊在里面翻滚… 🎰');
    setTimeout(() => {
      dome.classList.remove('tumbling');
      dropCapsule();
    }, 1150);
  }
  knob.addEventListener('animationend', () => knob.classList.remove('spinning'));

  /* ---------- 第三步：胶囊掉落 ---------- */
  function dropCapsule() {
    const m = machine.getBoundingClientRect();
    const d = dome.getBoundingClientRect();
    const o = outlet.getBoundingClientRect();
    const t = tray.getBoundingClientRect();
    const size = cap.offsetWidth;
    const sx = d.left - m.left + d.width / 2 - size / 2, sy = d.top - m.top + d.height * .42;
    const ox = o.left - m.left + o.width / 2 - size / 2, oy = o.top - m.top + o.height * .28;
    const tx = t.left - m.left + t.width / 2 - size / 2, ty = t.top - m.top - size * .94;

    cap.style.setProperty('--cap', CAP_PALETTE[rand(CAP_PALETTE.length)]);
    cap.style.left = sx + 'px';
    cap.style.top = sy + 'px';
    cap.classList.add('on');
    fx.fall();
    setTimeout(() => flap.classList.add('open'), 480);
    setTimeout(() => flap.classList.remove('open'), 1500);

    cap.animate([
      { transform: 'translate(0,0) rotate(0deg)', easing: 'cubic-bezier(.5,.06,.7,.6)' },
      { transform: 'translate(' + (ox - sx) + 'px,' + (oy - sy) + 'px) rotate(300deg)', offset: .4, easing: 'cubic-bezier(.5,.12,.6,1)' },
      { transform: 'translate(' + (tx - sx) + 'px,' + (ty - sy) + 'px) rotate(560deg) scale(1,.82)', offset: .72, easing: 'cubic-bezier(.2,.9,.35,1.15)' },
      { transform: 'translate(' + (tx - sx) + 'px,' + (ty + size * .28 - sy) + 'px) rotate(590deg) scale(1,1)', offset: .85, easing: 'cubic-bezier(.4,.6,.6,1)' },
      { transform: 'translate(' + (tx - sx) + 'px,' + (ty - sy) + 'px) rotate(600deg) scale(1,1)' },
    ], { duration: 1350, fill: 'forwards' }).finished.then(() => {
      cap.style.left = tx + 'px';
      cap.style.top = ty + 'px';
      cap.getAnimations().forEach(a => a.cancel());
      cap.classList.add('land');
      fx.thud();
      const r = cap.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 10);
      state = 'ready';
      knobLabel.textContent = '好耶!';
      setHint('🎁 叮——胶囊到手！点它打开你的祝福');
    }).catch(() => {});
  }

  /* ---------- 第四步：打开胶囊 & 祝福卡 ---------- */
  function openCapsule() {
    if (state !== 'ready') return;
    state = 'open';
    fx.pop();
    cap.classList.remove('land');
    const top = cap.querySelector('.top'), bot = cap.querySelector('.bot');
    top.animate([
      { transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: 'translate(-16px,-52px) rotate(-40deg)', opacity: 0 },
    ], { duration: 460, easing: 'ease-out', fill: 'forwards' });
    bot.animate([
      { transform: 'translate(0,0)', opacity: 1 },
      { transform: 'translate(8px,30px) rotate(18deg)', opacity: 0 },
    ], { duration: 460, easing: 'ease-in', fill: 'forwards' });
    const r = cap.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 16);
    setTimeout(() => showCard(pick()), 420);
  }

  function pick() {
    let i;
    do { i = rand(BLESSINGS.length); } while (i === lastIdx && BLESSINGS.length > 1);
    lastIdx = i;
    return BLESSINGS[i];
  }

  function showCard(b) {
    current = b;
    bName.textContent = b.name;
    bTip.textContent = b.tip;
    bAct.textContent = b.act;
    bShare.textContent = b.share;
    overlay.classList.add('show');
    setHint('🔮 祝福已送达！可以复制分享，也可以再抽一次');
  }

  function resetMachine() {
    overlay.classList.remove('show');
    cap.getAnimations().forEach(a => a.cancel());
    cap.classList.remove('on', 'land');
    ['top', 'bot'].forEach(cls => {
      const el = cap.querySelector('.' + cls);
      el.getAnimations().forEach(a => a.cancel());
    });
    knob.classList.remove('spinning');
    knob.classList.add('idle');
    knobLabel.textContent = '投币可转';
    coinSlot.classList.add('want');
    state = 'idle';
    setHint('🪙 再投一枚心愿币，开启新一轮好运');
  }

  /* ---------- 复制祝福 ---------- */
  function buildCopy(b) {
    return '🔮 ' + b.name + '\n✨ 显化提示：' + b.tip + '\n🌱 今日小行动：' + b.act +
      '\n💌 分享短句：' + b.share + '\n—— 来自「祝福显化扭蛋机」';
  }
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; }
    catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = t;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch (_) { return false; }
    }
  }
  copyBtn.addEventListener('click', async () => {
    if (!current) return;
    const ok = await copyText(buildCopy(current));
    showToast(ok ? '已复制！去把这缕好运发出去 ✨' : '复制没成功，可以长按分享短句手动复制');
    if (ok) fx.coin();
  });
  againBtn.addEventListener('click', () => { fx.click(); resetMachine(); });

  /* ---------- 事件绑定 ---------- */
  coinSlot.addEventListener('click', insertCoin);
  knob.addEventListener('click', turnKnob);
  cap.addEventListener('click', openCapsule);
  muteBtn.addEventListener('click', () => {
    fx.muted = !fx.muted;
    muteBtn.textContent = fx.muted ? '🔇' : '🔊';
    if (!fx.muted) fx.click();
  });

  /* ---------- 星空 & 彩带 ---------- */
  function spawnStars(n) {
    const wrap = $('#stars');
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'star';
      const size = (Math.random() * 1.8 + 1).toFixed(1);
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = (Math.random() * 100).toFixed(2) + '%';
      s.style.top = (Math.random() * 100).toFixed(2) + '%';
      s.style.setProperty('--tw', (2 + Math.random() * 4).toFixed(2) + 's');
      s.style.animationDelay = (Math.random() * 4).toFixed(2) + 's';
      if (Math.random() < .12) s.style.boxShadow = '0 0 6px 1px rgba(255,255,255,.8)';
      frag.appendChild(s);
    }
    wrap.appendChild(frag);
  }

  function burst(x, y, n) {
    const glyphs = ['✨', '🌟', '💫', '🌸', '🫧', '⭐'];
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'confetti';
      s.textContent = glyphs[rand(glyphs.length)];
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      s.style.fontSize = (10 + Math.random() * 13) + 'px';
      document.body.appendChild(s);
      const dx = (Math.random() - .5) * 240;
      const dy = -(30 + Math.random() * 150);
      const rot = (Math.random() - .5) * 540;
      s.animate([
        { transform: 'translate(-50%,-50%) scale(.5) rotate(0deg)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(1.05) rotate(' + rot + 'deg)', opacity: 1, offset: .55 },
        { transform: 'translate(calc(-50% + ' + (dx * 1.25) + 'px), calc(-50% + ' + (dy + 190) + 'px)) scale(.75) rotate(' + (rot * 1.4) + 'deg)', opacity: 0 },
      ], { duration: 1050 + Math.random() * 450, easing: 'cubic-bezier(.22,.61,.36,1)' })
        .finished.then(() => s.remove()).catch(() => s.remove());
    }
  }

  spawnStars(64);
})();
