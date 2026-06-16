// ══════════ 遊戲狀態 ══════════
let G = null;

function newGame(jobId) {
const job = JOBS[jobId];
return {
gold: 200, xp: 0, level: 1, job: jobId,
stats: JSON.parse(JSON.stringify(job.stats)),
allDice: JSON.parse(JSON.stringify(job.dice)),
equippedDice: [0, 1, 2],
skills: [...job.startSkills],
quests: [], bag: [], bagMax: 2, clearedMaps: [],
};
}

function getEquippedDice() {
return G.equippedDice.map(i => G.allDice[i]);
}

// ══════════ 存讀檔 ══════════
function saveGame() {
localStorage.setItem(‘diceRPG_save’, JSON.stringify(G));
toast(‘存檔成功 ◆’);
}

function loadGame() {
const s = localStorage.getItem(‘diceRPG_save’);
return s ? JSON.parse(s) : null;
}

function hasSave() {
return !!localStorage.getItem(‘diceRPG_save’);
}

function deleteSave() {
localStorage.removeItem(‘diceRPG_save’);
G = null;
updateMainMenu();
showScreen(‘screen-main’);
toast(‘存檔已刪除’);
}

function exportSave() {
const s = localStorage.getItem(‘diceRPG_save’);
if (!s) { toast(‘沒有存檔可匯出’); return; }
const a = document.createElement(‘a’);
a.href = URL.createObjectURL(new Blob([s], { type: ‘application/json’ }));
a.download = ‘dicechronicle_save.json’;
a.click();
URL.revokeObjectURL(a.href);
toast(‘存檔已匯出’);
}

function importSave(e) {
const file = e.target.files[0]; if (!file) return;
const reader = new FileReader();
reader.onload = ev => {
try {
const data = JSON.parse(ev.target.result);
if (!data.job || !data.stats) { toast(‘存檔格式錯誤’); return; }
if (!data.allDice)      data.allDice = data.dice || [];
if (!data.equippedDice) data.equippedDice = [0, 1, 2];
if (!data.clearedMaps)  data.clearedMaps = [];
localStorage.setItem(‘diceRPG_save’, JSON.stringify(data));
G = data;
updateMainMenu();
toast(‘存檔匯入成功！’);
} catch { toast(‘存檔格式錯誤’); }
};
reader.readAsText(file);
e.target.value = ‘’;
}

// ══════════ 升級 ══════════
function checkLevelUp() {
const needed = G.level * 30;
if (G.xp >= needed) {
G.xp -= needed;
G.level++;
G.stats.maxHp += 10; G.stats.hp = G.stats.maxHp;
G.stats.maxMp += 5;  G.stats.mp = G.stats.maxMp;
G.stats.atk += 2;    G.stats.def += 1;
toast(`🎉 升級！Lv.${G.level}`);
}
}

// ══════════ 背包 ══════════
function addToBag(id) {
if (G.bag.length >= G.bagMax) { toast(‘背包已滿！’); return false; }
G.bag.push(id);
return true;
}