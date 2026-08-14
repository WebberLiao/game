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

// ══════════ 被動技能（各分支 Tier 4，學後永久生效）══════════
// type: 'stat'（純加成）| 'trigger'（觸發型）
// passive: true 標記此節點為被動
const PASSIVE_TREE = {
  power: [
    { id:'p_ironflesh',  name:'鐵血肉身',  tier:4, prereq:'berserker', passive:true, type:'stat',
      statBonus:{ maxHp:30, def:3 },
      desc:'永久 MaxHP+30、DEF+3',
    },
    { id:'p_wrath',      name:'憤怒之心',  tier:4, prereq:'warshout',  passive:true, type:'trigger',
      trigger:'on_hit', chance:0.25, effect:'atkbuf2',
      desc:'普攻命中時 25% 機率本回合 ATK+4',
    },
  ],
  magic: [
    { id:'p_manawell',   name:'魔力之泉',  tier:4, prereq:'arcane',    passive:true, type:'stat',
      statBonus:{ maxMp:30, matk:4 },
      desc:'永久 MaxMP+30、MATK+4',
    },
    { id:'p_burnmaster', name:'燃燒精通',  tier:4, prereq:'blizzard',  passive:true, type:'trigger',
      trigger:'on_kill', chance:1.0, effect:'mprefund',
      desc:'擊殺敵人時回復 15 MP',
    },
  ],
  agile: [
    { id:'p_windfoot',   name:'疾風步',    tier:4, prereq:'swiftkill', passive:true, type:'stat',
      statBonus:{ spd:5, mdef:4 },
      desc:'永久 SPD+5、MDEF+4',
    },
    { id:'p_shadowstep', name:'暗影步',    tier:4, prereq:'smokebomb', passive:true, type:'trigger',
      trigger:'on_evade', chance:1.0, effect:'counteratk',
      desc:'成功閃避時自動反擊（造成 ATK×1 傷害）',
    },
  ],
  holy: [
    { id:'p_holyaura',   name:'聖光護罩',  tier:4, prereq:'holylight', passive:true, type:'stat',
      statBonus:{ mdef:6, maxHp:20 },
      desc:'永久 MDEF+6、MaxHP+20',
    },
    { id:'p_blessing',   name:'神聖祝福',  tier:4, prereq:'sanctuary', passive:true, type:'trigger',
      trigger:'on_low_hp', threshold:0.3, chance:1.0, effect:'autoheal',
      desc:'HP 低於 30% 時戰鬥結束自動回復 25% MaxHP（每場戰鬥一次）',
    },
  ],
};

// 扁平化
const ALL_PASSIVES = Object.values(PASSIVE_TREE).flat();

