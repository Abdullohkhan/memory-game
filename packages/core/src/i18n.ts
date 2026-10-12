import type { Language } from "./types";

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "uz", label: "O‘zbekcha" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

const en = {
  title: "Memory Game",
  difficulty: "Difficulty",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  moves: "Moves",
  time: "Time",
  points: "Points",
  best: "Best",
  newGame: "New game",
  pause: "Pause",
  resume: "Resume",
  paused: "Paused",
  tapToStart: "Flip a card to start the timer",
  win: "You win!",
  lose: "Game over",
  playAgain: "Play again",
  newRecord: "New record!",
  yourPoints: "Your points",
  settings: "Settings",
  language: "Language",
  theme: "Theme",
  themeSystem: "System",
  themeLight: "Light",
  themeDark: "Dark",
  symbols: "Card symbols",
  symbolsHint: "Helps tell colours apart",
  sound: "Sound",
  close: "Close",
  card: "Card",
  faceDown: "face down",
  matchedCard: "matched",
  createdBy: "Created by",
} as const;

export type TranslationKey = keyof typeof en;
type Dict = Record<TranslationKey, string>;

const ru: Dict = {
  title: "Игра на память",
  difficulty: "Сложность",
  easy: "Легко",
  medium: "Средне",
  hard: "Сложно",
  moves: "Ходы",
  time: "Время",
  points: "Очки",
  best: "Рекорд",
  newGame: "Новая игра",
  pause: "Пауза",
  resume: "Продолжить",
  paused: "Пауза",
  tapToStart: "Откройте карту, чтобы запустить таймер",
  win: "Вы победили!",
  lose: "Игра окончена",
  playAgain: "Играть снова",
  newRecord: "Новый рекорд!",
  yourPoints: "Ваши очки",
  settings: "Настройки",
  language: "Язык",
  theme: "Тема",
  themeSystem: "Системная",
  themeLight: "Светлая",
  themeDark: "Тёмная",
  symbols: "Символы на картах",
  symbolsHint: "Помогает различать цвета",
  sound: "Звук",
  close: "Закрыть",
  card: "Карта",
  faceDown: "закрыта",
  matchedCard: "найдена пара",
  createdBy: "Автор",
};

const uz: Dict = {
  title: "Xotira o‘yini",
  difficulty: "Qiyinlik",
  easy: "Oson",
  medium: "O‘rta",
  hard: "Qiyin",
  moves: "Yurish",
  time: "Vaqt",
  points: "Ball",
  best: "Rekord",
  newGame: "Yangi o‘yin",
  pause: "To‘xtatish",
  resume: "Davom etish",
  paused: "To‘xtatildi",
  tapToStart: "Vaqt boshlanishi uchun kartani oching",
  win: "Siz yutdingiz!",
  lose: "O‘yin tugadi",
  playAgain: "Qayta o‘ynash",
  newRecord: "Yangi rekord!",
  yourPoints: "Sizning ballingiz",
  settings: "Sozlamalar",
  language: "Til",
  theme: "Mavzu",
  themeSystem: "Tizim",
  themeLight: "Yorug‘",
  themeDark: "Qorong‘i",
  symbols: "Karta belgilari",
  symbolsHint: "Ranglarni ajratishga yordam beradi",
  sound: "Ovoz",
  close: "Yopish",
  card: "Karta",
  faceDown: "yopiq",
  matchedCard: "juftlik topildi",
  createdBy: "Muallif",
};

const dictionaries: Record<Language, Dict> = { en, ru, uz };

export function translate(language: Language, key: TranslationKey): string {
  return dictionaries[language][key];
}

export function isLanguage(value: unknown): value is Language {
  return value === "uz" || value === "ru" || value === "en";
}

/** Pick a supported language from a BCP-47 locale such as "ru-RU". Defaults to Uzbek. */
export function detectLanguage(locale: string | undefined | null): Language {
  const code = (locale ?? "").slice(0, 2).toLowerCase();
  return isLanguage(code) ? code : "uz";
}
