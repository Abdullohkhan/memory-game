import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiClient } from '@memory/core';
import config from './config.json';

const TOKEN_KEY = 'memory.token';

export const getToken = () => AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
export const setToken = (token: string | null) =>
  (token ? AsyncStorage.setItem(TOKEN_KEY, token) : AsyncStorage.removeItem(TOKEN_KEY)).catch(() => undefined);

/** An empty apiUrl disables accounts and the leaderboard (the game still works offline). */
export const api = createApiClient({ baseUrl: config.apiUrl, getToken });
export const googleWebClientId = config.googleWebClientId;
