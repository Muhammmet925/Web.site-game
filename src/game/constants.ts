import { Achievement, CraftingRecipe, Item, LoreEntry, NPCData, TileType } from '../types/game';

export const TILE_SIZE = 24; // 24px per tile for detailed crisp HD pixel metroidvania feel
export const WORLD_WIDTH = 320; // Expanded map: 320 tiles wide = 7680px
export const WORLD_HEIGHT = 220; // Expanded map: 220 tiles high = 5280px

// Depth layers
export const SURFACE_TOP = 0;
export const SURFACE_BOTTOM = 70; // 0 to 70: Surface (Ruins, Cliffs, Ancient Trees, Sunlight)
export const UNDERGROUND_BOTTOM = 150; // 70 to 150: Underground Caves & Mines
export const DEEP_RUINS_BOTTOM = 220; // 150 to 220: Deep Ruins (Gothic spires, Boss Arena)

// Physics
export const GRAVITY = 0.52;
export const MOVE_SPEED = 4.2;
export const JUMP_FORCE = -9.8;
export const DOUBLE_JUMP_FORCE = -8.5;
export const DASH_SPEED = 12.5;
export const DASH_DURATION = 14; // frames
export const DASH_COOLDOWN = 32; // frames
export const WALL_SLIDE_SPEED = 1.6;
export const WALL_JUMP_X = 6.8;
export const WALL_JUMP_Y = -9.2;
export const POGO_BOUNCE_FORCE = -9.2;
export const PARRY_WINDOW_FRAMES = 12;

