import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env';
import * as schema from './schema';

// Connection pool configuration for Replit
const connectionString = env.DATABASE_URL;

// Create postgres connection with pool settings
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Graceful shutdown
export async function closeDatabase() {
  await client.end();
}
