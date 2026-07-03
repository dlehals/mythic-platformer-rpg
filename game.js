(() => {
  'use strict';

  const SAVE_KEY = 'mythic-terrain-rpg-save-v1';
  const ACCOUNT_KEY = 'mythic-terrain-rpg-accounts-v1';
  const SESSION_KEY = 'mythic-terrain-rpg-session-v1';
  const ITEM_VALUES = { Common: 10, Rare: 50, Epic: 120, Legendary: 200, Mythic: 1000 };
  const KEYS = ['Z', 'C', 'V', 'R'];
  const clamp = Phaser.Math.Clamp;
  const $ = (id) => document.getElementById(id);
  let currentAccountId = localStorage.getItem(SESSION_KEY) || '';

  const BASE_CLASSES = {
    berserker: {
      title: '광전사', color: 0xff5a4f,
      desc: '대검과 중갑 실루엣. 넓은 근접 판정과 폭발적인 궁극기가 강점.',
      stats: { hp: 170, mp: 70, atk: 17, speed: 235, jump: 520, crit: 0.08 }
    },
    sniper: {
      title: '저격수', color: 0x8be9fd,
      desc: '후드와 장궁 실루엣. 거리 유지, 관통 사격, 확정 치명타에 특화.',
      stats: { hp: 125, mp: 95, atk: 14, speed: 255, jump: 515, crit: 0.13 }
    },
    sorcerer: {
      title: '원소술사', color: 0xb388ff,
      desc: '로브와 지팡이 실루엣. 원소 투사체, 점멸, 마나 보호막을 사용.',
      stats: { hp: 115, mp: 145, atk: 15, speed: 230, jump: 500, crit: 0.1 }
    },
    assassin: {
      title: '암살자', color: 0x8aff80,
      desc: '마스크와 쌍단검 실루엣. 은신, 독, 순간 폭딜에 특화.',
      stats: { hp: 130, mp: 95, atk: 15, speed: 285, jump: 535, crit: 0.16 }
    }
  };

  const ZONES = {
    town: {
      title: 'Town Hub', color: 0x1d263a, accent: 0x9bdcff, material: null,
      hazard: null, mob: null, boss: null
    },
    lava: {
      title: 'Lava Zone', color: 0x2d1114, accent: 0xff3300, material: 'Lava Core',
      hazard: { name: 'Molten Lava', damage: 15, color: 0xff3600 },
      mob: { name: 'Ember Brute', hp: 70, atk: 12, exp: 22, gold: 14, tint: 0xff6a21 },
      boss: { name: 'Lava Golem Boss', hp: 640, atk: 28, exp: 160, gold: 120, tint: 0xff3300 }
    },
    frost: {
      title: 'Frost Zone', color: 0x102536, accent: 0x67d9ff, material: 'Frost Heart',
      hazard: { name: 'Frostbite Field', damage: 10, color: 0x67d9ff },
      mob: { name: 'Rime Hound', hp: 76, atk: 13, exp: 24, gold: 16, tint: 0x9ae7ff },
      boss: { name: 'Frost Titan Boss', hp: 700, atk: 30, exp: 175, gold: 130, tint: 0x67d9ff }
    },
    ruin: {
      title: 'Ruin Zone', color: 0x221e15, accent: 0xffd166, material: 'Ancient Dynamo',
      hazard: { name: 'Arc Trap', damage: 12, color: 0xffd166 },
      mob: { name: 'Relic Sentry', hp: 82, atk: 15, exp: 28, gold: 18, tint: 0xffd166 },
      boss: { name: 'Ruin Colossus Boss', hp: 760, atk: 33, exp: 190, gold: 150, tint: 0xffd166 }
    },
    abyss: {
      title: 'Abyss Zone', color: 0x0b1020, accent: 0xba55d3, material: 'Abyss Shard',
      hazard: { name: 'Void Leak', damage: 18, color: 0x8b2bd6 },
      mob: { name: 'Abyss Wraith', hp: 88, atk: 17, exp: 32, gold: 22, tint: 0xba55d3 },
      boss: { name: 'Abyss Sovereign Boss', hp: 840, atk: 38, exp: 230, gold: 180, tint: 0xba55d3 }
    },
    arena: {
      title: 'Training Arena', color: 0x151722, accent: 0xeeeeee, material: null,
      hazard: null, mob: { name: 'Training Dummy AI', hp: 999, atk: 1, exp: 0, gold: 0, tint: 0xeeeeee }, boss: null
    }
  };

  const TERRAIN_JOBS = {
    lava: { berserker: 'Fire Knight', sniper: 'Flame Scout', sorcerer: 'Pyroclast', assassin: 'Hell Stalker', aura: '#ff3300', status: 'burn' },
    frost: { berserker: 'Glacier Guard', sniper: 'Frost Ranger', sorcerer: 'Cryomancer', assassin: 'Pale Phantom', aura: '#67d9ff', status: 'freeze' },
    ruin: { berserker: 'Stormbreaker', sniper: 'Relic Arbalist', sorcerer: 'Tempest Sage', assassin: 'Volt Shade', aura: '#ffd166', status: 'shock' },
    abyss: { berserker: 'Void Executioner', sniper: 'Umbral Deadeye', sorcerer: 'Abyss Oracle', assassin: 'Night Herald', aura: '#ba55d3', status: 'doom' }
  };


  const JOB_LABELS = {
    Berserker: '광전사', Sniper: '저격수', Sorcerer: '원소술사', Assassin: '암살자',
    'Fire Knight': '화염 기사', 'Flame Scout': '화염 정찰자', Pyroclast: '폭염술사', 'Hell Stalker': '지옥 추적자',
    'Glacier Guard': '빙하 수호자', 'Frost Ranger': '서리 순찰자', Cryomancer: '빙결술사', 'Pale Phantom': '백색 환영',
    Stormbreaker: '폭풍 파쇄자', 'Relic Arbalist': '유적 쇠뇌수', 'Tempest Sage': '폭풍 현자', 'Volt Shade': '전광 그림자',
    'Void Executioner': '공허 처형자', 'Umbral Deadeye': '암영 명사수', 'Abyss Oracle': '심연 예언자', 'Night Herald': '밤의 전령',
    'Grim Reaper': '그림 리퍼', 'Time Intervener': '시간 개입자', 'No Class': '직업 없음'
  };

  const SKILL_LABELS = {
    'Power Slash': '파워 슬래시', 'Leap Attack': '도약 강타', Berserk: '광폭화', 'Bloody Carnage': '피의 난무',
    'Multiple Shot': '다중 사격', 'Backstep Arrow': '후퇴 사격', Focus: '집중', 'Piercing Strike': '관통 일격',
    'Flame Burst': '화염 폭발', 'Ice Blink': '빙결 점멸', 'Mana Shield': '마나 보호막', 'Meteor Strike': '운석 낙하',
    'Shadow Strike': '그림자 습격', 'Poison Blade': '맹독 단검', Stealth: '은신', 'Phantom Frenzy': '환영 난무',
    "Reaper's Sweep": '사신의 수확', 'Soul Dash': '영혼 질주', "Death's Shroud": '죽음의 장막', 'Doomsday Mark': '종말 표식',
    'Space-Time Collapse': '시공 붕괴', 'Paradox Blink': '역설 점멸', 'Temporal Rewind': '시간 되감기', 'Chrono Freeze': '시간 정지'
  };

  function koJob(name) { return JOB_LABELS[name] || name; }
  function koSkill(name) { return SKILL_LABELS[name] || name; }

  const MYTHIC_ITEMS = [
    { name: "Reaper's Scythe", mythic: 'reaper', desc: 'Grim Reaper 각성. 모든 기존 직업 구조를 덮어씁니다.' },
    { name: 'Chrono-Trigon', mythic: 'chrono', desc: 'Time Intervener 각성. 시간과 위치를 조작합니다.' }
  ];

  const BASE_SKILLS = {
    berserker: [
      { key: 'Z', name: 'Power Slash', cd: 4000, mp: 10, handler: 'powerSlash' },
      { key: 'C', name: 'Leap Attack', cd: 8000, mp: 15, handler: 'leapAttack' },
      { key: 'V', name: 'Berserk', cd: 30000, mp: 20, handler: 'berserk' },
      { key: 'R', name: 'Bloody Carnage', cd: 20000, mp: 40, handler: 'carnage' }
    ],
    sniper: [
      { key: 'Z', name: 'Multiple Shot', cd: 3000, mp: 10, handler: 'multiShot' },
      { key: 'C', name: 'Backstep Arrow', cd: 6000, mp: 15, handler: 'backstepArrow' },
      { key: 'V', name: 'Focus', cd: 25000, mp: 20, handler: 'focus' },
      { key: 'R', name: 'Piercing Strike', cd: 18000, mp: 40, handler: 'piercingStrike' }
    ],
    sorcerer: [
      { key: 'Z', name: 'Flame Burst', cd: 5000, mp: 10, handler: 'flameBurst' },
      { key: 'C', name: 'Ice Blink', cd: 7000, mp: 15, handler: 'iceBlink' },
      { key: 'V', name: 'Mana Shield', cd: 0, mp: 0, handler: 'manaShield' },
      { key: 'R', name: 'Meteor Strike', cd: 22000, mp: 40, handler: 'meteorStrike' }
    ],
    assassin: [
      { key: 'Z', name: 'Shadow Strike', cd: 5000, mp: 10, handler: 'shadowStrike' },
      { key: 'C', name: 'Poison Blade', cd: 4000, mp: 12, handler: 'poisonBlade' },
      { key: 'V', name: 'Stealth', cd: 20000, mp: 15, handler: 'stealth' },
      { key: 'R', name: 'Phantom Frenzy', cd: 25000, mp: 40, handler: 'phantomFrenzy' }
    ]
  };

  const MYTHIC_SKILLS = {
    reaper: [
      { key: 'Z', name: "Reaper's Sweep", cd: 3000, mp: 0, handler: 'reaperSweep' },
      { key: 'C', name: 'Soul Dash', cd: 5000, mp: 0, handler: 'soulDash' },
      { key: 'V', name: "Death's Shroud", cd: 15000, mp: 0, handler: 'deathShroud' },
      { key: 'R', name: 'Doomsday Mark', cd: 24000, mp: 0, handler: 'doomsdayMark' }
    ],
    chrono: [
      { key: 'Z', name: 'Space-Time Collapse', cd: 4000, mp: 0, handler: 'spaceTimeCollapse' },
      { key: 'C', name: 'Paradox Blink', cd: 2000, mp: 0, handler: 'paradoxBlink' },
      { key: 'V', name: 'Temporal Rewind', cd: 20000, mp: 0, handler: 'temporalRewind' },
      { key: 'R', name: 'Chrono Freeze', cd: 30000, mp: 0, handler: 'chronoFreeze' }
    ]
  };

  function freshSave() {
    return {
      playerName: '',
      baseClass: null, path: 'base', terrain: null, mythic: null, zone: 'town',
      level: 1, exp: 0, gold: 60, hp: 0, mp: 0,
      inventory: [], equipped: null, materials: {}, zoneKills: {}, bossKills: {}, defeatedBosses: {},
      settings: { shake: true, mobile: true }
    };
  }

  function normalizeAccountId(value) {
    return (value || '').trim().toLowerCase().replace(/\s+/g, '');
  }

  function cleanDisplayName(value) {
    return (value || '').replace(/\s+/g, ' ').trim().slice(0, 16);
  }

  function loadAccounts() {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}');
    } catch (error) {
      console.warn('Account parse failed', error);
      return {};
    }
  }

  function saveAccounts(accounts) {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
  }

  function accountSaveKey(accountId = currentAccountId) {
    return `${SAVE_KEY}:account:${accountId}`;
  }

  function getCurrentAccount() {
    const accounts = loadAccounts();
    return currentAccountId ? accounts[currentAccountId] : null;
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(currentAccountId ? accountSaveKey(currentAccountId) : SAVE_KEY);
      if (!raw) return freshSave();
      return { ...freshSave(), ...JSON.parse(raw) };
    } catch (error) {
      console.warn('Save parse failed', error);
      return freshSave();
    }
  }

  let save = loadSave();
  let activeScene = null;
  let toastTimer = null;
  const touchState = {};

  function saveGame() {
    if (activeScene) activeScene.syncSaveFromPlayer();
    localStorage.setItem(currentAccountId ? accountSaveKey(currentAccountId) : SAVE_KEY, JSON.stringify(save));
  }

  function toast(message) {
    const node = $('toast');
    node.textContent = message;
    node.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('visible'), 2200);
  }

  function getBaseStats() {
    const base = BASE_CLASSES[save.baseClass] || BASE_CLASSES.berserker;
    const level = Math.max(1, save.level || 1);
    const mythicBoost = save.path === 'mythic' ? 1.35 : 1;
    const terrainBoost = save.path === 'terrain' ? 1.12 : 1;
    return {
      hp: Math.round((base.stats.hp + (level - 1) * 16) * mythicBoost * terrainBoost),
      mp: Math.round((base.stats.mp + (level - 1) * 8) * (save.path === 'mythic' ? 1.15 : 1)),
      atk: Math.round((base.stats.atk + (level - 1) * 2.4) * mythicBoost),
      speed: Math.round(base.stats.speed * (save.path === 'terrain' ? 1.04 : 1)),
      jump: base.stats.jump,
      crit: clamp(base.stats.crit + (level - 1) * 0.003 + (save.path === 'mythic' ? 0.12 : 0), 0, 0.55)
    };
  }

  function expNeeded() {
    return 80 + save.level * 42;
  }

  function getJobTitle() {
    if (save.path === 'mythic') return save.mythic === 'chrono' ? koJob('Time Intervener') : koJob('Grim Reaper');
    if (save.path === 'terrain' && save.terrain && TERRAIN_JOBS[save.terrain]) {
      return koJob(TERRAIN_JOBS[save.terrain][save.baseClass] || 'Terrain Class');
    }
    return BASE_CLASSES[save.baseClass]?.title || koJob('No Class');
  }

  function getActiveSkills() {
    if (save.path === 'mythic') return MYTHIC_SKILLS[save.mythic] || MYTHIC_SKILLS.reaper;
    return BASE_SKILLS[save.baseClass] || BASE_SKILLS.berserker;
  }

  function terrainMultiplier() {
    return save.path === 'terrain' ? 1.4 : 1;
  }

  function addItem(item) {
    const finalItem = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, ...item };
    save.inventory.push(finalItem);
    if (item.type === 'material') save.materials[item.zone] = (save.materials[item.zone] || 0) + 1;
    saveGame();
    renderInventory();
    toast(`${item.name} 획득`);
    AudioFX.playLootSound();
    return finalItem;
  }

  function removeInventoryItem(itemId) {
    const item = save.inventory.find((entry) => entry.id === itemId);
    save.inventory = save.inventory.filter((entry) => entry.id !== itemId);
    if (item?.type === 'material' && item.zone) save.materials[item.zone] = Math.max(0, (save.materials[item.zone] || 0) - 1);
    if (save.equipped === itemId) save.equipped = null;
    saveGame();
    renderInventory();
  }

  const AudioFX = (() => {
    let ctx = null;
    function getCtx() {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function osc(type, from, to, duration, gainValue = 0.14) {
      const audio = getCtx();
      const now = audio.currentTime;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(from, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration);
      gain.gain.setValueAtTime(gainValue, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
    }
    function noise(duration, gainValue = 0.08) {
      const audio = getCtx();
      const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * duration), audio.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      const source = audio.createBufferSource();
      const gain = audio.createGain();
      gain.gain.setValueAtTime(gainValue, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
      source.buffer = buffer;
      source.connect(gain).connect(audio.destination);
      source.start();
    }
    return {
      unlock: getCtx,
      playHitSound: () => osc('triangle', 150, 40, 0.1, 0.1),
      playCritSound: () => { noise(0.08, 0.08); osc('square', 800, 200, 0.15, 0.12); },
      playLootSound: () => { osc('sine', 523, 659, 0.08, 0.1); setTimeout(() => osc('sine', 659, 784, 0.08, 0.08), 70); },
      playAwakeSound: () => osc('sawtooth', 200, 1400, 0.5, 0.13),
      playUiSound: () => osc('sine', 420, 620, 0.04, 0.045),
      playBossSound: () => { osc('sawtooth', 90, 45, 0.35, 0.16); noise(0.2, 0.05); }
    };
  })();


  function getEquippedItem() {
    return save.inventory.find((item) => item.id === save.equipped) || null;
  }

  function getEquippedLabel() {
    const item = getEquippedItem();
    if (item) return `${item.name} 장착 중`;
    if (save.path === 'terrain' && save.terrain) return `${ZONES[save.terrain].title} 진화 장비 활성화`;
    return '장착 무기 없음';
  }

  function getAvatarClass() {
    if (save.path === 'mythic') return save.mythic === 'chrono' ? 'chrono' : 'reaper';
    const base = save.baseClass || 'berserker';
    return save.path === 'terrain' && save.terrain ? `${base} terrain-${save.terrain}` : base;
  }

  function setPaperDoll(id) {
    const node = $(id);
    if (!node) return;
    node.className = `paper-doll ${getAvatarClass()}`;
    node.innerHTML = '<span class="weapon"></span>';
  }

  function updateProfileUi() {
    const name = save.playerName || '게스트';
    const info = save.baseClass ? `${getJobTitle()} · Lv.${save.level} · ${save.gold}골드` : '캐릭터 생성 필요';
    if ($('profileNameText')) $('profileNameText').textContent = name;
    if ($('equippedText')) $('equippedText').textContent = getEquippedLabel();
    if ($('menuProfileName')) $('menuProfileName').textContent = name;
    if ($('menuProfileInfo')) $('menuProfileInfo').textContent = info;
    setPaperDoll('hudAvatar');
    setPaperDoll('menuAvatar');
    if ($('loginPanel')) $('loginPanel').style.display = save.playerName ? 'none' : 'block';
    if ($('mainMenu')) $('mainMenu').classList.toggle('visible', !!save.playerName);
    if ($('continueButton')) $('continueButton').disabled = !save.baseClass;
  }

  function hideStartScreen() {
    if ($('startScreen')) $('startScreen').classList.remove('visible');
    if (activeScene && save.baseClass) activeScene.physics.resume();
  }

  function showStartScreen() {
    if ($('startScreen')) $('startScreen').classList.add('visible');
    if (activeScene) activeScene.physics.pause();
    updateProfileUi();
  }

  function showClassSelect() {
    if ($('classModal')) $('classModal').classList.add('visible');
    if (activeScene) activeScene.physics.pause();
  }

  function renderSkills(scene) {
    const bar = $('skillBar');
    const skills = getActiveSkills();
    bar.innerHTML = skills.map((skill) => `
      <div class="skill-slot" data-skill="${skill.key}">
        <strong>${skill.key}</strong>
        <small>${koSkill(skill.name)}</small>
        <div class="skill-cd"></div>
      </div>`).join('');
    updateHud(scene);
  }

  function updateHud(scene) {
    const stats = getBaseStats();
    const hp = (scene?.playerHp ?? save.hp) || stats.hp;
    const mp = (scene?.playerMp ?? save.mp) || stats.mp;
    $('levelText').textContent = `Lv. ${save.level}`;
    $('jobText').textContent = getJobTitle();
    $('goldText').textContent = `${save.gold}골드`;
    $('hpFill').style.width = `${clamp((hp / stats.hp) * 100, 0, 100)}%`;
    $('mpFill').style.width = `${clamp((mp / stats.mp) * 100, 0, 100)}%`;
    $('hpText').textContent = `체력 ${Math.ceil(hp)} / ${stats.hp}`;
    $('mpText').textContent = `마나 ${Math.ceil(mp)} / ${stats.mp}`;
    $('expFill').style.width = `${clamp((save.exp / expNeeded()) * 100, 0, 100)}%`;

    const now = scene?.time?.now || performance.now();
    document.querySelectorAll('.skill-slot').forEach((slot) => {
      const key = slot.dataset.skill;
      const next = scene?.cooldowns?.[key] || 0;
      const skill = getActiveSkills().find((entry) => entry.key === key);
      const remain = Math.max(0, next - now);
      const pct = skill?.cd ? clamp((remain / skill.cd) * 100, 0, 100) : 0;
      slot.querySelector('.skill-cd').style.height = `${pct}%`;
    });
    updateProfileUi();
  }
  function renderInventory() {
    const list = $('inventoryList');
    if (!save.inventory.length) {
      list.innerHTML = '<div class="item-row"><div>가방이 비어 있습니다<div class="meta">몬스터, 보스, Mythic 드랍으로 장비와 재료를 획득합니다.</div></div></div>';
      return;
    }
    list.innerHTML = save.inventory.map((item) => {
      const sell = ITEM_VALUES[item.rarity] || 10;
      const equipped = save.equipped === item.id;
      const equip = item.type === 'mythic' ? `<button data-equip="${item.id}">${equipped ? '장착됨' : '장착'}</button>` : '<span></span>';
      return `<div class="item-row${equipped ? ' equipped' : ''}">
        <div><strong class="rarity-${item.rarity}">${item.name}</strong><div class="meta">${item.rarity} · ${item.desc || item.type} · 판매가 ${sell}골드</div></div>
        ${equip}
        <button data-sell="${item.id}">분해/판매</button>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-sell]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = save.inventory.find((entry) => entry.id === button.dataset.sell);
        if (!item) return;
        save.gold += ITEM_VALUES[item.rarity] || 10;
        removeInventoryItem(item.id);
        toast(`${item.name} 판매 +${ITEM_VALUES[item.rarity] || 10}골드`);
        updateHud(activeScene);
        updateProfileUi();
      });
    });
    list.querySelectorAll('[data-equip]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = save.inventory.find((entry) => entry.id === button.dataset.equip);
        if (!item) return;
        save.equipped = item.id;
        save.path = 'mythic';
        save.mythic = item.mythic;
        save.terrain = null;
        saveGame();
        AudioFX.playAwakeSound();
        toast(`${getJobTitle()} 각성 완료`);
        $('inventoryModal').classList.remove('visible');
        renderInventory();
        updateProfileUi();
        if (activeScene) activeScene.refreshPlayerIdentity(true);
      });
    });
  }
  function setupDom() {
    document.querySelectorAll('input, textarea, select').forEach((input) => {
      ['keydown', 'keyup', 'keypress'].forEach((type) => input.addEventListener(type, (event) => event.stopPropagation()));
    });

    const accountIdInput = $('accountIdInput');
    const accountPasswordInput = $('accountPasswordInput');
    const playerNameInput = $('playerNameInput');
    const setAuthMode = (mode) => {
      const isRegister = mode === 'register';
      $('showLoginButton')?.classList.toggle('active', !isRegister);
      $('showRegisterButton')?.classList.toggle('active', isRegister);
      if ($('registerNameWrap')) $('registerNameWrap').style.display = isRegister ? 'block' : 'none';
      if ($('loginButton')) $('loginButton').style.display = isRegister ? 'none' : 'inline-flex';
      if ($('registerButton')) $('registerButton').style.display = isRegister ? 'inline-flex' : 'none';
      if (accountPasswordInput) accountPasswordInput.autocomplete = isRegister ? 'new-password' : 'current-password';
    };
    const startSession = (accountId) => {
      currentAccountId = accountId;
      localStorage.setItem(SESSION_KEY, accountId);
      save = loadSave();
      const account = getCurrentAccount();
      if (!save.playerName) save.playerName = account?.playerName || accountId;
      saveGame();
      updateProfileUi();
      renderInventory();
      AudioFX.playUiSound();
      if (activeScene) activeScene.scene.restart();
    };
    const registerLocalAccount = () => {
      const accountId = normalizeAccountId(accountIdInput?.value);
      const password = accountPasswordInput?.value || '';
      const playerName = cleanDisplayName(playerNameInput?.value || '');
      if (accountId.length < 3) { toast('아이디는 3글자 이상 입력하세요.'); return; }
      if (password.length < 4) { toast('비밀번호는 4글자 이상 입력하세요.'); return; }
      if (!playerName) { toast('캐릭터 표시 이름을 입력하세요.'); return; }
      const accounts = loadAccounts();
      if (accounts[accountId]) { toast('이미 존재하는 계정입니다.'); return; }
      accounts[accountId] = { password, playerName, createdAt: Date.now() };
      saveAccounts(accounts);
      currentAccountId = accountId;
      localStorage.setItem(SESSION_KEY, accountId);
      save = freshSave();
      save.playerName = playerName;
      localStorage.setItem(accountSaveKey(accountId), JSON.stringify(save));
      updateProfileUi();
      renderInventory();
      AudioFX.playUiSound();
      toast('계정 생성 완료. 직업을 선택하세요.');
      showClassSelect();
      if (activeScene) activeScene.scene.restart();
    };
    const loginLocalAccount = () => {
      const accountId = normalizeAccountId(accountIdInput?.value);
      const password = accountPasswordInput?.value || '';
      const accounts = loadAccounts();
      if (!accounts[accountId]) { toast('없는 계정입니다. 계정 만들기를 눌러주세요.'); return; }
      if (accounts[accountId].password !== password) { toast('비밀번호가 맞지 않습니다.'); return; }
      startSession(accountId);
      toast(save.baseClass ? '로그인 완료. 이어하기를 누르세요.' : '로그인 완료. 직업을 선택하세요.');
      if (!save.baseClass) showClassSelect();
    };
    $('showLoginButton')?.addEventListener('click', () => setAuthMode('login'));
    $('showRegisterButton')?.addEventListener('click', () => setAuthMode('register'));
    $('loginButton')?.addEventListener('click', loginLocalAccount);
    $('registerButton')?.addEventListener('click', registerLocalAccount);
    [accountIdInput, accountPasswordInput, playerNameInput].forEach((input) => {
      input?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') (document.activeElement === playerNameInput ? registerLocalAccount : loginLocalAccount)();
      });
    });
    setAuthMode('login');    $('continueButton')?.addEventListener('click', () => {
      if (!save.baseClass) { showClassSelect(); return; }
      hideStartScreen();
      AudioFX.playUiSound();
    });
    $('newGameButton')?.addEventListener('click', () => {
      if (save.baseClass && !confirm('기존 캐릭터를 지우고 새로 시작할까요?')) return;
      const playerName = save.playerName || cleanDisplayName($('playerNameInput')?.value || '') || getCurrentAccount()?.playerName || '플레이어';
      save = freshSave();
      save.playerName = playerName;
      saveGame();
      updateProfileUi();
      showClassSelect();
    });
    $('menuInventoryButton')?.addEventListener('click', () => { renderInventory(); $('inventoryModal').classList.add('visible'); });
    $('inventoryButton').addEventListener('click', () => { renderInventory(); $('inventoryModal').classList.add('visible'); AudioFX.playUiSound(); });
    $('closeInventory').addEventListener('click', () => $('inventoryModal').classList.remove('visible'));
    $('saveButton').addEventListener('click', () => { saveGame(); toast('저장 완료'); });
    $('resetButton').addEventListener('click', () => {
      if (!confirm('현재 캐릭터 데이터를 초기화할까요? 계정은 유지됩니다.')) return;
      const account = getCurrentAccount();
      const playerName = account?.playerName || save.playerName || '';
      localStorage.removeItem(currentAccountId ? accountSaveKey(currentAccountId) : SAVE_KEY);
      save = freshSave();
      save.playerName = playerName;
      if (currentAccountId) localStorage.setItem(accountSaveKey(currentAccountId), JSON.stringify(save));
      renderInventory();
      updateProfileUi();
      toast('캐릭터 정보 초기화 완료');
      if (save.playerName) showClassSelect();
      else showStartScreen();
      if (activeScene) activeScene.scene.restart();
    });
    document.addEventListener('pointerdown', () => AudioFX.unlock(), { once: true });
    document.addEventListener('keydown', () => AudioFX.unlock(), { once: true });
    document.querySelectorAll('[data-touch]').forEach((button) => {
      const name = button.dataset.touch;
      const set = (value) => { touchState[name] = value; button.classList.toggle('active', value); };
      button.addEventListener('pointerdown', (event) => { event.preventDefault(); set(true); });
      button.addEventListener('pointerup', (event) => { event.preventDefault(); set(false); });
      button.addEventListener('pointercancel', () => set(false));
      button.addEventListener('pointerleave', () => set(false));
    });
    updateProfileUi();
    if ($('startScreen')) $('startScreen').classList.add('visible');
  }
  class GameScene extends Phaser.Scene {
    constructor() {
      super('GameScene');
      this.cooldowns = {};
      this.buffs = {};
      this.touchLast = {};
      this.comboCount = 0;
      this.comboStep = 0;
      this.lastComboHitAt = 0;
      this.lastGroundedAt = 0;
      this.jumpBufferedAt = -9999;
      this.nextAttackAt = 0;
      this.nextHazardTickAt = 0;
      this.chronoFrozenUntil = 0;
    }

    preload() {}

    create() {
      activeScene = this;
      this.createTextures();
      this.stats = getBaseStats();
      this.playerHp = save.hp > 0 ? Math.min(save.hp, this.stats.hp) : this.stats.hp;
      this.playerMp = save.mp > 0 ? Math.min(save.mp, this.stats.mp) : this.stats.mp;
      this.interactables = [];
      this.hazards = [];
      this.enemySprites = [];
      this.projectiles = this.physics.add.group();
      this.platforms = this.physics.add.staticGroup();
      this.physics.world.setBounds(0, 0, 3600, 720);
      this.cameras.main.setBounds(0, 0, 3600, 720);
      this.cameras.main.setRoundPixels(true);
      this.cameras.main.fadeIn(280, 0, 0, 0);
      this.buildZone(save.zone || 'town');
      this.createPlayer();
      this.enemyGroup = this.physics.add.group({ allowGravity: true });
      this.physics.add.collider(this.player, this.platforms);
      this.physics.add.collider(this.enemyGroup, this.platforms);
      this.physics.add.collider(this.projectiles, this.platforms, (projectile) => projectile.destroy());
      this.physics.add.overlap(this.player, this.enemyGroup, (player, enemy) => this.onPlayerEnemyOverlap(enemy));
      this.spawnZoneEnemies();
      this.keys = this.input.keyboard.addKeys({
        left: 'A', right: 'D', jump: 'SPACE', attack: 'X', skillZ: 'Z', skillC: 'C', skillV: 'V', skillR: 'R', interact: 'E', inventory: 'I'
      });
      this.cursors = this.input.keyboard.createCursorKeys();
      this.input.mouse?.disableContextMenu();
      this.input.on('pointerdown', (pointer) => this.handlePointerAttack(pointer));
      this.cameras.main.startFollow(this.player, true, 0.08, 0.08, 0, 90);
      renderSkills(this);
      renderInventory();
      if (!save.baseClass || $("startScreen")?.classList.contains("visible")) this.physics.pause();
    }

    createTextures() {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const makeRect = (key, w, h, color, stroke = 0xffffff) => {
        if (this.textures.exists(key)) return;
        g.clear();
        g.fillStyle(color, 1).fillRoundedRect(1, 1, w - 2, h - 2, 6);
        g.lineStyle(2, stroke, 0.55).strokeRoundedRect(1, 1, w - 2, h - 2, 6);
        g.generateTexture(key, w, h);
      };
      const drawHero = (key, palette, weapon) => {
        if (this.textures.exists(key)) return;
        g.clear();
        g.fillStyle(0x000000, 0.26).fillEllipse(36, 86, 42, 8);
        if (palette.cape) {
          g.fillStyle(palette.cape, 0.82).fillTriangle(23, 29, 49, 29, 56, 78);
          g.fillStyle(palette.capeDark, 0.75).fillTriangle(24, 31, 35, 78, 17, 79);
        }
        if (weapon === 'chrono') {
          g.lineStyle(4, 0x67d9ff, 0.92).strokeCircle(36, 43, 32);
          g.lineStyle(2, 0xffffff, 0.5).strokeCircle(36, 43, 22);
        }
        g.fillStyle(palette.boot, 1).fillRoundedRect(22, 67, 10, 17, 3).fillRoundedRect(40, 67, 10, 17, 3);
        g.fillStyle(palette.leg, 1).fillRoundedRect(24, 51, 9, 23, 4).fillRoundedRect(39, 51, 9, 23, 4);
        g.fillStyle(palette.arm, 1).fillRoundedRect(13, 34, 12, 29, 5).fillRoundedRect(47, 34, 12, 29, 5);
        g.fillStyle(palette.trim, 1).fillRoundedRect(17, 30, 38, 13, 6);
        g.fillStyle(palette.body, 1).fillRoundedRect(22, 29, 28, 39, 7);
        g.fillStyle(palette.bodyDark, 0.8).fillTriangle(24, 35, 49, 35, 38, 67);
        g.fillStyle(palette.trim, 1).fillRect(25, 45, 22, 4);
        g.fillStyle(palette.skin, 1).fillCircle(36, 19, 12);
        g.fillStyle(palette.hair, 1).fillRoundedRect(24, 9, 24, 12, 6);
        g.fillStyle(palette.hair, 1).fillTriangle(25, 18, 18, 32, 30, 23).fillTriangle(48, 18, 54, 32, 42, 23);
        g.fillStyle(0xffffff, 0.95).fillRect(31, 18, 3, 2).fillRect(40, 18, 3, 2);
        g.fillStyle(palette.trim, 1).fillCircle(21, 35, 5).fillCircle(51, 35, 5);
        if (weapon === 'sword') {
          g.fillStyle(0x2a0d0d, 1).fillTriangle(24, 10, 12, 1, 27, 5).fillTriangle(48, 10, 60, 1, 45, 5);
          g.fillStyle(0x151015, 1).fillTriangle(18, 34, 6, 27, 14, 47).fillTriangle(54, 34, 66, 27, 58, 47);
          g.lineStyle(3, 0xffd166, 0.95).strokeCircle(36, 46, 8);
          g.fillStyle(0xff3b30, 0.9).fillCircle(36, 46, 4);
        } else if (weapon === 'bow') {
          g.fillStyle(0x0d2534, 0.95).fillTriangle(36, 2, 17, 26, 55, 26);
          g.fillStyle(0xd4f1ff, 0.95).fillRect(27, 20, 18, 3);
          g.fillStyle(0x0a1118, 1).fillRoundedRect(10, 25, 8, 37, 4);
          g.lineStyle(2, 0xd4f1ff, 0.85).lineBetween(12, 23, 7, 9).lineBetween(15, 25, 12, 8).lineBetween(17, 29, 17, 10);
        } else if (weapon === 'staff') {
          g.fillStyle(0x2a1847, 1).fillTriangle(36, -2, 20, 24, 52, 24);
          g.lineStyle(3, 0xe9d6ff, 0.9).lineBetween(36, -2, 20, 24).lineBetween(20, 24, 52, 24).lineBetween(52, 24, 36, -2);
          g.fillStyle(0xb388ff, 0.65).fillCircle(15, 35, 5).fillCircle(57, 50, 4).fillCircle(18, 59, 3);
          g.lineStyle(2, 0xffffff, 0.55).strokeCircle(36, 44, 18);
        } else if (weapon === 'daggers') {
          g.fillStyle(0x07100c, 1).fillRoundedRect(24, 16, 24, 11, 5);
          g.fillStyle(0x8aff80, 1).fillRect(30, 20, 5, 2).fillRect(39, 20, 5, 2);
          g.fillStyle(0x11251b, 0.95).fillTriangle(49, 26, 68, 31, 50, 39);
          g.lineStyle(2, 0x8aff80, 0.7).lineBetween(18, 62, 4, 77).lineBetween(54, 62, 68, 77);
        } else if (weapon === 'scythe') {
          g.fillStyle(0x050306, 0.98).fillTriangle(36, 2, 17, 31, 55, 31);
          g.fillStyle(0xd7c8ff, 0.9).fillRoundedRect(29, 15, 14, 11, 5);
          g.fillStyle(0xba55d3, 0.58).fillCircle(16, 29, 4).fillCircle(58, 57, 5).fillCircle(12, 68, 3);
          g.lineStyle(2, 0xba55d3, 0.75).strokeCircle(36, 45, 25);
        } else if (weapon === 'chrono') {
          g.lineStyle(3, 0x67d9ff, 0.9).strokeCircle(36, 18, 17);
          g.lineStyle(2, 0xffffff, 0.75).lineBetween(36, 18, 36, 8).lineBetween(36, 18, 46, 22);
          g.fillStyle(0x67d9ff, 0.78).fillCircle(17, 31, 4).fillCircle(56, 56, 4).fillCircle(19, 66, 3).fillCircle(52, 28, 3);
          g.lineStyle(2, 0x67d9ff, 0.55).strokeRoundedRect(18, 28, 36, 41, 8);
        }
        if (weapon === 'sword') {
          g.lineStyle(8, 0xd7e4ff, 1).lineBetween(53, 15, 58, 78);
          g.lineStyle(2, 0x111111, 0.9).lineBetween(53, 15, 58, 78);
          g.fillStyle(0xffd166, 1).fillRect(48, 54, 17, 5);
        } else if (weapon === 'bow') {
          g.lineStyle(4, 0xd4f1ff, 1).strokeCircle(54, 43, 18);
          g.lineStyle(2, 0x10141d, 1).lineBetween(54, 25, 54, 61);
          g.fillStyle(0xd4f1ff, 1).fillTriangle(38, 40, 54, 36, 54, 44);
        } else if (weapon === 'staff') {
          g.lineStyle(5, 0xe9d6ff, 1).lineBetween(54, 15, 49, 78);
          g.fillStyle(0xb388ff, 1).fillCircle(55, 13, 8);
          g.lineStyle(2, 0xffffff, 0.8).strokeCircle(55, 13, 11);
        } else if (weapon === 'daggers') {
          g.lineStyle(5, 0x8aff80, 1).lineBetween(16, 45, 3, 32).lineBetween(55, 45, 69, 32);
          g.fillStyle(0xd7e4ff, 1).fillTriangle(2, 31, 9, 34, 5, 25).fillTriangle(70, 31, 63, 34, 67, 25);
        } else if (weapon === 'scythe') {
          g.lineStyle(6, 0xe8d7ff, 1).lineBetween(55, 10, 45, 82);
          g.fillStyle(0xba55d3, 1).fillTriangle(55, 9, 70, 15, 55, 25);
          g.fillStyle(0x191020, 1).fillTriangle(57, 13, 67, 16, 57, 20);
        } else if (weapon === 'chrono') {
          g.lineStyle(4, 0x67d9ff, 1).strokeCircle(58, 32, 12);
          g.fillStyle(0xffffff, 0.9).fillCircle(58, 32, 3);
        }
        g.lineStyle(2, 0x050505, 0.62).strokeRoundedRect(22, 29, 28, 39, 7);
        g.generateTexture(key, 72, 92);
      };
      const drawMonster = () => {
        if (this.textures.exists('monster')) return;
        g.clear();
        g.fillStyle(0x000000, 0.25).fillEllipse(24, 40, 38, 8);
        g.fillStyle(0x31121a, 1).fillTriangle(13, 13, 4, 1, 19, 9).fillTriangle(35, 13, 44, 1, 29, 9);
        g.fillStyle(0xff6a21, 1).fillRoundedRect(7, 8, 34, 31, 11);
        g.fillStyle(0x5b1b18, 1).fillRoundedRect(12, 27, 24, 17, 7);
        g.fillStyle(0xffffff, 1).fillRect(16, 19, 4, 4).fillRect(29, 19, 4, 4);
        g.fillStyle(0x151515, 1).fillRect(17, 20, 2, 2).fillRect(30, 20, 2, 2);
        g.generateTexture('monster', 48, 48);
      };
      const drawBoss = () => {
        if (this.textures.exists('boss')) return;
        g.clear();
        g.fillStyle(0x000000, 0.28).fillEllipse(55, 100, 88, 13);
        g.fillStyle(0x401111, 1).fillRoundedRect(23, 20, 64, 79, 16);
        g.fillStyle(0xff3300, 1).fillRoundedRect(15, 34, 23, 45, 8).fillRoundedRect(72, 34, 23, 45, 8);
        g.fillStyle(0x8e1f16, 1).fillRoundedRect(33, 7, 44, 28, 12);
        g.fillStyle(0xffc857, 1).fillTriangle(34, 9, 20, 0, 42, 4).fillTriangle(76, 9, 91, 0, 68, 4);
        g.fillStyle(0xffffff, 1).fillRect(43, 23, 6, 5).fillRect(62, 23, 6, 5);
        g.lineStyle(3, 0xffd166, 0.7).strokeRoundedRect(27, 43, 56, 43, 10);
        g.generateTexture('boss', 110, 110);
      };
      drawHero('hero-berserker', { skin: 0xf2c894, hair: 0x342019, body: 0x9f2f2f, bodyDark: 0x5d1919, trim: 0xffd166, arm: 0x74302d, leg: 0x31202a, boot: 0x171015, cape: 0x5b161d, capeDark: 0x26080d }, 'sword');
      drawHero('hero-sniper', { skin: 0xe9c7a4, hair: 0x172736, body: 0x247f9e, bodyDark: 0x0d3f55, trim: 0xd4f1ff, arm: 0x1d5870, leg: 0x152b36, boot: 0x0b151b, cape: 0x102b3b, capeDark: 0x07141c }, 'bow');
      drawHero('hero-sorcerer', { skin: 0xe8c8a5, hair: 0x2a1847, body: 0x7148b8, bodyDark: 0x35205f, trim: 0xe9d6ff, arm: 0x56328f, leg: 0x24183f, boot: 0x120d22, cape: 0x3b216c, capeDark: 0x180b31 }, 'staff');
      drawHero('hero-assassin', { skin: 0xd2b08f, hair: 0x0f1614, body: 0x25332c, bodyDark: 0x111a16, trim: 0x8aff80, arm: 0x1d2923, leg: 0x111813, boot: 0x080c0a, cape: 0x18241e, capeDark: 0x070b09 }, 'daggers');
      drawHero('hero-reaper', { skin: 0xcdb8e8, hair: 0x0a070d, body: 0x17101d, bodyDark: 0x07040a, trim: 0xba55d3, arm: 0x1e1228, leg: 0x0c0712, boot: 0x050306, cape: 0x22102f, capeDark: 0x08030d }, 'scythe');
      drawHero('hero-chrono', { skin: 0xd7e8ff, hair: 0x0d2032, body: 0x14304c, bodyDark: 0x071827, trim: 0x67d9ff, arm: 0x1f5274, leg: 0x0d2335, boot: 0x06121e, cape: 0x102840, capeDark: 0x050d18 }, 'chrono');
      drawMonster();
      drawBoss();
      makeRect('arrow', 34, 8, 0xd4f1ff, 0x161616);
      makeRect('orb', 18, 18, 0xb388ff, 0xffffff);
      makeRect('slash', 46, 18, 0xffffff, 0xffd166);
      g.destroy();
    }

    getPlayerTextureKey() {
      if (save.path === 'mythic') return save.mythic === 'chrono' ? 'hero-chrono' : 'hero-reaper';
      return `hero-${save.baseClass || 'berserker'}`;
    }
    buildZone(zoneId) {
      this.zone = ZONES[zoneId] || ZONES.town;
      this.cameras.main.setBackgroundColor(this.zone.color);
      this.add.rectangle(1800, 680, 3600, 80, 0x1a1e29).setScrollFactor(1);
      this.add.text(28, 24, this.zone.title, { fontFamily: 'Consolas', fontSize: '28px', color: '#ffffff', stroke: '#000000', strokeThickness: 5 }).setScrollFactor(0);
      for (let i = 0; i < 16; i += 1) {
        const x = i * 260 + 80;
        const y = 90 + (i % 4) * 38;
        this.add.rectangle(x, y, 90 + (i % 3) * 32, 12, this.zone.accent, 0.14).setScrollFactor(0.35);
      }
      this.addPlatform(1800, 660, 3600, 80, 0x202636);
      if (save.zone === 'town') this.buildTown();
      else if (save.zone === 'arena') this.buildArena();
      else this.buildTerrainZone(save.zone);
    }

    addPlatform(x, y, w, h, color) {
      const rect = this.add.rectangle(x, y, w, h, color).setOrigin(0.5);
      this.physics.add.existing(rect, true);
      this.platforms.add(rect);
      return rect;
    }

    addHazard(x, y, w, h) {
      const hazard = this.add.rectangle(x, y, w, h, this.zone.hazard.color, 0.72).setOrigin(0.5);
      hazard.name = this.zone.hazard.name;
      this.physics.add.existing(hazard, true);
      this.hazards.push(hazard);
      this.add.text(x - w / 2 + 10, y - h / 2 - 22, this.zone.hazard.name, { fontFamily: 'Consolas', fontSize: '13px', color: '#fff' });
    }

    addInteractable(x, y, w, h, label, action, color = 0xffffff) {
      const box = this.add.rectangle(x, y, w, h, color, 0.18).setStrokeStyle(2, color, 0.85);
      const text = this.add.text(x, y - h / 2 - 20, label, { fontFamily: 'Consolas', fontSize: '14px', color: '#ffffff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
      this.physics.add.existing(box, true);
      this.interactables.push({ x, y, w, h, label, action, box, text });
    }

    buildTown() {
      this.addPlatform(560, 520, 230, 30, 0x2e3a50);
      this.addPlatform(1120, 450, 260, 30, 0x2e3a50);
      this.addPlatform(1650, 540, 260, 30, 0x2e3a50);
      this.addInteractable(280, 595, 150, 120, '용암 지대 [E]', () => this.travelTo('lava'), 0xff3300);
      this.addInteractable(520, 595, 150, 120, '서리 지대 [E]', () => this.travelTo('frost'), 0x67d9ff);
      this.addInteractable(760, 595, 150, 120, '유적 지대 [E]', () => this.travelTo('ruin'), 0xffd166);
      this.addInteractable(1000, 595, 150, 120, '심연 지대 [E]', () => this.travelTo('abyss'), 0xba55d3);
      this.addInteractable(1270, 595, 150, 120, '훈련장 [E]', () => this.travelTo('arena'), 0xffffff);
      this.addInteractable(1680, 592, 170, 120, '대장장이 [E]', () => this.tryTerrainEvolution(), 0xffb642);
      this.addInteractable(1930, 592, 170, 120, '보급 상인 [E]', () => this.buyPotion(), 0x8be9fd);
    }

    buildArena() {
      this.addPlatform(650, 535, 250, 28, 0x30384a);
      this.addPlatform(1800, 520, 350, 28, 0x30384a);
      this.addInteractable(120, 594, 130, 120, '마을 [E]', () => this.travelTo('town'), 0xffffff);
    }

    buildTerrainZone(zoneId) {
      this.addInteractable(110, 594, 130, 120, '마을 [E]', () => this.travelTo('town'), 0xffffff);
      this.addPlatform(650, 535, 280, 28, 0x2c3448);
      this.addPlatform(1160, 470, 260, 28, 0x2c3448);
      this.addPlatform(1700, 545, 310, 28, 0x2c3448);
      this.addPlatform(2290, 480, 360, 28, 0x2c3448);
      this.addHazard(925, 632, 300, 35);
      this.addHazard(1505, 632, 260, 35);
      this.addHazard(2600, 632, 420, 35);
      this.add.text(2870, 585, '보스 관문: 몬스터 10마리 처치', { fontFamily: 'Consolas', fontSize: '16px', color: '#fff', stroke: '#000', strokeThickness: 4 });
    }

    createPlayer() {
      const startX = save.zone === 'town' ? 150 : 135;
      this.player = this.physics.add.sprite(startX, 520, this.getPlayerTextureKey());
      this.player.setScale(1.08);
      this.player.setCollideWorldBounds(true);
      this.player.setDragX(1500);
      this.player.setMaxVelocity(720, 900);
      this.player.body.setSize(34, 62).setOffset(19, 24);
      this.facing = 1;
      this.refreshPlayerIdentity(false);
    }

    refreshPlayerIdentity(restartStats) {
      this.stats = getBaseStats();
      if (restartStats) {
        this.playerHp = this.stats.hp;
        this.playerMp = this.stats.mp;
      }
      this.player.setTexture(this.getPlayerTextureKey());
      this.player.clearTint();
      if (save.path === 'terrain' && save.terrain) {
        const terrainColor = Number(`0x${TERRAIN_JOBS[save.terrain].aura.slice(1)}`);
        this.player.setTint(terrainColor);
        this.ensurePlayerAura(terrainColor, 0.18);
      } else {
        const classColor = save.path === 'mythic' ? (save.mythic === 'chrono' ? 0x67d9ff : 0xba55d3) : (BASE_CLASSES[save.baseClass]?.color || 0xffd166);
        this.ensurePlayerAura(classColor, save.path === 'mythic' ? 0.16 : 0.09);
      }
      if (save.path === 'mythic') this.createShadowTwin();
      else if (this.shadowTwin) this.shadowTwin.setVisible(false);
      renderSkills(this);
      updateHud(this);
      updateProfileUi();
    }

    ensurePlayerAura(color, alpha = 0.15) {
      if (!this.playerAura) {
        this.playerAura = this.add.circle(this.player.x, this.player.y, 52, color, alpha).setDepth(4);
        this.playerAura.setStrokeStyle(2, color, 0.55);
      }
      this.playerAura.setRadius(52).setFillStyle(color, alpha).setStrokeStyle(2, color, 0.55).setVisible(true);
    }
    createShadowTwin() {
      if (this.shadowTwin) this.shadowTwin.destroy();
      this.shadowTwin = this.add.sprite(this.player.x - 18, this.player.y, this.getPlayerTextureKey()).setTint(0xba55d3).setAlpha(0.32);
      this.shadowTwin.setDepth(this.player.depth - 1);
    }

    travelTo(zoneId) {
      save.zone = zoneId;
      saveGame();
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.time.delayedCall(230, () => this.scene.restart());
    }

    spawnZoneEnemies() {
      if (save.zone === 'town') {
        this.spawnEnemy(2350, 510, { name: '훈련용 허수아비', hp: 999, atk: 0, exp: 0, gold: 0, tint: 0xeeeeee, dummy: true });
        return;
      }
      if (save.zone === 'arena') {
        this.spawnEnemy(1680, 500, { ...ZONES.arena.mob, dummy: true, patrol: 340 });
        this.spawnEnemy(2060, 500, { ...ZONES.arena.mob, dummy: true, patrol: 260 });
        return;
      }
      const zone = ZONES[save.zone];
      const positions = [520, 840, 1180, 1470, 1880, 2190, 2520, 2860];
      positions.forEach((x, index) => this.spawnEnemy(x, 510, { ...zone.mob, hp: zone.mob.hp + index * 5, patrol: 180 + index * 15 }));
      if ((save.zoneKills[save.zone] || 0) >= 10) this.spawnBoss();
    }

    spawnEnemy(x, y, config) {
      const sprite = this.physics.add.sprite(x, y, 'monster').setTint(config.tint || 0xffffff);
      sprite.setCollideWorldBounds(true);
      sprite.setBounce(0.02);
      sprite.body.setSize(36, 36).setOffset(3, 6);
      const maxHp = Math.round(config.hp * (1 + (save.level - 1) * 0.08));
      const data = {
        name: config.name, maxHp, hp: maxHp, atk: config.atk || 0, exp: config.exp || 0, gold: config.gold || 0,
        baseX: x, baseY: y, patrol: config.patrol || 160, dir: Math.random() > 0.5 ? 1 : -1, dead: false, dummy: !!config.dummy,
        attackAt: 0, respawnAt: 0, statuses: {}, boss: false, markDamage: 0
      };
      sprite.setData('enemy', data);
      data.nameText = this.add.text(x, y - 50, config.name, { fontFamily: 'Consolas', fontSize: '12px', color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
      data.hpBg = this.add.rectangle(x, y - 34, 46, 5, 0x111111);
      data.hpFill = this.add.rectangle(x - 23, y - 34, 46, 5, 0x3ee66b).setOrigin(0, 0.5);
      this.enemyGroup.add(sprite);
      this.enemySprites.push(sprite);
      return sprite;
    }

    spawnBoss() {
      if (this.bossSprite || !ZONES[save.zone]?.boss) return;
      const zoneBoss = ZONES[save.zone].boss;
      const sprite = this.physics.add.sprite(3230, 470, 'boss').setTint(zoneBoss.tint);
      sprite.setCollideWorldBounds(true);
      sprite.body.setSize(82, 96).setOffset(7, 8);
      const maxHp = Math.round(zoneBoss.hp * (1 + (save.level - 1) * 0.12));
      const data = {
        name: zoneBoss.name, maxHp, hp: maxHp, atk: zoneBoss.atk, exp: zoneBoss.exp, gold: zoneBoss.gold,
        baseX: 3230, baseY: 470, patrol: 260, dir: -1, dead: false, boss: true, attackAt: 0, statuses: {}, markDamage: 0
      };
      sprite.setData('enemy', data);
      data.nameText = this.add.text(sprite.x, sprite.y - 78, zoneBoss.name, { fontFamily: 'Consolas', fontSize: '15px', color: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
      data.hpBg = this.add.rectangle(sprite.x, sprite.y - 58, 112, 8, 0x111111);
      data.hpFill = this.add.rectangle(sprite.x - 56, sprite.y - 58, 112, 8, 0xff4545).setOrigin(0, 0.5);
      this.enemyGroup.add(sprite);
      this.enemySprites.push(sprite);
      this.bossSprite = sprite;
      AudioFX.playBossSound();
      toast(`${zoneBoss.name} 등장`);
    }

    update(time, delta) {
      if (!this.player || !save.baseClass) return;
      this.handleControls(time);
      this.updateHazards(time);
      this.updateEnemies(time, delta);
      this.updateStatuses(time, delta);
      this.updateEffects(time);
      this.updateInteractPrompt();
      if (save.zone !== 'town' && save.zone !== 'arena' && !this.bossSprite && (save.zoneKills[save.zone] || 0) >= 10) this.spawnBoss();
      if (time - this.lastComboHitAt > 2000 && this.comboCount) this.setCombo(0);
      updateHud(this);
      this.touchLast = { ...touchState };
    }

    handleControls(time) {
      const left = this.keys.left.isDown || this.cursors.left.isDown || touchState.left;
      const right = this.keys.right.isDown || this.cursors.right.isDown || touchState.right;
      const jumpPressed = this.justPressed('jump') || Phaser.Input.Keyboard.JustDown(this.cursors.up);
      const attackPressed = this.justPressed('attack');
      if (this.isTypingInField()) return;
      if (left) { this.player.setVelocityX(-this.stats.speed * this.buffSpeedMultiplier()); this.facing = -1; this.player.setFlipX(true); }
      else if (right) { this.player.setVelocityX(this.stats.speed * this.buffSpeedMultiplier()); this.facing = 1; this.player.setFlipX(false); }
      else this.player.setVelocityX(0);

      if (this.player.body.blocked.down || this.player.body.touching.down) this.lastGroundedAt = time;
      if (jumpPressed) this.jumpBufferedAt = time;
      if (time - this.jumpBufferedAt <= 100 && time - this.lastGroundedAt <= 150) {
        this.player.setVelocityY(-this.stats.jump);
        this.jumpBufferedAt = -9999;
        this.lastGroundedAt = -9999;
      }
      if (attackPressed) this.basicAttack(time);
      KEYS.forEach((key) => {
        if (this.justPressed(`skill${key}`)) this.useSkill(key, time);
      });
      if (Phaser.Input.Keyboard.JustDown(this.keys.inventory)) { renderInventory(); $('inventoryModal').classList.add('visible'); }
      if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) this.activateNearestInteractable();
    }

    justPressed(name) {
      const keyboard = this.keys[name] ? Phaser.Input.Keyboard.JustDown(this.keys[name]) : false;
      const touch = !!touchState[name] && !this.touchLast[name];
      return keyboard || touch;
    }

    isTypingInField() {
      const active = document.activeElement;
      return !!active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
    }

    isPointerOverUi(pointer) {
      const target = pointer?.event?.target;
      return !!target && !!target.closest?.('#startScreen, .modal, .touch-controls, button, input, textarea, select');
    }

    handlePointerAttack(pointer) {
      if (!this.player || !this.player.active || !save.baseClass) return;
      if (this.isPointerOverUi(pointer) || this.isTypingInField()) return;
      if (pointer.leftButtonDown()) {
        this.facing = pointer.worldX < this.player.x ? -1 : 1;
        this.player.setFlipX(this.facing < 0);
        this.basicAttack(this.time.now);
      }
    }

    buffSpeedMultiplier() {
      let mult = 1;
      if ((this.buffs.berserkUntil || 0) > this.time.now) mult += 0.4;
      if ((this.buffs.stealthUntil || 0) > this.time.now) mult += 0.12;
      return mult;
    }

    updateHazards(time) {
      if (!this.zone.hazard || time < this.nextHazardTickAt) return;
      const inHazard = this.hazards.some((hazard) => Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), hazard.getBounds()));
      if (inHazard) {
        this.damagePlayer(this.zone.hazard.damage, `${this.zone.hazard.name}`);
        this.nextHazardTickAt = time + 1000;
      }
    }

    updateEnemies(time, delta) {
      const playerHidden = (this.buffs.stealthUntil || 0) > time || (this.buffs.deathShroudUntil || 0) > time;
      this.enemySprites.forEach((enemy) => {
        const data = enemy.getData('enemy');
        if (!data) return;
        this.updateEnemyLabels(enemy);
        if (data.dead) return;
        const frozen = (data.statuses.freezeUntil || 0) > time || time < this.chronoFrozenUntil;
        if (frozen) { enemy.setVelocityX(0); enemy.setTint(0xaeefff); return; }
        if (data.statuses.tint) enemy.setTint(data.statuses.tint);
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        if (!playerHidden && dist < 400) {
          const dir = Math.sign(this.player.x - enemy.x) || data.dir;
          data.dir = dir;
          enemy.setVelocityX(dir * (data.boss ? 120 : 95));
          if (dist < (data.boss ? 92 : 54) && time > data.attackAt) {
            data.attackAt = time + (data.boss ? 1150 : 900);
            this.monsterAttack(enemy);
          }
        } else if (!data.dummy) {
          if (Math.abs(enemy.x - data.baseX) > data.patrol) data.dir *= -1;
          enemy.setVelocityX(data.dir * (data.boss ? 70 : 52));
        } else {
          enemy.setVelocityX(Math.sin(time / 500) * 70);
          if (enemy.body.blocked.down && Math.random() < 0.004) enemy.setVelocityY(-360);
        }
        enemy.setFlipX(enemy.body.velocity.x < 0);
      });
    }

    updateEnemyLabels(enemy) {
      const data = enemy.getData('enemy');
      if (!data.nameText) return;
      data.nameText.setPosition(enemy.x, enemy.y - (data.boss ? 78 : 50));
      data.hpBg.setPosition(enemy.x, enemy.y - (data.boss ? 58 : 34));
      data.hpFill.setPosition(enemy.x - (data.boss ? 56 : 23), enemy.y - (data.boss ? 58 : 34));
      data.hpFill.width = (data.boss ? 112 : 46) * clamp(data.hp / data.maxHp, 0, 1);
    }

    updateStatuses(time, delta) {
      this.enemySprites.forEach((enemy) => {
        const data = enemy.getData('enemy');
        if (!data || data.dead) return;
        if (data.statuses.poisonStacks && time > (data.statuses.nextPoisonAt || 0) && time < data.statuses.poisonUntil) {
          data.statuses.nextPoisonAt = time + 500;
          this.applyDamage(enemy, this.stats.atk * 0.2 * data.statuses.poisonStacks, { source: 'poison', canCrit: false, popupColor: '#8aff80' });
        }
        if (data.statuses.burnUntil && time > (data.statuses.nextBurnAt || 0) && time < data.statuses.burnUntil) {
          data.statuses.nextBurnAt = time + 500;
          this.applyDamage(enemy, this.stats.atk * 0.22, { source: 'burn', canCrit: false, popupColor: '#ff6a21' });
        }
        if (data.statuses.shockUntil && time > (data.statuses.nextShockAt || 0) && time < data.statuses.shockUntil) {
          data.statuses.nextShockAt = time + 700;
          this.applyDamage(enemy, this.stats.atk * 0.35, { source: 'shock', canCrit: false, popupColor: '#ffd166' });
        }
        if (data.statuses.doomUntil && time > data.statuses.doomUntil) {
          const damage = Math.max(this.stats.atk * 1.2, data.statuses.doomDamage || 0);
          data.statuses.doomUntil = 0;
          data.statuses.doomDamage = 0;
          this.applyDamage(enemy, damage, { source: 'doom', canCrit: false, popupColor: '#ba55d3' });
        }
      });
    }

    updateEffects(time) {
      if (this.playerAura?.visible) this.playerAura.setPosition(this.player.x, this.player.y + 2);
      if (this.shadowTwin) {
        this.shadowTwin.setTexture(this.getPlayerTextureKey());
        this.shadowTwin.setPosition(Phaser.Math.Linear(this.shadowTwin.x, this.player.x - this.facing * 18, 0.22), Phaser.Math.Linear(this.shadowTwin.y, this.player.y + 4, 0.22));
        this.shadowTwin.setFlipX(this.player.flipX);
        this.shadowTwin.setVisible(save.path === 'mythic');
      }
      const alpha = (this.buffs.stealthUntil || 0) > time || (this.buffs.deathShroudUntil || 0) > time ? 0.25 : 1;
      this.player.setAlpha(alpha);
    }

    updateInteractPrompt() {
      const nearest = this.getNearestInteractable();
      const prompt = $('prompt');
      if (!nearest) { prompt.classList.remove('visible'); return; }
      prompt.textContent = nearest.label;
      prompt.classList.add('visible');
    }

    getNearestInteractable() {
      let nearest = null;
      let best = Infinity;
      this.interactables.forEach((entry) => {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, entry.x, entry.y);
        if (dist < 115 && dist < best) { nearest = entry; best = dist; }
      });
      return nearest;
    }

    activateNearestInteractable() {
      const nearest = this.getNearestInteractable();
      if (nearest) nearest.action();
    }

    tryTerrainEvolution() {
      if (save.path === 'mythic') { toast('Mythic 각성이 지형 진화보다 우선합니다.'); return; }
      const material = save.inventory.find((item) => item.type === 'material' && TERRAIN_JOBS[item.zone]);
      if (!material) { toast('지형 보스 코어가 필요합니다.'); return; }
      save.path = 'terrain';
      save.terrain = material.zone;
      removeInventoryItem(material.id);
      saveGame();
      this.refreshPlayerIdentity(true);
      AudioFX.playAwakeSound();
      toast(`${getJobTitle()} 지형 진화 완료`);
    }

    buyPotion() {
      if (save.gold < 30) { toast('골드가 부족합니다'); return; }
      save.gold -= 30;
      addItem({ name: 'Field Potion', rarity: 'Common', type: 'consumable', desc: '판매하거나 나중에 회복 시스템 확장에 사용' });
      updateHud(this);
    }

    onPlayerEnemyOverlap(enemy) {
      const data = enemy?.getData?.('enemy');
      if (!data || data.dead || data.dummy) return;
      if (this.time.now < (data.contactDamageAt || 0)) return;
      data.contactDamageAt = this.time.now + 850;
      const push = Math.sign(this.player.x - enemy.x) || 1;
      this.player.setVelocityX(push * 240);
      this.player.setVelocityY(Math.min(this.player.body.velocity.y, -120));
      this.damagePlayer(Math.max(1, Math.round((data.atk || 1) * 0.45)), data.name);
    }
    monsterAttack(enemy) {
      const data = enemy.getData('enemy');
      const damage = data.boss ? data.atk : data.atk + save.level;
      this.spawnEnemyAttackFx(enemy.x, enemy.y, data.boss ? 95 : 55);
      this.damagePlayer(damage, data.name);
    }

    spawnEnemyAttackFx(x, y, radius) {
      const circle = this.add.circle(x, y, radius, 0xff4a4a, 0.18).setDepth(8);
      this.tweens.add({ targets: circle, alpha: 0, scale: 1.5, duration: 220, onComplete: () => circle.destroy() });
    }

    damagePlayer(amount, source) {
      if ((this.buffs.invincibleUntil || 0) > this.time.now) return;
      let finalDamage = amount;
      if (this.buffs.manaShield && this.playerMp > 0) {
        const absorbed = finalDamage * 0.7;
        const mpCost = absorbed * 1.5;
        const actualMp = Math.min(this.playerMp, mpCost);
        this.playerMp -= actualMp;
        finalDamage -= actualMp / 1.5;
      }
      this.playerHp = Math.max(0, this.playerHp - finalDamage);
      this.buffs.invincibleUntil = this.time.now + 650;
      this.createDamagePopup(this.player.x, this.player.y - 46, `-${Math.ceil(finalDamage)}`, false, '#ff7070');
      this.cameras.main.shake(90, 0.006);
      if (this.playerHp <= 0) this.playerDefeated(source);
    }

    playerDefeated(source) {
      toast(`${source}에게 쓰러졌습니다. 마을로 귀환합니다.`);
      const stats = getBaseStats();
      this.playerHp = Math.ceil(stats.hp * 0.7);
      this.playerMp = stats.mp;
      save.zone = 'town';
      this.syncSaveFromPlayer();
      saveGame();
      this.time.delayedCall(450, () => this.scene.restart());
    }

    syncSaveFromPlayer() {
      if (!this.player) return;
      save.hp = Math.ceil(this.playerHp || 0);
      save.mp = Math.ceil(this.playerMp || 0);
    }

    basicAttack(time) {
      if (time < this.nextAttackAt) return;
      this.comboStep = time - (this.lastBasicAt || 0) > 700 ? 1 : (this.comboStep % 3) + 1;
      this.lastBasicAt = time;
      this.nextAttackAt = time + (save.baseClass === 'assassin' ? 135 : 185);
      this.createBasicSwingFx(this.comboStep);
      if (save.path === 'mythic') {
        this.spawnHitbox({ w: 118, h: 84, offsetX: 68, mult: 2.8, lifetime: 115, knockback: 245, element: 'mythic' });
        return;
      }
      const cls = save.baseClass;
      if (cls === 'berserker') this.berserkerBasic(this.comboStep);
      if (cls === 'sniper') this.sniperBasic(this.comboStep);
      if (cls === 'sorcerer') this.sorcererBasic(this.comboStep);
      if (cls === 'assassin') this.assassinBasic(this.comboStep);
    }

    berserkerBasic(step) {
      const table = [null, { w: 86, h: 58, mult: 1.28, stun: 120 }, { w: 92, h: 72, mult: 1.55, lift: -60 }, { w: 112, h: 88, mult: 2.25, knockback: 310 }];
      this.spawnHitbox({ ...table[step], offsetX: 66, lifetime: 130 });
    }

    sniperBasic(step) {
      if (step === 1) this.spawnProjectile({ texture: 'arrow', speed: 700, mult: 1.1, pierce: 0 });
      if (step === 2) {
        this.spawnProjectile({ texture: 'arrow', speed: 700, mult: 0.85, pierce: 0, offsetY: -8 });
        this.spawnProjectile({ texture: 'arrow', speed: 700, mult: 0.85, pierce: 0, offsetY: 8 });
      }
      if (step === 3) this.time.delayedCall(70, () => this.spawnProjectile({ texture: 'arrow', speed: 820, mult: 1.95, pierce: 2, scaleX: 2.0 }));
    }

    sorcererBasic(step) {
      if (step === 1) this.spawnProjectile({ texture: 'orb', speed: 460, mult: 1.18, splash: 28, tint: 0xff6a21, status: 'burn' });
      if (step === 2) this.spawnProjectile({ texture: 'orb', speed: 500, mult: 1.18, tint: 0x9ae7ff, status: 'slow' });
      if (step === 3) this.spawnProjectile({ texture: 'orb', speed: 610, mult: 1.58, tint: 0xfff06a, chain: 1, status: 'shock' });
    }

    assassinBasic(step) {
      const table = [null, { w: 66, h: 40, mult: 1.02, lifetime: 85 }, { w: 74, h: 48, mult: 1.16, lifetime: 95 }, { w: 86, h: 58, mult: 1.72, lifetime: 120, critBonus: 0.14, knockback: 180 }];
      this.spawnHitbox({ ...table[step], offsetX: 52 });
    }

    spawnHitbox(options) {
      const x = this.player.x + this.facing * (options.offsetX || 50);
      const y = this.player.y + (options.offsetY || 0);
      const zone = this.add.zone(x, y, options.w || 70, options.h || 54);
      this.physics.add.existing(zone);
      zone.body.setAllowGravity(false);
      zone.body.setImmovable(true);
      zone.hitTargets = new Set();
      const debug = this.add.rectangle(x, y, options.w || 70, options.h || 54, this.hitboxColor(options), 0.22).setDepth(7);
      this.tweens.add({ targets: debug, alpha: 0, scaleX: 1.12, duration: options.lifetime || 110, onComplete: () => debug.destroy() });
      this.physics.add.overlap(zone, this.enemyGroup, (hitbox, enemy) => {
        if (zone.hitTargets.has(enemy)) return;
        zone.hitTargets.add(enemy);
        this.applyDamage(enemy, this.calculateDamage(options.mult || 1), options);
      });
      this.time.delayedCall(options.lifetime || 120, () => zone.destroy());
      if (save.path === 'terrain') this.spawnElementParticles(x, y, options.w || 70, options.h || 54);
    }

    hitboxColor(options) {
      if (save.path === 'terrain') return Number(`0x${TERRAIN_JOBS[save.terrain].aura.slice(1)}`);
      if (save.path === 'mythic') return 0xba55d3;
      if (options.element === 'mythic') return 0xba55d3;
      return 0xffffff;
    }

    spawnProjectile(options) {
      const projectile = this.physics.add.sprite(this.player.x + this.facing * 32, this.player.y + (options.offsetY || -6), options.texture || 'arrow');
      projectile.setTint(options.tint || this.hitboxColor(options));
      projectile.setScale(options.scaleX || 1, options.scaleY || 1);
      projectile.setFlipX(this.facing < 0);
      projectile.body.setAllowGravity(false);
      projectile.setVelocity(Math.cos((options.angle || 0) * Math.PI / 180) * options.speed * this.facing, Math.sin((options.angle || 0) * Math.PI / 180) * options.speed);
      projectile.dataPayload = { ...options, remainingPierce: options.pierce || 0, hitTargets: new Set() };
      this.projectiles.add(projectile);
      this.physics.add.overlap(projectile, this.enemyGroup, (shot, enemy) => this.onProjectileHit(shot, enemy));
      this.time.delayedCall(options.life || 1800, () => projectile.destroy());
      if (save.path === 'terrain') this.spawnElementParticles(projectile.x, projectile.y, 24, 24);
      return projectile;
    }

    onProjectileHit(projectile, enemy) {
      if (!projectile.active || projectile.dataPayload.hitTargets.has(enemy)) return;
      const payload = projectile.dataPayload;
      payload.hitTargets.add(enemy);
      this.applyDamage(enemy, this.calculateDamage(payload.mult || 1), payload);
      if (payload.splash) this.splashDamage(enemy.x, enemy.y, payload.splash, payload.mult || 1, payload);
      if (payload.chain) this.chainDamage(enemy, payload.chain, payload.mult || 1, payload);
      if (payload.remainingPierce > 0) payload.remainingPierce -= 1;
      else projectile.destroy();
    }

    splashDamage(x, y, radius, mult, options) {
      this.add.circle(x, y, radius, this.hitboxColor(options), 0.18).setDepth(6);
      this.enemySprites.forEach((enemy) => {
        const data = enemy.getData('enemy');
        if (!data || data.dead) return;
        if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) this.applyDamage(enemy, this.calculateDamage(mult * 0.55), { ...options, canCrit: false });
      });
    }

    chainDamage(sourceEnemy, count, mult, options) {
      let chained = 0;
      this.enemySprites.forEach((enemy) => {
        if (enemy === sourceEnemy || chained >= count) return;
        const data = enemy.getData('enemy');
        if (!data || data.dead) return;
        if (Phaser.Math.Distance.Between(sourceEnemy.x, sourceEnemy.y, enemy.x, enemy.y) <= 90) {
          chained += 1;
          this.applyDamage(enemy, this.calculateDamage(mult * 0.65), { ...options, canCrit: false, popupColor: '#fff06a' });
          this.add.line(0, 0, sourceEnemy.x, sourceEnemy.y, enemy.x, enemy.y, 0xfff06a, 0.8).setOrigin(0).setDepth(9).destroy(true);
        }
      });
    }

    calculateDamage(mult) {
      const mythicBonus = save.path === 'mythic' ? 1.12 : 1;
      return (this.stats.atk * mult + save.level * 1.7) * terrainMultiplier() * mythicBonus;
    }

    applyDamage(enemy, rawDamage, options = {}) {
      const data = enemy.getData('enemy');
      if (!data || data.dead) return;
      let critChance = this.stats.crit + Math.floor(this.comboCount / 10) * 0.02 + (options.critBonus || 0);
      if ((this.buffs.berserkUntil || 0) > this.time.now) critChance += 0.15;
      let forceCrit = false;
      if ((this.buffs.focusHits || 0) > 0) { forceCrit = true; this.buffs.focusHits -= 1; }
      if ((this.buffs.stealthUntil || 0) > this.time.now || (this.buffs.deathShroudUntil || 0) > this.time.now) forceCrit = true;
      const crit = options.canCrit === false ? false : forceCrit || Math.random() < critChance;
      let damage = rawDamage * (crit ? 1.85 : 1);
      damage = Math.max(1, Math.round(damage));
      data.hp = Math.max(0, data.hp - damage);
      if (data.statuses.doomUntil) data.statuses.doomDamage = (data.statuses.doomDamage || 0) + damage;
      if (data.markedUntil && this.time.now < data.markedUntil) data.markDamage += damage;
      this.applyHitStatus(enemy, options);
      this.applyKnock(enemy, options);
      this.createDamagePopup(enemy.x, enemy.y - 40, damage, crit, options.popupColor);
      AudioFX[crit ? 'playCritSound' : 'playHitSound']();
      this.createHitSparks(enemy.x, enemy.y - 8, crit, options.popupColor);
      if (crit) this.criticalJuice();
      else this.normalHitJuice(enemy);
      this.setCombo(this.comboCount + 1);
      this.lastComboHitAt = this.time.now;
      if (this.buffs.deathShroudHeal) {
        this.playerHp = Math.min(this.stats.hp, this.playerHp + damage * 0.3);
        this.buffs.deathShroudHeal = false;
      }
      if (data.hp <= 0) this.killEnemy(enemy);
    }

    applyHitStatus(enemy, options) {
      const data = enemy.getData('enemy');
      const terrain = save.path === 'terrain' ? TERRAIN_JOBS[save.terrain].status : null;
      const status = options.status || terrain;
      if (status === 'burn') { data.statuses.burnUntil = this.time.now + 2500; data.statuses.tint = 0xff6a21; }
      if (status === 'freeze') { data.statuses.freezeUntil = this.time.now + 500; data.statuses.tint = 0xaeefff; }
      if (status === 'slow') { data.statuses.slowUntil = this.time.now + 2000; data.statuses.tint = 0x9ae7ff; }
      if (status === 'shock') { data.statuses.shockUntil = this.time.now + 1800; data.statuses.tint = 0xffd166; }
      if (status === 'poison') { data.statuses.poisonStacks = clamp((data.statuses.poisonStacks || 0) + 1, 1, 3); data.statuses.poisonUntil = this.time.now + 6000; data.statuses.tint = 0x8aff80; }
      if (status === 'doom') { data.statuses.doomUntil = this.time.now + 1800; data.statuses.doomDamage = (data.statuses.doomDamage || 0) + this.stats.atk; data.statuses.tint = 0xba55d3; }
    }

    applyKnock(enemy, options) {
      if (options.lift) enemy.setVelocityY(options.lift * 4);
      if (options.knockback) enemy.setVelocityX(this.facing * options.knockback);
      if (options.stun) enemy.getData('enemy').statuses.freezeUntil = this.time.now + options.stun;
    }

    createDamagePopup(x, y, value, crit, color) {
      const text = this.add.text(x, y, `${crit ? 'CRIT ' : ''}${value}`, {
        fontFamily: crit ? 'Arial Black' : 'Arial', fontSize: crit ? '36px' : '24px', fontStyle: 'bold',
        color: color || (crit ? '#ff2b2b' : '#ffffff'), stroke: '#000000', strokeThickness: crit ? 6 : 4
      }).setOrigin(0.5).setDepth(40);
      this.tweens.add({ targets: text, y: y - 55, x: x + Phaser.Math.Between(-24, 24), alpha: 0, duration: 600, ease: 'Quad.easeOut', onComplete: () => text.destroy() });
    }

    criticalJuice() {
      if (save.settings.shake) this.cameras.main.shake(120, 0.015);
      this.cameras.main.flash(60, 255, 255, 255);
      this.physics.world.pause();
      this.time.delayedCall(80, () => this.physics.world.resume());
    }

    setCombo(value) {
      this.comboCount = value;
      const tracker = $('comboTracker');
      tracker.textContent = `${value} 콤보`;
      tracker.classList.toggle('visible', value > 0);
      tracker.style.transform = value > 0 ? `scale(${1 + Math.min(value, 40) * 0.012})` : 'scale(0)';
    }

    killEnemy(enemy) {
      const data = enemy.getData('enemy');
      if (!data || data.dead) return;
      data.dead = true;
      enemy.body.enable = false;
      enemy.setVelocity(0, 0);
      if (!data.dummy) this.rewardEnemy(enemy);
      this.tweens.add({ targets: [enemy, data.nameText, data.hpBg, data.hpFill], alpha: 0, y: enemy.y - 20, duration: 420, onComplete: () => this.scheduleRespawn(enemy) });
    }

    rewardEnemy(enemy) {
      const data = enemy.getData('enemy');
      save.gold += data.gold;
      save.exp += data.exp;
      if (save.zone !== 'town' && save.zone !== 'arena' && !data.boss) save.zoneKills[save.zone] = (save.zoneKills[save.zone] || 0) + 1;
      while (save.exp >= expNeeded()) {
        save.exp -= expNeeded();
        save.level += 1;
        const stats = getBaseStats();
        this.stats = stats;
        this.playerHp = stats.hp;
        this.playerMp = stats.mp;
        toast(`레벨 업! Lv.${save.level}`);
      }
      if (data.boss) this.rewardBoss();
      else this.rollLoot(false);
      saveGame();
      updateHud(this);
    }

    rewardBoss() {
      const zone = ZONES[save.zone];
      save.bossKills[save.zone] = (save.bossKills[save.zone] || 0) + 1;
      save.defeatedBosses[save.zone] = true;
      addItem({ name: zone.material, rarity: 'Legendary', type: 'material', zone: save.zone, desc: `${zone.title} 지형 진화 재료` });
      if (Math.random() < 0.03) this.addMythicDrop();
    }

    rollLoot(boss) {
      if (Math.random() < 0.0005) { this.addMythicDrop(); return; }
      const roll = Math.random();
      if (roll < 0.05) addItem({ name: '전설 유물', rarity: 'Legendary', type: 'treasure', desc: '높은 가격에 판매 가능' });
      else if (roll < 0.14) addItem({ name: '영웅 보석', rarity: 'Epic', type: 'treasure', desc: '판매용 보석' });
      else if (roll < 0.34) addItem({ name: '희귀 합금', rarity: 'Rare', type: 'treasure', desc: '판매용 재료' });
      else if (roll < 0.62) addItem({ name: '몬스터 파편', rarity: 'Common', type: 'treasure', desc: '판매용 잡동사니' });
    }

    addMythicDrop() {
      const mythic = Phaser.Utils.Array.GetRandom(MYTHIC_ITEMS);
      addItem({ name: mythic.name, rarity: 'Mythic', type: 'mythic', mythic: mythic.mythic, desc: mythic.desc });
      this.cameras.main.flash(220, 186, 85, 211);
      AudioFX.playAwakeSound();
    }

    scheduleRespawn(enemy) {
      const data = enemy.getData('enemy');
      if (data.boss) {
        this.bossSprite = null;
        this.time.delayedCall(8000, () => {
          if (save.zone !== 'town' && save.zone !== 'arena') this.spawnBoss();
        });
        return;
      }
      this.time.delayedCall(3000, () => {
        data.dead = false;
        data.hp = data.maxHp;
        data.statuses = {};
        enemy.setPosition(data.baseX, data.baseY);
        enemy.setAlpha(1).setVisible(true).setActive(true);
        enemy.body.enable = true;
        data.nameText.setAlpha(1);
        data.hpBg.setAlpha(1);
        data.hpFill.setAlpha(1);
      });
    }

    spawnElementParticles(x, y, w, h) {
      const color = save.path === 'terrain' ? Number(`0x${TERRAIN_JOBS[save.terrain].aura.slice(1)}`) : 0xba55d3;
      for (let i = 0; i < 8; i += 1) {
        const dot = this.add.circle(x + Phaser.Math.Between(-w / 2, w / 2), y + Phaser.Math.Between(-h / 2, h / 2), Phaser.Math.Between(2, 4), color, 0.85).setDepth(12);
        this.tweens.add({ targets: dot, y: dot.y - Phaser.Math.Between(18, 44), x: dot.x + Phaser.Math.Between(-20, 20), alpha: 0, duration: 420, onComplete: () => dot.destroy() });
      }
    }

    useSkill(key, time) {
      const skill = getActiveSkills().find((entry) => entry.key === key);
      if (!skill) return;
      if ((this.cooldowns[key] || 0) > time) { toast('아직 재사용 대기 중입니다'); return; }
      if (this.playerMp < skill.mp) { toast('마나가 부족합니다'); return; }
      this.playerMp -= skill.mp;
      if (skill.cd > 0) this.cooldowns[key] = time + skill.cd;
      this.nextAttackAt = Math.min(this.nextAttackAt, time + 80);
      if (typeof this[skill.handler] === 'function') this[skill.handler]();
      updateHud(this);
    }

    powerSlash() { this.spawnHitbox({ w: 120, h: 64, offsetX: 82, mult: 2.5, lifetime: 140, knockback: 160 }); }

    leapAttack() {
      this.player.setVelocityY(-400);
      this.time.delayedCall(520, () => {
        this.damageRadius(this.player.x, this.player.y + 30, 100, 2.0, { stun: 800, popupColor: '#ff8060' });
        this.add.circle(this.player.x, this.player.y + 30, 100, this.hitboxColor({}), 0.22).setDepth(7);
      });
    }

    berserk() {
      this.buffs.berserkUntil = this.time.now + 10000;
      this.createAura('#ff3b30', 10000);
      toast('Berserk');
    }

    carnage() {
      for (let i = 0; i < 4; i += 1) {
        this.time.delayedCall(i * 100, () => this.spawnHitbox({ w: 200, h: 120, offsetX: 90, mult: 1.0, lifetime: 95, knockback: 70 }));
      }
    }

    multiShot() {
      [-15, 0, 15].forEach((angle) => this.spawnProjectile({ texture: 'arrow', speed: 640, mult: 1.1, angle, pierce: 0 }));
    }

    backstepArrow() {
      this.player.setVelocityX(-this.facing * 350);
      this.spawnProjectile({ texture: 'arrow', speed: 660, mult: 1.0, status: 'slow', tint: 0x9ae7ff });
    }

    focus() {
      this.buffs.focusHits = 3;
      const cross = this.add.text(this.player.x, this.player.y - 76, '◎', { fontFamily: 'Arial Black', fontSize: '34px', color: '#fffb96', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(30);
      this.tweens.add({ targets: cross, y: cross.y - 18, alpha: 0, duration: 1800, onComplete: () => cross.destroy() });
      toast('다음 3타 확정 크리티컬');
    }

    piercingStrike() {
      this.player.setVelocityX(0);
      const lineY = this.player.y - 8;
      const warn = this.add.rectangle(this.player.x + this.facing * 640, lineY, 1280, 32, 0xfff6a2, 0.18).setDepth(9);
      this.time.delayedCall(800, () => {
        warn.setFillStyle(0xfff6a2, 0.58);
        this.damageRect(this.player.x + this.facing * 640, lineY, 1280, 32, 5.0, { knockback: 420, popupColor: '#fff6a2' });
        this.tweens.add({ targets: warn, alpha: 0, duration: 180, onComplete: () => warn.destroy() });
      });
    }

    flameBurst() {
      const x = this.player.x + this.facing * 120;
      const y = this.player.y + 8;
      const rune = this.add.circle(x, y, 40, 0xff6a21, 0.22).setStrokeStyle(3, 0xfff2d0, 0.8).setDepth(8);
      this.time.delayedCall(200, () => {
        this.damageRadius(x, y, 80, 2.4, { lift: -350, status: 'burn', popupColor: '#ff6a21' });
        this.tweens.add({ targets: rune, scale: 1.8, alpha: 0, duration: 220, onComplete: () => rune.destroy() });
      });
    }

    iceBlink() {
      const oldX = this.player.x;
      const targetX = clamp(this.player.x + this.facing * 160, 60, 3540);
      this.buffs.invincibleUntil = this.time.now + 500;
      this.player.setX(targetX);
      this.damageRect((oldX + targetX) / 2, this.player.y, Math.abs(targetX - oldX) + 60, 86, 0.8, { status: 'freeze', canCrit: false, popupColor: '#9ae7ff' });
      this.createTrail(oldX, this.player.y, targetX, this.player.y, 0x9ae7ff);
    }

    manaShield() {
      this.buffs.manaShield = !this.buffs.manaShield;
      toast(this.buffs.manaShield ? 'Mana Shield ON' : 'Mana Shield OFF');
      if (this.shieldCircle) this.shieldCircle.destroy();
      if (this.buffs.manaShield) {
        this.shieldCircle = this.add.circle(0, 0, 42, 0x3fb6ff, 0.16).setStrokeStyle(2, 0x93dcff, 0.75).setDepth(6);
        this.time.addEvent({ delay: 16, loop: true, callback: () => {
          if (!this.buffs.manaShield || !this.shieldCircle?.active) return;
          this.shieldCircle.setPosition(this.player.x, this.player.y);
        }});
      }
    }

    meteorStrike() {
      for (let i = 0; i < 3; i += 1) {
        const x = this.player.x + Phaser.Math.Between(-320, 520);
        const meteor = this.add.circle(x, 60, 28, 0xff5a21, 0.92).setDepth(12);
        this.tweens.add({ targets: meteor, y: 620, duration: 620 + i * 120, ease: 'Quad.easeIn', onComplete: () => {
          this.damageRadius(meteor.x, 620, 120, 3.0, { status: 'burn', popupColor: '#ff6a21' });
          this.cameras.main.shake(80, 0.008);
          meteor.destroy();
        }});
      }
    }

    shadowStrike() {
      const target = this.nearestEnemy(300);
      if (!target) { toast('범위 안에 대상이 없습니다'); return; }
      const stealth = (this.buffs.stealthUntil || 0) > this.time.now;
      this.player.setPosition(target.x - this.facing * 46, target.y);
      this.applyDamage(target, this.calculateDamage(stealth ? 4.0 : 2.0), { critBonus: stealth ? 1 : 0, popupColor: '#ba55d3' });
      this.buffs.stealthUntil = 0;
    }

    poisonBlade() { this.spawnProjectile({ texture: 'slash', speed: 660, mult: 0.9, status: 'poison', tint: 0x8aff80 }); }

    stealth() {
      this.buffs.stealthUntil = this.time.now + 4000;
      this.createAura('#8aff80', 4000);
      toast('Stealth');
    }

    phantomFrenzy() {
      this.buffs.invincibleUntil = this.time.now + 1400;
      this.player.setVisible(false);
      for (let i = 0; i < 8; i += 1) {
        this.time.delayedCall(i * 90, () => {
          const target = this.nearestEnemy(360);
          const x = target ? target.x + Phaser.Math.Between(-90, 90) : this.player.x + this.facing * Phaser.Math.Between(60, 220);
          const y = target ? target.y + Phaser.Math.Between(-45, 45) : this.player.y;
          this.damageRadius(x, y, 72, 0.6, { critBonus: 0.15, popupColor: '#d7a8ff' });
          this.createSlashFx(x, y, 0xba55d3);
        });
      }
      this.time.delayedCall(850, () => this.player.setVisible(true));
    }

    reaperSweep() { this.spawnHitbox({ w: 180, h: 130, offsetX: 105, mult: 4.5, lifetime: 150, knockback: 340, popupColor: '#d7a8ff' }); }

    soulDash() {
      const oldX = this.player.x;
      const targetX = clamp(this.player.x + this.facing * 600, 80, 3520);
      this.player.setX(targetX);
      this.damageRect((oldX + targetX) / 2, this.player.y, Math.abs(targetX - oldX) + 80, 88, 2.0, { status: 'doom', popupColor: '#ba55d3' });
      this.createTrail(oldX, this.player.y, targetX, this.player.y, 0x120812);
    }

    deathShroud() {
      this.buffs.deathShroudUntil = this.time.now + 3000;
      this.buffs.deathShroudHeal = true;
      this.createAura('#ba55d3', 3000);
      toast('Death Shroud');
    }

    doomsdayMark() {
      const view = this.cameras.main.worldView;
      this.enemySprites.forEach((enemy) => {
        const data = enemy.getData('enemy');
        if (!data || data.dead || !view.contains(enemy.x, enemy.y)) return;
        data.markedUntil = this.time.now + 3000;
        data.markDamage = 0;
        const mark = this.add.text(enemy.x, enemy.y - 84, '☠', { fontFamily: 'Arial Black', fontSize: '30px', color: '#ba55d3', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(30);
        this.tweens.add({ targets: mark, y: mark.y - 16, alpha: 0.45, duration: 3000, onComplete: () => mark.destroy() });
      });
      this.time.delayedCall(3000, () => {
        this.enemySprites.forEach((enemy) => {
          const data = enemy.getData('enemy');
          if (!data || data.dead || !data.markDamage) return;
          this.applyDamage(enemy, data.markDamage * 0.5, { canCrit: false, popupColor: '#ba55d3' });
          data.markDamage = 0;
        });
      });
    }

    spaceTimeCollapse() {
      const x = this.player.x + this.facing * 150;
      const y = this.player.y;
      const vortex = this.add.circle(x, y, 75, 0x101018, 0.72).setStrokeStyle(4, 0xba55d3, 0.9).setDepth(10);
      this.tweens.add({ targets: vortex, scale: 1.35, angle: 360, duration: 600, repeat: 4, yoyo: true });
      let ticks = 0;
      const event = this.time.addEvent({ delay: 300, repeat: 9, callback: () => {
        ticks += 1;
        this.enemySprites.forEach((enemy) => {
          const data = enemy.getData('enemy');
          if (!data || data.dead) return;
          const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
          if (dist <= 340) {
            this.physics.moveTo(enemy, x, y, 240 + ticks * 14);
            if (dist <= 150) this.applyDamage(enemy, this.calculateDamage(1.5), { canCrit: false, popupColor: '#d7a8ff' });
          }
        });
        if (ticks >= 10) vortex.destroy();
      }});
    }

    paradoxBlink() {
      const pointer = this.input.activePointer;
      const x = clamp(pointer.worldX || this.player.x, 40, 3560);
      const y = clamp(pointer.worldY || this.player.y, 80, 620);
      this.createTrail(this.player.x, this.player.y, x, y, 0xba55d3);
      this.player.setPosition(x, y);
      this.buffs.invincibleUntil = this.time.now + 250;
    }

    temporalRewind() {
      const missing = this.stats.hp - this.playerHp;
      this.playerHp = Math.min(this.stats.hp, this.playerHp + missing * 0.4);
      this.cooldowns.Z = 0;
      this.createAura('#67d9ff', 800);
      toast('Temporal Rewind');
    }

    chronoFreeze() {
      this.chronoFrozenUntil = this.time.now + 4000;
      this.enemySprites.forEach((enemy) => {
        const data = enemy.getData('enemy');
        if (!data || data.dead) return;
        enemy.body.allowGravity = false;
        enemy.setVelocity(0, 0);
      });
      this.time.delayedCall(4000, () => this.enemySprites.forEach((enemy) => { if (enemy.body) enemy.body.allowGravity = true; }));
      this.cameras.main.flash(120, 180, 220, 255);
      toast('Chrono Freeze');
    }

    nearestEnemy(range) {
      let best = null;
      let bestDist = range;
      this.enemySprites.forEach((enemy) => {
        const data = enemy.getData('enemy');
        if (!data || data.dead) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        if (dist <= bestDist) { best = enemy; bestDist = dist; }
      });
      return best;
    }

    damageRadius(x, y, radius, mult, options = {}) {
      const circle = this.add.circle(x, y, radius, this.hitboxColor(options), 0.2).setDepth(8);
      this.tweens.add({ targets: circle, alpha: 0, scale: 1.25, duration: 260, onComplete: () => circle.destroy() });
      this.enemySprites.forEach((enemy) => {
        const data = enemy.getData('enemy');
        if (!data || data.dead) return;
        if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) this.applyDamage(enemy, this.calculateDamage(mult), options);
      });
      if (save.path === 'terrain') this.spawnElementParticles(x, y, radius, radius);
    }

    damageRect(x, y, w, h, mult, options = {}) {
      const rect = new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h);
      const fx = this.add.rectangle(x, y, w, h, this.hitboxColor(options), 0.2).setDepth(8);
      this.tweens.add({ targets: fx, alpha: 0, duration: 240, onComplete: () => fx.destroy() });
      this.enemySprites.forEach((enemy) => {
        const data = enemy.getData('enemy');
        if (!data || data.dead) return;
        if (rect.contains(enemy.x, enemy.y)) this.applyDamage(enemy, this.calculateDamage(mult), options);
      });
    }

    createAura(color, duration) {
      const aura = this.add.circle(this.player.x, this.player.y, 46, Phaser.Display.Color.HexStringToColor(color).color, 0.14).setDepth(5);
      const event = this.time.addEvent({ delay: 16, repeat: Math.ceil(duration / 16), callback: () => aura.setPosition(this.player.x, this.player.y) });
      this.tweens.add({ targets: aura, alpha: 0.32, scale: 1.12, duration: 360, yoyo: true, repeat: Math.floor(duration / 720), onComplete: () => aura.destroy() });
    }

    createTrail(x1, y1, x2, y2, color) {
      const line = this.add.line(0, 0, x1, y1, x2, y2, color, 0.8).setOrigin(0).setDepth(20);
      this.tweens.add({ targets: line, alpha: 0, duration: 260, onComplete: () => line.destroy() });
    }

    createBasicSwingFx(step) {
      const color = this.hitboxColor({ element: save.path === 'mythic' ? 'mythic' : null });
      const x = this.player.x + this.facing * (step === 3 ? 62 : 48);
      const y = this.player.y - 2;
      const angle = this.facing > 0 ? [-22, 8, 30][step - 1] : [202, 172, 150][step - 1];
      const slash = this.add.ellipse(x, y, step === 3 ? 138 : 104, step === 3 ? 50 : 36, color, step === 3 ? 0.34 : 0.26)
        .setAngle(angle)
        .setDepth(24)
        .setBlendMode(Phaser.BlendModes.ADD);
      const edge = this.add.rectangle(x + this.facing * 15, y - 2, step === 3 ? 116 : 84, 7, 0xffffff, 0.74)
        .setAngle(angle)
        .setDepth(25)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: [slash, edge], alpha: 0, scaleX: 1.45, scaleY: 1.18, duration: step === 3 ? 150 : 115, ease: 'Quad.easeOut', onComplete: () => { slash.destroy(); edge.destroy(); } });
      this.tweens.add({ targets: this.player, scaleX: 1.06, scaleY: 0.96, duration: 55, yoyo: true });
    }

    createHitSparks(x, y, crit, color) {
      const sparkColor = color ? Phaser.Display.Color.HexStringToColor(color).color : (crit ? 0xfff06a : 0xffffff);
      const count = crit ? 14 : 8;
      for (let i = 0; i < count; i += 1) {
        const spark = this.add.rectangle(x, y, crit ? 18 : 12, crit ? 4 : 3, sparkColor, crit ? 0.95 : 0.78)
          .setAngle(Phaser.Math.Between(0, 180))
          .setDepth(32)
          .setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: spark,
          x: x + Phaser.Math.Between(-34, 34),
          y: y + Phaser.Math.Between(-28, 24),
          alpha: 0,
          scaleX: 0.25,
          duration: crit ? 260 : 190,
          ease: 'Quad.easeOut',
          onComplete: () => spark.destroy()
        });
      }
    }

    normalHitJuice(enemy) {
      if (save.settings.shake) this.cameras.main.shake(55, 0.0045);
      this.tweens.add({ targets: enemy, scaleX: 1.1, scaleY: 0.9, duration: 45, yoyo: true });
    }
    createSlashFx(x, y, color) {
      const slash = this.add.rectangle(x, y, 120, 10, color, 0.75).setAngle(Phaser.Math.Between(-45, 45)).setDepth(25);
      this.tweens.add({ targets: slash, alpha: 0, scaleX: 1.6, duration: 160, onComplete: () => slash.destroy() });
    }
  }

  setupDom();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-root',
    width: 1280,
    height: 720,
    backgroundColor: '#07090f',
    physics: { default: 'arcade', arcade: { gravity: { y: 980 }, debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [GameScene]
  });

  window.addEventListener('beforeunload', saveGame);
})();

