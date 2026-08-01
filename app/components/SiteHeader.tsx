import Link from "next/link";
import { PROJECT } from "@/lib/stats";
import { IconGitHub, IconLock, IconLogo } from "./Icons";

const NAV = [
  { href: "/screener", label: "Screener" },
  { href: "/methodology", label: "Methodology" },
] as const;

/**
 * The single site header, used by every page so the app reads as one product.
 *
 * `context` renders an optional status pill next to the wordmark (e.g. the
 * June-2021 freeze on screener pages), and `active` underlines the current
 * section.
 */
export default function SiteHeader({
  active,
  context,
}: {
  active?: "screener" | "methodology" | "simulator";
  context?: string;
}) {
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
          <span className="hidden rounded-full border border-line-strong bg-ink-850 px-2.5 py-1 text-[11px] font-medium text-fg-muted sm:inline-block">
            {context}
          </span>
        )}

        {/* Nav scrolls horizontally on narrow screens rather than forcing the
            page itself to scroll. */}
        <nav className="thin-scroll ml-auto flex min-w-0 items-center gap-0.5 overflow-x-auto text-sm">
          {NAV.map((item) => {
            const isActive = active === item.label.toLowerCase();
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 font-medium transition-colors duration-200 sm:px-3 ${
                  isActive
                    ? "bg-ink-800 text-fg"
                    : "text-fg-muted hover:bg-ink-850 hover:text-fg"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/simulator"
            aria-current={active === "simulator" ? "page" : undefined}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 font-medium transition-colors duration-200 sm:px-3 ${
              active === "simulator"
                ? "bg-ink-800 text-fg"
                : "text-fg-muted hover:bg-ink-850 hover:text-fg"
            }`}
          >
            Simulator
            <IconLock className="h-3.5 w-3.5 text-fg-dim" />
          </Link>

          <a
            href={PROJECT.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View MarketMind source on GitHub"
            className="ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line text-fg-muted transition-colors duration-200 hover:border-line-strong hover:text-fg"
          >
            <IconGitHub />
          </a>
        </nav>
      </div>
    </header>
  );
}
