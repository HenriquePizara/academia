import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { AstroCookies } from 'astro';

const JWT_SECRET =
  process.env.JWT_SECRET ?? 'dev-secret-troque-em-producao-com-64-caracteres';

const TOKEN_EXPIRATION = '7d';
const COOKIE_NAME = 'academia_token';

export interface AuthUser {
  id: string;
  email: string;
  nome: string;
  role: 'admin' | 'personal' | 'aluno';
}

export async function hashPassword(senha: string): Promise<string> {
  return bcrypt.hash(senha, 12);
}

export async function comparePassword(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { email: user.email, nome: user.nome, role: user.role },
    JWT_SECRET,
    { subject: user.id, expiresIn: TOKEN_EXPIRATION },
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
      email: string;
      nome: string;
      role: AuthUser['role'];
    };
    if (!payload.sub || !payload.email) return null;
    return {
      id: payload.sub,
      email: payload.email,
      nome: payload.nome,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function getAuthUser(cookies: AstroCookies): AuthUser | null {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setAuthCookie(cookies: AstroCookies, token: string): void {
  cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export function clearAuthCookie(cookies: AstroCookies): void {
  cookies.delete(COOKIE_NAME, { path: '/' });
}
