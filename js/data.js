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

// ══════════ 初始骰子（無職業） ══════════
const DEFAULT_DICE = [
  { faces:['atk','atk','def','def','sp','none'] },
  { faces:['atk','atk','def','def','sp','none'] },
  { faces:['atk','atk','def','def','sp','none'] },
];

// ══════════ 技能樹 ══════════
// branch: 'power'(力量) | 'magic'(魔法) | 'agile'(敏捷) | 'holy'(神聖)
// prereq: 同分支前一技能 id（null = 根節點，任何人都能學）
// req: 戰鬥中使用時所需骰面組合
const SKILL_TREE = {
  power: {
    label: '⚔️ 力量', color: '#e07040',
    nodes: [
      { id:'slash',    name:'斬擊',    tier:1, prereq:null,      mpCost:0,  req:{atk:2},         desc:'物攻×2 → 強力一擊',           dmgMult:1.8, dmgStat:'atk',  effect:null       },
      { id:'dslash',   name:'雙重斬',  tier:2, prereq:'slash',   mpCost:10, req:{atk:3},         desc:'物攻×3 → 穩定高傷',           dmgMult:2.2, dmgStat:'atk',  effect:null       },
      { id:'counter',  name:'反擊姿態',tier:2, prereq:'slash',   mpCost:0,  req:{def:1,atk:1},   desc:'防禦×1+物攻×1 → 反彈30%傷害', dmgMult:0,   dmgStat:null,   effect:'counter'  },
      { id:'berserker',name:'狂戰士',  tier:3, prereq:'dslash',  mpCost:15, req:{atk:4},         desc:'物攻×4 → 極限爆發',           dmgMult:3.0, dmgStat:'atk',  effect:null       },
      { id:'warshout', name:'戰吼',    tier:3, prereq:'counter', mpCost:10, req:{atk:2,def:1},   desc:'攻擊+本回合物防+8',           dmgMult:1.2, dmgStat:'atk',  effect:'warshout' },
    ],
  },
  magic: {
    label: '🔮 魔法', color: '#6060e0',
    nodes: [
      { id:'fireball', name:'火球術',  tier:1, prereq:null,      mpCost:15, req:{matk:2},        desc:'魔攻×2 → 魔法強攻',           dmgMult:1.8, dmgStat:'matk', effect:null       },
      { id:'burnball', name:'燃燒彈',  tier:2, prereq:'fireball',mpCost:20, req:{matk:1,sp:2},   desc:'魔攻×1+特殊×2 → 燃燒2回合',  dmgMult:1.0, dmgStat:'matk', effect:'burn'     },
      { id:'stun',     name:'暈眩術',  tier:2, prereq:'fireball',mpCost:15, req:{matk:1,sp:1},   desc:'魔攻×1+特殊×1 → 敵人跳過',   dmgMult:0,   dmgStat:null,   effect:'stun'     },
      { id:'arcane',   name:'秘術爆發',tier:3, prereq:'burnball',mpCost:25, req:{atk:1,sp:2},    desc:'攻×1+特殊×2 → 魔法大傷',     dmgMult:2.5, dmgStat:'matk', effect:null       },
      { id:'blizzard', name:'冰暴',    tier:3, prereq:'stun',    mpCost:30, req:{matk:3},        desc:'魔攻×3 → 全面魔法打擊',       dmgMult:2.8, dmgStat:'matk', effect:null       },
    ],
  },
  agile: {
    label: '🏹 敏捷', color: '#40c080',
    nodes: [
      { id:'evade',    name:'必閃',    tier:1, prereq:null,      mpCost:10, req:{sp:1,def:1},    desc:'特殊×1+防禦×1 → 閃避下次攻擊',dmgMult:0,  dmgStat:null,   effect:'evade'    },
      { id:'magarrow', name:'魔法箭',  tier:2, prereq:'evade',   mpCost:12, req:{matk:2},        desc:'魔攻×2 → 穿透魔攻',           dmgMult:1.8, dmgStat:'matk', effect:null       },
      { id:'mp_fill',  name:'MP充填',  tier:2, prereq:'evade',   mpCost:0,  req:{sp:3},          desc:'特殊×3 → 回復 30 MP',         dmgMult:0,   dmgStat:null,   effect:'mpfill'   },
      { id:'swiftkill',name:'疾風斬',  tier:3, prereq:'magarrow',mpCost:18, req:{atk:2,sp:1},   desc:'物攻×2+速度加成 → 高速攻擊',  dmgMult:2.0, dmgStat:'atk',  effect:'swift'    },
      { id:'smokebomb',name:'煙霧彈',  tier:3, prereq:'mp_fill', mpCost:20, req:{sp:2,def:1},   desc:'特殊×2+防禦×1 → 回避+反擊',  dmgMult:0,   dmgStat:null,   effect:'smokebomb'},
    ],
  },
  holy: {
    label: '✨ 神聖', color: '#e0c040',
    nodes: [
      { id:'heal',      name:'治療',   tier:1, prereq:null,      mpCost:20, req:{sp:2},          desc:'特殊×2 → 回復 20HP+魔攻加成', dmgMult:0,   dmgStat:null,   effect:'heal'     },
      { id:'regen',     name:'恢復術', tier:2, prereq:'heal',    mpCost:15, req:{sp:1,def:1},    desc:'特殊×1+防禦×1 → 回復部分HP', dmgMult:0,   dmgStat:null,   effect:'regen'    },
      { id:'guard',     name:'鐵壁',   tier:2, prereq:'heal',    mpCost:0,  req:{def:2},         desc:'防禦×2 → 本回合傷害-60%',    dmgMult:0,   dmgStat:null,   effect:'shield'   },
      { id:'holylight', name:'聖光術', tier:3, prereq:'regen',   mpCost:25, req:{matk:2,sp:1},  desc:'魔攻×2+特殊×1 → 大回復+解毒',dmgMult:0,   dmgStat:null,   effect:'holylight'},
      { id:'sanctuary', name:'聖域',   tier:3, prereq:'guard',   mpCost:30, req:{def:2,sp:2},   desc:'防禦×2+特殊×2 → 一回合無敵', dmgMult:0,   dmgStat:null,   effect:'sanctuary'},
    ],
  },
};

