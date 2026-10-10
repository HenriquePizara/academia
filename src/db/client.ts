import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL ?? '';

if (!connectionString) {
  throw new Error('DATABASE_URL não definida — configure .env ou dokku config');
}

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export { schema };
