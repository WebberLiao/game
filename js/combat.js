// ══════════ 戰鬥狀態 ══════════
let combat = null;

function diceMultiplier(n) {
return n === 0 ? 0 : Math.pow(1.3, n - 1);
}

// ══════════ 進入冒險 ══════════
function enterAdventure(mapId) {
const map = MAPS.find(m => m.id === mapId);

// 特殊地圖：備份並中毒一面
let poisonBackup = null;
if (map.special) {
const equipped = getEquippedDice();
const dieIdx = Math.floor(Math.random() * equipped.length);
const globalIdx = G.equippedDice[dieIdx];
const faces = G.allDice[globalIdx].faces;
const nonEmpty = faces.map((f, i) => ({ f, i })).filter(x => x.f !== 'none' && x.f !== 'poison');
if (nonEmpty.length > 0) {
const pick = nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
poisonBackup = { dieIdx: globalIdx, faceIdx: pick.i, orig: pick.f };
G.allDice[globalIdx].faces[pick.i] = 'poison';
}
}

combat = {
mapId, floor: 1, maxFloor: map.floors,
enemy: null, rolled: [], rerolled: false,
shield: false, evade: false, counter: false,
atkBuf: 0, defBuf: 0, itemUsed: false,
enemyBurn: 0, enemyStun: false,
playerPoison: false,
poisonBackup, log: [],
};

document.getElementById('combat-map-title').textContent = map.name;
document.getElementById('event-area').innerHTML = '';
document.getElementById('battle-area').style.display = '';
nextFloor();
showScreen('screen-combat');
}

// ══════════ 關卡流程 ══════════
function nextFloor() {
if (combat.floor > combat.maxFloor) { endAdventure(); return; }

// 隨機事件（非Boss關）
if (combat.floor < combat.maxFloor) {
const r = Math.random();
if (r < 0.10) { showMerchantEvent(); return; }
if (r < 0.15) { showChestEvent();   return; }
if (r < 0.20) { showTrapEvent();    return; }
if (r < 0.30) { showRoadNpcEvent(); return; }
}
startBattle();
}

function startBattle() {
const map = MAPS.find(m => m.id === combat.mapId);
const isBoss = combat.floor === combat.maxFloor;
const key = isBoss ? map.boss : map.pool[Math.floor(Math.random() * map.pool.length)];
const tmpl = ALL_ENEMIES[key];
combat.enemy = { ...tmpl, curHp: tmpl.hp, nextAction: pickAction(tmpl) };
combat.shield = false; combat.evade = false; combat.counter = false;
combat.atkBuf = 0; combat.defBuf = 0; combat.itemUsed = false;
combat.enemyBurn = 0; combat.enemyStun = false;
document.getElementById('combat-floor').textContent =
`第 ${combat.floor}/${combat.maxFloor} 關${isBoss ? ' 👑BOSS' : ''}`;
rollDice();
renderCombat();
addLog(`${isBoss ? '👑 BOSS！遭遇 ' : '⚔️ 遭遇 '}${combat.enemy.name}！`, 'info');
}

function pickAction(e) {
return e.actions[Math.floor(Math.random() * e.actions.length)];
}

// ══════════ 骰子 ══════════
function rollDice() {
const eq = getEquippedDice();
combat.rolled = eq.map(d => d.faces[Math.floor(Math.random() * d.faces.length)]);
combat.rerolled = false;
}

function rerollDie(idx) {
if (combat.rerolled) { toast('每回合只能重擲一次'); return; }
const eq = getEquippedDice();
const dies = document.querySelectorAll('#combat-dice .die');
dies[idx].classList.add('rolling');
setTimeout(() => {
dies[idx].classList.remove('rolling');
combat.rolled[idx] = eq[idx].faces[Math.floor(Math.random() * eq[idx].faces.length)];
combat.rerolled = true;
renderCombatDice();
}, 420);
}

function faceCounts() {
const c = {};
combat.rolled.forEach(f => { c[f] = (c[f] || 0) + 1; });
return c;
}

function getTriggerable() {
const counts = faceCounts();
return G.skills.filter(sid => {
const sk = SKILLS_DEF.find(s => s.id === sid); if (!sk) return false;
const mpOk = sk.mpCost === 0 || G.stats.mp >= sk.mpCost;
return mpOk && Object.entries(sk.req).every(([t, n]) => (counts[t] || 0) >= n);
}).map(sid => SKILLS_DEF.find(s => s.id === sid));
}