// 扁平化查詢用
const SKILLS_DEF = Object.values(SKILL_TREE).flatMap(b => b.nodes);

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

// ── 雪山 ──
snowWolf:    { name:'雪原狼',    hp:55,  atk:13, def:5, mdef:4,  xp:22, gold:16, type:'snowwolf',  actions:['attack','heavy','attack'],   boss:false },
yeti:        { name:'雪人',      hp:70,  atk:16, def:7, mdef:4,  xp:28, gold:20, type:'yeti',      actions:['attack','heavy','defend'],   boss:false },
iceGolem:    { name:'冰魔像',    hp:90,  atk:14, def:10,mdef:6,  xp:32, gold:24, type:'icegolem',  actions:['attack','defend','defend'],  boss:false },
frostDrake:  { name:'霜龍幼體',  hp:170, atk:20, def:10,mdef:12, xp:90, gold:80, type:'frostboss', actions:['attack','heavy','freeze'],   boss:true, phase2:{ atk:24, actions:['freeze','heavy','heavy'] } },

// ── 火山 ──
lavaBat:     { name:'熔岩蝙蝠',  hp:48,  atk:12, def:3, mdef:5,  xp:20, gold:15, type:'lavabat',   actions:['attack','attack','heavy'],   boss:false },
fireLizard:  { name:'火蜥蜴',    hp:62,  atk:15, def:6, mdef:4,  xp:25, gold:18, type:'fireliz',   actions:['attack','burn','attack'],    boss:false },
magmaGiant:  { name:'岩漿巨人',  hp:85,  atk:18, def:9, mdef:5,  xp:35, gold:26, type:'magmagiant',actions:['heavy','attack','defend'],   boss:false },
infernoLord: { name:'業火之主',  hp:200, atk:22, def:12,mdef:10, xp:110,gold:100,type:'infernoboss',actions:['burn','heavy','attack'],    boss:true, phase2:{ atk:28, actions:['burn','burn','heavy'] } },

// ── 神殿 ──
cultist:     { name:'邪教徒',    hp:60,  atk:14, def:5, mdef:8,  xp:26, gold:18, type:'cultist',   actions:['attack','heavy','attack'],   boss:false },
golem:       { name:'石像守衛',  hp:100, def:14, atk:10,mdef:8,  xp:32, gold:22, type:'golem',     actions:['defend','attack','defend'],  boss:false },
highPriest:  { name:'邪神祭司',  hp:75,  atk:12, def:6, mdef:15, xp:30, gold:24, type:'priest',    actions:['attack','stun','heavy'],     boss:false },
ancientGod:  { name:'遠古神靈',  hp:280, atk:25, def:15,mdef:18, xp:150,gold:140,type:'godboss',   actions:['heavy','stun','attack'],     boss:true, phase2:{ atk:30, actions:['stun','heavy','stun'] } },

