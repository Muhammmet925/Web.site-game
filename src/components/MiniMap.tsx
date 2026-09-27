import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';
import { TileType, LayerZone } from '../types/game';
import { SURFACE_BOTTOM, UNDERGROUND_BOTTOM, WORLD_HEIGHT, WORLD_WIDTH } from '../game/constants';
import { Sun, Moon, Map, Compass } from 'lucide-react';

interface MiniMapProps {
  engine: GameEngine;
  onOpenJournalMap?: () => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({ engine, onOpenJournalMap }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const p = engine.player;
  const isNight = engine.isNight;
  const ambientTime = engine.world.ambientTime;
  // Ambient time: 0 = Dawn, 600 = Noon, 1200 = Dusk, 1800 = Midnight (cycle: 2400)
  const timeProgress = (ambientTime / 2400) % 1;

  // Visual time period name and icon
  const timePeriod =
    ambientTime >= 2100 || ambientTime < 300
      ? { label: 'Gece Yarısı', color: 'text-indigo-300', isSun: false }
      : ambientTime < 700
      ? { label: 'Şafak Vakti', color: 'text-amber-300', isSun: true }
      : ambientTime < 1400
      ? { label: 'Gündüz', color: 'text-yellow-400', isSun: true }
      : { label: 'Alacakaranlık', color: 'text-orange-400', isSun: false };

  // Render mini-map canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // We render a local tactical radar around the player:
      // ~56 tiles wide, ~36 tiles high centered on player
      const pTileX = Math.floor(engine.player.x / 24);
      const pTileY = Math.floor(engine.player.y / 24);

      const spanX = 52;
      const spanY = 34;
      const startX = Math.max(0, pTileX - Math.floor(spanX / 2));
      const endX = Math.min(WORLD_WIDTH - 1, startX + spanX);
      const startY = Math.max(0, pTileY - Math.floor(spanY / 2));
      const endY = Math.min(WORLD_HEIGHT - 1, startY + spanY);

      const cellW = width / spanX;
      const cellH = height / spanY;

      // Draw Tiles & Zones
      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          const tile = engine.getTile(x, y);
          const wall = engine.getWall(x, y);
          const idx = y * WORLD_WIDTH + x;
          const isLight = engine.world.lightMap[idx] > 20;
          const isPurified = engine.world.purifiedMap[idx] === 1;

          const drawX = (x - startX) * cellW;
          const drawY = (y - startY) * cellH;

          if (tile === TileType.AIR) {
            if (wall !== TileType.AIR) {
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(drawX, drawY, cellW + 0.5, cellH + 0.5);
            } else if (y < SURFACE_BOTTOM) {
              // Surface sky
              ctx.fillStyle = isNight ? '#090d16' : '#1e293b50';
              ctx.fillRect(drawX, drawY, cellW + 0.5, cellH + 0.5);
            }
          } else if (tile === TileType.DIRT || tile === TileType.GRASS_DIRT) {
            ctx.fillStyle = isPurified ? '#15803d' : '#451a03';
            ctx.fillRect(drawX, drawY, cellW + 0.5, cellH + 0.5);
          } else if (tile === TileType.STONE || tile === TileType.ASH_ROCK) {
            ctx.fillStyle = isPurified ? '#334155' : '#1e293b';
            ctx.fillRect(drawX, drawY, cellW + 0.5, cellH + 0.5);
          } else if (tile === TileType.COPPER_ORE) {
            ctx.fillStyle = '#f97316';
            ctx.fillRect(drawX, drawY, cellW + 0.5, cellH + 0.5);
          } else if (tile === TileType.SILVER_ORE) {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(drawX, drawY, cellW + 0.5, cellH + 0.5);
          } else if (tile === TileType.EMBER_CRYSTAL) {
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(drawX, drawY, cellW + 0.5, cellH + 0.5);
          } else if (tile === TileType.OBSIDIAN || tile === TileType.ANCIENT_BRICK) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(drawX, drawY, cellW + 0.5, cellH + 0.5);
          } else if (tile === TileType.PLATFORM) {
            ctx.fillStyle = '#92400e';
            ctx.fillRect(drawX, drawY, cellW + 0.5, 1.5);
          } else if (tile === TileType.TORCH || tile === TileType.EMBER_BRAZIER) {
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(drawX, drawY, cellW + 1, cellH + 1);
          }

