import { createApiClient } from "@memory/core";

const TOKEN_KEY = "memory.token";

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string | null): void => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked */
  }
};

/** Empty VITE_API_URL disables accounts and the leaderboard; the game still works offline. */
export const api = createApiClient({ baseUrl: import.meta.env.VITE_API_URL as string | undefined, getToken });

export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? "";