// Starting inventory
export const DEFAULT_ITEMS: Item[] = [
  {
    id: 'ignis_blade',
    name: 'Kül Kılıcı (Ash Blade)',
    description: 'Alevdoğan demircilerinin dövdüğü paslanmaz hançer. Düşmanları keserken Kül enerjisi toplar.',
    icon: '⚔️',
    type: 'weapon',
    damage: 18,
    stack: 1,
    maxStack: 1,
  },
  {
    id: 'ember_pickaxe',
    name: 'Köz Kazma (Ember Pickaxe)',
    description: 'Toprağı, taşı ve gizli madenleri kazmak için dayanıklı kazma.',
    icon: '⛏️',
    type: 'tool',
    miningPower: 25,
    stack: 1,
    maxStack: 1,
  },
  {
    id: 'ember_torch',
    name: 'Köz Meşalesi',
    description: 'Kalıcı ışık saçar. Yerleştirildiğinde karanlığı geri iter ve bölgeyi arındırır.',
    icon: '🔥',
    type: 'placeable',
    tileType: TileType.TORCH,
    stack: 12,
    maxStack: 99,
  },
  {
    id: 'wood_plank',
    name: 'Kül Ağacı Kerestesi',
    description: 'Sığınak ve ev inşa etmek için blok.',
    icon: '🪵',
    type: 'placeable',
    tileType: TileType.WOOD_PLANK,
    stack: 25,
    maxStack: 99,
  },
];

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'craft_torch',
    result: {
      id: 'ember_torch',
      name: 'Köz Meşalesi (x4)',
      description: 'Kalıcı ışık saçar. Karanlığı geri püskürtür.',
      icon: '🔥',
      type: 'placeable',
      tileType: TileType.TORCH,
      stack: 4,
      maxStack: 99,
    },
    ingredients: [
      { itemId: 'ash_wood', count: 1 },
      { itemId: 'ember_shard', count: 1 },
    ],
    description: 'Karanlığı yaran kalıcı ışık kaynağı.',
  },
  {
    id: 'craft_wood_wall',
    result: {
      id: 'wood_wall',
      name: 'Ahşap Duvar (x4)',
      description: 'NPC sığınakları için arka plan duvarı.',
      icon: '🧱',
      type: 'placeable',
      tileType: TileType.WOOD_WALL,
      stack: 4,
      maxStack: 99,
    },
    ingredients: [{ itemId: 'ash_wood', count: 1 }],
    description: 'Güvenli bir sığınak kurmak için temel arka duvar.',
  },
  {
    id: 'craft_stone_block',
    result: {
      id: 'stone_block',
      name: 'İşlenmiş Taş Blok (x4)',
      description: 'Dayanıklı kale ve korugan bloğu.',
      icon: '🪨',
      type: 'placeable',
      tileType: TileType.STONE,
      stack: 4,
      maxStack: 99,
    },
    ingredients: [{ itemId: 'raw_stone', count: 4 }],
    description: 'Sağlam koruyucu taş duvarlar için.',
  },
  {
    id: 'craft_platform',
    result: {
      id: 'wood_platform',
      name: 'Ahşap Platform (x4)',
      description: 'Üzerine basılabilen ve aşağı inilebilen platform.',
      icon: '🪜',
      type: 'placeable',
      tileType: TileType.PLATFORM,
      stack: 4,
      maxStack: 99,
    },
    ingredients: [{ itemId: 'ash_wood', count: 1 }],
    description: 'Katlar arası geçiş sağlayan platform.',
  },
  {
    id: 'craft_copper_sword',
    result: {
      id: 'copper_blade',
      name: 'Bakır Alev Kılıcı',
      description: 'Daha sert vuruş ve geniş menzilli kılıç (Hasar: 28).',
      icon: '🗡️',
      type: 'weapon',
      damage: 28,
      stack: 1,
      maxStack: 1,
    },
    ingredients: [
      { itemId: 'copper_ore', count: 8 },
      { itemId: 'ash_wood', count: 4 },
    ],
    description: 'Daha yüksek hasar veren dövülmüş bakır kılıç.',
  },
  {
    id: 'craft_silver_pickaxe',
    result: {
      id: 'silver_pickaxe',
      name: 'Gümüş Kazma',
      description: 'Obsidyen ve antik tuğlaları daha hızlı parçalar (Kazma Gücü: 55).',
      icon: '⛏️',
      type: 'tool',
      miningPower: 55,
      stack: 1,
      maxStack: 1,
    },
    ingredients: [
      { itemId: 'silver_ore', count: 10 },
      { itemId: 'ash_wood', count: 4 },
    ],
    description: 'Sert madenleri kolayca parçalayan kazma.',
  },
  {
    id: 'craft_light_beacon',
    result: {
      id: 'light_beacon',
      name: 'Kadim Işık Ocağı (Ancient Brazier)',
      description: 'Devasa bir alana kalıcı arındırıcı ışık yayar. Canavarları püskürtür.',
      icon: '✨',
      type: 'placeable',
      tileType: TileType.EMBER_BRAZIER,
      stack: 1,
      maxStack: 5,
    },
    ingredients: [
      { itemId: 'raw_stone', count: 15 },
      { itemId: 'copper_ore', count: 4 },
      { itemId: 'ember_shard', count: 6 },
    ],
    description: 'Tüm bir köyü veya mağarayı aydınlatan dev fener.',
  },
  {
    id: 'craft_elixir',
    result: {
      id: 'healing_elixir',
      name: 'Köz Özü İksiri (x2)',
      description: 'Sağlığı 50 puan yeniler.',
      icon: '🧪',
      type: 'consumable',
      stack: 2,
      maxStack: 10,
    },
    ingredients: [
      { itemId: 'ember_shard', count: 2 },
      { itemId: 'ash_flora', count: 3 },
    ],
    description: 'Yaraları saran saf köz esansı.',
  },
  {
    id: 'craft_obsidian_mask',
    result: {
      id: 'obsidian_mask',
      name: 'Kadim Kül Maskesi',
      description: 'Hollow Knight esintili koruyucu maske. Can haznesini güçlendirir.',
      icon: '🎭',
      type: 'consumable',
      stack: 1,
      maxStack: 1,
    },
    ingredients: [
      { itemId: 'silver_ore', count: 8 },
      { itemId: 'ember_crystal', count: 4 },
      { itemId: 'ash_wood', count: 6 },
    ],
    description: 'Derin harabelerden dövülen efsanevi maske.',
  },
  {
    id: 'craft_sun_talisman',
    result: {
      id: 'sun_talisman',
      name: 'Ebedi Güneş Tılsımı',
      description: 'Karanlığı kökünden yırtan kadim fener kalıntısı.',
      icon: '☀️',
      type: 'placeable',
      tileType: TileType.EMBER_BRAZIER,
      stack: 1,
      maxStack: 1,
    },
    ingredients: [
      { itemId: 'copper_ore', count: 12 },
      { itemId: 'silver_ore', count: 8 },
      { itemId: 'ember_crystal', count: 6 },
    ],
    description: 'Ignis efsanesini taşıyan devasa ışık ocağı.',
  },
];

export const LORE_ENTRIES: LoreEntry[] = [
  {
    id: 'lore_1',
    title: 'Alevdoğanların Düşüşü',
    author: 'Kayıp Katip',
    zone: 'SURFACE' as any,
    text: 'Güneşi göğe biz asmıştık. Lakin kibirimiz, ateşin köklerini dahi yakıp kül etti. Artık yeryüzü sönmüş bir ocaktan farksız. Yalnızca bir kıvılcım arıyoruz... son bir can.',
    dateStr: 'Işık Çağı: 140. Yıl',
  },
  {
    id: 'lore_2',
    title: 'Toprağın Kalbindeki Nabız',
    author: 'Derin Kazıcı Boran',
    zone: 'UNDERGROUND' as any,
    text: 'Derinlere indikçe taşların uğultusunu duyarsınız. Kristaller sadece maden değildir; onlar Alevdoğanların donmuş nefesidir. Işığı getirdiğinizde uyanırlar.',
    dateStr: 'Karanlık Çağı: 32. Yıl',
  },
  {
    id: 'lore_3',
    title: 'Kül Muhafızı: Ignis',
    author: 'Tapınak Arşivcisi',
    zone: 'DEEP_RUINS' as any,
    text: 'Ignis şehri terk etmeyi reddetti. "Ateş bittiyse gölge olurum" dedi. O şimdi en karanlık salonların bekçisi. Onu özgür kılmak, onun son alevini almakla mümkündür.',
    dateStr: 'Büyük Çöküş',
  },
];

