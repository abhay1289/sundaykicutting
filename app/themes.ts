import type { StationId } from "./stations";

/** Per-language visual identity — colors, type, copy, and radio mood. */
export type LangTheme = {
  id: StationId;
  brand: string;
  wallpaper: string;
  image: string;
  accent: string;
  amber: string;
  brass: string;
  cream: string;
  wood: string;
  ink: string;
  glow: string;
  sepia: string;
  display: string;
  ui: string;
  note: string;
  channel: string;
  ctaPlay: string;
  ctaPause: string;
  ambienceOn: string;
  ambienceOff: string;
  htmlLang: string;
};

export const LANG_THEMES: Record<StationId, LangTheme> = {
  hi: {
    id: "hi",
    brand: "डीलक्स सैलून",
    wallpaper: "/images/wallpapers/01-old-barber-shop.jpg",
    image: "/images/cards/01-old-barber-shop.webp",
    accent: "#c66b45",
    amber: "#f0c36a",
    brass: "#c9a076",
    cream: "#f3e6c8",
    wood: "#2a1c12",
    ink: "#140e0a",
    glow: "240 160 60",
    sepia: "0.28",
    display: '"Yatra One", "Noto Serif Devanagari", Georgia, serif',
    ui: '"IBM Plex Mono", "Courier New", monospace',
    note: "जहाँ कैंची चले… वहाँ स्टाइल बने",
    channel: "हिन्दी सैलून रेडियो",
    ctaPlay: "यादें चालू रखो",
    ctaPause: "चल रहा है — रोकें",
    ambienceOn: "माहौल चालू",
    ambienceOff: "माहौल बंद",
    htmlLang: "hi",
  },
  bho: {
    id: "bho",
    brand: "डीलक्स सैलून",
    wallpaper: "/images/wallpapers/03-bhojpuri-salon.jpg",
    image: "/images/cards/03-bhojpuri-salon.webp",
    accent: "#a31f1f",
    amber: "#e0a100",
    brass: "#c48a2a",
    cream: "#fff0d4",
    wood: "#3a2414",
    ink: "#1c1008",
    glow: "224 161 0",
    sepia: "0.32",
    display: '"Yatra One", "Noto Serif Devanagari", Georgia, serif',
    ui: '"IBM Plex Mono", "Courier New", monospace',
    note: "इहाँ ईमानदारी से बाल कटत बाबू",
    channel: "भोजपुरी सैलून रेडियो",
    ctaPlay: "याद चालू करीं",
    ctaPause: "चल रहल बा — रोकीं",
    ambienceOn: "माहौल चालू बा",
    ambienceOff: "माहौल बंद बा",
    htmlLang: "hi",
  },
  hr: {
    id: "hr",
    brand: "डीलक्स सैलून",
    wallpaper: "/images/wallpapers/06-haryanvi-salon.jpg",
    image: "/images/cards/06-haryanvi-salon.webp",
    accent: "#b45309",
    amber: "#f0b429",
    brass: "#c9a227",
    cream: "#fff4dc",
    wood: "#2c1a0c",
    ink: "#161008",
    glow: "240 180 60",
    sepia: "0.3",
    display: '"Yatra One", "Noto Serif Devanagari", Georgia, serif',
    ui: '"IBM Plex Mono", "Courier New", monospace',
    note: "यो कटिंग करदे भाई — फुल झकास स्टाइल",
    channel: "हरियाणवी सैलून रेडियो",
    ctaPlay: "यादां चालू करो",
    ctaPause: "चल रया — रोक दो",
    ambienceOn: "माहौल चालू",
    ambienceOff: "माहौल बंद",
    htmlLang: "hi",
  },
  pa: {
    id: "pa",
    brand: "ਡੀਲਕਸ ਸੈਲੂਨ",
    wallpaper: "/images/wallpapers/04-punjabi-salon.jpg",
    image: "/images/cards/04-punjabi-salon.webp",
    accent: "#c2185b",
    amber: "#f2a900",
    brass: "#d4af37",
    cream: "#fff5e6",
    wood: "#1a3a2a",
    ink: "#0d1f16",
    glow: "242 169 0",
    sepia: "0.18",
    display: '"Baloo Paaji 2", "Yatra One", "Noto Sans Gurmukhi", sans-serif',
    ui: '"IBM Plex Mono", "Courier New", monospace',
    note: "ਸਟਾਈਲ ਵੀ ਪੰਜਾਬੀ ਹੋਣਾ ਚਾਹੀਦਾ",
    channel: "ਪੰਜਾਬੀ ਸੈਲੂਨ ਰੇਡੀਓ",
    ctaPlay: "ਯਾਦਾਂ ਚਲਾਓ",
    ctaPause: "ਚੱਲ ਰਿਹਾ — ਰੋਕੋ",
    ambienceOn: "ਮਾਹੌਲ ਚਾਲੂ",
    ambienceOff: "ਮਾਹੌਲ ਬੰਦ",
    htmlLang: "pa",
  },
  ta: {
    id: "ta",
    brand: "டீலக்ஸ் செலூன்",
    wallpaper: "/images/wallpapers/02-tamil-salon.jpg",
    image: "/images/cards/02-tamil-salon.webp",
    accent: "#b83280",
    amber: "#f6ad55",
    brass: "#d69e2e",
    cream: "#fff5f5",
    wood: "#231815",
    ink: "#120d0b",
    glow: "246 173 85",
    sepia: "0.2",
    display: '"Catamaran", "Yatra One", sans-serif',
    ui: '"IBM Plex Mono", "Courier New", monospace',
    note: "கத்தரி சத்தம்... ஸ்டைல் மாஸ் தலைவா",
    channel: "தமிழ் செலூன் ரேடியோ",
    ctaPlay: "இசையைத் தொடங்கு",
    ctaPause: "இயங்குகிறது — நிறுத்து",
    ambienceOn: "சலசலப்பு ஆன்",
    ambienceOff: "சலசலப்பு ஆஃப்",
    htmlLang: "ta",
  },
  te: {
    id: "te",
    brand: "డీలక్స్ సెలూన్",
    wallpaper: "/images/wallpapers/07-telugu-salon.jpg",
    image: "/images/cards/07-telugu-salon.webp",
    accent: "#9a3412",
    amber: "#f0c14a",
    brass: "#d4a84b",
    cream: "#fff7e8",
    wood: "#1f2f28",
    ink: "#0f1a16",
    glow: "212 160 70",
    sepia: "0.16",
    display: '"Catamaran", "Noto Sans Telugu", "Yatra One", sans-serif',
    ui: '"IBM Plex Mono", "Courier New", monospace',
    note: "కత్తెర స్వాగతం — స్టైల్ గ్యారంటీ",
    channel: "తెలుగు సెలూన్ రేడియో",
    ctaPlay: "జ్ఞాపకాలు మొదలు",
    ctaPause: "నడుస్తోంది — ఆపు",
    ambienceOn: "వాతావరణం ఆన్",
    ambienceOff: "వాతావరణం ఆఫ్",
    htmlLang: "te",
  },
};

export function themeToCssVars(theme: LangTheme): Record<string, string> {
  return {
    "--accent": theme.accent,
    "--amber": theme.amber,
    "--brass": theme.brass,
    "--cream": theme.cream,
    "--wood": theme.wood,
    "--ink": theme.ink,
    "--glow": theme.glow,
    "--sepia": theme.sepia,
    "--display-hi": theme.display,
    "--ui": theme.ui,
  };
}
