"use client";

/**
 * Letter-glitch canvas background.
 *
 * Adapted from the React Bits component (reactbits.dev) - ported to TypeScript,
 * retinted to the MarketMind palette, and taught to respect reduced-motion by
 * painting a single static frame instead of animating.
 */

import { useEffect, useRef } from "react";

interface Letter {
  char: string;
  color: string;
  targetColor: string;
  colorProgress: number;
}

export interface LetterGlitchProps {
  glitchColors?: string[];
  className?: string;
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  characters?: string;
}

// Ticker-ish glyphs rather than the stock alphabet soup: this sits behind a
// market screen, so it should read as symbols and prices.
const DEFAULT_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789₹%+-.<>/[]{}|=$";

const FONT_SIZE = 16;
const CHAR_W = 10;
const CHAR_H = 20;

export default function LetterGlitch({
  glitchColors = ["#1b2f57", "#2fbf71", "#4d8dff"],
  className = "",
  glitchSpeed = 50,
  centerVignette = false,
  outerVignette = true,
  smooth = true,
  characters = DEFAULT_CHARS,
}: LetterGlitchProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const letters = useRef<Letter[]>([]);
  const grid = useRef({ columns: 0, rows: 0 });
  const context = useRef<CanvasRenderingContext2D | null>(null);
  // Seeded inside the effect - reading the clock during render is impure and
  // would differ between the server and client passes.
  const lastGlitch = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    context.current = canvas.getContext("2d");

    const glyphs = Array.from(characters);
    const randomChar = () => glyphs[Math.floor(Math.random() * glyphs.length)];
    const randomColor = () =>
      glitchColors[Math.floor(Math.random() * glitchColors.length)];

    const hexToRgb = (hex: string) => {
      const expanded = hex.replace(
        /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        (_, r, g, b) => r + r + g + g + b + b,
      );
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(expanded);
      return m
        ? {
            r: parseInt(m[1], 16),
            g: parseInt(m[2], 16),
            b: parseInt(m[3], 16),
          }
        : null;
    };

    const lerp = (
      a: { r: number; g: number; b: number },
      b: { r: number; g: number; b: number },
      t: number,
    ) =>
      `rgb(${Math.round(a.r + (b.r - a.r) * t)}, ${Math.round(
        a.g + (b.g - a.g) * t,
      )}, ${Math.round(a.b + (b.b - a.b) * t)})`;

    const initLetters = (columns: number, rows: number) => {
      grid.current = { columns, rows };
      letters.current = Array.from({ length: columns * rows }, () => ({
        char: randomChar(),
        color: randomColor(),
        targetColor: randomColor(),
        colorProgress: 1,
      }));
    };

    const draw = () => {
      const ctx = context.current;
      if (!ctx || !canvasRef.current || letters.current.length === 0) return;
      const { width, height } = canvasRef.current.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      ctx.font = `${FONT_SIZE}px ui-monospace, monospace`;
      ctx.textBaseline = "top";
      letters.current.forEach((letter, i) => {
        const x = (i % grid.current.columns) * CHAR_W;
        const y = Math.floor(i / grid.current.columns) * CHAR_H;
        ctx.fillStyle = letter.color;
        ctx.fillText(letter.char, x, y);
      });
    };

    const resize = () => {
      const c = canvasRef.current;
      const parent = c?.parentElement;
      if (!c || !parent) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      c.width = rect.width * dpr;
      c.height = rect.height * dpr;
      c.style.width = `${rect.width}px`;
      c.style.height = `${rect.height}px`;
      context.current?.setTransform(dpr, 0, 0, dpr, 0, 0);
      initLetters(
        Math.ceil(rect.width / CHAR_W),
        Math.ceil(rect.height / CHAR_H),
      );
      draw();
    };

    const update = () => {
      const count = Math.max(1, Math.floor(letters.current.length * 0.05));
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * letters.current.length);
        const letter = letters.current[idx];
        if (!letter) continue;
        letter.char = randomChar();
        letter.targetColor = randomColor();
        if (smooth) {
          letter.colorProgress = 0;
        } else {
          letter.color = letter.targetColor;
          letter.colorProgress = 1;
        }
      }
    };

    const smoothStep = () => {
      let redraw = false;
      letters.current.forEach((letter) => {
        if (letter.colorProgress >= 1) return;
        letter.colorProgress = Math.min(1, letter.colorProgress + 0.05);
        const from = hexToRgb(letter.color);
        const to = hexToRgb(letter.targetColor);
        if (from && to) {
          letter.color = lerp(from, to, letter.colorProgress);
          redraw = true;
        }
      });
      if (redraw) draw();
    };

    const tick = () => {
      const now = Date.now();
      if (now - lastGlitch.current >= glitchSpeed) {
        update();
        draw();
        lastGlitch.current = now;
      }
      if (smooth) smoothStep();
      animationRef.current = requestAnimationFrame(tick);
    };

    // A full-screen character storm is exactly the sort of motion that
    // triggers vestibular discomfort, so honour the OS preference with a
    // single static frame.
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    lastGlitch.current = Date.now();
    resize();
    if (!reduced) tick();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        resize();
        if (!reduced) tick();
      }, 100);
    };
    window.addEventListener("resize", onResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [glitchSpeed, smooth, characters, glitchColors]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-ink-950 ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      {outerVignette && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle, rgba(8,11,18,0) 55%, rgba(8,11,18,1) 100%)",
          }}
        />
      )}
      {centerVignette && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle, rgba(8,11,18,0.88) 0%, rgba(8,11,18,0) 62%)",
          }}
        />
      )}
    </div>
  );
}