export const INITIAL_NPCS: NPCData[] = [
  {
    id: 'npc_smith',
    name: 'Boran',
    title: 'Köz Demircisi',
    description: 'Kül dağlarının kadim madenlerini döven son usta.',
    avatar: '🔨',
    x: 42,
    y: 45,
    settled: false,
    dialogue: [
      'Gözlerindeki o kıvılcım... Alevdoğan kanı taşıyorsun evlat.',
      'Bana güvenli, ışık alan bir sığınak kurarsan sana bu toprakların en keskin aletlerini döverim.',
      'Karanlıkta çalışılmaz; meşaleni yak, gölgeleri geri püskürt!',
    ],
  },
  {
    id: 'npc_herbalist',
    name: 'Kora',
    title: 'Işık Şifacısı',
    description: 'Küllerin arasından filizlenen parlayan floraları toplayan gezgin.',
    avatar: '🌿',
    x: 95,
    y: 43,
    settled: false,
    dialogue: [
      'Işığın değdiği her yerde toprak yeniden nefes alır.',
      'Yaktığın meşalelerin etrafında açan çiçekleri gördün mü? Dünya ölmeyi reddediyor.',
      'Yaralandığında Kül enerjini odakla (H Tuşu) ya da sana kaynattığım iksirleri iç.',
    ],
  },
  {
    id: 'npc_archivist',
    name: 'Selys',
    title: 'Kül Arşivcisi',
    description: 'Yıkılmış krallığın tabletlerini ve sırlarını toplayan bilge.',
    avatar: '📜',
    x: 170,
    y: 46,
    settled: false,
    dialogue: [
      'Hafızan yok mu? Endişelenme. Külyurdu senin eylemlerinle yeniden yazılıyor.',
      'Derin Harabelerde Kadim Muhafız bekliyor. Oraya inmeden önce kanatlarını açmayı öğrenmelisin.',
      'Dünyanın ne kadarını arındırdığını haritandan (M) görebilirsin.',
    ],
  },
];

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_torch',
    title: 'İlk Işık',
    description: 'Dünyaya ilk meşaleni yerleştir ve karanlığı gerilet.',
    category: 'purification',
    icon: '🔥',
    unlocked: false,
  },
  {
    id: 'first_ore',
    title: 'Maden Avcısı',
    description: 'Toprağın altından ilk Bakır veya Gümüş cevherini çıkar.',
    category: 'mining',
    icon: '⛏️',
    unlocked: false,
  },
  {
    id: 'rare_crystal',
    title: 'Közün Kalbi',
    description: 'Nadir ve parıldayan bir Köz Kristali (Ember Crystal) damarı kaz.',
    category: 'mining',
    icon: '💎',
    unlocked: false,
  },
  {
    id: 'first_shelter',
    title: 'İlk Sığınak',
    description: 'Arka duvarları, sağlam tavanı ve ışığı olan korunaklı bir sığınak inşa et.',
    category: 'building',
    icon: '🏠',
    unlocked: false,
  },
  {
    id: 'reach_caverns',
    title: 'Yeraltının Sessizliği',
    description: 'Yeraltı Mağaraları katmanına derin bir kazıyla veya şaftla ulaş.',
    category: 'exploration',
    icon: '🕳️',
    unlocked: false,
  },
  {
    id: 'reach_deep_ruins',
    title: 'Alevdoğan Kalıntıları',
    description: 'En dipteki kadim gotik harabelere ve mezarlara adım at.',
    category: 'exploration',
    icon: '🏛️',
    unlocked: false,
  },
  {
    id: 'first_parry',
    title: 'Kusursuz Zamanlama',
    description: 'Bir düşman atağını kalkanınla tam anında savuştur (Parry).',
    category: 'combat',
    icon: '🛡️',
    unlocked: false,
  },
  {
    id: 'craft_item',
    title: 'Kül Zanaatkarı',
    description: 'Topladığın malzemelerle zanaat menüsünden ilk eşyanı üret.',
    category: 'building',
    icon: '🔨',
    unlocked: false,
  },
  {
    id: 'purifier_10',
    title: 'Işık Saçan',
    description: "Külyurdu kıtasının en az %10'unu kalıcı olarak arındır.",
    category: 'purification',
    icon: '✨',
    unlocked: false,
  },
  {
    id: 'purifier_25',
    title: 'Şafağın Taşıyıcısı',
    description: "Külyurdu kıtasının en az %25'ini kalıcı olarak arındır.",
    category: 'purification',
    icon: '☀️',
    unlocked: false,
  },
  {
    id: 'defeat_boss',
    title: 'Kül Muhafızının Sonu',
    description: "Derin harabelerdeki kadim patron Ignis'i alt et ve Ember Wings kazan.",
    category: 'combat',
    icon: '👑',
    unlocked: false,
  },
  {
    id: 'storm_survivor',
    title: 'Fırtınaya Direnen',
    description: 'Karanlığı yaran vahşi bir Kül Fırtınasını güvenli sığınağında atlat.',
    category: 'exploration',
    icon: '🌪️',
    unlocked: false,
  },
];