// ══════════ 成就系統 ══════════
// hidden: true → 達成前不顯示名稱（顯示 ???）
// category: 'battle' | 'explore' | 'growth' | 'secret'
const ACHIEVEMENTS = [
  // ── 戰鬥類（顯示進度）──
  { id:'ach_first_blood', name:'初戰告捷',  icon:'⚔️',  cat:'battle',  hidden:false,
    desc:'完成第一場戰鬥',       cond: g => (g.achStats?.kills||0) >= 1 },
  { id:'ach_kill10',      name:'戰場老兵',  icon:'🗡️',  cat:'battle',  hidden:false,
    desc:'累計擊敗 10 隻敵人',   cond: g => (g.achStats?.kills||0) >= 10,
    progress: g => Math.min(g.achStats?.kills||0, 10), total:10 },
  { id:'ach_kill50',      name:'百戰沙場',  icon:'⚔️',  cat:'battle',  hidden:false,
    desc:'累計擊敗 50 隻敵人',   cond: g => (g.achStats?.kills||0) >= 50,
    progress: g => Math.min(g.achStats?.kills||0, 50), total:50 },
  { id:'ach_kill_elite',  name:'精英剋星',  icon:'★',   cat:'battle',  hidden:false,
    desc:'擊敗 5 隻精英怪',      cond: g => (g.achStats?.eliteKills||0) >= 5,
    progress: g => Math.min(g.achStats?.eliteKills||0, 5), total:5 },
  { id:'ach_boss_all',    name:'Boss終結者',icon:'👑',  cat:'battle',  hidden:false,
    desc:'擊敗所有地圖的 Boss',  cond: g => (g.clearedMaps||[]).length >= 8 },
  { id:'ach_no_item',     name:'純粹之戰',  icon:'🥊',  cat:'battle',  hidden:true,
    desc:'不使用任何物品完成 Boss 戰',
    cond: g => (g.achStats?.bossNoItem||0) >= 1 },
  { id:'ach_perfect',     name:'完美防守',  icon:'🛡️',  cat:'battle',  hidden:true,
    desc:'一場戰鬥中完全不受傷（完整通關一張地圖）',
    cond: g => (g.achStats?.perfectRuns||0) >= 1 },

  // ── 探索類（顯示進度）──
  { id:'ach_first_map',   name:'踏出第一步',icon:'🗺️',  cat:'explore', hidden:false,
    desc:'首次完成地圖通關',     cond: g => (g.clearedMaps||[]).length >= 1 },
  { id:'ach_map3',        name:'旅途漸遠',  icon:'🧭',  cat:'explore', hidden:false,
    desc:'通關 3 張地圖',        cond: g => (g.clearedMaps||[]).length >= 3,
    progress: g => Math.min((g.clearedMaps||[]).length, 3), total:3 },
  { id:'ach_all_maps',    name:'天涯旅人',  icon:'🌍',  cat:'explore', hidden:false,
    desc:'通關全部 8 張地圖',    cond: g => (g.clearedMaps||[]).length >= 8,
    progress: g => Math.min((g.clearedMaps||[]).length, 8), total:8 },
  { id:'ach_swamp',       name:'沼澤倖存者',icon:'🌿',  cat:'explore', hidden:false,
    desc:'通關毒沼澤',           cond: g => (g.clearedMaps||[]).includes('swamp') },
  { id:'ach_temple',      name:'神殿征服者',icon:'🏛️',  cat:'explore', hidden:true,
    desc:'通關遠古神殿',         cond: g => (g.clearedMaps||[]).includes('temple') },
  { id:'ach_npc10',       name:'交友廣闊',  icon:'💬',  cat:'explore', hidden:false,
    desc:'與 NPC 對話 10 次',    cond: g => (g.achStats?.npcTalks||0) >= 10,
    progress: g => Math.min(g.achStats?.npcTalks||0, 10), total:10 },

  // ── 成長類（顯示進度）──
  { id:'ach_lv5',         name:'成長中的冒險者',icon:'📈',cat:'growth', hidden:false,
    desc:'達到 5 級',            cond: g => (g.level||1) >= 5,
    progress: g => Math.min(g.level||1, 5), total:5 },
  { id:'ach_lv10',        name:'老練冒險者',icon:'🌟',  cat:'growth',  hidden:false,
    desc:'達到 10 級',           cond: g => (g.level||1) >= 10,
    progress: g => Math.min(g.level||1, 10), total:10 },
  { id:'ach_skill5',      name:'技能收藏家',icon:'📚',  cat:'growth',  hidden:false,
    desc:'學會 5 個技能',        cond: g => (g.learnedSkills||[]).length >= 5,
    progress: g => Math.min((g.learnedSkills||[]).length, 5), total:5 },
  { id:'ach_passive3',    name:'潛力覺醒',  icon:'💡',  cat:'growth',  hidden:false,
    desc:'學會 3 個被動技能',    cond: g => (g.learnedSkills||[]).filter(id => ALL_PASSIVES.some(p=>p.id===id)).length >= 3,
    progress: g => Math.min((g.learnedSkills||[]).filter(id => ALL_PASSIVES.some(p=>p.id===id)).length, 3), total:3 },
  { id:'ach_rich',        name:'富甲一方',  icon:'💰',  cat:'growth',  hidden:false,
    desc:'擁有 1000 金幣',       cond: g => (g.gold||0) >= 1000,
    progress: g => Math.min(g.gold||0, 1000), total:1000 },
  { id:'ach_equip_set',   name:'套裝達人',  icon:'🎽',  cat:'growth',  hidden:true,
    desc:'集齊並穿上一套完整套裝',
    cond: g => {
      if (!g.equips || !g.learnedSkills) return false;
      return Object.values(SET_BONUSES||{}).some(set =>
        set.pieces.every(p => Object.values(g.equips).some(eq => eq && eq.id === p))
      );
    }
  },

  // ── 隱藏成就 ──
  { id:'ach_secret_npc',  name:'說話的石頭', icon:'🪨', cat:'secret',  hidden:true,
    desc:'（隱藏）與隱居賢者在低等級時搭話',
    cond: g => (g.achStats?.youngSage||0) >= 1 },
  { id:'ach_no_gold',     name:'一無所有',   icon:'🪙', cat:'secret',  hidden:true,
    desc:'（隱藏）金幣歸零後依然存活',
    cond: g => (g.achStats?.brokeRun||0) >= 1 },
  { id:'ach_die_then_win',name:'死裡逃生',   icon:'💀', cat:'secret',  hidden:true,
    desc:'（隱藏）HP 剩 1 時擊敗 Boss',
    cond: g => (g.achStats?.lastHpBoss||0) >= 1 },
  { id:'ach_all_passive', name:'境界大成',   icon:'🌀', cat:'secret',  hidden:true,
    desc:'（隱藏）學會全部 8 個被動技能',
    cond: g => ALL_PASSIVES.every(p => (g.learnedSkills||[]).includes(p.id)) },
  { id:'ach_speedrun',    name:'閃電旅人',   icon:'⚡', cat:'secret',  hidden:true,
    desc:'（隱藏）在 Lv.3 以下通關任一地圖',
    cond: g => (g.achStats?.lowLevelClear||0) >= 1 },
];

