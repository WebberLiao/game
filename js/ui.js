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
  document.getElementById('town-gold').textContent = G.gold;
  const iconEl = document.getElementById('town-job-icon');
  if (iconEl) iconEl.textContent = G.name ? G.name[0].toUpperCase() : '?';
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
const s = G.stats;
document.getElementById('tavern-char-info').innerHTML = ` <div style="font-size:11px;color:#8a7a5a;letter-spacing:2px;margin-bottom:8px;">⚔ ${G.name || 'Player'}　Lv.${G.level}</div> <div class="bar-row"><div class="bar-label">HP ${s.hp}/${s.maxHp}</div><div class="bar-bg"><div class="bar-fill bar-hp" style="width:${s.hp / s.maxHp * 100}%"></div></div></div> <div class="bar-row"><div class="bar-label">MP ${s.mp}/${s.maxMp}</div><div class="bar-bg"><div class="bar-fill bar-mp" style="width:${s.mp / s.maxMp * 100}%"></div></div></div> <div class="stat-grid mt8"> <div class="stat-item"><span class="stat-label">物攻</span><span class="stat-val">${s.atk}</span></div> <div class="stat-item"><span class="stat-label">物防</span><span class="stat-val">${s.def}</span></div> <div class="stat-item"><span class="stat-label">魔攻</span><span class="stat-val">${s.matk}</span></div> <div class="stat-item"><span class="stat-label">魔防</span><span class="stat-val">${s.mdef}</span></div> <div class="stat-item"><span class="stat-label">速度</span><span class="stat-val">${s.spd}</span></div> <div class="stat-item"><span class="stat-label">XP</span><span class="stat-val">${G.xp}/${G.level * 30}</span></div> </div>`;
renderDiceSelect();
document.getElementById('bag-cap-label').textContent = `${G.bag.length}/${G.bagMax}`;
renderBagDisplay('tavern-bag', false);
renderQuestsPanel();
  renderTavernNpcs();
  renderEquipSlots('equip-slots-shop');
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
html += `<div class="quest-item" style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><div style="flex:1;"><div class="quest-name">📜 ${def.name}</div><div class="quest-prog">目標 ×${def.need}　獎勵：${rwd}</div></div><button class="btn btn-sm" style="width:64px;flex-shrink:0;" onclick="acceptQuest('${def.id}')"><div class="btn-inner">承　接</div></button></div>`;
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
renderShopItems();
renderShopEquips();
renderBagDisplay('shop-bag', true);
renderEquipSlots('equip-slots-shop');
}

function renderShopItems() {
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
}

function renderShopEquips() {
const el = document.getElementById('shop-equip-buy');
if (!el) return;
el.innerHTML = '';
// 全部基底裝備按 slot 分組顯示
const slotOrder = ['weapon','armor','accessory'];
const slotLabel = { weapon:'武器', armor:'防具', accessory:'飾品' };
slotOrder.forEach(slot => {
const items = Object.values(EQUIP_BASE).filter(b => b.slot === slot);
const section = document.createElement('div');
section.style.marginBottom = '8px';
section.innerHTML = `<div style="font-size:11px;color:#8a7a5a;letter-spacing:2px;margin-bottom:6px;">── ${slotLabel[slot]} ──</div>`;
items.forEach(base => {
const card = document.createElement('div');
card.className = 'equip-card';
const statsStr = Object.entries(base.stats).map(([k,v]) => `${k.toUpperCase()}${v>0?'+':''}${v}`).join(' ');
card.innerHTML = `<span style="font-size:18px;">${base.icon}</span>
<div style="flex:1;min-width:0;">
  <div class="equip-name">${base.name}</div>
  <div class="equip-stat">${statsStr}</div>
</div>
<div style="text-align:right;white-space:nowrap;">
  <div style="color:#f0d080;font-size:12px;">💰${base.buyPrice}</div>
  <button class="btn btn-sm" style="width:60px;margin-top:4px;" onclick="buyEquip('${base.id}')"><div class="btn-inner">購買</div></button>
</div>`;
section.appendChild(card);
});
el.appendChild(section);
});
}

