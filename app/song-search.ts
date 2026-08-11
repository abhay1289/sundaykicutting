import type { BarberTrack } from "./barber-tracks";

/** Fold query/title for loose Hindi + English matching. */
export function foldSearch(value: string): string {
  return transliterate(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\u0900-\u097f]+/g, "");
}

/** Drop vowels so "hasrat" still hits "hasarat" / हसरत. */
function skeleton(value: string): string {
  return foldSearch(value).replace(/[aeiou]+/g, "");
}

/**
 * Rough Devanagari → Latin with inherent "a" after consonants
 * (so पहला → pahala, बाज़ीगर → bazeegar).
 */
function transliterate(input: string): string {
  const independent: Record<string, string> = {
    "अ": "a",
    "आ": "aa",
    "इ": "i",
    "ई": "ee",
    "उ": "u",
    "ऊ": "oo",
    "ए": "e",
    "ऐ": "ai",
    "ओ": "o",
    "औ": "au",
    "ऋ": "ri",
  };
  const consonant: Record<string, string> = {
    "क": "k",
    "ख": "kh",
    "ग": "g",
    "घ": "gh",
    "ङ": "ng",
    "च": "ch",
    "छ": "chh",
    "ज": "j",
    "झ": "jh",
    "ञ": "ny",
    "ट": "t",
    "ठ": "th",
    "ड": "d",
    "ढ": "dh",
    "ण": "n",
    "त": "t",
    "थ": "th",
    "द": "d",
    "ध": "dh",
    "न": "n",
    "प": "p",
    "फ": "ph",
    "ब": "b",
    "भ": "bh",
    "म": "m",
    "य": "y",
    "र": "r",
    "ल": "l",
    "व": "v",
    "श": "sh",
    "ष": "sh",
    "स": "s",
    "ह": "h",
    "क़": "q",
    "ख़": "kh",
    "ग़": "g",
    "ज़": "z",
    "ड़": "d",
    "ढ़": "dh",
    "फ़": "f",
  };
  const matra: Record<string, string> = {
    "ा": "a",
    "ि": "i",
    "ी": "ee",
    "ु": "u",
    "ू": "oo",
    "े": "e",
    "ै": "ai",
    "ो": "o",
    "ौ": "au",
    "ृ": "ri",
    "ं": "n",
    "ँ": "n",
    "ः": "h",
  };

  const chars = [...input];
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];

    if (ch === "्") continue;
    if (independent[ch]) {
      out += independent[ch];
      continue;
    }
    if (matra[ch]) {
      out += matra[ch];
      continue;
    }
    if (consonant[ch]) {
      let sound = consonant[ch];
      if (next === "़") {
        i += 1;
        if (ch === "ज") sound = "z";
        else if (ch === "फ") sound = "f";
        else if (ch === "क") sound = "q";
        else if (ch === "ख") sound = "kh";
        else if (ch === "ग") sound = "g";
        else if (ch === "ड") sound = "d";
        else if (ch === "ढ") sound = "dh";
      }
      out += sound;
      const after = chars[i + 1];
      if (after === "्") {
        continue;
      }
      if (after && matra[after]) {
        continue;
      }
      out += "a";
      continue;
    }
    out += ch;
  }
  return out;
}

export type SearchHit = {
  index: number;
  track: BarberTrack;
};

export function searchSongs(tracks: BarberTrack[], query: string, limit = 24): SearchHit[] {
  const q = foldSearch(query.trim());
  if (!q) {
    return tracks.slice(0, limit).map((track, index) => ({ index, track }));
  }

  const scored: { score: number; index: number; track: BarberTrack }[] = [];

  tracks.forEach((track, index) => {
    const title = foldSearch(track.title);
    const hay = foldSearch(`${track.title} ${track.lines.slice(0, 6).map((l) => l.text).join(" ")}`);
    const titleSkel = skeleton(track.title);
    const haySkel = skeleton(hay);
    const qSkel = skeleton(q);

    const fullHit = hay.includes(q) || title.includes(q);
    const skelHit = qSkel.length >= 3 && (haySkel.includes(qSkel) || titleSkel.includes(qSkel));
    if (!fullHit && !skelHit) return;

    let score = 0;
    if (title === q) score = 100;
    else if (title.startsWith(q)) score = 80;
    else if (title.includes(q)) score = 60;
    else if (titleSkel.startsWith(qSkel)) score = 50;
    else if (skelHit) score = 40;
    else score = 30;
    score += Math.max(0, 10 - Math.min(index, 10)) * 0.01;
    scored.push({ score, index, track });
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ index, track }) => ({ index, track }));
}
