export type WeatherId = "clear" | "rain";

export const WEATHERS: { id: WeatherId; label: string; icon: string }[] = [
  { id: "clear", label: "साफ़", icon: "○" },
  { id: "rain", label: "बारिश", icon: "🌧" },
];
