"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { type Place } from "../place";
import { rememberTrack } from "../listening";
import { activeLyricIndex, scaleLinesToDuration, type BarberTrack, type LyricLine } from "../barber-tracks";
import { OfflineBanner } from "./OfflineBanner";
import { SongSearch } from "./SongSearch";
import { STATIONS, tracksForStation, type StationId } from "../stations";
import { LANG_THEMES, themeToCssVars } from "../themes";
import { WEATHERS, type WeatherId } from "../scene-moods";

type YouTubePlayer = {
  playVideo(): void;
  pauseVideo(): void;
  playVideoAt(index: number): void;
  nextVideo(): void;
  previousVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  mute(): void;
  unMute(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlaylist(): string[] | null;
  getPlaylistIndex(): number;
  getVideoData(): { title?: string; author?: string; video_id?: string };
  destroy(): void;
  cuePlaylist?(
    playlist: string | string[] | {
      listType?: string;
      list?: string;
      playlist?: string[];
      index?: number;
      startSeconds?: number;
    },
    index?: number,
    startSeconds?: number,
  ): void;
  loadPlaylist?(
    playlist: string | string[] | {
      listType?: string;
      list?: string;
      playlist?: string[];
      index?: number;
      startSeconds?: number;
    },
    index?: number,
    startSeconds?: number,
  ): void;
  getPlayerState?(): number;
};

type YouTubeEvent = { data: number; target: YouTubePlayer };

type YouTubeApi = {
  Player: new (
    host: HTMLElement | HTMLIFrameElement,
    options: {
      host?: string;
      playerVars?: { [key: string]: string | number };
      events?: {
        onReady?: (event: YouTubeEvent) => void;
        onStateChange?: (event: YouTubeEvent) => void;
        onError?: (event: YouTubeEvent) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number; CUED: number };
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YouTubeApi> | null = null;

function loadYouTubeApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise<YouTubeApi>((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        if (window.YT?.Player) resolve(window.YT);
        else reject(new Error("YouTube iframe API loaded without a player"));
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => reject(new Error("YouTube iframe API blocked"));
      document.head.appendChild(script);
      window.setTimeout(() => reject(new Error("YouTube iframe API timed out")), 12000);
    });
    apiPromise.catch(() => {
      apiPromise = null;
    });
  }
  return apiPromise;
}

/**
 * A YT.Player only grows its transport methods once its iframe has answered, and
 * destroy() strips them off again. Every call has to check rather than assume.
 */
function live(player: YouTubePlayer | null): YouTubePlayer | null {
  if (!player) return null;
  return typeof player.getCurrentTime === "function" && typeof player.seekTo === "function" ? player : null;
}

/** Helper to synthesize realistic steel scissor blade slide + tip snap. */
function playScissorCut(ctx: AudioContext, master: GainNode) {
  if (ctx.state === "suspended") void ctx.resume();
  const t = ctx.currentTime;

  // 1. Blade slide friction ('shhh' friction as blades close)
  const slideBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
  const slideData = slideBuf.getChannelData(0);
  for (let i = 0; i < slideData.length; i++) {
    slideData[i] = (Math.random() * 2 - 1) * Math.sin((i / slideData.length) * Math.PI);
  }
  const slideSrc = ctx.createBufferSource();
  slideSrc.buffer = slideBuf;

  const slideFilter = ctx.createBiquadFilter();
  slideFilter.type = "bandpass";
  slideFilter.frequency.value = 3600 + Math.random() * 800;
  slideFilter.Q.value = 3.5;

  const slideGain = ctx.createGain();
  slideGain.gain.setValueAtTime(0.0001, t);
  slideGain.gain.linearRampToValueAtTime(0.065, t + 0.015);
  slideGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.048);

  slideSrc.connect(slideFilter).connect(slideGain).connect(master);
  slideSrc.start(t);

  // 2. Sharp metallic tip snap ('snip!')
  const snapBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.018), ctx.sampleRate);
  const snapData = snapBuf.getChannelData(0);
  for (let i = 0; i < snapData.length; i++) {
    snapData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / snapData.length, 2.5);
  }
  const snapSrc = ctx.createBufferSource();
  snapSrc.buffer = snapBuf;

  const snapFilter = ctx.createBiquadFilter();
  snapFilter.type = "highpass";
  snapFilter.frequency.value = 5400 + Math.random() * 900;

  const snapGain = ctx.createGain();
  snapGain.gain.setValueAtTime(0.0001, t + 0.018);
  snapGain.gain.exponentialRampToValueAtTime(0.12, t + 0.022);
  snapGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.036);

  snapSrc.connect(snapFilter).connect(snapGain).connect(master);
  snapSrc.start(t + 0.018);

  // 3. Hair crunch ('ch-ch-ch')
  const crunchBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
  const crunchData = crunchBuf.getChannelData(0);
  for (let i = 0; i < crunchData.length; i++) {
    crunchData[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin((i / crunchData.length) * Math.PI), 0.5);
  }
  const crunchSrc = ctx.createBufferSource();
  crunchSrc.buffer = crunchBuf;

  const crunchFilter = ctx.createBiquadFilter();
  crunchFilter.type = "highpass";
  crunchFilter.frequency.value = 2800;

  const crunchGain = ctx.createGain();
  crunchGain.gain.setValueAtTime(0.0001, t);
  crunchGain.gain.linearRampToValueAtTime(0.12, t + 0.01);
  crunchGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

  crunchSrc.connect(crunchFilter).connect(crunchGain).connect(master);
  crunchSrc.start(t);
}

