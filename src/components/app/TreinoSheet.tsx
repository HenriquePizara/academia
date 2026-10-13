import { useEffect, useMemo, useRef, useState } from 'react';
import BodyMap from './BodyMap';
import { loadOfExercises } from '../../lib/muscles';

type Item = {
  id: string;
  nome: string;
  grupoMuscular: string;
  descricao: string | null;
  videoUrl: string | null;
  series: number;
  repeticoes: string | null;
  carga: string | null;
  descansoSegundos: number | null;
  ordem: number;
};

type Props = {
  treinoId: string;
  itens: Item[];
  registroHoje: boolean;
};

const GRUPO_LABEL: Record<string, string> = {
  peito: 'Peito',
  costas: 'Costas',
  pernas: 'Pernas',
  ombros: 'Ombros',
  bracos: 'Braços',
  core: 'Core',
  cardio: 'Cardio',
  fullbody: 'Full Body',
};

function cargaInicial(carga: string | null): number {
  const n = Number(carga);
  return Number.isFinite(n) ? n : 0;
}

// Cálculo de 1RM estimada (Fórmula de Epley)
function estimar1RM(cargaKg: number, repsStr: string | null): number | null {
  if (cargaKg <= 0) return null;
  const match = (repsStr || '').match(/\d+/);
  const reps = match ? Math.min(Number(match[0]), 12) : 10;
  if (reps <= 1) return cargaKg;
  return Math.round(cargaKg * (1 + reps / 30));
}

// Alerta sonoro de fim de descanso (Web Audio API sem arquivo externo)
function tocarBeepDescanso() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // Lá 5
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);

    // Segundo beep curto de confirmação
    setTimeout(() => {
      try {
        const ctx2 = new AudioContextClass();
        const osc2 = ctx2.createOscillator();
        const gain2 = ctx2.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1174.66, ctx2.currentTime); // Ré 6
        gain2.gain.setValueAtTime(0.18, ctx2.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.35);
        osc2.connect(gain2);
        gain2.connect(ctx2.destination);
        osc2.start(ctx2.currentTime);
        osc2.stop(ctx2.currentTime + 0.35);
      } catch {}
    }, 150);
  } catch {}
}

