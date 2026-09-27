import { GameEngine } from './engine';
import { SaveSlotData, SaveSlotMeta } from '../types/game';
import { LayerZone } from '../types/game';

export const SAVE_SLOT_KEYS = ['slot_1', 'slot_2', 'slot_3'] as const;
export type SaveSlotId = typeof SAVE_SLOT_KEYS[number];

const ACTIVE_SLOT_STORAGE_KEY = 'kulyurdu_active_slot';
const LEGACY_SAVE_KEY = 'kulyurdu_save';

export class SaveManager {
  public static getActiveSlotId(): SaveSlotId {
    const saved = localStorage.getItem(ACTIVE_SLOT_STORAGE_KEY);
    if (saved && (SAVE_SLOT_KEYS as readonly string[]).includes(saved)) {
      return saved as SaveSlotId;
    }
    return 'slot_1';
  }

  public static setActiveSlotId(slotId: SaveSlotId): void {
    localStorage.setItem(ACTIVE_SLOT_STORAGE_KEY, slotId);
  }

  public static getAllSlotMetas(): SaveSlotMeta[] {
    // Check if legacy save exists and slot 1 is empty, migrate legacy save to slot 1
    this.checkMigrateLegacy();

    return SAVE_SLOT_KEYS.map((slotId, index) => {
      const slotNum = index + 1;
      const raw = localStorage.getItem(`kulyurdu_${slotId}`);
      if (!raw) {
        return {
          id: slotId,
          name: `Slot ${slotNum}`,
          savedAt: null,
          zone: 'Boş Yuva',
          hp: 0,
          maxHp: 5,
          ash: 0,
          maxAsh: 100,
          purificationPercent: 0,
          playTimeMinutes: 0,
          exists: false,
        };
      }

      try {
        const data: SaveSlotData = JSON.parse(raw);
        return {
          ...data.meta,
          id: slotId,
          name: data.meta?.name || `Slot ${slotNum}`,
          exists: true,
        };
      } catch {
        return {
          id: slotId,
          name: `Slot ${slotNum}`,
          savedAt: null,
          zone: 'Bozuk Kayıt',
          hp: 0,
          maxHp: 5,
          ash: 0,
          maxAsh: 100,
          purificationPercent: 0,
          playTimeMinutes: 0,
          exists: false,
        };
      }
    });
  }

  public static saveToSlot(slotId: SaveSlotId, engine: GameEngine): boolean {
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      const zoneName =
        engine.currentZone === LayerZone.SURFACE
          ? 'Yüzey: Yıkık Orman'
          : engine.currentZone === LayerZone.UNDERGROUND
          ? 'Yeraltı Mağaraları'
          : 'Derin Harabeler';

      const slotIndex = SAVE_SLOT_KEYS.indexOf(slotId);
      const slotNum = slotIndex !== -1 ? slotIndex + 1 : 1;

      const meta: SaveSlotMeta = {
        id: slotId,
        name: `Slot ${slotNum}`,
        savedAt: dateStr,
        zone: zoneName,
        hp: engine.player.stats.hp,
        maxHp: engine.player.stats.maxHp,
        ash: Math.floor(engine.player.stats.ash),
        maxAsh: engine.player.stats.maxAsh,
        purificationPercent: engine.purificationPercent,
        playTimeMinutes: Math.floor((engine.playTimeTicks || 0) / 3600),
        exists: true,
      };

      const saveData: SaveSlotData = {
        meta,
        playerStats: JSON.parse(JSON.stringify(engine.player.stats)),
        inventory: JSON.parse(JSON.stringify(engine.player.inventory)),
        x: engine.player.x,
        y: engine.player.y,
        purifiedMap: Array.from(engine.world.purifiedMap),
        lightMap: Array.from(engine.world.lightMap),
        foliageMap: Array.from(engine.world.foliageMap),
        tiles: Array.from(engine.world.tiles),
        wallTiles: Array.from(engine.world.wallTiles),
        achievements: JSON.parse(JSON.stringify(engine.achievements || {})),
        skills: JSON.parse(JSON.stringify(engine.unlockedSkills || {})),
        ambientTime: engine.world.ambientTime,
      };

      localStorage.setItem(`kulyurdu_${slotId}`, JSON.stringify(saveData));
      this.setActiveSlotId(slotId);
      return true;
    } catch (e) {
      console.error('Save to slot failed', e);
      return false;
    }
  }

  public static loadFromSlot(slotId: SaveSlotId, engine: GameEngine): boolean {
    try {
      const raw = localStorage.getItem(`kulyurdu_${slotId}`);
      if (!raw) return false;

      const data: SaveSlotData = JSON.parse(raw);
      if (data.playerStats) engine.player.stats = data.playerStats;
      if (data.inventory) engine.player.inventory = data.inventory;
      if (typeof data.x === 'number') engine.player.x = data.x;
      if (typeof data.y === 'number') engine.player.y = data.y;

      if (data.purifiedMap && data.purifiedMap.length === engine.world.purifiedMap.length) {
        engine.world.purifiedMap = new Uint8Array(data.purifiedMap);
      }
      if (data.lightMap && data.lightMap.length === engine.world.lightMap.length) {
        engine.world.lightMap = new Uint8Array(data.lightMap);
      }
      if (data.foliageMap && data.foliageMap.length === engine.world.foliageMap.length) {
        engine.world.foliageMap = new Uint8Array(data.foliageMap);
      }
      if (data.tiles && data.tiles.length === engine.world.tiles.length) {
        engine.world.tiles = new Uint8Array(data.tiles);
      }
      if (data.wallTiles && data.wallTiles.length === engine.world.wallTiles.length) {
        engine.world.wallTiles = new Uint8Array(data.wallTiles);
      }

      if (data.achievements) {
        engine.achievements = data.achievements;
      }

      if (data.skills) {
        engine.unlockedSkills = data.skills;
      }

      if (typeof data.ambientTime === 'number') {
        engine.world.ambientTime = data.ambientTime;
      }

      engine.recalculatePurification();
      this.setActiveSlotId(slotId);
      return true;
    } catch (e) {
      console.error('Load from slot failed', e);
      return false;
    }
  }

  public static deleteSlot(slotId: SaveSlotId): boolean {
    try {
      localStorage.removeItem(`kulyurdu_${slotId}`);
      return true;
    } catch {
      return false;
    }
  }

  private static checkMigrateLegacy(): void {
    try {
      const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
      const slot1 = localStorage.getItem('kulyurdu_slot_1');
      if (legacy && !slot1) {
        const parsed = JSON.parse(legacy);
        const meta: SaveSlotMeta = {
          id: 'slot_1',
          name: 'Slot 1 (Eski Kayıt)',
          savedAt: 'Önceki Kayıt',
          zone: 'Yüzey',
          hp: parsed.playerStats?.hp || 5,
          maxHp: parsed.playerStats?.maxHp || 5,
          ash: parsed.playerStats?.ash || 40,
          maxAsh: parsed.playerStats?.maxAsh || 100,
          purificationPercent: 0,
          playTimeMinutes: 10,
          exists: true,
        };
        const migrated: SaveSlotData = {
          meta,
          ...parsed,
        };
        localStorage.setItem('kulyurdu_slot_1', JSON.stringify(migrated));
      }
    } catch {
      // ignore
    }
  }
}