// ══════════ 每日任務系統 ══════════
// type: 'kill' | 'kill_elite' | 'clear_map' | 'use_skill' | 'earn_gold' | 'use_item'
const DAILY_QUEST_POOL = [
  { id:'dq_kill5',     type:'kill',       need:5,  desc:'今日擊敗 5 隻敵人',         reward:{ gold:60,  xp:30  } },
  { id:'dq_kill10',    type:'kill',       need:10, desc:'今日擊敗 10 隻敵人',        reward:{ gold:120, xp:60  } },
  { id:'dq_kill15',    type:'kill',       need:15, desc:'今日擊敗 15 隻敵人',        reward:{ gold:200, xp:100 } },
  { id:'dq_elite1',    type:'kill_elite', need:1,  desc:'今日擊敗 1 隻精英怪',       reward:{ gold:100, xp:50  } },
  { id:'dq_elite3',    type:'kill_elite', need:3,  desc:'今日擊敗 3 隻精英怪',       reward:{ gold:250, xp:120 } },
  { id:'dq_clear1',    type:'clear_map',  need:1,  desc:'今日完成 1 次地圖通關',     reward:{ gold:80,  xp:40  } },
  { id:'dq_clear2',    type:'clear_map',  need:2,  desc:'今日完成 2 次地圖通關',     reward:{ gold:180, xp:90  } },
  { id:'dq_skill5',    type:'use_skill',  need:5,  desc:'今日使用技能 5 次',         reward:{ gold:70,  xp:35  } },
  { id:'dq_skill10',   type:'use_skill',  need:10, desc:'今日使用技能 10 次',        reward:{ gold:150, xp:75  } },
  { id:'dq_gold100',   type:'earn_gold',  need:100,desc:'今日獲得 100 金幣（戰鬥）', reward:{ gold:50,  xp:25  } },
  { id:'dq_gold300',   type:'earn_gold',  need:300,desc:'今日獲得 300 金幣（戰鬥）', reward:{ gold:120, xp:60  } },
  { id:'dq_item1',     type:'use_item',   need:1,  desc:'今日使用 1 次物品',         reward:{ gold:60,  xp:30  } },
  { id:'dq_npc1',      type:'talk_npc',   need:1,  desc:'今日與 NPC 對話 1 次',      reward:{ gold:50,  xp:25  } },
  { id:'dq_survive',   type:'low_hp_win', need:1,  desc:'今日在低血量時擊敗敵人',    reward:{ gold:150, xp:80  } },
];

// 簽到里程碑（連續天數 → 特殊獎勵）
const CHECKIN_MILESTONES = [
  { days:3,  reward:{ gold:200, xp:100 }, desc:'連續簽到 3 天' },
  { days:7,  reward:{ gold:500, xp:300, items:['hp_pot','mp_pot'] }, desc:'連續簽到 7 天' },
  { days:14, reward:{ gold:1000, xp:600, items:['hp_pot','hp_pot','mp_pot'] }, desc:'連續簽到 14 天' },
  { days:30, reward:{ gold:3000, xp:1500, items:['hp_pot','mp_pot','hp_pot','mp_pot'] }, desc:'連續簽到 30 天' },
];

