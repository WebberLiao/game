// ══════════ 骰子面類型 ══════════
const FACE_TYPES = {
atk:   { label:'ATK', cls:'atk',    pips:6 },
def:   { label:'DEF', cls:'def',    pips:4 },
sp:    { label:'SP',  cls:'sp',     pips:5 },
matk:  { label:'MAG', cls:'matk',   pips:3 },
none:  { label:'—', cls:'none',   pips:1 },
poison:{ label:'毒',  cls:'poison', pips:2 },
};

const PIP_LAYOUTS = {
1:[[0,0,0],[0,1,0],[0,0,0]],
2:[[1,0,0],[0,0,0],[0,0,1]],
3:[[1,0,0],[0,1,0],[0,0,1]],
4:[[1,0,1],[0,0,0],[1,0,1]],
5:[[1,0,1],[0,1,0],[1,0,1]],
6:[[1,0,1],[1,0,1],[1,0,1]],
};

// ══════════ 職業 ══════════
const JOBS = {
warrior: {
name:'劍士', icon:'⚔️',
stats:{ hp:100,maxHp:100,mp:30,maxMp:30,atk:14,def:8,matk:4,mdef:4,spd:7 },
dice:[
{ faces:['atk','atk','def','def','sp','none'] },
{ faces:['atk','atk','def','def','sp','none'] },
{ faces:['atk','atk','def','def','sp','none'] },
],
startSkills:['slash'],
},
mage: {
name:'法師', icon:'🔮',
stats:{ hp:70,maxHp:70,mp:80,maxMp:80,atk:6,def:3,matk:16,mdef:8,spd:8 },
dice:[
{ faces:['atk','atk','matk','matk','sp','none'] },
{ faces:['atk','atk','matk','matk','sp','none'] },
{ faces:['atk','atk','matk','matk','sp','none'] },
],
startSkills:['fireball'],
},
archer: {
name:'弓手', icon:'🏹',
stats:{ hp:80,maxHp:80,mp:50,maxMp:50,atk:12,def:5,matk:8,mdef:6,spd:12 },
dice:[
{ faces:['atk','atk','matk','def','sp','none'] },
{ faces:['atk','atk','matk','def','sp','none'] },
{ faces:['atk','atk','matk','def','sp','none'] },
],
startSkills:['evade'],
},
priest: {
name:'僧侶', icon:'✨',
stats:{ hp:85,maxHp:85,mp:70,maxMp:70,atk:7,def:5,matk:13,mdef:10,spd:7 },
dice:[
{ faces:['atk','matk','matk','sp','sp','none'] },
{ faces:['atk','matk','matk','sp','sp','none'] },
{ faces:['atk','matk','matk','sp','sp','none'] },
],
startSkills:['heal'],
},
};