function renderEquipSlots(containerId) {
const el = document.getElementById(containerId);
if (!el || !G) return;
if (!G.equips) G.equips = { weapon:null, armor:null, accessory:null };
const slotIcon = { weapon:'⚔️', armor:'🛡️', accessory:'📿' };
const slotLabel = { weapon:'武器欄', armor:'防具欄', accessory:'飾品欄' };
const bonus = calcEquipStats();
// 套裝檢測
const activeSets = Object.entries(SET_BONUSES).filter(([,set]) =>
set.pieces.every(p => Object.values(G.equips).some(eq => eq && eq.id === p))
).map(([,set]) => set);

el.innerHTML = '';
// 裝備欄位
Object.keys(slotLabel).forEach(slot => {
const eq = G.equips[slot];
const row = document.createElement('div');
row.className = 'equip-slot-row';
if (eq) {
const statsStr = (() => {
const s = { ...eq.stats };
(eq.affixes||[]).forEach(a => { s[a.stat] = (s[a.stat]||0) + a.val; });
return Object.entries(s).map(([k,v]) => `${k.toUpperCase()}${v>0?'+':''}${v}`).join(' ');
})();
const rarityColor = ['#8a7a5a','#60c060','#4090e0','#c060e0'][eq.rarity] || '#8a7a5a';
row.innerHTML = `<span style="font-size:16px;">${eq.icon}</span>
<div style="flex:1;min-width:0;">
  <div style="font-size:12px;color:${rarityColor};">${eq.fullName}</div>
  <div class="equip-stat">${statsStr}</div>
</div>
<button class="btn btn-sm" style="width:52px;" onclick="unequipItem('${slot}');renderShop();renderTavern();"><div class="btn-inner">卸下</div></button>`;
} else {
row.innerHTML = `<span style="font-size:16px;opacity:.3;">${slotIcon[slot]}</span>
<div style="flex:1;color:#555;font-size:12px;letter-spacing:2px;">${slotLabel[slot]}（空）</div>`;
}
el.appendChild(row);
});

// 裝備總加成
if (Object.keys(bonus).length > 0) {
const bonusDiv = document.createElement('div');
bonusDiv.style.cssText = 'margin-top:10px;padding-top:8px;border-top:1px solid rgba(200,160,80,.15);font-size:11px;color:#8a7a5a;';
bonusDiv.textContent = '裝備加成：' + Object.entries(bonus).filter(([,v])=>v!==0).map(([k,v])=>`${k.toUpperCase()}${v>0?'+':''}${v}`).join(' / ');
el.appendChild(bonusDiv);
}

// 套裝加成顯示
activeSets.forEach(set => {
const setDiv = document.createElement('div');
setDiv.style.cssText = 'margin-top:6px;font-size:11px;color:#f0d080;';
setDiv.textContent = '✦ ' + set.name + '：' + set.desc;
el.appendChild(setDiv);
});
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
const entry = G.bag[idx];
if (typeof entry === 'string') {
const def = ITEMS_DEF[entry];
if (!def) return;
G.gold += def.sellPrice;
G.bag.splice(idx, 1);
toast(`賣出 ${def.name}，獲得 ${def.sellPrice} 金`);
} else {
sellEquip(idx);
return;
}
renderShop();
}

function sellEquip(idx) {
const eq = G.bag[idx];
if (!eq || !eq.slot) return;
const price = Math.floor((eq.buyPrice || 50) * 0.4);
G.gold += price;
G.bag.splice(idx, 1);
toast(`賣出 ${eq.fullName}，獲得 ${price} 金`);
renderShop();
}

// ══════════ 兵營 ══════════
const STAT_LABELS = { atk:'物攻', def:'物防', matk:'魔攻', mdef:'魔防', spd:'速度', hp:'最大HP', mp:'最大MP' };