// ══════════ 隨機事件定義 ══════════
// mapFilter: null = 所有地圖, 或 ['village','plains',...] 指定地圖
// type: 'instant'（立即結果）| 'choice'（玩家選擇）
const RANDOM_EVENTS = [

  // ── 通用事件 ──
  {
    id: 'healing_spring',
    title: '💧 治療泉水',
    mapFilter: null, weight: 8,
    type: 'instant',
    resolve(G) {
      const heal = Math.floor(G.stats.maxHp * 0.3);
      const mpHeal = Math.floor(G.stats.maxMp * 0.3);
      G.stats.hp = Math.min(G.stats.maxHp, G.stats.hp + heal);
      G.stats.mp = Math.min(G.stats.maxMp, G.stats.mp + mpHeal);
      return { icon:'💧', desc:`清澈的泉水散發著療癒的光芒。你喝了幾口，恢復 ${heal} HP 和 ${mpHeal} MP。` };
    }
  },
  {
    id: 'wandering_merchant',
    title: '🧳 行商',
    mapFilter: null, weight: 6,
    type: 'choice',
    desc: '一個揹著大包裹的行商攔住你的去路。「喂，要不要看看我的特價貨？」',
    choices: [
      { label: '花 80 金買補給', cost: { gold: 80 },
        resolve(G) {
          if (G.gold < 80) return { desc: '金幣不足，行商聳聳肩走了。' };
          G.gold -= 80;
          const items = ['hp_pot','hp_pot','mp_pot','atk_buf'];
          const id = items[Math.floor(Math.random() * items.length)];
          addToBag(id);
          return { desc: `行商掏出一瓶 ${ITEMS_DEF[id].name} 遞給你。「划算吧！」` };
        }
      },
      { label: '搶奪他的貨物', cost: null,
        resolve(G) {
          const r = Math.random();
          if (r < 0.4) {
            const id = ['hp_pot','mp_pot'][Math.floor(Math.random()*2)];
            addToBag(id);
            return { desc: '你動作迅速，搶了一瓶補給就跑。行商在後面破口大罵。' };
          } else {
            const dmg = Math.floor(G.stats.maxHp * 0.1);
            G.stats.hp = Math.max(1, G.stats.hp - dmg);
            return { desc: `行商出乎意料地身手矯健，你被揍了一拳，損失 ${dmg} HP。哇！` };
          }
        }
      },
      { label: '無視繼續前進', cost: null,
        resolve(G) { return { desc: '你禮貌地搖搖手，行商聳聳肩，讓開了路。' }; }
      },
    ]
  },
  {
    id: 'ancient_altar',
    title: '🗿 古老祭壇',
    mapFilter: null, weight: 5,
    type: 'choice',
    desc: '路邊有一座古老的石製祭壇，上面刻著看不懂的符文，散發著微弱的光芒。',
    choices: [
      { label: '獻上 50 金，祈求祝福',
        resolve(G) {
          if (G.gold < 50) return { desc: '你口袋空空，神靈似乎有些不悅地熄滅了光芒。' };
          G.gold -= 50;
          const r = Math.random();
          if (r < 0.5) {
            G.stats.atk += 2; G.stats.matk += 2;
            return { desc: '祭壇發出金光！神靈賜予你力量，ATK 和 MATK 永久 +2。' };
          } else if (r < 0.8) {
            const heal = Math.floor(G.stats.maxHp * 0.5);
            G.stats.hp = Math.min(G.stats.maxHp, G.stats.hp + heal);
            return { desc: `祭壇發出柔光，你感到一陣溫暖，回復 ${heal} HP。` };
          } else {
            return { desc: '祭壇沉默了，神靈沒有回應。金幣消失在光芒中。' };
          }
        }
      },
      { label: '用鮮血獻祭（損失 20% HP）',
        resolve(G) {
          const cost = Math.floor(G.stats.maxHp * 0.2);
          G.stats.hp = Math.max(1, G.stats.hp - cost);
          const buff = Math.floor(Math.random() * 3);
          const buffs = [
            () => { G.stats.def += 3; G.stats.mdef += 3; return 'DEF 和 MDEF 永久 +3。'; },
            () => { G.statPoints = (G.statPoints||0) + 1; return '獲得 1 個屬性點。'; },
            () => { G.skillPoints = (G.skillPoints||0) + 1; return '獲得 1 個技能點。'; },
          ];
          const result = buffs[buff]();
          return { desc: `祭壇貪婪地飲下你的鮮血，給予回報——${result}` };
        }
      },
      { label: '離開，不理會', resolve(G) { return { desc: '謹慎是種美德，你繞開了祭壇繼續前行。' }; } },
    ]
  },
  {
    id: 'mysterious_book',
    title: '📜 古舊卷軸',
    mapFilter: null, weight: 4,
    type: 'choice',
    desc: '地上有一卷散落的羊皮紙，上面寫著密密麻麻的文字，其中一段清晰可辨。',
    choices: [
      { label: '仔細研讀',
        resolve(G) {
          G.xp += 40;
          checkLevelUp();
          return { desc: '你花了一些時間研讀，從中領悟到一些道理，獲得 40 XP。' };
        }
      },
      { label: '撕下帶走',
        resolve(G) {
          const r = Math.random();
          if (r < 0.5) {
            addToBag('hp_pot');
            return { desc: '卷軸的一角寫著一個秘方，你把它記下來並找到了材料，獲得一瓶HP藥水。' };
          } else {
            const dmg = Math.floor(G.stats.maxHp * 0.08);
            G.stats.hp = Math.max(1, G.stats.hp - dmg);
            return { desc: `卷軸上有詛咒！你的手指有些灼傷，損失 ${dmg} HP。` };
          }
        }
      },
      { label: '燒掉它', resolve(G) { return { desc: '有些知識不該存在。你點火燒掉了卷軸，它在火焰中發出奇怪的綠色光芒。' }; } },
    ]
  },

  // ── 荒野/草原 事件 ──
  {
    id: 'wild_beast_lair',
    title: '🐾 野獸巢穴',
    mapFilter: ['plains','snowmnt'], weight: 7,
    type: 'choice',
    desc: '你發現一個廢棄的野獸巢穴，裡面散落著一些東西。',
    choices: [
      { label: '搜刮巢穴',
        resolve(G) {
          const r = Math.random();
          if (r < 0.6) {
            const gold = 15 + Math.floor(Math.random() * 25);
            G.gold += gold;
            return { desc: `你在巢穴角落找到了 ${gold} 金幣——不知道野獸從哪裡搶來的。` };
          } else {
            const dmg = Math.floor(G.stats.maxHp * 0.15);
            G.stats.hp = Math.max(1, G.stats.hp - dmg);
            return { desc: `巢穴主人回來了！你倉皇逃跑，被抓傷，損失 ${dmg} HP。` };
          }
        }
      },
      { label: '放置食物引誘野獸（用一個背包物品）',
        resolve(G) {
          const consumables = G.bag.map((e,i)=>({e,i})).filter(({e})=>typeof e==='string');
          if (!consumables.length) return { desc: '你沒有可以用的物品。' };
          const {i} = consumables[0];
          G.bag.splice(i,1);
          G.xp += 25;
          return { desc: '你用物品引走了野獸，趁機搜刮了巢穴，獲得 25 XP。' };
        }
      },
      { label: '繞道而行', resolve(G) { return { desc: '不值得冒這個險，你繞開了巢穴。' }; } },
    ]
  },
  {
    id: 'storm',
    title: '⛈️ 暴風來襲',
    mapFilter: ['plains','snowmnt'], weight: 5,
    type: 'choice',
    desc: '天色突然黑暗，一場暴風說來就來。閃電劈在附近的樹上，雨水拍打著你的盔甲。',
    choices: [
      { label: '尋找掩護躲避',
        resolve(G) {
          const r = Math.random();
          if (r < 0.5) {
            const heal = Math.floor(G.stats.maxHp * 0.15);
            G.stats.hp = Math.min(G.stats.maxHp, G.stats.hp + heal);
            return { desc: `你找到一個岩石洞穴，在裡面休息了一會兒，HP 回復 ${heal}。` };
          } else {
            return { desc: '你找到遮蔽，暴風吹了一段時間後平息。有驚無險。' };
          }
        }
      },
      { label: '硬撐著繼續前進',
        resolve(G) {
          const dmg = Math.floor(G.stats.maxHp * 0.1);
          G.stats.hp = Math.max(1, G.stats.hp - dmg);
          G.xp += 20;
          return { desc: `你在暴風中硬是前行，雖然損失了 ${dmg} HP，但意志得到磨練，獲得 20 XP。` };
        }
      },
    ]
  },

  // ── 洞穴/廢墟 事件 ──
  {
    id: 'ancient_ruins',
    title: '🏚️ 遺跡碑文',
    mapFilter: ['ruins','cave','temple'], weight: 7,
    type: 'choice',
    desc: '牆上刻著古老的碑文，雖然文字陌生，但你能感受到其中蘊含的力量。',
    choices: [
      { label: '觸摸碑文，感受力量',
        resolve(G) {
          const r = Math.random();
          const outcomes = [
            () => { G.stats.maxHp += 10; G.stats.hp = Math.min(G.stats.maxHp, G.stats.hp + 10); return 'MaxHP 永久 +10。'; },
            () => { G.stats.atk  += 2; return 'ATK 永久 +2。'; },
            () => { G.stats.matk += 2; return 'MATK 永久 +2。'; },
            () => { G.stats.def  += 2; return 'DEF 永久 +2。'; },
            () => { const d = Math.floor(G.stats.maxHp*0.12); G.stats.hp=Math.max(1,G.stats.hp-d); return `詛咒反噬！損失 ${d} HP。`; },
          ];
          const result = outcomes[Math.floor(Math.random()*outcomes.length)]();
          return { desc: `碑文發出微光，你感到一股力量流入體內——${result}` };
        }
      },
      { label: '抄錄碑文研究',
        resolve(G) { G.xp += 50; checkLevelUp(); return { desc: '你花時間仔細抄錄，雖然費時，但獲得了知識，+50 XP。' }; }
      },
      { label: '不理會繼續探索', resolve(G) { return { desc: '謹慎是美德，你繼續前行。' }; } },
    ]
  },
  {
    id: 'trapped_adventurer',
    title: '🧗 受困冒險者',
    mapFilter: ['cave','ruins'], weight: 6,
    type: 'choice',
    desc: '你聽到微弱的求救聲，循聲找到一個被落石困住的冒險者，他傷得不輕。',
    choices: [
      { label: '花力氣幫他脫困（損失 10% HP）',
        resolve(G) {
          const cost = Math.floor(G.stats.maxHp * 0.1);
          G.stats.hp = Math.max(1, G.stats.hp - cost);
          const r = Math.random();
          if (r < 0.7) {
            const gold = 30 + Math.floor(Math.random() * 50);
            G.gold += gold;
            return { desc: `冒險者千恩萬謝，把身上僅剩的 ${gold} 金幣塞給你。「這是我全部的謝禮。」` };
          } else {
            addToBag('hp_pot');
            return { desc: '冒險者從背包裡翻出一瓶藥水遞給你。「拿著，這是我最後的存糧。」' };
          }
        }
      },
      { label: '給他一個藥水然後離開',
        resolve(G) {
          const idx = G.bag.indexOf('hp_pot');
          if (idx === -1) return { desc: '你沒有藥水，對他抱歉地搖搖頭，他苦笑著接受了。' };
          G.bag.splice(idx, 1);
          G.xp += 30;
          return { desc: '你給了他一瓶藥水，繼續前行，獲得 30 XP。對了，做好事總是有好報的。' };
        }
      },
      { label: '無視他繼續前行',
        resolve(G) {
          const r = Math.random();
          if (r < 0.3) {
            const dmg = Math.floor(G.stats.maxHp * 0.08);
            G.stats.hp = Math.max(1, G.stats.hp - dmg);
            return { desc: `良心不安讓你分了神，沒注意腳下而絆倒，損失 ${dmg} HP。` };
          }
          return { desc: '你硬下心腸，繼續前行。有些事情，你寧願忘記。' };
        }
      },
    ]
  },
  {
    id: 'goblin_gamble',
    title: '🎲 地精賭局',
    mapFilter: ['ruins','cave'], weight: 4,
    type: 'choice',
    desc: '一隻地精蹲在角落，面前擺著三個骰子。「來，來玩一局，賭注輕，彩頭大！」',
    choices: [
      { label: '賭 30 金（猜大或小）',
        resolve(G) {
          if (G.gold < 30) return { desc: '「沒錢別湊熱鬧。」地精把你轟走了。' };
          G.gold -= 30;
          const roll = Math.floor(Math.random() * 6) + 1;
          const win  = roll >= 4;
          if (win) { G.gold += 80; return { desc: `骰子落定：${roll}！你贏了！地精嘟嘟囔囔地付給你 80 金。` }; }
          return { desc: `骰子落定：${roll}。地精咧嘴一笑，把你的金幣收走。` };
        }
      },
      { label: '作弊！（需要 SPD 足夠高）',
        resolve(G) {
          const canCheat = G.stats.spd >= 10;
          if (canCheat) {
            const gold = 40 + Math.floor(Math.random() * 40);
            G.gold += gold;
            return { desc: `你的手速夠快，神不知鬼不覺地換了骰子，贏走了 ${gold} 金。地精抓頭百思不解。` };
          } else {
            const dmg = Math.floor(G.stats.maxHp * 0.12);
            G.stats.hp = Math.max(1, G.stats.hp - dmg);
            return { desc: `手速不夠快，被地精抓包了！你被揍了一頓，損失 ${dmg} HP。` };
          }
        }
      },
      { label: '拒絕，繼續前進', resolve(G) { return { desc: '你搖搖頭，地精聳聳肩繼續蹲著。' }; } },
    ]
  },

  // ── 沼澤/毒性 事件 ──
  {
    id: 'toxic_fog',
    title: '☠️ 毒霧地帶',
    mapFilter: ['swamp'], weight: 10,
    type: 'choice',
    desc: '濃重的黃色毒霧瀰漫在前方，幾乎遮住了視線，隱約能聞到刺鼻的氣味。',
    choices: [
      { label: '屏住呼吸硬闖',
        resolve(G) {
          if (G.stats.def >= 12) {
            return { desc: '你的防禦足夠高，毒霧沒有對你造成明顯影響。' };
          }
          const dmg = Math.floor(G.stats.maxHp * 0.18);
          G.stats.hp = Math.max(1, G.stats.hp - dmg);
          combat.playerPoisoned = true;
          return { desc: `毒霧侵入你的肺部，損失 ${dmg} HP 並中毒！` };
        }
      },
      { label: '使用解毒劑再前進',
        resolve(G) {
          const idx = G.bag.indexOf('antidote');
          if (idx === -1) return { desc: '你沒有解毒劑，只能嘗試硬闖。毒霧讓你的眼睛刺痛。' };
          G.bag.splice(idx, 1);
          return { desc: '你喝下解毒劑再前行，毒霧雖濃，但對你沒有造成傷害。' };
        }
      },
      { label: '繞遠路避開（損失機會）',
        resolve(G) {
          G.xp = Math.max(0, G.xp - 10);
          return { desc: '你繞了很遠的路，多花了不少時間，但安全通過。-10 XP。' };
        }
      },
    ]
  },
  {
    id: 'corruption_pool',
    title: '🌑 詛咒深潭',
    mapFilter: ['swamp','temple'], weight: 5,
    type: 'choice',
    desc: '一個散發著黑色光芒的深潭橫在路中央，水面平靜得詭異，能看到水底的金幣。',
    choices: [
      { label: '伸手撈取金幣',
        resolve(G) {
          const r = Math.random();
          if (r < 0.4) {
            const gold = 50 + Math.floor(Math.random() * 50);
            G.gold += gold;
            return { desc: `你成功撈出了 ${gold} 金幣，什麼壞事都沒發生……但你的手指有一點點麻。` };
          } else {
            const dmg = Math.floor(G.stats.maxHp * 0.2);
            G.stats.hp = Math.max(1, G.stats.hp - dmg);
            combat.playerPoisoned = true;
            return { desc: `詛咒！黑水沿著你的手蔓延，損失 ${dmg} HP 並中毒！金幣也消失了。` };
          }
        }
      },
      { label: '向深潭祈禱',
        resolve(G) {
          const r = Math.random();
          if (r < 0.3) {
            G.stats.mdef += 3;
            return { desc: '深潭似乎回應了你的祈禱，黑光凝成符文烙在你的手背上，MDEF 永久 +3。' };
          }
          return { desc: '深潭沉默不語，你的祈禱消散在空氣中。' };
        }
      },
      { label: '繞開，絕對不碰那個東西', resolve(G) { return { desc: '明智的決定。你繞開了那個詭異的深潭。' }; } },
    ]
  },

  // ── 火山/冰山 事件 ──
  {
    id: 'lava_vent',
    title: '🌋 熔岩噴口',
    mapFilter: ['volcano'], weight: 8,
    type: 'choice',
    desc: '地面裂縫中噴出高溫蒸汽，一個熔岩噴口就在你腳邊，能感受到難以忍受的熱浪。',
    choices: [
      { label: '跳過去（需要 SPD ≥ 8）',
        resolve(G) {
          if (G.stats.spd >= 8) {
            return { desc: '你快速起跳，飛越了裂縫，裙邊燒焦了一點但人沒事。' };
          }
          const dmg = Math.floor(G.stats.maxHp * 0.15);
          G.stats.hp = Math.max(1, G.stats.hp - dmg);
          return { desc: `速度不夠！你勉強跳過但被熔岩灼傷，損失 ${dmg} HP。` };
        }
      },
      { label: '用盾牌擋住熱浪硬衝（需要 DEF ≥ 10）',
        resolve(G) {
          if (G.stats.def >= 10) {
            const bonus = 20 + Math.floor(Math.random() * 20);
            G.gold += bonus;
            return { desc: `你用盾牌護住自己衝過去，還在裂縫邊找到了一塊熔岩結晶，換得 ${bonus} 金。` };
          }
          const dmg = Math.floor(G.stats.maxHp * 0.2);
          G.stats.hp = Math.max(1, G.stats.hp - dmg);
          return { desc: `防禦不夠！你被熱浪燒傷，損失 ${dmg} HP。` };
        }
      },
      { label: '繞遠路慢慢過', resolve(G) { return { desc: '小心翼翼繞過熔岩噴口，沒有受傷。慢但安全。' }; } },
    ]
  },
  {
    id: 'blizzard',
    title: '❄️ 暴雪困境',
    mapFilter: ['snowmnt'], weight: 8,
    type: 'choice',
    desc: '一場突如其來的暴雪幾乎遮蔽了視線，氣溫急劇下降，你的四肢開始僵硬。',
    choices: [
      { label: '生火取暖（消耗物品）',
        resolve(G) {
          const idx = G.bag.findIndex(e => typeof e === 'string');
          if (idx === -1) return { desc: '你沒有任何可以燃燒的東西，只能硬撐著等暴雪過去。' };
          G.bag.splice(idx, 1);
          const heal = Math.floor(G.stats.maxHp * 0.2);
          G.stats.hp = Math.min(G.stats.maxHp, G.stats.hp + heal);
          return { desc: `你用物品引火取暖，在火堆旁休息了一會兒，回復 ${heal} HP。` };
        }
      },
      { label: '硬撐前行',
        resolve(G) {
          const dmg = Math.floor(G.stats.maxHp * 0.15);
          G.stats.hp = Math.max(1, G.stats.hp - dmg);
          combat.playerFrozen = true;
          return { desc: `嚴寒侵入骨髓，損失 ${dmg} HP 並被凍結！下回合骰子固定為 DEF。` };
        }
      },
      { label: '找地方躲避等待暴雪過去',
        resolve(G) {
          G.stats.mp = Math.min(G.stats.maxMp, G.stats.mp + Math.floor(G.stats.maxMp * 0.4));
          return { desc: '你找到一個背風的岩壁躲避，利用等待的時間冥想恢復，MP 回復 40%。' };
        }
      },
    ]
  },

  // ── 神殿 事件 ──
  {
    id: 'divine_trial',
    title: '⚡ 神靈試煉',
    mapFilter: ['temple'], weight: 8,
    type: 'choice',
    desc: '一道金光從頭頂照下，空氣中傳來莊嚴的聲音：「旅人，你選擇什麼？」',
    choices: [
      { label: '「我選擇力量」',
        resolve(G) {
          G.stats.atk += 3; G.stats.def += 3;
          return { desc: '金光凝聚在你的手臂上，ATK 和 DEF 永久各 +3。' };
        }
      },
      { label: '「我選擇智慧」',
        resolve(G) {
          G.stats.matk += 3; G.stats.mdef += 3;
          return { desc: '金光凝聚在你的眉心，MATK 和 MDEF 永久各 +3。' };
        }
      },
      { label: '「我選擇生命」',
        resolve(G) {
          G.stats.maxHp += 30; G.stats.hp = Math.min(G.stats.maxHp, G.stats.hp + 30);
          G.stats.maxMp += 15; G.stats.mp = Math.min(G.stats.maxMp, G.stats.mp + 15);
          return { desc: '金光溫柔地包裹住你，MaxHP +30、MaxMP +15。' };
        }
      },
    ]
  },
];
