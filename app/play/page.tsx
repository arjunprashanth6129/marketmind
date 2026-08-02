import Link from "next/link";
import LetterGlitch from "../components/LetterGlitch";
import Randomizer from "./Randomizer";
import { IconLogo } from "../components/Icons";
import { PROJECT } from "@/lib/stats";

export const metadata = {
  title: "Get your investor",
  description:
    "Draw a random investor scenario, then research the June-2021 NSE universe on their behalf.",
};

export default function PlayPage() {
  return (
    <div className="relative min-h-screen">
      {/* Animated character field, purely decorative and reduced-motion aware.
          Held at partial opacity and under a heavy centre vignette so it stays
          atmosphere rather than competing with the card on top of it. */}
      <div className="fixed inset-0 z-0 opacity-[0.45]">
        <LetterGlitch glitchSpeed={58} outerVignette centerVignette smooth />
      </div>
      <div
        aria-hidden
        className="fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(48rem 34rem at 50% 50%, rgba(11,15,24,0.94) 0%, rgba(11,15,24,0.72) 45%, rgba(11,15,24,0) 75%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="px-5 py-5">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 font-semibold tracking-tight text-fg"
          >
            <span className="grid h-8 w-8 place-items-center rounded-md border border-line-strong bg-ink-800/80 p-1.5 text-accent backdrop-blur transition-colors duration-200 group-hover:border-accent">
              <IconLogo />
            </span>
            <span className="text-[15px]">{PROJECT.name}</span>
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-10">
          <Randomizer />
        </main>
      </div>
    </div>
  );
}
