import { and, desc, eq, gte, inArray, sql as dsql } from 'drizzle-orm';
import { db, schema } from '../db/client';

export const GRUPO_LABEL: Record<string, string> = {
  peito: 'Peito',
  costas: 'Costas',
  pernas: 'Pernas',
  ombros: 'Ombros',
  bracos: 'Braços',
  core: 'Core',
  cardio: 'Cardio',
  fullbody: 'Full Body',
};

export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function num(v: string | number | null): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function getTreinoCompleto(treinoId: string, alunoId: string) {
  const [treino] = await db
    .select()
    .from(schema.treinos)
    .where(and(eq(schema.treinos.id, treinoId), eq(schema.treinos.alunoId, alunoId)))
    .limit(1);

  if (!treino) return null;

  const itens = await db
    .select({
      id: schema.treinoExercicios.id,
      series: schema.treinoExercicios.series,
      repeticoes: schema.treinoExercicios.repeticoes,
      carga: schema.treinoExercicios.carga,
      descansoSegundos: schema.treinoExercicios.descansoSegundos,
      ordem: schema.treinoExercicios.ordem,
      exercicioId: schema.exercicios.id,
      nome: schema.exercicios.nome,
      grupoMuscular: schema.exercicios.grupoMuscular,
      descricao: schema.exercicios.descricao,
      videoUrl: schema.exercicios.videoUrl,
    })
    .from(schema.treinoExercicios)
    .innerJoin(schema.exercicios, eq(schema.exercicios.id, schema.treinoExercicios.exercicioId))
    .where(eq(schema.treinoExercicios.treinoId, treinoId))
    .orderBy(schema.treinoExercicios.ordem);

  const [personal] = await db
    .select({ nome: schema.users.nome, cref: schema.users.cref })
    .from(schema.users)
    .where(eq(schema.users.id, treino.personalId))
    .limit(1);

  const [ultima] = await db
    .select({
      dataExecucao: schema.execucoes.dataExecucao,
      cargaReal: schema.execucoes.cargaReal,
      concluido: schema.execucoes.concluido,
    })
    .from(schema.execucoes)
    .where(and(eq(schema.execucoes.treinoId, treinoId), eq(schema.execucoes.alunoId, alunoId)))
    .orderBy(desc(schema.execucoes.dataExecucao))
    .limit(1);

  return { treino, itens, personal: personal ?? null, ultimaExecucao: ultima ?? null };
}

export async function listarTreinosDoAluno(alunoId: string) {
  const treinos = await db
    .select({
      id: schema.treinos.id,
      nome: schema.treinos.nome,
      observacoes: schema.treinos.observacoes,
      personalNome: schema.users.nome,
    })
    .from(schema.treinos)
    .innerJoin(schema.users, eq(schema.users.id, schema.treinos.personalId))
    .where(eq(schema.treinos.alunoId, alunoId))
    .orderBy(schema.treinos.createdAt);

  if (treinos.length === 0) return [];

  const ids = treinos.map((t) => t.id);
  const execucoes = await db
    .select({
      treinoId: schema.execucoes.treinoId,
      dataExecucao: schema.execucoes.dataExecucao,
      concluido: schema.execucoes.concluido,
      cargaReal: schema.execucoes.cargaReal,
    })
    .from(schema.execucoes)
    .where(inArray(schema.execucoes.treinoId, ids))
    .orderBy(desc(schema.execucoes.dataExecucao));

  const today = hojeISO();

  return treinos.map((t) => {
    const doTreino = execucoes.filter((e) => e.treinoId === t.id);
    const concluidas = doTreino.filter((e) => e.concluido);
    return {
      ...t,
      totalExecucoes: doTreino.length,
      concluidas: concluidas.length,
      ultimaExecucao: concluidas[0] ?? null,
      feitoHoje: doTreino.some((e) => e.dataExecucao === today && e.concluido),
    };
  });
}

export async function historicoExecucoes(alunoId: string, limite = 30) {
  return db
    .select({
      id: schema.execucoes.id,
      dataExecucao: schema.execucoes.dataExecucao,
      concluido: schema.execucoes.concluido,
      cargaReal: schema.execucoes.cargaReal,
      observacao: schema.execucoes.observacao,
      treinoId: schema.treinos.id,
      treinoNome: schema.treinos.nome,
    })
    .from(schema.execucoes)
    .innerJoin(schema.treinos, eq(schema.treinos.id, schema.execucoes.treinoId))
    .where(eq(schema.execucoes.alunoId, alunoId))
    .orderBy(desc(schema.execucoes.dataExecucao), desc(schema.execucoes.createdAt))
    .limit(limite);
}

