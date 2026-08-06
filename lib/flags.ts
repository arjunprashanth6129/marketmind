// Temporary feature switches.
//
// Kept in their own module (no node-only imports) so both server and client
// components can read them safely.

/**
 * Host password gate on /simulator.
 *
 * TEMPORARILY DISABLED so the simulator can be demoed without the password.
 * Set back to `true` to restore it - that single change re-locks the page, the
 * `runSimulation` server action, and the lock affordances in both headers. No
 * auth code was removed: lib/auth.ts, LoginGate and the login/logout routes are
 * all still in place and wired up.
 */
export const SIMULATOR_LOCKED = false;