/** Salon ambience: fan rumble + continuous realistic barber scissor haircutting sound under music. */
function useRoomTone(place: Place, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 1.2);
    master.connect(ctx.destination);

    // Continuous organic barber haircutting rhythm sequence
    let cancelled = false;
    let timerId = 0;

    const runBarberRoutine = () => {
      if (cancelled) return;

      const numSnips = 3 + Math.floor(Math.random() * 4); // 3 to 6 cuts in a row
      const snipInterval = 95 + Math.random() * 30; // 95ms - 125ms per cut

      for (let i = 0; i < numSnips; i++) {
        window.setTimeout(() => {
          if (!cancelled) playScissorCut(ctx, master);
        }, i * snipInterval);
      }

      const burstTime = numSnips * snipInterval;
      const pauseTime = 300 + Math.random() * 650; // short pause between trim bursts
      timerId = window.setTimeout(runBarberRoutine, burstTime + pauseTime);
    };

    timerId = window.setTimeout(runBarberRoutine, 400);

    const unlock = () => {
      if (ctx.state === "suspended") void ctx.resume();
    };
    document.addEventListener("pointerdown", unlock, { once: true });

    return () => {
      cancelled = true;
      document.removeEventListener("pointerdown", unlock);
      window.clearTimeout(timerId);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      window.setTimeout(() => {
        void ctx.close();
      }, 220);
    };
  }, [enabled, place.id, place.tone]);
}

/** Soft generated rain bed + thunderstorm every 10-15s. */
function useWeatherTone(weather: WeatherId, onThunder?: () => void) {
  useEffect(() => {
    if (weather !== "rain") return;

    const ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.8);
    master.connect(ctx.destination);

    const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.92 + white * 0.08;
      data[i] = last;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 850;
    filter.Q.value = 0.5;
    source.connect(filter).connect(master);
    source.start();

    // Synthesized thunderstorm generator
    const playThunder = () => {
      if (ctx.state === "suspended") void ctx.resume();
      const t = ctx.currentTime;

      // 1. Initial thunder crack / peal
      const crackBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.5), ctx.sampleRate);
      const crackData = crackBuf.getChannelData(0);
      let cLast = 0;
      for (let i = 0; i < crackData.length; i++) {
        const white = Math.random() * 2 - 1;
        cLast = cLast * 0.82 + white * 0.18;
        crackData[i] = cLast;
      }
      const crackSource = ctx.createBufferSource();
      crackSource.buffer = crackBuf;

      const crackFilter = ctx.createBiquadFilter();
      crackFilter.type = "bandpass";
      crackFilter.frequency.value = 280 + Math.random() * 140;
      crackFilter.Q.value = 1.8;

      const crackGain = ctx.createGain();
      crackGain.gain.setValueAtTime(0.001, t);
      crackGain.gain.exponentialRampToValueAtTime(0.28, t + 0.04);
      crackGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      crackSource.connect(crackFilter).connect(crackGain).connect(master);
      crackSource.start(t);

      // 2. Low-frequency deep thunder rumble oscillator (sub-bass 35Hz - 65Hz)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(65, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 3.0);

      oscGain.gain.setValueAtTime(0.001, t);
      oscGain.gain.exponentialRampToValueAtTime(0.22, t + 0.12);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 3.2);

      osc.connect(oscGain).connect(master);
      osc.start(t);
      osc.stop(t + 3.3);

      // 3. Rolling thunder echo pulses (clouds/hills)
      for (const offset of [0.4, 0.95, 1.6]) {
        const pOsc = ctx.createOscillator();
        const pGain = ctx.createGain();
        pOsc.type = "sine";
        pOsc.frequency.setValueAtTime(45 + Math.random() * 15, t + offset);
        pGain.gain.setValueAtTime(0.001, t + offset);
        pGain.gain.exponentialRampToValueAtTime(0.12, t + offset + 0.08);
        pGain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.8);

        pOsc.connect(pGain).connect(master);
        pOsc.start(t + offset);
        pOsc.stop(t + offset + 0.85);
      }

      if (onThunder) onThunder();
    };

    let cancelled = false;
    let thunderTimer = 0;

    const scheduleThunder = () => {
      if (cancelled) return;
      playThunder();
      const delay = 10000 + Math.random() * 5000;
      thunderTimer = window.setTimeout(scheduleThunder, delay);
    };

    thunderTimer = window.setTimeout(scheduleThunder, 2500);

    const unlock = () => {
      if (ctx.state === "suspended") void ctx.resume();
    };
    document.addEventListener("pointerdown", unlock, { once: true });

    return () => {
      cancelled = true;
      document.removeEventListener("pointerdown", unlock);
      window.clearTimeout(thunderTimer);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
      window.setTimeout(() => {
        try { source.stop(); } catch { /* already stopped */ }
        void ctx.close();
      }, 180);
    };
  }, [weather, onThunder]);
}

/** Synthesize a short radio dial tuning crackle (0.35s). */
function playRadioStatic() {
  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.35), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.35);
    window.setTimeout(() => void ctx.close(), 400);
  } catch {
    /* ignored */
  }
}

function RainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const dropCount = Math.min(Math.floor((width * height) / 6500), 240);
    const drops = Array.from({ length: dropCount }, () => ({
      x: Math.random() * width * 1.25 - width * 0.1,
      y: Math.random() * height,
      len: Math.random() * 32 + 14,
      speed: Math.random() * 14 + 11,
      width: Math.random() * 1.5 + 0.6,
      opacity: Math.random() * 0.48 + 0.25,
    }));

    const glassDropCount = Math.min(Math.floor(width / 20), 75);
    const glassDrops = Array.from({ length: glassDropCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2.8 + 1.2,
      speed: Math.random() * 0.85 + 0.15,
      trail: [] as { y: number; r: number }[],
    }));

    const splashes: { x: number; y: number; r: number; maxR: number; alpha: number }[] = [];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const windAngle = 0.18;
      for (const drop of drops) {
        ctx.beginPath();
        const endX = drop.x + drop.len * windAngle;
        const endY = drop.y + drop.len;

        const grad = ctx.createLinearGradient(drop.x, drop.y, endX, endY);
        grad.addColorStop(0, "rgba(215, 235, 255, 0)");
        grad.addColorStop(1, `rgba(225, 242, 255, ${drop.opacity})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = drop.width;
        ctx.lineCap = "round";
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        drop.x += drop.speed * windAngle;
        drop.y += drop.speed;

        if (drop.y > height) {
          if (Math.random() < 0.38) {
            splashes.push({
              x: drop.x,
              y: height - Math.random() * 22,
              r: 1,
              maxR: Math.random() * 6.5 + 3,
              alpha: 0.65,
            });
          }
          drop.y = -drop.len;
          drop.x = Math.random() * width * 1.25 - width * 0.1;
        }
      }

      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.r * 1.8, s.r * 0.6, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(220, 238, 255, ${s.alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        s.r += 0.45;
        s.alpha -= 0.038;
        if (s.alpha <= 0 || s.r >= s.maxR) {
          splashes.splice(i, 1);
        }
      }

      for (const gd of glassDrops) {
        ctx.beginPath();
        ctx.arc(gd.x, gd.y, gd.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(230, 242, 255, 0.38)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(gd.x - gd.r * 0.3, gd.y - gd.r * 0.3, gd.r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
        ctx.fill();

        if (Math.random() < 0.28) {
          gd.y += gd.speed;
          if (gd.trail.length > 8) gd.trail.shift();
          gd.trail.push({ y: gd.y, r: gd.r * 0.6 });
        }

        for (const tr of gd.trail) {
          ctx.beginPath();
          ctx.arc(gd.x, tr.y, tr.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(200, 225, 255, 0.14)";
          ctx.fill();
        }

        if (gd.y > height) {
          gd.y = -10;
          gd.x = Math.random() * width;
          gd.trail = [];
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="rain-canvas" aria-hidden="true" />;
}

function WeatherLayer({ weather, flash }: { weather: WeatherId; flash?: boolean }) {
  if (weather !== "rain") return null;

  return (
    <div className={`weather weather-rain${flash ? " is-lightning" : ""}`} aria-hidden="true">
      <div className="rain-lightning" />
      <RainCanvas />
      <span className="rain-sheet rain-sheet-a" />
      <span className="rain-sheet rain-sheet-b" />
      <span className="rain-wet" />
      <span className="rain-splash" />
    </div>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function ShuffleIcon() {
  return (
    <svg {...ICON} aria-hidden="true">
      <path d="M16 3h5v5M4 20l17-17M21 16v5h-5M15 15l5 5M4 4l5 5" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function PrevIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 5.6h2.2v12.8H6.6zM19 5.6v12.8l-9.2-6.4z" /></svg>;
}

function NextIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.2 5.6h2.2v12.8h-2.2zM5 5.6l9.2 6.4L5 18.4z" /></svg>;
}

function RewindIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11.4 6v12l-8-6zM21 6v12l-8-6z" /></svg>;
}

function ForwardIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6l8 6-8 6zM12.6 6l8 6-8 6z" /></svg>;
}

function PlayIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>;
}

function PauseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5.5h4v13H6zm8 0h4v13h-4z" /></svg>;
}

/*
 * The three settings icons share one drawing: a 24 grid, stroke-only at 1.7,
 * round caps and joins. Drawn to the same optical weight and centred on the same
 * 18-unit box, so the group reads as a set rather than three borrowed glyphs.
 */
const ICON = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Speaker with its cone, gaining waves when open and a slash when muted. */
function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg {...ICON} aria-hidden="true">
      <path d="M4 9.6h2.7L11 6.1v11.8L6.7 14.4H4z" />
      {muted ? (
        <path d="M15.1 9.9l4.6 4.2M19.7 9.9l-4.6 4.2" />
      ) : (
        <>
          <path d="M14.6 9.5a3.6 3.6 0 0 1 0 5" />
          <path d="M17.4 7.2a7.2 7.2 0 0 1 0 9.6" />
        </>
      )}
    </svg>
  );
}

/** Two links of a chain, at the same angle as the arrow in the credit line. */
function LinkIcon() {
  return (
    <svg {...ICON} aria-hidden="true">
      <path d="M10.4 13.6a3.4 3.4 0 0 0 4.8 0l2.6-2.6a3.4 3.4 0 0 0-4.8-4.8l-1 1" />
      <path d="M13.6 10.4a3.4 3.4 0 0 0-4.8 0l-2.6 2.6a3.4 3.4 0 0 0 4.8 4.8l1-1" />
    </svg>
  );
}

/** Confirmation that the link is on the clipboard. */
function CopiedIcon() {
  return (
    <svg {...ICON} aria-hidden="true">
      <path d="M5.5 12.6l4 4 9-9.2" />
    </svg>
  );
}

/** Two short verse lines — lyrics toggle. */
function LyricsIcon() {
  return (
    <svg {...ICON} aria-hidden="true">
      <path d="M5 7.5h14" />
      <path d="M5 12h10" />
      <path d="M5 16.5h7" />
    </svg>
  );
}

/** Magnifying glass — song search. */
function SearchIcon() {
  return (
    <svg {...ICON} aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="5.2" />
      <path d="M14.6 14.6L19 19" />
    </svg>
  );
}

function SyncedLyrics({
  track,
  time,
  duration,
}: {
  track: BarberTrack;
  time: number;
  duration: number;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const lines = scaleLinesToDuration(track.lines, duration);
  const active = activeLyricIndex(lines, time);

  useEffect(() => {
    const root = listRef.current;
    if (!root || active < 0) return;
    const line = root.querySelector<HTMLElement>(`[data-line="${active}"]`);
    if (!line) return;
    const rootBox = root.getBoundingClientRect();
    const lineBox = line.getBoundingClientRect();
    const offset = lineBox.top - rootBox.top - rootBox.height / 2 + lineBox.height / 2;
    root.scrollTop += offset;
  }, [active, track.id, duration]);

  return (
    <aside className="lyrics-sheet" aria-live="polite">
      <small>
        लाइव बोल · {track.title}
        {duration > 0 ? ` · ${Math.floor(time)}से` : ""}
      </small>
      <div className="lyrics-lines" ref={listRef}>
        {lines.map((line: LyricLine, index: number) => (
          <p
            key={`${track.id}-${index}`}
            data-line={index}
            className={
              index === active
                ? "lyrics-line is-active"
                : index < active
                  ? "lyrics-line is-past"
                  : "lyrics-line"
            }
          >
            {line.text}
          </p>
        ))}
      </div>
    </aside>
  );
}

const NUDGE = 10;

/**
 * A shared link can name a track and a moment inside it: `?t=3&s=42`.
 *
 * These go straight into the player's own `index` and `start` vars rather than
 * being seeked to after the fact, so the playlist simply cues up there — no
 * autoplay is attempted, which a fresh page load would have blocked anyway.
 */
function readDeepLink(): { index: number; start: number } {
  if (typeof window === "undefined") return { index: 0, start: 0 };
  const params = new URLSearchParams(window.location.search);
  const index = Number(params.get("t"));
  const start = Number(params.get("s"));
  return {
    index: Number.isFinite(index) && index > 0 ? Math.floor(index) : 0,
    start: Number.isFinite(start) && start > 0 ? Math.floor(start) : 0,
  };
}

type DeckProps = {
  place: Place;
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
  station: StationId;
  onStationChange: (station: StationId) => void;
};

/**
 * Mounted with the playlist id as its key, so moving to another place builds a
 * fresh deck instead of pointing new state at a torn-down player.
 *
 * At rest the dock is one thing: the record, with a play button on it and a
 * progress ring around it. Reaching for it swells that circle out into a card
 * carrying the title, the rail and the transport. Only the record takes part in
 * page layout, so the card overlays the wallpaper and the record never moves.
 */
function PlaceDeck({ place, muted, onMutedChange, station, onStationChange }: DeckProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const mutedRef = useRef(muted);

  const queue = useMemo(() => tracksForStation(station), [station]);
  const queueVideos = useMemo(() => queue.map((entry) => entry.id), [queue]);
  const theme = LANG_THEMES[station];

  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [track, setTrack] = useState("");
  const [position, setPosition] = useState({ index: 0, total: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const [videoId, setVideoId] = useState("");
  const [showLyrics, setShowLyrics] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const videosRef = useRef(queueVideos);
  const stationBooted = useRef(false);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    videosRef.current = queueVideos;
  }, [queueVideos]);

  useEffect(() => {
    const openSearch = () => setShowSearch(true);
    window.addEventListener("deluxe-salon-search", openSearch);
    return () => window.removeEventListener("deluxe-salon-search", openSearch);
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    const player = live(playerRef.current);
    if (!player) return;
    
    if (!stationBooted.current) {
      stationBooted.current = true;
      player.playVideo?.();
      return;
    }
    
    const videos = videosRef.current;
    if (!videos.length) return;
    
    setElapsed(0);
    setScrub(null);
    setDuration(0);
    setPlaying(true);
    
    try {
      player.loadPlaylist?.(videos, 0, 0);
      setVideoId(videos[0] ?? "");
      setPosition({ index: 1, total: videos.length });
    } catch {
      /* ignore */
    }
  }, [station, queueVideos, status]);

  useEffect(() => {
    let disposed = false;
    let player: YouTubePlayer | null = null;
    const wrapper = hostRef.current;

    const deepLink = readDeepLink();

    const readTrack = (target: YouTubePlayer) => {
      const playlist = target.getPlaylist();
      const index = Math.max(0, target.getPlaylistIndex());
      const data = target.getVideoData();
      const fromPlaylist = playlist?.[index];
      const fromQueue = videosRef.current[index];
      const id = data.video_id || fromPlaylist || fromQueue || videosRef.current[0] || "";
      setTrack(data.title ?? "");
      setVideoId(id);
      setPosition({ index: index + 1, total: playlist?.length ?? videosRef.current.length });
      const nextDuration = target.getDuration();
      if (nextDuration > 0) setDuration(nextDuration);
      rememberTrack(index);
    };

    loadYouTubeApi()
      .then((api) => {
        if (disposed || !wrapper) return;

        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const videos = videosRef.current.filter(Boolean);
        if (!videos.length) {
          setStatus("unavailable");
          return;
        }

        const startIndex = Math.min(Math.max(0, deepLink.index), videos.length - 1);
        const mount = document.createElement("div");
        wrapper.appendChild(mount);

        let errorCount = 0;

        player = new api.Player(mount, {
          host: "https://www.youtube.com",
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin,
          },
          events: {
            onReady: (event) => {
              if (disposed) return;
              playerRef.current = event.target;
              const iframe = wrapper.querySelector("iframe");
              iframe?.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
              if (mutedRef.current) event.target.mute();

              try {
                // Cue a custom queue of video IDs (official YT overload).
                event.target.cuePlaylist?.(videos, startIndex, deepLink.start);
              } catch {
                /* ignore */
              }

              setVideoId(videos[startIndex] ?? "");
              setStatus("ready");
              readTrack(event.target);
            },
            onStateChange: (event) => {
              if (disposed) return;
              const state = event.data;
              setPlaying(state === api.PlayerState.PLAYING);
              setBuffering(state === api.PlayerState.BUFFERING);
              if (
                state === api.PlayerState.PLAYING ||
                state === api.PlayerState.CUED ||
                state === api.PlayerState.PAUSED
              ) {
                readTrack(event.target);
                const t = event.target.getCurrentTime();
                setElapsed(t);
              }
              if (state === api.PlayerState.PLAYING) {
                const d = event.target.getDuration();
                if (d > 0) setDuration(d);
              }
            },
            onError: (event) => {
              if (disposed) return;
              errorCount++;
              if (errorCount > 3) {
                setStatus("unavailable");
              } else {
                try {
                  event.target.nextVideo();
                } catch {
                  setStatus("unavailable");
                }
              }
            },
          },
        });
      })
      .catch(() => {
        if (!disposed) setStatus("unavailable");
      });

    return () => {
      disposed = true;
      playerRef.current = null;
      try {
        player?.destroy();
      } catch { /* iframe already gone */ }
      if (wrapper) wrapper.textContent = "";
    };
  }, [place.id]);

  // Drive lyrics + seek bar directly from YouTube's clock while audio is playing.
  useEffect(() => {
    if (!playing) return;
    const tick = () => {
      const player = live(playerRef.current);
      if (!player) return;
      const t = player.getCurrentTime();
      const d = player.getDuration();
      setElapsed(t);
      if (d > 0) setDuration(d);
    };
    tick();
    const timer = window.setInterval(tick, 100);
    return () => window.clearInterval(timer);
  }, [playing]);

  const lockSync = (seconds: number) => {
    setElapsed(seconds);
  };

  const toggle = useCallback(() => {
    const player = live(playerRef.current);
    if (!player) return;
    if (playing) {
      player.pauseVideo();
    } else {
      if (muted) {
        player.mute();
      } else {
        player.unMute();
      }
      try {
        const state = player.getPlayerState?.();
        if (state === -1 || state === 5 || state === undefined) {
          player.playVideoAt?.(0);
        }
        player.playVideo();
      } catch {
        player.playVideo();
      }
    }
  }, [playing, muted]);

  const skip = useCallback((direction: 1 | -1) => {
    const player = live(playerRef.current);
    if (!player) return;
    lockSync(0);
    setScrub(null);
    if (direction === 1) player.nextVideo();
    else player.previousVideo();
  }, []);

  const jumpTo = useCallback((index: number) => {
    const player = live(playerRef.current);
    const videos = videosRef.current;
    if (!player || index < 0 || index >= videos.length) return;
    lockSync(0);
    setScrub(null);
    setDuration(0);
    try {
      player.playVideoAt(index);
    } catch {
      try {
        player.cuePlaylist?.(videos, index, 0);
        window.setTimeout(() => live(playerRef.current)?.playVideo(), 200);
      } catch {
        /* ignore */
      }
    }
    const url = new URL(window.location.href);
    url.searchParams.set("t", String(index));
    url.searchParams.delete("s");
    window.history.replaceState({}, "", url);
  }, []);

  const playRandom = useCallback(() => {
    const videos = videosRef.current;
    if (!videos.length) return;
    const randomIndex = Math.floor(Math.random() * videos.length);
    jumpTo(randomIndex);
  }, [jumpTo]);

  const nudge = useCallback((delta: number) => {
    const player = live(playerRef.current);
    if (!player) return;
    const total = player.getDuration();
    const target = player.getCurrentTime() + delta;
    const next = Math.max(0, total > 0 ? Math.min(target, total) : target);
    player.seekTo(next, true);
    lockSync(next);
  }, []);

  const commitScrub = () => {
    if (scrub === null) return;
    live(playerRef.current)?.seekTo(scrub, true);
    lockSync(scrub);
    setScrub(null);
  };

  const toggleMute = useCallback(() => {
    const player = live(playerRef.current);
    if (!player) return;
    if (muted) player.unMute();
    else player.mute();
    onMutedChange(!muted);
  }, [muted, onMutedChange]);

  /*
   * Keyboard transport. Space and the arrows are only ours when nothing else is
   * already handling them — a focused button owns Space, and the seek slider owns
   * the arrows, so both are left alone.
   */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

      if (event.key === "/" || event.key === "f") {
        event.preventDefault();
        setShowSearch(true);
        return;
      }

      switch (event.key) {
        case " ":
        case "k":
          if (event.key === " " && target?.closest("button, a")) return;
          event.preventDefault();
          toggle();
          break;
        case "ArrowLeft":
        case "j":
          event.preventDefault();
          nudge(-NUDGE);
          break;
        case "ArrowRight":
        case "l":
          event.preventDefault();
          nudge(NUDGE);
          break;
        case "m":
          toggleMute();
          break;
        default:
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle, nudge, toggleMute]);

  const at = scrub ?? elapsed;
  const lyricsTime = scrub ?? elapsed;
  const progress = duration > 0 ? Math.min(at / duration, 1) : 0;
  const ready = status === "ready";
  const videos = queueVideos;
  const lyricTracks = queue;
  const currentLyrics =
    lyricTracks.find((entry) => entry.id === videoId) ??
    (position.index > 0 ? lyricTracks[position.index - 1] : undefined) ??
    lyricTracks[0];
  const hasLyrics = lyricTracks.length > 0;
  const playlistUrl = `https://www.youtube.com/watch_videos?video_ids=${videos.slice(0, 50).join(",")}`;
  const fallbackSrc = videos.length > 0
    ? `https://www.youtube.com/embed/${videos[0]}?playlist=${videos.slice(1, 40).join(",")}`
    : "";
  const songTitle = currentLyrics?.title || track || place.playlist.title;

  return (
    <>
      <div className="place-dock">
        {hasLyrics && showLyrics && currentLyrics && (
          <SyncedLyrics track={currentLyrics} time={lyricsTime} duration={duration} />
        )}

        <section className="radio radio-long" aria-label={`${place.title} रेडियो`} data-playing={playing}>
          <button
            className="radio-avatar"
            type="button"
            onClick={toggle}
            disabled={!ready}
            aria-label={playing ? "रोकें" : "चलाएँ"}
            data-playing={playing}
          >
            <span style={{ backgroundImage: `url(${videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : theme.image})` }} />
          </button>

          <div className="radio-mid">
            <div className="radio-copy">
              <div className="radio-title-row">
                <button
                  className="radio-title"
                  type="button"
                  onClick={() => setShowSearch(true)}
                  title="गाना खोजें"
                >
                  {songTitle}
                </button>
                {playing && (
                  <span className="radio-eq" title="बज रहा है">
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                )}
              </div>
              <div className="radio-sub-row">
                <a className="radio-credit" href={playlistUrl} target="_blank" rel="noreferrer">
                  {theme.channel} · {Math.min(position.index || 1, videos.length)}/{videos.length}
                </a>
                <span className="radio-freq-badge">FM 90.4</span>
              </div>
            </div>

            <div className="radio-seek">
              <input
                className="deck-range"
                style={{ "--fill": progress * 100 } as CSSProperties}
                type="range"
                min={0}
                max={Math.max(duration, 1)}
                step={1}
                value={Math.min(at, Math.max(duration, 1))}
                onChange={(event) => setScrub(Number(event.target.value))}
                onPointerUp={commitScrub}
                onKeyUp={commitScrub}
                onBlur={commitScrub}
                disabled={!ready || duration <= 0}
                aria-label="गाने में आगे-पीछे जाएँ"
              />
              <div className="deck-times">
                <time>
                  {formatTime(at)} / {formatTime(duration)}
                </time>
              </div>
            </div>
          </div>

          <div className="radio-keys">
            <button
              type="button"
              onClick={playRandom}
              disabled={!ready}
              title="रैंडम गाना (Shuffle)"
              aria-label="रैंडम गाना"
            >
              <ShuffleIcon />
            </button>
            <button type="button" onClick={() => skip(-1)} disabled={!ready} aria-label="पिछला गाना">
              <PrevIcon />
            </button>
            <button
              className="radio-play"
              type="button"
              onClick={toggle}
              disabled={!ready}
              aria-label={playing ? theme.ctaPause : theme.ctaPlay}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button type="button" onClick={() => skip(1)} disabled={!ready} aria-label="अगला गाना">
              <NextIcon />
            </button>
            <button type="button" onClick={() => setShowSearch(true)} aria-label="गाना खोजें">
              <SearchIcon />
            </button>
            <button
              type="button"
              onClick={() => setShowLyrics((open) => !open)}
              aria-pressed={showLyrics}
              aria-label={showLyrics ? "बोल छुपाएँ" : "बोल दिखाएँ"}
              disabled={!hasLyrics}
            >
              <LyricsIcon />
            </button>
            <button
              type="button"
              onClick={toggleMute}
              disabled={!ready}
              aria-pressed={muted}
              aria-label={muted ? "आवाज़ चालू" : "म्यूट"}
            >
              <SoundIcon muted={muted} />
            </button>
          </div>

          <p className="sr-only" aria-live="polite">
            {buffering ? "लोड हो रहा है" : ""}
            {status === "loading" ? "तैयार हो रहा है" : ""}
          </p>
        </section>
      </div>

      <SongSearch
        tracks={lyricTracks}
        currentIndex={Math.max(0, position.index - 1)}
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onPick={jumpTo}
      />

      {status === "unavailable" && (
        <iframe
          className="deck-fallback"
          title={`${place.playlist.title} — YouTube`}
          src={fallbackSrc}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      )}

      <div className="yt-host" ref={hostRef} aria-hidden="true" />
    </>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
      />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg {...ICON} aria-hidden="true">
      <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M21 15v6h-6" />
    </svg>
  );
}

function LiveClock() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLabel(
        now
          .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
          .toLowerCase(),
      );
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return <time className="place-clock">{label || "—"}</time>;
}