export async function metricasEvolucao(alunoId: string, semanas = 8) {
  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - 7 * semanas - 3);
  const inicioISO = inicio.toISOString().slice(0, 10);

  const execucoes = await db
    .select({
      dataExecucao: schema.execucoes.dataExecucao,
      cargaReal: schema.execucoes.cargaReal,
      concluido: schema.execucoes.concluido,
      treinoId: schema.execucoes.treinoId,
      treinoNome: schema.treinos.nome,
    })
    .from(schema.execucoes)
    .innerJoin(schema.treinos, eq(schema.treinos.id, schema.execucoes.treinoId))
    .where(and(eq(schema.execucoes.alunoId, alunoId), gte(schema.execucoes.dataExecucao, inicioISO)))
    .orderBy(schema.execucoes.dataExecucao);

  const concluidas = execucoes.filter((e) => e.concluido);

  const dias = new Set(concluidas.map((e) => e.dataExecucao));
  let streak = 0;
  const cursor = new Date(hojeISO() + 'T12:00:00Z');
  if (!dias.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (dias.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const semanasMap = new Map<string, { volume: number; sessoes: number; inicio: string }>();
  for (let i = semanas - 1; i >= 0; i -= 1) {
    const ref = new Date(hoje);
    ref.setDate(ref.getDate() - i * 7);
    const segunda = new Date(ref);
    const dow = (segunda.getUTCDay() + 6) % 7;
    segunda.setUTCDate(segunda.getUTCDate() - dow);
    semanasMap.set(segunda.toISOString().slice(0, 10), {
      volume: 0,
      sessoes: 0,
      inicio: segunda.toISOString().slice(0, 10),
    });
  }
  for (const e of concluidas) {
    const d = new Date(e.dataExecucao + 'T12:00:00Z');
    const dow = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - dow);
    const slot = semanasMap.get(d.toISOString().slice(0, 10));
    if (slot) {
      slot.volume += num(e.cargaReal) ?? 0;
      slot.sessoes += 1;
    }
  }

  const porTreino = new Map<string, { nome: string; pontos: { data: string; carga: number }[] }>();
  for (const e of concluidas) {
    const carga = num(e.cargaReal);
    if (carga === null) continue;
    const item = porTreino.get(e.treinoId) ?? { nome: e.treinoNome, pontos: [] };
    item.pontos.push({ data: e.dataExecucao, carga });
    porTreino.set(e.treinoId, item);
  }
  const evolucaoCarga = [...porTreino.entries()]
    .map(([treinoId, v]) => {
      const pontos = [...v.pontos].sort((a, b) => a.data.localeCompare(b.data));
      const ultimo = pontos[pontos.length - 1]?.carga ?? 0;
      const primeiro = pontos[0]?.carga ?? 0;
      return {
        treinoId,
        treinoNome: v.nome,
        pontos,
        primeiro,
        ultimo,
        variacao: ultimo - primeiro,
      };
    })
    .filter((e) => e.pontos.length > 0)
    .sort((a, b) => b.variacao - a.variacao);

  const volumes = [...semanasMap.values()].map((s) => s.volume);
  const semanasAtivas = volumes.filter((v) => v > 0);

  return {
    streak,
    sessoesConcluidas: concluidas.length,
    volumeTotal: volumes.reduce((a, b) => a + b, 0),
    volumeMedio: semanasAtivas.length
      ? Math.round(volumes.reduce((a, b) => a + b, 0) / semanasAtivas.length)
      : 0,
    semanas: [...semanasMap.values()],
    evolucaoCarga,
    ultimoTreino: concluidas.length
      ? {
          nome: concluidas[concluidas.length - 1].treinoNome,
          data: concluidas[concluidas.length - 1].dataExecucao,
        }
      : null,
  };
}

export async function getAnamnese(alunoId: string) {
  const [row] = await db
    .select()
    .from(schema.anamneses)
    .where(eq(schema.anamneses.alunoId, alunoId))
    .limit(1);
  return row ?? null;
}

export async function salvarAnamnese(alunoId: string, respostas: Record<string, string>) {
  const [row] = await db
    .insert(schema.anamneses)
    .values({ alunoId, respostas })
    .onConflictDoUpdate({
      target: schema.anamneses.alunoId,
      set: { respostas, updatedAt: dsql`now()` },
    })
    .returning();
  return row;
}
