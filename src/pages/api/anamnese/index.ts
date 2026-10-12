import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getAuthUser } from '../../../lib/auth';
import { getAnamnese, salvarAnamnese } from '../../../lib/queries';

const AnamneseSchema = z.object({
  objetivo: z.enum(['hipertrofia', 'emagrecimento', 'condicionamento', 'saude', 'reabilitacao']),
  nivelTreino: z.enum(['iniciante', 'intermediario', 'avancado']),
  restricoes: z.string().max(2000).optional().default(''),
  lesoes: z.string().max(2000).optional().default(''),
  doencasCronicas: z.string().max(2000).optional().default(''),
  medicamento: z.string().max(2000).optional().default(''),
  consentimento: z.literal(true, { errorMap: () => ({ message: 'É necessário autorizar o uso dos dados de saúde' }) }),
});

export const GET: APIRoute = async ({ cookies }) => {
  const user = getAuthUser(cookies);
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });
  const anamnese = await getAnamnese(user.id);
  return Response.json({ anamnese: anamnese ? { respostas: anamnese.respostas, updatedAt: anamnese.updatedAt } : null });
};

export const PUT: APIRoute = async ({ cookies, request }) => {
  const user = getAuthUser(cookies);
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Corpo inválido' }, { status: 400 });
  }

  const parsed = AnamneseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
      { status: 400 },
    );
  }

  const { consentimento, ...respostas } = parsed.data;
  const row = await salvarAnamnese(user.id, respostas);
  return Response.json({ ok: true, updatedAt: row?.updatedAt ?? null });
};
