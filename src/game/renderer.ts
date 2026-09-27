import {
  DEEP_RUINS_BOTTOM,
  SURFACE_BOTTOM,
  TILE_SIZE,
  UNDERGROUND_BOTTOM,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants';
import { GameEngine } from './engine';
import { Enemy, TileType } from '../types/game';

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public cameraX: number = 0;
  public cameraY: number = 0;

  // Offscreen light canvas for hardware-accelerated 2D dynamic lighting
  private lightCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;

    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d')!;
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.lightCanvas.width = width;
    this.lightCanvas.height = height;
  }

  public render(engine: GameEngine, mouseScreen: { x: number; y: number }) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Smooth camera following player
    const targetCamX = engine.player.x + engine.player.width / 2 - width / 2;
    const targetCamY = engine.player.y + engine.player.height / 2 - height / 2;
    this.cameraX += (targetCamX - this.cameraX) * 0.12;
    this.cameraY += (targetCamY - this.cameraY) * 0.12;

    // Constrain camera within world boundaries
    const maxCamX = WORLD_WIDTH * TILE_SIZE - width;
    const maxCamY = WORLD_HEIGHT * TILE_SIZE - height;
    this.cameraX = Math.max(0, Math.min(maxCamX, this.cameraX));
    this.cameraY = Math.max(0, Math.min(maxCamY, this.cameraY));

    // Apply Hollow Knight camera shake effect
    if (engine.cameraShake > 0) {
      const shakeAmp = engine.cameraShake;
      this.cameraX += (Math.random() - 0.5) * shakeAmp * 2;
      this.cameraY += (Math.random() - 0.5) * shakeAmp * 2;
      engine.cameraShake *= 0.84;
      if (engine.cameraShake < 0.15) engine.cameraShake = 0;
    }

    // Calculate tile render bounds
    const startTileX = Math.max(0, Math.floor(this.cameraX / TILE_SIZE) - 1);
    const endTileX = Math.min(WORLD_WIDTH - 1, Math.ceil((this.cameraX + width) / TILE_SIZE) + 1);
    const startTileY = Math.max(0, Math.floor(this.cameraY / TILE_SIZE) - 1);
    const endTileY = Math.min(WORLD_HEIGHT - 1, Math.ceil((this.cameraY + height) / TILE_SIZE) + 1);

    // 1. Draw Atmospheric Parallax Background
    this.drawParallaxBackground(engine);

    // 2. Draw World Walls (Background Layer)
    this.drawWalls(engine, startTileX, endTileX, startTileY, endTileY);

    // 3. Draw World Tiles (Foreground Solid Layer)
    this.drawTiles(engine, startTileX, endTileX, startTileY, endTileY);

    // 3.5 Draw Procedural Foliage (Grass, Flowers, Spores healing the land)
    this.drawProceduralFoliage(engine, startTileX, endTileX, startTileY, endTileY);

    // 3.6 Draw Purified Zone Radial Glow Effect ("Light leaves a mark")
    this.drawPurifiedRadialAura(engine, startTileX, endTileX, startTileY, endTileY);

    // 4. Draw NPCs
    this.drawNPCs(engine);

    // 5. Draw Enemies & Boss
    this.drawEnemies(engine);

    // 6. Draw Player (Hooded Ash Child with glowing eyes, cape, sword)
    this.drawPlayer(engine);

    // 7. Draw Projectiles & Particle Effects
    this.drawProjectiles(engine);
    this.drawParticles(engine);

    // 8. Dynamic 2D Lighting Pass ("Yaktığın Işık, Kalıcı İz Bırakır")
    this.drawDynamicLighting(engine, width, height);

    // 8.5 Draw Ash Storm Weather FX (Wind, embers, storm visibility drop)
    this.drawAshStormWeather(engine, width, height);

    // 9. Draw Grid Cursor & Interaction Target
    this.drawCursorHighlight(engine, mouseScreen);

    // 10. Draw Floating Damage & Notification Texts
    this.drawFloatingTexts(engine);
  }

  // === 1. PARALLAX BACKGROUNDS ===

  private drawParallaxBackground(engine: GameEngine) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const playerTileY = Math.floor(engine.player.y / TILE_SIZE);

    if (playerTileY < SURFACE_BOTTOM) {
      // SURFACE (Ori-style misty twilight / dawn sky, ruined spires)
      const dayCycle = Math.sin((engine.world.ambientTime / 2400) * Math.PI * 2);
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (dayCycle > 0) {
        // Day / Dawn
        skyGrad.addColorStop(0, '#0f172a');
        skyGrad.addColorStop(0.5, '#1e293b');
        skyGrad.addColorStop(1, '#334155');
      } else {
        // Night
        skyGrad.addColorStop(0, '#030712');
        skyGrad.addColorStop(0.6, '#0f172a');
        skyGrad.addColorStop(1, '#111827');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Celestial Orb: Radiant Sun during day, Pale Ash Moon & Stars during night
      const celestialProgress = (engine.world.ambientTime / 2400); // 0 to 1
      const celestialAngle = celestialProgress * Math.PI * 2;
      const celestialScreenX = (((celestialProgress * width * 1.6) - (this.cameraX * 0.04)) % (width + 160)) - 80;
      const celestialScreenY = height * 0.46 - Math.sin(celestialAngle) * (height * 0.36);

      if (dayCycle > -0.15) {
        // Golden Sun with radiant corona
        const sunRadius = 24;
        const sunGlow = ctx.createRadialGradient(
          celestialScreenX, celestialScreenY, 4,
          celestialScreenX, celestialScreenY, 68
        );
        sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
        sunGlow.addColorStop(0.35, 'rgba(251, 191, 36, 0.42)');
        sunGlow.addColorStop(0.7, 'rgba(249, 115, 22, 0.12)');
        sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(celestialScreenX, celestialScreenY, 68, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(celestialScreenX, celestialScreenY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Ash Night Sky: Twinkling embers and Pale Crescent Moon
        for (let s = 0; s < 24; s++) {
          const starX = ((s * 79 + 23) - (this.cameraX * 0.02)) % width;
          const starY = (s * 37 + 13) % (height * 0.52);
          const starAlpha = 0.25 + Math.sin(engine.world.ambientTime * 0.05 + s) * 0.22;
          ctx.fillStyle = `rgba(226, 232, 240, ${Math.max(0.1, starAlpha)})`;
          ctx.fillRect(starX < 0 ? starX + width : starX, starY, 2, 2);
        }

        const moonX = ((celestialScreenX + width * 0.5) % (width + 100)) - 50;
        const moonY = height * 0.44 + Math.sin(celestialAngle) * (height * 0.32);
        const moonGlow = ctx.createRadialGradient(moonX, moonY, 3, moonX, moonY, 48);
        moonGlow.addColorStop(0, 'rgba(224, 242, 254, 0.85)');
        moonGlow.addColorStop(0.5, 'rgba(186, 230, 253, 0.22)');
        moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 48, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant mountain silhouettes (Parallax factor 0.1)
      ctx.fillStyle = '#1e1b4b1a';
      ctx.beginPath();
      const mountainOffset = this.cameraX * 0.1;
      for (let x = -50; x < width + 50; x += 60) {
        const mh = 140 + Math.sin((x + mountainOffset) * 0.008) * 80;
        ctx.lineTo(x, height * 0.65 - mh);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Midground ruined pillars (Parallax factor 0.3)
      ctx.fillStyle = '#0f172a80';
      const midOffset = this.cameraX * 0.3;
      for (let i = 0; i < 15; i++) {
        const px = ((i * 320) - midOffset) % (width + 400) - 100;
        ctx.fillRect(px, height * 0.45, 24, height);
        // Broken capital arch
        ctx.fillRect(px - 8, height * 0.45, 40, 14);
      }
    } else if (playerTileY < UNDERGROUND_BOTTOM) {
      // UNDERGROUND (Terraria cavern rocky background)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Cavern stalactite arches
      ctx.fillStyle = '#111827';
      const caveOffset = this.cameraX * 0.2;
      for (let i = 0; i < 12; i++) {
        const cx = ((i * 260) - caveOffset) % (width + 300) - 50;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx + 35, 70 + (i % 3) * 30);
        ctx.lineTo(cx + 70, 0);
        ctx.fill();
      }
    } else {
      // DEEP RUINS (Hollow Knight dark gothic ancient spires)
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Towering gothic arches
      ctx.fillStyle = '#0b0f19';
      const gothicOffset = this.cameraX * 0.15;
      for (let i = 0; i < 10; i++) {
        const gx = ((i * 380) - gothicOffset) % (width + 500) - 100;
        ctx.fillRect(gx, 0, 36, height);
        // Spire cap
        ctx.beginPath();
        ctx.moveTo(gx - 10, height * 0.5);
        ctx.lineTo(gx + 18, height * 0.2);
        ctx.lineTo(gx + 46, height * 0.5);
        ctx.fill();
      }
    }
  }

  // === 2. BACKGROUND WALLS ===

  private drawWalls(engine: GameEngine, sx: number, ex: number, sy: number, ey: number) {
    const ctx = this.ctx;
    for (let y = sy; y <= ey; y++) {
      for (let x = sx; x <= ex; x++) {
        const wall = engine.getWall(x, y);
        if (wall === TileType.AIR) continue;

        const screenX = Math.floor(x * TILE_SIZE - this.cameraX);
        const screenY = Math.floor(y * TILE_SIZE - this.cameraY);

        if (wall === TileType.WOOD_WALL) {
          ctx.fillStyle = '#292524';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(screenX, screenY + 6, TILE_SIZE, 1);
          ctx.fillRect(screenX, screenY + 14, TILE_SIZE, 1);
        } else if (wall === TileType.STONE || wall === TileType.ANCIENT_BRICK) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#0f172a';
          ctx.strokeRect(screenX + 0.5, screenY + 0.5, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  // === 3. WORLD TILES ===

  private drawTiles(engine: GameEngine, sx: number, ex: number, sy: number, ey: number) {
    const ctx = this.ctx;

    for (let y = sy; y <= ey; y++) {
      for (let x = sx; x <= ex; x++) {
        const tile = engine.getTile(x, y);
        if (tile === TileType.AIR) continue;

        const screenX = Math.floor(x * TILE_SIZE - this.cameraX);
        const screenY = Math.floor(y * TILE_SIZE - this.cameraY);

        const isPurified = engine.world.purifiedMap[y * WORLD_WIDTH + x] === 1;

        switch (tile) {
          case TileType.GRASS_DIRT: {
            // Dirt base
            ctx.fillStyle = '#3f2212';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Lush grass top (Ori glowing emerald if purified, weathered ash otherwise)
            ctx.fillStyle = isPurified ? '#10b981' : '#475569';
            ctx.fillRect(screenX, screenY, TILE_SIZE, 5);
            // Grass blade tufts
            ctx.fillRect(screenX + 3, screenY - 2, 2, 3);
            ctx.fillRect(screenX + 11, screenY - 3, 2, 4);
            ctx.fillRect(screenX + 19, screenY - 2, 2, 3);
            break;
          }
          case TileType.DIRT: {
            ctx.fillStyle = '#3f2212';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#2d180a';
            ctx.fillRect(screenX + 4, screenY + 6, 4, 3);
            ctx.fillRect(screenX + 14, screenY + 12, 3, 3);
            break;
          }
          case TileType.STONE: {
            ctx.fillStyle = '#334155';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#1e293b';
            ctx.strokeRect(screenX + 0.5, screenY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
            ctx.fillStyle = '#475569';
            ctx.fillRect(screenX + 3, screenY + 3, 6, 4);
            break;
          }
          case TileType.ASH_ROCK: {
            ctx.fillStyle = '#1e2029';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#0f1117';
            ctx.fillRect(screenX + 5, screenY + 8, 8, 6);
            break;
          }
          case TileType.WOOD_PLANK: {
            ctx.fillStyle = '#573318';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#3d2410';
            ctx.strokeRect(screenX + 0.5, screenY + 0.5, TILE_SIZE, TILE_SIZE);
            ctx.fillRect(screenX, screenY + 8, TILE_SIZE, 1);
            ctx.fillRect(screenX, screenY + 16, TILE_SIZE, 1);
            break;
          }
          case TileType.WOOD_TRUNK: {
            ctx.fillStyle = '#451a03';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#290e02';
            ctx.fillRect(screenX + 4, screenY, 3, TILE_SIZE);
            break;
          }
          case TileType.LEAVES: {
            ctx.fillStyle = isPurified ? '#059669' : '#334155';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = isPurified ? '#10b981' : '#475569';
            ctx.fillRect(screenX + 2, screenY + 2, 8, 8);
            break;
          }
          case TileType.PLATFORM: {
            ctx.fillStyle = '#78350f';
            ctx.fillRect(screenX, screenY, TILE_SIZE, 5);
            ctx.fillStyle = '#451a03';
            ctx.fillRect(screenX, screenY + 5, 3, 4);
            ctx.fillRect(screenX + TILE_SIZE - 3, screenY + 5, 3, 4);
            break;
          }
          case TileType.COPPER_ORE: {
            ctx.fillStyle = '#334155';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Sparkling copper specs
            ctx.fillStyle = '#d97706';
            ctx.fillRect(screenX + 4, screenY + 5, 5, 4);
            ctx.fillRect(screenX + 13, screenY + 12, 6, 5);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(screenX + 6, screenY + 6, 2, 2);
            break;
          }
          case TileType.SILVER_ORE: {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Silver vein
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(screenX + 5, screenY + 4, 6, 5);
            ctx.fillRect(screenX + 12, screenY + 11, 7, 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(screenX + 7, screenY + 5, 2, 2);
            break;
          }
          case TileType.EMBER_CRYSTAL: {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Radiant Ember crystal
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(screenX + 4, screenY + 4, 8, 14);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(screenX + 12, screenY + 6, 7, 10);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(screenX + 7, screenY + 7, 3, 3);
            break;
          }
          case TileType.OBSIDIAN: {
            ctx.fillStyle = '#09090b';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#18181b';
            ctx.strokeRect(screenX + 0.5, screenY + 0.5, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#581c87';
            ctx.fillRect(screenX + 5, screenY + 5, 4, 4);
            break;
          }
          case TileType.ANCIENT_BRICK: {
            ctx.fillStyle = '#172554';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#0f172a';
            ctx.strokeRect(screenX + 0.5, screenY + 0.5, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(screenX + 10, screenY + 8, 4, 4);
            break;
          }
          case TileType.TORCH: {
            // Wood stick
            ctx.fillStyle = '#78350f';
            ctx.fillRect(screenX + 10, screenY + 8, 4, 14);
            // Animated flickering flame
            const flicker = Math.sin(Date.now() * 0.015 + x * 2) * 2;
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(screenX + 12, screenY + 7 + flicker, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(screenX + 12, screenY + 6 + flicker, 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case TileType.EMBER_BRAZIER: {
            // Large ancient iron brazier
            ctx.fillStyle = '#334155';
            ctx.fillRect(screenX + 4, screenY + 12, 16, 10);
            ctx.fillRect(screenX + 2, screenY + 10, 20, 3);
            // Great hearth fire
            const bflicker = Math.sin(Date.now() * 0.02 + x) * 3;
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.arc(screenX + 12, screenY + 7 + bflicker, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(screenX + 12, screenY + 6 + bflicker, 4, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
        }

        // Post-processing edge relief & lit texture clarity
        if (
          tile !== TileType.PLATFORM &&
          tile !== TileType.TORCH &&
          tile !== TileType.EMBER_BRAZIER
        ) {
          const tileIdx = y * WORLD_WIDTH + x;
          const lightVal = engine.world.lightMap[tileIdx] || 0;
          if (lightVal > 15) {
            const lightAlpha = Math.min(0.4, 0.1 + (lightVal / 100) * 0.3);
            // Top bevel highlight if exposed above
            if (y > 0) {
              const above = engine.getTile(x, y - 1);
              if (above === TileType.AIR || above === TileType.PLATFORM) {
                ctx.fillStyle = `rgba(255, 245, 210, ${lightAlpha})`;
                ctx.fillRect(screenX, screenY, TILE_SIZE, 2);
              }
            }
            // Bottom drop-shadow if exposed below
            if (y < WORLD_HEIGHT - 1) {
              const below = engine.getTile(x, y + 1);
              if (below === TileType.AIR || below === TileType.PLATFORM) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(screenX, screenY + TILE_SIZE - 2, TILE_SIZE, 2);
              }
            }
            // Left bevel highlight
            if (x > 0 && engine.getTile(x - 1, y) === TileType.AIR) {
              ctx.fillStyle = `rgba(255, 245, 210, ${lightAlpha * 0.5})`;
              ctx.fillRect(screenX, screenY, 2, TILE_SIZE);
            }
            // Right edge shadow
            if (x < WORLD_WIDTH - 1 && engine.getTile(x + 1, y) === TileType.AIR) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
              ctx.fillRect(screenX + TILE_SIZE - 2, screenY, 2, TILE_SIZE);
            }
          }
        }
      }
    }
  }

  // === 4. NPCS ===

  private drawNPCs(engine: GameEngine) {
    const ctx = this.ctx;
    for (const npc of engine.npcs) {
      const sx = Math.floor(npc.x * TILE_SIZE - this.cameraX);
      const sy = Math.floor(npc.y * TILE_SIZE - this.cameraY);

      // NPC Body
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(sx, sy, 18, 30);
      // Head
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(sx + 3, sy - 8, 12, 10);
      // Glowing emblem
      ctx.fillStyle = '#fbbf24';
      ctx.font = '14px sans-serif';
      ctx.fillText(npc.avatar, sx + 2, sy + 18);

      // Name & Title above
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, sx + 9, sy - 14);

      // Interaction prompt or active speech bubble
      const isNearby = engine.nearbyNPC?.id === npc.id;
      const speech = (engine.activeSpeechBubble && engine.activeSpeechBubble.npcId === npc.id)
        ? engine.activeSpeechBubble
        : npc.speechBubble;

      if (speech && speech.timer > 0) {
        // Render Floating Speech Bubble above NPC
        ctx.save();
        const bubbleText = speech.text;
        ctx.font = '12px sans-serif';
        
        // Wrap text to lines
        const maxLineWidth = 180;
        const words = bubbleText.split(' ');
        const lines: string[] = [];
        let curLine = '';
        for (const w of words) {
          const test = curLine ? `${curLine} ${w}` : w;
          if (ctx.measureText(test).width > maxLineWidth) {
            lines.push(curLine);
            curLine = w;
          } else {
            curLine = test;
          }
        }
        if (curLine) lines.push(curLine);

        const padX = 14;
        const padY = 10;
        const lineHeight = 16;
        let textBlockWidth = 0;
        for (const line of lines) {
          textBlockWidth = Math.max(textBlockWidth, ctx.measureText(line).width);
        }
        const bWidth = Math.max(140, textBlockWidth + padX * 2);
        const bHeight = lines.length * lineHeight + padY * 2 + 16; // extra for [E] prompt badge

        const bX = sx + 9 - bWidth / 2;
        const bY = sy - 28 - bHeight;

        // Bubble Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        // Speech Bubble Box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;

        // Rounded box
        const r = 8;
        ctx.beginPath();
        ctx.moveTo(bX + r, bY);
        ctx.lineTo(bX + bWidth - r, bY);
        ctx.quadraticCurveTo(bX + bWidth, bY, bX + bWidth, bY + r);
        ctx.lineTo(bX + bWidth, bY + bHeight - r);
        ctx.quadraticCurveTo(bX + bWidth, bY + bHeight, bX + bWidth - r, bY + bHeight);
        // Bubble triangle tail
        const tailX = sx + 9;
        ctx.lineTo(tailX + 8, bY + bHeight);
        ctx.lineTo(tailX, bY + bHeight + 8);
        ctx.lineTo(tailX - 8, bY + bHeight);
        ctx.lineTo(bX + r, bY + bHeight);
        ctx.quadraticCurveTo(bX, bY + bHeight, bX, bY + bHeight - r);
        ctx.lineTo(bX, bY + r);
        ctx.quadraticCurveTo(bX, bY, bX + r, bY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowColor = 'transparent';

        // Title line inside bubble
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px Cinzel, serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${npc.avatar} ${npc.name}:`, bX + padX, bY + padY + 10);

        // Dialogue text lines
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '12px sans-serif';
        lines.forEach((line, li) => {
          ctx.fillText(line, bX + padX, bY + padY + 26 + li * lineHeight);
        });

        // Prompt footer
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('[E] Menüyü Aç / Ticaret →', bX + bWidth - padX, bY + bHeight - 6);

        ctx.restore();
      } else if (isNearby) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('[E] Konuş', sx + 9, sy - 26);
      }
    }
  }

  // === 5. ENEMIES & BOSS ===

  private drawEnemies(engine: GameEngine) {
    const ctx = this.ctx;
    for (const e of engine.enemies) {
      const sx = Math.floor(e.x - this.cameraX);
      const sy = Math.floor(e.y - this.cameraY);

      // Flash white when staggered
      if (e.staggerTimer > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, sy, e.width, e.height);
        continue;
      }

      // Hollow Knight style Enemy Alert indicator (!)
      if (e.alertTimer && e.alertTimer > 0) {
        ctx.save();
        const alertBounce = Math.sin((35 - e.alertTimer) * 0.3) * 3;
        const alertY = sy - 14 - alertBounce;
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.fillText('!', sx + e.width / 2, alertY);
        ctx.restore();
      }

      if (e.type === 'crawler') {
        // Ash Crawler (four-legged spike shadow)
        ctx.fillStyle = e.inLightArea ? '#94a3b8' : '#090d16';
        ctx.fillRect(sx, sy + 6, e.width, e.height - 6);
        // Glowing red eyes
        ctx.fillStyle = '#ef4444';
        const eyeX = e.facing === 1 ? sx + e.width - 5 : sx + 3;
        ctx.fillRect(eyeX, sy + 8, 3, 3);
      } else if (e.type === 'stinger') {
        // Flying Stinger
        ctx.fillStyle = '#4338ca';
        ctx.beginPath();
        ctx.arc(sx + e.width / 2, sy + e.height / 2, e.width / 2, 0, Math.PI * 2);
        ctx.fill();
        // Wings
        ctx.fillStyle = '#a5b4fc80';
        const wingFlap = Math.sin(Date.now() * 0.03) * 6;
        ctx.fillRect(sx + 2, sy - 6 + wingFlap, 18, 5);
        // Stinger needle
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(sx + (e.facing === 1 ? e.width : -4), sy + e.height / 2 - 2, 6, 4);
      } else if (e.type === 'wraith') {
        // Cavern Shadow Wraith
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.moveTo(sx + e.width / 2, sy);
        ctx.lineTo(sx + e.width, sy + e.height);
        ctx.lineTo(sx, sy + e.height);
        ctx.closePath();
        ctx.fill();
        // Spooky cyan core
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(sx + e.width / 2, sy + 12, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'brute') {
        // Deep Ruins Brute
        ctx.fillStyle = '#18181b';
        ctx.fillRect(sx, sy, e.width, e.height);
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(sx + 6, sy + 12, e.width - 12, 8);
      } else if (e.type === 'storm_phantom') {
        // High-speed menacing Storm Phantom with piercing red eyes
        ctx.save();
        ctx.fillStyle = e.inLightArea ? '#7f1d1d' : '#09090b';
        ctx.beginPath();
        ctx.arc(sx + e.width / 2, sy + 10, 10, 0, Math.PI * 2);
        ctx.fill();

        // Ghostly trailing body
        ctx.beginPath();
        ctx.moveTo(sx + 2, sy + 10);
        ctx.lineTo(sx + e.width - 2, sy + 10);
        ctx.lineTo(sx + (e.facing === 1 ? -4 : e.width + 4), sy + e.height);
        ctx.closePath();
        ctx.fill();

        // Piercing crimson glowing eyes
        ctx.fillStyle = '#ef4444';
        const eyeX = e.facing === 1 ? sx + 12 : sx + 4;
        ctx.fillRect(eyeX, sy + 8, 3, 3);
        ctx.fillRect(eyeX + (e.facing === 1 ? 4 : -4), sy + 8, 3, 3);

        // Light burning flare if caught in player's sanctuary
        if (e.inLightArea) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sx - 2, sy - 2, e.width + 4, e.height + 4);
        }
        ctx.restore();
      } else if (e.type === 'boss_ignis') {
        // BOSS: Ignis, The Fallen Flameborn
        const isPhase2 = e.state === 'boss_phase2';
        // Massive shadowy obsidian warrior
        ctx.fillStyle = isPhase2 ? '#450a0a' : '#030712';
        ctx.fillRect(sx, sy, e.width, e.height);

        // Blazing core / crown
        ctx.fillStyle = isPhase2 ? '#ef4444' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(sx + e.width / 2, sy + 18, 10, 0, Math.PI * 2);
        ctx.fill();

        // Glowing horns / mask
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx + (e.facing === 1 ? e.width - 16 : 8), sy + 14, 4, 4);
        ctx.fillRect(sx + (e.facing === 1 ? e.width - 24 : 16), sy + 14, 4, 4);

        // Great Ash Blade
        ctx.fillStyle = isPhase2 ? '#f97316' : '#94a3b8';
        const swordX = e.facing === 1 ? sx + e.width + 4 : sx - 16;
        ctx.fillRect(swordX, sy + 12, 8, 48);
      }

      // Overhead Health Bar for enemies (Hollow Knight style feedback)
      if (e.hp < e.maxHp && e.type !== 'boss_ignis' && e.hp > 0) {
        const barW = Math.max(e.width + 8, 30);
        const barH = 5;
        const barX = sx + e.width / 2 - barW / 2;
        const barY = sy - 14;

        // Dark obsidian background frame
        ctx.fillStyle = '#090d16';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        // Frame border (golden if weakened in player light, slate otherwise)
        ctx.strokeStyle = e.inLightArea ? '#f59e0b' : '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);

        // Dark red track
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(barX, barY, barW, barH);

        // Remaining HP with bright gradient
        const hpRatio = Math.max(0, Math.min(1, e.hp / e.maxHp));
        const fillW = Math.round(hpRatio * barW);

        ctx.fillStyle = e.inLightArea ? '#f59e0b' : '#ef4444';
        ctx.fillRect(barX, barY, fillW, barH);

        // White/cyan hit-flash tick
        if (e.staggerTimer > 0) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(barX + fillW - 2, barY, 2, barH);
        }
      }
    }
  }

  // === 6. PLAYER (HOODED ASH CHILD) ===

  private drawPlayer(engine: GameEngine) {
    const ctx = this.ctx;
    const p = engine.player;
    const sx = Math.floor(p.x - this.cameraX);
    const sy = Math.floor(p.y - this.cameraY);

    // Invulnerability flashing
    if (p.invulnerableTimer > 0 && Math.floor(p.invulnerableTimer / 3) % 2 === 0) {
      return;
    }

    // Dynamic Cape (Hollow Knight cloak)
    ctx.save();
    ctx.translate(sx + p.width / 2, sy + 10);
    ctx.rotate(p.capeAngle);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.lineTo(p.facing === 1 ? -12 : 12, p.height - 8);
    ctx.lineTo(0, p.height - 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Body (Sleek dark silhouette)
    ctx.fillStyle = '#020617';
    ctx.fillRect(sx + 3, sy + 10, p.width - 6, p.height - 10);

    // Hood / Head
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(sx + p.width / 2, sy + 8, 8, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Eyes (Hollow Knight / Ori luminescence)
    ctx.fillStyle = '#38bdf8';
    const eyeOffsetX = p.facing === 1 ? 2 : -4;
    ctx.fillRect(sx + p.width / 2 + eyeOffsetX, sy + 6, 3, 2);

    // Ember Wings when gliding
    if (p.stats.hasWings && !p.isGrounded && p.vy > 0) {
      ctx.fillStyle = '#38bdf840';
      ctx.beginPath();
      ctx.ellipse(sx + p.width / 2, sy + 14, 26, 12, (p.facing * Math.PI) / 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sword Slash Arc Effect (Hollow Knight nail slash)
    if (p.attackTimer > 0) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const slashProgress = 1 - p.attackTimer / 16;

      if (p.attackDirection === 'forward') {
        const slashStartX = p.facing === 1 ? sx + p.width - 2 : sx + 2;
        const slashRadius = 32;
        const startAng = p.facing === 1 ? -Math.PI * 0.4 : Math.PI * 0.6;
        const endAng = p.facing === 1 ? Math.PI * 0.4 : Math.PI * 1.4;
        ctx.arc(slashStartX, sy + p.height / 2, slashRadius, startAng, endAng, p.facing === -1);
      } else if (p.attackDirection === 'up') {
        ctx.arc(sx + p.width / 2, sy - 6, 28, -Math.PI * 0.9, -Math.PI * 0.1);
      } else if (p.attackDirection === 'down') {
        ctx.arc(sx + p.width / 2, sy + p.height + 6, 28, Math.PI * 0.1, Math.PI * 0.9);
      }
      ctx.stroke();

      // Outer glowing fringe
      ctx.strokeStyle = '#38bdf880';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // Parry Shield Flare
    if (p.isParrying) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sx + p.width / 2, sy + p.height / 2, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // === 7. PROJECTILES & PARTICLES ===

  private drawProjectiles(engine: GameEngine) {
    const ctx = this.ctx;
    for (const proj of engine.projectiles) {
      const sx = Math.floor(proj.x - this.cameraX);
      const sy = Math.floor(proj.y - this.cameraY);

      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(sx, sy, proj.radius, 0, Math.PI * 2);
      ctx.fill();

      // Core glow
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, proj.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawParticles(engine: GameEngine) {
    const ctx = this.ctx;
    for (const p of engine.particles) {
      const sx = Math.floor(p.x - this.cameraX);
      const sy = Math.floor(p.y - this.cameraY);

      if (p.glow) {
        // Soft glowing halo
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha * 0.35);
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (p.kind === 'spark') {
        // Fast dynamic spark streak
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1.2, p.size * 0.8);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - p.vx * 2.2, sy - p.vy * 2.2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // === 8. DYNAMIC 2D LIGHTING ("Yaktığın Işık, Kalıcı İz Bırakır") ===

  private drawDynamicLighting(engine: GameEngine, width: number, height: number) {
    const lCtx = this.lightCtx;

    // Clear offscreen light map
    lCtx.clearRect(0, 0, width, height);

    // Compute ambient darkness based on depth and global illumination (day/night)
    const playerTileY = Math.floor(engine.player.y / TILE_SIZE);
    const globalIllum = engine.globalIllumination !== undefined ? engine.globalIllumination : 1.0;
    const torchMult = engine.torchRadiusMultiplier || (engine.isNight ? 1.28 : 1.0);

    let ambientAlpha = 0.55;
    if (playerTileY < SURFACE_BOTTOM) {
      // Smoothly scale surface darkness by global illumination
      // High noon (globalIllum 1.0) -> ambientAlpha 0.32 (bright sunlight)
      // Midnight (globalIllum 0.2) -> ambientAlpha 0.76 (deep shadowy night)
      ambientAlpha = Math.max(0.28, Math.min(0.82, 0.86 - (globalIllum * 0.54)));
    } else if (playerTileY < UNDERGROUND_BOTTOM) {
      ambientAlpha = 0.85; // Deep underground
    } else {
      ambientAlpha = 0.94; // Deep abyss ruins
    }

    if (engine.world.isAshStorm) {
      ambientAlpha = Math.min(0.96, ambientAlpha + 0.2);
    }

    // Fill darkness layer
    lCtx.fillStyle = `rgba(3, 7, 18, ${ambientAlpha})`;
    lCtx.fillRect(0, 0, width, height);

    // Cut out light holes using 'destination-out' blend mode
    lCtx.globalCompositeOperation = 'destination-out';

    // 1. Cutout for Player light
    const pScreenX = engine.player.x + engine.player.width / 2 - this.cameraX;
    const pScreenY = engine.player.y + engine.player.height / 2 - this.cameraY;
    const playerLightGrad = lCtx.createRadialGradient(pScreenX, pScreenY, 8, pScreenX, pScreenY, 130);
    playerLightGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    playerLightGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.6)');
    playerLightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    lCtx.fillStyle = playerLightGrad;
    lCtx.beginPath();
    lCtx.arc(pScreenX, pScreenY, 130, 0, Math.PI * 2);
    lCtx.fill();

    // 2. Cutout for placed torches and braziers visible on screen
    // Note: Torches expand their reach at night (torchMult)
    const sx = Math.max(0, Math.floor(this.cameraX / TILE_SIZE) - 4);
    const ex = Math.min(WORLD_WIDTH - 1, Math.ceil((this.cameraX + width) / TILE_SIZE) + 4);
    const sy = Math.max(0, Math.floor(this.cameraY / TILE_SIZE) - 4);
    const ey = Math.min(WORLD_HEIGHT - 1, Math.ceil((this.cameraY + height) / TILE_SIZE) + 4);

    for (let y = sy; y <= ey; y++) {
      for (let x = sx; x <= ex; x++) {
        const tile = engine.getTile(x, y);
        if (tile === TileType.TORCH || tile === TileType.EMBER_BRAZIER) {
          const lx = (x + 0.5) * TILE_SIZE - this.cameraX;
          const ly = (y + 0.5) * TILE_SIZE - this.cameraY;
          const baseRadius = tile === TileType.EMBER_BRAZIER ? 260 : 140;
          const radius = baseRadius * torchMult;

          const torchGrad = lCtx.createRadialGradient(lx, ly, 10, lx, ly, radius);
          torchGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
          torchGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.7)');
          torchGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          lCtx.fillStyle = torchGrad;
          lCtx.beginPath();
          lCtx.arc(lx, ly, radius, 0, Math.PI * 2);
          lCtx.fill();
        }
      }
    }

    // Reset composite operation
    lCtx.globalCompositeOperation = 'source-over';

    // Stamp darkness onto main canvas
    this.ctx.drawImage(this.lightCanvas, 0, 0);

    // Warm hearth & torch bloom post-processing passes using 'lighter'
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';

    // 1. Player light bloom
    const tintGrad = this.ctx.createRadialGradient(pScreenX, pScreenY, 6, pScreenX, pScreenY, 115);
    tintGrad.addColorStop(0, 'rgba(245, 158, 11, 0.2)');
    tintGrad.addColorStop(0.5, 'rgba(234, 88, 12, 0.07)');
    tintGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = tintGrad;
    this.ctx.beginPath();
    this.ctx.arc(pScreenX, pScreenY, 115, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Torch and Brazier radiant Bloom / Glow (amplified at night)
    for (let y = sy; y <= ey; y++) {
      for (let x = sx; x <= ex; x++) {
        const tile = engine.getTile(x, y);
        if (tile === TileType.TORCH || tile === TileType.EMBER_BRAZIER) {
          const lx = (x + 0.5) * TILE_SIZE - this.cameraX;
          const ly = (y + 0.5) * TILE_SIZE - this.cameraY;
          const isBrazier = tile === TileType.EMBER_BRAZIER;
          const baseBloom = isBrazier ? 210 : 110;
          const bloomRadius = baseBloom * torchMult;
          const pulse = Math.sin(engine.world.ambientTime * 0.08 + x * 3 + y * 2) * 5;

          const bloomGrad = this.ctx.createRadialGradient(
            lx, ly, 3,
            lx, ly, bloomRadius + pulse
          );
          bloomGrad.addColorStop(0, isBrazier ? 'rgba(254, 240, 138, 0.42)' : 'rgba(254, 240, 138, 0.35)');
          bloomGrad.addColorStop(0.3, isBrazier ? 'rgba(249, 115, 22, 0.22)' : 'rgba(245, 158, 11, 0.18)');
          bloomGrad.addColorStop(0.7, isBrazier ? 'rgba(220, 38, 38, 0.08)' : 'rgba(234, 88, 12, 0.05)');
          bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          this.ctx.fillStyle = bloomGrad;
          this.ctx.beginPath();
          this.ctx.arc(lx, ly, bloomRadius + pulse, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    // 3. Subtle light beams (god rays) streaming down in lit caverns/surface
    if (playerTileY < UNDERGROUND_BOTTOM && !engine.world.isAshStorm) {
      const beamOffset = (engine.world.ambientTime * 0.4) % 360;
      for (let b = -1; b < 4; b++) {
        const beamX = b * 320 + beamOffset - (this.cameraX % 320);
        if (beamX > -150 && beamX < width + 150) {
          const beamGrad = this.ctx.createLinearGradient(beamX, 0, beamX + 160, height);
          beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.04)');
          beamGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.02)');
          beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          this.ctx.fillStyle = beamGrad;
          this.ctx.beginPath();
          this.ctx.moveTo(beamX, 0);
          this.ctx.lineTo(beamX + 90, 0);
          this.ctx.lineTo(beamX + 220, height);
          this.ctx.lineTo(beamX + 130, height);
          this.ctx.closePath();
          this.ctx.fill();
        }
      }
    }

    this.ctx.restore();
  }

  // === 9. CURSOR HIGHLIGHT & GRID-SNAP BUILDING GUIDE ===

  private drawCursorHighlight(engine: GameEngine, mouse: { x: number; y: number }) {
    const worldMouseX = mouse.x + this.cameraX;
    const worldMouseY = mouse.y + this.cameraY;
    const tileX = Math.floor(worldMouseX / TILE_SIZE);
    const tileY = Math.floor(worldMouseY / TILE_SIZE);

    engine.hoveredTileX = tileX;
    engine.hoveredTileY = tileY;

    const screenX = tileX * TILE_SIZE - this.cameraX;
    const screenY = tileY * TILE_SIZE - this.cameraY;

    // Check reach distance
    const pTileX = Math.floor((engine.player.x + engine.player.width / 2) / TILE_SIZE);
    const pTileY = Math.floor((engine.player.y + engine.player.height / 2) / TILE_SIZE);
    const inReach = Math.hypot(tileX - pTileX, tileY - pTileY) <= 7;

    const currentItem = engine.player.inventory[engine.player.selectedHotbarIndex];
    const isHoldingPlaceable = currentItem && currentItem.type === 'placeable' && (currentItem.tileType !== undefined);
    const existingTile = engine.getTile(tileX, tileY);
    const canPlace = inReach && (existingTile === TileType.AIR || existingTile === TileType.PLATFORM);

    // Grid-snap guide around cursor when placing blocks/torches
    if (isHoldingPlaceable) {
      this.ctx.save();
      for (let gx = -2; gx <= 2; gx++) {
        for (let gy = -2; gy <= 2; gy++) {
          const gTileX = tileX + gx;
          const gTileY = tileY + gy;
          if (gTileX < 0 || gTileX >= WORLD_WIDTH || gTileY < 0 || gTileY >= WORLD_HEIGHT) continue;
          const gScreenX = gTileX * TILE_SIZE - this.cameraX;
          const gScreenY = gTileY * TILE_SIZE - this.cameraY;
          const gDist = Math.hypot(gTileX - pTileX, gTileY - pTileY);
          const gInReach = gDist <= 7;

          this.ctx.strokeStyle = gInReach ? 'rgba(56, 189, 248, 0.25)' : 'rgba(100, 116, 139, 0.12)';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(gScreenX, gScreenY, TILE_SIZE, TILE_SIZE);
        }
      }
      this.ctx.restore();
    }

    // Highlight hovered tile
    if (isHoldingPlaceable) {
      this.ctx.strokeStyle = canPlace ? '#10b981' : inReach ? '#f59e0b' : '#ef444480';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      if (canPlace) {
        // Ghost translucent preview of the placeable item
        this.ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(currentItem.icon || '+', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
      }
    } else {
      this.ctx.strokeStyle = inReach ? '#f59e0b' : '#64748b40';
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
  }

  // === 10. FLOATING TEXTS ===

  private drawFloatingTexts(engine: GameEngine) {
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';

    for (const t of engine.floatingTexts) {
      const sx = Math.floor(t.x - this.cameraX);
      const sy = Math.floor(t.y - this.cameraY);

      ctx.fillStyle = '#000000';
      ctx.fillText(t.text, sx + 1, sy + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, sx, sy);
    }
  }

  // === PROCEDURAL FOLIAGE (NATURE HEALING) ===

  private drawProceduralFoliage(
    engine: GameEngine,
    startTileX: number,
    endTileX: number,
    startTileY: number,
    endTileY: number
  ) {
    const ctx = this.ctx;
    const isStorm = engine.world.isAshStorm;
    const now = Date.now();

    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const idx = y * WORLD_WIDTH + x;
        const foliage = engine.world.foliageMap[idx];
        if (!foliage) continue;

        const screenX = Math.floor(x * TILE_SIZE - this.cameraX);
        const screenY = Math.floor(y * TILE_SIZE - this.cameraY);
        const baseY = screenY + TILE_SIZE;

        // Wind sway calculation
        const windPhase = now * 0.0035 + x * 0.7;
        const sway = Math.sin(windPhase) * (isStorm ? 5.5 : 2.0);

        if (foliage === 1) {
          // Stage 1: Delicate bright sprouts
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(screenX + 8, baseY);
          ctx.quadraticCurveTo(screenX + 8 + sway * 0.5, baseY - 6, screenX + 6 + sway, baseY - 9);
          ctx.moveTo(screenX + 16, baseY);
          ctx.quadraticCurveTo(screenX + 16 + sway * 0.5, baseY - 5, screenX + 18 + sway, baseY - 8);
          ctx.stroke();

          ctx.fillStyle = '#a3e635';
          ctx.fillRect(screenX + 5 + sway, baseY - 10, 2.5, 2.5);
          ctx.fillRect(screenX + 17 + sway, baseY - 9, 2.5, 2.5);
        } else if (foliage === 2) {
          // Stage 2: Tall lush wild grass blades
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.beginPath();
          // Blade 1
          ctx.moveTo(screenX + 4, baseY);
          ctx.quadraticCurveTo(screenX + 4 + sway * 0.5, baseY - 8, screenX + 3 + sway * 1.2, baseY - 14);
          // Blade 2
          ctx.moveTo(screenX + 10, baseY);
          ctx.quadraticCurveTo(screenX + 10 + sway * 0.4, baseY - 10, screenX + 11 + sway * 1.4, baseY - 18);
          // Blade 3
          ctx.moveTo(screenX + 16, baseY);
          ctx.quadraticCurveTo(screenX + 16 + sway * 0.5, baseY - 7, screenX + 18 + sway * 1.1, baseY - 13);
          // Blade 4
          ctx.moveTo(screenX + 21, baseY);
          ctx.quadraticCurveTo(screenX + 21 + sway * 0.4, baseY - 9, screenX + 20 + sway * 1.3, baseY - 16);
          ctx.stroke();

          // Lighter tips
          ctx.fillStyle = '#34d399';
          ctx.fillRect(screenX + 10 + sway * 1.4, baseY - 19, 2, 2);
          ctx.fillRect(screenX + 19 + sway * 1.3, baseY - 17, 2, 2);
        } else if (foliage === 3) {
          // Stage 3: Blooming Radiant Ember Flower
          ctx.strokeStyle = '#059669';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(screenX + 12, baseY);
          ctx.quadraticCurveTo(screenX + 12 + sway * 0.5, baseY - 9, screenX + 12 + sway, baseY - 16);
          ctx.stroke();

          const flowerX = screenX + 12 + sway;
          const flowerY = baseY - 16;

          // Glowing aura
          const glowGrad = ctx.createRadialGradient(flowerX, flowerY, 1, flowerX, flowerY, 14);
          glowGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
          glowGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(flowerX, flowerY, 14, 0, Math.PI * 2);
          ctx.fill();

          // Petals
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(flowerX - 3.5, flowerY, 3, 0, Math.PI * 2);
          ctx.arc(flowerX + 3.5, flowerY, 3, 0, Math.PI * 2);
          ctx.arc(flowerX, flowerY - 3.5, 3, 0, Math.PI * 2);
          ctx.arc(flowerX, flowerY + 3.5, 3, 0, Math.PI * 2);
          ctx.fill();

          // Radiant stamen
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(flowerX, flowerY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (foliage === 4) {
          // Stage 4: Luminescent Spore Cluster
          const sporeX = screenX + 10 + sway * 0.6;
          const sporeY = baseY - 12;

          // Cyan glow
          const sporeGrad = ctx.createRadialGradient(sporeX, sporeY, 1, sporeX, sporeY, 16);
          sporeGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
          sporeGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = sporeGrad;
          ctx.beginPath();
          ctx.arc(sporeX, sporeY, 16, 0, Math.PI * 2);
          ctx.fill();

          // Stems
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(sporeX - 1.5, baseY - 10, 3, 10);
          ctx.fillRect(sporeX + 5, baseY - 7, 2, 7);

          // Bioluminescent caps
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(sporeX, sporeY, 5, Math.PI, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(sporeX + 6, sporeY + 3, 3.5, Math.PI, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // === PURIFIED RADIAL AURA FEEDBACK ("LIGHT LEAVES A MARK") ===

  private drawPurifiedRadialAura(
    engine: GameEngine,
    startTileX: number,
    endTileX: number,
    startTileY: number,
    endTileY: number
  ) {
    const ctx = this.ctx;
    const now = Date.now();
    const pulse = Math.sin(now * 0.002) * 0.06 + 0.14;

    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const tile = engine.getTile(x, y);
        if (tile === TileType.TORCH || tile === TileType.EMBER_BRAZIER) {
          const isBrazier = tile === TileType.EMBER_BRAZIER;
          const radius = isBrazier ? 220 : 130;
          const cx = Math.floor((x + 0.5) * TILE_SIZE - this.cameraX);
          const cy = Math.floor((y + 0.5) * TILE_SIZE - this.cameraY);

          // Radial glow reinforcement
          const glowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
          glowGrad.addColorStop(0, `rgba(245, 158, 11, ${pulse * 1.5})`);
          glowGrad.addColorStop(0.5, `rgba(56, 189, 248, ${pulse * 0.6})`);
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();

          // Protective boundary dash ring
          ctx.strokeStyle = `rgba(251, 191, 36, ${pulse * 0.7})`;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // Sacred Sanctuary Shield when player is safe inside
    if (engine.isPlayerInSafeBase) {
      const px = Math.floor(engine.player.x + engine.player.width / 2 - this.cameraX);
      const py = Math.floor(engine.player.y + engine.player.height / 2 - this.cameraY);
      const baseGrad = ctx.createRadialGradient(px, py, 10, px, py, 140);
      baseGrad.addColorStop(0, 'rgba(251, 191, 36, 0.08)');
      baseGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.04)');
      baseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.arc(px, py, 140, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // === ASH STORM WEATHER PASS ===

  private drawAshStormWeather(engine: GameEngine, width: number, height: number) {
    if (!engine.world.isAshStorm) return;
    const ctx = this.ctx;
    const now = Date.now();
    const intensity = engine.world.ashStormIntensity;

    ctx.save();

    // 1. Violent blowing wind gusts (diagonal streaks across the screen)
    ctx.strokeStyle = `rgba(203, 213, 225, ${0.12 * intensity})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 45; i++) {
      const seedX = ((i * 73 + (now * 0.85)) % (width + 300)) - 150;
      const seedY = (i * 37) % height;
      const length = 70 + (i % 5) * 20;
      ctx.moveTo(seedX, seedY);
      ctx.lineTo(seedX + length, seedY + length * 0.25);
    }
    ctx.stroke();

    // 2. Burning ember flakes & dark ash particles speeding through storm
    ctx.fillStyle = '#ef4444';
    for (let i = 0; i < 30; i++) {
      const px = ((i * 91 + (now * 1.1)) % (width + 200)) - 100;
      const py = ((i * 47 + (now * 0.3)) % height);
      ctx.fillRect(px, py, i % 2 === 0 ? 3 : 2, i % 2 === 0 ? 2 : 1.5);
    }

    // 3. Dark Vignette & Storm Warning Border
    const pScreenX = engine.player.x + engine.player.width / 2 - this.cameraX;
    const pScreenY = engine.player.y + engine.player.height / 2 - this.cameraY;
    const safe = engine.isPlayerInSafeBase;

    const stormVignette = ctx.createRadialGradient(
      pScreenX,
      pScreenY,
      safe ? 130 : 60,
      pScreenX,
      pScreenY,
      Math.max(width, height) * 0.75
    );
    stormVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    stormVignette.addColorStop(0.5, safe ? 'rgba(15, 23, 42, 0.25)' : 'rgba(30, 10, 10, 0.45)');
    stormVignette.addColorStop(1, safe ? 'rgba(3, 7, 18, 0.6)' : 'rgba(69, 10, 10, 0.85)');

    ctx.fillStyle = stormVignette;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }
}