// ── 精英怪（各地圖隨機出現） ──
eliteKnight: { name:'★ 黑甲騎士', hp:120, atk:18, def:12,mdef:8, xp:50, gold:45, type:'elite',    actions:['attack','heavy','defend'],   boss:false, elite:true },
eliteWitch:  { name:'★ 黑魔女',   hp:90,  atk:22, def:6, mdef:14,xp:50, gold:45, type:'elite',    actions:['heavy','attack','stun'],     boss:false, elite:true },
eliteTroll:  { name:'★ 巨魔',     hp:150, atk:20, def:10,mdef:6, xp:55, gold:48, type:'elite',    actions:['heavy','heavy','defend'],    boss:false, elite:true },
};

// ══════════ 地圖 ══════════
const MAPS = [
{ id:'village', name:'村　莊',   icon:'🏘️', desc:'盜賊橫行的小村莊',     floors:5,  pool:['thief','thief','bandit','bandit'],           boss:'banditBoss',   special:false },
{ id:'plains',  name:'草　原',   icon:'🌾', desc:'野獸成群的廣闊草原',    floors:10, pool:['rabbit','rabbit','bigrat','bigrat','wolf'],    boss:'plainsBoss',   special:false },
{ id:'ruins',   name:'廢棄村落', icon:'🏚️', desc:'哥布林盤踞的廢墟',      floors:10, pool:['goblin','goblin','goblinArcher','goblinMage'], boss:'goblinKing',   special:false },
{ id:'cave',    name:'洞　穴',   icon:'🕳️', desc:'黑暗中潛伏的不死生物',  floors:10, pool:['skeleton','skeleton','bat','bat','skeleton'],  boss:'skeletonMage', special:false },
{ id:'swamp',   name:'毒沼澤',   icon:'🌿', desc:'【特殊】骰子被中毒詛咒', floors:5,  pool:['viper','viper','spider','frog'],                boss:'vipQueen',     special:true,  unlockReq:'cave'   },
{ id:'snowmnt', name:'雪　山',   icon:'🏔️', desc:'極寒之地，SP骰消耗加倍',   floors:12, pool:['snowWolf','snowWolf','yeti','iceGolem'],          boss:'frostDrake',   special:true,  unlockReq:'ruins'  },
{ id:'volcano', name:'火　山',   icon:'🌋', desc:'【特殊】每回合扣1HP（熔岩）',floors:12,pool:['lavaBat','fireLizard','fireLizard','magmaGiant'], boss:'infernoLord',  special:true,  unlockReq:'cave'   },
{ id:'temple',  name:'遠古神殿', icon:'🏛️', desc:'最終挑戰，Boss有兩個階段',  floors:15, pool:['cultist','cultist','golem','highPriest'],          boss:'ancientGod',   special:false, unlockReq:'swamp'  },
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
{ id:'q1',  name:'盜賊掃蕩',   target:'bandit',    need:5,  mapReq:'village', reward:{ gold:60,  xp:40,  items:['hp_pot']  } },
{ id:'q2',  name:'哥布林掃蕩', target:'goblin',    need:10, mapReq:'ruins',   reward:{ gold:80,  xp:50,  items:['hp_pot']  } },
{ id:'q3',  name:'骸骨清除',   target:'skeleton',  need:5,  mapReq:'cave',    reward:{ gold:70,  xp:45,  items:[]           } },
{ id:'q4',  name:'野獸獵人',   target:'wolf',      need:3,  mapReq:'plains',  reward:{ gold:50,  xp:35,  items:['atk_buf'] } },
{ id:'q5',  name:'蝙蝠驅除',   target:'bat',       need:5,  mapReq:'cave',    reward:{ gold:55,  xp:38,  items:[]           } },
{ id:'q6',  name:'毒沼探險',   target:'viper',     need:8,  mapReq:'swamp',   reward:{ gold:90,  xp:60,  items:['antidote'] } },
{ id:'q7',  name:'雪山獵人',   target:'yeti',      need:5,  mapReq:'snowmnt', reward:{ gold:120, xp:80,  items:['hp_pot']  } },
{ id:'q8',  name:'熔岩掃蕩',   target:'fireLizard',need:6,  mapReq:'volcano', reward:{ gold:130, xp:85,  items:['hp_pot']  } },
{ id:'q9',  name:'邪教清剿',   target:'cultist',   need:8,  mapReq:'temple',  reward:{ gold:150, xp:100, items:['mp_pot']  } },
{ id:'q10', name:'精英獵人',   target:'elite',     need:3,  mapReq:'ruins',   reward:{ gold:200, xp:120, items:['hp_pot','mp_pot'] } },
];
// ══════════ NPC 對話 ══════════
const NPCS = {
  // 酒館常駐 NPC
  tavern: [
    {
      id: 'barkeep',
      name: '老酒保 葛雷',
      icon: '🍺',
      desc: '在這裡打雜了二十年，什麼都見過。',
      // 對話依據遊戲進度變化：key 為已通關地圖數
      dialogues: [
        {
          condition: (G) => !G.clearedMaps || G.clearedMaps.length === 0,
          greeting: '歡迎，新來的。這裡不是觀光勝地，你最好有點本事再上路。',
          options: [
            {
              text: '聽說附近有盜賊？',
              reply: '村莊方向最近很亂。葛洛家的商隊三天前失聯了。去的人……沒有回來的。'
            },
            {
              text: '骰子有什麼講究？',
              reply: '看你擲出什麼面，就決定你能做什麼。ATK 多，打得重；DEF 多，撐得久。SP 嘛…是野路子玩法，要靠技能才能發揮。'
            },
            {
              text: '（什麼都不說，點點頭）',
              reply: '…聰明。少說話，多活命。'
            }
          ]
        },
        {
          condition: (G) => G.clearedMaps && G.clearedMaps.includes('village'),
          greeting: '喔，你把那幫盜賊收拾了？不錯嘛，比我預期的強。',
          options: [
            {
              text: '葛洛家的商隊怎樣了？',
              reply: '你去了才知道，對吧？他們……沒事就好。這一帶的人都欠你一個人情。'
            },
            {
              text: '草原上有什麼？',
              reply: '野獸成群。草原巨獸在那一帶稱王快十年了，沒人敢靠近。膽子夠大就去試試。'
            },
            {
              text: '給我來一杯最烈的。',
              reply: '（葛雷沉默地倒了一杯，推過來）……加油，旅人。'
            }
          ]
        },
        {
          condition: (G) => G.clearedMaps && G.clearedMaps.length >= 3,
          greeting: '你還活著。每次看到你進門，我都覺得有點驚訝。',
          options: [
            {
              text: '我覺得我變強了。',
              reply: '（葛雷打量你一眼）…確實。你眼神不一樣了。不再是那個剛進門時的樣子。'
            },
            {
              text: '聽說有毒沼澤？',
              reply: '那是老地方，以前是村莊。毒蛇女王盤踞之後，就沒人回來過。小心你的骰子，那裡的詛咒會讓骰面腐壞。'
            },
            {
              text: '你這輩子最後悔的事是什麼？',
              reply: '（沉默良久）…曾經有機會離開這裡。沒走。現在，擦杯子擦了二十年。去吧，別讓自己後悔。'
            }
          ]
        }
      ]
    },
    {
      id: 'old_soldier',
      name: '退役老兵 艾肯',
      icon: '⚔️',
      desc: '右臂有舊傷，眼神銳利。',
      dialogues: [
        {
          condition: (G) => true,
          greeting: '坐。不認識你，但你那雙手告訴我你是個打架的料。',
          options: [
            {
              text: '你以前是什麼人？',
              reply: '騎兵隊。十五年前的戰爭裡活下來的，就我一個。右臂斷了又接回去，用起來勉強。'
            },
            {
              text: '有什麼戰鬥心得？',
              reply: 'DEF 面不是讓你縮著用的。防住一擊，反擊就有機會。你的骰子越多防禦面，就越難被打垮。'
            },
            {
              text: '這地方有什麼危險？',
              reply: '洞穴裡的骷髏法師。那東西會痛苦，但不知道痛。把牠打趴為止，別留餘地。'
            }
          ]
        }
      ]
    },
    {
      id: 'merchant_wife',
      name: '商人之妻 瑟拉',
      icon: '💐',
      desc: '正在等待什麼人的樣子。',
      dialogues: [
        {
          condition: (G) => !G.clearedMaps || !G.clearedMaps.includes('village'),
          greeting: '（抬頭）你也是要去村莊方向的人嗎？我丈夫三天沒消息了……',
          options: [
            {
              text: '我會留意的。',
              reply: '（眼眶泛紅）謝謝你。他叫葛洛，棕色的車篷。如果你見到他……請告訴他，我在這裡等。'
            },
            {
              text: '他叫什麼名字？',
              reply: '葛洛。葛洛·丹恩。是個不會打架的普通商人……那才是問題所在。'
            },
            {
              text: '（什麼都說不出口）',
              reply: '……沒關係。你去路上小心。'
            }
          ]
        },
        {
          condition: (G) => G.clearedMaps && G.clearedMaps.includes('village'),
          greeting: '（站起來，眼眶紅著）你是把他們救出來的人嗎？葛洛說有個旅人……',
          options: [
            {
              text: '他沒事，放心。',
              reply: '（深吸一口氣，然後笑了）謝謝你。這輩子欠你的，我記著。（悄悄放了一個小包在桌上）不多，但請收下。'
            },
            {
              text: '只是剛好路過。',
              reply: '（搖頭）沒有人是「剛好」的。你去了，那就是你救的。謝謝你，旅人。'
            }
          ]
        }
      ]
    }
  ],

  // 探索途中隨機路人
  road: [
    {
      id: 'lost_traveler',
      name: '迷路的旅人',
      icon: '🧳',
      dialogues: [
        {
          condition: (G) => true,
          greeting: '喂！你是往城鎮去的嗎？我迷路了，這地方的路全長得一樣……',
          options: [
            {
              text: '城鎮往那個方向。',
              reply: '（如釋重負）謝謝！對了，路上有個隱密的地方可以補給，告訴你作為答謝——（塞給你一個藥水）'
            },
            {
              text: '我也不太確定方向。',
              reply: '…那我們一樣。（苦笑）至少知道有人跟我同病相憐，感覺好多了。'
            },
            {
              text: '小心那邊的野獸。',
              reply: '（臉色一白）野獸……好，我繞路。謝謝你救了我一命。'
            }
          ]
        }
      ]
    },
    {
      id: 'wounded_scout',
      name: '受傷的斥候',
      icon: '🩹',
      dialogues: [
        {
          condition: (G) => true,
          greeting: '（靠著樹，捂著肩膀）旅人……前面不要去。我的小隊……只剩我一個。',
          options: [
            {
              text: '前面有什麼？',
              reply: '（喘著氣）Boss 級的怪。我們六個人，五分鐘之內……你有骰子？用 SP 面——那是牠唯一的弱點。'
            },
            {
              text: '你傷成這樣還好嗎？',
              reply: '還能說話，就還沒死。（苦笑）你繼續去吧，別管我……我休息一下就走。'
            },
            {
              text: '我陪你回城。',
              reply: '不用。你有更重要的事。（塞給你一個東西）這是我們隊伍收集的，你用得上。'
            }
          ]
        }
      ]
    },
    {
      id: 'strange_child',
      name: '說話奇怪的孩子',
      icon: '🧒',
      dialogues: [
        {
          condition: (G) => true,
          greeting: '叔叔/阿姨，你的骰子會唱歌嗎？我的會。（從口袋掏出一個普通石頭）',
          options: [
            {
              text: '你一個人在這裡？',
              reply: '我在等我媽媽。她說去採花，說很快回來。（停頓）已經很久了。'
            },
            {
              text: '骰子怎麼會唱歌？',
              reply: '晚上很安靜的時候，側耳聽……（壓低聲音）它說，你今天會贏。（認真的眼神）'
            },
            {
              text: '你叫什麼名字？',
              reply: '媽媽叫我小六，因為我是老六。（數手指）大哥、二哥、三姐、四姐、五弟……然後是我。'
            }
          ]
        }
      ]
    },
    {
      id: 'hermit_sage',
      name: '隱居的賢者',
      icon: '🧙',
      dialogues: [
        {
          condition: (G) => G.level && G.level >= 3,
          greeting: '（睜開眼）你的氣息……有戰場的味道。坐。不花你多少時間。',
          options: [
            {
              text: '你是什麼人？',
              reply: '曾經是個老師。教過很多人殺人的技術，後來厭倦了，就在這裡種菜。（指著身後什麼都沒有的地方）'
            },
            {
              text: '給我一些建議。',
              reply: '骰子是工具，不是命運。同樣的六個面，在弱者手中是廢鐵，在強者手中是利刃。差別在於你怎麼選擇。'
            },
            {
              text: '前面的敵人怎麼樣？',
              reply: '（沉默片刻）比你想的難。但也比你怕的簡單。去吧，只管往前。'
            }
          ]
        },
        {
          condition: (G) => !G.level || G.level < 3,
          greeting: '（睜開眼看你一眼，又閉上）……還嫩。再去歷練幾場再來找我說話。',
          options: [
            {
              text: '等等，我有問題——',
              reply: '（沒有回應。微風吹過。）'
            },
            {
              text: '（轉身離開）',
              reply: '（背後傳來）……記住，不要在 Boss 關用逃脫繩索。（聲音消失了。）'
            }
          ]
        }
      ]
    }
  ]
};

