import React, { useEffect, useState } from 'react';
import { GameEngine } from '../game/engine';
import { LayerZone } from '../types/game';
import { MiniMap } from './MiniMap';
import {
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  HelpCircle,
  Sun,
  Moon,
  Wind,
  ShieldAlert,
  Flame,
  Package,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Save,
  Trophy,
  Zap,
} from 'lucide-react';

interface HUDProps {
  engine: GameEngine;
  onOpenInventory: () => void;
  onOpenJournal: () => void;
  onOpenControls: () => void;
  onOpenSkills?: () => void;
  onOpenSaveSlots?: () => void;
  onOpenNPC?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onJumpClick?: () => void;
  onDashClick?: () => void;
  onAttackClick?: () => void;
  onParryClick?: () => void;
  onCastClick?: () => void;
  onHealClick?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  engine,
  onOpenInventory,
  onOpenJournal,
  onOpenControls,
  onOpenSkills,
  onOpenSaveSlots,
  onOpenNPC,
  isMuted,
  onToggleMute,
}) => {
  // Real-time tick to ensure HUD stays responsive to engine changes
  const [, setTick] = useState(0);

  useEffect(() => {
    let animId: number;
    let lastTime = 0;
    const updateHUD = (time: number) => {
      if (time - lastTime > 50) {
        lastTime = time;
        setTick((t) => (t + 1) % 10000);
      }
      animId = requestAnimationFrame(updateHUD);
    };
    animId = requestAnimationFrame(updateHUD);
    return () => cancelAnimationFrame(animId);
  }, []);

  const p = engine.player;
  const isNight = Math.sin((engine.world.ambientTime / 2400) * Math.PI * 2) < 0;
  const integrity = engine.localLightIntegrity;
  const inSafeBase = engine.isPlayerInSafeBase;
  const isStorm = engine.world.isAshStorm;

  // Zone display name
  const zoneName =
    engine.currentZone === LayerZone.SURFACE
      ? 'Yüzey: Yıkık Orman & Kadim Tapınak'
      : engine.currentZone === LayerZone.UNDERGROUND
      ? 'Yeraltı: Kristal & Maden Mağaraları'
      : 'Derin Harabeler: Alevdoğan Kalıntıları';

  // Light Integrity Status config
  const integrityColor = inSafeBase
    ? 'text-emerald-300 border-emerald-500/50 bg-emerald-950/60'
    : integrity >= 60
    ? 'text-amber-300 border-amber-500/50 bg-amber-950/60'
    : integrity >= 25
    ? 'text-orange-300 border-orange-500/40 bg-orange-950/50'
    : 'text-rose-400 border-rose-500/50 bg-rose-950/70 animate-pulse';

  const integrityBarColor = inSafeBase
    ? 'from-emerald-500 to-teal-400'
    : integrity >= 60
    ? 'from-amber-500 to-yellow-300'
    : integrity >= 25
    ? 'from-orange-500 to-amber-400'
    : 'from-rose-600 to-red-500';

  const integrityLabel = inSafeBase
    ? 'Kutsal Sığınak (Güvendesin)'
    : integrity >= 60
    ? 'Arınmış Bölge'
    : integrity >= 25
    ? 'Alacakaranlık Sınırı'
    : 'Yozlaşmış Karanlık!';

  const selectedItem = p.inventory[p.selectedHotbarIndex];

  return (
    <div
      id="game-hud"
      className="pointer-events-none absolute inset-0 select-none overflow-hidden p-2.5 sm:p-4 md:p-5 flex flex-col justify-between"
    >
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-3 md:gap-4">
        {/* Left: Hollow Knight style Health Masks, Ash Vessel & Light Integrity */}
        <div className="flex flex-col gap-2">
          {/* Health Masks */}
          <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 shadow-xl w-fit">
            {Array.from({ length: p.stats.maxHp }).map((_, i) => {
              const hasMask = i < p.stats.hp;
              return (
                <div
                  key={i}
                  className={`w-5 sm:w-6 h-6 sm:h-7 rounded-t-lg rounded-b-md border transition-all duration-300 flex items-center justify-center ${
                    hasMask
                      ? 'bg-gradient-to-b from-slate-100 to-slate-300 border-white shadow-[0_0_8px_rgba(255,255,255,0.7)]'
                      : 'bg-slate-900/60 border-slate-700 opacity-30'
                  }`}
                >
                  <div className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${hasMask ? 'bg-slate-900' : 'bg-transparent'}`} />
                </div>
              );
            })}
          </div>

          {/* Ash Energy Vessel (Kül Enerjisi) */}
          <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl w-44 sm:w-52">
            <Flame className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-500 animate-pulse shrink-0" />
            <div className="flex-1 h-2.5 sm:h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-sky-400 transition-all duration-150 rounded-full"
                style={{ width: `${(p.stats.ash / p.stats.maxAsh) * 100}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-amber-300 font-semibold shrink-0">
              {Math.floor(p.stats.ash)}
            </span>
          </div>

          {/* LOCAL LIGHT INTEGRITY INDICATOR (Requested Feature) */}
          <div
            id="hud-light-integrity"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-xl transition-all w-fit max-w-xs ${integrityColor}`}
            title="Çevredeki Işık Bütünlüğü: Karanlığa ve Fırtınaya Karşı Güvenlik Durumu"
          >
            {inSafeBase ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            ) : integrity < 25 ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Işık Bütünlüğü</span>
                <span className="text-xs font-mono font-black">%{integrity}</span>
              </div>
              {/* Mini progress bar */}
              <div className="w-24 sm:w-28 h-1.5 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700/60 mt-1">
                <div
                  className={`h-full bg-gradient-to-r transition-all duration-300 ${integrityBarColor}`}
                  style={{ width: `${integrity}%` }}
                />
              </div>
              <span className="text-[9px] font-serif italic mt-0.5 opacity-90">{integrityLabel}</span>
            </div>
          </div>

          {/* Active Wings Status Indicator */}
          {p.stats.hasWings && (
            <div className="flex items-center gap-1.5 bg-sky-950/70 border border-sky-600/40 text-sky-300 text-[10px] sm:text-[11px] font-medium px-2.5 py-0.5 rounded-md w-fit">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>Ember Wings Aktif (Boşluk Basılı Tut)</span>
            </div>
          )}
        </div>

        {/* Center: Zone, Ash Storm Warning & Global World Purification Banner */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full border border-slate-800/80 shadow-2xl">
            {isNight ? <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> : <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            <span className="text-[11px] sm:text-xs font-serif tracking-wide text-slate-200">{zoneName}</span>
          </div>

          {/* Ash Storm Live Banner */}
          {isStorm && (
            <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border shadow-lg animate-pulse bg-rose-950/90 border-rose-500/70 text-rose-200">
              <Wind className="w-3.5 h-3.5 text-rose-400 animate-spin" />
              <span>KÜL FIRTINASI AKTİF!</span>
              <span className="text-[10px] opacity-80 font-normal">
                {inSafeBase ? '(Sığınakta Güvendesin)' : '(Işıklı Sığınağa Kaç!)'}
              </span>
            </div>
          )}

          {/* Global Purification Metric ("Yaktığın Işık, Kalıcı İz Bırakır") */}
          <div className="flex items-center gap-2 bg-amber-950/40 backdrop-blur-sm px-3 py-1 rounded-full border border-amber-500/30 text-[11px] sm:text-xs text-amber-300">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="font-serif">Külyurdu Arındırma:</span>
            <span className="font-mono font-bold text-amber-200">%{engine.purificationPercent}</span>
          </div>
        </div>

        {/* Right: Quick Action Modals / Audio Toggles & MiniMap */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
            <button
              id="btn-open-inventory"
              onClick={onOpenInventory}
              className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-md active:scale-95"
              title="Envanter ve Zanaat (C)"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Envanter (C)</span>
            </button>

            {onOpenSkills && (
              <button
                id="btn-open-skills"
                onClick={onOpenSkills}
                className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-600/50 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-md active:scale-95"
                title="Yetenek Ağacı & Gelişim (K)"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Yetenekler (K)</span>
              </button>
            )}

            <button
              id="btn-open-journal"
              onClick={onOpenJournal}
              className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-md active:scale-95"
              title="Günlük & Harita & Başarılar (M / Tab)"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">Günlük (M)</span>
            </button>

            {onOpenSaveSlots && (
              <button
                id="btn-open-save-slots"
                onClick={onOpenSaveSlots}
                className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-md active:scale-95"
                title="Kayıt Dosyaları (Slot 1, 2, 3...)"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Kayıtlar</span>
              </button>
            )}

            <button
              id="btn-toggle-mute"
              onClick={onToggleMute}
              className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg transition-all shadow-md active:scale-95"
              title="Ses Aç/Kapat"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              id="btn-open-controls"
              onClick={onOpenControls}
              className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg transition-all shadow-md active:scale-95"
              title="Kontroller ve Kılavuz"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>

          {/* Mini-Map Component with Celestial Day/Night Tracker */}
          <MiniMap engine={engine} onOpenJournalMap={onOpenJournal} />
        </div>
      </div>

      {/* RECENT ACHIEVEMENT UNLOCKED BANNER */}
      {engine.recentAchievement && (
        <div className="self-center mt-2 bg-gradient-to-r from-amber-950/95 via-slate-950/95 to-amber-950/95 border border-amber-500/70 px-4 py-2.5 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.35)] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-serif font-bold text-amber-400">
                BAŞARI KAZANILDI!
              </span>
            </div>
            <span className="text-xs font-serif font-bold text-slate-100">
              {engine.recentAchievement.title}
            </span>
            <span className="text-[11px] text-slate-400">
              {engine.recentAchievement.description}
            </span>
          </div>
        </div>
      )}

      {/* CENTER POPUP ALERT (Lore discovered or boss defeated) */}
      {engine.activeLoreAlert && (
        <div className="self-center bg-slate-950/95 border border-amber-500/60 p-4 rounded-xl shadow-2xl text-center max-w-md animate-in fade-in zoom-in duration-300 pointer-events-auto">
          <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-1" />
          <p className="text-sm font-serif text-slate-200 italic">{engine.activeLoreAlert}</p>
          <button
            onClick={() => (engine.activeLoreAlert = null)}
            className="mt-3 px-4 py-1 text-xs bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg"
          >
            Devam Et
          </button>
        </div>
      )}

      {/* BOSS HEALTH BAR (If fighting Ignis in Deep Ruins) */}
      {engine.bossActive && (
        <div className="self-center w-full max-w-xl bg-slate-950/90 border border-red-900/80 p-3 rounded-xl shadow-2xl flex flex-col gap-1.5 mb-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-serif font-bold tracking-wider text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> KÜL MUHAFIZI: IGNIS
            </span>
            <span className="font-mono text-slate-400">
              {engine.bossHp} / {engine.bossMaxHp}
            </span>
          </div>
          <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-red-950">
            <div
              className="h-full bg-gradient-to-r from-red-800 via-red-600 to-amber-500 transition-all duration-200"
              style={{ width: `${Math.max(0, (engine.bossHp / engine.bossMaxHp) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* NEARBY NPC INTERACTION PROMPT */}
      {engine.nearbyNPC && (
        <div className="pointer-events-auto self-center mb-1 flex items-center gap-2.5 bg-slate-950/95 border border-amber-500/80 px-3.5 py-1.5 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-in fade-in slide-in-from-bottom-2">
          <span className="text-base">{engine.nearbyNPC.avatar}</span>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold text-amber-400 font-serif">
              {engine.nearbyNPC.name}
            </span>
            <span className="text-[10px] text-slate-300">
              {engine.nearbyNPC.title}
            </span>
          </div>
          <button
            onClick={() => {
              if (!engine.activeSpeechBubble || engine.activeSpeechBubble.npcId !== engine.nearbyNPC?.id) {
                engine.triggerNPCSpeech(engine.nearbyNPC!);
              } else {
                onOpenNPC?.();
              }
            }}
            className="ml-2 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-lg text-xs font-bold transition-all active:scale-95"
          >
            {engine.activeSpeechBubble?.npcId === engine.nearbyNPC.id ? 'Menüyü Aç [E]' : 'Konuş [E]'}
          </button>
        </div>
      )}

      {/* BOTTOM AREA: HOTBAR & ON-SCREEN CONTROLS */}
      <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-2.5">
        {/* Quick Primary Tool Selector & Hotbar (Terraria style 1-8 slots) */}
        <div className="pointer-events-auto flex flex-col gap-1">
          {/* Selected Tool Name Banner */}
          {selectedItem && (
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800/80 px-2.5 py-0.5 rounded-md text-[11px] text-slate-300 w-fit backdrop-blur-sm">
              <span className="text-amber-400 font-semibold">{selectedItem.name}</span>
              {selectedItem.type === 'weapon' && (
                <span className="text-rose-400 text-[10px] font-mono">(Hasar: {selectedItem.damage})</span>
              )}
              {selectedItem.type === 'tool' && (
                <span className="text-sky-400 text-[10px] font-mono">(Kazma: {selectedItem.miningPower})</span>
              )}
              {selectedItem.type === 'placeable' && (
                <span className="text-emerald-400 text-[10px] font-mono">(Yerleştirilebilir)</span>
              )}
            </div>
          )}

          {/* Hotbar Slots */}
          <div
            id="hud-hotbar"
            className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/80 shadow-2xl"
          >
            {Array.from({ length: 8 }).map((_, idx) => {
              const item = p.inventory[idx];
              const isSelected = p.selectedHotbarIndex === idx;

              return (
                <button
                  key={idx}
                  id={`hotbar-slot-${idx}`}
                  onClick={() => {
                    p.selectedHotbarIndex = idx;
                  }}
                  className={`relative w-10 sm:w-11 h-10 sm:h-11 rounded-lg flex flex-col items-center justify-center border transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-950/50 shadow-[0_0_12px_rgba(245,158,11,0.45)] scale-105 z-10'
                      : 'border-slate-800 bg-slate-900/70 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                  title={item ? `${item.name} (${idx + 1} Tuşu)` : `Boş Yuva (${idx + 1} Tuşu)`}
                >
                  <span className="absolute top-0.5 left-1 text-[9px] font-mono text-slate-400 font-bold">
                    {idx + 1}
                  </span>
                  {item ? (
                    <>
                      <span className="text-base sm:text-lg select-none">{item.icon}</span>
                      {item.stack > 1 && (
                        <span className="absolute bottom-0.5 right-1 text-[10px] font-mono font-bold text-amber-300">
                          {item.stack}
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800/50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick action buttons for touch & rapid gameplay */}
        <div className="pointer-events-auto flex flex-wrap justify-end gap-1.5">
          <button
            onClick={() => engine.handleJump()}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg shadow active:scale-95"
            title="Zıpla / Duvar Zıplayışı / Kanat (Space)"
          >
            Zıpla
          </button>
          <button
            onClick={() => engine.handleDash()}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-sky-950/80 hover:bg-sky-900 border border-sky-700/60 text-sky-200 text-xs font-semibold rounded-lg shadow active:scale-95"
            title="Kül Dash (Shift)"
          >
            Dash
          </button>
          <button
            onClick={() => engine.handleAttack('forward')}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-200 text-xs font-semibold rounded-lg shadow active:scale-95"
            title="Saldır / Pogo (J / Tıkla)"
          >
            Saldır
          </button>
          <button
            onClick={() => engine.handleParry()}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 text-xs font-semibold rounded-lg shadow active:scale-95"
            title="Parry / Kalkan (Q / Sağ Tık)"
          >
            Parry
          </button>
          <button
            onClick={() => engine.handleCastSpell()}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-orange-950/80 hover:bg-orange-900 border border-orange-700/60 text-orange-200 text-xs font-semibold rounded-lg shadow active:scale-95"
            title="Kül Patlaması Büyüsü (L)"
          >
            Büyü (25)
          </button>
          <button
            onClick={() => engine.handleFocusHeal()}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 text-xs font-semibold rounded-lg shadow active:scale-95"
            title="Odaklan ve İyileş (H)"
          >
            Şifa (H)
          </button>
        </div>
      </div>
    </div>
  );
};
