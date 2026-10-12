export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  cardBack: string;
  cardBackAccent: string;
  danger: string;
  success: string;
}

export const lightPalette: Palette = {
  background: "#FFF4EC",
  surface: "#FFFFFF",
  surfaceAlt: "#FBE3D3",
  text: "#2B1D14",
  textMuted: "#6F5848",
  border: "#EBCDB9",
  primary: "#E5484D",
  primaryText: "#FFFFFF",
  cardBack: "#F76B15",
  cardBackAccent: "#FFB07A",
  danger: "#CE2C31",
  success: "#218358",
};

export const darkPalette: Palette = {
  background: "#16110E",
  surface: "#231C17",
  surfaceAlt: "#30261F",
  text: "#F7EDE6",
  textMuted: "#BBA797",
  border: "#42342B",
  primary: "#FF6369",
  primaryText: "#1A0A0B",
  cardBack: "#C2500A",
  cardBackAccent: "#8A3A08",
  danger: "#FF6369",
  success: "#3DD68C",
};

export function resolveScheme(mode: "system" | "light" | "dark", systemIsDark: boolean): "light" | "dark" {
  if (mode === "system") return systemIsDark ? "dark" : "light";
  return mode;
}

export function paletteFor(scheme: "light" | "dark"): Palette {
  return scheme === "dark" ? darkPalette : lightPalette;
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
