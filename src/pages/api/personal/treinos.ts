import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getAuthUser } from '../../../lib/auth';
import { excluirTreino, salvarTreinoComExercicios } from '../../../lib/queries';

const ItemTreinoSchema = z.object({
  exercicioId: z.string().uuid('Exercício inválido'),
  series: z.coerce.number().int().min(1).max(20).default(3),
  repeticoes: z.string().max(32).default('10-12'),
  carga: z.coerce.number().min(0).max(9999).nullable().optional(),
  descansoSegundos: z.coerce.number().int().min(0).max(600).default(60),
  ordem: z.coerce.number().int().min(0).default(0),
});

const TreinoSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(2, 'Nome do treino deve ter ao menos 2 caracteres').max(100),
  alunoId: z.string().uuid('Aluno inválido'),
  observacoes: z.string().max(1000).nullable().optional(),
  itens: z.array(ItemTreinoSchema).min(1, 'Adicione pelo menos 1 exercício ao treino'),
});

export const POST: APIRoute = async ({ cookies, request }) => {
  const user = getAuthUser(cookies);
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });
  if (user.role !== 'personal' && user.role !== 'admin') {
    return Response.json({ error: 'Acesso restrito a treinadores' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Corpo JSON inválido' }, { status: 400 });
  }

  const parsed = TreinoSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
      { status: 400 },
    );
  }

  try {
    const res = await salvarTreinoComExercicios({
      ...parsed.data,
      personalId: user.id,
    });
    return Response.json({ success: true, treinoId: res.id }, { status: 200 });
  } catch (err: any) {
    return Response.json({ error: err.message || 'Erro ao salvar treino' }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ cookies, request }) => {
  const user = getAuthUser(cookies);
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });
  if (user.role !== 'personal' && user.role !== 'admin') {
    return Response.json({ error: 'Acesso restrito a treinadores' }, { status: 403 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ error: 'ID do treino é obrigatório' }, { status: 400 });

  try {
    const res = await excluirTreino(id, user.id);
    if (!res) return Response.json({ error: 'Treino não encontrado' }, { status: 404 });
    return Response.json({ success: true, id: res.id });
  } catch (err: any) {
    return Response.json({ error: err.message || 'Erro ao excluir treino' }, { status: 500 });
  }
};
