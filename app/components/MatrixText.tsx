"use client";

/**
 * Matrix-style text reveal: each character scrambles through binary before
 * settling on its final glyph.
 *
 * Adapted from the kokonutui component. The original drives colour with
 * `motion/react`; this version uses a CSS class transition instead, which
 * avoids pulling an animation runtime into the bundle for what is a two-state
 * colour swap. Reduced-motion users get the finished text immediately.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface LetterState {
  char: string;
  isMatrix: boolean;
  isSpace: boolean;
}

export interface MatrixTextProps {
  text?: string;
  className?: string;
  initialDelay?: number;
  letterAnimationDuration?: number;
  letterInterval?: number;
  /** Fires once every character has settled. */
  onDone?: () => void;
}

export default function MatrixText({
  text = "MarketMind",
  className,
  initialDelay = 200,
  letterAnimationDuration = 400,
  letterInterval = 70,
  onDone,
}: MatrixTextProps) {
  const build = useCallback(
    (scrambled: boolean): LetterState[] =>
      text.split("").map((char) => ({
        char,
        isMatrix: scrambled,
        isSpace: char === " ",
      })),
    [text],
  );

  const [letters, setLetters] = useState<LetterState[]>(() => build(false));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Held in a ref so a caller passing an inline callback doesn't restart the
  // scramble on every render.
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      // Initial state already holds the finished text, so there is nothing to
      // set - just report completion.
      doneRef.current?.();
      return;
    }

    const randomChar = () => (Math.random() > 0.5 ? "1" : "0");
    const track = (fn: () => void, ms: number) => {
      timers.current.push(setTimeout(fn, ms));
    };

    text.split("").forEach((_, i) => {
      const start = initialDelay + i * letterInterval;
      track(() => {
        setLetters((prev) => {
          const next = [...prev];
          if (!next[i].isSpace) {
            next[i] = { ...next[i], char: randomChar(), isMatrix: true };
          }
          return next;
        });
      }, start);
      track(() => {
        setLetters((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], char: text[i], isMatrix: false };
          return next;
        });
      }, start + letterAnimationDuration);
    });

    track(
      () => doneRef.current?.(),
      initialDelay + text.length * letterInterval + letterAnimationDuration,
    );

    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      timers.current = [];
    };
  }, [text, initialDelay, letterInterval, letterAnimationDuration, build]);

  // Group into words so a name never breaks mid-word: each word is its own
  // non-wrapping run, and only the gaps between them are break points.
  const words: { letter: LetterState; index: number }[][] = [];
  {
    let run: { letter: LetterState; index: number }[] = [];
    letters.forEach((letter, index) => {
      if (letter.isSpace) {
        if (run.length) words.push(run);
        run = [];
      } else {
        run.push({ letter, index });
      }
    });
    if (run.length) words.push(run);
  }

  return (
    <span
      aria-label={text}
      role="text"
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-[0.42ch]",
        className,
      )}
    >
      {words.map((word, w) => (
        <span key={w} className="inline-flex whitespace-nowrap">
          {word.map(({ letter, index }) => (
            <span
              key={index}
              aria-hidden="true"
              className={cn(
                "inline-block text-center transition-colors duration-100",
                letter.isMatrix ? "text-pos" : "text-fg",
              )}
              style={{
                // Scrambling glyphs are digits; reserving a little width keeps
                // the line from jittering as characters swap in and out.
                minWidth: "0.6ch",
                fontVariantNumeric: "tabular-nums",
                textShadow: letter.isMatrix
                  ? "0 0 12px rgba(47,191,113,0.55)"
                  : "none",
              }}
            >
              {letter.char}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