// ══════════ 玩家行動 ══════════
function doNormalAttack() {
const s = G.stats, counts = faceCounts();
let dmg = 0, parts = [];
const aN = counts['atk'] || 0, mN = counts['matk'] || 0;
const dN = counts['def'] || 0, pN = counts['poison'] || 0;

if (aN > 0) {
const v = Math.max(1, Math.floor(s.atk * diceMultiplier(aN)) + combat.atkBuf - combat.enemy.def);
dmg += v; parts.push(`物攻 ${v}`);
}
if (mN > 0) {
const v = Math.max(1, Math.floor(s.matk * diceMultiplier(mN)) - combat.enemy.mdef);
dmg += v; parts.push(`魔攻 ${v}`);
}
if (dN > 0) {
const bonus = Math.floor(s.def * diceMultiplier(dN));
combat.defBuf += bonus; parts.push(`防禦+${bonus}`);
}
if (pN > 0) {
const poisonDmg = Math.floor(s.maxHp * 0.01 * pN);
G.stats.hp = Math.max(1, G.stats.hp - poisonDmg);
addLog(`☠️ 中毒骰面！自身受到 ${poisonDmg} 傷害`, 'poison');
updatePlayerBars();
}

if (dmg > 0) {
addLog(`⚔️ ${parts.join('　')}　合計 ${dmg} 傷害`, 'dmg');
applyDmgToEnemy(dmg);
} else if (dN > 0) {
addLog(`🛡️ 防禦強化：${parts.join('　')}`, 'info');
} else if (pN === 0) {
addLog('🎲 本回合沒有攻擊骰面', 'info');
}

if (combat.enemy && combat.enemy.curHp > 0) enemyTurn();
}

function doSkill(sid) {
const sk = SKILLS_DEF.find(s => s.id === sid); if (!sk) return;
G.stats.mp = Math.max(0, G.stats.mp - sk.mpCost);
const s = G.stats;

switch (sk.effect) {
case 'shield':
combat.shield = true;
addLog(`🛡️ 【${sk.name}】：本回合傷害-60%！`, 'skill');
enemyTurn(); return;
case 'evade':
combat.evade = true;
addLog(`💨 【${sk.name}】：下次攻擊必定閃避！`, 'skill');
enemyTurn(); return;
case 'counter':
combat.counter = true;
addLog(`🔄 【${sk.name}】：下次受攻擊將反彈30%傷害！`, 'skill');
enemyTurn(); return;
case 'stun':
combat.enemyStun = true;
addLog(`💫 【${sk.name}】：敵人下回合暈眩！`, 'skill');
renderStatusTags(); enemyTurn(); return;
case 'mpfill':
G.stats.mp = Math.min(G.stats.mp + 30, G.stats.maxMp);
addLog(`💙 【${sk.name}】：回復 30 MP`, 'skill');
updatePlayerBars(); enemyTurn(); return;
case 'regen': {
const h = Math.floor(s.maxHp * 0.2);
G.stats.hp = Math.min(G.stats.hp + h, s.maxHp);
addLog(`💚 【${sk.name}】：回復 ${h} HP`, 'skill');
updatePlayerBars(); enemyTurn(); return;
}
case 'heal': {
const h = 20 + Math.floor(s.matk * 0.5);
G.stats.hp = Math.min(G.stats.hp + h, s.maxHp);
addLog(`✨ 【${sk.name}】：回復 ${h} HP`, 'skill');
updatePlayerBars(); enemyTurn(); return;
}
case 'holylight': {
const h = 35 + Math.floor(s.matk * 0.8);
G.stats.hp = Math.min(G.stats.hp + h, s.maxHp);
combat.playerPoison = false;
addLog(`🌟 【${sk.name}】：回復 ${h} HP + 解除中毒！`, 'skill');
updatePlayerBars(); renderStatusTags(); enemyTurn(); return;
}
case 'burn': {
const bd = Math.max(1, Math.floor(s.matk * sk.dmgMult) - combat.enemy.mdef);
combat.enemyBurn = 2;
addLog(`🔥 【${sk.name}】：造成 ${bd} 傷害 + 燃燒2回合！`, 'skill');
applyDmgToEnemy(bd);
renderStatusTags();
if (combat.enemy && combat.enemy.curHp > 0) enemyTurn();
return;
}
}

// 傷害型技能
const base = sk.dmgStat === 'matk' ? s.matk : s.atk;
const res  = sk.dmgStat === 'matk' ? combat.enemy.mdef : combat.enemy.def;
const dmg  = Math.max(1, Math.floor(base * sk.dmgMult) + combat.atkBuf - res);
addLog(`✨ 【${sk.name}】：造成 ${dmg} 點傷害！`, 'skill');
applyDmgToEnemy(dmg);
if (combat.enemy && combat.enemy.curHp > 0) enemyTurn();
}

