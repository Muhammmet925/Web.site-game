import React, { useState } from 'react';
import { GameEngine } from '../game/engine';
import { SKILL_TREE_NODES } from '../game/skills';
import { SkillNode } from '../types/game';
import {
  X,
  Sparkles,
  Flame,
  CheckCircle2,
  Lock,
  Pickaxe,
  Wind,
  Shield,
  Zap,
  ChevronRight,
} from 'lucide-react';

interface SkillTreeModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({ engine, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'mining' | 'agility' | 'vitality' | 'sorcery'>('all');
  const [, setRerender] = useState({});

  const p = engine.player;
  const unlockedSkills = engine.unlockedSkills;

  const categories = [
    { id: 'all', label: 'Tüm Yetenekler', icon: Sparkles },
    { id: 'mining', label: 'Madencilik', icon: Pickaxe },
    { id: 'agility', label: 'Çeviklik', icon: Wind },
    { id: 'vitality', label: 'Yaşam / Zırh', icon: Shield },
    { id: 'sorcery', label: 'Köz Büyüsü', icon: Zap },
  ];

  const filteredNodes = SKILL_TREE_NODES.filter((node) => {
    if (activeCategory === 'all') return true;
    return node.category === activeCategory;
  });

  const handleUnlock = (node: SkillNode) => {
    const success = engine.unlockSkill(node.id);
    if (success) {
      setRerender({});
    }
  };

  return (
    <div
      id="skill-tree-modal"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2">
                Yetenek Ağacı (Köz Gelişimi)
              </h2>
              <p className="text-xs text-slate-400">
                Kazdığın madenler ve topladığın kül enerjisi ile yeteneklerini geliştir
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Ash Balance Counter */}
            <div className="flex items-center gap-1.5 bg-slate-950/90 border border-amber-500/50 px-3 py-1.5 rounded-xl shadow-inner">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-amber-300">
                {Math.floor(p.stats.ash)} / {p.stats.maxAsh} Köz
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              title="Kapat (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-600 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Current Stats Overview Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-6 py-3 bg-slate-950/30 border-b border-slate-800/60 text-xs">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Kazma Hızı:</span>
            <span className="font-mono font-bold text-sky-400">
              +{Math.round(engine.getSkillMiningBonus() * 100)}%
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Can (Mask):</span>
            <span className="font-mono font-bold text-red-400">{p.stats.hp} / {p.stats.maxHp}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Saldırı Gücü:</span>
            <span className="font-mono font-bold text-amber-400">{p.stats.attackPower}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Kül Deposu:</span>
            <span className="font-mono font-bold text-purple-400">{p.stats.maxAsh}</span>
          </div>
        </div>

        {/* Nodes Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNodes.map((node) => {
            const isUnlocked = !!unlockedSkills[node.id];
            const canUnlock = engine.canUnlockSkill(node.id);

            // Prerequisite titles
            const missingReqs = (node.requires || []).filter((reqId) => !unlockedSkills[reqId]);
            const reqNames = missingReqs.map(
              (id) => SKILL_TREE_NODES.find((s) => s.id === id)?.name || id
            );

            return (
              <div
                key={node.id}
                className={`relative p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                  isUnlocked
                    ? 'bg-slate-900/90 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : canUnlock
                    ? 'bg-slate-900 border-amber-500/60 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-65'
                }`}
              >
                {/* Node Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                        isUnlocked
                          ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300 shadow-sm'
                          : canUnlock
                          ? 'bg-amber-950/60 border-amber-600/60 text-amber-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {node.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif font-bold text-slate-100 text-sm">
                          {node.name}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                          Kademe {node.tier}
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-400 font-serif capitalize">
                        {node.category === 'mining'
                          ? 'Madencilik'
                          : node.category === 'agility'
                          ? 'Çeviklik'
                          : node.category === 'vitality'
                          ? 'Yaşam Gücü'
                          : 'Köz Büyüsü'}
                      </span>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold font-serif bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded-lg shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                    </span>
                  ) : !canUnlock && missingReqs.length > 0 ? (
                    <span className="flex items-center gap-1 text-slate-500 text-[11px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                      <Lock className="w-3 h-3" /> Kilitli
                    </span>
                  ) : null}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {node.description}
                </p>

                {/* Requirements / Cost and Unlock Button */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Ash Cost */}
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded font-mono flex items-center gap-1 border ${
                        p.stats.ash >= node.cost.ash
                          ? 'bg-amber-950/40 border-amber-600/40 text-amber-300'
                          : 'bg-red-950/40 border-red-800/40 text-red-300'
                      }`}
                    >
                      <Flame className="w-3 h-3 text-amber-400" />
                      {node.cost.ash} Köz
                    </span>

                    {/* Item Requirements */}
                    {node.cost.items?.map((itemCost, idx) => {
                      const userItem = p.inventory.find((i) => i.id === itemCost.itemId);
                      const currentCount = userItem?.stack || 0;
                      const hasEnough = currentCount >= itemCost.count;

                      const itemNames: Record<string, string> = {
                        raw_stone: 'Taş',
                        copper_ore: 'Bakır',
                        silver_ore: 'Gümüş',
                        ember_crystal: 'Kor Kristali',
                        ember_shard: 'Köz Parçası',
                        ash_wood: 'Kül Odunu',
                      };

                      return (
                        <span
                          key={idx}
                          className={`text-[11px] px-2 py-0.5 rounded font-mono border ${
                            hasEnough
                              ? 'bg-slate-950 border-slate-700 text-slate-200'
                              : 'bg-red-950/30 border-red-800/40 text-red-300'
                          }`}
                        >
                          {itemNames[itemCost.itemId] || itemCost.itemId}: {currentCount}/{itemCost.count}
                        </span>
                      );
                    })}
                  </div>

                  {/* Unlock Action Button */}
                  {!isUnlocked ? (
                    <button
                      disabled={!canUnlock}
                      onClick={() => handleUnlock(node)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
                        canUnlock
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-md hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                          : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                      }`}
                    >
                      <span>Kilidi Aç</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-400/80 font-mono">
                      Yetenek Etkisi Uygulandı
                    </span>
                  )}
                </div>

                {/* Prerequisite warning banner if locked by predecessor */}
                {!isUnlocked && missingReqs.length > 0 && (
                  <div className="text-[10px] text-slate-400 italic bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
                    Ön Koşul: {reqNames.join(', ')} kademesinin kilidi açılmalı.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
