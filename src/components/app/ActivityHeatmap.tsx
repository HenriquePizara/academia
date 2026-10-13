import React, { useEffect, useRef } from 'react';

interface WorkoutDay {
  data: string; // YYYY-MM-DD
  sessoes?: number;
  volume?: number;
}

interface Props {
  treinos: WorkoutDay[];
  className?: string;
}

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function ActivityHeatmap({ treinos, className = '' }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  // Agregar treinos por data
  const agg = React.useMemo(() => {
    const map = new Map<string, { sessoes: number; volume: number }>();
    treinos.forEach((t) => {
      const cur = map.get(t.data) || { sessoes: 0, volume: 0 };
      cur.sessoes += t.sessoes || 1;
      cur.volume += t.volume || 0;
      map.set(t.data, cur);
    });
    return map;
  }, [treinos]);

  // Gerar grid de 52 semanas
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const end = new Date(today);
  const endDow = (end.getDay() + 6) % 7; // Seg = 0
  end.setDate(end.getDate() + (6 - endDow)); // Domingo da semana atual

  const start = new Date(end);
  start.setDate(end.getDate() - 52 * 7 + 1);

  const weeks: Array<{
    monthLabel: string;
    days: Array<{
      iso: string;
      inFuture: boolean;
      data: { sessoes: number; volume: number } | null;
      level: number;
    }>;
  }> = [];

  let lastMonth = -1;

  for (let w = 0; w < 52; w++) {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + w * 7);

    const mo = weekStart.getMonth();
    const showMonth = mo !== lastMonth && weekStart.getDate() <= 7;
    if (showMonth) lastMonth = mo;

    const days = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(weekStart);
      cur.setDate(weekStart.getDate() + d);
      const iso = cur.toISOString().slice(0, 10);
      const entry = agg.get(iso) || null;
      const inFuture = cur > today;

      let level = 0;
      if (entry && entry.sessoes > 0) {
        if (entry.volume >= 5000) level = 4;
        else if (entry.volume >= 2500) level = 3;
        else if (entry.volume >= 1000) level = 2;
        else level = 1;
      }

      days.push({ iso, inFuture, data: entry, level });
    }

    weeks.push({
      monthLabel: showMonth ? MONTHS_PT[mo] : '',
      days,
    });
  }

  const LEVEL_CLASSES: Record<number, string> = {
    0: 'bg-white/[0.04] border-white/[0.03]',
    1: 'bg-orange-950/70 border-orange-800/40',
    2: 'bg-orange-600/80 border-orange-500/50',
    3: 'bg-[#DC2626] border-red-500/60',
    4: 'bg-[#EF4444] border-red-400 shadow-sm shadow-red-500/50',
  };

  const totalSessoesAno = treinos.length;

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-5 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-[#DC2626] text-[10px] font-black text-white">
              HM
            </span>
            Matriz de Consistência Anual (52 Semanas)
          </h3>
          <p className="text-[11px] text-zinc-400">
            {totalSessoesAno} {totalSessoesAno === 1 ? 'sessão registrada' : 'sessões registradas'} no período (openGym Engine)
          </p>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <span>Menos</span>
          <span className="w-2.5 h-2.5 rounded-sm bg-white/[0.04] border border-white/[0.05]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-orange-950/70 border border-orange-800/40" />
          <span className="w-2.5 h-2.5 rounded-sm bg-orange-600/80 border border-orange-500/50" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626] border border-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444] border border-red-400" />
          <span>Mais</span>
        </div>
      </div>

      {/* Grid com Scroll Horizontal */}
      <div ref={scrollRef} className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1 min-w-[700px]">
          {/* Linha dos Meses */}
          <div className="flex gap-1 text-[10px] text-zinc-500 font-semibold pl-7">
            {weeks.map((w, idx) => (
              <div key={idx} className="w-3 text-center">
                {w.monthLabel}
              </div>
            ))}
          </div>

          {/* Grid de 7 dias */}
          <div className="flex gap-1">
            {/* Dias da Semana (Lateral) */}
            <div className="flex flex-col gap-1 text-[9px] text-zinc-500 font-medium pr-1 select-none">
              <span className="h-3 leading-3">Seg</span>
              <span className="h-3 leading-3 opacity-0">Ter</span>
              <span className="h-3 leading-3">Qua</span>
              <span className="h-3 leading-3 opacity-0">Qui</span>
              <span className="h-3 leading-3">Sex</span>
              <span className="h-3 leading-3 opacity-0">Sáb</span>
              <span className="h-3 leading-3">Dom</span>
            </div>

            {/* Matriz 52x7 */}
            {weeks.map((w, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {w.days.map((d, dIdx) => {
                  const title = d.data
                    ? `${d.iso}: ${d.data.sessoes} treino(s) • ${d.data.volume.toLocaleString('pt-BR')} kg`
                    : `${d.iso}: Sem treinos`;

                  return (
                    <div
                      key={dIdx}
                      title={title}
                      className={`w-3 h-3 rounded-sm border transition-transform hover:scale-125 cursor-pointer ${
                        d.inFuture ? 'opacity-20 bg-transparent border-transparent' : LEVEL_CLASSES[d.level]
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