function OnlinePill() {
  const [count, setCount] = useState(28);

  useEffect(() => {
    const bump = () => {
      setCount((n) => {
        const next = n + (Math.random() > 0.5 ? 1 : -1);
        return Math.min(42, Math.max(18, next));
      });
    };
    const id = window.setInterval(bump, 12_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="place-online">
      <i aria-hidden="true" />
      on air · {count}
    </span>
  );
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.3.18.42.66.3 1.02zm1.44-3.18c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-.96-.12-1.08-.6-.12-.48.12-.96.6-1.08 4.38-1.32 9.78-.66 13.5 1.62.36.18.6.78.18 1.14zm.12-3.3C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.48-1.02.66-1.56.36z"
      />
    </svg>
  );
}

function YtMusicIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 2.4c5.304 0 9.6 4.296 9.6 9.6 0 5.304-4.296 9.6-9.6 9.6-5.304 0-9.6-4.296-9.6-9.6 0-5.304 4.296-9.6 9.6-9.6zm0 2.88A6.72 6.72 0 0 0 5.28 12 6.72 6.72 0 0 0 12 18.72 6.72 6.72 0 0 0 18.72 12 6.72 6.72 0 0 0 12 5.28zm-2.16 3.36 6.24 3.36-6.24 3.36V8.64z"
      />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

const SALON_DIALOGUES: Record<StationId, { langCode: string; lines: string[] }> = {
  hi: {
    langCode: "hi-IN",
    lines: [
      "भैया, मेरा नंबर कब आएगा?",
      "भैया, बाल और दाढ़ी के कितने पैसे हुए?",
      "भैया, थोड़ा साइड से छोटा कर देना और दाढ़ी सेट कर दो!",
    ],
  },
  bho: {
    langCode: "hi-IN",
    lines: [
      "भैया, हमार नंबर कब आई हो?",
      "भैया, बाल आ दाढ़ी के केतना रूपया भईल?",
      "इहाँ ईमानदारी से बाल कटत बाबू!",
    ],
  },
  hr: {
    langCode: "hi-IN",
    lines: [
      "भाई, मेरा नंबर कद आवैगा?",
      "भाई, बाल अर दाढ़ी के के रपे होगे?",
      "यो कटिंग करदे भाई, फुल झकास स्टाइल बना दे!",
    ],
  },
  pa: {
    langCode: "pa-IN",
    lines: [
      "ਭਾਜੀ, ਮੇਰਾ ਨੰਬਰ ਕਦੋਂ ਆਵੇਗਾ?",
      "ਭਾਜੀ, ਵਾਲ ਤੇ ਦਾੜ੍ਹੀ ਦੇ ਕਿੰਨੇ ਪੈਸੇ ਹੋ ਗਏ?",
      "ਸਟਾਈਲ ਵੀ ਪੰਜਾਬੀ ਹੋਣਾ ਚਾਹੀਦਾ ਭਾਜੀ!",
    ],
  },
  ta: {
    langCode: "ta-IN",
    lines: [
      "அண்ணே, என்னோட நம்பர் எப்போ வரும்?",
      "அண்ணே, முடி தாடி வெட்ட எவ்வளவு ஆச்சு?",
      "கத்தரி சத்தம்... ஸ்டைல் மாஸ் தலைவா!",
    ],
  },
  te: {
    langCode: "te-IN",
    lines: [
      "అన్నా, నా నంబర్ ఎప్పుడు వస్తుంది?",
      "అన్నా, కటింగ్ గడ్డం కి ఎంత అయింది?",
      "కత్తెర స్వాగతం, సూపర్ స్టైల్ చెయ్యండి అన్నా!",
    ],
  },
};

function ExtIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 17L17 7M10 7h7v7"
      />
    </svg>
  );
}

