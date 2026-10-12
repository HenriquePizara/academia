import { useMemo, useState } from 'react';

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

export default function TreinoSheet({ treinoId, itens, registroHoje }: Props) {
  const [sets, setSets] = useState<Record<string, boolean>>({});
  const [carga, setCarga] = useState<Record<string, number>>(() =>
    Object.fromEntries(itens.map((i) => [i.id, cargaInicial(i.carga)])),
  );
  const [obs, setObs] = useState('');
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'erro'>('idle');
  const [erro, setErro] = useState('');

  const totalSeries = useMemo(() => itens.reduce((a, i) => a + i.series, 0), [itens]);
  const feitas = useMemo(() => Object.values(sets).filter(Boolean).length, [sets]);
  const progresso = totalSeries === 0 ? 0 : Math.round((feitas / totalSeries) * 100);

  const cargaTotal = useMemo(
    () => itens.reduce((a, i) => a + (carga[i.id] ?? 0) * i.series, 0),
    [itens, carga],
  );

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

  return (
    <div className="space-y-6">
      {registroHoje && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Treino de hoje já registrado. Marque mais séries para atualizar a carga ou registre outro treino.
        </p>
      )}

      <div className="sticky top-[76px] z-30 rounded-xl border border-white/10 bg-[#0A0A0A]/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-300 tabular-nums">
            {feitas} de {totalSeries} séries
          </span>
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

      <ol className="space-y-4">
        {itens.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
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
                  {item.descansoSegundos}s descanso
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <label
                htmlFor={'carga-' + item.id}
                className="text-sm text-zinc-400"
              >
                Carga (kg)
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

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Array.from({ length: item.series }).map((_, s) => {
                const chave = item.id + '-' + s;
                const ativo = Boolean(sets[chave]);
                return (
                  <button
                    key={chave}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => setSets((c) => ({ ...c, [chave]: !c[chave] }))}
                    className={
                      'h-11 rounded-lg border text-sm font-semibold transition ' +
                      (ativo
                        ? 'border-[#DC2626] bg-[#DC2626] text-white'
                        : 'border-white/15 bg-white/[0.03] text-zinc-400 hover:border-white/30 hover:text-white')
                    }
                  >
                    Série {s + 1}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

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
            className="mt-4 h-12 w-full rounded-lg bg-[#DC2626] text-base font-bold text-white hover:bg-[#B91C1C] transition focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {estado === 'enviando' ? 'Registrando...' : 'Concluir treino'}
          </button>
        )}
      </div>
    </div>
  );
}
