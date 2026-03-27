import { Pool } from 'pg';

// Reuse pool across hot-reloads in development
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }, // Neon requires SSL in all environments
  });

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;