// ══════════ 裝備系統 ══════════

// 詞綴池（前綴 + 後綴）
const AFFIXES = {
  prefix: [
    { id:'fierce',  name:'兇猛的',  stat:'atk',  val:4,  rare:1 },
    { id:'sturdy',  name:'堅固的',  stat:'def',  val:4,  rare:1 },
    { id:'arcane',  name:'奧術的',  stat:'matk', val:4,  rare:1 },
    { id:'swift',   name:'迅捷的',  stat:'spd',  val:3,  rare:1 },
    { id:'iron',    name:'鐵壁的',  stat:'def',  val:7,  rare:2 },
    { id:'blazing', name:'灼燃的',  stat:'matk', val:8,  rare:2 },
    { id:'brutal',  name:'殘暴的',  stat:'atk',  val:8,  rare:2 },
    { id:'heroic',  name:'英雄的',  stat:'atk',  val:14, rare:3 },
    { id:'divine',  name:'神聖的',  stat:'matk', val:14, rare:3 },
    { id:'aegis',   name:'神盾的',  stat:'def',  val:12, rare:3 },
  ],
  suffix: [
    { id:'of_bear',    name:'of 熊',   stat:'maxHp', val:20,  rare:1 },
    { id:'of_fox',     name:'of 狐',   stat:'spd',   val:3,   rare:1 },
    { id:'of_owl',     name:'of 梟',   stat:'mdef',  val:4,   rare:1 },
    { id:'of_wolf',    name:'of 狼',   stat:'atk',   val:5,   rare:2 },
    { id:'of_dragon',  name:'of 龍',   stat:'matk',  val:9,   rare:2 },
    { id:'of_giant',   name:'of 巨人', stat:'maxHp', val:45,  rare:3 },
    { id:'of_phoenix', name:'of 鳳',   stat:'matk',  val:12,  rare:3 },
  ],
};

