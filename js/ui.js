// ══════════ Toast ══════════
let toastTimer;
function toast(msg) {
const el = document.getElementById('toast');
el.textContent = msg;
el.classList.add('show');
clearTimeout(toastTimer);
toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ══════════ Overlay ══════════
function closeOverlay(id) {
document.getElementById(id).classList.remove('show');
}

// ══════════ 骰子元素 ══════════
function makeDieEl(f, small = false) {
const ft = FACE_TYPES[f] || FACE_TYPES.none;
const div = document.createElement('div');
div.className = `die ${ft.cls}`;
if (small) { div.style.width = '44px'; div.style.height = '44px'; }
const g = document.createElement('div');
g.className = 'pip-grid';
g.style.gridTemplateColumns = 'repeat(3,1fr)';
const sz = small ? '28px' : '36px';
g.style.width = sz; g.style.height = sz;
PIP_LAYOUTS[ft.pips].forEach(row => row.forEach(c => {
const p = document.createElement('div');
p.className = `pip ${c ? 'on ' + ft.cls : 'off'}`;
g.appendChild(p);
}));
div.appendChild(g);
const l = document.createElement('div');
l.className = 'die-label-text';
l.textContent = ft.label;
div.appendChild(l);
return div;
}

// ══════════ 主選單 ══════════
function updateMainMenu() {
const btn = document.getElementById('btn-continue');
hasSave() ? btn.removeAttribute('disabled') : btn.setAttribute('disabled', '');
}

// ══════════ 城鎮 ══════════
function renderTown() {
const job = JOBS[G.job];
document.getElementById('town-gold').textContent = G.gold;
document.getElementById('town-job-icon').textContent = job.icon;
document.getElementById('town-job-name').textContent = job.name;
}

// ══════════ 地圖選擇 ══════════
function renderMapSelect() {
document.getElementById('map-gold').textContent = G.gold;
const cleared = G.clearedMaps || [];
const el = document.getElementById('map-list');
el.innerHTML = '';
MAPS.forEach((map, i) => {
const isCleared = cleared.includes(map.id);
let isUnlocked;
if (map.special) {
isUnlocked = cleared.includes('village');
} else {
const normalMaps = MAPS.filter(m => !m.special);
const ni = normalMaps.findIndex(m => m.id === map.id);
isUnlocked = ni === 0 || cleared.includes(normalMaps[ni - 1].id);
}
const card = document.createElement('div');
card.className = `map-card${!isUnlocked ? ' locked' : ''}${isCleared ? ' cleared' : ''}${map.special ? ' special' : ''}`;
card.innerHTML = `<div class="map-icon">${map.icon}</div><div class="map-info"> <div class="map-name">${map.name}${map.special ? '<span class="status-tag status-poison" style="margin-left:6px;">特殊</span>' : ''}</div> <div class="map-desc">${map.desc}</div> <div class="map-floors">📍 ${map.floors} 關　Boss：${ALL_ENEMIES[map.boss].name}</div> <div class="map-status">${isCleared ? '<span class="green">✓ 已通關</span>' : isUnlocked ? '<span style="color:#c8a96e;">可挑戰</span>' : '<span class="dim">🔒 未解鎖</span>'}</div> </div>`;
if (isUnlocked) card.onclick = () => enterAdventure(map.id);
el.appendChild(card);
});
}

// ══════════ 酒館 ══════════
function renderTavern() {
document.getElementById('tavern-gold').textContent = G.gold;
const s = G.stats, job = JOBS[G.job];
document.getElementById('tavern-char-info').innerHTML = ` <div style="font-size:11px;color:#8a7a5a;letter-spacing:2px;margin-bottom:8px;">${job.icon} ${job.name}　Lv.${G.level}</div> <div class="bar-row"><div class="bar-label">HP ${s.hp}/${s.maxHp}</div><div class="bar-bg"><div class="bar-fill bar-hp" style="width:${s.hp / s.maxHp * 100}%"></div></div></div> <div class="bar-row"><div class="bar-label">MP ${s.mp}/${s.maxMp}</div><div class="bar-bg"><div class="bar-fill bar-mp" style="width:${s.mp / s.maxMp * 100}%"></div></div></div> <div class="stat-grid mt8"> <div class="stat-item"><span class="stat-label">物攻</span><span class="stat-val">${s.atk}</span></div> <div class="stat-item"><span class="stat-label">物防</span><span class="stat-val">${s.def}</span></div> <div class="stat-item"><span class="stat-label">魔攻</span><span class="stat-val">${s.matk}</span></div> <div class="stat-item"><span class="stat-label">魔防</span><span class="stat-val">${s.mdef}</span></div> <div class="stat-item"><span class="stat-label">速度</span><span class="stat-val">${s.spd}</span></div> <div class="stat-item"><span class="stat-label">XP</span><span class="stat-val">${G.xp}/${G.level * 30}</span></div> </div>`;
renderDiceSelect();
document.getElementById('bag-cap-label').textContent = `${G.bag.length}/${G.bagMax}`;
renderBagDisplay('tavern-bag', false);
renderQuestsPanel();
}

// ── 骰子選擇 ──
let tempEquipped = [];
function renderDiceSelect() {
tempEquipped = [...G.equippedDice];
document.getElementById('dice-owned-count').textContent = G.allDice.length;
const el = document.getElementById('tavern-dice-select');
el.innerHTML = '';
G.allDice.forEach((d, i) => {
const isSel = tempEquipped.includes(i);
const card = document.createElement('div');
card.className = `die-select-card${isSel ? ' selected' : ''}`;
card.id = `dsc-${i}`;
const check = document.createElement('div');
check.className = 'die-check';
check.textContent = isSel ? '✓' : '';
const info = document.createElement('div');
info.style.cssText = 'flex:1;';
info.innerHTML = `<div style="font-size:11px;color:#c8a96e;letter-spacing:2px;margin-bottom:4px;">骰子 ${i + 1}</div>`;
const faces = document.createElement('div');
faces.className = 'die-select-faces';
d.faces.forEach(f => { const el = makeDieEl(f, true); el.style.cursor = 'default'; faces.appendChild(el); });
info.appendChild(faces);
card.appendChild(check);
card.appendChild(info);
card.onclick = () => toggleDiceSelect(i);
el.appendChild(card);
});
}

function toggleDiceSelect(idx) {
if (tempEquipped.includes(idx)) {
if (tempEquipped.length <= 1) { toast('至少需要1顆骰子'); return; }
tempEquipped = tempEquipped.filter(i => i !== idx);
} else {
if (tempEquipped.length >= 3) { toast('最多攜帶3顆骰子'); return; }
tempEquipped.push(idx);
}
G.allDice.forEach((_, i) => {
const card = document.getElementById(`dsc-${i}`);
if (!card) return;
const isSel = tempEquipped.includes(i);
card.className = `die-select-card${isSel ? ' selected' : ''}`;
card.querySelector('.die-check').textContent = isSel ? '✓' : '';
});
}

function saveDiceSelection() {
if (!tempEquipped.length) { toast('請至少選擇1顆骰子'); return; }
G.equippedDice = [...tempEquipped];
toast(`已選擇 ${G.equippedDice.length} 顆骰子出戰`);
}

// ── 任務 ──
function renderQuestsPanel() {
const el = document.getElementById('tavern-quests');
let html = '';
G.quests.forEach(q => {
const def = QUESTS_DEF.find(d => d.id === q.id);
const can = q.progress >= def.need;
const rwd = `${def.reward.gold}金${def.reward.xp ? '＋' + def.reward.xp + 'XP' : ''}${def.reward.items.length ? '＋物品' : ''}`;
html += `<div class="quest-item"><div class="quest-name">📋 ${def.name}</div> <div class="quest-prog">進度 ${q.progress}/${def.need}　獎勵：${rwd}</div> ${can ? `<button class="btn btn-sm" style="width:80px;margin-top:6px;" onclick="claimQuest('${q.id}')"><div class="btn-inner">領　取</div></button>` : ''}</div>`;
});
const accepted = G.quests.map(q => q.id);
const avail = QUESTS_DEF.filter(d => !accepted.includes(d.id));
if (avail.length) {
html += `<div class="dim" style="font-size:11px;letter-spacing:2px;margin:10px 0 4px;">── 可承接 ──</div>`;
avail.forEach(def => {
const rwd = `${def.reward.gold}金${def.reward.xp ? '＋' + def.reward.xp + 'XP' : ''}${def.reward.items.length ? '＋物品' : ''}`;
html += `<div class="quest-item"><div class="quest-name">📜 ${def.name}</div> <div class="quest-prog">目標 ×${def.need}　獎勵：${rwd}</div> <button class="btn btn-sm" style="width:80px;margin-top:6px;" onclick="acceptQuest('${def.id}')"><div class="btn-inner">承　接</div></button></div>`;
});
}
if (!html) html = '<div class="dim" style="font-size:12px;">所有任務已完成</div>';
el.innerHTML = html;
}

function acceptQuest(qid) {
G.quests.push({ id: qid, progress: 0 });
toast('任務承接！');
renderQuestsPanel();
}

function claimQuest(qid) {
const idx = G.quests.findIndex(q => q.id === qid); if (idx < 0) return;
const def = QUESTS_DEF.find(d => d.id === qid);
G.gold += def.reward.gold; G.xp += def.reward.xp || 0;
def.reward.items.forEach(id => addToBag(id));
G.quests.splice(idx, 1);
checkLevelUp();
toast(`任務完成！獲得 ${def.reward.gold} 金`);
renderQuestsPanel();
}

// ── 背包顯示 ──
function renderBagDisplay(elId, withSell) {
const el = document.getElementById(elId);
el.innerHTML = '';
if (!G.bag.length) { el.innerHTML = '<div class="item-empty">背包空空如也</div>'; return; }
const grid = document.createElement('div');
grid.className = 'item-grid';
G.bag.forEach((id, i) => {
const def = ITEMS_DEF[id], card = document.createElement('div');
card.className = 'item-card';
card.innerHTML = `<span class="item-icon">${def.icon}</span><div class="item-name">${def.name}</div><div class="item-desc">${withSell ? '賣出 ' + def.sellPrice + ' 金' : def.desc}</div>`;
if (withSell) card.onclick = () => sellItem(i);
grid.appendChild(card);
});
el.appendChild(grid);
}

// ══════════ 商店 ══════════
function renderShop() {
document.getElementById('shop-gold').textContent = G.gold;
document.getElementById('shop-bag-cap').textContent = ` ${G.bag.length}/${G.bagMax}`;
const buyEl = document.getElementById('shop-buy');
const grid = document.createElement('div');
grid.className = 'item-grid';
Object.values(ITEMS_DEF).forEach(def => {
const card = document.createElement('div');
card.className = 'item-card';
card.innerHTML = `<span class="item-icon">${def.icon}</span><div class="item-name">${def.name}</div><div class="item-desc">${def.desc}</div><div class="item-desc" style="color:#f0d080;margin-top:4px;">💰 ${def.buyPrice}</div>`;
card.onclick = () => buyItem(def.id);
grid.appendChild(card);
});
buyEl.innerHTML = '';
buyEl.appendChild(grid);
renderBagDisplay('shop-bag', true);
}

function buyItem(id) {
const def = ITEMS_DEF[id];
if (G.gold < def.buyPrice) { toast('金幣不足'); return; }
if (!addToBag(id)) return;
G.gold -= def.buyPrice;
toast(`購入 ${def.name}`);
renderShop();
}

function sellItem(idx) {
const def = ITEMS_DEF[G.bag[idx]];
G.gold += def.sellPrice;
G.bag.splice(idx, 1);
toast(`賣出 ${def.name}，獲得 ${def.sellPrice} 金`);
renderShop();
}

// ══════════ 兵營 ══════════
const STAT_LABELS = { atk:'物攻', def:'物防', matk:'魔攻', mdef:'魔防', spd:'速度', hp:'最大HP', mp:'最大MP' };

function renderBarracks() {
document.getElementById('barracks-gold').textContent = G.gold;
const s = G.stats;
document.getElementById('barracks-stats').innerHTML = Object.keys(STAT_LABELS).map(k => ` <div class="upgrade-row"> <span style="font-size:13px;">${STAT_LABELS[k]} <span class="gold">${k === 'hp' ? s.maxHp : k === 'mp' ? s.maxMp : s[k]}</span></span> <span style="font-size:11px;color:#c8a96e;">50金</span> <button class="btn btn-sm" style="width:70px;" onclick="upgradeStat('${k}')"><div class="btn-inner">強化</div></button> </div>`).join('');
const avail = SKILLS_DEF.filter(sk => sk.jobs === null || sk.jobs.includes(G.job));
document.getElementById('barracks-skills').innerHTML = avail.map(sk => {
const learned = G.skills.includes(sk.id);
const badge = sk.jobs
? `<span class="job-badge">${sk.jobs.map(j => JOBS[j].name).join('/')}</span>`
: '<span class="job-badge">共用</span>';
return `<div class="quest-item"> <div class="quest-name">${sk.name}${badge}${learned ? ' <span class="green">✓</span>' : ''}</div> <div class="quest-prog">${sk.desc}${sk.mpCost ? '　消耗' + sk.mpCost + 'MP' : ''}</div> ${!learned ? `<button class="btn btn-sm" style="width:100px;margin-top:6px;" onclick="learnSkill('${sk.id}')"><div class="btn-inner">學習 80金</div></button>` : ''} </div>`;
}).join('');
}

function upgradeStat(key) {
if (G.gold < 50) { toast('金幣不足'); return; }
G.gold -= 50;
if (key === 'hp')      { G.stats.maxHp += 10; G.stats.hp = Math.min(G.stats.hp + 10, G.stats.maxHp); }
else if (key === 'mp') { G.stats.maxMp += 10; G.stats.mp = Math.min(G.stats.mp + 10, G.stats.maxMp); }
else G.stats[key] += 2;
toast(`${STAT_LABELS[key]} 強化`);
renderBarracks();
}

function learnSkill(id) {
if (G.gold < 80) { toast('金幣不足'); return; }
G.gold -= 80;
G.skills.push(id);
toast('技能習得！');
renderBarracks();
}

// ══════════ 煉金工坊 ══════════
const FACE_OPTIONS = ['atk', 'def', 'sp', 'matk'];

function renderAlchemy() {
document.getElementById('alchemy-gold').textContent = G.gold;
const canBuy = G.allDice.length < 5;
document.getElementById('alchemy-buy-dice').innerHTML = ` <div class="upgrade-row"> <div> <div style="font-size:13px;">空白骰子 <span class="dim" style="font-size:11px;">${G.allDice.length}/5 顆</span></div> <div style="font-size:11px;color:#8a7a5a;margin-top:3px;">6面全空白，可強化各面</div> </div> <span style="font-size:11px;color:#c8a96e;">500金</span> <button class="btn btn-sm" style="width:70px;" ${canBuy ? '' : 'disabled'} onclick="buyNewDie()"> <div class="btn-inner">${canBuy ? '購買' : '已滿'}</div> </button> </div>`;
let html = '';
G.allDice.forEach((d, di) => {
const isEquipped = G.equippedDice.includes(di);
html += `<div style="margin-bottom:14px;"> <div style="font-size:11px;letter-spacing:2px;margin-bottom:6px;"> <span class="dim">骰子 ${di + 1}</span> ${isEquipped ? '<span style="font-size:9px;color:#f0d080;margin-left:6px;border:1px solid rgba(200,160,80,.4);padding:1px 5px;border-radius:3px;">出戰中</span>' : ''} </div> <div class="dice-row" style="justify-content:flex-start;">`;
d.faces.forEach(f => { html += makeDieEl(f, true).outerHTML; });
html += `</div>`;
d.faces.forEach((f, fi) => {
if (f === 'none') html += `<div class="upgrade-row" style="flex-wrap:wrap;gap:6px;"> <span style="font-size:12px;">第${fi + 1}面解鎖</span> <select id="sel-${di}-${fi}" style="background:#1a1208;color:#e8d5a3;border:1px solid rgba(200,160,80,.3);padding:4px;font-size:12px;border-radius:3px;"> ${FACE_OPTIONS.map(t =>`<option value="${t}">${FACE_TYPES[t].label}</option>`).join('')} </select> <button class="btn btn-sm" style="width:70px;" onclick="upgradeFace(${di},${fi})"><div class="btn-inner">80金</div></button> </div>`;
});
html += `</div>`;
});
document.getElementById('alchemy-dice').innerHTML = html;
}

function buyNewDie() {
if (G.gold < 500) { toast('金幣不足'); return; }
if (G.allDice.length >= 5) { toast('骰子已達上限'); return; }
G.gold -= 500;
G.allDice.push({ faces: ['none', 'none', 'none', 'none', 'none', 'none'] });
toast(`購入空白骰子！共 ${G.allDice.length} 顆`);
renderAlchemy();
}

function upgradeFace(di, fi) {
if (G.gold < 80) { toast('金幣不足'); return; }
G.gold -= 80;
G.allDice[di].faces[fi] = document.getElementById(`sel-${di}-${fi}`).value;
toast('骰子強化成功！');
renderAlchemy();
}

// ══════════ 戰鬥UI ══════════
function renderCombat() {
updateEnemyHp();
updatePlayerBars();
renderCombatDice();
document.getElementById('enemy-name').textContent = combat.enemy.name;
renderStatusTags();
const amap = { attack:'⚔️ 準備攻擊', heavy:'💢 準備重擊', defend:'🛡️ 準備防禦', poison:'☠️ 準備施毒' };
document.getElementById('enemy-intent').textContent = amap[combat.enemy.nextAction] || '';
}

function renderCombatDice() {
const el = document.getElementById('combat-dice');
el.innerHTML = '';
combat.rolled.forEach((f, i) => {
const d = makeDieEl(f);
d.onclick = () => rerollDie(i);
el.appendChild(d);
});
}

function renderStatusTags() {
const etags = document.getElementById('enemy-status-tags');
etags.innerHTML =
(combat.enemyBurn > 0 ? `<span class="status-tag status-burn">🔥燃燒${combat.enemyBurn}</span>` : '') +
(combat.enemyStun ? '<span class="status-tag status-stun">💫暈眩</span>' : '');
const ptags = document.getElementById('player-status-tags');
ptags.innerHTML = combat.playerPoison ? '<span class="status-tag status-poison">☠️ 中毒</span>' : '';
}

function updateEnemyHp() {
const e = combat.enemy;
document.getElementById('enemy-hp-text').textContent = `${Math.max(0, e.curHp)}/${e.hp}`;
document.getElementById('enemy-hp-bar').style.width = `${Math.max(0, e.curHp / e.hp * 100)}%`;
}

function updatePlayerBars() {
const s = G.stats;
document.getElementById('player-hp-text').textContent = `${s.hp}/${s.maxHp}`;
document.getElementById('player-hp-bar').style.width = `${s.hp / s.maxHp * 100}%`;
document.getElementById('player-mp-text').textContent = `${s.mp}/${s.maxMp}`;
document.getElementById('player-mp-bar').style.width = `${s.mp / s.maxMp * 100}%`;
}

function addLog(msg, type = 'info') {
if (!combat) return;
combat.log.push({ msg, type });
const el = document.getElementById('combat-log');
const line = document.createElement('div');
line.className = `log-line log-${type}`;
line.textContent = msg;
el.appendChild(line);
el.scrollTop = el.scrollHeight;
}

// ── 技能選單 ──
function openSkillOrAttack() {
const avail = getTriggerable();
if (!avail.length) { doNormalAttack(); return; }
const el = document.getElementById('skill-options');
el.innerHTML = '';
avail.forEach(sk => {
const div = document.createElement('div');
div.className = 'skill-option';
div.innerHTML = `<div class="skill-option-name">${sk.name}</div> <div class="skill-option-desc">${sk.desc}</div> ${sk.mpCost ? `<div class="skill-option-mp">消耗 ${sk.mpCost} MP</div>` : ''}`;
div.onclick = () => { closeOverlay('skill-overlay'); doSkill(sk.id); };
el.appendChild(div);
});
document.getElementById('skill-overlay').classList.add('show');
}

// ── 物品選單 ──
function openItemMenu() {
if (!G.bag.length) { toast('背包是空的'); return; }
if (combat.itemUsed) { toast('本關已使用過物品'); return; }
const el = document.getElementById('item-options');
el.innerHTML = '';
G.bag.forEach((id, i) => {
const def = ITEMS_DEF[id];
const div = document.createElement('div');
div.className = 'skill-option';
div.innerHTML = `<div class="skill-option-name">${def.icon} ${def.name}</div><div class="skill-option-desc">${def.desc}</div>`;
div.onclick = () => { closeOverlay('item-overlay'); useItem(i); };
el.appendChild(div);
});
document.getElementById('item-overlay').classList.add('show');
}

// ── 神秘商人 ──
function openMerchant() {
const el = document.getElementById('merchant-items');
el.innerHTML = '';
const pool = MERCHANT_ITEMS.slice().sort(() => Math.random() - .5).slice(0, 3);
pool.forEach(id => {
const def = ITEMS_DEF[id];
const price = Math.ceil(def.buyPrice * 1.5);
const div = document.createElement('div');
div.className = 'skill-option';
div.innerHTML = `<div class="skill-option-name">${def.icon} ${def.name}</div> <div class="skill-option-desc">${def.desc}</div> <div class="skill-option-mp">💰 ${price} 金</div>`;
div.onclick = () => {
if (G.gold < price) { toast('金幣不足'); return; }
if (!addToBag(id)) return;
G.gold -= price;
toast(`購入 ${def.name}`);
div.style.opacity = '.4';
div.onclick = null;
};
el.appendChild(div);
});
document.getElementById('merchant-overlay').classList.add('show');
}