// ══════════ 技能 ══════════
const SKILLS_DEF = [
{ id:'slash',     name:'斬擊',    jobs:['warrior'],        req:{atk:2},       mpCost:0,  desc:'物攻×2 → 強力一擊',              dmgMult:1.8, dmgStat:'atk',  effect:null },
{ id:'dslash',    name:'雙重斬',  jobs:['warrior'],        req:{atk:3},       mpCost:10, desc:'物攻×3 → 穩定高傷',              dmgMult:2.2, dmgStat:'atk',  effect:null },
{ id:'counter',   name:'反擊姿態',jobs:['warrior','archer'],req:{def:1,atk:1}, mpCost:0,  desc:'防禦×1+物攻×1 → 反彈30%傷害',   dmgMult:0,   dmgStat:null,   effect:'counter' },
{ id:'guard',     name:'鐵壁',    jobs:null,               req:{def:2},       mpCost:0,  desc:'防禦×2 → 本回合傷害-60%',        dmgMult:0,   dmgStat:null,   effect:'shield' },
{ id:'mp_fill',   name:'MP充填',  jobs:null,               req:{sp:3},        mpCost:0,  desc:'特殊×3 → 回復 30 MP',            dmgMult:0,   dmgStat:null,   effect:'mpfill' },
{ id:'arcane',    name:'秘術爆發', jobs:['mage','priest'],  req:{atk:1,sp:2},  mpCost:20, desc:'攻×1+特殊×2 → 魔法大傷',         dmgMult:2.5, dmgStat:'matk', effect:null },
{ id:'fireball',  name:'火球術',   jobs:['mage'],           req:{matk:2},      mpCost:15, desc:'魔攻×2 → 魔法強攻',              dmgMult:1.8, dmgStat:'matk', effect:null },
{ id:'stun',      name:'暈眩術',   jobs:['mage'],           req:{matk:1,sp:1}, mpCost:15, desc:'魔攻×1+特殊×1 → 敵人下回合跳過', dmgMult:0,   dmgStat:null,   effect:'stun' },
{ id:'burnball',  name:'燃燒彈',   jobs:['mage'],           req:{matk:1,sp:2}, mpCost:20, desc:'魔攻×1+特殊×2 → 攻擊+燃燒2回合', dmgMult:1.0, dmgStat:'matk', effect:'burn' },
{ id:'magarrow',  name:'魔法箭',   jobs:['archer'],         req:{matk:2},      mpCost:12, desc:'魔攻×2 → 穿透魔攻',              dmgMult:1.8, dmgStat:'matk', effect:null },
{ id:'evade',     name:'必閃',     jobs:['archer'],         req:{sp:1,def:1},  mpCost:10, desc:'特殊×1+防禦×1 → 閃避下次攻擊',  dmgMult:0,   dmgStat:null,   effect:'evade' },
{ id:'heal',      name:'治療',     jobs:['priest'],         req:{sp:2},        mpCost:20, desc:'特殊×2 → 回復 20HP + 魔攻加成',  dmgMult:0,   dmgStat:null,   effect:'heal' },
{ id:'holylight', name:'聖光術',   jobs:['priest'],         req:{matk:2,sp:1}, mpCost:25, desc:'魔攻×2+特殊×1 → 大回復+解除中毒',dmgMult:0,   dmgStat:null,   effect:'holylight' },
{ id:'regen',     name:'恢復術',   jobs:null,               req:{sp:1,def:1},  mpCost:15, desc:'特殊×1+防禦×1 → 回復部分HP',    dmgMult:0,   dmgStat:null,   effect:'regen' },
];

// ══════════ 敵人 ══════════
const ALL_ENEMIES = {
thief:       { name:'小偷',      hp:20,  atk:5,  def:2, mdef:1,  xp:8,  gold:6,  type:'thief',     actions:['attack','attack','defend'], boss:false },
bandit:      { name:'盜賊',      hp:28,  atk:7,  def:3, mdef:2,  xp:12, gold:10, type:'bandit',    actions:['attack','attack','heavy'],  boss:false },
banditBoss:  { name:'盜賊團長',  hp:60,  atk:10, def:5, mdef:4,  xp:40, gold:45, type:'banditboss',actions:['attack','heavy','defend'],  boss:true  },
rabbit:      { name:'野兔',      hp:18,  atk:4,  def:1, mdef:1,  xp:6,  gold:4,  type:'rabbit',    actions:['attack','attack','attack'], boss:false },
bigrat:      { name:'巨鼠',      hp:30,  atk:7,  def:2, mdef:2,  xp:10, gold:7,  type:'bigrat',    actions:['attack','attack','heavy'],  boss:false },
wolf:        { name:'草原狼',    hp:42,  atk:9,  def:3, mdef:3,  xp:15, gold:12, type:'wolf',      actions:['attack','heavy','attack'],  boss:false },
plainsBoss:  { name:'草原巨獸',  hp:90,  atk:13, def:6, mdef:5,  xp:55, gold:50, type:'plainsboss',actions:['heavy','attack','defend'],  boss:true  },
goblin:      { name:'哥布林',    hp:35,  atk:8,  def:3, mdef:2,  xp:12, gold:9,  type:'goblin',    actions:['attack','attack','defend'], boss:false },
goblinArcher:{ name:'哥布林弓手',hp:30,  atk:10, def:2, mdef:3,  xp:14, gold:10, type:'goblin',    actions:['attack','attack','heavy'],  boss:false },
goblinMage:  { name:'哥布林法師',hp:28,  atk:5,  def:2, mdef:6,  xp:15, gold:11, type:'goblin',    actions:['attack','heavy','defend'],  boss:false },
goblinKing:  { name:'哥布林王',  hp:110, atk:14, def:7, mdef:7,  xp:65, gold:55, type:'goblinboss',actions:['attack','heavy','defend'],  boss:true  },
skeleton:    { name:'骷髏兵',    hp:50,  atk:10, def:5, mdef:4,  xp:18, gold:14, type:'skeleton',  actions:['attack','attack','heavy'],  boss:false },
bat:         { name:'巨大蝙蝠',  hp:35,  atk:9,  def:2, mdef:4,  xp:14, gold:10, type:'bat',       actions:['attack','attack','attack'], boss:false },
skeletonMage:{ name:'骷髏法師',  hp:130, atk:12, def:8, mdef:12, xp:70, gold:60, type:'skelboss',  actions:['attack','heavy','defend'],  boss:true  },
viper:       { name:'毒蛇',      hp:25,  atk:7,  def:2, mdef:2,  xp:10, gold:8,  type:'viper',     actions:['attack','attack','poison'], boss:false },
spider:      { name:'毒蜘蛛',    hp:32,  atk:8,  def:3, mdef:3,  xp:12, gold:9,  type:'spider',    actions:['attack','poison','attack'],  boss:false },
frog:        { name:'毒蛙',      hp:20,  atk:6,  def:1, mdef:4,  xp:9,  gold:7,  type:'frog',      actions:['poison','attack','attack'],  boss:false },
vipQueen:    { name:'毒蛇女王',  hp:80,  atk:11, def:5, mdef:6,  xp:55, gold:50, type:'vipboss',   actions:['attack','heavy','poison'],   boss:true  },
};

