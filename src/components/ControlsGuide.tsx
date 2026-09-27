import React from 'react';
import { X, Keyboard, Mouse, Sparkles, Flame, Shield, Compass } from 'lucide-react';

interface ControlsGuideProps {
  onClose: () => void;
}

export const ControlsGuide: React.FC<ControlsGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif text-base font-bold text-slate-100">
              Külyurdu Kontrol Rehberi & Mekanikler
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs text-slate-300">
          {/* UNIQUE HOOK EXPLANATION */}
          <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <h4 className="font-serif font-bold text-amber-300 text-sm">
                Özgün Mekanik: "Yaktığın Işık, Kalıcı İz Bırakır"
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Yerleştirdiğin her meşale ve yaktığın her kadim ocak, dünyanın karanlığını <strong>kalıcı olarak geri iter</strong>. Aydınlatılan bölgelerde düşmanlar zayıflar, bitkiler yeşerir ve NPC'ler güvenli sığınaklara yerleşir!
              </p>
            </div>
          </div>

          {/* GRID OF CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Movement Section */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-sky-400 font-serif font-bold">
                <Compass className="w-4 h-4" />
                <span>Akıcı Platform (Ori Tarzı)</span>
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li><strong className="text-slate-100">A / D veya Ok Tuşları:</strong> Koşma</li>
                <li><strong className="text-slate-100">Space (Boşluk):</strong> Zıpla & Çift Zıplama</li>
                <li><strong className="text-slate-100">Duvara Tutunma:</strong> Duvara doğru basınca kayma + Space ile Duvar Sıçrayışı</li>
                <li><strong className="text-slate-100">Shift:</strong> Kül Dash (Havada atılma & dokunulmazlık)</li>
                <li><strong className="text-slate-100">Space (Havada Basılı Tut):</strong> Ember Wings Kanat Süzülüşü (Boss sonrası)</li>
              </ul>
            </div>

            {/* Combat Section */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-red-400 font-serif font-bold">
                <Shield className="w-4 h-4" />
                <span>Dövüş ve Büyü (Hollow Knight Tarzı)</span>
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li><strong className="text-slate-100">J veya Sol Tık:</strong> Kılıç Darbesi (Kül toplar)</li>
                <li><strong className="text-slate-100">W + J:</strong> Yukarı Kılıç Darbesi</li>
                <li><strong className="text-slate-100">S + J (Havada):</strong> POGO Darbesi (Düşman üstünden yukarı sıçratır!)</li>
                <li><strong className="text-slate-100">Q veya Sağ Tık:</strong> Hassas Parry (Düşmanı sersemletir)</li>
                <li><strong className="text-slate-100">L Tuşu:</strong> Kül Patlaması Büyüsü (25 Kül)</li>
                <li><strong className="text-slate-100">H Tuşu:</strong> Odaklanma & Şifa (33 Kül harcar, +1 Can)</li>
              </ul>
            </div>

            {/* Sandbox Section */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-serif font-bold">
                <Flame className="w-4 h-4" />
                <span>Kazma & İnşa (Terraria Tarzı)</span>
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li><strong className="text-slate-100">1 - 8 Tuşları:</strong> Hızlı Erişim Çubuğundaki Eşyayı Seç</li>
                <li><strong className="text-slate-100">Fare ile Hedef Blok:</strong> Kazma seçiliyken Kaz, Blok seçiliyken İnşa Et</li>
                <li><strong className="text-slate-100">K Tuşu:</strong> İmleç altındaki bloğu kaz</li>
                <li><strong className="text-slate-100">B Tuşu:</strong> Seçili eşyayı yerleştir</li>
                <li><strong className="text-slate-100">C Tuşu:</strong> Sandık & Zanaat Menüsünü Aç</li>
              </ul>
            </div>

            {/* Story & Exploration Section */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-serif font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Keşif ve NPC'ler</span>
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li><strong className="text-slate-100">E Tuşu:</strong> Yakındaki NPC'lerle Konuş veya Tapınağı İncele</li>
                <li><strong className="text-slate-100">M / Tab Tuşu:</strong> Kıta Haritası & Kadim Tabletler Günlüğü</li>
                <li><strong className="text-slate-100">Sığınak İnşaatı:</strong> Dört tarafı kapalı, duvarlı ve meşaleli odalar inşa et, NPC'ler yerleşsin!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs transition"
          >
            Anladım, Oyuna Dön
          </button>
        </div>
      </div>
    </div>
  );
};
