import type { APIRoute } from 'astro';
import { getAuthUser } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const user = getAuthUser(cookies);
  if (!user) {
    return Response.json({ user: null }, { status: 200 });
  }
  return Response.json({ user });
};
