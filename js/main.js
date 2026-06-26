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
  showScreen('screen-nameentry');
  document.getElementById('player-name-input').value = '';
  document.getElementById('player-name-input').focus();
}

function confirmName() {
  const input = document.getElementById('player-name-input');
  const name = input.value.trim() || 'Player';
  G = newGame(name);
  saveGame();
  showScreen('screen-town');
}

function continueGame() {
G = loadGame();
if (G) showScreen('screen-town');
}

// ══════════ 初始化 ══════════
updateMainMenu();