function useItem(idx) {
const id = G.bag[idx], def = ITEMS_DEF[id];
G.bag.splice(idx, 1);
combat.itemUsed = true;
if      (id === 'hp_pot')  { G.stats.hp = Math.min(G.stats.hp + 20, G.stats.maxHp); addLog(`🧪 恢復 20 HP`, 'heal'); }
else if (id === 'hp_big')  { G.stats.hp = Math.min(G.stats.hp + 60, G.stats.maxHp); addLog(`🍶 恢復 60 HP`, 'heal'); }
else if (id === 'mp_pot')  { G.stats.mp = Math.min(G.stats.mp + 10, G.stats.maxMp); addLog(`💧 恢復 10 MP`, 'heal'); }
else if (id === 'atk_buf') { combat.atkBuf += 5; addLog(`⚔️ 本關攻擊+5`, 'skill'); }
else if (id === 'def_buf') { combat.defBuf += 5; addLog(`🛡️ 本關防禦+5`, 'skill'); }
else if (id === 'antidote'){ combat.playerPoison = false; addLog(`💚 中毒解除！`, 'heal'); renderStatusTags(); }
else if (id === 'escape')  {
if (combat.floor === combat.maxFloor) {
toast('Boss關無法逃脫');
G.bag.splice(idx, 0, id);
combat.itemUsed = false;
return;
}
addLog(`🪢 跳過本關！`, 'info');
combat.floor++;
setTimeout(() => nextFloor(), 600);
return;
}
updatePlayerBars();
}

function skipTurn() {
addLog('⏭️ 跳過回合', 'info');
enemyTurn();
}

// ══════════ 敵人行動 ══════════
function applyDmgToEnemy(dmg) {
combat.enemy.curHp -= dmg;
updateEnemyHp();
if (combat.enemy.curHp <= 0) enemyDied();
}

function enemyTurn() {
if (!combat.enemy || combat.enemy.curHp <= 0) return;

// 燃燒傷害
if (combat.enemyBurn > 0) {
const bd = Math.floor(combat.enemy.hp * 0.05);
combat.enemy.curHp -= bd;
combat.enemyBurn--;
addLog(`🔥 燃燒！${combat.enemy.name} 受到 ${bd} 傷害（剩餘 ${combat.enemyBurn} 回）`, 'skill');
updateEnemyHp(); renderStatusTags();
if (combat.enemy.curHp <= 0) { enemyDied(); return; }
}

// 暈眩跳過
if (combat.enemyStun) {
addLog(`💫 ${combat.enemy.name} 暈眩，跳過行動！`, 'skill');
combat.enemyStun = false;
renderStatusTags();
afterEnemyTurn(); return;
}

const e = combat.enemy, s = G.stats;
const playerDef = s.def + combat.defBuf;
const action = e.nextAction;

if (action === 'poison') {
combat.playerPoison = true;
addLog(`☠️ ${e.name} 施毒！你中毒了！`, 'poison');
renderStatusTags();
} else if (action === 'attack' || action === 'heavy') {
const mult = action === 'heavy' ? 1.6 : 1;
let dmg = Math.max(1, Math.floor(e.atk * mult) - playerDef);
if (combat.evade) {
addLog(`💨 ${e.name} 攻擊！你完美閃避！`, 'skill');
combat.evade = false;
} else {
if (combat.shield) dmg = Math.max(1, Math.floor(dmg * .4));
if (combat.counter) {
const rb = Math.floor(dmg * .3);
combat.enemy.curHp -= rb;
addLog(`🔄 反擊！反彈 ${rb} 點傷害給 ${e.name}！`, 'skill');
updateEnemyHp();
combat.counter = false;
if (combat.enemy.curHp <= 0) { enemyDied(); return; }
}
G.stats.hp = Math.max(0, G.stats.hp - dmg);
addLog(`${action === 'heavy' ? '💢' : '⚔️'} ${e.name}${action === 'heavy' ? ' 重擊' : ' 攻擊'}！你受到 ${dmg} 傷害`, 'dmg');
}
} else {
addLog(`${e.name} 防禦姿態`, 'info');
}

combat.shield = false;

// 中毒持續扣血
if (combat.playerPoison) {
const pd = Math.floor(G.stats.maxHp * 0.01);
G.stats.hp = Math.max(1, G.stats.hp - pd);
addLog(`☠️ 中毒！你受到 ${pd} 點持續傷害`, 'poison');
}

updatePlayerBars();
if (G.stats.hp <= 0) { gameOver(); return; }
afterEnemyTurn();
}

