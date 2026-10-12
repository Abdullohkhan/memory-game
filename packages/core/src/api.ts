import type { BestScores, Difficulty, Settings } from "./types";

export interface ApiUser {
  id: string;
  nickname: string;
  hasGoogle: boolean;
  best: BestScores;
  settings: Settings | null;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  points: number;
}

export interface ScoreSubmission {
  difficulty: Difficulty;
  moves: number;
  timeLeft: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

export interface ApiClientOptions {
  /** e.g. "https://api.example.com"; empty/undefined disables the client */
  baseUrl: string | undefined;
  getToken: () => string | null | Promise<string | null>;
  fetchImpl?: typeof fetch;
}

export interface ApiClient {
  enabled: boolean;
  guest(nickname: string): Promise<AuthResponse>;
  google(idToken: string): Promise<AuthResponse>;
  me(): Promise<ApiUser>;
  updateMe(patch: { nickname?: string; settings?: Settings }): Promise<ApiUser>;
  submitScore(result: ScoreSubmission): Promise<{ best: BestScores; improved: boolean }>;
  leaderboard(difficulty: Difficulty, limit?: number): Promise<LeaderboardEntry[]>;
  logout(): Promise<void>;
}

export function createApiClient(opts: ApiClientOptions): ApiClient {
  const base = (opts.baseUrl ?? "").replace(/\/+$/, "");
  const doFetch = opts.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  async function request<T>(method: string, path: string, body?: unknown, auth = true): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth) {
      const token = await opts.getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const res = await doFetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!res.ok) {
      let code = "request_failed";
      try {
        code = ((await res.json()) as { error?: string }).error ?? code;
      } catch {
        /* non-JSON error */
      }
      throw new ApiError(res.status, code);
    }
    return (await res.json()) as T;
  }

  return {
    enabled: base.length > 0,
    guest: (nickname) => request("POST", "/auth/guest", { nickname }),
    // the current token (if any) is sent so the server can link Google to the existing account
    google: (idToken) => request("POST", "/auth/google", { idToken }),
    me: () => request("GET", "/me"),
    updateMe: (patch) => request("PATCH", "/me", patch),
    submitScore: (result) => request("POST", "/me/scores", result),
    leaderboard: async (difficulty, limit = 20) =>
      (await request<{ entries: LeaderboardEntry[] }>("GET", `/leaderboard?difficulty=${difficulty}&limit=${limit}`, undefined, false)).entries,
    logout: async () => {
      await request("POST", "/auth/logout", {});
    },
  };
}

export function validNickname(value: string): boolean {
  return /^[\p{L}\p{N}][\p{L}\p{N} _.-]{1,19}$/u.test(value.trim());
}
