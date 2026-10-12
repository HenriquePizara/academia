import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '../../../db/client';
import { getAuthUser } from '../../../lib/auth';
import { historicoExecucoes, metricasEvolucao } from '../../../lib/queries';

const ExecucaoSchema = z.object({
  treinoId: z.string().uuid('Treino inválido'),
  concluido: z.boolean().default(true),
  cargaReal: z.coerce.number().min(0).max(99999).nullable().optional(),
  observacao: z.string().max(500).optional(),
  dataExecucao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (AAAA-MM-DD)').optional(),
});

export const GET: APIRoute = async ({ cookies }) => {
  const user = getAuthUser(cookies);
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

  const historico = await historicoExecucoes(user.id, 30);
  const metricas = await metricasEvolucao(user.id, 8);

  return Response.json({
    historico: historico.map((h) => ({ ...h, cargaReal: h.cargaReal ? Number(h.cargaReal) : null })),
    metricas,
  });
};

export const POST: APIRoute = async ({ cookies, request }) => {
  const user = getAuthUser(cookies);
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Corpo inválido' }, { status: 400 });
  }

  const parsed = ExecucaoSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
      { status: 400 },
    );
  }

  const { treinoId, concluido, cargaReal, observacao, dataExecucao } = parsed.data;
  const data = dataExecucao ?? new Date().toISOString().slice(0, 10);

  const [treino] = await db
    .select({ id: schema.treinos.id, alunoId: schema.treinos.alunoId })
    .from(schema.treinos)
    .where(and(eq(schema.treinos.id, treinoId), eq(schema.treinos.alunoId, user.id)))
    .limit(1);
  if (!treino) return Response.json({ error: 'Treino não encontrado' }, { status: 404 });

  // Upsert por (treino, aluno, data): retomar o mesmo dia não duplica o registro.
  const [registro] = await db
    .insert(schema.execucoes)
    .values({
      treinoId,
      alunoId: user.id,
      dataExecucao: data,
      concluido,
      cargaReal: cargaReal === null || cargaReal === undefined ? null : String(cargaReal),
      observacao,
    })
    .onConflictDoNothing()
    .returning();

  if (!registro) {
    const [existente] = await db
      .select({ id: schema.execucoes.id })
      .from(schema.execucoes)
      .where(
        and(
          eq(schema.execucoes.treinoId, treinoId),
          eq(schema.execucoes.alunoId, user.id),
          eq(schema.execucoes.dataExecucao, data),
        ),
      )
      .limit(1);
    return Response.json(
      { erro: 'Execução já registrada nesta data', execucaoId: existente?.id ?? null },
      { status: 409 },
    );
  }

  return Response.json({ execucao: registro }, { status: 201 });
};