export function BarberExperience({ place }: { place: Place }) {
  const [muted, setMuted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [station, setStationState] = useState<StationId>("hi");
  const [weather, setWeather] = useState<WeatherId>("clear");
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const dialogueCounters = useRef<Record<StationId, number>>({
    hi: 0,
    bho: 0,
    hr: 0,
    pa: 0,
    ta: 0,
    te: 0,
  });

  const speakDialogue = useCallback((stationId: StationId) => {
    const item = SALON_DIALOGUES[stationId] || SALON_DIALOGUES.hi;
    const count = dialogueCounters.current[stationId] ?? 0;
    const text = item.lines[count % item.lines.length];
    dialogueCounters.current[stationId] = count + 1;

    setSpeechBubble(text);
    window.setTimeout(() => {
      setSpeechBubble((current) => (current === text ? null : current));
    }, 4500);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = item.langCode;
        utterance.rate = 0.88; // Conversational human pace
        utterance.pitch = 0.4; // Deep natural male voice pitch (lowered to force masculine tone)

        const voices = window.speechSynthesis.getVoices();
        const langPrefix = item.langCode.split("-")[0];
        const matchingVoices = voices.filter(
          (v) => v.lang.startsWith(item.langCode) || v.lang.startsWith(langPrefix)
        );

        // Filter for realistic male voice
        const maleVoice =
          matchingVoices.find((v) =>
            /male|man|rishabh|hemant|karan|madhav|valluvar|pradeep/i.test(v.name)
          ) ||
          matchingVoices.find((v) => !/female|woman|zira|siri|samantha|victoria|karen/i.test(v.name)) ||
          matchingVoices[0];

        if (maleVoice) utterance.voice = maleVoice;

        window.speechSynthesis.speak(utterance);
      } catch {
        /* ignore speech synthesis errors */
      }
    }
  }, []);

  const setStation = useCallback((nextStation: StationId) => {
    setStationState((prev) => {
      if (prev !== nextStation) {
        playRadioStatic();
      }
      return nextStation;
    });
  }, []);

  const theme = LANG_THEMES[station];
  const themeStyle = useMemo(
    () => ({ ...themeToCssVars(theme), background: theme.ink } as CSSProperties),
    [theme],
  );

  const [lightning, setLightning] = useState(false);

  const handleThunder = useCallback(() => {
    setLightning(true);
    window.setTimeout(() => setLightning(false), 450);
  }, []);

  useRoomTone(place, false);
  useWeatherTone(weather, handleThunder);

  useEffect(() => {
    const timer = window.setTimeout(() => setRevealed(true), 60);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    document.documentElement.lang = theme.htmlLang;
    document.documentElement.style.setProperty("--theme-color", theme.accent);
  }, [theme]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* ignored — some browsers block without gesture chain */
    }
  };

  const ytMusicHref = place.playlist.videos[0]
    ? `https://music.youtube.com/watch?v=${place.playlist.videos[0]}`
    : place.playlist.ytMusicUrl;

  return (
    <main
      className={`place-shell ${revealed ? "is-revealed" : ""} is-alive`}
      data-lang={station}
      data-weather={weather}
      style={themeStyle}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="place-wall"
        key={theme.wallpaper}
        src={theme.wallpaper}
        alt=""
        fetchPriority="high"
        decoding="async"
      />
      <div className="place-scrim" aria-hidden="true" />
      <WeatherLayer weather={weather} flash={lightning} />


      <header className="place-top">
        <LiveClock />
        <div className={`lang-switch ${menuOpen ? "is-open" : ""}`} role="tablist" aria-label="भाषा चुनें" onMouseLeave={() => setMenuOpen(false)}>
          <button
            type="button"
            className="mobile-hamburger-trigger place-pill"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <HamburgerIcon />
            <span>{STATIONS.find(s => s.id === station)?.label}</span>
          </button>
          
          <div className="lang-switch-list">
            {STATIONS.map((entry) => {
              const isActive = station === entry.id;
              return (
                <div key={entry.id} className={`lang-pill-wrapper${isActive ? " is-active" : ""}`}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`place-pill lang-pill${isActive ? " is-active" : ""}`}
                    onClick={() => {
                      setStation(entry.id);
                      setMenuOpen(false);
                    }}
                  >
                    <span>{entry.label}</span>
                  </button>
                  <button
                    type="button"
                    className="lang-speaker-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakDialogue(entry.id);
                    }}
                    title={`${entry.label} सैलून संवाद बोलें`}
                    aria-label={`${entry.label} सैलून संवाद बोलें`}
                  >
                    <SpeakerIcon />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="place-nav">
          <a className="place-pill" href={place.playlist.spotifyUrl} target="_blank" rel="noreferrer">
            <SpotifyIcon />
            <span>Spotify</span>
            <ExtIcon />
          </a>
          <a className="place-pill" href={ytMusicHref} target="_blank" rel="noreferrer">
            <YtMusicIcon />
            <span>YT Music</span>
            <ExtIcon />
          </a>
        </div>
      </header>

      {speechBubble && (
        <div className="salon-speech-toast" role="status">
          <span className="toast-avatar">🗣️</span>
          <p>{speechBubble}</p>
        </div>
      )}

      <OfflineBanner />

      <div className="place-body">
        <h1 className="place-title">{theme.brand}</h1>
        <p className="place-note">{theme.note}</p>
      </div>

      <div />

      <div className="place-foot">
        <PlaceDeck
          key={place.id}
          place={place}
          muted={muted}
          onMutedChange={setMuted}
          station={station}
          onStationChange={setStation}
        />

        <div className="place-extras">
          <div className="weather-switch" role="tablist" aria-label="मौसम">
            {WEATHERS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={weather === entry.id}
                className={`extra-chip weather-chip${weather === entry.id ? " is-active" : ""}`}
                onClick={() => setWeather(entry.id)}
              >
                <span aria-hidden="true">{entry.icon}</span>
                {entry.label}
              </button>
            ))}
          </div>
          <button className="extra-chip fullscreen-chip" type="button" onClick={() => void toggleFullscreen()}>
            <ExpandIcon />
            {fullscreen ? "Exit" : "Fullscreen"}
          </button>
        </div>
      </div>
    </main>
  );
}
