import React, { useEffect, useMemo, useState } from 'react';
import { generateWorld } from './game/worldGenerator';
import { GameEngine } from './game/engine';
import { audio } from './game/audio';
import { SaveManager, SaveSlotId } from './game/saveManager';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { InventoryCraftingModal } from './components/InventoryCraftingModal';
import { JournalModal } from './components/JournalModal';
import { NPCModal } from './components/NPCModal';
import { ControlsGuide } from './components/ControlsGuide';
import { SaveSlotsModal } from './components/SaveSlotsModal';
import { SkillTreeModal } from './components/SkillTreeModal';
import {
  Sparkles,
  Flame,
  Pickaxe,
  Swords,
  Feather,
  Compass,
  Play,
  RotateCcw,
  Save,
  Volume2,
  VolumeX,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showNPC, setShowNPC] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showSaveSlots, setShowSaveSlots] = useState(false);
  const [saveSlotsMode, setSaveSlotsMode] = useState<'save_and_load' | 'load_only'>('save_and_load');
  const [isMuted, setIsMuted] = useState(false);
  const [saveAlert, setSaveAlert] = useState<string | null>(null);

  // Initialize World & Game Engine
  const engine = useMemo(() => {
    const { world, enemies, spawnX, spawnY } = generateWorld();
    return new GameEngine(world, enemies, spawnX, spawnY);
  }, []);

  // Handle Save Game (Quick save to current active slot)
  const handleSaveGame = () => {
    try {
      const activeSlot = SaveManager.getActiveSlotId();
      const success = SaveManager.saveToSlot(activeSlot, engine);
      if (success) {
        setSaveAlert(`${activeSlot.toUpperCase().replace('_', ' ')} Kaydedildi`);
      } else {
        setSaveAlert('Kayıt Başarısız');
      }
      setTimeout(() => setSaveAlert(null), 2500);
    } catch (e) {
      console.error('Save failed', e);
    }
  };

  // Handle Load Game (Quick load from current active slot)
  const handleLoadGame = () => {
    try {
      const activeSlot = SaveManager.getActiveSlotId();
      const success = SaveManager.loadFromSlot(activeSlot, engine);
      if (success) {
        setSaveAlert(`${activeSlot.toUpperCase().replace('_', ' ')} Yüklendi`);
      } else {
        // Try opening slots modal if active slot is empty
        setSaveSlotsMode('load_only');
        setShowSaveSlots(true);
      }
      setTimeout(() => setSaveAlert(null), 2500);
    } catch (e) {
      console.error('Load failed', e);
    }
  };

  const handleStartGame = () => {
    setGameStarted(true);
    audio.startMusic();
  };

  const handleOpenSaveSlotsFromMenu = () => {
    setSaveSlotsMode('load_only');
    setShowSaveSlots(true);
  };

  const handleToggleMute = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  // Keyboard shortcut listener for modals
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyK') {
        setShowSkills((prev) => !prev);
      }
      if (e.code === 'Escape') {
        setShowInventory(false);
        setShowJournal(false);
        setShowNPC(false);
        setShowSkills(false);
        setShowControls(false);
        setShowSaveSlots(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* TITLE INTRO / MAIN MENU OVERLAY (IF NOT STARTED) */}
      {!gameStarted ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-[#04070e] text-center">
          {/* Ambient glowing backdrop circle */}
          <div className="absolute w-96 h-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl flex flex-col items-center gap-6 animate-in fade-in duration-700">
            {/* Title & Lore Header */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-serif tracking-widest uppercase">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>2D Hikaye Odaklı Açık Dünya Metroidvania</span>
              </div>
              <h1 className="font-serif text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-slate-100 to-amber-400 tracking-wider">
                KÜLYURDU
              </h1>
              <p className="font-serif italic text-sm md:text-base text-slate-400 max-w-lg leading-relaxed mt-1">
                "Karanlığa gömülmüş bir dünyada, hafızasını arayan son ışık taşıyıcısı olarak; Hollow Knight'ın gizemini, Ori'nin duygusunu ve Terraria'nın özgürlüğünü tek bir külden yeniden inşa et."
              </p>
            </div>

            {/* Pillar Showcase Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
              {/* Pillar 1: Hollow Knight */}
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-1.5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-red-400 text-xs font-serif font-bold">
                  <Swords className="w-4 h-4" /> Hollow Knight
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Hassas Souls-lite yakın dövüş, pogo sıçrayışları, parry ritmi ve gizemli karanlık harabeler.
                </p>
              </div>

              {/* Pillar 2: Ori */}
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-1.5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-sky-400 text-xs font-serif font-bold">
                  <Feather className="w-4 h-4" /> Ori
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Akıcı çift zıplama, duvara tırmanma, hava atılışı ve duygusal çevresel şiirsellik.
                </p>
              </div>

              {/* Pillar 3: Terraria */}
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-1.5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-serif font-bold">
                  <Pickaxe className="w-4 h-4" /> Terraria
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Blok kazma, ev ve kale inşası, zanaat ağacı, gece/gündüz döngüsü ve NPC kolonileşmesi.
                </p>
              </div>
            </div>

            {/* Core Hook Badge */}
            <div className="w-full p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl flex items-center justify-center gap-2 text-xs text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-serif">
                <strong>Özgün Hook:</strong> "Yaktığın Işık, Kalıcı İz Bırakır" — Yerleştirdiğin her meşale karanlığı kalıcı olarak geri iter.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                id="btn-start-game"
                onClick={handleStartGame}
                className="px-7 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Yolculuğa Başla</span>
              </button>

              <button
                onClick={handleOpenSaveSlotsFromMenu}
                className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-600/40 font-medium text-xs rounded-xl transition flex items-center gap-1.5 shadow-md"
              >
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>Kayıt Dosyaları</span>
              </button>

              <button
                onClick={() => setShowControls(true)}
                className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-medium text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Kontroller</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE IN-GAME SCREEN */
        <div className="relative w-full h-full">
          {/* Main 2D Canvas Engine */}
          <GameCanvas
            engine={engine}
            onOpenInventory={() => setShowInventory(true)}
            onOpenJournal={() => setShowJournal(true)}
            onOpenNPC={() => setShowNPC(true)}
          />

          {/* Top & Bottom Metroidvania HUD */}
          <HUD
            engine={engine}
            onOpenInventory={() => setShowInventory(true)}
            onOpenJournal={() => setShowJournal(true)}
            onOpenControls={() => setShowControls(true)}
            onOpenSkills={() => setShowSkills(true)}
            onOpenNPC={() => setShowNPC(true)}
            onOpenSaveSlots={() => {
              setSaveSlotsMode('save_and_load');
              setShowSaveSlots(true);
            }}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />

          {/* Save & Load Floating Bar */}
          <div className="absolute bottom-16 left-4 z-40 flex items-center gap-2">
            <button
              onClick={() => {
                setSaveSlotsMode('save_and_load');
                setShowSaveSlots(true);
              }}
              className="flex items-center gap-1.5 bg-slate-950/85 hover:bg-slate-900 text-amber-300 border border-amber-600/50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition shadow-md active:scale-95"
              title="Kayıt Slotlarını Yönet (Slot 1, Slot 2...)"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Slotlar</span>
            </button>
            <button
              onClick={handleSaveGame}
              className="flex items-center gap-1.5 bg-slate-950/80 hover:bg-slate-900 text-slate-300 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-medium transition shadow-md active:scale-95"
              title="Aktif Slota Hızlı Kaydet"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Kaydet</span>
            </button>
            <button
              onClick={handleLoadGame}
              className="flex items-center gap-1.5 bg-slate-950/80 hover:bg-slate-900 text-slate-300 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-medium transition shadow-md active:scale-95"
              title="Aktif Slottan Hızlı Yükle"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Yükle</span>
            </button>
            {saveAlert && (
              <span className="text-[11px] bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 px-2.5 py-1 rounded-md font-mono animate-in fade-in">
                {saveAlert}
              </span>
            )}
          </div>

          {/* MODALS */}
          {showInventory && (
            <InventoryCraftingModal
              engine={engine}
              onClose={() => setShowInventory(false)}
            />
          )}

          {showJournal && (
            <JournalModal
              engine={engine}
              onClose={() => setShowJournal(false)}
            />
          )}

          {showSkills && (
            <SkillTreeModal
              engine={engine}
              onClose={() => setShowSkills(false)}
            />
          )}

          {showNPC && engine.nearbyNPC && (
            <NPCModal
              npc={engine.nearbyNPC}
              engine={engine}
              onClose={() => setShowNPC(false)}
            />
          )}

          {showControls && (
            <ControlsGuide onClose={() => setShowControls(false)} />
          )}

          {showSaveSlots && (
            <SaveSlotsModal
              engine={engine}
              mode={saveSlotsMode}
              onClose={() => setShowSaveSlots(false)}
              onSlotLoaded={() => {
                if (!gameStarted) {
                  handleStartGame();
                }
              }}
            />
          )}
        </div>
      )}

      {/* Global SaveSlots modal can also be opened on start screen */}
      {showSaveSlots && !gameStarted && (
        <SaveSlotsModal
          engine={engine}
          mode={saveSlotsMode}
          onClose={() => setShowSaveSlots(false)}
          onSlotLoaded={() => {
            handleStartGame();
          }}
        />
      )}
    </div>
  );
}
