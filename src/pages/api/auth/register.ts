import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../../db/client';
import { hashPassword, signToken, setAuthCookie } from '../../../lib/auth';

const RegisterSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(128),
  role: z.enum(['aluno', 'personal']).optional().default('aluno'),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Corpo inválido' }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
      { status: 400 },
    );
  }

  const { nome, email, senha, role } = parsed.data;
  const emailNorm = email.toLowerCase().trim();

  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, emailNorm))
    .limit(1);

  if (existing) {
    return Response.json({ error: 'E-mail já cadastrado' }, { status: 409 });
  }

  const senhaHash = await hashPassword(senha);

  const [user] = await db
    .insert(schema.users)
    .values({ nome: nome.trim(), email: emailNorm, senhaHash, role, provider: 'email' })
    .returning();

  const token = signToken({ id: user.id, email: user.email, nome: user.nome, role: user.role });
  setAuthCookie(cookies, token);

  return Response.json(
    { user: { id: user.id, email: user.email, nome: user.nome, role: user.role } },
    { status: 201 },
  );
};
