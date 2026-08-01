import Link from "next/link";
import { PROJECT } from "@/lib/stats";
import { IconGitHub } from "./Icons";

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-fg-dim">
          Data frozen at June 2021 · backtested to June 2026 · fixed,
          reproducible dataset.
        </p>
        <div className="flex items-center gap-5">
          <Link
            href="/methodology"
            className="text-fg-muted transition-colors duration-200 hover:text-fg"
          >
            Methodology
          </Link>
          <Link
            href="/screener"
            className="text-fg-muted transition-colors duration-200 hover:text-fg"
          >
            Screener
          </Link>
          <a
            href={PROJECT.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-fg-muted transition-colors duration-200 hover:text-fg"
          >
            <IconGitHub className="h-3.5 w-3.5" />
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
