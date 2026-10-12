import pg from "pg";

export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
  close(): Promise<void>;
}

/**
 * Production uses a real Postgres (DATABASE_URL, e.g. Railway's plugin).
 * Without DATABASE_URL (local dev / tests) an in-memory PGlite database is used.
 */
export async function createDb(url = process.env.DATABASE_URL): Promise<Db> {
  if (url) {
    const pool = new pg.Pool({
      connectionString: url,
      ssl: process.env.PGSSL === "1" ? { rejectUnauthorized: false } : undefined,
      max: 10,
    });
    return {
      query: async (text, params) => ({ rows: (await pool.query(text, params as unknown[])).rows }),
      close: () => pool.end(),
    };
  }
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL is required in production");
  const { PGlite } = await import("@electric-sql/pglite");
  const lite = new PGlite();
  return {
    query: async (text, params) => ({ rows: (await lite.query(text, params as unknown[])).rows as never[] }),
    close: () => lite.close(),
  };
}

export async function migrate(db: Db): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nickname TEXT NOT NULL,
      google_sub TEXT UNIQUE,
      settings JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS bests (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      difficulty TEXT NOT NULL,
      points INT NOT NULL,
      moves INT NOT NULL,
      time_left INT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, difficulty)
    )`);
  await db.query(`CREATE INDEX IF NOT EXISTS bests_leaderboard ON bests (difficulty, points DESC, updated_at)`);
}
