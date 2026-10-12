import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { computePoints, DIFFICULTIES } from "@memory/core";
import { buildApp } from "./app";
import { createDb, migrate, type Db } from "./db";

let db: Db;
let app: FastifyInstance;

beforeAll(async () => {
  db = await createDb("");
  await migrate(db);
  app = await buildApp({
    db,
    verifyGoogle: async (token) => {
      if (!token.startsWith("good-")) throw new Error("bad");
      return { sub: token, name: "Google User" };
    },
  });
});
afterAll(async () => {
  await app.close();
  await db.close();
});

const call = (method: "GET" | "POST" | "PATCH", url: string, body?: unknown, token?: string) =>
  app.inject({ method, url, payload: body as object, headers: token ? { authorization: `Bearer ${token}` } : {} });

async function guest(nickname: string) {
  const res = await call("POST", "/auth/guest", { nickname });
  expect(res.statusCode).toBe(200);
  return res.json() as { token: string; user: { id: string; nickname: string; best: Record<string, number> } };
}

const good = (difficulty: "easy" | "medium" | "hard", moves: number, timeLeft: number) => ({ difficulty, moves, timeLeft });

describe("auth", () => {
  it("creates a guest and returns a working token", async () => {
    const { token, user } = await guest("Abdulmajid");
    expect(user.nickname).toBe("Abdulmajid");
    const me = await call("GET", "/me", undefined, token);
    expect(me.statusCode).toBe(200);
    expect(me.json().id).toBe(user.id);
  });

  it("rejects bad nicknames and missing/invalid tokens", async () => {
    expect((await call("POST", "/auth/guest", { nickname: "x" })).statusCode).toBe(400);
    expect((await call("POST", "/auth/guest", { nickname: "<script>" })).statusCode).toBe(400);
    expect((await call("GET", "/me")).statusCode).toBe(401);
    expect((await call("GET", "/me", undefined, "nope")).statusCode).toBe(401);
  });

  it("logout invalidates the token", async () => {
    const { token } = await guest("LogoutUser");
    expect((await call("POST", "/auth/logout", {}, token)).statusCode).toBe(200);
    expect((await call("GET", "/me", undefined, token)).statusCode).toBe(401);
  });

  it("updates nickname and sanitizes settings", async () => {
    const { token } = await guest("Before");
    const res = await call("PATCH", "/me", { nickname: "After", settings: { language: "ru", theme: "bogus" } }, token);
    expect(res.json().nickname).toBe("After");
    expect(res.json().settings).toMatchObject({ language: "ru", theme: "system" });
    expect((await call("PATCH", "/me", { nickname: "!" }, token)).statusCode).toBe(400);
  });
});

describe("scores", () => {
  it("recomputes points on the server and keeps only the best", async () => {
    const { token } = await guest("Scorer");
    const first = await call("POST", "/me/scores", good("easy", 10, 30), token);
    expect(first.json()).toEqual({ best: { easy: computePoints("easy", 10, 30) }, improved: true });
    const worse = await call("POST", "/me/scores", good("easy", 18, 5), token);
    expect(worse.json().improved).toBe(false);
    expect(worse.json().best.easy).toBe(computePoints("easy", 10, 30));
    const better = await call("POST", "/me/scores", good("easy", 8, 50), token);
    expect(better.json().best.easy).toBe(computePoints("easy", 8, 50));
  });

  it("rejects impossible results", async () => {
    const { token } = await guest("Cheater");
    const cfg = DIFFICULTIES.easy;
    for (const body of [
      good("easy", 1, 10), // fewer moves than pairs
      good("easy", cfg.moveLimit + 1, 10),
      good("easy", 10, cfg.timeLimit + 1),
      good("easy", 10, -1),
      { difficulty: "nope", moves: 10, timeLeft: 5 },
      { difficulty: "easy", moves: "10", timeLeft: 5 },
      { difficulty: "easy", moves: 10.5, timeLeft: 5 },
    ]) {
      expect((await call("POST", "/me/scores", body, token)).statusCode).toBe(400);
    }
    expect((await call("POST", "/me/scores", good("easy", 10, 5))).statusCode).toBe(401);
  });

  it("leaderboard is ordered and ranked", async () => {
    const a = await guest("LeaderA");
    const b = await guest("LeaderB");
    await call("POST", "/me/scores", good("hard", 20, 10), a.token);
    await call("POST", "/me/scores", good("hard", 12, 90), b.token);
    const res = await call("GET", "/leaderboard?difficulty=hard&limit=5");
    const entries = res.json().entries as { rank: number; nickname: string; points: number }[];
    expect(entries[0]).toMatchObject({ rank: 1, nickname: "LeaderB" });
    expect(entries.map((e) => e.points)).toEqual([...entries.map((e) => e.points)].sort((x, y) => y - x));
    expect((await call("GET", "/leaderboard?difficulty=x")).statusCode).toBe(400);
  });
});

describe("google", () => {
  it("rejects bad tokens and links to the current guest", async () => {
    const { token, user } = await guest("Linker");
    expect((await call("POST", "/auth/google", { idToken: "bad-token-aaaaaaaaaaaaaaaaaaaa" }, token)).statusCode).toBe(401);
    const res = await call("POST", "/auth/google", { idToken: "good-link-aaaaaaaaaaaaaaaaaaaa" }, token);
    expect(res.statusCode).toBe(200);
    expect(res.json().user.id).toBe(user.id);
    expect(res.json().user.hasGoogle).toBe(true);
  });

  it("returning Google user on a new device keeps data; a guest's records merge in", async () => {
    const first = await call("POST", "/auth/google", { idToken: "good-return-aaaaaaaaaaaaaaaaaaaa" });
    const owner = first.json() as { token: string; user: { id: string } };
    await call("POST", "/me/scores", good("medium", 12, 40), owner.token);

    const g = await guest("DeviceGuest");
    await call("POST", "/me/scores", good("hard", 12, 100), g.token);
    const again = await call("POST", "/auth/google", { idToken: "good-return-aaaaaaaaaaaaaaaaaaaa" }, g.token);
    const body = again.json() as { user: { id: string; best: Record<string, number> } };
    expect(body.user.id).toBe(owner.user.id);
    expect(Object.keys(body.user.best).sort()).toEqual(["hard", "medium"]);
    expect((await call("GET", "/me", undefined, g.token)).statusCode).toBe(401); // old guest removed
  });
});
