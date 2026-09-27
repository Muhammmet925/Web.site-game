import React, { useState } from 'react';
import { GameEngine } from '../game/engine';
import { DEFAULT_ACHIEVEMENTS, LORE_ENTRIES, SURFACE_BOTTOM, UNDERGROUND_BOTTOM, WORLD_HEIGHT, WORLD_WIDTH } from '../game/constants';
import { X, BookOpen, Map, Flame, Trophy, CheckCircle2, Lock, Sparkles } from 'lucide-react';

interface JournalModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const JournalModal: React.FC<JournalModalProps> = ({ engine, onClose }) => {
  const [activeTab, setActiveTab] = useState<'map' | 'lore' | 'abilities' | 'achievements'>('map');
  const p = engine.player;
  const achievements = engine.getAchievements();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h2 className="font-serif text-lg font-bold text-slate-100 tracking-wide">
              Kül Arşivi & Külyurdu Haritası
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'map' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>Harita</span>
              </button>
              <button
                onClick={() => setActiveTab('lore')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'lore' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Kadim Tabletler</span>
              </button>
              <button
                onClick={() => setActiveTab('abilities')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'abilities' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Yetenekler</span>
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'achievements' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Başarılar ({unlockedCount}/{achievements.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: WORLD MAP */}
          {activeTab === 'map' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Külyurdu Kıtasal Haritası (3 Katman)</span>
                <span className="text-amber-400 font-mono font-bold">
                  Arındırılan Bölge: %{engine.purificationPercent}
                </span>
              </div>

              {/* Minimap Render Container */}
              <div className="relative w-full h-80 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col justify-between p-3">
                {/* Visual Layers on Minimap */}
                <div className="absolute inset-x-0 top-0 h-[34%] bg-slate-900/40 border-b border-dashed border-sky-800/40 flex items-center px-4">
                  <span className="text-[11px] font-serif text-sky-400/70 font-semibold tracking-wider">
                    I. KATMAN: YÜZEY (Yıkık Orman & Rüzgarlı Tepeler)
                  </span>
                </div>
                <div className="absolute inset-x-0 top-[34%] h-[38%] bg-amber-950/10 border-b border-dashed border-amber-800/40 flex items-center px-4">
                  <span className="text-[11px] font-serif text-amber-400/70 font-semibold tracking-wider">
                    II. KATMAN: YERALTI (Maden Damarları & Kristal Mağaraları)
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-[28%] bg-indigo-950/20 flex items-center px-4">
                  <span className="text-[11px] font-serif text-purple-400/70 font-semibold tracking-wider">
                    III. KATMAN: DERİN HARABELER (Alevdoğan Mezarları & Ignis Arenası)
                  </span>
                </div>

                {/* Player location marker */}
                {(() => {
                  const pNormX = (p.x / (WORLD_WIDTH * 24)) * 100;
                  const pNormY = (p.y / (WORLD_HEIGHT * 24)) * 100;
                  return (
                    <div
                      className="absolute w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white shadow-[0_0_10px_#f59e0b] -translate-x-1/2 -translate-y-1/2 animate-ping"
                      style={{ left: `${pNormX}%`, top: `${pNormY}%` }}
                    />
                  );
                })()}

                {/* Start Hearth Marker */}
                <div
                  className="absolute w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white -translate-x-1/2 -translate-y-1/2"
                  style={{ left: '20%', top: '25%' }}
                  title="Başlangıç Ocağı"
                />

                {/* Boss Ignis Arena Marker */}
                <div
                  className="absolute w-3 h-3 bg-red-500 rounded-full border border-red-300 shadow-[0_0_8px_#ef4444] -translate-x-1/2 -translate-y-1/2"
                  style={{ left: '72%', top: '92%' }}
                  title="Kül Muhafızı: Ignis Tapınağı"
                />

                {/* Map Legend */}
                <div className="relative z-10 self-end flex items-center gap-4 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Sen (Kül Çocuğu)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Başlangıç Ocağı
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Kadim Muhafız
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANCIENT LORE TABLETS */}
          {activeTab === 'lore' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LORE_ENTRIES.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-slate-950/60 border border-slate-800/90 rounded-xl flex flex-col justify-between gap-3 shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-amber-300 text-sm">{entry.title}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">{entry.dateStr}</span>
                    </div>
                    <span className="text-[11px] text-sky-400 font-mono">Yazar: {entry.author}</span>
                    <p className="text-xs text-slate-300 italic mt-2.5 leading-relaxed font-serif">
                      "{entry.text}"
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 border-t border-slate-900 pt-2">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Alevdoğan Arşivi Parçası</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: ABILITIES & METROIDVANIA PROGRESSION */}
          {activeTab === 'abilities' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
                <div className="p-2.5 bg-sky-950/80 rounded-lg text-sky-400 border border-sky-800/60 text-xl">
                  🦘
                </div>
                <div>
                  <h4 className="font-serif font-bold text-slate-100 text-sm">Çift Zıplama (Double Jump)</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Havada ikinci bir sıçrayış gerçekleştirir. Yüksek uçurumlara tırmanmak için temel yetenek.
                  </p>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono mt-2 inline-block">
                    ✓ AÇIK
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
                <div className="p-2.5 bg-indigo-950/80 rounded-lg text-indigo-400 border border-indigo-800/60 text-xl">
                  🧗
                </div>
                <div>
                  <h4 className="font-serif font-bold text-slate-100 text-sm">Duvar Tırmanma (Wall Climb)</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Duvarlara yapışarak kayma ve karşı duvara sıçrama. Şaftları ve mağaraları aşmayı sağlar.
                  </p>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono mt-2 inline-block">
                    ✓ AÇIK
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
                <div className="p-2.5 bg-amber-950/80 rounded-lg text-amber-400 border border-amber-800/60 text-xl">
                  💨
                </div>
                <div>
                  <h4 className="font-serif font-bold text-slate-100 text-sm">Kül Dash (Air Dash)</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    İleriye doğru hızlı atılma. Atılma esnasında hasar almazsın (I-Frame). Tuzakları ve saldırıları savuşturur.
                  </p>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono mt-2 inline-block">
                    ✓ AÇIK
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
                <div className="p-2.5 bg-purple-950/80 rounded-lg text-purple-400 border border-purple-800/60 text-xl">
                  🪽
                </div>
                <div>
                  <h4 className="font-serif font-bold text-slate-100 text-sm">Ember Wings (Kanat Açma / Glide)</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Havada süzülerek geniş uçurumları aşmayı sağlar. Kadim Muhafız Ignis'i yenerek açılır!
                  </p>
                  <span className={`text-[10px] font-bold font-mono mt-2 inline-block ${
                    p.stats.hasWings ? 'text-emerald-400' : 'text-amber-500'
                  }`}>
                    {p.stats.hasWings ? '✓ AÇILDI' : '🔒 KİLİTLİ (Ignis Patronunu Yen)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACHIEVEMENTS */}
          {activeTab === 'achievements' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span className="font-medium">
                  Külyurdu boyunca elde ettiğin kadim unvanlar ve başarımlar:
                </span>
                <span className="text-amber-400 font-mono font-bold">
                  Kazanılan: {unlockedCount} / {achievements.length} (%{Math.round((unlockedCount / achievements.length) * 100)})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                      ach.unlocked
                        ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                        : 'bg-slate-950/40 border-slate-800/80 opacity-70'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0 border ${
                        ach.unlocked
                          ? 'bg-amber-950/60 border-amber-500/70 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-600'
                      }`}
                    >
                      {ach.unlocked ? ach.icon : '🔒'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`font-serif font-bold text-sm truncate ${
                            ach.unlocked ? 'text-amber-200' : 'text-slate-400'
                          }`}
                        >
                          {ach.title}
                        </h4>
                        {ach.unlocked ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            AÇILDI
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 shrink-0">
                            <Lock className="w-3 h-3" />
                            KİLİTLİ
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {ach.description}
                      </p>

                      {ach.unlocked && ach.unlockedAt && (
                        <span className="text-[10px] text-slate-500 font-mono mt-1.5 block">
                          Tarih: {ach.unlockedAt}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
