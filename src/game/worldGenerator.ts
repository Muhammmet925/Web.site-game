import {
  DEEP_RUINS_BOTTOM,
  SURFACE_BOTTOM,
  TILE_SIZE,
  UNDERGROUND_BOTTOM,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants';
import { Enemy, TileType, WorldData } from '../types/game';

// Deterministic noise helper for reproducible cave tunnels
function pseudoNoise(x: number, y: number, seed: number = 42): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, scale: number = 0.08, seed: number = 42): number {
  const x1 = Math.floor(x * scale);
  const y1 = Math.floor(y * scale);
  const fx = x * scale - x1;
  const fy = y * scale - y1;

  const s00 = pseudoNoise(x1, y1, seed);
  const s10 = pseudoNoise(x1 + 1, y1, seed);
  const s01 = pseudoNoise(x1, y1 + 1, seed);
  const s11 = pseudoNoise(x1 + 1, y1 + 1, seed);

  // Smooth interpolation
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const top = s00 * (1 - sx) + s10 * sx;
  const bot = s01 * (1 - sx) + s11 * sx;
  return top * (1 - sy) + bot * sy;
}

export function generateWorld(): { world: WorldData; enemies: Enemy[]; spawnX: number; spawnY: number } {
  const tiles = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  const wallTiles = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  const lightMap = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  const purifiedMap = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  const foliageMap = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);

  const setTile = (x: number, y: number, type: TileType) => {
    if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
      tiles[y * WORLD_WIDTH + x] = type;
    }
  };

  const getTile = (x: number, y: number): TileType => {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return TileType.OBSIDIAN;
    return tiles[y * WORLD_WIDTH + x];
  };

  const setWall = (x: number, y: number, type: TileType) => {
    if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
      wallTiles[y * WORLD_WIDTH + x] = type;
    }
  };

  // 1. Generate Surface Layer (Y: 0 to SURFACE_BOTTOM)
  // Rolling terrain height around Y = 38 to 44
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const surfaceNoise = Math.sin(x * 0.05) * 4 + Math.cos(x * 0.12) * 2;
    const groundY = Math.floor(40 + surfaceNoise);

    for (let y = 0; y < SURFACE_BOTTOM; y++) {
      if (y > groundY) {
        if (y === groundY + 1) {
          setTile(x, y, TileType.GRASS_DIRT);
        } else if (y < groundY + 5) {
          setTile(x, y, TileType.DIRT);
        } else {
          setTile(x, y, TileType.STONE);
        }
      } else {
        setTile(x, y, TileType.AIR);
      }
    }
  }

  // 2. Generate Underground Caverns (Y: SURFACE_BOTTOM to UNDERGROUND_BOTTOM)
  // Terraria style cellular caves + ore veins
  for (let y = SURFACE_BOTTOM; y < UNDERGROUND_BOTTOM; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const caveDensity = smoothNoise(x, y, 0.07, 101);
      const isCave = caveDensity > 0.48;

      if (isCave) {
        setTile(x, y, TileType.AIR);
        // Cave background walls
        setWall(x, y, TileType.STONE);
      } else {
        // Mineral veins
        const oreNoise = smoothNoise(x, y, 0.16, 777);
        if (oreNoise > 0.72) {
          setTile(x, y, TileType.EMBER_CRYSTAL);
        } else if (oreNoise > 0.62) {
          setTile(x, y, TileType.SILVER_ORE);
        } else if (oreNoise > 0.52) {
          setTile(x, y, TileType.COPPER_ORE);
        } else {
          setTile(x, y, y % 2 === 0 ? TileType.STONE : TileType.ASH_ROCK);
        }
      }
    }
  }

  // 3. Generate Deep Ruins Layer (Y: UNDERGROUND_BOTTOM to DEEP_RUINS_BOTTOM)
  // Hollow Knight style gothic halls, obsidian pillars, boss arena
  for (let y = UNDERGROUND_BOTTOM; y < DEEP_RUINS_BOTTOM; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      // Base obsidian bedrock
      setTile(x, y, TileType.OBSIDIAN);
      setWall(x, y, TileType.ANCIENT_BRICK);
    }
  }

  // Carve out large gothic halls and corridors in Deep Ruins
  const halls = [
    { x1: 25, y1: 158, x2: 120, y2: 178 },
    { x1: 110, y1: 172, x2: 130, y2: 210 },
    { x1: 130, y1: 182, x2: 290, y2: 214 }, // Grand Boss Chamber of Ignis
    { x1: 140, y1: 156, x2: 240, y2: 172 }, // Ancient Crypt of Flame
  ];

  halls.forEach((hall) => {
    for (let y = hall.y1; y <= hall.y2; y++) {
      for (let x = hall.x1; x <= hall.x2; x++) {
        setTile(x, y, TileType.AIR);
      }
    }
  });

  // Add vertical shafts connecting Surface -> Caverns -> Deep Ruins
  for (let y = 35; y < 170; y++) {
    for (let x = 78; x <= 82; x++) {
      setTile(x, y, TileType.AIR);
      if (y % 6 === 0) {
        setTile(x, y, TileType.PLATFORM);
      }
    }
  }
  for (let y = 42; y < 185; y++) {
    for (let x = 205; x <= 209; x++) {
      setTile(x, y, TileType.AIR);
      if (y % 6 === 0) {
        setTile(x, y, TileType.PLATFORM);
      }
    }
  }

  // Build Surface Handcrafted Features:
  // Starting Haven / Ruined Sanctuary (X: 38 to 52)
  for (let x = 38; x <= 52; x++) {
    // Floor
    setTile(x, 42, TileType.WOOD_PLANK);
    // Back wall
    for (let y = 36; y <= 41; y++) {
      setWall(x, y, TileType.WOOD_WALL);
    }
  }
  // Sanctuary Pillars & Roof
  for (let y = 36; y <= 41; y++) {
    setTile(38, y, TileType.STONE);
    setTile(52, y, TileType.STONE);
  }
  for (let x = 38; x <= 52; x++) {
    setTile(x, 35, TileType.ANCIENT_BRICK);
  }
  // Starting Hearth / Light Brazier at x=45, y=41
  setTile(45, 41, TileType.EMBER_BRAZIER);
  setTile(40, 39, TileType.TORCH);
  setTile(50, 39, TileType.TORCH);

  // Surface Great Ancient Trees (Ori aesthetic)
  const treeLocations = [20, 65, 110, 150, 195, 240, 285];
  treeLocations.forEach((tx) => {
    const groundY = 40;
    // Trunk
    for (let ty = groundY - 10; ty < groundY; ty++) {
      setTile(tx, ty, TileType.WOOD_TRUNK);
      setTile(tx + 1, ty, TileType.WOOD_TRUNK);
    }
    // Canopy
    for (let cx = tx - 4; cx <= tx + 5; cx++) {
      for (let cy = groundY - 14; cy <= groundY - 9; cy++) {
        if (Math.abs(cx - tx) + Math.abs(cy - (groundY - 11)) < 6) {
          setTile(cx, cy, TileType.LEAVES);
        }
      }
    }
    // Branch platforms
    setTile(tx - 3, groundY - 5, TileType.PLATFORM);
    setTile(tx - 2, groundY - 5, TileType.PLATFORM);
    setTile(tx + 2, groundY - 7, TileType.PLATFORM);
    setTile(tx + 3, groundY - 7, TileType.PLATFORM);
  });

  // Deep Ruins Boss Chamber (X: 130 to 290, Y: 182 to 214)
  // Pillars for pogo jumping & combat dodging
  for (let px = 155; px <= 265; px += 22) {
    for (let py = 196; py <= 213; py++) {
      setTile(px, py, TileType.ANCIENT_BRICK);
    }
    setTile(px - 1, 196, TileType.PLATFORM);
    setTile(px + 1, 196, TileType.PLATFORM);
    setTile(px, 195, TileType.TORCH);
  }

  // Pre-place Ancient Braziers across the world to reward exploration
  const ancientBrazierSpots = [
    { x: 110, y: 38 },  // Surface windy shrine
    { x: 235, y: 39 },  // Surface eastern watchtower
    { x: 45, y: 105 },  // Mid cave crystal grotto
    { x: 165, y: 125 }, // Deep subterranean crystal lake
    { x: 210, y: 211 }, // Center of boss hall
  ];
  ancientBrazierSpots.forEach((spot) => {
    setTile(spot.x, spot.y, TileType.EMBER_BRAZIER);
  });

  // Set initial spawn point near the starting hearth
  const spawnX = 43 * TILE_SIZE;
  const spawnY = 40 * TILE_SIZE;

  // Initialize Light & Purification Grid
  // Initial light around starting haven (X: 45, Y: 41)
  const startLightTileX = 45;
  const startLightTileY = 41;
  const initRadius = 14;

  for (let dy = -initRadius; dy <= initRadius; dy++) {
    for (let dx = -initRadius; dx <= initRadius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= initRadius) {
        const lx = startLightTileX + dx;
        const ly = startLightTileY + dy;
        if (lx >= 0 && lx < WORLD_WIDTH && ly >= 0 && ly < WORLD_HEIGHT) {
          const intensity = Math.max(0, Math.floor((1 - dist / initRadius) * 100));
          const idx = ly * WORLD_WIDTH + lx;
          lightMap[idx] = Math.max(lightMap[idx], intensity);
          purifiedMap[idx] = 1; // Mark as permanently purified

          // Procedural starting foliage on top of solid grass or dirt tiles
          const tileBelow = ly < WORLD_HEIGHT - 1 ? tiles[(ly + 1) * WORLD_WIDTH + lx] : TileType.AIR;
          const currentTile = tiles[idx];
          if (currentTile === TileType.AIR && (tileBelow === TileType.GRASS_DIRT || tileBelow === TileType.DIRT || tileBelow === TileType.WOOD_PLANK)) {
            const r = pseudoNoise(lx, ly, 999);
            if (r > 0.65) {
              foliageMap[idx] = 3; // Ember Flower
            } else if (r > 0.35) {
              foliageMap[idx] = 2; // Lush Grass
            } else if (r > 0.15) {
              foliageMap[idx] = 1; // Sprouts
            }
          }
        }
      }
    }
  }

  // Seed initial enemies
  const enemies: Enemy[] = [
    // Surface Ash Crawlers
    {
      id: 'crawler_1',
      type: 'crawler',
      name: 'Kül Sürüngeni',
      x: 25 * TILE_SIZE,
      y: 38 * TILE_SIZE,
      vx: 1,
      vy: 0,
      width: 26,
      height: 20,
      hp: 35,
      maxHp: 35,
      damage: 10,
      isGrounded: true,
      facing: 1,
      state: 'patrol',
      attackCooldown: 0,
      staggerTimer: 0,
      inLightArea: false,
    },
    {
      id: 'crawler_2',
      type: 'crawler',
      name: 'Kül Sürüngeni',
      x: 70 * TILE_SIZE,
      y: 38 * TILE_SIZE,
      vx: -1,
      vy: 0,
      width: 26,
      height: 20,
      hp: 35,
      maxHp: 35,
      damage: 10,
      isGrounded: true,
      facing: -1,
      state: 'patrol',
      attackCooldown: 0,
      staggerTimer: 0,
      inLightArea: false,
    },
    {
      id: 'crawler_3',
      type: 'crawler',
      name: 'Kül Sürüngeni',
      x: 130 * TILE_SIZE,
      y: 38 * TILE_SIZE,
      vx: 1,
      vy: 0,
      width: 26,
      height: 20,
      hp: 35,
      maxHp: 35,
      damage: 10,
      isGrounded: true,
      facing: 1,
      state: 'patrol',
      attackCooldown: 0,
      staggerTimer: 0,
      inLightArea: false,
    },
    // Cavern Flying Stingers (Hollow Knight primal aspid/spore flyers)
    {
      id: 'stinger_1',
      type: 'stinger',
      name: 'Gölge İğnecisi',
      x: 60 * TILE_SIZE,
      y: 75 * TILE_SIZE,
      vx: 0,
      vy: 0,
      width: 22,
      height: 22,
      hp: 28,
      maxHp: 28,
      damage: 14,
      isGrounded: false,
      facing: 1,
      state: 'patrol',
      attackCooldown: 0,
      staggerTimer: 0,
      inLightArea: false,
    },
    {
      id: 'stinger_2',
      type: 'stinger',
      name: 'Gölge İğnecisi',
      x: 115 * TILE_SIZE,
      y: 85 * TILE_SIZE,
      vx: 0,
      vy: 0,
      width: 22,
      height: 22,
      hp: 28,
      maxHp: 28,
      damage: 14,
      isGrounded: false,
      facing: -1,
      state: 'patrol',
      attackCooldown: 0,
      staggerTimer: 0,
      inLightArea: false,
    },
    // Cavern Shadow Wraiths
    {
      id: 'wraith_1',
      type: 'wraith',
      name: 'Karanlık Tayf',
      x: 35 * TILE_SIZE,
      y: 90 * TILE_SIZE,
      vx: 0,
      vy: 0,
      width: 28,
      height: 36,
      hp: 60,
      maxHp: 60,
      damage: 18,
      isGrounded: false,
      facing: 1,
      state: 'patrol',
      attackCooldown: 0,
      staggerTimer: 0,
      inLightArea: false,
    },
    // Deep Ruins Shadow Brute
    {
      id: 'brute_1',
      type: 'brute',
      name: 'Alevdoğan Zırhlısı',
      x: 75 * TILE_SIZE,
      y: 168 * TILE_SIZE,
      vx: 0,
      vy: 0,
      width: 38,
      height: 48,
      hp: 120,
      maxHp: 120,
      damage: 26,
      isGrounded: true,
      facing: 1,
      state: 'patrol',
      attackCooldown: 0,
      staggerTimer: 0,
      inLightArea: false,
    },
    // BOSS: Ignis, The Fallen Flameborn
    {
      id: 'boss_ignis',
      type: 'boss_ignis',
      name: 'Kül Muhafızı: Ignis',
      x: 230 * TILE_SIZE,
      y: 206 * TILE_SIZE,
      vx: 0,
      vy: 0,
      width: 52,
      height: 64,
      hp: 450,
      maxHp: 450,
      damage: 24,
      isGrounded: true,
      facing: -1,
      state: 'boss_phase1',
      attackCooldown: 90,
      staggerTimer: 0,
      inLightArea: false,
    },
  ];

  const world: WorldData = {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    tiles,
    wallTiles,
    lightMap,
    purifiedMap,
    foliageMap,
    ambientTime: 400, // Dawn/morning start
    isAshStorm: false,
    ashStormIntensity: 0,
    stormDuration: 0,
  };

  return { world, enemies, spawnX, spawnY };
}