// 裝備基底定義
// slots: weapon / armor / accessory
const EQUIP_BASE = {
  // 武器
  w_short:  { id:'w_short',  slot:'weapon',    name:'短劍',   icon:'🗡️',  desc:'入門武器',       jobs:['warrior','archer'], buyPrice:80,  stats:{ atk:5 } },
  w_staff:  { id:'w_staff',  slot:'weapon',    name:'木法杖', icon:'🪄',  desc:'魔法入門用杖',   jobs:['mage','priest'],    buyPrice:80,  stats:{ matk:5 } },
  w_long:   { id:'w_long',   slot:'weapon',    name:'長劍',   icon:'⚔️',  desc:'劍士標配長劍',   jobs:['warrior'],          buyPrice:160, stats:{ atk:10 } },
  w_bow:    { id:'w_bow',    slot:'weapon',    name:'獵弓',   icon:'🏹',  desc:'遠程主力武器',   jobs:['archer'],           buyPrice:160, stats:{ atk:7, spd:3 } },
  w_tome:   { id:'w_tome',   slot:'weapon',    name:'古魔典', icon:'📖',  desc:'強力魔法書',     jobs:['mage'],             buyPrice:160, stats:{ matk:12 } },
  w_mace:   { id:'w_mace',   slot:'weapon',    name:'神聖錘', icon:'🔨',  desc:'僧侶專用聖錘',   jobs:['priest'],           buyPrice:160, stats:{ matk:9, mdef:3 } },
  // 防具
  a_cloth:  { id:'a_cloth',  slot:'armor',     name:'布衣',   icon:'👘',  desc:'輕量布製護甲',   jobs:null,                 buyPrice:70,  stats:{ def:4 } },
  a_leather:{ id:'a_leather',slot:'armor',     name:'皮甲',   icon:'🥋',  desc:'標準皮製護甲',   jobs:['warrior','archer'], buyPrice:130, stats:{ def:8 } },
  a_robe:   { id:'a_robe',   slot:'armor',     name:'魔法袍', icon:'🥻',  desc:'魔法師護甲',     jobs:['mage','priest'],    buyPrice:130, stats:{ def:4, mdef:6 } },
  a_plate:  { id:'a_plate',  slot:'armor',     name:'板甲',   icon:'🛡️',  desc:'重型板甲',       jobs:['warrior'],          buyPrice:220, stats:{ def:16, spd:-2 } },
  a_chain:  { id:'a_chain',  slot:'armor',     name:'鎖甲',   icon:'⛓️',  desc:'機動鎖鏈甲',     jobs:['archer','warrior'], buyPrice:200, stats:{ def:12 } },
  a_silk:   { id:'a_silk',   slot:'armor',     name:'精靈絲袍',icon:'✨', desc:'輕盈魔法護甲',   jobs:['mage','priest'],    buyPrice:220, stats:{ def:7, mdef:10, maxMp:15 } },
  // 飾品
  r_amulet: { id:'r_amulet', slot:'accessory', name:'護身符', icon:'📿',  desc:'基本護身符',     jobs:null,                 buyPrice:90,  stats:{ maxHp:15 } },
  r_ring:   { id:'r_ring',   slot:'accessory', name:'力量戒指',icon:'💍', desc:'提升物理能力',   jobs:null,                 buyPrice:100, stats:{ atk:3, def:3 } },
  r_gem:    { id:'r_gem',    slot:'accessory', name:'魔力寶珠',icon:'🔮', desc:'提升魔法能力',   jobs:null,                 buyPrice:100, stats:{ matk:4, maxMp:10 } },
  r_cloak:  { id:'r_cloak',  slot:'accessory', name:'影隱披風',icon:'🦇', desc:'提升速度與防魔', jobs:null,                 buyPrice:150, stats:{ spd:5, mdef:5 } },
  r_crown:  { id:'r_crown',  slot:'accessory', name:'智慧王冠',icon:'👑', desc:'全屬性強化',     jobs:null,                 buyPrice:250, stats:{ atk:3, matk:3, def:3, mdef:3 } },
};

