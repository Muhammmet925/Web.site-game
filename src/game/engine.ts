import {
  CRAFTING_RECIPES,
  DASH_COOLDOWN,
  DASH_DURATION,
  DASH_SPEED,
  DEEP_RUINS_BOTTOM,
  DEFAULT_ITEMS,
  DOUBLE_JUMP_FORCE,
  GRAVITY,
  INITIAL_NPCS,
  JUMP_FORCE,
  MOVE_SPEED,
  PARRY_WINDOW_FRAMES,
  POGO_BOUNCE_FORCE,
  SURFACE_BOTTOM,
  TILE_SIZE,
  UNDERGROUND_BOTTOM,
  WALL_JUMP_X,
  WALL_JUMP_Y,
  WALL_SLIDE_SPEED,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  DEFAULT_ACHIEVEMENTS,
} from './constants';
import { audio } from './audio';
import { SKILL_TREE_NODES } from './skills';
import {
  Achievement,
  Enemy,
  Item,
  LayerZone,
  NPCData,
  Particle,
  PlayerStats,
  Projectile,
  SkillNode,
  TileType,
  WorldData,
} from '../types/game';

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  lifetime: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: -1 | 1;
  isGrounded: boolean;
  isOnWall: -1 | 1 | 0;
  isDashing: boolean;
  dashTimer: number;
  dashCooldown: number;
  canDoubleJump: boolean;
  isParrying: boolean;
  parryTimer: number;
  invulnerableTimer: number;
  attackTimer: number;
  attackDirection: 'forward' | 'up' | 'down';
  focusTimer: number;
  isFocusing: boolean;
  selectedHotbarIndex: number;
  inventory: Item[];
  stats: PlayerStats;
  capeAngle: number;
}

export class GameEngine {
  public world: WorldData;
  public player: PlayerState;
  public enemies: Enemy[];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public npcs: NPCData[];
  public activeLoreAlert: string | null = null;
  public bossActive: boolean = false;
  public bossHp: number = 0;
  public bossMaxHp: number = 450;
  public purificationPercent: number = 0;
  public currentZone: LayerZone = LayerZone.SURFACE;
  public localLightIntegrity: number = 100; // 0 to 100%
  public isPlayerInSafeBase: boolean = true;
  public stormTimer: number = 2600; // ticks until next Ash Storm
  public stormDurationRemaining: number = 0;
  public stormExposureTimer: number = 0;
  public foliageGrowthTicker: number = 0;
  public weatherTicker: number = 0;
  public playTimeTicks: number = 0;

  // Achievements system
  public achievements: Record<string, { unlocked: boolean; unlockedAt?: string }> = {};
  public recentAchievement: Achievement | null = null;
  public achievementBannerTimer: number = 0;

  // Camera Shake system (Hollow Knight hit & impact feel)
  public cameraShake: number = 0;

  // Skill Tree system
  public unlockedSkills: Record<string, boolean> = {};

  // Ambient audio timer for environmental sound triggers
  public ambientAudioTicker: number = 0;

  // Day / Night cycle & Global illumination system
  public sunAltitude: number = 1.0;
  public globalIllumination: number = 1.0;
  public isNight: boolean = false;
  public torchRadiusMultiplier: number = 1.0;
  public sunPosition: { x: number; y: number; altitude: number } = { x: 0, y: 0, altitude: 1 };

  // NPC Speech Bubble system
  public activeSpeechBubble: {
    npcId: string;
    text: string;
    npcName: string;
    avatar: string;
    x: number;
    y: number;
    timer: number;
    maxTimer: number;
  } | null = null;

  // Interaction targets
  public hoveredTileX: number = 0;
  public hoveredTileY: number = 0;
  public nearbyNPC: NPCData | null = null;

  public triggerCameraShake(intensity: number = 5) {
    this.cameraShake = Math.max(this.cameraShake, intensity);
  }

  public triggerNPCSpeech(npc: NPCData): string {
    const dialogues = npc.dialogue && npc.dialogue.length > 0 ? npc.dialogue : ['Selam olsun, Kor Taşıyıcısı.'];
    const idx = Math.floor(Math.random() * dialogues.length);
    const text = dialogues[idx];

    this.activeSpeechBubble = {
      npcId: npc.id,
      text,
      npcName: npc.name,
      avatar: npc.avatar,
      x: npc.x * TILE_SIZE,
      y: npc.y * TILE_SIZE,
      timer: 200,
      maxTimer: 200,
    };
    npc.speechBubble = {
      text,
      timer: 200,
      maxTimer: 200,
    };

    audio.playFocusHeal();
    return text;
  }

  constructor(world: WorldData, enemies: Enemy[], spawnX: number, spawnY: number) {
    this.world = world;
    this.enemies = enemies;
    this.npcs = JSON.parse(JSON.stringify(INITIAL_NPCS));

    this.player = {
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      width: 20,
      height: 34,
      facing: 1,
      isGrounded: false,
      isOnWall: 0,
      isDashing: false,
      dashTimer: 0,
      dashCooldown: 0,
      canDoubleJump: true,
      isParrying: false,
      parryTimer: 0,
      invulnerableTimer: 0,
      attackTimer: 0,
      attackDirection: 'forward',
      focusTimer: 0,
      isFocusing: false,
      selectedHotbarIndex: 0,
      inventory: JSON.parse(JSON.stringify(DEFAULT_ITEMS)),
      stats: {
        hp: 5,
        maxHp: 5,
        ash: 40,
        maxAsh: 100,
        attackPower: 18,
        defense: 2,
        miningSpeed: 30,
        hasDoubleJump: true,
        hasWallClimb: true,
        hasDash: true,
        hasWings: false,
        unlockedLoreIds: ['lore_1'],
      },
      capeAngle: 0,
    };

    this.recalculatePurification();
  }

  // === TILE HELPERS ===

  public getTile(x: number, y: number): TileType {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return TileType.OBSIDIAN;
    return this.world.tiles[y * WORLD_WIDTH + x];
  }

