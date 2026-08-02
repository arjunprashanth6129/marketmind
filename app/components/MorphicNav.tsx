"use client";

/**
 * Morphing segmented nav: the items sit flush as one bar, and the active item
 * detaches into its own pill.
 *
 * Adapted from the supplied component with one behavioural fix - the original
 * tracked the active item in local `useState`, so it never followed real
 * navigation. This reads `usePathname()`, which means the highlight is always
 * correct on load, on back/forward, and on deep links.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  name: string;
  icon?: React.ReactNode;
}

export default function MorphicNav({
  items,
  className,
}: {
  items: NavItem[];
  className?: string;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className={cn("flex items-center", className)} aria-label="Primary">
      <div className="flex items-center overflow-hidden rounded-lg border border-line bg-ink-850 p-0.5">
        {items.map((item, i) => {
          const active = isActive(item.href);
          const prevActive = i > 0 && isActive(items[i - 1].href);
          const nextActive =
            i < items.length - 1 && isActive(items[i + 1].href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-[13px] font-medium",
                "transition-[background-color,color,border-radius,margin] duration-300",
                active
                  ? "mx-0.5 rounded-md bg-ink-700 text-fg shadow-sm"
                  : cn(
                      "text-fg-muted hover:bg-ink-800 hover:text-fg",
                      // Square up the edges that touch a neighbour, round the
                      // ones that sit at an end or next to the active pill.
                      (prevActive || i === 0) && "rounded-l-md",
                      (nextActive || i === items.length - 1) && "rounded-r-md",
                    ),
              )}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
