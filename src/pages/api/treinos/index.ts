import type { APIRoute } from 'astro';
import { getAuthUser } from '../../../lib/auth';
import { getTreinoCompleto, listarTreinosDoAluno } from '../../../lib/queries';

export const GET: APIRoute = async ({ cookies }) => {
  const user = getAuthUser(cookies);
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });
  const treinos = await listarTreinosDoAluno(user.id);
  return Response.json({ treinos });
};

export const POST: APIRoute = async ({ cookies, params }) => {
  const user = getAuthUser(cookies);
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });
  const resultado = await getTreinoCompleto(String(params?.id ?? ''), user.id);
  if (!resultado) return Response.json({ error: 'Treino não encontrado' }, { status: 404 });
  return Response.json({ treino: resultado.treino, itens: resultado.itens, personal: resultado.personal });
};
