import React, { useState } from 'react';

export interface AlunoOption {
  id: string;
  nome: string;
  email: string;
}

export interface ExercicioOption {
  id: string;
  nome: string;
  grupoMuscular: string;
  descricao?: string | null;
}

export interface TreinoItemForm {
  exercicioId: string;
  series: number;
  repeticoes: string;
  carga: number | '';
  descansoSegundos: number;
}

interface Props {
  alunos: AlunoOption[];
  exercicios: ExercicioOption[];
  alunoPreselecionadoId?: string;
  treinoEdicao?: {
    id: string;
    nome: string;
    alunoId: string;
    observacoes?: string | null;
    itens: Array<{
      exercicioId: string;
      series: number;
      repeticoes: string | null;
      carga: string | number | null;
      descansoSegundos: number | null;
      ordem: number;
    }>;
  };
}

export default function TreinoBuilder({
  alunos,
  exercicios,
  alunoPreselecionadoId,
  treinoEdicao,
}: Props) {
  const [alunoId, setAlunoId] = useState(
    treinoEdicao?.alunoId || alunoPreselecionadoId || (alunos[0]?.id ?? ''),
  );
  const [nome, setNome] = useState(treinoEdicao?.nome || '');
  const [observacoes, setObservacoes] = useState(treinoEdicao?.observacoes || '');
  const [itens, setItens] = useState<TreinoItemForm[]>(
    treinoEdicao?.itens?.map((it) => ({
      exercicioId: it.exercicioId,
      series: it.series || 3,
      repeticoes: it.repeticoes || '10-12',
      carga: it.carga !== null && it.carga !== undefined ? Number(it.carga) : '',
      descansoSegundos: it.descansoSegundos || 60,
    })) || [],
  );

  const [busca, setBusca] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('todos');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const grupos = ['todos', 'peito', 'costas', 'pernas', 'ombros', 'bracos', 'core', 'cardio', 'fullbody'];

  const exerciciosFiltrados = exercicios.filter((ex) => {
    const matchBusca = ex.nome.toLowerCase().includes(busca.toLowerCase());
    const matchGrupo = filtroGrupo === 'todos' || ex.grupoMuscular === filtroGrupo;
    return matchBusca && matchGrupo;
  });

  const adicionarExercicio = (exercicioId: string) => {
    setItens((prev) => [
      ...prev,
      {
        exercicioId,
        series: 3,
        repeticoes: '10-12',
        carga: '',
        descansoSegundos: 60,
      },
    ]);
  };

  const removerItem = (index: number) => {
    setItens((prev) => prev.filter((_, i) => i !== index));
  };

  const atualizarItem = (index: number, campo: keyof TreinoItemForm, valor: any) => {
    setItens((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [campo]: valor };
      return clone;
    });
  };

  const moverItem = (index: number, direcao: 'cima' | 'baixo') => {
    if (
      (direcao === 'cima' && index === 0) ||
      (direcao === 'baixo' && index === itens.length - 1)
    )
      return;
    const destino = direcao === 'cima' ? index - 1 : index + 1;
    setItens((prev) => {
      const clone = [...prev];
      const temp = clone[index];
      clone[index] = clone[destino];
      clone[destino] = temp;
      return clone;
    });
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    if (!alunoId) {
      setMensagem({ tipo: 'erro', texto: 'Selecione o aluno para este treino.' });
      return;
    }
    if (!nome.trim()) {
      setMensagem({ tipo: 'erro', texto: 'Informe o título do treino (ex: Treino A - Peito).' });
      return;
    }
    if (itens.length === 0) {
      setMensagem({ tipo: 'erro', texto: 'Adicione pelo menos um exercício à ficha de treino.' });
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        id: treinoEdicao?.id,
        alunoId,
        nome: nome.trim(),
        observacoes: observacoes.trim() || null,
        itens: itens.map((it, idx) => ({
          exercicioId: it.exercicioId,
          series: Number(it.series) || 3,
          repeticoes: it.repeticoes.trim() || '10-12',
          carga: it.carga === '' ? null : Number(it.carga),
          descansoSegundos: Number(it.descansoSegundos) || 60,
          ordem: idx,
        })),
      };

      const res = await fetch('/api/personal/treinos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao salvar treino');
      }

      setMensagem({ tipo: 'ok', texto: 'Ficha de treino salva com sucesso!' });
      setTimeout(() => {
        window.location.href = `/app/personal/aluno/${alunoId}`;
      }, 1000);
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro inesperado' });
    } finally {
      setSalvando(false);
    }
  };

  const exercicioMap = new Map(exercicios.map((e) => [e.id, e]));

  return (
    <form onSubmit={handleSalvar} className="space-y-8">
      {mensagem && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-sm font-medium ${
            mensagem.tipo === 'ok'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/40 border-red-500/30 text-red-300'
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      {/* Seção 1: Cabeçalho do Treino */}
      <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#DC2626] text-white text-xs font-black">
            1
          </span>
          Dados Gerais da Prescrição
        </h2>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="aluno-select" className="block text-sm font-medium text-zinc-300 mb-2">
              Aluno(a)
            </label>
            <select
              id="aluno-select"
              value={alunoId}
              onChange={(e) => setAlunoId(e.target.value)}
              disabled={!!treinoEdicao}
              className="w-full bg-[#141414] border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
            >
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} ({a.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="treino-nome" className="block text-sm font-medium text-zinc-300 mb-2">
              Nome do Treino
            </label>
            <input
              id="treino-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Treino A — Peito e Tríceps"
              className="w-full bg-[#141414] border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="treino-obs" className="block text-sm font-medium text-zinc-300 mb-2">
            Orientações do Treinador (opcional)
          </label>
          <textarea
            id="treino-obs"
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: Aquecer 10min na esteira. Foco em cadência 3s excêntrica nos exercícios compostos."
            className="w-full bg-[#141414] border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
          />
        </div>
      </section>

      {/* Seção 2: Exercícios Selecionados */}
      <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#DC2626] text-white text-xs font-black">
              2
            </span>
            Exercícios da Ficha ({itens.length})
          </h2>
        </div>

        {itens.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-white/15 rounded-xl text-zinc-400">
            Nenhum exercício adicionado. Selecione exercícios no catálogo abaixo para montar a rotina.
          </div>
        ) : (
          <div className="space-y-4">
            {itens.map((item, index) => {
              const ex = exercicioMap.get(item.exercicioId);
              return (
                <div
                  key={`${item.exercicioId}-${index}`}
                  className="bg-[#141414] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-[200px]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-zinc-300">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{ex?.nome ?? 'Exercício'}</h3>
                      <span className="text-xs uppercase tracking-wider text-orange-400">
                        {ex?.grupoMuscular}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Séries</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={item.series}
                        onChange={(e) => atualizarItem(index, 'series', e.target.value)}
                        className="w-full bg-[#1E1E1E] border border-white/15 rounded-lg px-2.5 py-1.5 text-white text-sm text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Reps</label>
                      <input
                        type="text"
                        value={item.repeticoes}
                        onChange={(e) => atualizarItem(index, 'repeticoes', e.target.value)}
                        placeholder="10-12"
                        className="w-full bg-[#1E1E1E] border border-white/15 rounded-lg px-2.5 py-1.5 text-white text-sm text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Carga Sugerida (kg)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={item.carga}
                        onChange={(e) => atualizarItem(index, 'carga', e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Livre"
                        className="w-full bg-[#1E1E1E] border border-white/15 rounded-lg px-2.5 py-1.5 text-white text-sm text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Descanso (s)</label>
                      <input
                        type="number"
                        step="15"
                        min="0"
                        value={item.descansoSegundos}
                        onChange={(e) => atualizarItem(index, 'descansoSegundos', e.target.value)}
                        className="w-full bg-[#1E1E1E] border border-white/15 rounded-lg px-2.5 py-1.5 text-white text-sm text-center"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => moverItem(index, 'cima')}
                      disabled={index === 0}
                      title="Mover para cima"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moverItem(index, 'baixo')}
                      disabled={index === itens.length - 1}
                      title="Mover para baixo"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => removerItem(index)}
                      title="Remover exercício"
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-500/20"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Seção 3: Catálogo de Exercícios para Adicionar */}
      <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#DC2626] text-white text-xs font-black">
            3
          </span>
          Adicionar do Catálogo ({exerciciosFiltrados.length})
        </h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="search"
            placeholder="Buscar por nome do exercício..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 bg-[#141414] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
          />
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {grupos.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setFiltroGrupo(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider shrink-0 transition ${
                  filtroGrupo === g
                    ? 'bg-[#DC2626] text-white'
                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto pr-2">
          {exerciciosFiltrados.map((ex) => (
            <div
              key={ex.id}
              className="bg-[#141414] border border-white/10 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-white/25 transition"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate">{ex.nome}</p>
                <p className="text-xs uppercase tracking-wider text-zinc-400">{ex.grupoMuscular}</p>
              </div>
              <button
                type="button"
                onClick={() => adicionarExercicio(ex.id)}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#DC2626] text-white text-xs font-bold transition"
              >
                + Adicionar
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Botões de Ação */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
        <a
          href="/app/personal"
          className="px-5 py-3 rounded-xl border border-white/15 text-sm font-semibold text-zinc-300 hover:bg-white/5 transition"
        >
          Cancelar
        </a>
        <button
          type="submit"
          disabled={salvando}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#F97316] text-white text-sm font-bold shadow-lg shadow-red-950/40 hover:brightness-110 active:scale-[0.99] transition disabled:opacity-50"
        >
          {salvando ? 'Salvando Ficha...' : treinoEdicao ? 'Atualizar Ficha de Treino' : 'Publicar Ficha de Treino'}
        </button>
      </div>
    </form>
  );
}