  public setTile(x: number, y: number, type: TileType) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return;
    this.world.tiles[y * WORLD_WIDTH + x] = type;
  }

  public getWall(x: number, y: number): TileType {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return TileType.AIR;
    return this.world.wallTiles[y * WORLD_WIDTH + x];
  }

  public isSolidTile(type: TileType): boolean {
    return (
      type === TileType.DIRT ||
      type === TileType.GRASS_DIRT ||
      type === TileType.STONE ||
      type === TileType.ASH_ROCK ||
      type === TileType.WOOD_PLANK ||
      type === TileType.COPPER_ORE ||
      type === TileType.SILVER_ORE ||
      type === TileType.EMBER_CRYSTAL ||
      type === TileType.OBSIDIAN ||
      type === TileType.ANCIENT_BRICK ||
      type === TileType.WOOD_TRUNK
    );
  }

  public isPlatformTile(type: TileType): boolean {
    return type === TileType.PLATFORM;
  }

  // === LIGHTING & PURIFICATION ENGINE ("Yaktığın Işık, Kalıcı İz Bırakır") ===

  public igniteLightSource(tileX: number, tileY: number, radius: number = 10) {
    audio.playLightIgnite();

    // Spread permanent light and purification
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          const tx = tileX + dx;
          const ty = tileY + dy;
          if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
            const idx = ty * WORLD_WIDTH + tx;
            const brightness = Math.max(0, Math.floor((1 - dist / radius) * 100));
            this.world.lightMap[idx] = Math.max(this.world.lightMap[idx], brightness);
            this.world.purifiedMap[idx] = 1; // Mark permanently purified!

            // Procedural foliage birth in newly purified area
            const currentTile = this.world.tiles[idx];
            const tileBelow = ty < WORLD_HEIGHT - 1 ? this.world.tiles[(ty + 1) * WORLD_WIDTH + tx] : TileType.AIR;
            if (currentTile === TileType.AIR && this.isSolidTile(tileBelow)) {
              if (this.world.foliageMap[idx] === 0) {
                const r = Math.random();
                this.world.foliageMap[idx] = r > 0.65 ? 3 : r > 0.35 ? 2 : 1;
              }
            }
          }
        }
      }
    }

    // Spawn blooming light particles
    for (let i = 0; i < 24; i++) {
      this.particles.push({
        x: (tileX + 0.5) * TILE_SIZE,
        y: (tileY + 0.5) * TILE_SIZE,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 1.5,
        color: Math.random() > 0.4 ? '#f59e0b' : '#38bdf8',
        size: Math.random() * 4 + 2,
        alpha: 1,
        decay: 0.015,
        glow: true,
      });
    }

    this.recalculatePurification();
    this.addFloatingText((tileX + 0.5) * TILE_SIZE, tileY * TILE_SIZE - 10, 'Işık Genişledi!', '#fbbf24');
    this.checkNPCSettlement();
  }

  public recalculatePurification() {
    let purifiedCount = 0;
    const total = WORLD_WIDTH * WORLD_HEIGHT;
    for (let i = 0; i < total; i++) {
      if (this.world.purifiedMap[i] === 1) {
        purifiedCount++;
      }
    }
    this.purificationPercent = Math.min(100, Math.round((purifiedCount / (total * 0.4)) * 100));

    if (this.purificationPercent >= 10) {
      this.unlockAchievement('purifier_10');
    }
    if (this.purificationPercent >= 25) {
      this.unlockAchievement('purifier_25');
    }
  }

  public getAchievements(): Achievement[] {
    return DEFAULT_ACHIEVEMENTS.map((ach) => {
      const record = this.achievements[ach.id];
      return {
        ...ach,
        unlocked: !!record?.unlocked,
        unlockedAt: record?.unlockedAt,
      };
    });
  }

  public unlockAchievement(id: string) {
    if (this.achievements[id]?.unlocked) return; // already unlocked

    const now = new Date();
    const timeStr = now.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    this.achievements[id] = {
      unlocked: true,
      unlockedAt: timeStr,
    };

    const meta = DEFAULT_ACHIEVEMENTS.find((a) => a.id === id);
    if (meta) {
      this.recentAchievement = {
        ...meta,
        unlocked: true,
        unlockedAt: timeStr,
      };
      this.achievementBannerTimer = 200; // ~3.3 seconds display
      this.addFloatingText(this.player.x, this.player.y - 45, `🏆 BAŞARI: ${meta.title}!`, '#fbbf24');
      audio.playParry();
    }
  }

  private updateAchievementsCheck() {
    const pTileY = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
    if (pTileY >= SURFACE_BOTTOM && pTileY < UNDERGROUND_BOTTOM) {
      this.unlockAchievement('reach_caverns');
    } else if (pTileY >= UNDERGROUND_BOTTOM) {
      this.unlockAchievement('reach_deep_ruins');
    }

    if (this.isPlayerInSafeBase) {
      this.unlockAchievement('first_shelter');
    }
  }

  // === SKILL TREE SYSTEM METHODS ===

  public getSkills(): SkillNode[] {
    return SKILL_TREE_NODES.map((node) => ({
      ...node,
      unlocked: !!this.unlockedSkills[node.id],
    }));
  }

  public isSkillUnlocked(skillId: string): boolean {
    return !!this.unlockedSkills[skillId];
  }

  public getSkillJumpBonus(): number {
    let bonus = 0;
    if (this.unlockedSkills['high_jump_1']) bonus += 0.22;
    if (this.unlockedSkills['high_jump_2']) bonus += 0.35;
    return bonus;
  }

  public getSkillMiningBonus(): number {
    let bonus = 0;
    if (this.unlockedSkills['faster_mining_1']) bonus += 0.25;
    if (this.unlockedSkills['faster_mining_2']) bonus += 0.40;
    if (this.unlockedSkills['crystal_extractor']) bonus += 0.50;
    return bonus;
  }

  public canUnlockSkill(skillId: string): boolean {
    const skill = SKILL_TREE_NODES.find((s) => s.id === skillId);
    if (!skill || this.unlockedSkills[skillId]) return false;

    // Check prerequisites
    if (skill.requires) {
      for (const reqId of skill.requires) {
        if (!this.unlockedSkills[reqId]) return false;
      }
    }

    // Check ash
    if (this.player.stats.ash < skill.cost.ash) return false;

    // Check items
    if (skill.cost.items) {
      for (const costItem of skill.cost.items) {
        const found = this.player.inventory.find((i) => i.id === costItem.itemId);
        if (!found || found.stack < costItem.count) return false;
      }
    }

    return true;
  }

  public unlockSkill(skillId: string): boolean {
    if (!this.canUnlockSkill(skillId)) return false;
    const skill = SKILL_TREE_NODES.find((s) => s.id === skillId);
    if (!skill) return false;

    // Deduct ash
    this.player.stats.ash -= skill.cost.ash;

    // Deduct items
    if (skill.cost.items) {
      for (const costItem of skill.cost.items) {
        const itemIdx = this.player.inventory.findIndex((i) => i.id === costItem.itemId);
        if (itemIdx !== -1) {
          const invItem = this.player.inventory[itemIdx];
          invItem.stack -= costItem.count;
          if (invItem.stack <= 0) {
            this.player.inventory.splice(itemIdx, 1);
          }
        }
      }
    }

    // Mark unlocked
    this.unlockedSkills[skillId] = true;

    // Apply immediate stat boosts
    if (skill.effect.maxHpBoost) {
      this.player.stats.maxHp += skill.effect.maxHpBoost;
      this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + skill.effect.maxHpBoost);
    }
    if (skill.effect.maxAshBoost) {
      this.player.stats.maxAsh += skill.effect.maxAshBoost;
      this.player.stats.ash = Math.min(this.player.stats.maxAsh, this.player.stats.ash + skill.effect.maxAshBoost);
    }
    if (skill.effect.attackDamageBoost) {
      this.player.stats.attackPower += skill.effect.attackDamageBoost;
    }
    if (skill.effect.miningSpeedMultiplier) {
      this.player.stats.miningSpeed = 1 + this.getSkillMiningBonus();
    }

    audio.playSkillUnlocked();
    this.triggerCameraShake(3.0);
    this.spawnLightBurst(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#38bdf8', 25);
    this.addFloatingText(this.player.x, this.player.y - 30, `🌟 Yetenek Açıldı: ${skill.name}!`, '#38bdf8');
    return true;
  }

  public checkNPCSettlement() {
    // Check if player has created lighted shelters with walls
    this.npcs.forEach((npc) => {
      if (!npc.settled) {
        const tx = Math.floor(npc.x);
        const ty = Math.floor(npc.y);
        const idx = ty * WORLD_WIDTH + tx;
        if (this.world.lightMap[idx] > 30) {
          npc.settled = true;
          this.addFloatingText(npc.x * TILE_SIZE, (npc.y - 1) * TILE_SIZE, `${npc.name} sığınağa yerleşti!`, '#34d399');
        }
      }
    });
  }

  // === PRIMARY UPDATE LOOP ===

  public update(keys: Record<string, boolean>, mouse: { x: number; y: number; isDown: boolean }) {
    this.playTimeTicks++;
    if (this.achievementBannerTimer > 0) {
      this.achievementBannerTimer--;
      if (this.achievementBannerTimer <= 0) {
        this.recentAchievement = null;
      }
    }

    if (this.activeSpeechBubble) {
      this.activeSpeechBubble.timer--;
      if (this.activeSpeechBubble.timer <= 0) {
        this.activeSpeechBubble = null;
      }
    }

    this.updateAmbientTime();
    this.updatePlayer(keys);
    this.updateEnemies();
    this.updateProjectiles();
    this.updateWeatherAndAmbientParticles();
    this.updateParticles();
    this.updateFloatingTexts();
    this.updateLayerMusic();
    this.updateAchievementsCheck();
  }

  private updateAmbientTime() {
    this.world.ambientTime = (this.world.ambientTime + 0.4) % 2400;

    // Day / Night cycle logic & Global Illumination
    // AmbientTime: 0 to 2400 ticks (~100 seconds per full cycle).
    // 0 = Dawn, 600 = Noon (Zenith), 1200 = Dusk/Sunset, 1800 = Midnight
    const cycleAngle = (this.world.ambientTime / 2400) * Math.PI * 2;
    this.sunAltitude = Math.sin(cycleAngle);
    this.isNight = this.sunAltitude < -0.05;

    // Track sun position across the world horizon
    const skyHorizonY = (SURFACE_BOTTOM - 20) * TILE_SIZE;
    this.sunPosition = {
      x: ((this.world.ambientTime / 2400) * (WORLD_WIDTH * TILE_SIZE)) % (WORLD_WIDTH * TILE_SIZE),
      y: skyHorizonY - Math.sin(cycleAngle) * 320,
      altitude: this.sunAltitude,
    };

    // Calculate Global Illumination level (high noon: 1.0, midnight: 0.20)
    if (this.sunAltitude >= 0) {
      this.globalIllumination = 0.55 + this.sunAltitude * 0.45;
    } else {
      this.globalIllumination = Math.max(0.20, 0.55 + this.sunAltitude * 0.35);
    }

    // Gece olduğunda meşalelerin ve mangalların yaydığı ışığın menzilini artır (+28%)
    this.torchRadiusMultiplier = this.isNight ? 1.28 : 1.0;

    // Environmental Ambient Audio Triggers (Mağara damlama, gece cırcır böceği, rüzgar uğultusu)
    this.ambientAudioTicker++;
    const playerFeetTileY = Math.floor(this.player.y / TILE_SIZE);
    if (playerFeetTileY >= SURFACE_BOTTOM) {
      // Underground: echoing water drips in the subterranean caverns
      if (this.ambientAudioTicker % 260 === 0 && Math.random() < 0.85) {
        audio.playWaterDrip();
      }
    } else {
      // Surface:
      // Nighttime: crickets singing under the ash moon
      if (this.isNight && this.ambientAudioTicker % 320 === 0) {
        audio.playCricketChirp();
      }
      // Windy open ridge or during ash storm: howling wind
      if ((this.world.isAshStorm || playerFeetTileY < 25) && this.ambientAudioTicker % 450 === 0) {
        audio.playWindGust();
      }
    }

    // Calculate surrounding local light integrity (9-tile radius around player)
    const pTileX = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);
    const pTileY = Math.floor((this.player.y + this.player.height / 2) / TILE_SIZE);
    const checkRadius = 9;
    let litCount = 0;
    let totalCount = 0;

    for (let dy = -checkRadius; dy <= checkRadius; dy++) {
      for (let dx = -checkRadius; dx <= checkRadius; dx++) {
        const dist = Math.hypot(dx, dy);
        if (dist <= checkRadius) {
          const tx = pTileX + dx;
          const ty = pTileY + dy;
          if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
            totalCount++;
            const idx = ty * WORLD_WIDTH + tx;
            if (this.world.purifiedMap[idx] === 1 || this.world.lightMap[idx] > 28) {
              litCount++;
            }
          }
        }
      }
    }
    this.localLightIntegrity = totalCount > 0 ? Math.round((litCount / totalCount) * 100) : 0;
    const centerIdx = Math.min(this.world.purifiedMap.length - 1, Math.max(0, pTileY * WORLD_WIDTH + pTileX));
    this.isPlayerInSafeBase = (this.world.purifiedMap[centerIdx] === 1 || this.world.lightMap[centerIdx] > 32);

    // Weather / Periodic Ash Storm Cycle:
    if (!this.world.isAshStorm) {
      this.stormTimer--;
      if (this.stormTimer <= 0) {
        this.triggerAshStorm(1300); // Trigger ~22 second storm
      }
    } else {
      this.stormDurationRemaining--;
      this.world.stormDuration = this.stormDurationRemaining;
      this.world.ashStormIntensity = Math.min(1, this.stormDurationRemaining / 100);

      // Periodic spawn of aggressive Storm Phantoms in unlit darkness nearby
      if (Math.random() < 0.016 && this.enemies.length < 35) {
        this.spawnStormPhantom();
      }

      // If player is caught outside in corrupt darkness during the storm:
      if (!this.isPlayerInSafeBase && this.localLightIntegrity < 25) {
        this.stormExposureTimer++;
        if (this.stormExposureTimer % 70 === 0) {
          this.addFloatingText(this.player.x, this.player.y - 32, '⚠️ KÜL FIRTINASI! IŞIKLI SIĞINAĞA DÖN!', '#f87171');
        }
        if (this.stormExposureTimer > 260) {
          // Take 1 damage from freezing ash exposure
          this.player.stats.hp = Math.max(1, this.player.stats.hp - 1);
          audio.playPlayerHurt();
          this.addFloatingText(this.player.x, this.player.y - 35, '-1 Can (Kül Fırtınası Donması)', '#ef4444');
          this.stormExposureTimer = 0;
        }
      } else {
        this.stormExposureTimer = Math.max(0, this.stormExposureTimer - 2);
        // Inside lit shelter during storm: blessed safety & subtle passive health recovery
        if (Math.random() < 0.015 && this.player.stats.hp < this.player.stats.maxHp) {
          this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + 1);
          this.addFloatingText(this.player.x, this.player.y - 20, '+1 Can (Sığınak Koruması)', '#34d399');
        }
      }

      // Storm conclusion
      if (this.stormDurationRemaining <= 0) {
        this.world.isAshStorm = false;
        this.world.ashStormIntensity = 0;
        this.stormTimer = 4200 + Math.floor(Math.random() * 1800);
        this.addFloatingText(this.player.x, this.player.y - 40, 'Kül Fırtınası Dindi. Gökyüzü Sakinleşti.', '#38bdf8');
        this.unlockAchievement('storm_survivor');
      }
    }

    // Procedural foliage growth and vitality particles
    this.updateFoliageGrowth();

    // Ambient healing in purified light zones
    if (this.world.purifiedMap[centerIdx] === 1 && Math.random() < 0.012) {
      if (this.player.stats.ash < this.player.stats.maxAsh) {
        this.player.stats.ash = Math.min(this.player.stats.maxAsh, this.player.stats.ash + 1);
      }
    }
  }

  public triggerAshStorm(duration: number = 1300) {
    this.world.isAshStorm = true;
    this.stormDurationRemaining = duration;
    this.world.stormDuration = duration;
    this.world.ashStormIntensity = 1;
    this.stormExposureTimer = 0;
    this.addFloatingText(this.player.x, this.player.y - 45, '🌪️ DİKKAT: KÜL FIRTINASI PATLADI! SIĞINAĞA DÖN!', '#f87171');
  }

  private spawnStormPhantom() {
    const side = Math.random() > 0.5 ? 1 : -1;
    const spawnX = this.player.x + side * (320 + Math.random() * 140);
    const spawnY = this.player.y - 50 + (Math.random() * 100);

    const sTileX = Math.floor(spawnX / TILE_SIZE);
    const sTileY = Math.floor(spawnY / TILE_SIZE);
    if (sTileX < 0 || sTileX >= WORLD_WIDTH || sTileY < 0 || sTileY >= WORLD_HEIGHT) return;

    const idx = sTileY * WORLD_WIDTH + sTileX;
    if (this.world.lightMap[idx] > 30 || this.world.purifiedMap[idx] === 1) return;

    this.enemies.push({
      id: 'phantom_' + Date.now() + '_' + Math.random(),
      type: 'storm_phantom',
      name: 'Kül Fırtınası Hortlağı',
      x: spawnX,
      y: spawnY,
      vx: -side * 2.8,
      vy: 0,
      width: 22,
      height: 28,
      hp: 25,
      maxHp: 25,
      damage: 18,
      isGrounded: false,
      facing: side > 0 ? -1 : 1,
      state: 'chase',
      attackCooldown: 0,
      staggerTimer: 0,
      inLightArea: false,
    });
  }

  private updateFoliageGrowth() {
    this.foliageGrowthTicker++;
    // Periodically stimulate nature growth in purified zones
    if (this.foliageGrowthTicker % 20 === 0) {
      for (let k = 0; k < 10; k++) {
        const rx = Math.floor(Math.random() * WORLD_WIDTH);
        const ry = Math.floor(Math.random() * WORLD_HEIGHT);
        const idx = ry * WORLD_WIDTH + rx;
        if (this.world.purifiedMap[idx] === 1 && this.world.tiles[idx] === TileType.AIR) {
          const belowTile = ry < WORLD_HEIGHT - 1 ? this.world.tiles[(ry + 1) * WORLD_WIDTH + rx] : TileType.AIR;
          if (this.isSolidTile(belowTile) && belowTile !== TileType.ANCIENT_BRICK && belowTile !== TileType.OBSIDIAN) {
            const currentStage = this.world.foliageMap[idx];
            if (currentStage === 0) {
              this.world.foliageMap[idx] = 1; // Sprouts
            } else if (currentStage === 1 && Math.random() < 0.4) {
              this.world.foliageMap[idx] = 2; // Lush wavy grass
            } else if (currentStage === 2 && Math.random() < 0.25) {
              this.world.foliageMap[idx] = Math.random() > 0.5 ? 3 : 4; // Ember Flower or Luminescent Spores
            }
          }
        }
      }
    }

    // Floating healing motes/pollen rising from healed ground near player
    if (Math.random() < 0.2) {
      const pTileX = Math.floor(this.player.x / TILE_SIZE);
      const pTileY = Math.floor(this.player.y / TILE_SIZE);
      const offsetX = Math.floor(Math.random() * 21) - 10;
      const offsetY = Math.floor(Math.random() * 15) - 7;
      const tx = pTileX + offsetX;
      const ty = pTileY + offsetY;
      if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
        const idx = ty * WORLD_WIDTH + tx;
        if (this.world.purifiedMap[idx] === 1 && this.world.foliageMap[idx] >= 2) {
          const flowerType = this.world.foliageMap[idx];
          this.particles.push({
            x: (tx + Math.random()) * TILE_SIZE,
            y: (ty + 0.8) * TILE_SIZE,
            vx: (Math.random() - 0.5) * 0.6 + (this.world.isAshStorm ? 2.5 : 0.2),
            vy: -(Math.random() * 0.7 + 0.3),
            color: flowerType === 3 ? '#fbbf24' : flowerType === 4 ? '#38bdf8' : '#4ade80',
            size: Math.random() * 2.5 + 1.5,
            alpha: 0.85,
            decay: 0.014,
            glow: true,
          });
        }
      }
    }
  }

  private updateLayerMusic() {
    const tileY = Math.floor(this.player.y / TILE_SIZE);
    if (this.bossActive) {
      audio.setLayerMusic('boss');
      this.currentZone = LayerZone.DEEP_RUINS;
    } else if (tileY < SURFACE_BOTTOM) {
      audio.setLayerMusic('surface');
      this.currentZone = LayerZone.SURFACE;
    } else if (tileY < UNDERGROUND_BOTTOM) {
      audio.setLayerMusic('underground');
      this.currentZone = LayerZone.UNDERGROUND;
    } else {
      audio.setLayerMusic('deep');
      this.currentZone = LayerZone.DEEP_RUINS;
    }
  }

  // === PLAYER PHYSICS & CONTROLS ===

  private updatePlayer(keys: Record<string, boolean>) {
    const p = this.player;

    // Timers
    if (p.invulnerableTimer > 0) p.invulnerableTimer--;
    if (p.dashCooldown > 0) p.dashCooldown--;
    if (p.attackTimer > 0) p.attackTimer--;
    if (p.parryTimer > 0) {
      p.parryTimer--;
      if (p.parryTimer === 0) p.isParrying = false;
    }

    // Horizontal Movement
    const moveLeft = keys['KeyA'] || keys['ArrowLeft'];
    const moveRight = keys['KeyD'] || keys['ArrowRight'];

    if (!p.isDashing) {
      if (moveLeft && !moveRight) {
        p.vx = -MOVE_SPEED;
        p.facing = -1;
      } else if (moveRight && !moveLeft) {
        p.vx = MOVE_SPEED;
        p.facing = 1;
      } else {
        p.vx *= 0.75;
        if (Math.abs(p.vx) < 0.1) p.vx = 0;
      }
    }

    // Cape trailing physics
    p.capeAngle += ((-p.vx * 0.15) - p.capeAngle) * 0.12;

    // Wall detection
    const leftWall = this.checkTileCollision(p.x - 2, p.y + 4, 2, p.height - 8);
    const rightWall = this.checkTileCollision(p.x + p.width, p.y + 4, 2, p.height - 8);
    p.isOnWall = leftWall ? -1 : rightWall ? 1 : 0;

    // Wall slide
    if (p.isOnWall !== 0 && !p.isGrounded && p.vy > 0 && p.stats.hasWallClimb) {
      p.vy = Math.min(p.vy, WALL_SLIDE_SPEED);
      // Spawn wall friction dust
      if (Math.random() > 0.6) {
        this.particles.push({
          x: p.isOnWall === -1 ? p.x : p.x + p.width,
          y: p.y + Math.random() * p.height,
          vx: p.isOnWall === -1 ? 1 : -1,
          vy: -0.5,
          color: '#cbd5e1',
          size: 2,
          alpha: 0.8,
          decay: 0.05,
        });
      }
    }

    // Dash
    if (p.isDashing) {
      p.dashTimer--;
      p.vy = 0; // maintain horizontal glide during dash
      p.vx = p.facing * DASH_SPEED;

      // Ash silhouette ghost particles
      if (p.dashTimer % 2 === 0) {
        this.particles.push({
          x: p.x,
          y: p.y,
          vx: 0,
          vy: 0,
          color: '#38bdf8',
          size: p.height * 0.7,
          alpha: 0.5,
          decay: 0.05,
          glow: true,
        });
      }

      if (p.dashTimer <= 0) {
        p.isDashing = false;
        p.vx *= 0.5;
      }
    } else {
      // Gravity
      // Wings gliding if holding Jump and falling
      if (keys['Space'] && p.vy > 1.2 && p.stats.hasWings) {
        p.vy += GRAVITY * 0.25;
        p.vy = Math.min(p.vy, 2.2); // soft glide
      } else {
        p.vy += GRAVITY;
      }
      p.vy = Math.min(p.vy, 14); // terminal velocity
    }

    // Move & Collide Horizontal
    p.x += p.vx;
    if (p.vx !== 0) {
      const collX = this.resolveHorizontalCollision();
      if (collX) p.vx = 0;
    }

    // Footstep dust under player's feet when running
    if (p.isGrounded && Math.abs(p.vx) > 1.2 && Math.random() < 0.25) {
      this.particles.push({
        x: p.x + (p.facing === 1 ? 2 : p.width - 2),
        y: p.y + p.height - 2,
        vx: -p.facing * (Math.random() * 1.2 + 0.4),
        vy: -Math.random() * 0.8 - 0.2,
        color: '#64748b',
        size: Math.random() * 2 + 1,
        alpha: 0.65,
        decay: 0.04,
      });
    }

    // Move & Collide Vertical
    const prevVy = p.vy;
    p.y += p.vy;
    p.isGrounded = false;
    const collY = this.resolveVerticalCollision();
    if (collY) {
      if (p.vy > 0 || prevVy > 0) {
        p.isGrounded = true;
        p.canDoubleJump = true;
        // Hollow Knight landing impact camera shake
        if (prevVy > 5.5) {
          this.triggerCameraShake(Math.min(5.5, (prevVy - 4.5) * 1.2));
          this.spawnDust(p.x + p.width / 2, p.y + p.height, 8);
        }
      }
      p.vy = 0;
    }

    // Check interaction with nearby NPCs
    this.nearbyNPC = null;
    const pCenterX = p.x + p.width / 2;
    const pCenterY = p.y + p.height / 2;
    for (const npc of this.npcs) {
      const dist = Math.hypot(pCenterX - npc.x * TILE_SIZE, pCenterY - npc.y * TILE_SIZE);
      if (dist < 55) {
        this.nearbyNPC = npc;
        break;
      }
    }
  }

  // Handle jump action
  public handleJump() {
    const p = this.player;
    const jumpBonus = this.getSkillJumpBonus();
    const effectiveJumpForce = JUMP_FORCE * (1 + jumpBonus);

    if (p.isGrounded) {
      p.vy = effectiveJumpForce;
      p.isGrounded = false;
      audio.playJump();
      this.spawnDust(p.x + p.width / 2, p.y + p.height, 6);
    } else if (p.isOnWall !== 0 && p.stats.hasWallClimb) {
      // Wall Jump
      p.vy = WALL_JUMP_Y * (1 + jumpBonus * 0.5);
      p.vx = -p.isOnWall * WALL_JUMP_X;
      p.facing = (-p.isOnWall) as -1 | 1;
      audio.playJump();
      this.spawnDust(p.isOnWall === -1 ? p.x : p.x + p.width, p.y + p.height / 2, 5);
    } else if (p.canDoubleJump && p.stats.hasDoubleJump) {
      // Double jump (Ori spirit jump)
      p.vy = DOUBLE_JUMP_FORCE * (1 + jumpBonus * 0.6);
      p.canDoubleJump = false;
      audio.playJump();
      this.spawnLightBurst(p.x + p.width / 2, p.y + p.height / 2, '#38bdf8', 12);
    }
  }

  // Handle dash action
  public handleDash() {
    const p = this.player;
    if (p.dashCooldown <= 0 && p.stats.hasDash && !p.isDashing) {
      p.isDashing = true;
      p.dashTimer = DASH_DURATION;
      p.dashCooldown = DASH_COOLDOWN;
      p.invulnerableTimer = DASH_DURATION + 4; // iframes during dash
      audio.playDash();
    }
  }

  // Handle parry action (Souls-lite parry)
  public handleParry() {
    const p = this.player;
    if (!p.isParrying && p.invulnerableTimer <= 0) {
      p.isParrying = true;
      p.parryTimer = PARRY_WINDOW_FRAMES;
      this.addFloatingText(p.x + p.width / 2, p.y - 12, 'Parry!', '#38bdf8');
    }
  }

  // Directional Attack (Slash & Pogo)
  public handleAttack(direction: 'forward' | 'up' | 'down' = 'forward') {
    const p = this.player;
    if (p.attackTimer > 0) return;

    p.attackTimer = 16;
    p.attackDirection = direction;
    audio.playSlash();

    const currentItem = p.inventory[p.selectedHotbarIndex];
    const dmg = (currentItem?.damage || p.stats.attackPower);

    // Hitbox calculation
    let hitX = p.facing === 1 ? p.x + p.width : p.x - 38;
    let hitY = p.y;
    let hitW = 42;
    let hitH = 34;

    if (direction === 'up') {
      hitX = p.x - 10;
      hitY = p.y - 36;
      hitW = p.width + 20;
      hitH = 40;
    } else if (direction === 'down') {
      hitX = p.x - 10;
      hitY = p.y + p.height;
      hitW = p.width + 20;
      hitH = 40;
    }

    // Check hit against enemies
    for (const enemy of this.enemies) {
      if (
        hitX < enemy.x + enemy.width &&
        hitX + hitW > enemy.x &&
        hitY < enemy.y + enemy.height &&
        hitY + hitH > enemy.y
      ) {
        // Damage enemy
        const actualDmg = enemy.inLightArea ? Math.floor(dmg * 1.4) : dmg;
        enemy.hp -= actualDmg;
        enemy.staggerTimer = 10;
        enemy.vx = p.facing * 3;

        audio.playEnemyHit();
        this.triggerCameraShake(direction === 'down' ? 5.5 : 3.8);
        this.addFloatingText(enemy.x + enemy.width / 2, enemy.y - 10, `-${actualDmg}`, enemy.inLightArea ? '#fbbf24' : '#ef4444');
        this.spawnBloodPuff(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

        // Gather Ash resource (Hollow Knight SOUL)
        p.stats.ash = Math.min(p.stats.maxAsh, p.stats.ash + 11);

        // HOLLOW KNIGHT DOWNWARD POGO BOUNCE!
        if (direction === 'down') {
          p.vy = POGO_BOUNCE_FORCE;
          p.canDoubleJump = true; // resets air mobility!
          p.dashCooldown = 0;
          audio.playPogoHit();
          this.spawnLightBurst(p.x + p.width / 2, p.y + p.height, '#f59e0b', 14);
        }
      }
    }
  }

  // Cast Ember Blast (Metroidvania spell)
  public handleCastSpell() {
    const p = this.player;
    if (p.stats.ash >= 25) {
      p.stats.ash -= 25;
      audio.playCastSpell();

      this.projectiles.push({
        id: `proj_${Date.now()}`,
        x: p.facing === 1 ? p.x + p.width + 4 : p.x - 16,
        y: p.y + p.height / 2 - 6,
        vx: p.facing * 9.5,
        vy: 0,
        damage: 42,
        radius: 8,
        color: '#f59e0b',
        fromPlayer: true,
        lifetime: 60,
      });

      this.spawnLightBurst(p.x + p.width / 2, p.y + p.height / 2, '#f59e0b', 16);
    } else {
      this.addFloatingText(p.x, p.y - 10, 'Yetersiz Kül!', '#94a3b8');
    }
  }

  // Focus / Heal (Hollow Knight style soul heal)
  public handleFocusHeal() {
    const p = this.player;
    if (p.stats.ash >= 33 && p.stats.hp < p.stats.maxHp) {
      p.stats.ash -= 33;
      p.stats.hp += 1;
      audio.playFocusHeal();
      this.spawnLightBurst(p.x + p.width / 2, p.y + p.height / 2, '#34d399', 20);
      this.addFloatingText(p.x + p.width / 2, p.y - 12, '+1 Sağlık', '#34d399');
    }
  }

  // Terraria Dig / Break Tile
  public handleDig(targetTileX: number, targetTileY: number) {
    const p = this.player;
    const tile = this.getTile(targetTileX, targetTileY);
    if (tile === TileType.AIR) return;

    // Range check
    const pTileX = Math.floor((p.x + p.width / 2) / TILE_SIZE);
    const pTileY = Math.floor((p.y + p.height / 2) / TILE_SIZE);
    const dist = Math.hypot(targetTileX - pTileX, targetTileY - pTileY);
    if (dist > 7) {
      this.addFloatingText(targetTileX * TILE_SIZE, targetTileY * TILE_SIZE, 'Çok Uzak', '#94a3b8');
      return;
    }

    const isOre =
      tile === TileType.COPPER_ORE ||
      tile === TileType.SILVER_ORE ||
      tile === TileType.EMBER_CRYSTAL;

    audio.playMineHit(isOre);
    this.triggerCameraShake(isOre ? 4.2 : 2.2);

    if (tile === TileType.COPPER_ORE || tile === TileType.SILVER_ORE) {
      this.unlockAchievement('first_ore');
    } else if (tile === TileType.EMBER_CRYSTAL) {
      this.unlockAchievement('rare_crystal');
    }

    // Drop item to player inventory
    this.dropTileItem(tile);

    // Extra ash & crystals if crystal_extractor skill is unlocked
    if (this.unlockedSkills['crystal_extractor'] && (isOre || Math.random() < 0.2)) {
      this.player.stats.ash = Math.min(this.player.stats.maxAsh, this.player.stats.ash + 8);
      this.spawnLightBurst((targetTileX + 0.5) * TILE_SIZE, (targetTileY + 0.5) * TILE_SIZE, '#38bdf8', 6);
    }

    // Remove tile
    this.setTile(targetTileX, targetTileY, TileType.AIR);

    // Clear any foliage on or directly above this tile
    const idx = targetTileY * WORLD_WIDTH + targetTileX;
    this.world.foliageMap[idx] = 0;
    if (targetTileY > 0) {
      this.world.foliageMap[(targetTileY - 1) * WORLD_WIDTH + targetTileX] = 0;
    }

    // Spawn digging debris
    this.spawnTileDebris(targetTileX, targetTileY, tile);
  }

  // Terraria Place Tile / Light source
  public handlePlace(targetTileX: number, targetTileY: number) {
    const p = this.player;
    const currentItem = p.inventory[p.selectedHotbarIndex];
    if (!currentItem || !currentItem.tileType || currentItem.stack <= 0) return;

    const existing = this.getTile(targetTileX, targetTileY);
    if (existing !== TileType.AIR && existing !== TileType.PLATFORM) return;

    // Range check
    const pTileX = Math.floor((p.x + p.width / 2) / TILE_SIZE);
    const pTileY = Math.floor((p.y + p.height / 2) / TILE_SIZE);
    const dist = Math.hypot(targetTileX - pTileX, targetTileY - pTileY);
    if (dist > 7) return;

    audio.playPlaceTile();
    this.setTile(targetTileX, targetTileY, currentItem.tileType);

    // If light source (Torch or Brazier), ignite light and purify!
    if (currentItem.tileType === TileType.TORCH) {
      this.igniteLightSource(targetTileX, targetTileY, 11);
      this.unlockAchievement('first_torch');
    } else if (currentItem.tileType === TileType.EMBER_BRAZIER) {
      this.igniteLightSource(targetTileX, targetTileY, 22);
      this.unlockAchievement('first_torch');
    }

    // Decrement item stack
    currentItem.stack--;
    if (currentItem.stack <= 0) {
      p.inventory.splice(p.selectedHotbarIndex, 1);
    }
  }

  private dropTileItem(tile: TileType) {
    let dropId = 'raw_stone';
    let dropName = 'İşlenmemiş Taş';
    let dropIcon = '🪨';
    let type: any = 'material';

    if (tile === TileType.DIRT || tile === TileType.GRASS_DIRT) {
      dropId = 'ash_soil';
      dropName = 'Kül Toprağı';
      dropIcon = '🍂';
    } else if (tile === TileType.WOOD_TRUNK || tile === TileType.WOOD_PLANK) {
      dropId = 'ash_wood';
      dropName = 'Kül Odunu';
      dropIcon = '🪵';
    } else if (tile === TileType.COPPER_ORE) {
      dropId = 'copper_ore';
      dropName = 'Ham Bakır Cevheri';
      dropIcon = '🟤';
    } else if (tile === TileType.SILVER_ORE) {
      dropId = 'silver_ore';
      dropName = 'Gümüş Cevheri';
      dropIcon = '⚪';
    } else if (tile === TileType.EMBER_CRYSTAL) {
      dropId = 'ember_shard';
      dropName = 'Köz Kristali';
      dropIcon = '🔥';
      this.player.stats.ash = Math.min(this.player.stats.maxAsh, this.player.stats.ash + 20);
    } else if (tile === TileType.TORCH) {
      dropId = 'ember_torch';
      dropName = 'Köz Meşalesi';
      dropIcon = '🔥';
      type = 'placeable';
    }

    this.addItemToInventory({
      id: dropId,
      name: dropName,
      description: 'Maden ve zanaat malzemesi.',
      icon: dropIcon,
      type,
      stack: 1,
      maxStack: 99,
      tileType: tile === TileType.TORCH ? TileType.TORCH : undefined,
    });
  }

  public addItemToInventory(item: Item): boolean {
    const existing = this.player.inventory.find((i) => i.id === item.id);
    if (existing && existing.stack < existing.maxStack) {
      existing.stack += item.stack;
      this.addFloatingText(this.player.x, this.player.y - 20, `+${item.stack} ${item.name}`, '#f59e0b');
      return true;
    } else if (this.player.inventory.length < 16) {
      this.player.inventory.push(item);
      this.addFloatingText(this.player.x, this.player.y - 20, `+${item.name}`, '#f59e0b');
      return true;
    }
    return false;
  }

  public craftRecipe(recipeId: string): boolean {
    const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return false;

    // Check ingredients
    for (const ing of recipe.ingredients) {
      const item = this.player.inventory.find((i) => i.id === ing.itemId);
      if (!item || item.stack < ing.count) {
        this.addFloatingText(this.player.x, this.player.y - 20, 'Yetersiz Malzeme!', '#f87171');
        return false;
      }
    }

    // Deduct ingredients
    for (const ing of recipe.ingredients) {
      const item = this.player.inventory.find((i) => i.id === ing.itemId)!;
      item.stack -= ing.count;
      if (item.stack <= 0) {
        const idx = this.player.inventory.indexOf(item);
        this.player.inventory.splice(idx, 1);
      }
    }

    // Add result
    this.addItemToInventory(JSON.parse(JSON.stringify(recipe.result)));
    audio.playPlaceTile();
    this.unlockAchievement('craft_item');
    return true;
  }

  // === ENEMY LOGIC & BOSS AI ===

  private updateEnemies() {
    const p = this.player;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Check if enemy is in lighted/purified area (weakened!)
      const eTileX = Math.floor((e.x + e.width / 2) / TILE_SIZE);
      const eTileY = Math.floor((e.y + e.height / 2) / TILE_SIZE);
      const eIdx = eTileY * WORLD_WIDTH + eTileX;
      e.inLightArea = this.world.lightMap[eIdx] > 35;

      if (e.staggerTimer > 0) {
        e.staggerTimer--;
        continue;
      }

      // Death check
      if (e.hp <= 0) {
        this.spawnBloodPuff(e.x + e.width / 2, e.y + e.height / 2);
        this.dropEnemyLoot(e);
        if (e.type === 'boss_ignis') {
          this.bossActive = false;
          p.stats.hasWings = true; // Unlock Kanat Açma / Ember Wings!
          this.addFloatingText(p.x, p.y - 50, '✨ KANAT AÇMA (WINGS) KİLİDİ AÇILDI!', '#38bdf8');
          this.activeLoreAlert = 'Kadim Muhafız huzura erdi. Kül kanatları artık senin.';
          this.unlockAchievement('defeat_boss');
        }
        this.enemies.splice(i, 1);
        continue;
      }

      // AI Alert timer update
      if (e.alertTimer && e.alertTimer > 0) {
        e.alertTimer--;
      }

      // AI by Enemy Type
      const distToPlayer = Math.hypot(p.x - e.x, p.y - e.y);

      if (e.type === 'crawler' || e.type === 'brute') {
        const isBrute = e.type === 'brute';
        const aggroDist = isBrute ? 230 : 190;
        const deAggroDist = 330;
        const patrolSpeed = isBrute ? 0.65 : 0.85;
        const chaseSpeed = (isBrute ? 1.5 : 1.85) * (e.inLightArea ? 0.65 : 1.0);

        // State Machine: Patrol <-> Chase
        if (e.state !== 'chase' && distToPlayer < aggroDist) {
          e.state = 'chase';
          e.alertTimer = 35; // Show Hollow Knight alert ! exclamation
          this.spawnDust(e.x + e.width / 2, e.y + e.height, 5);
        } else if (e.state === 'chase' && distToPlayer > deAggroDist) {
          e.state = 'patrol';
          e.patrolTimer = 80;
        }

        if (e.state === 'chase') {
          // CHASE AI: relentlessly pursue the player
          e.facing = p.x > e.x ? 1 : -1;
          e.vx = e.facing * chaseSpeed;

          // Check if hitting a 1-2 block step/obstacle ahead
          const aheadX = e.facing === 1 ? e.x + e.width + 3 : e.x - 3;
          const isObstacleAhead = this.checkTileCollision(aheadX, e.y + e.height - 12, 2, 10);
          if (isObstacleAhead && e.isGrounded) {
            // Jump over the obstacle to continue pursuit!
            e.vy = isBrute ? -4.6 : -5.4;
            e.isGrounded = false;
          }

          // Lunge / bite attack if very close
          if (distToPlayer < 38 && e.attackCooldown <= 0) {
            e.attackCooldown = isBrute ? 70 : 45;
            e.vx = e.facing * (chaseSpeed + 2.0);
          }
        } else {
          // PATROL AI: roam back and forth, turning at walls and ledges
          if (!e.patrolTimer || e.patrolTimer <= 0) {
            e.patrolTimer = 110 + Math.floor(Math.random() * 100);
            if (Math.random() < 0.35) {
              e.facing = -e.facing as -1 | 1;
            }
          } else {
            e.patrolTimer--;
          }

          e.vx = e.facing * patrolSpeed;

          // Ahead wall collision check
          const aheadX = e.facing === 1 ? e.x + e.width + 3 : e.x - 3;
          const isWallAhead = this.checkTileCollision(aheadX, e.y + 6, 2, e.height - 12);
          if (isWallAhead) {
            e.facing = -e.facing as -1 | 1;
            e.patrolTimer = 70;
          }

          // Ahead ledge check (do not blindly walk off huge cliffs when patrolling)
          const checkFootX = e.facing === 1 ? e.x + e.width + 4 : e.x - 4;
          const checkFootY = e.y + e.height + 6;
          const tileBelowX = Math.floor(checkFootX / TILE_SIZE);
          const tileBelowY = Math.floor(checkFootY / TILE_SIZE);
          const tileBelow = this.getTile(tileBelowX, tileBelowY);
          if (!this.isSolidTile(tileBelow) && !this.isPlatformTile(tileBelow) && e.isGrounded) {
            e.facing = -e.facing as -1 | 1;
            e.patrolTimer = 70;
          }
        }

        if (e.attackCooldown > 0) e.attackCooldown--;
        e.vy += GRAVITY;
        e.x += e.vx;
        e.y += e.vy;
        this.resolveEnemyCollision(e);
      } else if (e.type === 'stinger') {
        // Flying aerial stalker
        if (distToPlayer < 240) {
          const angle = Math.atan2(p.y - e.y, p.x - e.x);
          e.vx = Math.cos(angle) * (e.inLightArea ? 1.2 : 2.2);
          e.vy = Math.sin(angle) * (e.inLightArea ? 1.2 : 2.2);
        } else {
          e.vx = Math.sin(Date.now() * 0.002) * 1.2;
          e.vy = Math.cos(Date.now() * 0.003) * 0.8;
        }
        e.x += e.vx;
        e.y += e.vy;
      } else if (e.type === 'wraith') {
        // Cavern wraith floating & shooting shadow orbs
        if (distToPlayer < 260) {
          e.facing = p.x > e.x ? 1 : -1;
          e.vx = Math.sin(Date.now() * 0.003) * 1.5;
          e.vy = Math.cos(Date.now() * 0.002) * 1.2;

          e.attackCooldown++;
          if (e.attackCooldown > 120) {
            e.attackCooldown = 0;
            // Shoot shadow projectile
            const angle = Math.atan2(p.y - e.y, p.x - e.x);
            this.projectiles.push({
              id: `wraith_orb_${Date.now()}`,
              x: e.x + e.width / 2,
              y: e.y + e.height / 2,
              vx: Math.cos(angle) * 4.2,
              vy: Math.sin(angle) * 4.2,
              damage: 1,
              radius: 6,
              color: '#818cf8',
              fromPlayer: false,
              lifetime: 90,
            });
          }
        }
        e.x += e.vx;
        e.y += e.vy;
      } else if (e.type === 'storm_phantom') {
        // High-speed aggressive storm phantom roaming the darkness
        if (e.inLightArea) {
          // Severely burned and slowed by purified light / safe sanctuaries!
          e.hp -= 0.6;
          if (Math.random() < 0.4) {
            this.particles.push({
              x: e.x + Math.random() * e.width,
              y: e.y + Math.random() * e.height,
              vx: (Math.random() - 0.5) * 2,
              vy: -Math.random() * 2,
              color: '#f59e0b',
              size: 3,
              alpha: 0.9,
              decay: 0.03,
              glow: true,
            });
          }
        }

        const angle = Math.atan2(p.y - e.y, p.x - e.x);
        const speed = e.inLightArea ? 1.2 : 3.4;
        e.vx = Math.cos(angle) * speed;
        e.vy = Math.sin(angle) * speed;
        e.facing = e.vx > 0 ? 1 : -1;

        e.x += e.vx;
        e.y += e.vy;

        // Shadow ash trail
        if (Math.random() < 0.3) {
          this.particles.push({
            x: e.x + e.width / 2,
            y: e.y + e.height / 2,
            vx: -e.vx * 0.3 + (Math.random() - 0.5),
            vy: -e.vy * 0.3 + (Math.random() - 0.5),
            color: '#1e1b4b',
            size: Math.random() * 3 + 2,
            alpha: 0.8,
            decay: 0.03,
          });
        }
      } else if (e.type === 'boss_ignis') {
        this.updateBossAI(e, distToPlayer);
      }

      // Check collision with player
      if (
        p.invulnerableTimer <= 0 &&
        p.x < e.x + e.width &&
        p.x + p.width > e.x &&
        p.y < e.y + e.height &&
        p.y + p.height > e.y
      ) {
        this.damagePlayer(e.damage);
      }
    }
  }

  private updateBossAI(boss: Enemy, dist: number) {
    const p = this.player;
    this.bossActive = true;
    this.bossHp = boss.hp;
    this.bossMaxHp = boss.maxHp;

    boss.attackCooldown++;
    boss.facing = p.x > boss.x ? 1 : -1;

    // Phase shift at 50% HP
    if (boss.hp < boss.maxHp * 0.5 && boss.state !== 'boss_phase2') {
      boss.state = 'boss_phase2';
      this.spawnLightBurst(boss.x + boss.width / 2, boss.y + boss.height / 2, '#ef4444', 35);
      this.addFloatingText(boss.x, boss.y - 30, 'IGNIS: GAZAP FAZI!', '#ef4444');
    }

    // Boss attack patterns
    if (boss.attackCooldown > 100) {
      boss.attackCooldown = 0;
      const attackChoice = Math.random();

      if (attackChoice < 0.4) {
        // Shockwave slash
        audio.playSlash();
        this.projectiles.push({
          id: `shockwave_${Date.now()}`,
          x: boss.x + (boss.facing === 1 ? boss.width : 0),
          y: boss.y + boss.height - 12,
          vx: boss.facing * 6.5,
          vy: 0,
          damage: 1,
          radius: 12,
          color: '#f97316',
          fromPlayer: false,
          lifetime: 80,
        });
      } else if (attackChoice < 0.75) {
        // Ember rain barrage (spits ember bolts into air that fall down)
        for (let b = -2; b <= 2; b++) {
          this.projectiles.push({
            id: `ember_rain_${Date.now()}_${b}`,
            x: boss.x + boss.width / 2,
            y: boss.y,
            vx: b * 2.2,
            vy: -7.5,
            damage: 1,
            radius: 7,
            color: '#f59e0b',
            fromPlayer: false,
            lifetime: 110,
          });
        }
      } else {
        // Teleport slam
        boss.x = p.x - 20;
        boss.y = p.y - 90;
        boss.vy = 8;
        this.spawnLightBurst(boss.x, boss.y, '#9333ea', 20);
      }
    }

    // Apply gravity to boss
    boss.vy += GRAVITY;
    boss.y += boss.vy;
    this.resolveEnemyCollision(boss);
  }

  private damagePlayer(amount: number) {
    const p = this.player;

    // Parry check!
    if (p.isParrying) {
      p.isParrying = false;
      p.invulnerableTimer = 30; // safety window
      audio.playParry();
      this.triggerCameraShake(7.5);
      p.stats.ash = Math.min(p.stats.maxAsh, p.stats.ash + 35);
      this.addFloatingText(p.x, p.y - 20, 'KUSURSUZ PARRY!', '#38bdf8');
      this.spawnLightBurst(p.x + p.width / 2, p.y + p.height / 2, '#38bdf8', 22);
      this.unlockAchievement('first_parry');
      return;
    }

    p.stats.hp -= 1; // standard Metroidvania mask loss
    p.invulnerableTimer = 45;
    p.vy = -5.5;
    p.vx = -p.facing * 4;
    this.triggerCameraShake(9.0);

    audio.playEnemyHit();
    this.addFloatingText(p.x, p.y - 15, '-1 Mask', '#ef4444');
    this.spawnBloodPuff(p.x + p.width / 2, p.y + p.height / 2);

    if (p.stats.hp <= 0) {
      // Respawn at starting hearth
      p.stats.hp = p.stats.maxHp;
      p.x = 43 * TILE_SIZE;
      p.y = 40 * TILE_SIZE;
      p.vx = 0;
      p.vy = 0;
      this.addFloatingText(p.x, p.y - 40, 'Köz Yeniden Canlandı.', '#fbbf24');
    }
  }

  private dropEnemyLoot(enemy: Enemy) {
    this.addItemToInventory({
      id: 'ember_shard',
      name: 'Köz Kristali',
      description: 'Düşmanlardan toplanan saf enerji.',
      icon: '🔥',
      type: 'material',
      stack: Math.floor(Math.random() * 3) + 1,
      maxStack: 99,
    });
  }

  // === PROJECTILES & PARTICLES ===

  private updateProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.lifetime--;

      // Gravity for ember rain
      if (proj.id.startsWith('ember_rain')) {
        proj.vy += 0.22;
      }

      // Check collision with player
      if (!proj.fromPlayer && this.player.invulnerableTimer <= 0) {
        const dist = Math.hypot(
          proj.x - (this.player.x + this.player.width / 2),
          proj.y - (this.player.y + this.player.height / 2)
        );
        if (dist < proj.radius + 12) {
          this.damagePlayer(proj.damage);
          proj.lifetime = 0;
        }
      }

      // Check collision with enemies
      if (proj.fromPlayer) {
        for (const e of this.enemies) {
          if (
            proj.x > e.x &&
            proj.x < e.x + e.width &&
            proj.y > e.y &&
            proj.y < e.y + e.height
          ) {
            e.hp -= proj.damage;
            e.staggerTimer = 8;
            this.addFloatingText(e.x + e.width / 2, e.y - 10, `-${proj.damage}`, '#f59e0b');
            this.spawnLightBurst(proj.x, proj.y, '#f59e0b', 12);
            audio.playEnemyHit();
            proj.lifetime = 0;
            break;
          }
        }
      }

      // Check collision with terrain
      const tX = Math.floor(proj.x / TILE_SIZE);
      const tY = Math.floor(proj.y / TILE_SIZE);
      if (this.isSolidTile(this.getTile(tX, tY))) {
        proj.lifetime = 0;
      }

      if (proj.lifetime <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateWeatherAndAmbientParticles() {
    this.weatherTicker++;
    const p = this.player;

    // Weather / Ambient generation runs every few frames
    if (this.weatherTicker % 3 === 0 && this.particles.length < 220) {
      const spreadX = 480;
      const spreadY = 320;
      const rx = p.x + (Math.random() - 0.5) * spreadX * 2;
      const ry = p.y + (Math.random() - 0.5) * spreadY * 2;
      const rTileX = Math.floor(rx / TILE_SIZE);
      const rTileY = Math.floor(ry / TILE_SIZE);

      if (rTileX >= 0 && rTileX < WORLD_WIDTH && rTileY >= 0 && rTileY < WORLD_HEIGHT) {
        // 1. Ash Storm weather particles
        if (this.world.isAshStorm) {
          this.particles.push({
            x: rx + 300,
            y: ry - 100 + Math.random() * 200,
            vx: -(7.5 + Math.random() * 6.5),
            vy: 2.2 + Math.random() * 2.8,
            color: Math.random() > 0.4 ? '#f59e0b' : '#ef4444',
            size: Math.random() * 3 + 2,
            alpha: 0.85,
            decay: 0.02,
            glow: true,
            kind: 'ash',
          });
        }

        // 2. Underground Caverns (Soft cave dust motes & dripping stalactite water)
        if (rTileY >= SURFACE_BOTTOM && rTileY < UNDERGROUND_BOTTOM) {
          // Check for cave dust in open air
          if (this.getTile(rTileX, rTileY) === TileType.AIR && Math.random() < 0.6) {
            this.particles.push({
              x: rx,
              y: ry,
              vx: (Math.random() - 0.5) * 0.35,
              vy: -0.15 - Math.random() * 0.2,
              color: Math.random() > 0.5 ? '#94a3b8' : '#64748b',
              size: Math.random() * 2.2 + 1.2,
              alpha: 0.4,
              decay: 0.005,
              kind: 'cave_dust',
            });
          }

          // Ceiling water drips (stalactite droplets)
          if (
            rTileY > 1 &&
            this.isSolidTile(this.getTile(rTileX, rTileY - 1)) &&
            this.getTile(rTileX, rTileY) === TileType.AIR &&
            Math.random() < 0.2
          ) {
            this.particles.push({
              x: rTileX * TILE_SIZE + 6 + Math.random() * 12,
              y: rTileY * TILE_SIZE,
              vx: (Math.random() - 0.5) * 0.1,
              vy: 0.8,
              color: '#38bdf8',
              size: 2.2,
              alpha: 0.85,
              decay: 0.008,
              kind: 'water_drip',
              splashOnGround: true,
            });
          }

          // Crystal sparkles near ores
          const nearbyTile = this.getTile(rTileX, rTileY);
          if (
            (nearbyTile === TileType.EMBER_CRYSTAL || nearbyTile === TileType.SILVER_ORE) &&
            Math.random() < 0.35
          ) {
            this.particles.push({
              x: rTileX * TILE_SIZE + Math.random() * TILE_SIZE,
              y: rTileY * TILE_SIZE + Math.random() * TILE_SIZE,
              vx: (Math.random() - 0.5) * 0.3,
              vy: -0.3,
              color: nearbyTile === TileType.EMBER_CRYSTAL ? '#f59e0b' : '#38bdf8',
              size: 2.6,
              alpha: 0.9,
              decay: 0.025,
              glow: true,
              kind: 'crystal_sparkle',
            });
          }
        }

        // 3. Surface weather effects (Pollen/leaves during day, fireflies at night)
        else if (rTileY < SURFACE_BOTTOM && this.getTile(rTileX, rTileY) === TileType.AIR) {
          const isNight = this.world.ambientTime > 1300 && this.world.ambientTime < 2300;
          if (isNight && Math.random() < 0.35) {
            // Firefly
            this.particles.push({
              x: rx,
              y: ry,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.4,
              color: '#a3e635',
              size: 2.4,
              alpha: 0.8,
              decay: 0.008,
              glow: true,
              kind: 'firefly',
            });
          } else if (!isNight && Math.random() < 0.4) {
            // Wind leaf / glowing pollen mote
            this.particles.push({
              x: rx,
              y: ry,
              vx: 0.7 + Math.random() * 0.8,
              vy: 0.3 + Math.random() * 0.3,
              color: Math.random() > 0.5 ? '#fef08a' : '#86efac',
              size: Math.random() * 2 + 1.4,
              alpha: 0.65,
              decay: 0.007,
              kind: 'leaf',
            });
          }
        }

        // 4. Deep Ruins (Ancient burning embers & ash)
        else if (rTileY >= UNDERGROUND_BOTTOM && this.getTile(rTileX, rTileY) === TileType.AIR) {
          if (Math.random() < 0.45) {
            this.particles.push({
              x: rx,
              y: ry,
              vx: (Math.random() - 0.5) * 0.5,
              vy: -0.6 - Math.random() * 0.8,
              color: Math.random() > 0.6 ? '#f97316' : '#8b5cf6',
              size: Math.random() * 2.8 + 1.5,
              alpha: 0.8,
              decay: 0.015,
              glow: true,
              kind: 'ember',
            });
          }
        }
      }
    }

    // 5. Embers drifting upwards from placed Torches and Braziers
    if (this.weatherTicker % 4 === 0 && this.particles.length < 240) {
      const pTileX = Math.floor(p.x / TILE_SIZE);
      const pTileY = Math.floor(p.y / TILE_SIZE);
      const searchRadius = 14;
      for (let ox = -searchRadius; ox <= searchRadius; ox += 2) {
        for (let oy = -searchRadius; oy <= searchRadius; oy += 2) {
          const tx = pTileX + ox;
          const ty = pTileY + oy;
          if (tx < 0 || tx >= WORLD_WIDTH || ty < 0 || ty >= WORLD_HEIGHT) continue;
          const tile = this.getTile(tx, ty);
          if ((tile === TileType.TORCH || tile === TileType.EMBER_BRAZIER) && Math.random() < 0.35) {
            this.particles.push({
              x: (tx + 0.5) * TILE_SIZE + (Math.random() - 0.5) * 6,
              y: ty * TILE_SIZE + 4,
              vx: (Math.random() - 0.5) * 0.4,
              vy: -0.5 - Math.random() * 0.7,
              color: Math.random() > 0.4 ? '#f59e0b' : '#fbbf24',
              size: Math.random() * 2 + 1,
              alpha: 0.9,
              decay: 0.02,
              glow: true,
              kind: 'ember',
            });
          }
        }
      }
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Kind specific physics
      if (p.kind === 'water_drip') {
        p.vy += 0.16; // gravity
        p.y += p.vy;
        p.x += p.vx;

        // Ground splash check
        const tX = Math.floor(p.x / TILE_SIZE);
        const tY = Math.floor(p.y / TILE_SIZE);
        if (this.isSolidTile(this.getTile(tX, tY))) {
          // Splash into 2 droplet sparks
          if (p.splashOnGround && this.particles.length < 240) {
            for (let s = 0; s < 2; s++) {
              this.particles.push({
                x: p.x,
                y: tY * TILE_SIZE - 2,
                vx: (s === 0 ? -1 : 1) * (Math.random() * 1.2 + 0.5),
                vy: -Math.random() * 1.5 - 0.6,
                color: '#7dd3fc',
                size: 1.5,
                alpha: 0.75,
                decay: 0.08,
              });
            }
          }
          this.particles.splice(i, 1);
          continue;
        }
      } else if (p.kind === 'cave_dust') {
        p.x += Math.sin((this.world.ambientTime + p.y) * 0.06) * 0.35 + p.vx;
        p.y += p.vy;
      } else if (p.kind === 'leaf') {
        p.x += p.vx;
        p.y += p.vy + Math.sin(this.world.ambientTime * 0.08 + p.x * 0.02) * 0.4;
      } else if (p.kind === 'firefly') {
        p.vx += (Math.random() - 0.5) * 0.2;
        p.vy += (Math.random() - 0.5) * 0.2;
        p.vx = Math.max(-1.2, Math.min(1.2, p.vx));
        p.vy = Math.max(-1.0, Math.min(1.0, p.vy));
        p.x += p.vx;
        p.y += p.vy;
      } else {
        p.x += p.vx;
        p.y += p.vy;
      }

      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts() {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 0.6;
      t.lifetime -= 0.025;
      if (t.lifetime <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      id: `text_${Date.now()}_${Math.random()}`,
      x,
      y,
      text,
      color,
      lifetime: 1,
    });
  }

  private spawnTileDebris(tileX: number, tileY: number, tile: TileType) {
    const color =
      tile === TileType.DIRT
        ? '#78350f'
        : tile === TileType.COPPER_ORE
        ? '#b45309'
        : tile === TileType.SILVER_ORE
        ? '#cbd5e1'
        : tile === TileType.EMBER_CRYSTAL
        ? '#f59e0b'
        : '#64748b';

    // Solid chunk debris
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: (tileX + 0.5) * TILE_SIZE,
        y: (tileY + 0.5) * TILE_SIZE,
        vx: (Math.random() - 0.5) * 3.5,
        vy: (Math.random() - 0.5) * 3.5 - 1.2,
        color,
        size: Math.random() * 3 + 2,
        alpha: 1,
        decay: 0.04,
      });
    }

    // Incandescent hot sparks when pickaxe strikes block
    const isOre =
      tile === TileType.COPPER_ORE ||
      tile === TileType.SILVER_ORE ||
      tile === TileType.EMBER_CRYSTAL;
    const sparkCount = isOre ? 10 : 5;

    for (let s = 0; s < sparkCount; s++) {
      const sparkAngle = Math.random() * Math.PI * 2;
      const sparkSpeed = Math.random() * 4.0 + 2.0;
      this.particles.push({
        x: (tileX + 0.5) * TILE_SIZE,
        y: (tileY + 0.5) * TILE_SIZE,
        vx: Math.cos(sparkAngle) * sparkSpeed,
        vy: Math.sin(sparkAngle) * sparkSpeed - 0.8,
        color: tile === TileType.EMBER_CRYSTAL ? '#fef08a' : isOre ? '#fbbf24' : '#f59e0b',
        size: Math.random() * 2 + 1.2,
        alpha: 1,
        decay: 0.05,
        glow: true,
        kind: 'spark',
      });
    }
  }

  private spawnDust(x: number, y: number, count: number = 6) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2.8,
        vy: -Math.random() * 1.4,
        color: '#94a3b8',
        size: Math.random() * 2.5 + 1.5,
        alpha: 0.8,
        decay: 0.035,
      });
    }
  }

  private spawnBloodPuff(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        color: '#475569',
        size: Math.random() * 3 + 1,
        alpha: 0.9,
        decay: 0.04,
      });
    }
  }

  private spawnLightBurst(x: number, y: number, color: string, count: number = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 2,
        alpha: 1,
        decay: 0.03,
        glow: true,
      });
    }
  }

  // === COLLISION RESOLUTION ===

  private checkTileCollision(x: number, y: number, w: number, h: number): boolean {
    const startX = Math.floor(x / TILE_SIZE);
    const endX = Math.floor((x + w) / TILE_SIZE);
    const startY = Math.floor(y / TILE_SIZE);
    const endY = Math.floor((y + h) / TILE_SIZE);

    for (let ty = startY; ty <= endY; ty++) {
      for (let tx = startX; tx <= endX; tx++) {
        if (this.isSolidTile(this.getTile(tx, ty))) {
          return true;
        }
      }
    }
    return false;
  }

  private resolveHorizontalCollision(): boolean {
    const p = this.player;
    const startY = Math.floor(p.y / TILE_SIZE);
    const endY = Math.floor((p.y + p.height - 1) / TILE_SIZE);

    if (p.vx > 0) {
      const targetTileX = Math.floor((p.x + p.width) / TILE_SIZE);
      for (let ty = startY; ty <= endY; ty++) {
        if (this.isSolidTile(this.getTile(targetTileX, ty))) {
          p.x = targetTileX * TILE_SIZE - p.width;
          return true;
        }
      }
    } else if (p.vx < 0) {
      const targetTileX = Math.floor(p.x / TILE_SIZE);
      for (let ty = startY; ty <= endY; ty++) {
        if (this.isSolidTile(this.getTile(targetTileX, ty))) {
          p.x = (targetTileX + 1) * TILE_SIZE;
          return true;
        }
      }
    }
    return false;
  }

  private resolveVerticalCollision(): boolean {
    const p = this.player;
    const startX = Math.floor((p.x + 2) / TILE_SIZE);
    const endX = Math.floor((p.x + p.width - 2) / TILE_SIZE);

    if (p.vy > 0) {
      const targetTileY = Math.floor((p.y + p.height) / TILE_SIZE);
      for (let tx = startX; tx <= endX; tx++) {
        const tile = this.getTile(tx, targetTileY);
        // Solid or Platform from above
        if (this.isSolidTile(tile) || (this.isPlatformTile(tile) && p.y + p.height - p.vy <= targetTileY * TILE_SIZE + 4)) {
          p.y = targetTileY * TILE_SIZE - p.height;
          return true;
        }
      }
    } else if (p.vy < 0) {
      const targetTileY = Math.floor(p.y / TILE_SIZE);
      for (let tx = startX; tx <= endX; tx++) {
        if (this.isSolidTile(this.getTile(tx, targetTileY))) {
          p.y = (targetTileY + 1) * TILE_SIZE;
          return true;
        }
      }
    }
    return false;
  }

  private resolveEnemyCollision(e: Enemy) {
    const startX = Math.floor(e.x / TILE_SIZE);
    const endX = Math.floor((e.x + e.width) / TILE_SIZE);
    const startY = Math.floor(e.y / TILE_SIZE);
    const endY = Math.floor((e.y + e.height) / TILE_SIZE);

    for (let ty = startY; ty <= endY; ty++) {
      for (let tx = startX; tx <= endX; tx++) {
        if (this.isSolidTile(this.getTile(tx, ty))) {
          if (e.vy > 0) {
            e.y = ty * TILE_SIZE - e.height;
            e.vy = 0;
            e.isGrounded = true;
          }
        }
      }
    }
  }
}