function renderBarracks() {
  document.getElementById('barracks-gold').textContent = G.gold;
  // 顯示點數
  const ptEl = document.getElementById('barracks-points');
  if (ptEl) ptEl.textContent = (G.statPoints > 0 ? '屬性點：' + G.statPoints + '　' : '') +
                                (G.skillPoints > 0 ? '技能點：' + G.skillPoints : '');

  // 技能欄（已裝備）
  const slotEl = document.getElementById('barracks-skill-slots');
  if (slotEl) {
    // 已習得但未裝備的技能也列出，讓玩家可在此裝備
    const equippedHtml = G.skills.map((sid, i) => {
      const sk = SKILLS_DEF.find(s => s.id === sid);
      if (!sk) return '';
      return `<div class="skill-option" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div class="skill-option-name" style="color:#f0d080;">${sk.name} <span style="font-size:10px;color:#f0d080;">◆裝備中</span></div>
          <div class="skill-option-desc">${sk.desc}</div>
        </div>
        <button class="btn btn-sm" style="width:50px;" onclick="equipSkill('${sid}');renderBarracks();"><div class="btn-inner">卸除</div></button>
      </div>`;
    }).join('');
    const unlearnedEquipHtml = (G.learnedSkills || []).filter(sid => !G.skills.includes(sid)).map(sid => {
      const sk = SKILLS_DEF.find(s => s.id === sid);
      if (!sk) return '';
      return `<div class="skill-option" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div class="skill-option-name">${sk.name}</div>
          <div class="skill-option-desc">${sk.desc}</div>
        </div>
        <button class="btn btn-sm" style="width:50px;" onclick="equipSkill('${sid}');renderBarracks();"><div class="btn-inner">裝備</div></button>
      </div>`;
    }).join('');
    if (!equippedHtml && !unlearnedEquipHtml) {
      slotEl.innerHTML = '<div style="color:#555;font-size:12px;">尚未學習任何技能，前往「技能樹」tab</div>';
    } else {
      slotEl.innerHTML = equippedHtml + (unlearnedEquipHtml ? '<div style="font-size:10px;color:#555;letter-spacing:2px;margin:10px 0 6px;">── 已習得未裝備 ──</div>' + unlearnedEquipHtml : '');
    }
  }

  renderSkillTree();

  // 屬性點分配
  if (G.statPoints > 0) showStatPointPanel();
  else {
    const sp = document.getElementById('barracks-statpoints');
    if (sp) sp.style.display = 'none';
  }
}

