import { barberTracks, type BarberTrack, type TrackLang } from "./barber-tracks";

export type StationId = "hi" | "bho" | "hr" | "pa" | "ta" | "te";

export type Station = {
  id: StationId;
  label: string;
  short: string;
};

/** Order: Hindi → Bhojpuri → Haryanvi → Punjabi → Tamil → Telugu */
export const STATIONS: Station[] = [
  { id: "hi", label: "हिन्दी", short: "HI" },
  { id: "bho", label: "भोजपुरी", short: "BHO" },
  { id: "hr", label: "हरियाणवी", short: "HR" },
  { id: "pa", label: "ਪੰਜਾਬੀ", short: "PA" },
  { id: "ta", label: "தமிழ்", short: "TA" },
  { id: "te", label: "తెలుగు", short: "TE" },
];

export function tracksForStation(station: StationId): BarberTrack[] {
  return barberTracks.filter((track) => track.lang === station);
}

export function stationCounts(): Record<StationId, number> {
  const counts: Record<StationId, number> = {
    hi: 0,
    bho: 0,
    hr: 0,
    pa: 0,
    ta: 0,
    te: 0,
  };
  for (const track of barberTracks) {
    if (track.lang in counts) counts[track.lang as StationId] += 1;
  }
  return counts;
}
