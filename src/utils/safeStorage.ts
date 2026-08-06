// Web Storage is not merely unreliable — it can *throw*. Chrome with cookies
// fully blocked raises SecurityError on property access to `sessionStorage`
// itself, before any method is called; Safari's private mode and a full quota
// throw from setItem. Unguarded, a single storage read takes down whatever
// code path touched it, which for route loading means the user can't open the
// page at all.
//
// The storage object is fetched through a thunk *inside* each try block rather
// than captured once at module scope, for two reasons: the property access is
// itself a throwing operation that needs covering, and resolving it at import
// time would move the failure into module evaluation — the exact
// blank-page-before-React failure this file exists to prevent.

export interface SafeStorage {
  /** The stored value, or null if absent *or* unreadable. */
  get(key: string): string | null
  /**
   * Writes the value. Returns whether it actually persisted — callers that
   * are recording a decision they'll need to read back (a retry flag, a
   * dismissal) must branch on this rather than assume it stuck.
   */
  set(key: string, value: string): boolean
  /** Best-effort delete; a failure leaves the old value and is not reported. */
  remove(key: string): void
}

const makeSafe = (pick: () => Storage): SafeStorage => ({
  get(key) {
    try {
      return pick().getItem(key)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      pick().setItem(key, value)
      return true
    } catch {
      return false
    }
  },
  remove(key) {
    try {
      pick().removeItem(key)
    } catch {
      /* nothing to undo — the value was never readable either */
    }
  },
})

export const safeSession = makeSafe(() => sessionStorage)
export const safeLocal = makeSafe(() => localStorage)
