// ══════════ 遊戲狀態 ══════════
let G = null;

function newGame(jobId) {
return {
gold: 200, xp: 0, level: 1, job: jobId,
stats: JSON.parse(JSON.stringify(job.stats)),
allDice: JSON.parse(JSON.stringify(job.dice)),
equippedDice: [0, 1, 2],
skills: [...job.startSkills],
quests: [], bag: [], bagMax: 2, clearedMaps: [],
equips: { weapon:null, armor:null, accessory:null },
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
if (!data.clearedMaps)  data.clearedMaps = [];
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
