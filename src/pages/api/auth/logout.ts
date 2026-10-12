import type { APIRoute } from 'astro';
import { clearAuthCookie } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies }) => {
  clearAuthCookie(cookies);
  return Response.json({ ok: true });
};