// ══════════ 地圖 ══════════
const MAPS = [
{ id:'village', name:'村　莊',   icon:'🏘️', desc:'盜賊橫行的小村莊',     floors:5,  pool:['thief','thief','bandit','bandit'],           boss:'banditBoss',   special:false },
{ id:'plains',  name:'草　原',   icon:'🌾', desc:'野獸成群的廣闊草原',    floors:10, pool:['rabbit','rabbit','bigrat','bigrat','wolf'],    boss:'plainsBoss',   special:false },
{ id:'ruins',   name:'廢棄村落', icon:'🏚️', desc:'哥布林盤踞的廢墟',      floors:10, pool:['goblin','goblin','goblinArcher','goblinMage'], boss:'goblinKing',   special:false },
{ id:'cave',    name:'洞　穴',   icon:'🕳️', desc:'黑暗中潛伏的不死生物',  floors:10, pool:['skeleton','skeleton','bat','bat','skeleton'],  boss:'skeletonMage', special:false },
{ id:'swamp',   name:'毒沼澤',   icon:'🌿', desc:'【特殊】骰子被中毒詛咒', floors:5,  pool:['viper','viper','spider','frog'],               boss:'vipQueen',     special:true  },
];

// ══════════ 物品 ══════════
const ITEMS_DEF = {
hp_pot:  { id:'hp_pot',  name:'HP小回復藥', icon:'🧪', desc:'恢復 20 HP',    buyPrice:30, sellPrice:12 },
mp_pot:  { id:'mp_pot',  name:'MP小回復藥', icon:'💧', desc:'恢復 10 MP',    buyPrice:25, sellPrice:10 },
hp_big:  { id:'hp_big',  name:'HP大回復藥', icon:'🍶', desc:'恢復 60 HP',    buyPrice:80, sellPrice:30 },
atk_buf: { id:'atk_buf', name:'戰鬥強化',   icon:'⚔️', desc:'本關攻擊+5',    buyPrice:40, sellPrice:15 },
def_buf: { id:'def_buf', name:'防禦強化',   icon:'🛡️', desc:'本關防禦+5',    buyPrice:40, sellPrice:15 },
antidote:{ id:'antidote',name:'解毒藥',     icon:'💚', desc:'解除中毒狀態',   buyPrice:35, sellPrice:12 },
escape:  { id:'escape',  name:'逃脫繩索',   icon:'🪢', desc:'跳過非Boss關',  buyPrice:60, sellPrice:20 },
};

const MERCHANT_ITEMS = ['hp_pot','mp_pot','hp_big','atk_buf','def_buf','antidote','escape'];

// ══════════ 任務 ══════════
const QUESTS_DEF = [
{ id:'q1', name:'盜賊掃蕩',  target:'bandit',   need:5,  reward:{ gold:60, xp:40, items:['hp_pot']  } },
{ id:'q2', name:'哥布林掃蕩',target:'goblin',   need:10, reward:{ gold:80, xp:50, items:['hp_pot']  } },
{ id:'q3', name:'骸骨清除',  target:'skeleton', need:5,  reward:{ gold:70, xp:45, items:[]           } },
{ id:'q4', name:'野獸獵人',  target:'wolf',     need:3,  reward:{ gold:50, xp:35, items:['atk_buf'] } },
{ id:'q5', name:'蝙蝠驅除',  target:'bat',      need:5,  reward:{ gold:55, xp:38, items:[]           } },
{ id:'q6', name:'毒沼探險',  target:'viper',    need:8,  reward:{ gold:90, xp:60, items:['antidote'] } },
];