export default function TreinoSheet({ treinoId, itens, registroHoje }: Props) {
  const [sets, setSets] = useState<Record<string, boolean>>({});
  const [carga, setCarga] = useState<Record<string, number>>(() =>
    Object.fromEntries(itens.map((i) => [i.id, cargaInicial(i.carga)])),
  );
  const [obs, setObs] = useState('');
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'erro'>('idle');
  const [erro, setErro] = useState('');
  const [mostrarMapa, setMostrarMapa] = useState(false);

  // RestTimer State (openGym feature)
  const [restTimer, setRestTimer] = useState<{
    ativo: boolean;
    segundos: number;
    total: number;
    exercicioNome: string;
  }>({
    ativo: false,
    segundos: 0,
    total: 0,
    exercicioNome: '',
  });

  const timerIntervalRef = useRef<any>(null);

  // 1. Screen Wake Lock (Mantém a tela acesa enquanto treina)
  useEffect(() => {
    let wakeLock: any = null;
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock
        ?.request('screen')
        .then((wl: any) => {
          wakeLock = wl;
        })
        .catch(() => {});
    }
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  // 2. Intervalo do RestTimer
  useEffect(() => {
    if (!restTimer.ativo) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setRestTimer((prev) => {
        if (!prev.ativo) return prev;
        if (prev.segundos <= 1) {
          tocarBeepDescanso();
          return { ...prev, ativo: false, segundos: 0 };
        }
        return { ...prev, segundos: prev.segundos - 1 };
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [restTimer.ativo]);

  const dispararDescanso = (item: Item) => {
    const duracao = item.descansoSegundos || 60;
    setRestTimer({
      ativo: true,
      segundos: duracao,
      total: duracao,
      exercicioNome: item.nome,
    });
  };

  const ajustarTempoDescanso = (delta: number) => {
    setRestTimer((prev) => {
      const novo = Math.max(5, prev.segundos + delta);
      return { ...prev, segundos: novo, total: Math.max(prev.total, novo) };
    });
  };

  const pularDescanso = () => {
    setRestTimer((prev) => ({ ...prev, ativo: false, segundos: 0 }));
  };

  const toggleSerie = (item: Item, chave: string) => {
    setSets((prev) => {
      const novoValor = !prev[chave];
      if (novoValor) {
        // Acabou de concluir uma série -> inicia o RestTimer automaticamente
        dispararDescanso(item);
      }
      return { ...prev, [chave]: novoValor };
    });
  };

  const totalSeries = useMemo(() => itens.reduce((a, i) => a + i.series, 0), [itens]);
  const feitas = useMemo(() => Object.values(sets).filter(Boolean).length, [sets]);
  const progresso = totalSeries === 0 ? 0 : Math.round((feitas / totalSeries) * 100);

  const cargaTotal = useMemo(
    () => itens.reduce((a, i) => a + (carga[i.id] ?? 0) * i.series, 0),
    [itens, carga],
  );

  const cargaMuscular = useMemo(() => loadOfExercises(itens), [itens]);

  async function concluir() {
    setEstado('enviando');
    setErro('');
    try {
      const res = await fetch('/api/execucoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treinoId,
          concluido: true,
          cargaReal: cargaTotal > 0 ? cargaTotal : null,
          observacao: obs.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.erro || 'Não foi possível registrar');
      setEstado('ok');
      setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao registrar execução');
      setEstado('erro');
    }
  }

  const clockFormat = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const pctTimer = restTimer.total > 0 ? (restTimer.segundos / restTimer.total) * 100 : 0;

  return (
    <div className="space-y-6 pb-20">
      {registroHoje && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Treino de hoje já registrado. Marque mais séries para atualizar a carga ou registre outro treino.
        </p>
      )}

      {/* Barra de Progresso e Wake Lock Ativo */}
      <div className="sticky top-[76px] z-30 rounded-xl border border-white/10 bg-[#0A0A0A]/95 px-4 py-3 backdrop-blur shadow-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-300 tabular-nums">
              {feitas} de {totalSeries} séries
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 font-semibold hidden sm:inline-flex items-center gap-1">
              ☀️ Tela Ativa
            </span>
          </div>
          <span className="font-bold text-white tabular-nums">{progresso}%</span>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={progresso}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso do treino"
        >
          <div
            className="h-full rounded-full bg-[#DC2626] transition-[width] duration-300"
            style={{ width: progresso + '%' }}
          />
        </div>
      </div>

      {/* Botão para Exibir Mapa Muscular da Rotina (openGym BodyMap) */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DC2626] text-white text-xs font-black">
            BM
          </span>
          <div>
            <h4 className="text-sm font-bold text-white">Mapa de Músculos Deste Treino</h4>
            <p className="text-xs text-zinc-400">Diagrama anatômico das regiões estimuladas</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMostrarMapa(!mostrarMapa)}
          className="px-3.5 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition self-start sm:self-auto"
        >
          {mostrarMapa ? 'Ocultar Mapa' : 'Visualizar Músculos'}
        </button>
      </div>

      {mostrarMapa && (
        <BodyMap load={cargaMuscular} showDetails={true} className="animate-fadeIn" />
      )}

      {/* Lista de Exercícios */}
      <ol className="space-y-4">
        {itens.map((item) => {
          const e1rm = estimar1RM(carga[item.id] ?? 0, item.repeticoes);

          return (
            <li
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 transition hover:border-white/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="inline-block rounded-md border border-white/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                    {GRUPO_LABEL[item.grupoMuscular] ?? item.grupoMuscular}
                  </span>
                  <h3 className="mt-1.5 text-base font-bold text-white">{item.nome}</h3>
                  {item.descricao && (
                    <p className="mt-1 text-sm leading-5 text-zinc-400">{item.descricao}</p>
                  )}
                </div>
                {item.videoUrl && (
                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition"
                  >
                    Ver execução
                  </a>
                )}
              </div>

              {/* Informações da Prescrição e Estimativa 1RM */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-zinc-300 tabular-nums">
                  {item.series} séries
                </span>
                {item.repeticoes && (
                  <span className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-zinc-300 tabular-nums">
                    {item.repeticoes} reps
                  </span>
                )}
                {item.descansoSegundos && (
                  <span className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-zinc-300 tabular-nums">
                    ⏱ {item.descansoSegundos}s descanso
                  </span>
                )}
                {e1rm && (
                  <span className="rounded-lg border border-orange-500/30 bg-orange-950/40 px-3 py-1.5 text-xs font-semibold text-orange-300 tabular-nums">
                    💪 1RM Estimada: ~{e1rm} kg
                  </span>
                )}
              </div>

              {/* Ajuste de Carga */}
              <div className="mt-4 flex items-center gap-3">
                <label
                  htmlFor={'carga-' + item.id}
                  className="text-sm text-zinc-400"
                >
                  Carga (kg):
                </label>
                <input
                  id={'carga-' + item.id}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.5}
                  value={carga[item.id] ?? 0}
                  onChange={(e) =>
                    setCarga((c) => ({ ...c, [item.id]: Number(e.target.value) || 0 }))
                  }
                  className="h-11 w-24 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white tabular-nums focus:border-[#DC2626] focus:outline-none"
                />
              </div>

              {/* Botões das Séries com Gatilho do RestTimer */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: item.series }).map((_, s) => {
                  const chave = item.id + '-' + s;
                  const ativo = Boolean(sets[chave]);
                  return (
                    <button
                      key={chave}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => toggleSerie(item, chave)}
                      className={
                        'h-11 rounded-lg border text-sm font-semibold transition active:scale-[0.98] ' +
                        (ativo
                          ? 'border-[#DC2626] bg-[#DC2626] text-white shadow-md shadow-red-950/50'
                          : 'border-white/15 bg-white/[0.03] text-zinc-400 hover:border-white/30 hover:text-white')
                      }
                    >
                      {ativo ? `✓ Série ${s + 1}` : `Série ${s + 1}`}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Resumo e Conclusão */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-sm font-bold tracking-[0.14em] text-white uppercase">Finalizar sessão</h3>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-zinc-400">Volume total</dt>
            <dd className="font-bold text-white tabular-nums">
              {cargaTotal.toLocaleString('pt-BR')} kg
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">Séries concluídas</dt>
            <dd className="font-bold text-white tabular-nums">
              {feitas}/{totalSeries}
            </dd>
          </div>
        </dl>

        <label htmlFor="obs-treino" className="mt-4 block text-sm text-zinc-300">
          Como foi a sessão? (opcional)
        </label>
        <textarea
          id="obs-treino"
          rows={3}
          maxLength={500}
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="Senti o peso bem hoje, consegui subir 2,5 kg..."
          className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#DC2626] focus:outline-none"
        />

        {erro && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300"
          >
            {erro}
          </p>
        )}

        {estado === 'ok' ? (
          <p
            role="status"
            className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-300"
          >
            Sessão registrada. Atualizando seu painel...
          </p>
        ) : (
          <button
            type="button"
            onClick={concluir}
            disabled={estado === 'enviando'}
            className="mt-4 h-12 w-full rounded-lg bg-[#DC2626] text-base font-bold text-white hover:bg-[#B91C1C] transition focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-red-950/40"
          >
            {estado === 'enviando' ? 'Registrando...' : 'Concluir treino'}
          </button>
        )}
      </div>

      {/* 3. RestTimer Flutuante Fixo (openGym RestTimer) */}
      {restTimer.ativo && (
        <div
          role="region"
          aria-label="Temporizador de descanso"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-white/20 bg-[#111113]/95 p-4 shadow-2xl backdrop-blur-xl border-t-2 border-t-[#DC2626] animate-slideUp"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                ⏱ Descanso Entre Séries
              </span>
              <p className="text-xs font-semibold text-white truncate max-w-[200px]">
                {restTimer.exercicioNome}
              </p>
            </div>
            <div className="text-2xl font-black text-white tabular-nums tracking-tight font-mono">
              {clockFormat(restTimer.segundos)}
            </div>
          </div>

          {/* Barra de Progresso do Descanso */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#DC2626] to-[#F97316] transition-[width] duration-1000 ease-linear rounded-full"
              style={{ width: `${pctTimer}%` }}
            />
          </div>

          {/* Controles de Tempo */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => ajustarTempoDescanso(-15)}
                className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition"
              >
                -15s
              </button>
              <button
                type="button"
                onClick={() => ajustarTempoDescanso(15)}
                className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition"
              >
                +15s
              </button>
            </div>

            <button
              type="button"
              onClick={pularDescanso}
              className="px-4 py-1.5 rounded-lg bg-[#DC2626] text-white text-xs font-bold hover:bg-[#B91C1C] transition active:scale-[0.98]"
            >
              Pular Descanso →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
