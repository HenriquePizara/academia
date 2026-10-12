import { defineMiddleware } from 'astro:middleware';
import { getAuthUser } from './lib/auth';

const PUBLIC_PATHS = ['/', '/login', '/register', '/recuperar-senha', '/privacidade', '/termos', '/cookies'];
const PUBLIC_API_PATHS = ['/api/auth/login', '/api/auth/register'];
const PUBLIC_PREFIXES = ['/api/auth/login', '/api/auth/register'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    PUBLIC_API_PATHS.includes(pathname) ||
    pathname.startsWith('/_server-islands/') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf)$/);

  if (isPublic) {
    return next();
  }

  const user = getAuthUser(context.cookies);

  if (!user) {
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/login', 302);
  }

  context.locals.user = user;
  return next();
});
