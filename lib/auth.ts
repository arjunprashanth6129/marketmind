// Server-only auth helpers for the host-gated simulator.
//
// The session cookie stores a SHA-256 token derived from the password, never
// the password itself, so the secret can't be read out of the browser. All
// comparisons go through timingSafeEqual (over fixed-length digests) to avoid
// leaking information through string-comparison timing.

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SIMULATOR_LOCKED } from "./flags";

export const SESSION_COOKIE = "sim_session";

const digest = (s: string) => createHash("sha256").update(s).digest();

// Cookie value: a hash bound to this app + the configured password. Changing
// the password invalidates every existing session.
export function sessionToken(password: string): string {
  return createHash("sha256")
    .update(`marketmind.sim.v1:${password}`)
    .digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

export async function isAuthed(): Promise<boolean> {
  // Gate temporarily lifted (see lib/flags.ts). Short-circuiting here covers
  // every caller at once - the page and the runSimulation server action - so
  // there is no path that stays half-locked.
  if (!SIMULATOR_LOCKED) return true;

  const pw = process.env.SIMULATOR_PASSWORD;
  if (!pw) return false;
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;
  if (!cookie) return false;
  return safeEqual(cookie, sessionToken(pw));
}