          // Soft light wash over illuminated tiles
          if (isLight) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
            ctx.fillRect(drawX, drawY, cellW + 0.5, cellH + 0.5);
          }
        }
      }

      // Draw Nearby NPCs
      for (const npc of engine.npcs) {
        if (npc.x >= startX && npc.x <= endX && npc.y >= startY && npc.y <= endY) {
          const nx = (npc.x - startX) * cellW;
          const ny = (npc.y - startY) * cellH;
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(nx, ny, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Nearby Enemies
      for (const enemy of engine.enemies) {
        const eTileX = enemy.x / 24;
        const eTileY = enemy.y / 24;
        if (eTileX >= startX && eTileX <= endX && eTileY >= startY && eTileY <= endY) {
          const ex = (eTileX - startX) * cellW;
          const ey = (eTileY - startY) * cellH;
          ctx.fillStyle = enemy.type === 'boss_ignis' ? '#f43f5e' : '#ef4444';
          ctx.beginPath();
          ctx.arc(ex, ey, enemy.type === 'boss_ignis' ? 4.5 : 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Player Beacon (Golden pointer)
      const px = (pTileX - startX) * cellW;
      const py = (pTileY - startY) * cellH;

      // Radiant pulse ring
      const pulse = (Date.now() % 1000) / 1000;
      ctx.strokeStyle = `rgba(251, 191, 36, ${1 - pulse})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, 3 + pulse * 6, 0, Math.PI * 2);
      ctx.stroke();

      // Core pointer
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Facing arrow
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + engine.player.facing * 6, py);
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  return (
    <div
      id="hud-minimap-container"
      className="pointer-events-auto flex flex-col items-end gap-1.5"
    >
      {/* Mini-map Box with Day/Night Celestial Tracker */}
      <div className="relative p-1 bg-slate-950/90 backdrop-blur-md rounded-xl border border-slate-800/90 shadow-2xl overflow-hidden group">
        {/* Top Header: Time Cycle Badge & Quick Map Button */}
        <div className="flex items-center justify-between px-2 py-1 bg-slate-900/80 rounded-t-lg border-b border-slate-800 text-[10px]">
          {/* Day/Night Transition Icon & Label */}
          <div className="flex items-center gap-1.5" title={`Zaman Döngüsü: ${timePeriod.label}`}>
            {timePeriod.isSun ? (
              <Sun className={`w-3.5 h-3.5 ${timePeriod.color} animate-spin-slow transition-transform`} />
            ) : (
              <Moon className={`w-3.5 h-3.5 ${timePeriod.color} animate-pulse transition-transform`} />
            )}
            <span className={`font-serif font-bold ${timePeriod.color}`}>
              {timePeriod.label}
            </span>
          </div>

          {/* Coordinates & Zone Indicator */}
          <div className="flex items-center gap-1 font-mono text-slate-400 text-[9px]">
            <span>
              {Math.floor(p.x / 24)}X {Math.floor(p.y / 24)}Y
            </span>
          </div>
        </div>

        {/* Tactical Minimap Canvas */}
        <div
          onClick={onOpenJournalMap}
          className="relative cursor-pointer transition-transform active:scale-[0.98]"
          title="Bölgesel Mini-Harita (Tıkla ve Külyurdu Haritasını Aç)"
        >
          <canvas
            ref={canvasRef}
            width={140}
            height={90}
            className="block rounded-b-lg border border-slate-900"
          />

          {/* Hover Overlay Hint */}
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-b-lg">
            <span className="text-[10px] font-serif font-bold text-amber-300 bg-slate-900/90 px-2 py-0.5 rounded border border-amber-500/40 flex items-center gap-1 shadow">
              <Map className="w-3 h-3" /> Haritayı Aç
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