function afterEnemyTurn() {
const amap = { attack:'⚔️ 準備攻擊', heavy:'💢 準備重擊', defend:'🛡️ 準備防禦', poison:'☠️ 準備施毒' };
combat.enemy.nextAction = pickAction(combat.enemy);
document.getElementById('enemy-intent').textContent = amap[combat.enemy.nextAction] || '';
rollDice();
renderCombatDice();
renderStatusTags();
}

// ══════════ 關卡結束 ══════════
function enemyDied() {
const e = combat.enemy;
addLog(`🏆 擊敗 ${e.name}！獲得 ${e.gold} 金幣`, 'heal');
G.gold += e.gold; G.xp += e.xp;
G.quests.forEach(q => {
const def = QUESTS_DEF.find(d => d.id === q.id);
if (def && e.type === def.target && q.progress < def.need) q.progress++;
});
const drops = ['hp_pot', 'mp_pot', null, null, null];
const drop = drops[Math.floor(Math.random() * drops.length)];
if (drop && G.bag.length < G.bagMax) { G.bag.push(drop); addLog(`💎 掉落：${ITEMS_DEF[drop].name}`, 'heal'); }
// 裝備掉落：Boss 必掉，一般敵人 15% 機率
const equipRoll = Math.random();
const isBoss = e.boss === true;
if ((isBoss || equipRoll < 0.15) && G.bag.length < G.bagMax) {
  const eqItem = rollEquipDrop(combat.mapId);
  if (eqItem) {
    G.bag.push(eqItem);
    const rarityNames = ['', '✦ 魔法', '✦✦ 稀有', '✦✦✦ 史詩'];
    const tag = rarityNames[eqItem.rarity] || '';
    addLog(`🎁 ${tag ? tag + ' ' : ''}裝備掉落：${eqItem.fullName}`, 'heal');
  }
}
checkLevelUp();
combat.floor++;
setTimeout(() => {
if (combat.floor > combat.maxFloor) endAdventure();
else nextFloor();
}, 800);
}

function endAdventure() {
const map = MAPS.find(m => m.id === combat.mapId);
// 還原中毒骰面
if (combat.poisonBackup) {
const pb = combat.poisonBackup;
G.allDice[pb.dieIdx].faces[pb.faceIdx] = pb.orig;
combat.poisonBackup = null;
}
addLog(`🌟 通關 ${map.name}！返回城鎮`, 'info');
if (!G.clearedMaps.includes(combat.mapId)) {
G.clearedMaps.push(combat.mapId);
const normalMaps = MAPS.filter(m => !m.special);
const ni = normalMaps.findIndex(m => m.id === combat.mapId);
if (ni >= 0 && ni + 1 < normalMaps.length)
setTimeout(() => toast(`🗺️ 新地圖解鎖：${normalMaps[ni + 1].name}！`), 1400);
if (combat.mapId === 'village')
setTimeout(() => toast(`🌿 特殊地圖解鎖：毒沼澤！`), 2000);
}
setTimeout(() => { showScreen('screen-town'); toast('冒險完成！'); }, 1200);
}

function gameOver() {
addLog('💀 你已倒下…', 'dmg');
if (combat.poisonBackup) {
const pb = combat.poisonBackup;
G.allDice[pb.dieIdx].faces[pb.faceIdx] = pb.orig;
combat.poisonBackup = null;
}
G.stats.hp = Math.floor(G.stats.maxHp * 0.3);
setTimeout(() => { toast('你已倒下，以30%HP返回城鎮'); showScreen('screen-town'); }, 1000);
}

