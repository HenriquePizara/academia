import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../../db/client';
import { comparePassword, signToken, setAuthCookie } from '../../../lib/auth';

const LoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Corpo inválido' }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'E-mail ou senha inválidos' }, { status: 400 });
  }

  const { email, senha } = parsed.data;

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user || !user.senhaHash) {
    return Response.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  const ok = await comparePassword(senha, user.senhaHash);
  if (!ok) {
    return Response.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  const token = signToken({ id: user.id, email: user.email, nome: user.nome, role: user.role });
  setAuthCookie(cookies, token);

  return Response.json({
    user: { id: user.id, email: user.email, nome: user.nome, role: user.role },
  });
};
