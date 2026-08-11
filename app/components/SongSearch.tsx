"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { BarberTrack } from "../barber-tracks";
import { searchSongs } from "../song-search";

type Props = {
  tracks: BarberTrack[];
  currentIndex: number;
  open: boolean;
  onClose: () => void;
  onPick: (index: number) => void;
};

export function SongSearch({ tracks, currentIndex, open, onClose, onPick }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const hits = useMemo(() => searchSongs(tracks, query), [tracks, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const pick = (index: number) => {
    onPick(index);
    onClose();
  };

  return (
    <div className="song-search" role="dialog" aria-modal="true" aria-label="गाना खोजें">
      <button className="song-search-scrim" type="button" aria-label="खोज बंद करें" onClick={onClose} />
      <div className="song-search-panel">
        <label className="song-search-label" htmlFor={listId}>
          गाना खोजें
        </label>
        <input
          id={listId}
          ref={inputRef}
          className="song-search-input"
          type="search"
          value={query}
          placeholder="नाम लिखें — हिंदी या अंग्रेज़ी…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (event.key === "Enter" && hits[active]) {
              event.preventDefault();
              pick(hits[active].index);
            }
          }}
        />
        <ul className="song-search-list" role="listbox" aria-label="नतीजे">
          {hits.length === 0 ? (
            <li className="song-search-empty">कोई गाना नहीं मिला</li>
          ) : (
            hits.map((hit, i) => {
              const selected = i === active;
              const playing = hit.index === currentIndex;
              return (
                <li key={`${hit.track.id}-${hit.index}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`song-search-hit${selected ? " is-active" : ""}${playing ? " is-playing" : ""}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(hit.index)}
                  >
                    <span className="song-search-num">{hit.index + 1}</span>
                    <span className="song-search-title">{hit.track.title}</span>
                    {playing ? <span className="song-search-now">चल रहा</span> : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <p className="song-search-hint">↑↓ चुनें · Enter चलाएँ · Esc बंद</p>
      </div>
    </div>
  );
}
