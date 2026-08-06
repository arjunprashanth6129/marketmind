import Link from "next/link";
import { PROJECT } from "@/lib/stats";
import { SIMULATOR_LOCKED } from "@/lib/flags";
import { IconGitHub, IconLock, IconLogo } from "./Icons";
import MorphicNav, { type NavItem } from "./MorphicNav";

const NAV: NavItem[] = [
  { href: "/screener", name: "Screener" },
  { href: "/build", name: "Portfolio" },
  { href: "/methodology", name: "Methodology" },
  {
    href: "/simulator",
    name: "Simulator",
    // Only advertise the padlock while the gate is actually on.
    icon: SIMULATOR_LOCKED ? (
      <IconLock className="h-3.5 w-3.5 opacity-60" />
    ) : undefined,
  },
];

/**
 * The single site header, used by every page so the app reads as one product.
 *
 * `context` renders an optional status pill next to the wordmark (e.g. the
 * June-2021 freeze on screener pages). The active section is derived from the
 * route inside MorphicNav, so no page has to declare it.
 */
export default function SiteHeader({ context }: { context?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink-900/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 font-semibold tracking-tight text-fg"
        >
          <span className="grid h-8 w-8 place-items-center rounded-md border border-line-strong bg-ink-800 p-1.5 text-accent transition-colors duration-200 group-hover:border-accent">
            <IconLogo />
          </span>
          <span className="text-[15px]">{PROJECT.name}</span>
        </Link>

        {context && (
          <span className="hidden rounded-full border border-line-strong bg-ink-850 px-2.5 py-1 text-[11px] font-medium text-fg-muted lg:inline-block">
            {context}
          </span>
        )}

        <div className="thin-scroll ml-auto flex min-w-0 items-center gap-2 overflow-x-auto">
          <MorphicNav items={NAV} />
          <a
            href={PROJECT.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View MarketMind source on GitHub"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line text-fg-muted transition-colors duration-200 hover:border-line-strong hover:text-fg"
          >
            <IconGitHub />
          </a>
        </div>
      </div>
    </header>
  );
}
