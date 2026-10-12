import type { APIRoute } from 'astro';
import { getAuthUser } from '../../../lib/auth';
import { getTreinoCompleto } from '../../../lib/queries';

export const GET: APIRoute = async ({ cookies, params }) => {
  const user = getAuthUser(cookies);
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });
  const resultado = await getTreinoCompleto(String(params.id), user.id);
  if (!resultado) return Response.json({ error: 'Treino não encontrado' }, { status: 404 });
  return Response.json(resultado);
};
