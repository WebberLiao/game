// ══════════ 遊戲狀態 ══════════
let G = null;

function newGame(playerName) {
  return {
    name: playerName || 'Player',
    gold: 200, xp: 0, level: 1,
    statPoints: 0,
    skillPoints: 1,
    stats: { hp:80, maxHp:80, mp:40, maxMp:40, atk:8, def:5, matk:5, mdef:4, spd:7 },
    allDice: JSON.parse(JSON.stringify(DEFAULT_DICE)),
    equippedDice: [0, 1, 2],
    learnedSkills: [],
    skills: [],
    quests: [], bag: [], bagMax: 2, clearedMaps: [],
    equips: { weapon:null, armor:null, accessory:null },
    storyQuests: {},
    achievements: [],
    achStats: { kills:0, eliteKills:0, bossNoItem:0, perfectRuns:0, npcTalks:0, youngSage:0, brokeRun:0, lastHpBoss:0, lowLevelClear:0 },
    daily: {               // 每日任務
      date: '',            // 今日日期字串 YYYY-MM-DD
      quests: [],          // [{ id, type, need, desc, reward, progress, done }]
      claimed: [],         // 已領取的任務 id
    },
    checkin: {             // 簽到
      lastDate: '',        // 上次簽到日期
      streak: 0,           // 連續天數
      totalDays: 0,        // 累積天數
      claimedMilestones: [],
    },
  };
}

function getEquippedDice() {
return G.equippedDice.map(i => G.allDice[i]);
}

// ══════════ 存讀檔 ══════════
function saveGame() {
localStorage.setItem('diceRPG_save', JSON.stringify(G));
toast('存檔成功 ◆');
}

function loadGame() {
const s = localStorage.getItem('diceRPG_save');
return s ? JSON.parse(s) : null;
}

function hasSave() {
return !!localStorage.getItem('diceRPG_save');
}

function deleteSave() {
localStorage.removeItem('diceRPG_save');
G = null;
updateMainMenu();
showScreen('screen-main');
toast('存檔已刪除');
}

function exportSave() {
const s = localStorage.getItem('diceRPG_save');
if (!s) { toast('沒有存檔可匯出'); return; }
const a = document.createElement('a');
a.href = URL.createObjectURL(new Blob([s], { type: 'application/json' }));
a.download = 'dicechronicle_save.json';
a.click();
URL.revokeObjectURL(a.href);
toast('存檔已匯出');
}

function importSave(e) {
const file = e.target.files[0]; if (!file) return;
const reader = new FileReader();
reader.onload = ev => {
try {
const data = JSON.parse(ev.target.result);
if (!data.stats) { toast('存檔格式錯誤'); return; }
if (!data.allDice)      data.allDice = data.dice || [];
if (!data.equippedDice) data.equippedDice = [0, 1, 2];
if (!data.clearedMaps)   data.clearedMaps  = [];
if (!data.equips)        data.equips       = { weapon:null, armor:null, accessory:null };
if (!data.learnedSkills) data.learnedSkills = data.skills || [];
if (!data.skills)        data.skills        = [];
if (data.statPoints  === undefined) data.statPoints  = 0;
if (data.skillPoints === undefined) data.skillPoints = 0;
if (!data.name)          data.name = 'Player';
if (!data.storyQuests)   data.storyQuests = {};
if (!data.achievements)  data.achievements = [];
if (!data.daily)         data.daily = { date:'', quests:[], claimed:[] };
if (!data.checkin)       data.checkin = { lastDate:'', streak:0, totalDays:0, claimedMilestones:[] };
if (!data.achStats)      data.achStats = { kills:0, eliteKills:0, bossNoItem:0, perfectRuns:0, npcTalks:0, youngSage:0, brokeRun:0, lastHpBoss:0, lowLevelClear:0 };
if (!data.equips)        data.equips = { weapon:null, armor:null, accessory:null };
if (!data.learnedSkills) data.learnedSkills = data.skills || [];
if (!data.skills)        data.skills = [];
if (data.statPoints  === undefined) data.statPoints  = 0;
if (data.skillPoints === undefined) data.skillPoints = 0;
if (!data.name)          data.name = 'Player';
localStorage.setItem('diceRPG_save', JSON.stringify(data));
G = data;
updateMainMenu();
toast('存檔匯入成功！');
} catch { toast('存檔格式錯誤'); }
};
reader.readAsText(file);
e.target.value = '';
}

