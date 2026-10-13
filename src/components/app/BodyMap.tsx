import { useState } from 'react';
import bodyPaths from '../../lib/body-paths';
import {
  MUSCLES,
  INERT,
  MUSCLE_NAME,
  levelsOf,
  type MuscleSlug,
} from '../../lib/muscles';

interface Props {
  load?: Partial<Record<MuscleSlug, number>>;
  body?: 'male' | 'female';
  showDetails?: boolean;
  className?: string;
}

const LEVEL_COLORS: Record<number, string> = {
  0: '#222225', // inativo / sem estímulo
  1: '#7c2d12', // ativação leve (30%)
  2: '#ea580c', // ativação moderada (60%)
  3: '#dc2626', // ativação alta (80%)
  4: '#ef4444', // ativação máxima (100% - pico da rotina)
};

export default function BodyMap({
  load = {},
  body = 'male',
  showDetails = true,
  className = '',
}: Props) {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleSlug | null>(null);
  const [activeView, setActiveView] = useState<'both' | 'front' | 'back'>('both');

  const levels = levelsOf(load);
  const g = bodyPaths[body] || bodyPaths.male;

  const renderView = (view: { vb: string; p: Record<string, string[]> }, label: string) => (
    <div className="flex flex-col items-center">
      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">{label}</span>
      <svg
        className="w-full max-w-[170px] h-auto drop-shadow-md select-none transition-transform"
        viewBox={view.vb}
        role="img"
      >
        {/* Silhueta / Partes Inertes */}
        {INERT.map((slug) =>
          (view.p[slug] || []).map((d, i) => (
            <path
              key={`${slug}-${i}`}
              d={d}
              className="fill-white/[0.03] stroke-white/[0.08] stroke-[1]"
            />
          )),
        )}

        {/* Músculos Ativos */}
        {MUSCLES.map((slug) =>
          (view.p[slug] || []).map((d, i) => {
            const lvl = levels[slug] || 0;
            const isSelected = selectedMuscle === slug;
            const fill = LEVEL_COLORS[lvl] || LEVEL_COLORS[0];

            return (
              <path
                key={`${slug}-${i}`}
                d={d}
                style={{ fill }}
                className={`cursor-pointer transition-all duration-200 stroke-[#0a0a0a] stroke-[1.5] hover:brightness-125 ${
                  isSelected ? 'stroke-white stroke-[2.5] brightness-125' : ''
                }`}
                onClick={() => setSelectedMuscle(slug)}
                onMouseEnter={() => setSelectedMuscle(slug)}
              >
                <title>{`${MUSCLE_NAME[slug]} (Nível ${lvl}/4)`}</title>
              </path>
            );
          }),
        )}
      </svg>
    </div>
  );

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-[#DC2626] text-[10px] font-black text-white">
              BM
            </span>
            Mapa Muscular Biomecânico
          </h3>
          <p className="text-[11px] text-zinc-400">Ativação anatômica das rotinas (openGym Engine)</p>
        </div>

        {/* Seletor de Visão */}
        <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/40 text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => setActiveView('both')}
            className={`px-2 py-1 rounded ${activeView === 'both' ? 'bg-[#DC2626] text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Ambos
          </button>
          <button
            type="button"
            onClick={() => setActiveView('front')}
            className={`px-2 py-1 rounded ${activeView === 'front' ? 'bg-[#DC2626] text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Frente
          </button>
          <button
            type="button"
            onClick={() => setActiveView('back')}
            className={`px-2 py-1 rounded ${activeView === 'back' ? 'bg-[#DC2626] text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Costas
          </button>
        </div>
      </div>

      {/* Diagramas Frente e Verso */}
      <div className="flex items-center justify-center gap-6 py-2">
        {(activeView === 'both' || activeView === 'front') && renderView(g.front, 'Vista Frontal')}
        {(activeView === 'both' || activeView === 'back') && renderView(g.back, 'Vista Posterior')}
      </div>

      {/* Legenda de Ativação */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span>Estímulo:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: LEVEL_COLORS[0] }} />
            <span className="text-[10px]">0</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: LEVEL_COLORS[1] }} />
            <span className="text-[10px]">1</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: LEVEL_COLORS[2] }} />
            <span className="text-[10px]">2</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: LEVEL_COLORS[3] }} />
            <span className="text-[10px]">3</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: LEVEL_COLORS[4] }} />
            <span className="text-[10px]">Máx</span>
          </span>
        </div>

        {selectedMuscle && showDetails && (
          <div className="text-right">
            <span className="font-semibold text-white">{MUSCLE_NAME[selectedMuscle]}:</span>{' '}
            <span className="text-orange-400 font-bold">
              Nível {levels[selectedMuscle]}/4 ({Math.round(load[selectedMuscle] || 0)} sets eq.)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
