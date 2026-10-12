import { createHash, randomBytes } from "node:crypto";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import {
  DIFFICULTY_LIST,
  computePoints,
  isValidResult,
  parseSettings,
  validNickname,
  type ApiUser,
  type AuthResponse,
  type BestScores,
  type Difficulty,
  type Settings,
} from "@memory/core";
import type { Db } from "./db";

export interface GoogleIdentity {
  sub: string;
  name?: string;
}

export interface AppOptions {
  db: Db;
  /** Verifies a Google ID token; undefined disables Google sign-in (501). */
  verifyGoogle?: (idToken: string) => Promise<GoogleIdentity>;
  corsOrigins?: string[];
  logger?: boolean;
}

interface UserRow {
  id: string;
  nickname: string;
  google_sub: string | null;
  settings: unknown;
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");

const authLimit = { rateLimit: { max: 15, timeWindow: "1 minute" } };

export async function buildApp(opts: AppOptions): Promise<FastifyInstance> {
  const { db } = opts;
  const app = Fastify({ logger: opts.logger ?? false, trustProxy: true, bodyLimit: 16 * 1024 });

  await app.register(cors, {
    origin: opts.corsOrigins && opts.corsOrigins.length > 0 ? opts.corsOrigins : true,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
  });
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });

  const bearer = (req: FastifyRequest): string | null => {
    const h = req.headers.authorization;
    return h?.startsWith("Bearer ") ? h.slice(7).trim() || null : null;
  };

  async function userForToken(token: string | null): Promise<UserRow | null> {
    if (!token) return null;
    const { rows } = await db.query<UserRow>(
      `SELECT u.id, u.nickname, u.google_sub, u.settings FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1`,
      [hashToken(token)],
    );
    return rows[0] ?? null;
  }

  async function bestsFor(userId: string): Promise<BestScores> {
    const { rows } = await db.query<{ difficulty: Difficulty; points: number }>(`SELECT difficulty, points FROM bests WHERE user_id = $1`, [userId]);
    const out: BestScores = {};
    for (const r of rows) if (DIFFICULTY_LIST.includes(r.difficulty)) out[r.difficulty] = r.points;
    return out;
  }

  async function toApiUser(u: UserRow): Promise<ApiUser> {
    return {
      id: u.id,
      nickname: u.nickname,
      hasGoogle: u.google_sub !== null,
      best: await bestsFor(u.id),
      settings: u.settings ? parseSettings(JSON.stringify(u.settings)) : null,
    };
  }

  async function startSession(u: UserRow): Promise<AuthResponse> {
    const token = newToken();
    await db.query(`INSERT INTO sessions (token_hash, user_id) VALUES ($1, $2)`, [hashToken(token), u.id]);
    return { token, user: await toApiUser(u) };
  }

  async function createUser(nickname: string, googleSub: string | null = null): Promise<UserRow> {
    const { rows } = await db.query<UserRow>(
      `INSERT INTO users (nickname, google_sub) VALUES ($1, $2) RETURNING id, nickname, google_sub, settings`,
      [nickname, googleSub],
    );
    return rows[0] as UserRow;
  }

  const cleanNickname = (value: unknown): string | null =>
    typeof value === "string" && validNickname(value) ? value.trim().replace(/\s+/g, " ") : null;

  app.get("/health", async () => {
    await db.query("SELECT 1");
    return { ok: true };
  });

  app.post("/auth/guest", { config: authLimit }, async (req, reply) => {
    const nickname = cleanNickname((req.body as { nickname?: unknown } | null)?.nickname);
    if (!nickname) return reply.code(400).send({ error: "invalid_nickname" });
    return startSession(await createUser(nickname));
  });

  app.post("/auth/google", { config: authLimit }, async (req, reply) => {
    if (!opts.verifyGoogle) return reply.code(501).send({ error: "google_disabled" });
    const idToken = (req.body as { idToken?: unknown } | null)?.idToken;
    if (typeof idToken !== "string" || idToken.length < 20 || idToken.length > 4096) return reply.code(400).send({ error: "invalid_token" });

    let identity: GoogleIdentity;
    try {
      identity = await opts.verifyGoogle(idToken);
    } catch {
      return reply.code(401).send({ error: "google_verification_failed" });
    }

    const current = await userForToken(bearer(req));
    const existing = (await db.query<UserRow>(`SELECT id, nickname, google_sub, settings FROM users WHERE google_sub = $1`, [identity.sub])).rows[0];

    if (existing) {
      // Returning Google user. If a different guest account is signed in on this device, carry its records over.
      if (current && current.id !== existing.id && current.google_sub === null) {
        await db.query(
          `INSERT INTO bests (user_id, difficulty, points, moves, time_left)
           SELECT $1, difficulty, points, moves, time_left FROM bests WHERE user_id = $2
           ON CONFLICT (user_id, difficulty) DO UPDATE SET points = EXCLUDED.points, moves = EXCLUDED.moves, time_left = EXCLUDED.time_left, updated_at = now()
           WHERE EXCLUDED.points > bests.points`,
          [existing.id, current.id],
        );
        await db.query(`DELETE FROM users WHERE id = $1`, [current.id]);
      }
      return startSession(existing);
    }

    if (current) {
      if (current.google_sub !== null) return reply.code(409).send({ error: "already_linked" });
      const { rows } = await db.query<UserRow>(`UPDATE users SET google_sub = $1 WHERE id = $2 RETURNING id, nickname, google_sub, settings`, [identity.sub, current.id]);
      return startSession(rows[0] as UserRow);
    }

    const nickname = cleanNickname(identity.name?.slice(0, 20)) ?? `Player${randomBytes(2).toString("hex")}`;
    return startSession(await createUser(nickname, identity.sub));
  });

  const authed = async (req: FastifyRequest): Promise<UserRow | null> => userForToken(bearer(req));

  app.post("/auth/logout", async (req, reply) => {
    const token = bearer(req);
    if (!(await userForToken(token))) return reply.code(401).send({ error: "unauthorized" });
    await db.query(`DELETE FROM sessions WHERE token_hash = $1`, [hashToken(token as string)]);
    return { ok: true };
  });

  app.get("/me", async (req, reply) => {
    const user = await authed(req);
    if (!user) return reply.code(401).send({ error: "unauthorized" });
    return toApiUser(user);
  });

  app.patch("/me", async (req, reply) => {
    const user = await authed(req);
    if (!user) return reply.code(401).send({ error: "unauthorized" });
    const body = (req.body ?? {}) as { nickname?: unknown; settings?: unknown };
    let updated = user;
    if (body.nickname !== undefined) {
      const nickname = cleanNickname(body.nickname);
      if (!nickname) return reply.code(400).send({ error: "invalid_nickname" });
      updated = (await db.query<UserRow>(`UPDATE users SET nickname = $1 WHERE id = $2 RETURNING id, nickname, google_sub, settings`, [nickname, user.id])).rows[0] as UserRow;
    }
    if (body.settings !== undefined) {
      if (typeof body.settings !== "object" || body.settings === null) return reply.code(400).send({ error: "invalid_settings" });
      const settings: Settings = parseSettings(JSON.stringify(body.settings));
      updated = (await db.query<UserRow>(`UPDATE users SET settings = $1::jsonb WHERE id = $2 RETURNING id, nickname, google_sub, settings`, [JSON.stringify(settings), user.id])).rows[0] as UserRow;
    }
    return toApiUser(updated);
  });

  app.post("/me/scores", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (req, reply) => {
    const user = await authed(req);
    if (!user) return reply.code(401).send({ error: "unauthorized" });
    const { difficulty, moves, timeLeft } = (req.body ?? {}) as { difficulty?: Difficulty; moves?: number; timeLeft?: number };
    if (!difficulty || !DIFFICULTY_LIST.includes(difficulty) || typeof moves !== "number" || typeof timeLeft !== "number" || !isValidResult(difficulty, moves, timeLeft)) {
      return reply.code(400).send({ error: "invalid_result" });
    }
    // points are always recomputed on the server; the client never reports them
    const points = computePoints(difficulty, moves, timeLeft);
    const { rows } = await db.query(
      `INSERT INTO bests (user_id, difficulty, points, moves, time_left) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, difficulty) DO UPDATE SET points = EXCLUDED.points, moves = EXCLUDED.moves, time_left = EXCLUDED.time_left, updated_at = now()
       WHERE EXCLUDED.points > bests.points
       RETURNING points`,
      [user.id, difficulty, points, moves, timeLeft],
    );
    return { best: await bestsFor(user.id), improved: rows.length > 0 };
  });

  app.get("/leaderboard", async (req, reply) => {
    const q = req.query as { difficulty?: string; limit?: string };
    const difficulty = q.difficulty as Difficulty;
    if (!DIFFICULTY_LIST.includes(difficulty)) return reply.code(400).send({ error: "invalid_difficulty" });
    const limit = Math.min(50, Math.max(1, Number.parseInt(q.limit ?? "20", 10) || 20));
    const { rows } = await db.query<{ user_id: string; nickname: string; points: number }>(
      `SELECT b.user_id, u.nickname, b.points FROM bests b JOIN users u ON u.id = b.user_id
       WHERE b.difficulty = $1 ORDER BY b.points DESC, b.updated_at ASC LIMIT $2`,
      [difficulty, limit],
    );
    return { entries: rows.map((r, i) => ({ rank: i + 1, userId: r.user_id, nickname: r.nickname, points: r.points })) };
  });

  return app;
}
