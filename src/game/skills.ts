import { SkillNode } from '../types/game';

export const SKILL_TREE_NODES: SkillNode[] = [
  // MADENCİLİK (MINING)
  {
    id: 'faster_mining_1',
    name: 'Hızlı Kazma I',
    category: 'mining',
    tier: 1,
    description: 'Kazma hızını %25 artırır. Blokları ve yüzey taşlarını çok daha seri kırmanızı sağlar.',
    icon: '⛏️',
    cost: {
      ash: 50,
      items: [{ itemId: 'raw_stone', count: 10 }],
    },
    unlocked: false,
    effect: {
      miningSpeedMultiplier: 0.25,
    },
  },
  {
    id: 'faster_mining_2',
    name: 'Maden Rezonansı II',
    category: 'mining',
    tier: 2,
    description: 'Kazma hızını %40 daha artırır. Bakır ve gümüş gibi sert madenleri saniyeler içinde söker.',
    icon: '⚡',
    cost: {
      ash: 120,
      items: [{ itemId: 'copper_ore', count: 6 }],
    },
    requires: ['faster_mining_1'],
    unlocked: false,
    effect: {
      miningSpeedMultiplier: 0.40,
    },
  },
  {
    id: 'crystal_extractor',
    name: 'Kristal Uzmanı III',
    category: 'mining',
    tier: 3,
    description: 'Kazılan her nadir cevherden fazladan kor enerjisi ve dayanıklılık elde edilir.',
    icon: '💎',
    cost: {
      ash: 220,
      items: [{ itemId: 'ember_crystal', count: 3 }],
    },
    requires: ['faster_mining_2'],
    unlocked: false,
    effect: {
      miningSpeedMultiplier: 0.50,
    },
  },

  // ÇEVİKLİK (AGILITY)
  {
    id: 'high_jump_1',
    name: 'Hafif Kül Adımları',
    category: 'agility',
    tier: 1,
    description: 'Zıplama yüksekliğini %22 artırır. Uçurumlardan ve yüksek kaya çıkıntılarından kolayca aşın.',
    icon: '🪶',
    cost: {
      ash: 60,
      items: [{ itemId: 'ember_shard', count: 5 }],
    },
    unlocked: false,
    effect: {
      jumpPowerBoost: 0.22,
    },
  },
  {
    id: 'high_jump_2',
    name: 'Rüzgar Kanatları',
    category: 'agility',
    tier: 2,
    description: 'Zıplama gücünü %35 daha artırır. Havada inanılmaz bir yükseliş ve manevra kazandırır.',
    icon: '🌪️',
    cost: {
      ash: 150,
      items: [{ itemId: 'silver_ore', count: 6 }],
    },
    requires: ['high_jump_1'],
    unlocked: false,
    effect: {
      jumpPowerBoost: 0.35,
    },
  },

  // YAŞAM (VITALITY)
  {
    id: 'extra_health_1',
    name: 'Kaya Zırhı',
    category: 'vitality',
    tier: 1,
    description: 'Maksimum canı +20 artırır (1 tam kalp maskesi) ve canınızı anında tazeler.',
    icon: '🛡️',
    cost: {
      ash: 70,
      items: [{ itemId: 'raw_stone', count: 12 }],
    },
    unlocked: false,
    effect: {
      maxHpBoost: 20,
    },
  },
  {
    id: 'extra_health_2',
    name: 'Kadim Obsidyen Kalp',
    category: 'vitality',
    tier: 2,
    description: 'Maksimum canı fazladan +30 artırır. En derin mağara bosslarına karşı muazzam direnç sağlar.',
    icon: '🖤',
    cost: {
      ash: 190,
      items: [{ itemId: 'ember_crystal', count: 4 }],
    },
    requires: ['extra_health_1'],
    unlocked: false,
    effect: {
      maxHpBoost: 30,
    },
  },

  // ALEV & RUH (SORCERY & ASH)
  {
    id: 'ash_reserve',
    name: 'Genişletilmiş Kül Damarı',
    category: 'sorcery',
    tier: 1,
    description: 'Maksimum Kül (Soul) enerjisini +40 artırır. İyileşme ve büyü için daha fazla enerji depolar.',
    icon: '🔮',
    cost: {
      ash: 80,
      items: [{ itemId: 'ash_flora', count: 5 }],
    },
    unlocked: false,
    effect: {
      maxAshBoost: 40,
    },
  },
  {
    id: 'ember_blade',
    name: 'Alev Bileme',
    category: 'sorcery',
    tier: 2,
    description: 'Kılıç vuruşlarının temel saldırı hasarını kalıcı olarak +4 artırır.',
    icon: '🔥',
    cost: {
      ash: 130,
      items: [{ itemId: 'copper_ore', count: 8 }],
    },
    requires: ['ash_reserve'],
    unlocked: false,
    effect: {
      attackDamageBoost: 4,
    },
  },
];
