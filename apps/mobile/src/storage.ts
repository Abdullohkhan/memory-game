import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KeyValueStore } from '@memory/core';

export const store: KeyValueStore = {
  getItem: key => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
};
