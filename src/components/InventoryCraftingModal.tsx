import React, { useState } from 'react';
import { GameEngine } from '../game/engine';
import { CRAFTING_RECIPES } from '../game/constants';
import { CraftingRecipe, Item } from '../types/game';
import {
  X,
  Hammer,
  Package,
  Sparkles,
  Compass,
  Lock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Search,
} from 'lucide-react';

interface InventoryCraftingModalProps {
  engine: GameEngine;
  onClose: () => void;
}

// World resources to track for the discovery catalog
interface ResourceCatalogItem {
  id: string;
  name: string;
  icon: string;
  location: string;
  depthHint: string;
  description: string;
}

const WORLD_RESOURCES: ResourceCatalogItem[] = [
  {
    id: 'ash_wood',
    name: 'Kül Ağacı Odunu',
    icon: '🪵',
    location: 'Yüzey Ormanları',
    depthHint: 'Yüzey Seviyesi (Y: 0 - 45)',
    description: 'Yüzeydeki solgun kül ağaçlarını kazarak veya balta ile keserek elde edilir.',
  },
  {
    id: 'raw_stone',
    name: 'Ham Taş',
    icon: '🪨',
    location: 'Yüzey ve Yeraltı Taş Tabakası',
    depthHint: 'Tüm Katmanlar',
    description: 'Kazmayla kazılan sıradan taş blokları. Temel bina ve ocak yapımında kullanılır.',
  },
  {
    id: 'ember_shard',
    name: 'Köz Parçası',
    icon: '🔥',
    location: 'Yüzey Bitkileri & Yeraltı Canavarları',
    depthHint: 'Yüzey ve Üst Mağaralar',
    description: 'Yüzeydeki alev çalılarını toplayarak ya da canavarları alt ederek elde edilen kor.',
  },
  {
    id: 'ash_flora',
    name: 'Kül Çiçeği',
    icon: '🌿',
    location: 'Nemli Mağara Tavanları & Kökler',
    depthHint: 'Yeraltı Mağaraları (Y: 45 - 90)',
    description: 'Karanlık mağaraların tavanlarında biten şifalı soluk bitki. İksir üretiminde şarttır.',
  },
  {
    id: 'copper_ore',
    name: 'Bakır Cevheri',
    icon: '🔶',
    location: 'Yeraltı Mağaraları',
    depthHint: 'Orta Derinlik (Y: 50 - 130)',
    description: 'Turuncu damarlarla parıldayan temel metal. Alev kılıcı ve fener yapımında kullanılır.',
  },
  {
    id: 'silver_ore',
    name: 'Gümüş Cevheri',
    icon: '⚪',
    location: 'Derin Mağara Damarları',
    depthHint: 'Derin Mağaralar (Y: 90 - 170)',
    description: 'Gümüşi pırıltılı dayanıklı maden. Güçlü kazmalar ve koruyucu maskeler için gereklidir.',
  },
  {
    id: 'ember_crystal',
    name: 'Kor Kristali',
    icon: '💎',
    location: 'Antik Harabeler & Magma Odaları',
    depthHint: 'En Dip Harabeler (Y: 150 - 240)',
    description: 'Karanlığı eriten devasa enerji kristali. Efsanevi eşyalar ve maskeler için vazgeçilmezdir.',
  },
];

