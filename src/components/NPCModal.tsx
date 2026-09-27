import React from 'react';
import { NPCData } from '../types/game';
import { GameEngine } from '../game/engine';
import { X, MessageSquare, Sparkles, Home, ShieldCheck } from 'lucide-react';

interface NPCModalProps {
  npc: NPCData;
  engine: GameEngine;
  onClose: () => void;
}

export const NPCModal: React.FC<NPCModalProps> = ({ npc, engine, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 bg-slate-800 rounded-xl border border-slate-700">
              {npc.avatar}
            </span>
            <div>
              <h3 className="font-serif text-base font-bold text-slate-100">{npc.name}</h3>
              <span className="text-xs text-amber-400 font-serif tracking-wide">{npc.title}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {/* Status: Settled or Homeless */}
          <div
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs ${
              npc.settled
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
            }`}
          >
            {npc.settled ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bu NPC ışıkla arındırılmış bir sığınağa yerleşti! Köyün korunuyor.</span>
              </>
            ) : (
              <>
                <Home className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Sığınak Arayışı: Buraya duvarlar örüp meşale yerleştirirsen bu NPC kalıcı olarak yerleşecek!
                </span>
              </>
            )}
          </div>

          {/* Dialogue Box */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs text-sky-400 font-mono">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Sözler:</span>
            </div>
            {npc.dialogue.map((line, idx) => (
              <p key={idx} className="text-xs text-slate-300 italic font-serif leading-relaxed">
                "{line}"
              </p>
            ))}
          </div>

          {/* Special NPC action */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                if (npc.id === 'npc_herbalist') {
                  engine.handleFocusHeal();
                } else if (npc.id === 'npc_smith') {
                  engine.player.stats.attackPower += 2;
                  engine.addFloatingText(engine.player.x, engine.player.y - 20, 'Kılıç Bilendi! (+2 Hasar)', '#fbbf24');
                } else if (npc.id === 'npc_archivist') {
                  engine.igniteLightSource(Math.floor(engine.player.x / 24), Math.floor(engine.player.y / 24), 16);
                }
                onClose();
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-serif font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {npc.id === 'npc_herbalist'
                  ? 'Şifa İste'
                  : npc.id === 'npc_smith'
                  ? 'Silahı Bile (+2 Hasar)'
                  : 'Işık Ayinini Genişlet'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