// ══════════ 升級 ══════════
function checkLevelUp() {
  const needed = G.level * 30;
  if (G.xp >= needed) {
    G.xp -= needed;
    G.level++;
    G.statPoints  += 2;  // 每級 2 屬性點
    G.skillPoints += 1;  // 每級 1 技能點
    toast('🎉 升級！Lv.' + G.level + '　獲得屬性點×2、技能點×1');
    // 如果在城鎮/酒館就彈出分配畫面
    if (document.getElementById('screen-barracks').classList.contains('active') ||
        document.getElementById('screen-town').classList.contains('active')) {
      showLevelUpOverlay();
    }
  }
}

function spendStatPoint(stat) {
  if (!G.statPoints) { toast('沒有可用的屬性點'); return; }
  const gains = { atk:2, def:2, matk:2, mdef:2, maxHp:15, maxMp:10, spd:2 };
  const gain = gains[stat] || 1;
  G.stats[stat] = (G.stats[stat] || 0) + gain;
  if (stat === 'maxHp') { G.stats.hp = Math.min(G.stats.hp + gain, G.stats.maxHp); }
  if (stat === 'maxMp') { G.stats.mp = Math.min(G.stats.mp + gain, G.stats.maxMp); }
  G.statPoints--;
  renderLevelUpOverlay();
}

function learnSkill(skillId) {
  if (!G.skillPoints) { toast('沒有可用的技能點'); return; }
  if (G.learnedSkills.includes(skillId)) { toast('已學過此技能'); return; }
  // 確認前置條件
  let prereqOk = true;
  for (const branch of Object.values(SKILL_TREE)) {
    const node = branch.nodes.find(n => n.id === skillId);
    if (node && node.prereq && !G.learnedSkills.includes(node.prereq)) {
      prereqOk = false; break;
    }
  }
  if (!prereqOk) { toast('需要先學習前置技能'); return; }
  G.learnedSkills.push(skillId);
  G.skillPoints--;
  // 自動裝備（slots 不滿時）
  if (G.skills.length < 3) G.skills.push(skillId);
  toast('✦ 學會：' + (SKILLS_DEF.find(s => s.id === skillId) || {}).name);
  renderSkillTree();
  renderBarracks();
}

function equipSkill(skillId) {
  if (!G.learnedSkills.includes(skillId)) return;
  if (G.skills.includes(skillId)) {
    G.skills = G.skills.filter(s => s !== skillId);
    toast('卸除技能');
  } else {
    if (G.skills.length >= 3) { toast('最多裝備 3 個技能，請先卸除一個'); return; }
    G.skills.push(skillId);
    toast('裝備技能');
  }
  renderSkillTree();
  renderBarracks();
}

// ══════════ 背包 ══════════
function addToBag(id) {
if (G.bag.length >= G.bagMax) { toast('背包已滿！'); return false; }
G.bag.push(id);
return true;
}
// ══════════ 裝備系統 ══════════
function buildEquipItem(baseId, affixIds) {
  const base = EQUIP_BASE[baseId];
  if (!base) return null;
  const item = JSON.parse(JSON.stringify(base));
  item.uid = Date.now() + Math.random().toString(36).slice(2);
  item.affixes = [];
  (affixIds || []).forEach(aid => {
    const pool = [...AFFIXES.prefix, ...AFFIXES.suffix];
    const found = pool.find(a => a.id === aid);
    if (found) item.affixes.push(found);
  });
  // 產生完整名稱
  const pre  = item.affixes.find(a => AFFIXES.prefix.some(p => p.id === a.id));
  const suf  = item.affixes.find(a => AFFIXES.suffix.some(s => s.id === a.id));
  item.fullName = (pre ? pre.name : '') + item.name + (suf ? ' ' + suf.name : '');
  item.rarity   = Math.max(0, ...item.affixes.map(a => a.rare || 0));
  return item;
}

function rollEquipDrop(mapId) {
  // 依地圖決定品質
  const tierMap = { village:1, plains:1, ruins:2, cave:2, swamp:3 };
  const tier = tierMap[mapId] || 1;
  const allBase = Object.values(EQUIP_BASE);
  const pool = allBase.filter(b => {
    if (tier === 1) return ['w_short','w_staff','a_cloth','r_amulet'].includes(b.id);
    if (tier === 2) return !['w_short','w_staff','a_cloth','r_amulet','a_plate','a_chain','a_silk','r_cloak','r_crown'].includes(b.id);
    return true;
  });
  const base = pool[Math.floor(Math.random() * pool.length)];
  // 機率決定詞綴數量
  const r = Math.random();
  let affixCount = 0;
  if (r < 0.25) affixCount = 1;      // 25% 一個詞綴
  if (r < 0.08) affixCount = 2;      // 8% 兩個詞綴
  const affixIds = [];
  if (affixCount > 0) {
    const pre = AFFIXES.prefix.filter(a => a.rare <= tier);
    affixIds.push(pre[Math.floor(Math.random() * pre.length)].id);
  }
  if (affixCount > 1) {
    const suf = AFFIXES.suffix.filter(a => a.rare <= tier);
    affixIds.push(suf[Math.floor(Math.random() * suf.length)].id);
  }
  return buildEquipItem(base.id, affixIds);
}