function renderSkillTree() {
  const el = document.getElementById('barracks-skills');
  if (!el) return;
  el.innerHTML = '';
  Object.entries(SKILL_TREE).forEach(([branchId, branch]) => {
    const section = document.createElement('div');
    section.style.marginBottom = '14px';
    section.innerHTML = `<div style="font-size:12px;letter-spacing:3px;color:${branch.color};margin-bottom:8px;border-bottom:1px solid ${branch.color}33;padding-bottom:4px;">${branch.label}</div>`;

    // 按 tier 分層顯示
    [1,2,3].forEach(tier => {
      const nodes = branch.nodes.filter(n => n.tier === tier);
      nodes.forEach(node => {
        const learned   = G.learnedSkills.includes(node.id);
        const equipped  = G.skills.includes(node.id);
        const prereqMet = !node.prereq || G.learnedSkills.includes(node.prereq);
        const canLearn  = !learned && prereqMet && G.skillPoints > 0;

        const card = document.createElement('div');
        card.className = 'skill-option';
        card.style.opacity = (!learned && !prereqMet) ? '0.35' : '1';
        card.style.marginLeft = (tier - 1) * 14 + 'px';
        card.style.borderColor = learned ? branch.color + '88' : '';

        const reqStr = Object.entries(node.req).map(([k,v]) => k.toUpperCase()+'×'+v).join('+');
        const tierLabel = ['','Ⅰ','Ⅱ','Ⅲ'][tier];

        card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="flex:1;">
            <div class="skill-option-name" style="color:${learned ? branch.color : '#c080e0'};">
              ${tierLabel} ${node.name}
              ${equipped ? ' <span style="color:#f0d080;font-size:10px;">◆裝備中</span>' : ''}
              ${!learned && !prereqMet ? ' <span style="color:#555;font-size:10px;">🔒</span>' : ''}
            </div>
            <div class="skill-option-desc">${node.desc}</div>
            <div class="skill-option-mp">需要：${reqStr}　MP：${node.mpCost}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
            ${canLearn ? `<button class="btn btn-sm" style="width:60px;" onclick="learnSkill('${node.id}')"><div class="btn-inner">學習</div></button>` : ''}
            ${learned && !canLearn ? `<div style="font-size:10px;color:${branch.color};margin-top:4px;letter-spacing:1px;">${equipped ? '◆ 裝備中' : '已習得'}</div>` : ''}
          </div>
        </div>`;
        section.appendChild(card);
      });
    });
    el.appendChild(section);
  });
}

function showStatPointPanel() {
  const sp = document.getElementById('barracks-statpoints');
  if (!sp) return;
  sp.style.display = '';
  const statLabels = { atk:'物攻 +2', def:'物防 +2', matk:'魔攻 +2', mdef:'魔防 +2', maxHp:'最大HP +15', maxMp:'最大MP +10', spd:'速度 +2' };
  sp.innerHTML = `<div style="font-size:12px;color:#f0d080;margin-bottom:8px;">剩餘屬性點：${G.statPoints}</div>` +
    Object.entries(statLabels).map(([k, label]) =>
      `<div class="upgrade-row">
        <span style="font-size:13px;">${label} <span class="gold">(目前 ${k==='maxHp'?G.stats.maxHp:k==='maxMp'?G.stats.maxMp:G.stats[k]})</span></span>
        <button class="btn btn-sm" style="width:60px;" onclick="spendStatPoint('${k}');"><div class="btn-inner">分配</div></button>
      </div>`
    ).join('');
}

function showLevelUpOverlay() {
  const ov = document.getElementById('levelup-overlay');
  if (!ov) return;
  document.getElementById('levelup-lv').textContent = G.level;
  renderLevelUpOverlay();
  ov.classList.add('show');
}

function renderLevelUpOverlay() {
  const statLabels = { atk:'物攻 +2', def:'物防 +2', matk:'魔攻 +2', mdef:'魔防 +2', maxHp:'最大HP +15', maxMp:'最大MP +10', spd:'速度 +2' };
  const spEl = document.getElementById('levelup-statpoints');
  if (spEl) spEl.innerHTML = `<div style="color:#f0d080;margin-bottom:8px;">屬性點 ×${G.statPoints}</div>` +
    (G.statPoints > 0
      ? Object.entries(statLabels).map(([k,lbl]) =>
          `<button class="btn btn-sm" style="width:140px;margin:3px;" onclick="spendStatPoint('${k}');"><div class="btn-inner">${lbl}</div></button>`
        ).join('')
      : '<div style="color:#555;font-size:12px;">已分配完畢</div>');
  const skEl = document.getElementById('levelup-skillpoints');
  if (skEl) skEl.innerHTML = `<div style="color:#c080e0;margin:10px 0 8px;">技能點 ×${G.skillPoints}</div>` +
    (G.skillPoints > 0
      ? '<div style="color:#8a7a5a;font-size:11px;">前往「兵營→技能樹」學習新技能</div>'
      : '<div style="color:#555;font-size:12px;">已使用完畢</div>');
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
// ══════════ NPC 對話系統 ══════════
let currentNpcDialogue = null;

function getCurrentDialogue(npc) {
  for (const d of npc.dialogues) {
    if (d.condition(G)) return d;
  }
  return npc.dialogues[npc.dialogues.length - 1];
}

function openNpcDialogue(npcId, npcList) {
  const npc = npcList.find(n => n.id === npcId);
  if (!npc) return;
  const dialogue = getCurrentDialogue(npc);
  currentNpcDialogue = { npc, dialogue };

  const box = document.getElementById('npc-overlay');
  document.getElementById('npc-name').textContent = npc.icon + ' ' + npc.name;
  document.getElementById('npc-greeting').textContent = dialogue.greeting;

  const opts = document.getElementById('npc-options');
  opts.innerHTML = '';
  dialogue.options.forEach((opt, i) => {
    const btn = document.createElement('div');
    btn.className = 'skill-option';
    btn.innerHTML = `<div class="skill-option-name" style="color:#c8a96e;">${opt.text}</div>`;
    btn.onclick = () => showNpcReply(i);
    opts.appendChild(btn);
  });

  document.getElementById('npc-reply-area').style.display = 'none';
  document.getElementById('npc-options').style.display = '';
  box.classList.add('show');
}

function showNpcReply(optIdx) {
  const opt = currentNpcDialogue.dialogue.options[optIdx];
  document.getElementById('npc-options').style.display = 'none';
  document.getElementById('npc-close-btn').style.display = 'none';
  const replyArea = document.getElementById('npc-reply-area');
  document.getElementById('npc-player-line').textContent = opt.text;
  document.getElementById('npc-reply-text').textContent = opt.reply;
  replyArea.style.display = '';
}

function closeNpcDialogue() {
  document.getElementById('npc-overlay').classList.remove('show');
  currentNpcDialogue = null;
}

function renderTavernNpcs() {
  const el = document.getElementById('tavern-npcs');
  if (!el) return;
  el.innerHTML = '';
  NPCS.tavern.forEach(npc => {
    const card = document.createElement('div');
    card.className = 'skill-option';
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.gap = '10px';
    card.innerHTML = `
      <span style="font-size:24px;">${npc.icon}</span>
      <div>
        <div class="skill-option-name">${npc.name}</div>
        <div class="skill-option-desc">${npc.desc}</div>
      </div>`;
    card.onclick = () => openNpcDialogue(npc.id, NPCS.tavern);
    el.appendChild(card);
  });
}

// ══════════ 商店頁籤切換 ══════════
function switchShopTab(tab) {
  ['item','equip','bag'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
    document.getElementById('shop-pane-' + t).style.display = t === tab ? '' : 'none';
  });
}
