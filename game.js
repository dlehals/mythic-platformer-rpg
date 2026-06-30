(() => {
  'use strict';

  const SAVE_KEY = 'mythic-terrain-rpg-save-v1';
  const ITEM_VALUES = { Common: 10, Rare: 50, Epic: 120, Legendary: 200, Mythic: 1000 };
  const KEYS = ['Z', 'C', 'V', 'R'];
  const clamp = Phaser.Math.Clamp;
  const $ = (id) => document.getElementById(id);

  const BASE_CLASSES = {
    berserker: {
      title: 'Berserker', color: 0xff5a4f,
      desc: '강한 근접 콤보, 넓은 판정, 폭발적인 궁극기.',
      stats: { hp: 170, mp: 70, atk: 17, speed: 235, jump: 520, crit: 0.08 }
    },
    sniper: {
      title: 'Sniper', color: 0x8be9fd,
      desc: '화살과 관통 사격으로 거리를 지배하는 원거리 직업.',
      stats: { hp: 125, mp: 95, atk: 14, speed: 255, jump: 515, crit: 0.13 }
    },
    sorcerer: {
      title: 'Sorcerer', color: 0xb388ff,
      desc: '원소 투사체, 순간이동, 마나 보호막을 쓰는 마법 직업.',
      stats: { hp: 115, mp: 145, atk: 15, speed: 230, jump: 500, crit: 0.1 }
    },
    assassin: {
      title: 'Assassin', color: 0x8aff80,
      desc: '빠른 근접 타격, 독, 은신, 연속 베기로 폭딜을 넣는 직업.',
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
      baseClass: null, path: 'base', terrain: null, mythic: null, zone: 'town',
      level: 1, exp: 0, gold: 60, hp: 0, mp: 0,
      inventory: [], equipped: null, materials: {}, zoneKills: {}, bossKills: {}, defeatedBosses: {},
      settings: { shake: true, mobile: true }
    };
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
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
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
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
    if (save.path === 'mythic') return save.mythic === 'chrono' ? 'Time Intervener' : 'Grim Reaper';
    if (save.path === 'terrain' && save.terrain && TERRAIN_JOBS[save.terrain]) {
      return TERRAIN_JOBS[save.terrain][save.baseClass] || 'Terrain Class';
    }
    return BASE_CLASSES[save.baseClass]?.title || 'No Class';
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

  function renderSkills(scene) {
    const bar = $('skillBar');
    const skills = getActiveSkills();
    bar.innerHTML = skills.map((skill) => `
      <div class="skill-slot" data-skill="${skill.key}">
        <strong>${skill.key}</strong>
        <small>${skill.name}</small>
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
    $('goldText').textContent = `${save.gold}g`;
    $('hpFill').style.width = `${clamp((hp / stats.hp) * 100, 0, 100)}%`;
    $('mpFill').style.width = `${clamp((mp / stats.mp) * 100, 0, 100)}%`;
    $('hpText').textContent = `HP ${Math.ceil(hp)} / ${stats.hp}`;
    $('mpText').textContent = `MP ${Math.ceil(mp)} / ${stats.mp}`;
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
  }

  function renderInventory() {
    const list = $('inventoryList');
    if (!save.inventory.length) {
      list.innerHTML = '<div class="item-row"><div>비어 있음<div class="meta">몬스터 처치, 보스 처치, Mythic 드랍으로 아이템을 얻습니다.</div></div></div>';
      return;
    }
    list.innerHTML = save.inventory.map((item) => {
      const sell = ITEM_VALUES[item.rarity] || 10;
      const equip = item.type === 'mythic' ? `<button data-equip="${item.id}">Equip</button>` : '<span></span>';
      return `<div class="item-row">
        <div><strong class="rarity-${item.rarity}">${item.name}</strong><div class="meta">${item.rarity} · ${item.desc || item.type} · Sell ${sell}g</div></div>
        ${equip}
        <button data-sell="${item.id}">Scrap/Sell</button>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-sell]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = save.inventory.find((entry) => entry.id === button.dataset.sell);
        if (!item) return;
        save.gold += ITEM_VALUES[item.rarity] || 10;
        removeInventoryItem(item.id);
        toast(`${item.name} 판매 +${ITEM_VALUES[item.rarity] || 10}g`);
        updateHud(activeScene);
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
        if (activeScene) activeScene.refreshPlayerIdentity(true);
      });
    });
  }

  function setupDom() {
    const classChoices = $('classChoices');
    classChoices.innerHTML = Object.entries(BASE_CLASSES).map(([id, data]) => `
      <button class="choice-card" data-class="${id}">
        <h3>${data.title}</h3>
        <p>${data.desc}</p>
      </button>`).join('');
    classChoices.querySelectorAll('[data-class]').forEach((button) => {
      button.addEventListener('click', () => {
        save = freshSave();
        save.baseClass = button.dataset.class;
        const stats = getBaseStats();
        save.hp = stats.hp;
        save.mp = stats.mp;
        save.inventory.push({ id: `starter-${Date.now()}`, name: 'Starter Potion', rarity: 'Common', type: 'consumable', desc: '판매용 시작 아이템' });
        saveGame();
        $('classModal').classList.remove('visible');
        AudioFX.playUiSound();
        if (activeScene) activeScene.scene.restart();
      });
    });
    $('classModal').classList.toggle('visible', !save.baseClass);
    $('inventoryButton').addEventListener('click', () => { renderInventory(); $('inventoryModal').classList.add('visible'); AudioFX.playUiSound(); });
    $('closeInventory').addEventListener('click', () => $('inventoryModal').classList.remove('visible'));
    $('saveButton').addEventListener('click', () => { saveGame(); toast('저장 완료'); });
    $('resetButton').addEventListener('click', () => {
      if (!confirm('저장 데이터를 초기화할까요?')) return;
      localStorage.removeItem(SAVE_KEY);
      save = freshSave();
      location.reload();
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
      this.cameras.main.startFollow(this.player, true, 0.08, 0.08, 0, 90);
      renderSkills(this);
      renderInventory();
      if (!save.baseClass) this.physics.pause();
    }

    createTextures() {
      const makeRect = (key, w, h, color, stroke = 0xffffff) => {
        if (this.textures.exists(key)) return;
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(color, 1).fillRoundedRect(1, 1, w - 2, h - 2, 6);
        g.lineStyle(2, stroke, 0.55).strokeRoundedRect(1, 1, w - 2, h - 2, 6);
        g.generateTexture(key, w, h);
        g.destroy();
      };
      makeRect('player', 40, 58, 0xf2f2f2, 0x111111);
      makeRect('monster', 42, 42, 0xff6a21, 0x2a0f0f);
      makeRect('boss', 96, 104, 0xff3300, 0xffffff);
      makeRect('arrow', 34, 8, 0xd4f1ff, 0x161616);
      makeRect('orb', 18, 18, 0xb388ff, 0xffffff);
      makeRect('slash', 46, 18, 0xffffff, 0xffd166);
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
      this.addInteractable(280, 595, 150, 120, 'Lava Portal [E]', () => this.travelTo('lava'), 0xff3300);
      this.addInteractable(520, 595, 150, 120, 'Frost Portal [E]', () => this.travelTo('frost'), 0x67d9ff);
      this.addInteractable(760, 595, 150, 120, 'Ruin Portal [E]', () => this.travelTo('ruin'), 0xffd166);
      this.addInteractable(1000, 595, 150, 120, 'Abyss Portal [E]', () => this.travelTo('abyss'), 0xba55d3);
      this.addInteractable(1270, 595, 150, 120, 'Arena [E]', () => this.travelTo('arena'), 0xffffff);
      this.addInteractable(1680, 592, 170, 120, 'Anvil NPC [E]', () => this.tryTerrainEvolution(), 0xffb642);
      this.addInteractable(1930, 592, 170, 120, 'Supply NPC [E]', () => this.buyPotion(), 0x8be9fd);
    }

    buildArena() {
      this.addPlatform(650, 535, 250, 28, 0x30384a);
      this.addPlatform(1800, 520, 350, 28, 0x30384a);
      this.addInteractable(120, 594, 130, 120, 'Town [E]', () => this.travelTo('town'), 0xffffff);
    }

    buildTerrainZone(zoneId) {
      this.addInteractable(110, 594, 130, 120, 'Town [E]', () => this.travelTo('town'), 0xffffff);
      this.addPlatform(650, 535, 280, 28, 0x2c3448);
      this.addPlatform(1160, 470, 260, 28, 0x2c3448);
      this.addPlatform(1700, 545, 310, 28, 0x2c3448);
      this.addPlatform(2290, 480, 360, 28, 0x2c3448);
      this.addHazard(925, 632, 300, 35);
      this.addHazard(1505, 632, 260, 35);
      this.addHazard(2600, 632, 420, 35);
      this.add.text(2870, 585, 'Boss Gate: kill 10 mobs', { fontFamily: 'Consolas', fontSize: '16px', color: '#fff', stroke: '#000', strokeThickness: 4 });
    }

    createPlayer() {
      const startX = save.zone === 'town' ? 150 : 135;
      this.player = this.physics.add.sprite(startX, 520, 'player');
      this.player.setCollideWorldBounds(true);
      this.player.setDragX(1500);
      this.player.setMaxVelocity(720, 900);
      this.player.body.setSize(30, 52).setOffset(5, 6);
      this.facing = 1;
      this.refreshPlayerIdentity(false);
    }

    refreshPlayerIdentity(restartStats) {
      this.stats = getBaseStats();
      if (restartStats) {
        this.playerHp = this.stats.hp;
        this.playerMp = this.stats.mp;
      }
      const baseColor = save.path === 'mythic' ? 0xba55d3 : save.path === 'terrain' ? Number(`0x${TERRAIN_JOBS[save.terrain].aura.slice(1)}`) : BASE_CLASSES[save.baseClass]?.color || 0xffffff;
      this.player.setTint(baseColor);
      if (save.path === 'mythic') this.createShadowTwin();
      renderSkills(this);
      updateHud(this);
    }

    createShadowTwin() {
      if (this.shadowTwin) this.shadowTwin.destroy();
      this.shadowTwin = this.add.sprite(this.player.x - 18, this.player.y, 'player').setTint(0xba55d3).setAlpha(0.32);
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
        this.spawnEnemy(2350, 510, { name: 'Training Dummy', hp: 999, atk: 0, exp: 0, gold: 0, tint: 0xeeeeee, dummy: true });
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
      if (this.shadowTwin) {
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
      if (save.gold < 30) { toast('골드 부족'); return; }
      save.gold -= 30;
      addItem({ name: 'Field Potion', rarity: 'Common', type: 'consumable', desc: '판매하거나 나중에 회복 시스템 확장에 사용' });
      updateHud(this);
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
      this.nextAttackAt = time + (save.baseClass === 'assassin' ? 170 : 230);
      if (save.path === 'mythic') {
        this.spawnHitbox({ w: 105, h: 76, offsetX: 62, mult: 2.4, lifetime: 105, knockback: 210, element: 'mythic' });
        return;
      }
      const cls = save.baseClass;
      if (cls === 'berserker') this.berserkerBasic(this.comboStep);
      if (cls === 'sniper') this.sniperBasic(this.comboStep);
      if (cls === 'sorcerer') this.sorcererBasic(this.comboStep);
      if (cls === 'assassin') this.assassinBasic(this.comboStep);
    }

    berserkerBasic(step) {
      const table = [null, { w: 64, h: 48, mult: 1, stun: 100 }, { w: 64, h: 64, mult: 1.2, lift: -50 }, { w: 80, h: 80, mult: 1.8, knockback: 250 }];
      this.spawnHitbox({ ...table[step], offsetX: 56, lifetime: 120 });
    }

    sniperBasic(step) {
      if (step === 1) this.spawnProjectile({ texture: 'arrow', speed: 600, mult: 0.8, pierce: 0 });
      if (step === 2) {
        this.spawnProjectile({ texture: 'arrow', speed: 600, mult: 0.6, pierce: 0, offsetY: -8 });
        this.spawnProjectile({ texture: 'arrow', speed: 600, mult: 0.6, pierce: 0, offsetY: 8 });
      }
      if (step === 3) this.time.delayedCall(100, () => this.spawnProjectile({ texture: 'arrow', speed: 720, mult: 1.5, pierce: 2, scaleX: 1.8 }));
    }

    sorcererBasic(step) {
      if (step === 1) this.spawnProjectile({ texture: 'orb', speed: 400, mult: 0.9, splash: 20, tint: 0xff6a21, status: 'burn' });
      if (step === 2) this.spawnProjectile({ texture: 'orb', speed: 450, mult: 0.9, tint: 0x9ae7ff, status: 'slow' });
      if (step === 3) this.spawnProjectile({ texture: 'orb', speed: 550, mult: 1.2, tint: 0xfff06a, chain: 1, status: 'shock' });
    }

    assassinBasic(step) {
      const table = [null, { w: 48, h: 32, mult: 0.7, lifetime: 70 }, { w: 56, h: 40, mult: 0.8, lifetime: 85 }, { w: 64, h: 48, mult: 1.3, lifetime: 110, critBonus: 0.1 }];
      this.spawnHitbox({ ...table[step], offsetX: 43 });
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
      return this.stats.atk * mult * terrainMultiplier();
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
      if (crit) this.criticalJuice();
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
        fontFamily: crit ? 'Arial Black' : 'Arial', fontSize: crit ? '32px' : '20px', fontStyle: 'bold',
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
      tracker.textContent = `${value} Combo`;
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
      if (roll < 0.05) addItem({ name: 'Legendary Relic', rarity: 'Legendary', type: 'treasure', desc: '높은 가격에 판매 가능' });
      else if (roll < 0.14) addItem({ name: 'Epic Gem', rarity: 'Epic', type: 'treasure', desc: '판매용 보석' });
      else if (roll < 0.34) addItem({ name: 'Rare Alloy', rarity: 'Rare', type: 'treasure', desc: '판매용 재료' });
      else if (roll < 0.62) addItem({ name: 'Monster Scrap', rarity: 'Common', type: 'treasure', desc: '판매용 잡동사니' });
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
      if ((this.cooldowns[key] || 0) > time) { toast('쿨다운 중'); return; }
      if (this.playerMp < skill.mp) { toast('MP 부족'); return; }
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
      if (!target) { toast('대상 없음'); return; }
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