// 套裝定義（穿齊觸發額外效果）
const SET_BONUSES = {
  warrior_set: {
    name:'鐵血戰士套裝',
    pieces: ['w_long', 'a_plate', 'r_ring'],
    bonus: { atk:8, def:6, maxHp:30 },
    desc:'ATK+8 / DEF+6 / MaxHP+30',
  },
  mage_set: {
    name:'奧術法師套裝',
    pieces: ['w_tome', 'a_silk', 'r_gem'],
    bonus: { matk:10, mdef:8, maxMp:30 },
    desc:'MATK+10 / MDEF+8 / MaxMP+30',
  },
  archer_set: {
    name:'疾風弓手套裝',
    pieces: ['w_bow', 'a_chain', 'r_cloak'],
    bonus: { atk:6, spd:8, mdef:4 },
    desc:'ATK+6 / SPD+8 / MDEF+4',
  },
  priest_set: {
    name:'聖光僧侶套裝',
    pieces: ['w_mace', 'a_silk', 'r_amulet'],
    bonus: { matk:6, mdef:8, maxHp:25, maxMp:20 },
    desc:'MATK+6 / MDEF+8 / MaxHP+25 / MaxMP+20',
  },
};

// 商店每次刷新可購買的裝備池（按難度分層）
const EQUIP_SHOP_POOL = {
  tier1: ['w_short','w_staff','a_cloth','r_amulet'],
  tier2: ['w_long','w_bow','w_tome','w_mace','a_leather','a_robe','r_ring','r_gem'],
  tier3: ['a_plate','a_chain','a_silk','r_cloak','r_crown'],
};
