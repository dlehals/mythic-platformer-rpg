(() => {
  'use strict';

  const SAVE_KEY = 'mythic-terrain-rpg-save-v1';
  const ACCOUNT_KEY = 'mythic-terrain-rpg-accounts-v1';
  const SESSION_KEY = 'mythic-terrain-rpg-session-v1';
  const INTRO_KEY = 'mythic-terrain-rpg-intro-seen-v1';
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
      hazard: { name: 'Molten Lava', damage: 20, color: 0xff3600 },
      mob: { name: 'Ember Brute', hp: 96, atk: 19, exp: 26, gold: 16, tint: 0xff6a21 },
      boss: { name: 'Lava Golem Boss', hp: 860, atk: 42, exp: 180, gold: 135, tint: 0xff3300 }
    },
    frost: {
      title: 'Frost Zone', color: 0x102536, accent: 0x67d9ff, material: 'Frost Heart',
      hazard: { name: 'Frostbite Field', damage: 15, color: 0x67d9ff },
      mob: { name: 'Rime Hound', hp: 104, atk: 20, exp: 28, gold: 18, tint: 0x9ae7ff },
      boss: { name: 'Frost Titan Boss', hp: 920, atk: 45, exp: 195, gold: 148, tint: 0x67d9ff }
    },
    ruin: {
      title: 'Ruin Zone', color: 0x221e15, accent: 0xffd166, material: 'Ancient Dynamo',
      hazard: { name: 'Arc Trap', damage: 17, color: 0xffd166 },
      mob: { name: 'Relic Sentry', hp: 112, atk: 23, exp: 32, gold: 21, tint: 0xffd166 },
      boss: { name: 'Ruin Colossus Boss', hp: 1010, atk: 50, exp: 215, gold: 165, tint: 0xffd166 }
    },
    abyss: {
      title: 'Abyss Zone', color: 0x0b1020, accent: 0xba55d3, material: 'Abyss Shard',
      hazard: { name: 'Void Leak', damage: 24, color: 0x8b2bd6 },
      mob: { name: 'Abyss Wraith', hp: 124, atk: 27, exp: 38, gold: 25, tint: 0xba55d3 },
      boss: { name: 'Abyss Sovereign Boss', hp: 1120, atk: 58, exp: 260, gold: 205, tint: 0xba55d3 }
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
      if (!currentAccountId) return freshSave();
      const raw = localStorage.getItem(accountSaveKey(currentAccountId));
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
    if (!currentAccountId) return;
    if (activeScene) activeScene.syncSaveFromPlayer();
    localStorage.setItem(accountSaveKey(currentAccountId), JSON.stringify(save));
  }

  function restartActiveScene(data = {}) {
    if (!activeScene) return;
    if (typeof activeScene.safeRestart === 'function') activeScene.safeRestart(data);
    else activeScene.scene.restart(data);
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
    const loggedIn = !!currentAccountId && !!save.playerName;
    const name = loggedIn ? save.playerName : '로그인 필요';
    const info = loggedIn ? (save.baseClass ? `${getJobTitle()} · Lv.${save.level} · ${save.gold}골드 · ${currentAccountId}` : `캐릭터 생성 필요 · ${currentAccountId}`) : '계정을 만들거나 로그인하세요';
    if ($('profileNameText')) $('profileNameText').textContent = name;
    if ($('equippedText')) $('equippedText').textContent = loggedIn ? getEquippedLabel() : '로그인 후 장비 표시';
    if ($('menuProfileName')) $('menuProfileName').textContent = name;
    if ($('menuProfileInfo')) $('menuProfileInfo').textContent = info;
    setPaperDoll('hudAvatar');
    setPaperDoll('menuAvatar');
    if ($('loginPanel')) $('loginPanel').style.display = loggedIn ? 'none' : 'block';
    if ($('mainMenu')) $('mainMenu').classList.toggle('visible', loggedIn);
    if ($('continueButton')) $('continueButton').disabled = !loggedIn || !save.baseClass;
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
    if (!currentAccountId || !save.playerName) {
      showStartScreen();
      toast('먼저 로그인하거나 계정을 만들어주세요.');
      return;
    }
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
    const hideIntro = () => {
      $('introScreen')?.classList.remove('visible');
      try { window.sessionStorage?.setItem(INTRO_KEY, '1'); } catch (error) { console.warn('Intro session save failed', error); }
      if (!save.baseClass && activeScene) activeScene.physics.pause();
    };
    $('introStartButton')?.addEventListener('click', hideIntro);
    $('introSkipButton')?.addEventListener('click', hideIntro);
    try {
      if (window.sessionStorage?.getItem(INTRO_KEY)) $('introScreen')?.classList.remove('visible');
    } catch (error) {
      console.warn('Intro session read failed', error);
    }
    const setAuthMode = (mode) => {
      const isRegister = mode === 'register';
      $('showLoginButton')?.classList.toggle('active', !isRegister);
      $('showRegisterButton')?.classList.toggle('active', isRegister);
      if ($('registerNameWrap')) $('registerNameWrap').style.display = isRegister ? 'block' : 'none';
      if ($('loginButton')) $('loginButton').style.display = isRegister ? 'none' : 'inline-flex';
      if ($('registerButton')) $('registerButton').style.display = isRegister ? 'inline-flex' : 'none';
      if (accountPasswordInput) accountPasswordInput.autocomplete = isRegister ? 'new-password' : 'current-password';
    };
    let selectingClass = false;
    const persistSaveDirectly = () => {
      localStorage.setItem(currentAccountId ? accountSaveKey(currentAccountId) : SAVE_KEY, JSON.stringify(save));
    };
    const selectBaseClass = (classId) => {
      if (selectingClass || !BASE_CLASSES[classId]) return;
      selectingClass = true;
      const playerName = save.playerName || cleanDisplayName(playerNameInput?.value || '') || getCurrentAccount()?.playerName || '플레이어';
      save = freshSave();
      save.playerName = playerName;
      save.baseClass = classId;
      const stats = getBaseStats();
      save.hp = stats.hp;
      save.mp = stats.mp;
      save.inventory.push({ id: `starter-${Date.now()}`, name: '초보자의 보급품', rarity: 'Common', type: 'consumable', desc: '초반 자금용 보급품' });
      persistSaveDirectly();
      $('classModal')?.classList.remove('visible');
      hideStartScreen();
      AudioFX.playUiSound();
      updateProfileUi();
      renderInventory();
      toast(`${BASE_CLASSES[classId].title} 생성 완료`);
      restartActiveScene();
      setTimeout(() => { selectingClass = false; }, 250);
    };
    const renderClassChoices = () => {
      const classChoices = $('classChoices');
      if (!classChoices) return;
      classChoices.innerHTML = Object.entries(BASE_CLASSES).map(([id, data]) => `
        <button class="choice-card" data-class="${id}" type="button">
          <div class="paper-doll ${id}"><span class="weapon"></span></div>
          <h3>${data.title}</h3>
          <p>${data.desc}</p>
        </button>`).join('');
      classChoices.querySelectorAll('[data-class]').forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          selectBaseClass(button.dataset.class);
        });
      });
    };
    renderClassChoices();

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
      restartActiveScene();
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
      restartActiveScene();
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
    const switchAccount = () => {
      if (currentAccountId) saveGame();
      currentAccountId = '';
      localStorage.removeItem(SESSION_KEY);
      save = freshSave();
      if (accountPasswordInput) accountPasswordInput.value = '';
      if (playerNameInput) playerNameInput.value = '';
      setAuthMode('login');
      $('classModal')?.classList.remove('visible');
      $('inventoryModal')?.classList.remove('visible');
      showStartScreen();
      renderInventory();
      updateProfileUi();
      toast('로그아웃 완료. 다른 계정으로 로그인하세요.');
      restartActiveScene();
    };
    $('showLoginButton')?.addEventListener('click', () => setAuthMode('login'));
    $('showRegisterButton')?.addEventListener('click', () => setAuthMode('register'));
    $('loginButton')?.addEventListener('click', loginLocalAccount);
    $('registerButton')?.addEventListener('click', registerLocalAccount);
    $('switchAccountButton')?.addEventListener('click', switchAccount);
    $('hudAccountButton')?.addEventListener('click', () => {
      if (!currentAccountId || confirm('현재 계정에서 로그아웃하고 계정 전환 화면으로 갈까요?')) switchAccount();
    });    [accountIdInput, accountPasswordInput, playerNameInput].forEach((input) => {
      input?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') (document.activeElement === playerNameInput ? registerLocalAccount : loginLocalAccount)();
      });
    });
    setAuthMode('login');
    $('continueButton')?.addEventListener('click', () => {
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
      restartActiveScene();
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
      this.isTransitioning = false;
      this.isDefeated = false;
      this.pendingSpawnPoint = null;
    }

    init(data = {}) {
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
      this.isTransitioning = false;
      this.isDefeated = false;
      this.pendingSpawnPoint = data.spawnPoint || null;
    }

    preload() {}

    create() {
      activeScene = this;
      if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') window.__mythicScene = this;
      this.input.enabled = true;
      if (this.physics?.world) this.physics.world.resume();
      this.createTextures();
      this.stats = getBaseStats();
      this.playerHp = save.hp > 0 ? Math.min(save.hp, this.stats.hp) : this.stats.hp;
      this.playerMp = save.mp > 0 ? Math.min(save.mp, this.stats.mp) : this.stats.mp;
      this.interactables = [];
      this.hazards = [];
      this.enemySprites = [];
      this.projectiles = this.physics.add.group({ allowGravity: false, immovable: true });
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
        const shape = {
          sword: { bodyX: 23, bodyY: 35, bodyW: 38, bodyH: 48, shoulderX: 13, shoulderY: 35, shoulderW: 58, shoulderH: 16, armW: 14, legW: 12, stance: 11, head: 'helm', shadow: 62 },
          bow: { bodyX: 28, bodyY: 35, bodyW: 28, bodyH: 45, shoulderX: 20, shoulderY: 36, shoulderW: 44, shoulderH: 12, armW: 10, legW: 9, stance: 7, head: 'hood', shadow: 46 },
          staff: { bodyX: 25, bodyY: 34, bodyW: 34, bodyH: 55, shoulderX: 18, shoulderY: 37, shoulderW: 48, shoulderH: 13, armW: 10, legW: 10, stance: 9, head: 'mage', shadow: 50 },
          daggers: { bodyX: 27, bodyY: 39, bodyW: 30, bodyH: 39, shoulderX: 18, shoulderY: 39, shoulderW: 48, shoulderH: 11, armW: 9, legW: 9, stance: 15, head: 'mask', shadow: 54 },
          scythe: { bodyX: 24, bodyY: 31, bodyW: 36, bodyH: 58, shoulderX: 14, shoulderY: 34, shoulderW: 56, shoulderH: 15, armW: 11, legW: 10, stance: 13, head: 'skull', shadow: 58 },
          chrono: { bodyX: 25, bodyY: 33, bodyW: 34, bodyH: 50, shoulderX: 16, shoulderY: 35, shoulderW: 52, shoulderH: 14, armW: 11, legW: 10, stance: 10, head: 'visor', shadow: 56 }
        }[weapon] || { bodyX: 26, bodyY: 35, bodyW: 32, bodyH: 46, shoulderX: 18, shoulderY: 36, shoulderW: 48, shoulderH: 12, armW: 10, legW: 10, stance: 10, head: 'face', shadow: 48 };
        const cx = 42;
        g.clear();
        g.fillStyle(0x000000, 0.30).fillEllipse(cx, 101, shape.shadow, 10);
        if (weapon === 'chrono') {
          g.lineStyle(4, 0x67d9ff, 0.80).strokeCircle(cx, 52, 39);
          g.lineStyle(2, 0xffffff, 0.45).strokeCircle(cx, 52, 28);
        }
        if (weapon === 'staff') {
          g.fillStyle(palette.capeDark, 0.75).fillTriangle(25, 37, 59, 37, 68, 99);
          g.fillStyle(palette.cape, 0.66).fillTriangle(26, 38, 43, 95, 14, 96);
        } else if (weapon === 'bow') {
          g.fillStyle(palette.capeDark, 0.86).fillTriangle(22, 30, 56, 31, 50, 96);
          g.fillStyle(palette.cape, 0.66).fillTriangle(24, 33, 31, 94, 12, 91);
        } else if (weapon === 'daggers') {
          g.fillStyle(palette.capeDark, 0.82).fillTriangle(23, 35, 62, 41, 73, 65);
        } else if (palette.cape) {
          g.fillStyle(palette.capeDark, 0.86).fillTriangle(20, 31, 60, 31, 66, 96);
          g.fillStyle(palette.cape, 0.65).fillTriangle(22, 34, 42, 96, 13, 96);
        }
        g.fillStyle(palette.boot, 1).fillRoundedRect(cx - shape.stance - shape.legW, 80, shape.legW, 19, 4).fillRoundedRect(cx + shape.stance, 80, shape.legW, 19, 4);
        g.fillStyle(palette.leg, 1).fillRoundedRect(cx - shape.stance - shape.legW + 1, 61, shape.legW - 1, 24, 5).fillRoundedRect(cx + shape.stance + 1, 61, shape.legW - 1, 24, 5);
        if (weapon === 'staff' || weapon === 'scythe') {
          g.fillStyle(palette.bodyDark, 0.96).fillTriangle(shape.bodyX, 53, shape.bodyX + shape.bodyW, 53, cx + 22, 97);
          g.fillStyle(palette.body, 0.98).fillTriangle(shape.bodyX + 2, 49, shape.bodyX + shape.bodyW - 2, 49, cx - 20, 97);
        }
        g.fillStyle(palette.arm, 1).fillRoundedRect(shape.shoulderX - 7, shape.shoulderY + 8, shape.armW, 35, 7).fillRoundedRect(shape.shoulderX + shape.shoulderW - shape.armW + 7, shape.shoulderY + 8, shape.armW, 35, 7);
        g.fillStyle(palette.trim, 1).fillRoundedRect(shape.shoulderX, shape.shoulderY, shape.shoulderW, shape.shoulderH, 7);
        if (weapon === 'sword') {
          g.fillStyle(0x151015, 1).fillTriangle(15, 37, 3, 29, 11, 53).fillTriangle(69, 37, 81, 29, 73, 53);
        }
        g.fillStyle(palette.body, 1).fillRoundedRect(shape.bodyX, shape.bodyY, shape.bodyW, shape.bodyH, weapon === 'daggers' ? 11 : 8);
        g.fillStyle(palette.bodyDark, 0.78).fillTriangle(shape.bodyX + 3, shape.bodyY + 7, shape.bodyX + shape.bodyW - 1, shape.bodyY + 6, shape.bodyX + shape.bodyW * 0.55, shape.bodyY + shape.bodyH - 3);
        g.fillStyle(palette.trim, 1).fillRect(shape.bodyX + 6, shape.bodyY + 18, Math.max(12, shape.bodyW - 12), 4);
        if (weapon === 'sword') g.lineStyle(3, 0xffd166, 0.95).strokeCircle(cx, 58, 9);
        if (weapon === 'staff') g.lineStyle(2, 0xe9d6ff, 0.55).strokeCircle(cx, 57, 20);
        if (weapon === 'chrono') g.lineStyle(2, 0x67d9ff, 0.72).strokeRoundedRect(shape.bodyX + 3, shape.bodyY + 3, shape.bodyW - 6, shape.bodyH - 7, 8);
        if (shape.head === 'helm') {
          g.fillStyle(palette.skin, 1).fillCircle(cx, 22, 12);
          g.fillStyle(0x2a0d0d, 1).fillRoundedRect(27, 10, 30, 14, 6);
          g.fillStyle(0xffd166, 1).fillTriangle(30, 12, 14, 0, 34, 7).fillTriangle(54, 12, 70, 0, 50, 7);
          g.fillStyle(0xff4a4a, 1).fillRect(34, 22, 4, 2).fillRect(46, 22, 4, 2);
        } else if (shape.head === 'hood') {
          g.fillStyle(palette.capeDark, 1).fillTriangle(cx, 3, 22, 29, 62, 29);
          g.fillStyle(palette.skin, 1).fillRoundedRect(31, 17, 22, 16, 8);
          g.fillStyle(0xd4f1ff, 1).fillRect(32, 23, 20, 3);
        } else if (shape.head === 'mage') {
          g.fillStyle(palette.skin, 1).fillCircle(cx, 24, 11);
          g.fillStyle(0x2a1847, 1).fillTriangle(cx, -4, 22, 25, 62, 25);
          g.lineStyle(3, palette.trim, 0.9).lineBetween(cx, -4, 22, 25).lineBetween(22, 25, 62, 25).lineBetween(62, 25, cx, -4);
          g.fillStyle(0xffffff, 0.85).fillRect(35, 24, 3, 2).fillRect(47, 24, 3, 2);
        } else if (shape.head === 'mask') {
          g.fillStyle(0x0a1210, 1).fillRoundedRect(28, 12, 28, 24, 10);
          g.fillStyle(0x8aff80, 1).fillRect(34, 23, 5, 2).fillRect(45, 23, 5, 2);
          g.fillStyle(palette.cape, 0.95).fillTriangle(53, 27, 80, 34, 53, 43);
        } else if (shape.head === 'skull') {
          g.fillStyle(0x050306, 1).fillTriangle(cx, 2, 18, 34, 66, 34);
          g.fillStyle(0xd7c8ff, 0.93).fillRoundedRect(31, 15, 22, 18, 8);
          g.fillStyle(0x180820, 1).fillRect(35, 22, 5, 4).fillRect(45, 22, 5, 4);
          g.fillStyle(0xba55d3, 0.65).fillCircle(17, 35, 4).fillCircle(67, 68, 5).fillCircle(12, 80, 3);
        } else if (shape.head === 'visor') {
          g.fillStyle(palette.skin, 1).fillCircle(cx, 23, 11);
          g.lineStyle(3, 0x67d9ff, 0.9).strokeCircle(cx, 20, 18);
          g.fillStyle(0x071827, 1).fillRoundedRect(30, 18, 24, 9, 5);
          g.fillStyle(0x67d9ff, 0.95).fillRect(33, 21, 18, 2);
        } else {
          g.fillStyle(palette.skin, 1).fillCircle(cx, 22, 12);
          g.fillStyle(0xffffff, 0.95).fillRect(36, 22, 3, 2).fillRect(46, 22, 3, 2);
        }
        if (weapon === 'sword') {
          g.lineStyle(10, 0xd7e4ff, 1).lineBetween(61, 17, 69, 95);
          g.lineStyle(3, 0x111111, 0.9).lineBetween(61, 17, 69, 95);
          g.fillStyle(0xffd166, 1).fillRect(54, 66, 26, 6);
        } else if (weapon === 'bow') {
          g.lineStyle(5, 0xd4f1ff, 1).strokeCircle(64, 51, 24);
          g.lineStyle(2, 0x10141d, 1).lineBetween(64, 27, 64, 75);
          g.fillStyle(0xd4f1ff, 1).fillTriangle(42, 49, 64, 44, 64, 54);
          g.lineStyle(2, 0xd4f1ff, 0.85).lineBetween(17, 31, 11, 9).lineBetween(21, 31, 19, 8).lineBetween(25, 33, 27, 10);
        } else if (weapon === 'staff') {
          g.lineStyle(6, 0xe9d6ff, 1).lineBetween(65, 13, 57, 99);
          g.fillStyle(0xb388ff, 1).fillCircle(66, 12, 10);
          g.lineStyle(2, 0xffffff, 0.8).strokeCircle(66, 12, 14);
          g.fillStyle(0xb388ff, 0.6).fillCircle(18, 46, 5).fillCircle(65, 64, 4).fillCircle(21, 75, 3);
        } else if (weapon === 'daggers') {
          g.lineStyle(6, 0x8aff80, 1).lineBetween(18, 55, 3, 40).lineBetween(63, 55, 81, 39);
          g.fillStyle(0xd7e4ff, 1).fillTriangle(2, 39, 10, 43, 5, 31).fillTriangle(82, 38, 73, 43, 78, 30);
        } else if (weapon === 'scythe') {
          g.lineStyle(7, 0xe8d7ff, 1).lineBetween(65, 10, 52, 101);
          g.fillStyle(0xba55d3, 1).fillTriangle(65, 9, 82, 16, 63, 29);
          g.fillStyle(0x191020, 1).fillTriangle(68, 14, 78, 17, 67, 22);
        } else if (weapon === 'chrono') {
          g.lineStyle(4, 0x67d9ff, 1).strokeCircle(66, 42, 14);
          g.fillStyle(0xffffff, 0.9).fillCircle(66, 42, 3);
          g.lineStyle(2, 0xffffff, 0.75).lineBetween(66, 42, 66, 31).lineBetween(66, 42, 75, 47);
        }
        g.lineStyle(2, 0x050505, 0.64).strokeRoundedRect(shape.bodyX, shape.bodyY, shape.bodyW, shape.bodyH, 8);
        g.generateTexture(key, 84, 108);
      };      const drawMonster = () => {
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
      const drawArrowProjectile = () => {
        if (this.textures.exists('arrow')) return;
        g.clear();
        g.fillStyle(0x0a121d, 0.55).fillRoundedRect(2, 5, 30, 4, 2);
        g.fillStyle(0xd4f1ff, 1).fillRoundedRect(3, 4, 32, 5, 3);
        g.fillStyle(0xffffff, 0.95).fillTriangle(32, 0, 47, 7, 32, 14);
        g.fillStyle(0x67d9ff, 0.85).fillTriangle(8, 2, 1, 7, 8, 12);
        g.lineStyle(2, 0x10141d, 0.85).strokeTriangle(32, 0, 47, 7, 32, 14);
        g.generateTexture('arrow', 48, 14);
      };
      const drawOrbProjectile = () => {
        if (this.textures.exists('orb')) return;
        g.clear();
        g.fillStyle(0xb388ff, 0.30).fillCircle(16, 16, 15);
        g.fillStyle(0x6d45c9, 0.80).fillCircle(16, 16, 10);
        g.fillStyle(0xffffff, 0.96).fillCircle(12, 11, 4);
        g.lineStyle(2, 0xe9d6ff, 0.90).strokeCircle(16, 16, 14);
        g.lineStyle(1, 0xffffff, 0.42).strokeCircle(16, 16, 7);
        g.generateTexture('orb', 32, 32);
      };
      const drawSlashProjectile = () => {
        if (this.textures.exists('slash')) return;
        g.clear();
        g.fillStyle(0xffffff, 0.18).fillEllipse(30, 13, 58, 18);
        g.lineStyle(8, 0xffffff, 0.96).lineBetween(4, 17, 58, 6);
        g.lineStyle(3, 0xffd166, 0.96).lineBetween(7, 18, 61, 7);
        g.lineStyle(2, 0xff6a21, 0.75).lineBetween(14, 23, 48, 17);
        g.generateTexture('slash', 64, 28);
      };
      drawMonster();
      drawBoss();
      drawArrowProjectile();
      drawOrbProjectile();
      drawSlashProjectile();
      g.destroy();
    }

    getPlayerTextureKey() {
      if (save.path === 'mythic') return save.mythic === 'chrono' ? 'hero-chrono' : 'hero-reaper';
      return `hero-${save.baseClass || 'berserker'}`;
    }
    groundPalette() {
      const palettes = {
        town: { top: 0x26334a, base: 0x1b2232, glow: 0x9bdcff },
        lava: { top: 0x5a1a14, base: 0x241016, glow: 0xff3300 },
        frost: { top: 0x24445c, base: 0x102536, glow: 0x67d9ff },
        ruin: { top: 0x4c3b20, base: 0x221e15, glow: 0xffd166 },
        abyss: { top: 0x2a1645, base: 0x0b1020, glow: 0xba55d3 },
        arena: { top: 0x3a4050, base: 0x151722, glow: 0xffffff }
      };
      return palettes[save.zone] || palettes.town;
    }

    paintZoneBackground(zoneId) {
      const zone = ZONES[zoneId] || ZONES.town;
      const accent = zone.accent || 0xffffff;
      this.add.rectangle(1800, 140, 3600, 280, accent, 0.045).setDepth(-10).setScrollFactor(0.12);
      this.add.rectangle(1800, 505, 3600, 90, accent, 0.09).setDepth(-9).setScrollFactor(0.45);
      if (zoneId === 'lava') {
        for (let i = 0; i < 7; i += 1) this.add.triangle(260 + i * 520, 360, 0, 120, 120, 0, 250, 120, 0x351012, 0.88).setDepth(-8).setScrollFactor(0.35);
        for (let i = 0; i < 18; i += 1) this.add.circle(120 + i * 190, 150 + (i % 5) * 46, 3 + (i % 3), 0xff6a21, 0.45).setDepth(-7).setScrollFactor(0.2);
        this.add.rectangle(1800, 510, 3600, 18, 0xff3300, 0.42).setDepth(-6).setScrollFactor(0.6);
      } else if (zoneId === 'frost') {
        for (let i = 0; i < 8; i += 1) this.add.triangle(180 + i * 480, 350, 0, 130, 130, 0, 300, 130, 0x1b4660, 0.82).setDepth(-8).setScrollFactor(0.32);
        for (let i = 0; i < 22; i += 1) this.add.circle(80 + i * 160, 80 + (i % 7) * 46, 2, 0xd9f7ff, 0.52).setDepth(-7).setScrollFactor(0.18);
        this.add.rectangle(1800, 496, 3600, 16, 0xb8f4ff, 0.24).setDepth(-6).setScrollFactor(0.55);
      } else if (zoneId === 'ruin') {
        for (let i = 0; i < 11; i += 1) {
          const x = 160 + i * 330;
          this.add.rectangle(x, 315, 42, 230, 0x3f3524, 0.76).setDepth(-8).setScrollFactor(0.38);
          this.add.rectangle(x, 195, 82, 20, 0xffd166, 0.18).setDepth(-7).setScrollFactor(0.38);
        }
        for (let i = 0; i < 8; i += 1) this.add.circle(320 + i * 410, 210 + (i % 3) * 62, 24, 0xffd166, 0.08).setStrokeStyle(2, 0xffd166, 0.28).setDepth(-7).setScrollFactor(0.25);
      } else if (zoneId === 'abyss') {
        for (let i = 0; i < 10; i += 1) this.add.circle(220 + i * 360, 230 + (i % 4) * 52, 80 + (i % 3) * 24, 0x260b42, 0.26).setDepth(-8).setScrollFactor(0.22);
        for (let i = 0; i < 12; i += 1) this.add.rectangle(130 + i * 300, 310, 12, 250, 0xba55d3, 0.22).setAngle((i % 2 ? 8 : -10)).setDepth(-7).setScrollFactor(0.32);
        this.add.circle(3040, 165, 56, 0xba55d3, 0.20).setStrokeStyle(4, 0xd7a8ff, 0.34).setDepth(-6).setScrollFactor(0.18);
      } else if (zoneId === 'arena') {
        for (let i = 0; i < 12; i += 1) this.add.rectangle(120 + i * 300, 300, 210, 120, i % 2 ? 0x222838 : 0x30384a, 0.62).setDepth(-8).setScrollFactor(0.3);
        this.add.rectangle(1800, 210, 3600, 30, 0xffffff, 0.14).setDepth(-7).setScrollFactor(0.2);
      } else {
        for (let i = 0; i < 9; i += 1) this.add.rectangle(180 + i * 420, 335, 70, 220, 0x20314a, 0.34).setDepth(-8).setScrollFactor(0.3);
        for (let i = 0; i < 7; i += 1) this.add.circle(280 + i * 480, 210, 42, 0x9bdcff, 0.10).setDepth(-7).setScrollFactor(0.18);
      }
    }
    buildZone(zoneId) {
      this.zone = ZONES[zoneId] || ZONES.town;
      this.cameras.main.setBackgroundColor(this.zone.color);
      const ground = this.groundPalette();
      this.paintZoneBackground(zoneId);
      this.add.rectangle(1800, 540, 3600, 80, ground.base).setScrollFactor(1);
      this.add.text(28, 24, this.zone.title, { fontFamily: 'Consolas', fontSize: '28px', color: '#ffffff', stroke: '#000000', strokeThickness: 5 }).setScrollFactor(0);
      for (let i = 0; i < 16; i += 1) {
        const x = i * 260 + 80;
        const y = 90 + (i % 4) * 38;
        this.add.rectangle(x, y, 90 + (i % 3) * 32, 12, this.zone.accent, 0.14).setScrollFactor(0.35);
      }
      this.addPlatform(1800, 540, 3600, 80, ground.top);
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
      this.addPlatform(560, 420, 230, 30, 0x2e3a50);
      this.addPlatform(1120, 360, 260, 30, 0x2e3a50);
      this.addPlatform(1650, 435, 260, 30, 0x2e3a50);
      this.addInteractable(280, 475, 150, 120, '용암 지대 [E]', () => this.travelTo('lava'), 0xff3300);
      this.addInteractable(520, 475, 150, 120, '서리 지대 [E]', () => this.travelTo('frost'), 0x67d9ff);
      this.addInteractable(760, 475, 150, 120, '유적 지대 [E]', () => this.travelTo('ruin'), 0xffd166);
      this.addInteractable(1000, 475, 150, 120, '심연 지대 [E]', () => this.travelTo('abyss'), 0xba55d3);
      this.addInteractable(1270, 475, 150, 120, '훈련장 [E]', () => this.travelTo('arena'), 0xffffff);
      this.addInteractable(1680, 472, 170, 120, '대장장이 [E]', () => this.tryTerrainEvolution(), 0xffb642);
      this.addInteractable(1930, 472, 170, 120, '보급 상인 [E]', () => this.buyPotion(), 0x8be9fd);
    }

    buildArena() {
      this.addPlatform(650, 425, 250, 28, 0x30384a);
      this.addPlatform(1800, 415, 350, 28, 0x30384a);
      this.addInteractable(120, 474, 130, 120, '마을 [E]', () => this.travelTo('town'), 0xffffff);
    }

    buildTerrainZone(zoneId) {
      this.addInteractable(72, 474, 96, 110, '마을 귀환 [E]', () => this.travelTo('town'), 0xffffff);
      this.addPlatform(650, 425, 280, 28, 0x2c3448);
      this.addPlatform(1160, 375, 260, 28, 0x2c3448);
      this.addPlatform(1700, 435, 310, 28, 0x2c3448);
      this.addPlatform(2290, 385, 360, 28, 0x2c3448);
      this.addHazard(925, 512, 300, 35);
      this.addHazard(1505, 512, 260, 35);
      this.addHazard(2600, 512, 420, 35);
      this.add.text(2870, 465, '보스 관문: 몬스터 10마리 처치', { fontFamily: 'Consolas', fontSize: '16px', color: '#fff', stroke: '#000', strokeThickness: 4 });
    }

    defaultSpawnPoint(zoneId) {
      if (zoneId === 'town') return { x: 160, y: 420 };
      if (zoneId === 'arena') return { x: 260, y: 420 };
      return { x: 270, y: 420 };
    }

    createPlayer() {
      const spawn = this.pendingSpawnPoint || this.defaultSpawnPoint(save.zone);
      this.player = this.physics.add.sprite(spawn.x, spawn.y, this.getPlayerTextureKey());
      this.player.setScale(1.08);
      this.player.setCollideWorldBounds(true);
      this.player.setDragX(1500);
      this.player.setMaxVelocity(720, 900);
      this.player.body.setSize(38, 70).setOffset(23, 34);
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

    safeRestart(data = {}) {
      this.isTransitioning = false;
      this.isDefeated = false;
      this.input.enabled = true;
      if (this.physics?.world) this.physics.world.resume();
      const manager = this.game?.scene;
      if (!manager) {
        this.scene.restart(data);
        return;
      }
      manager.stop('GameScene');
      window.setTimeout(() => manager.start('GameScene', data), 0);
    }

    travelTo(zoneId) {
      if (!ZONES[zoneId] || this.isTransitioning || zoneId === save.zone) return;
      this.isTransitioning = true;
      const spawnPoint = this.defaultSpawnPoint(zoneId);
      this.syncSaveFromPlayer();
      save.zone = zoneId;
      saveGame();
      $('prompt')?.classList.remove('visible');
      this.player?.setVelocity(0, 0);
      this.input.enabled = false;
      if (this.physics?.world) this.physics.world.resume();
      AudioFX.playUiSound();
      this.cameras.main.fadeOut(180, 0, 0, 0);
      let didRestart = false;
      const restart = () => {
        if (didRestart) return;
        didRestart = true;
        this.safeRestart({ spawnPoint });
      };
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, restart);
      window.setTimeout(restart, 260);
    }

    spawnZoneEnemies() {
      if (save.zone === 'town') {
        this.spawnEnemy(2350, 420, { name: '훈련용 허수아비', hp: 999, atk: 0, exp: 0, gold: 0, tint: 0xeeeeee, dummy: true });
        return;
      }
      if (save.zone === 'arena') {
        this.spawnEnemy(1680, 420, { ...ZONES.arena.mob, dummy: true, patrol: 340 });
        this.spawnEnemy(2060, 420, { ...ZONES.arena.mob, dummy: true, patrol: 260 });
        return;
      }
      const zone = ZONES[save.zone];
      const positions = [520, 840, 1180, 1470, 1880, 2190, 2520, 2860];
      positions.forEach((x, index) => this.spawnEnemy(x, 420, { ...zone.mob, hp: zone.mob.hp + index * 5, patrol: 180 + index * 15 }));
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
      this.updateProjectiles(time);
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
          enemy.setVelocityX(dir * (data.boss ? 145 : 112));
          if (dist < (data.boss ? 92 : 54) && time > data.attackAt) {
            data.attackAt = time + (data.boss ? 980 : 760);
            this.monsterAttack(enemy);
          }
        } else if (!data.dummy) {
          if (Math.abs(enemy.x - data.baseX) > data.patrol) data.dir *= -1;
          enemy.setVelocityX(data.dir * (data.boss ? 86 : 64));
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

    updateProjectiles(time) {
      if (!this.projectiles) return;
      this.projectiles.children.each((projectile) => {
        if (!projectile?.active || !projectile.body) return;
        if (projectile.x < -120 || projectile.x > 3720 || projectile.y < -120 || projectile.y > 760) {
          projectile.destroy();
          return;
        }
        if (Number.isFinite(projectile.flightVx)) this.lockProjectileMotion(projectile, projectile.flightVx, projectile.flightVy || 0);
        this.checkProjectileHits(projectile);
        if (!projectile.active) return;
        const vx = projectile.body.velocity.x;
        const vy = projectile.body.velocity.y;
        if (Math.abs(vx) + Math.abs(vy) > 8) projectile.setRotation(Math.atan2(vy, vx));
        if (time < (projectile.nextTrailAt || 0)) return;
        projectile.nextTrailAt = time + 38;
        const dir = Math.sign(vx || this.facing || 1);
        const color = projectile.trailColor || 0xffffff;
        const radius = projectile.texture.key === 'orb' ? 5 : 3;
        const trail = this.add.circle(projectile.x - dir * 18, projectile.y, radius, color, 0.38).setDepth(8);
        trail.setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: trail, alpha: 0, scale: 0.25, duration: 180, ease: 'Quad.easeOut', onComplete: () => trail.destroy() });
      });
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
      if (this.isTransitioning) return;
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
      data.contactDamageAt = this.time.now + 700;
      const push = Math.sign(this.player.x - enemy.x) || 1;
      this.player.setVelocityX(push * 310);
      this.player.setVelocityY(Math.min(this.player.body.velocity.y, -120));
      this.damagePlayer(Math.max(2, Math.round((data.atk || 1) * 0.68)), data.name);
    }
    monsterAttack(enemy) {
      const data = enemy.getData('enemy');
      const damage = Math.round(data.boss ? data.atk + save.level * 2 : data.atk + save.level * 1.6);
      this.spawnEnemyAttackFx(enemy.x, enemy.y, data.boss ? 95 : 55);
      this.damagePlayer(damage, data.name);
    }

    spawnEnemyAttackFx(x, y, radius) {
      const circle = this.add.circle(x, y, radius, 0xff4a4a, 0.18).setDepth(8);
      this.tweens.add({ targets: circle, alpha: 0, scale: 1.5, duration: 220, onComplete: () => circle.destroy() });
    }

    damagePlayer(amount, source) {
      if (this.isDefeated) return;
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
      this.cameras.main.shake(110, 0.009);
      this.cameras.main.flash(45, 255, 70, 70);
      if (this.playerHp <= 0) this.playerDefeated(source);
    }

    playerDefeated(source) {
      if (this.isDefeated) return;
      this.isDefeated = true;
      toast(`${source}에게 쓰러졌습니다. 마을로 귀환합니다.`);
      const stats = getBaseStats();
      this.playerHp = stats.hp;
      this.playerMp = stats.mp;
      save.zone = 'town';
      save.hp = stats.hp;
      save.mp = stats.mp;
      saveGame();
      this.player?.setVelocity(0, 0);
      window.setTimeout(() => this.safeRestart({ spawnPoint: this.defaultSpawnPoint('town') }), 450);
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
      this.playCharacterMotion('basic', this.comboStep);
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
      if (step === 1) this.spawnProjectile({ texture: 'arrow', speed: 700, mult: 1.1, pierce: 0, offsetY: -2 });
      if (step === 2) {
        this.spawnProjectile({ texture: 'arrow', speed: 700, mult: 0.85, pierce: 0, offsetY: -10 });
        this.spawnProjectile({ texture: 'arrow', speed: 700, mult: 0.85, pierce: 0, offsetY: 8 });
      }
      if (step === 3) this.time.delayedCall(70, () => this.spawnProjectile({ texture: 'arrow', speed: 820, mult: 1.95, pierce: 2, scaleX: 2.0, offsetY: -2 }));
    }

    sorcererBasic(step) {
      if (step === 1) this.spawnProjectile({ texture: 'orb', speed: 460, mult: 1.18, splash: 28, tint: 0xff6a21, status: 'burn', offsetY: -4 });
      if (step === 2) this.spawnProjectile({ texture: 'orb', speed: 500, mult: 1.18, tint: 0x9ae7ff, status: 'slow', offsetY: -4 });
      if (step === 3) this.spawnProjectile({ texture: 'orb', speed: 610, mult: 1.58, tint: 0xfff06a, chain: 1, status: 'shock', offsetY: -4 });
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

    getProjectileAimY(options = {}) {
      const fallbackY = this.player.y + 42;
      let targetY = fallbackY;
      let bestDistance = Infinity;
      for (const enemy of this.enemySprites || []) {
        const data = enemy?.getData?.('enemy');
        if (!data || data.dead) continue;
        const forwardDistance = (enemy.x - this.player.x) * (this.facing || 1);
        if (forwardDistance < 0 || forwardDistance > 900 || forwardDistance > bestDistance) continue;
        bestDistance = forwardDistance;
        targetY = enemy.body ? enemy.body.y + enemy.body.height * 0.5 : enemy.y;
      }
      return Math.max(targetY, fallbackY) + (options.offsetY || 0);
    }

    checkProjectileHits(projectile) {
      const payload = projectile.dataPayload;
      if (!payload || !this.enemySprites?.length) return;
      const projectileBounds = projectile.getBounds();
      for (const enemy of this.enemySprites) {
        const data = enemy?.getData?.('enemy');
        if (!data || data.dead || payload.hitTargets.has(enemy)) continue;
        if (!Phaser.Geom.Intersects.RectangleToRectangle(projectileBounds, enemy.getBounds())) continue;
        this.onProjectileHit(projectile, enemy);
        if (!projectile.active) break;
      }
    }

    lockProjectileMotion(projectile, vx, vy) {
      if (!projectile?.body) return;
      projectile.flightVx = vx;
      projectile.flightVy = vy;
      projectile.body.allowGravity = false;
      projectile.body.gravity.y = 0;
      projectile.body.moves = true;
      projectile.body.immovable = false;
      projectile.body.setAllowGravity?.(false);
      projectile.body.setVelocity?.(vx, vy);
      projectile.setGravityY?.(0);
      projectile.setAcceleration?.(0, 0);
      projectile.setDrag?.(0, 0);
      projectile.setVelocity(vx, vy);
    }

    spawnProjectile(options) {
      const direction = this.facing || 1;
      const angle = Phaser.Math.DegToRad(options.angle || 0);
      const speed = options.speed || 520;
      const spawnDistance = options.spawnDistance || 74;
      const texture = options.texture || 'arrow';
      const color = options.tint || this.hitboxColor(options);
      const projectileY = this.getProjectileAimY(options);
      const projectile = this.physics.add.sprite(this.player.x + direction * spawnDistance, projectileY, texture);
      this.projectiles.add(projectile);
      projectile.setDepth(9);
      projectile.setTint(color);
      projectile.setScale(options.scaleX || 1, options.scaleY || 1);
      projectile.setCollideWorldBounds(false);
      projectile.body.setSize(options.bodyW || (texture === 'orb' ? 24 : 38), options.bodyH || (texture === 'orb' ? 24 : 18), true);
      const vx = Math.cos(angle) * speed * direction;
      const vy = Math.sin(angle) * speed;
      this.lockProjectileMotion(projectile, vx, vy);
      projectile.setRotation(Math.atan2(vy, vx));
      projectile.trailColor = color;
      projectile.nextTrailAt = 0;
      projectile.dataPayload = { ...options, remainingPierce: options.pierce || 0, hitTargets: new Set() };
      projectile.hitScanTimer = window.setInterval(() => {
        if (!projectile.active) {
          window.clearInterval(projectile.hitScanTimer);
          return;
        }
        this.checkProjectileHits(projectile);
      }, 16);
      this.physics.add.overlap(projectile, this.enemyGroup, (shot, enemy) => this.onProjectileHit(shot, enemy));
      this.time.delayedCall(options.life || 1800, () => {
        if (!projectile.active) return;
        window.clearInterval(projectile.hitScanTimer);
        this.createProjectileImpact(projectile.x, projectile.y, color, 7);
        projectile.destroy();
      });
      if (save.path === 'terrain') this.spawnElementParticles(projectile.x, projectile.y, 24, 24);
      return projectile;
    }

    onProjectileHit(projectile, enemy) {
      if (!projectile.active || projectile.dataPayload.hitTargets.has(enemy)) return;
      const payload = projectile.dataPayload;
      payload.hitTargets.add(enemy);
      this.createProjectileImpact(projectile.x, projectile.y, projectile.trailColor || this.hitboxColor(payload), payload.splash ? 16 : 10);
      this.applyDamage(enemy, this.calculateDamage(payload.mult || 1), payload);
      if (payload.splash) this.splashDamage(enemy.x, enemy.y, payload.splash, payload.mult || 1, payload);
      if (payload.chain) this.chainDamage(enemy, payload.chain, payload.mult || 1, payload);
      if (payload.remainingPierce > 0) payload.remainingPierce -= 1;
      else {
        window.clearInterval(projectile.hitScanTimer);
        projectile.destroy();
      }
    }

    createProjectileImpact(x, y, color = 0xffffff, size = 10) {
      const burst = this.add.circle(x, y, size, color, 0.28).setDepth(10);
      burst.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: burst, alpha: 0, scale: 1.9, duration: 170, ease: 'Quad.easeOut', onComplete: () => burst.destroy() });
      for (let i = 0; i < 4; i += 1) {
        const spark = this.add.circle(x, y, 2, 0xffffff, 0.72).setDepth(11);
        spark.setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: spark,
          x: x + Phaser.Math.Between(-18, 18),
          y: y + Phaser.Math.Between(-14, 14),
          alpha: 0,
          duration: 150,
          ease: 'Quad.easeOut',
          onComplete: () => spark.destroy()
        });
      }
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
      this.playCharacterMotion('skill', key);
      this.createSkillCastFx(skill);
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
        this.tweens.add({ targets: meteor, y: 500, duration: 620 + i * 120, ease: 'Quad.easeIn', onComplete: () => {
          this.damageRadius(meteor.x, 500, 120, 3.0, { status: 'burn', popupColor: '#ff6a21' });
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
      const y = clamp(pointer.worldY || this.player.y, 80, 500);
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

    playCharacterMotion(kind, variant = 1) {
      if (!this.player) return;
      this.motionToken = (this.motionToken || 0) + 1;
      const token = this.motionToken;
      const baseScale = 1.08;
      const frames = kind === 'skill'
        ? [
          { t: 0, sx: 0.96, sy: 1.08, angle: -5, y: -2 },
          { t: 45, sx: 1.08, sy: 0.96, angle: 7, y: 1 },
          { t: 90, sx: 1.14, sy: 1.02, angle: 0, y: -4 },
          { t: 135, sx: 1.04, sy: 1.05, angle: -3, y: -1 },
          { t: 190, sx: 1, sy: 1, angle: 0, y: 0 }
        ]
        : [
          { t: 0, sx: 0.98, sy: 1.05, angle: -8, y: 0 },
          { t: 30, sx: 1.12, sy: 0.94, angle: 12, y: 1 },
          { t: 60, sx: 1.18, sy: 0.90, angle: 18, y: -1 },
          { t: 95, sx: 1.05, sy: 1.02, angle: -5, y: 0 },
          { t: 140, sx: 1, sy: 1, angle: 0, y: 0 }
        ];
      frames.forEach((frame) => {
        this.time.delayedCall(frame.t, () => {
          if (!this.player || token !== this.motionToken) return;
          this.player.setScale(baseScale * frame.sx, baseScale * frame.sy);
          this.player.setAngle(frame.angle * this.facing);
          if (frame.y && this.player.body?.blocked?.down) this.player.setVelocityY(Math.min(this.player.body.velocity.y, frame.y * 18));
          if (kind === 'skill' && frame.t === 90) this.spawnAfterImage(0x9bdcff, 0.22);
        });
      });
      this.time.delayedCall(frames[frames.length - 1].t + 35, () => {
        if (!this.player || token !== this.motionToken) return;
        this.player.setScale(baseScale).setAngle(0);
      });
    }

    spawnAfterImage(tint = 0xffffff, alpha = 0.20) {
      const ghost = this.add.sprite(this.player.x - this.facing * 10, this.player.y, this.getPlayerTextureKey())
        .setScale(this.player.scaleX, this.player.scaleY)
        .setFlipX(this.player.flipX)
        .setTint(tint)
        .setAlpha(alpha)
        .setDepth(this.player.depth - 1)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: ghost, x: ghost.x - this.facing * 22, alpha: 0, duration: 220, ease: 'Quad.easeOut', onComplete: () => ghost.destroy() });
    }

    createBasicSwingFx(step) {
      const color = this.hitboxColor({ element: save.path === 'mythic' ? 'mythic' : null });
      const frames = [
        { t: 0, reach: 34, w: 58, h: 18, alpha: 0.22, angle: -36 },
        { t: 28, reach: 48, w: 86, h: 28, alpha: 0.34, angle: -18 },
        { t: 56, reach: 64, w: step === 3 ? 138 : 108, h: step === 3 ? 52 : 38, alpha: 0.46, angle: 8 },
        { t: 84, reach: 74, w: step === 3 ? 156 : 124, h: step === 3 ? 58 : 42, alpha: 0.28, angle: 28 },
        { t: 118, reach: 80, w: step === 3 ? 164 : 132, h: step === 3 ? 62 : 46, alpha: 0.12, angle: 42 }
      ];
      frames.forEach((frame, index) => {
        this.time.delayedCall(frame.t, () => {
          if (!this.player) return;
          const x = this.player.x + this.facing * frame.reach;
          const y = this.player.y - 4 + index * 2;
          const angle = this.facing > 0 ? frame.angle : 180 - frame.angle;
          const slash = this.add.ellipse(x, y, frame.w, frame.h, color, frame.alpha)
            .setAngle(angle)
            .setDepth(24 + index)
            .setBlendMode(Phaser.BlendModes.ADD);
          const edge = this.add.rectangle(x + this.facing * 16, y - 2, frame.w * 0.72, 6, 0xffffff, frame.alpha + 0.22)
            .setAngle(angle)
            .setDepth(28 + index)
            .setBlendMode(Phaser.BlendModes.ADD);
          this.tweens.add({ targets: [slash, edge], alpha: 0, scaleX: 1.28, scaleY: 1.12, duration: 120, ease: 'Quad.easeOut', onComplete: () => { slash.destroy(); edge.destroy(); } });
        });
      });
      if (step === 3) this.time.delayedCall(58, () => this.spawnAfterImage(color, 0.18));
    }

    createSkillCastFx(skill) {
      const color = save.path === 'terrain' && save.terrain ? Number(`0x${TERRAIN_JOBS[save.terrain].aura.slice(1)}`) : (save.path === 'mythic' ? 0xba55d3 : BASE_CLASSES[save.baseClass]?.color || 0xffd166);
      const ring = this.add.circle(this.player.x, this.player.y + 2, 28, color, 0.12).setStrokeStyle(4, color, 0.72).setDepth(22).setBlendMode(Phaser.BlendModes.ADD);
      const glyph = this.add.text(this.player.x, this.player.y - 64, skill.key, { fontFamily: 'Arial Black', fontSize: '24px', color: '#ffffff', stroke: '#000000', strokeThickness: 5 }).setOrigin(0.5).setDepth(35);
      this.tweens.add({ targets: ring, radius: 74, alpha: 0, duration: 260, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
      this.tweens.add({ targets: glyph, y: glyph.y - 26, alpha: 0, scale: 1.35, duration: 420, ease: 'Quad.easeOut', onComplete: () => glyph.destroy() });
      for (let i = 0; i < 5; i += 1) {
        this.time.delayedCall(i * 32, () => {
          const spark = this.add.circle(this.player.x + Phaser.Math.Between(-28, 28), this.player.y + Phaser.Math.Between(-50, 12), 3 + (i % 2), color, 0.82).setDepth(26).setBlendMode(Phaser.BlendModes.ADD);
          this.tweens.add({ targets: spark, y: spark.y - 26, alpha: 0, duration: 260, onComplete: () => spark.destroy() });
        });
      }
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

