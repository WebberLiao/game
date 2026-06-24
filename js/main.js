// ══════════ 畫面切換 ══════════
function showScreen(id) {
document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
document.getElementById(id).classList.add('active');
if (id === 'screen-tavern')    renderTavern();
if (id === 'screen-barracks')  renderBarracks();
if (id === 'screen-alchemy')   renderAlchemy();
if (id === 'screen-shop')      renderShop();
if (id === 'screen-town')      renderTown();
if (id === 'screen-mapselect') renderMapSelect();
}

// ══════════ 主選單 ══════════
function startNew() {
G = null;
showScreen('screen-jobselect');
}

function selectJob(jobId) {
G = newGame(jobId);
saveGame();
showScreen('screen-town');
}

function continueGame() {
G = loadGame();
if (G) showScreen('screen-town');
}

// ══════════ 初始化 ══════════
updateMainMenu();