import React, { useState, useEffect } from 'react';
import { GameEngine } from '../game/engine';
import { SaveManager, SaveSlotId, SAVE_SLOT_KEYS } from '../game/saveManager';
import { SaveSlotMeta } from '../types/game';
import {
  Save,
  RotateCcw,
  Trash2,
  X,
  Sparkles,
  Flame,
  CheckCircle2,
  FolderOpen,
  Calendar,
  Layers,
  Heart,
  Plus,
} from 'lucide-react';

interface SaveSlotsModalProps {
  engine: GameEngine;
  onClose: () => void;
  onSlotLoaded?: () => void;
  mode?: 'save_and_load' | 'load_only';
}

export const SaveSlotsModal: React.FC<SaveSlotsModalProps> = ({
  engine,
  onClose,
  onSlotLoaded,
  mode = 'save_and_load',
}) => {
  const [slots, setSlots] = useState<SaveSlotMeta[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<SaveSlotId>('slot_1');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshSlots = () => {
    const metas = SaveManager.getAllSlotMetas();
    setSlots(metas);
    setActiveSlotId(SaveManager.getActiveSlotId());
  };

  useEffect(() => {
    refreshSlots();
  }, []);

  const handleSave = (slotId: SaveSlotId) => {
    const success = SaveManager.saveToSlot(slotId, engine);
    if (success) {
      setStatusMessage(`${slotId.toUpperCase().replace('_', ' ')} Başarıyla Kaydedildi!`);
      refreshSlots();
      setTimeout(() => setStatusMessage(null), 2500);
    } else {
      setStatusMessage('Kayıt başarısız oldu.');
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  const handleLoad = (slotId: SaveSlotId) => {
    const success = SaveManager.loadFromSlot(slotId, engine);
    if (success) {
      setStatusMessage(`${slotId.toUpperCase().replace('_', ' ')} Yüklendi!`);
      refreshSlots();
      if (onSlotLoaded) {
        onSlotLoaded();
      }
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 700);
    } else {
      setStatusMessage('Kayıt yüklenemedi.');
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  const handleDelete = (slotId: SaveSlotId) => {
    const success = SaveManager.deleteSlot(slotId);
    if (success) {
      setStatusMessage(`${slotId.toUpperCase().replace('_', ' ')} Silindi.`);
      refreshSlots();
      setTimeout(() => setStatusMessage(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-serif text-lg font-bold text-slate-100 tracking-wide">
                Kayıt Dosyaları & Yuvalar (Save Slots)
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Birden fazla macera kaydı oluşturabilir, yükleyebilir veya silebilirsin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div className="bg-amber-950/80 border-b border-amber-600/40 px-6 py-2 text-xs font-semibold text-amber-200 flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Slots List */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          {slots.map((slot) => {
            const isCurrentActive = activeSlotId === slot.id;

            return (
              <div
                key={slot.id}
                className={`relative p-4 rounded-xl border transition-all ${
                  slot.exists
                    ? isCurrentActive
                      ? 'bg-slate-900/90 border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-dashed border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Slot Details */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm font-mono shrink-0 border ${
                        slot.exists
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-600'
                      }`}
                    >
                      {slot.id.replace('slot_', 'S')}
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-slate-200 text-sm">{slot.name}</span>
                        {isCurrentActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/50 text-amber-300">
                            Aktif Yuva
                          </span>
                        )}
                        {!slot.exists && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                            Boş Yuva
                          </span>
                        )}
                      </div>

                      {slot.exists ? (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {slot.savedAt}
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-sky-400" />
                            {slot.zone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-red-400" />
                            {slot.hp}/{slot.maxHp} Maske
                          </span>
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            %{slot.purificationPercent} Arınma
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">
                          Bu yuvada henüz kaydedilmiş bir oyun bulunmuyor.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {mode === 'save_and_load' && (
                      <button
                        onClick={() => handleSave(slot.id as SaveSlotId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 text-xs font-semibold rounded-lg shadow transition active:scale-95 cursor-pointer"
                        title={slot.exists ? 'Bu yuvayı güncelle' : 'Bu yuvaya kaydet'}
                      >
                        {slot.exists ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{slot.exists ? 'Kaydet' : 'Oluştur'}</span>
                      </button>
                    )}

                    {slot.exists && (
                      <>
                        <button
                          onClick={() => handleLoad(slot.id as SaveSlotId)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-950/80 hover:bg-sky-900 border border-sky-700/60 text-sky-200 text-xs font-semibold rounded-lg shadow transition active:scale-95 cursor-pointer"
                          title="Bu kaydı yükle"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Yükle</span>
                        </button>

                        <button
                          onClick={() => handleDelete(slot.id as SaveSlotId)}
                          className="p-1.5 bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800/40 text-rose-300 rounded-lg transition active:scale-95 cursor-pointer"
                          title="Kaydı sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Hint */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Kayıtlar tarayıcının yerel hafızasında (localStorage) güvenle saklanır.</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