// ══════════ 隨機事件 ══════════
function showMerchantEvent() {
document.getElementById('battle-area').style.display = 'none';
document.getElementById('event-area').innerHTML = ` <div class="event-box"> <div class="event-title">🧙 神秘商人</div> <div class="event-desc">一個披著斗篷的商人出現在路旁…<br>「特別的貨品，只賣給有緣人。」</div> <div style="text-align:center;"> <button class="btn btn-sm" style="width:160px;" onclick="openMerchant()"><div class="btn-inner">查看商品</div></button> <button class="btn btn-sm" style="width:160px;margin-top:6px;" onclick="resumeBattle()"><div class="btn-inner">繼續前進</div></button> </div> </div>`;
}

function showChestEvent() {
document.getElementById('battle-area').style.display = 'none';
const isGold = Math.random() < 0.5;
let msg, fn;
if (isGold) {
const amt = 20 + Math.floor(Math.random() * 40);
msg = `寶箱中有 ${amt} 金幣！`;
fn = () => { G.gold += amt; toast(`獲得 ${amt} 金幣！`); resumeBattle(); };
} else {
const items = ['hp_pot', 'mp_pot', 'atk_buf', 'def_buf', 'antidote'];
const id = items[Math.floor(Math.random() * items.length)];
msg = `寶箱中有 ${ITEMS_DEF[id].name}！`;
fn = () => { addToBag(id); resumeBattle(); };
}
document.getElementById('event-area').innerHTML = ` <div class="event-box"> <div class="event-title">📦 神秘寶箱</div> <div class="event-desc">${msg}</div> <div style="text-align:center;"> <button class="btn btn-sm" style="width:160px;" onclick="(${fn.toString()})()"><div class="btn-inner">開啟寶箱</div></button> </div> </div>`;
}

function showTrapEvent() {
document.getElementById('battle-area').style.display = 'none';
const evadeRate = Math.min(0.9, 0.5 + G.stats.spd * 0.01);
const evaded = Math.random() < evadeRate;
const dmg = evaded ? 0 : Math.floor(G.stats.maxHp * 0.12);
if (!evaded) G.stats.hp = Math.max(1, G.stats.hp - dmg);
const msg = evaded
? `憑藉敏捷的身手，你成功閃過了陷阱！`
: `你觸發了陷阱！受到 ${dmg} 點傷害。（閃避率 ${Math.round(evadeRate * 100)}%）`;
document.getElementById('event-area').innerHTML = ` <div class="event-box"> <div class="event-title">⚠️ 陷　阱</div> <div class="event-desc">${msg}</div> <div style="text-align:center;"> <button class="btn btn-sm" style="width:160px;" onclick="resumeBattle()"><div class="btn-inner">繼續前進</div></button> </div> </div>`;
}

function resumeBattle() {
closeOverlay('merchant-overlay');
document.getElementById('event-area').innerHTML = '';
document.getElementById('battle-area').style.display = '';
combat.floor++;
if (combat.floor > combat.maxFloor) endAdventure();
else startBattle();
}
// ══════════ 路上 NPC 事件 ══════════
function showRoadNpcEvent() {
  // 依據等級篩選可出現的 NPC
  const available = NPCS.road.filter(npc => {
    const d = npc.dialogues.find(d => d.condition(G));
    return !!d;
  });
  if (!available.length) { startBattle(); return; }

  const npc = available[Math.floor(Math.random() * available.length)];

  document.getElementById('battle-area').style.display = 'none';
  document.getElementById('event-area').innerHTML = `
    <div class="event-box">
      <div class="event-title">${npc.icon} 路上的相遇</div>
      <div style="color:#8a7a5a;font-size:12px;margin:6px 0 14px;">${npc.name}</div>
      <button class="btn btn-wide btn-sm" onclick="openRoadNpc('${npc.id}')">
        <div class="btn-inner">上前搭話</div>
      </button>
      <button class="btn btn-wide btn-sm mt8" onclick="resumeBattle()">
        <div class="btn-inner">繼續前進</div>
      </button>
    </div>`;
}

function openRoadNpc(npcId) {
  openNpcDialogue(npcId, NPCS.road);
}
