"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { animate, stagger } from "animejs";
import { SCENARIOS } from "@/lib/scenarios";
import { randomScenario, rememberScenario } from "@/lib/game";
import { rupee } from "@/lib/format";
import MatrixText from "../components/MatrixText";
import { IconArrowRight, IconUsers } from "../components/Icons";

type Phase = "idle" | "spinning" | "revealed";

const SPIN_MS = 2600;

export default function Randomizer() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [cursor, setCursor] = useState(0);
  const [result, setResult] = useState<(typeof SCENARIOS)[number] | null>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }, []);

  const spin = useCallback(() => {
    if (phase === "spinning") return;
    const chosen = randomScenario();
    const target = SCENARIOS.findIndex((s) => s.id === chosen.id);

    const settle = () => {
      setCursor(target);
      setResult(chosen);
      setPhase("revealed");
      rememberScenario(chosen.id);
    };

    setPhase("spinning");

    if (reduced.current) {
      settle();
      return;
    }

    // Drive the visible index from a tweened value so the reel decelerates
    // instead of stopping dead - anime's easing does the work here.
    const proxy = { i: 0 };
    const loops = 4;
    animate(proxy, {
      i: loops * SCENARIOS.length + target,
      duration: SPIN_MS,
      ease: "outExpo",
      onUpdate: () => setCursor(Math.round(proxy.i) % SCENARIOS.length),
      onComplete: settle,
    });
  }, [phase]);

  // Reveal animation once the reel lands.
  useEffect(() => {
    if (phase !== "revealed" || reduced.current) return;
    if (cardRef.current) {
      animate(cardRef.current, {
        scale: [1, 1.03, 1],
        duration: 620,
        ease: "outElastic(1, .6)",
      });
    }
    const rows = detailRef.current?.querySelectorAll("[data-reveal]");
    if (rows?.length) {
      animate(rows, {
        opacity: [0, 1],
        translateY: [10, 0],
        delay: stagger(70, { start: 180 }),
        duration: 420,
        ease: "outQuad",
      });
    }
  }, [phase]);

  const shown = result ?? SCENARIOS[cursor];

  return (
    <div className="w-full max-w-lg">
      <div
        ref={cardRef}
        className="overflow-hidden rounded-2xl border border-line-strong bg-ink-900/85 shadow-2xl shadow-ink-950/70 backdrop-blur-md"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-md border border-line-strong bg-ink-800 text-accent">
              <IconUsers className="h-4 w-4" />
            </span>
            <p className="eyebrow">Investor assignment</p>
          </div>
          <span className="tnum text-[11px] text-fg-dim">
            {phase === "revealed" ? "LOCKED" : `1 of ${SCENARIOS.length}`}
          </span>
        </div>

        <div className="px-6 py-8 text-center">
          {phase === "idle" && (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-fg">
                Who are you investing for?
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-fg-muted">
                Every investor needs something different from the market. Draw
                one at random, then research the June-2021 universe on their
                behalf.
              </p>
            </>
          )}

          {phase !== "idle" && (
            <div aria-live="polite">
              <div
                className="min-h-[3.5rem] text-[26px] font-bold tracking-tight sm:text-[32px]"
                style={{
                  color: phase === "revealed" ? shown.accent : undefined,
                }}
              >
                {phase === "revealed" ? (
                  <MatrixText
                    text={shown.name}
                    letterInterval={45}
                    letterAnimationDuration={320}
                  />
                ) : (
                  <span className="text-fg-dim">{shown.name}</span>
                )}
              </div>

              {phase === "revealed" && (
                <div ref={detailRef} className="mt-6 space-y-4">
                  <p
                    data-reveal
                    className="mx-auto max-w-sm text-sm leading-relaxed text-fg-muted opacity-0"
                  >
                    {shown.description}
                  </p>
                  <dl
                    data-reveal
                    className="mx-auto grid max-w-sm grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line opacity-0"
                  >
                    <div className="bg-ink-850 px-4 py-3">
                      <dt className="text-[10px] uppercase tracking-wider text-fg-dim">
                        Capital
                      </dt>
                      <dd className="tnum mt-1 text-[15px] font-semibold text-fg">
                        {rupee(shown.capex)}
                      </dd>
                    </div>
                    <div className="bg-ink-850 px-4 py-3">
                      <dt className="text-[10px] uppercase tracking-wider text-fg-dim">
                        Risk profile
                      </dt>
                      <dd
                        className="mt-1 text-[15px] font-semibold"
                        style={{ color: shown.accent }}
                      >
                        {shown.risk}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-line px-6 py-5">
          {phase === "revealed" ? (
            <div className="flex flex-col gap-2.5">
              <Link
                href={`/screener?scenario=${shown.id}`}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-ink-950 transition-colors duration-200 hover:bg-[#6ba0ff]"
              >
                Research the market
                <IconArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setPhase("idle");
                  setResult(null);
                }}
                className="cursor-pointer rounded-lg py-2 text-xs font-medium text-fg-dim transition-colors duration-200 hover:text-fg"
              >
                Draw a different investor
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={spin}
              disabled={phase === "spinning"}
              className="w-full cursor-pointer rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-ink-950 transition-colors duration-200 hover:bg-[#6ba0ff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {phase === "spinning" ? "Assigning…" : "Assign my investor"}
            </button>
          )}
        </div>
      </div>

      <p className="mx-auto mt-5 w-fit rounded-full border border-line bg-ink-900/85 px-3.5 py-1.5 text-center text-xs text-fg-muted backdrop-blur">
        Step 1 of 4 · Assignment → Research → Build → Score
      </p>
    </div>
  );
}