function calcEquipStats() {
  // 回傳所有裝備提供的加成總和 (flat object)
  const bonus = {};
  if (!G.equips) return bonus;
  Object.values(G.equips).forEach(eq => {
    if (!eq) return;
    const merge = (s) => {
      Object.entries(s).forEach(([k,v]) => { bonus[k] = (bonus[k]||0) + v; });
    };
    merge(eq.stats || {});
    (eq.affixes || []).forEach(a => { bonus[a.stat] = (bonus[a.stat]||0) + a.val; });
  });
  // 套裝加成
  Object.values(SET_BONUSES).forEach(set => {
    const worn = set.pieces.filter(p =>
      Object.values(G.equips).some(eq => eq && eq.id === p)
    );
    if (worn.length === set.pieces.length) {
      Object.entries(set.bonus).forEach(([k,v]) => { bonus[k] = (bonus[k]||0) + v; });
    }
  });
  return bonus;
}

function getEffectiveStat(stat) {
  const base = G.stats[stat] || 0;
  const bonus = calcEquipStats();
  return base + (bonus[stat] || 0);
}

function equipItem(eq) {
  if (!G.equips) G.equips = { weapon:null, armor:null, accessory:null };
  const slot = eq.slot;
  // 無職業限制
  G.equips[slot] = eq;
  // 移出背包（裝備直接從背包裝上）
  const idx = G.bag.findIndex(b => b && b.uid === eq.uid);
  if (idx !== -1) G.bag.splice(idx, 1);
  toast(eq.fullName + ' 已裝備');
  return true;
}

function unequipItem(slot) {
  if (!G.equips || !G.equips[slot]) return;
  const eq = G.equips[slot];
  if (G.bag.length >= G.bagMax) { toast('背包已滿，無法卸下'); return; }
  G.bag.push(eq);
  G.equips[slot] = null;
  toast(eq.fullName + ' 已卸下');
}

function buyEquip(baseId) {
  const base = EQUIP_BASE[baseId];
  if (!base) return;
  if (G.gold < base.buyPrice) { toast('金幣不足'); return; }
  const item = buildEquipItem(baseId, []);
  if (G.bag.length >= G.bagMax) { toast('背包已滿'); return; }
  G.gold -= base.buyPrice;
  G.bag.push(item);
  toast('購入 ' + item.fullName);
  renderShop();
}

// ══════════ 被動技能系統 ══════════
function calcPassives() {
  // 回傳所有已學被動提供的加成 { stat: value }
  const bonus = {};
  if (!G || !G.learnedSkills) return bonus;
  G.learnedSkills.forEach(id => {
    const p = (typeof ALL_PASSIVES !== 'undefined') ? ALL_PASSIVES.find(p => p.id === id) : null;
    if (!p || !p.statBonus) return;
    Object.entries(p.statBonus).forEach(([k, v]) => {
      bonus[k] = (bonus[k] || 0) + v;
    });
  });
  return bonus;
}

function getEffectiveStatWithPassive(stat) {
  const base = G.stats[stat] || 0;
  const eqBonus = (typeof calcEquipStats === 'function') ? (calcEquipStats()[stat] || 0) : 0;
  const passBonus = calcPassives()[stat] || 0;
  return base + eqBonus + passBonus;
}

function triggerPassive(trigger, context) {
  // 觸發型被動：on_hit / on_kill / on_evade / on_low_hp
  if (!G || !G.learnedSkills) return null;
  const results = [];
  G.learnedSkills.forEach(id => {
    const p = (typeof ALL_PASSIVES !== 'undefined') ? ALL_PASSIVES.find(p => p.id === id) : null;
    if (!p || p.type !== 'trigger' || p.trigger !== trigger) return;
    if (Math.random() > (p.chance || 1)) return;
    results.push(p);
  });
  return results;
}

