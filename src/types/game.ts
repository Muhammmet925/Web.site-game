export enum TileType {
  AIR = 0,
  DIRT = 1,
  GRASS_DIRT = 2,
  STONE = 3,
  ASH_ROCK = 4,
  WOOD_PLANK = 5,
  WOOD_WALL = 6,
  COPPER_ORE = 7,
  SILVER_ORE = 8,
  EMBER_CRYSTAL = 9,
  OBSIDIAN = 10,
  ANCIENT_BRICK = 11,
  TORCH = 12,
  EMBER_BRAZIER = 13,
  PLATFORM = 14,
  LEAVES = 15,
  WOOD_TRUNK = 16,
}

export enum LayerZone {
  SURFACE = 'SURFACE',         // Ori-style ruins, lush ash-flora, windy ridges
  UNDERGROUND = 'UNDERGROUND', // Terraria-style caves, ore veins, diggable labyrinth
  DEEP_RUINS = 'DEEP_RUINS',   // Hollow Knight-style dark gothic ruins & boss arena
}

export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'weapon' | 'tool' | 'placeable' | 'material' | 'consumable' | 'artifact';
  tileType?: TileType;
  damage?: number;
  miningPower?: number;
  stack: number;
  maxStack: number;
  value?: number;
}

export interface CraftingRecipe {
  id: string;
  result: Item;
  ingredients: { itemId: string; count: number }[];
  stationRequired?: 'none' | 'forge' | 'alchemy';
  description: string;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  ash: number;        // Metroidvania SOUL/energy resource
  maxAsh: number;
  attackPower: number;
  defense: number;
  miningSpeed: number;
  hasDoubleJump: boolean;
  hasWallClimb: boolean;
  hasDash: boolean;
  hasWings: boolean;
  unlockedLoreIds: string[];
}

export interface LoreEntry {
  id: string;
  title: string;
  author: string;
  zone: LayerZone;
  text: string;
  dateStr: string;
}

export interface NPCData {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar: string;
  x: number;
  y: number;
  settled: boolean;
  dialogue: string[];
  shopItems?: { item: Item; costItem: string; costCount: number }[];
  speechBubble?: {
    text: string;
    timer: number;
    maxTimer: number;
  };
}

export interface Enemy {
  id: string;
  type: 'crawler' | 'wraith' | 'stinger' | 'brute' | 'storm_phantom' | 'boss_ignis';
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  damage: number;
  isGrounded: boolean;
  facing: -1 | 1;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'stagger' | 'boss_phase1' | 'boss_phase2' | 'boss_slam';
  attackCooldown: number;
  staggerTimer: number;
  inLightArea: boolean; // weakened when in player's ignited light!
  patrolTimer?: number;
  alertTimer?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  color: string;
  fromPlayer: boolean;
  lifetime: number;
  piercing?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  glow?: boolean;
  kind?: 'spark' | 'cave_dust' | 'water_drip' | 'crystal_sparkle' | 'ash' | 'ember' | 'leaf' | 'firefly';
  splashOnGround?: boolean;
}

export interface LightSource {
  x: number; // world tile or world pixel
  y: number;
  radius: number;
  intensity: number;
  color: string;
  flicker?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'exploration' | 'mining' | 'combat' | 'building' | 'purification';
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface SaveSlotMeta {
  id: string;              // 'slot_1', 'slot_2', 'slot_3'
  name: string;            // 'Slot 1', 'Slot 2', 'Slot 3'
  savedAt: string | null;  // Formatted date or null if empty
  zone: string;
  hp: number;
  maxHp: number;
  ash: number;
  maxAsh: number;
  purificationPercent: number;
  playTimeMinutes: number;
  exists: boolean;
}

export interface SaveSlotData {
  meta: SaveSlotMeta;
  playerStats: PlayerStats;
  inventory: Item[];
  x: number;
  y: number;
  purifiedMap: number[];
  lightMap: number[];
  foliageMap?: number[];
  tiles?: number[];
  wallTiles?: number[];
  achievements?: Record<string, { unlocked: boolean; unlockedAt?: string }>;
  skills?: Record<string, boolean>;
  ambientTime?: number;
}

export interface SkillNode {
  id: string;
  name: string;
  category: 'mining' | 'agility' | 'vitality' | 'sorcery';
  tier: number;
  description: string;
  icon: string;
  cost: {
    ash: number;
    items?: { itemId: string; count: number }[];
  };
  requires?: string[];
  unlocked: boolean;
  effect: {
    miningSpeedMultiplier?: number;
    jumpPowerBoost?: number;
    maxHpBoost?: number;
    maxAshBoost?: number;
    attackDamageBoost?: number;
  };
}

export interface WorldData {
  width: number;
  height: number;
  tiles: Uint8Array;
  wallTiles: Uint8Array;
  lightMap: Uint8Array;       // 0 to 100 brightness
  purifiedMap: Uint8Array;    // 1 if permanently purified by light, 0 otherwise
  foliageMap: Uint8Array;     // 0: none, 1: sprouts, 2: lush grass, 3: ember flower, 4: luminescent spore
  ambientTime: number;        // 0 to 2400 (day-night cycle)
  isAshStorm: boolean;
  ashStormIntensity: number;
  stormDuration: number;
}