export const InventoryCraftingModal: React.FC<InventoryCraftingModalProps> = ({ engine, onClose }) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(engine.player.inventory[0] || null);
  const [modalMode, setModalMode] = useState<'crafting' | 'discovery'>('crafting');
  const [activeTab, setActiveTab] = useState<'all' | 'light' | 'tools' | 'alchemy'>('all');
  const [, setRerender] = useState({});

  const p = engine.player;

  // Filter recipes
  const filteredRecipes = CRAFTING_RECIPES.filter((r) => {
    if (activeTab === 'light') {
      return r.id.includes('torch') || r.id.includes('beacon') || r.id.includes('wall') || r.id.includes('platform');
    }
    if (activeTab === 'tools') {
      return r.id.includes('sword') || r.id.includes('pickaxe');
    }
    if (activeTab === 'alchemy') {
      return r.id.includes('elixir');
    }
    return true;
  });

  const canCraft = (recipe: CraftingRecipe): boolean => {
    for (const ing of recipe.ingredients) {
      const found = p.inventory.find((i) => i.id === ing.itemId);
      if (!found || found.stack < ing.count) return false;
    }
    return true;
  };

  const handleCraft = (recipeId: string) => {
    const success = engine.craftRecipe(recipeId);
    if (success) {
      setRerender({});
    }
  };

  // Discovery statistics calculation
  const discoveredResourcesCount = WORLD_RESOURCES.filter((res) =>
    p.inventory.some((it) => it.id === res.id)
  ).length;

  const undiscoveredRecipes = CRAFTING_RECIPES.filter((recipe) => {
    // If player lacks ANY ingredient, it's considered yet to be fully discovered/crafted
    return recipe.ingredients.some((ing) => {
      const found = p.inventory.find((i) => i.id === ing.itemId);
      return !found || found.stack === 0;
    });
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              <h2 className="font-serif text-lg font-bold text-slate-100 tracking-wide">
                Kül Sandığı & Zanaat Ocağı
              </h2>
            </div>

            {/* Mode Switcher: Zanaat vs Keşif Listesi */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl ml-4">
              <button
                id="tab-btn-crafting"
                onClick={() => setModalMode('crafting')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  modalMode === 'crafting'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>Zanaat</span>
              </button>
              <button
                id="tab-btn-discovery"
                onClick={() => setModalMode('discovery')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  modalMode === 'discovery'
                    ? 'bg-sky-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Keşif Listesi</span>
                <span className="ml-1 text-[10px] bg-slate-950/60 px-1.5 py-0.2 rounded-full text-slate-300">
                  {WORLD_RESOURCES.length - discoveredResourcesCount > 0
                    ? `${WORLD_RESOURCES.length - discoveredResourcesCount} Bekliyor`
                    : 'Tamamlandı'}
                </span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {modalMode === 'crafting' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto">
            {/* LEFT: Player Inventory */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Sırt Çantası ({p.inventory.length} / 16)
                </span>
                <span className="text-xs text-amber-400 font-mono">
                  {p.stats.ash} Kül Enerjisi
                </span>
              </div>

              {/* 4x4 Grid */}
              <div className="grid grid-cols-4 gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {Array.from({ length: 16 }).map((_, idx) => {
                  const item = p.inventory[idx];
                  const isSelected = selectedItem?.id === item?.id;

                  return (
                    <button
                      key={idx}
                      onClick={() => item && setSelectedItem(item)}
                      className={`relative aspect-square rounded-lg flex flex-col items-center justify-center border transition-all ${
                        item
                          ? isSelected
                            ? 'border-amber-400 bg-amber-950/30 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                            : 'border-slate-800 bg-slate-900/80 hover:border-slate-600'
                          : 'border-slate-900 bg-slate-950/40 opacity-40 cursor-default'
                      }`}
                    >
                      {item && (
                        <>
                          <span className="text-2xl">{item.icon}</span>
                          {item.stack > 1 && (
                            <span className="absolute bottom-1 right-1.5 text-[10px] font-mono font-bold text-amber-300">
                              {item.stack}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Item Details */}
              {selectedItem ? (
                <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 bg-slate-900 rounded-lg border border-slate-800">
                      {selectedItem.icon}
                    </span>
                    <div>
                      <h4 className="font-serif font-bold text-slate-100 text-sm">
                        {selectedItem.name}
                      </h4>
                      <span className="text-[11px] text-amber-400 uppercase tracking-wide font-mono">
                        Tür: {selectedItem.type}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedItem.description}
                  </p>
                  {selectedItem.damage && (
                    <span className="text-xs text-red-400 font-mono">
                      Saldırı Gücü: {selectedItem.damage}
                    </span>
                  )}
                  {selectedItem.miningPower && (
                    <span className="text-xs text-sky-400 font-mono">
                      Kazma Gücü: {selectedItem.miningPower}
                    </span>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl text-center text-xs text-slate-500">
                  Ayrıntılarını görmek için bir eşyaya tıkla.
                </div>
              )}
            </div>

            {/* RIGHT: Crafting Bench */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hammer className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Zanaat Tarifleri
                  </span>
                </div>

                {/* Recipe filter tabs */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-2 py-0.5 text-[10px] rounded font-medium transition ${
                      activeTab === 'all' ? 'bg-amber-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => setActiveTab('light')}
                    className={`px-2 py-0.5 text-[10px] rounded font-medium transition ${
                      activeTab === 'light' ? 'bg-amber-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Işık / İnşa
                  </button>
                  <button
                    onClick={() => setActiveTab('tools')}
                    className={`px-2 py-0.5 text-[10px] rounded font-medium transition ${
                      activeTab === 'tools' ? 'bg-amber-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Silah / Alet
                  </button>
                </div>
              </div>

              {/* Recipes List */}
              <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredRecipes.map((recipe) => {
                  const craftable = canCraft(recipe);

                  return (
                    <div
                      key={recipe.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        craftable
                          ? 'bg-slate-950/70 border-slate-700/80 hover:border-amber-500/50'
                          : 'bg-slate-950/30 border-slate-800/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 bg-slate-900 rounded-lg border border-slate-800">
                          {recipe.result.icon}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-serif text-sm font-semibold text-slate-100">
                            {recipe.result.name}
                          </span>
                          <span className="text-[11px] text-slate-400 leading-tight">
                            {recipe.description}
                          </span>

                          {/* Ingredients pill list */}
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {recipe.ingredients.map((ing, i) => {
                              const userItem = p.inventory.find((it) => it.id === ing.itemId);
                              const userCount = userItem?.stack || 0;
                              const hasEnough = userCount >= ing.count;

                              return (
                                <span
                                  key={i}
                                  className={`text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1 ${
                                    hasEnough
                                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                                      : 'bg-red-950/60 text-red-300 border border-red-800/50'
                                  }`}
                                >
                                  {ing.itemId.replace('_', ' ')}: {userCount}/{ing.count}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Craft Button */}
                      <button
                        onClick={() => handleCraft(recipe.id)}
                        disabled={!craftable}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                          craftable
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 shadow-md'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Üret</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* KEŞİF LİSTESİ (DISCOVERY LIST VIEW) */
          <div className="flex flex-col gap-6 p-6 overflow-y-auto max-h-[75vh]">
            {/* Top Discovery Banner */}
            <div className="bg-gradient-to-r from-sky-950/60 via-slate-950/80 to-amber-950/50 border border-sky-800/50 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
                  <Compass className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-100 text-sm">
                    Dünya Keşif & Kaynak Kılavuzu
                  </h3>
                  <p className="text-xs text-slate-300">
                    Derinliklerde saklı yeni madenleri kaz, canavarlardan nadir parçalar topla ve kilitli formülleri çöz.
                  </p>
                </div>
              </div>

              {/* Progress Counters */}
              <div className="flex items-center gap-4 self-end sm:self-center">
                <div className="flex flex-col items-center bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Keşfedilen Madenler</span>
                  <span className="text-sm font-bold text-sky-400 font-mono">
                    {discoveredResourcesCount} / {WORLD_RESOURCES.length}
                  </span>
                </div>
                <div className="flex flex-col items-center bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Bekleyen Tarifler</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    {undiscoveredRecipes.length} Formül
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 1: WORLD RESOURCES ENCYCLOPEDIA */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h4 className="font-serif text-sm font-bold text-slate-200">
                  Toplanabilir Dünya Kaynakları ve Cevherler
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {WORLD_RESOURCES.map((res) => {
                  const hasFound = p.inventory.some((it) => it.id === res.id);
                  const currentStack = p.inventory.find((it) => it.id === res.id)?.stack || 0;

                  return (
                    <div
                      key={res.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${
                        hasFound
                          ? 'bg-slate-950/80 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                          : 'bg-slate-950/40 border-slate-800/80 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`text-2xl p-2 rounded-lg border ${
                            hasFound ? 'bg-emerald-950/30 border-emerald-800/40' : 'bg-slate-900 border-slate-800 grayscale'
                          }`}>
                            {hasFound ? res.icon : '❓'}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-serif font-bold text-xs text-slate-100">
                              {hasFound ? res.name : 'Bilinmeyen Maden'}
                            </span>
                            <span className="text-[10px] text-sky-400 font-mono">
                              {res.depthHint}
                            </span>
                          </div>
                        </div>

                        {hasFound ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/50 text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {currentStack} Adet
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-950/50 border border-amber-800/50 text-[10px] text-amber-300 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Aranıyor
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {hasFound ? res.description : `İpucu: ${res.location} bölgesinde derinlere kazarak veya ortamı araştırarak keşfet.`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: UNDISCOVERED / LOCKED RECIPES WITH HINTS */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                <h4 className="font-serif text-sm font-bold text-slate-200">
                  Henüz Elde Edilmemiş Zanaat Tarifleri ve Malzemeleri
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {undiscoveredRecipes.map((recipe) => {
                  const missingIngredients = recipe.ingredients.filter((ing) => {
                    const userItem = p.inventory.find((it) => it.id === ing.itemId);
                    return !userItem || userItem.stack < ing.count;
                  });

                  return (
                    <div
                      key={recipe.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl p-2 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
                          {recipe.result.icon}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-serif text-sm font-bold text-slate-100">
                            {recipe.result.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            {recipe.description}
                          </span>
                        </div>
                      </div>

                      {/* Missing Ingredients breakdown */}
                      <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5 flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400">
                          Gereken Eksik Kaynaklar:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {missingIngredients.map((ing, idx) => {
                            const userItem = p.inventory.find((it) => it.id === ing.itemId);
                            const userCount = userItem?.stack || 0;
                            const resInfo = WORLD_RESOURCES.find((r) => r.id === ing.itemId);

                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-amber-900/50 text-[11px] font-mono text-amber-200"
                              >
                                <span>{resInfo?.icon || '📦'}</span>
                                <span className="font-sans font-medium">{resInfo?.name || ing.itemId}:</span>
                                <span className="text-red-400 font-bold">{userCount}/{ing.count}</span>
                                {resInfo && (
                                  <span className="text-[9px] text-slate-400 font-sans">({resInfo.location})</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