// ══════════ 成就系統 ══════════
function checkAchievements() {
  if (!G || typeof ACHIEVEMENTS === 'undefined') return [];
  const newlyUnlocked = [];
  ACHIEVEMENTS.forEach(ach => {
    if (G.achievements.includes(ach.id)) return;
    try {
      if (ach.cond(G)) {
        G.achievements.push(ach.id);
        newlyUnlocked.push(ach);
      }
    } catch(e) {}
  });
  if (newlyUnlocked.length) {
    newlyUnlocked.forEach(ach => toast('🏆 成就解鎖：' + ach.name + '　' + ach.icon));
    saveGame();
  }
  return newlyUnlocked;
}

function addAchStat(key, amount) {
  if (!G || !G.achStats) return;
  G.achStats[key] = (G.achStats[key] || 0) + (amount || 1);
  checkAchievements();
}

// ══════════ 工具：取今日日期字串 ══════════
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

// ══════════ 每日任務 ══════════
function refreshDailyQuests() {
  if (!G) return;
  if (!G.daily) G.daily = { date:'', quests:[], claimed:[] };
  const today = todayStr();
  if (G.daily.date === today) return;  // 今天已刷新

  // 隨機選 3 個不重複任務
  const pool = typeof DAILY_QUEST_POOL !== 'undefined' ? [...DAILY_QUEST_POOL] : [];
  const picked = [];
  const difficulties = ['easy','medium','hard'];
  // 按難易度各選一個
  const easy   = pool.filter(q => q.reward.gold <= 80);
  const medium = pool.filter(q => q.reward.gold > 80 && q.reward.gold <= 180);
  const hard   = pool.filter(q => q.reward.gold > 180);
  [easy, medium, hard].forEach(group => {
    if (group.length) picked.push(group[Math.floor(Math.random() * group.length)]);
  });

  G.daily.date    = today;
  G.daily.quests  = picked.map(q => ({ ...q, progress: 0, done: false }));
  G.daily.claimed = [];
  saveGame();
}

function updateDailyProgress(type, amount) {
  if (!G || !G.daily) return;
  refreshDailyQuests();
  let updated = false;
  G.daily.quests.forEach(q => {
    if (q.done || q.type !== type) return;
    q.progress = (q.progress || 0) + (amount || 1);
    if (q.progress >= q.need) {
      q.done = true;
      updated = true;
      toast('📋 每日任務完成：' + q.desc + '！回酒館領取獎勵');
    }
  });
  if (updated) saveGame();
}

function claimDailyQuest(idx) {
  if (!G || !G.daily) return;
  const q = G.daily.quests[idx];
  if (!q || !q.done || G.daily.claimed.includes(q.id)) return;
  G.gold += q.reward.gold || 0;
  G.xp   += q.reward.xp   || 0;
  (q.reward.items || []).forEach(id => addToBag(id));
  G.daily.claimed.push(q.id);
  checkAchievements && checkAchievements();
  saveGame();
  toast('✦ 領取每日任務獎勵：' + (q.reward.gold||0) + ' 金 ＋' + (q.reward.xp||0) + ' XP');
}

// ══════════ 簽到系統 ══════════
function doCheckin() {
  if (!G) return false;
  if (!G.checkin) G.checkin = { lastDate:'', streak:0, totalDays:0, claimedMilestones:[] };
  const today = todayStr();
  if (G.checkin.lastDate === today) return false;  // 今天已簽到

  const yesterday = (() => {
    const d = new Date(); d.setDate(d.getDate()-1);
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  })();

  G.checkin.streak = G.checkin.lastDate === yesterday ? G.checkin.streak + 1 : 1;
  G.checkin.totalDays++;
  G.checkin.lastDate = today;

  // 基礎獎勵：10金 + streak加成
  const baseGold = 10 + G.checkin.streak * 5;
  const baseXp   = 5  + G.checkin.streak * 2;
  G.gold += baseGold;
  G.xp   += baseXp;

  // 里程碑獎勵
  let milestoneMsg = '';
  if (typeof CHECKIN_MILESTONES !== 'undefined') {
    CHECKIN_MILESTONES.forEach(m => {
      if (G.checkin.streak === m.days && !G.checkin.claimedMilestones.includes(m.days)) {
        G.checkin.claimedMilestones.push(m.days);
        G.gold += m.reward.gold || 0;
        G.xp   += m.reward.xp   || 0;
        (m.reward.items || []).forEach(id => addToBag(id));
        milestoneMsg = '\n🎁 連簽里程碑：' + m.desc + '！';
      }
    });
  }

  checkLevelUp();
  saveGame();
  return { streak: G.checkin.streak, gold: baseGold, xp: baseXp, milestone: milestoneMsg };
}
