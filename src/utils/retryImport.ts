// Retrying a dynamic import is not as simple as calling the factory again.
//
// The HTML spec has the module map record a *failed* fetch against its URL,
// and every later import of that same URL replays the recorded failure
// without touching the network. Measured in Chromium against this app's own
// build: three imports of a chunk whose first fetch returned 503 produced
// exactly **one** request, and the second and third rejected instantly. An
// import of the same file with a query string appended succeeded.
//
// So a retry has to ask for a URL the module map has never seen. The bundler
// owns the hashed filename, which leaves the URL the engine puts in its own
// error message as the only handle on it — hence the parsing below. Where the
// engine names no URL (Safari says only "Importing a module script failed.")
// there is nothing to bust and the retry is skipped rather than spun
// pointlessly; the caller's error boundary handles it from there.
//
// Reaching for this at all is worth it because the failure it targets is
// transient: stakecore.org is on GitHub Pages, which has served a 503 for a
// chunk that was present the whole time (the file returned 200 minutes later,
// from the same deploy).

/** Chromium, Firefox, and Vite's own preload helper each name the URL. */
const MODULE_URL = /\b(?:https?:)\/\/[^\s'"]+?\.[mc]?js(?:\?[^\s'"]*)?/

const CHUNK_FAILURE = /dynamically imported module|Importing a module script failed|unable to preload/i

/**
 * The URL of the chunk a failed dynamic import was reaching for, when the
 * engine put one in the message. `undefined` means "not a recoverable chunk
 * fetch failure" — either a different engine's wording, or an error thrown by
 * the module's own body, which no amount of re-fetching will fix.
 */
export const moduleUrlFrom = (error: unknown): string | undefined => {
  if (error == null) return undefined
  const message = error instanceof Error ? error.message : String(error)
  if (!CHUNK_FAILURE.test(message)) return undefined
  return MODULE_URL.exec(message)?.[0]
}

export interface RetryImportOptions {
  /** Cache-busted attempts made *after* the initial import. */
  attempts?: number
  /** Backoff before attempt `n` (1-based). */
  delayMs?: (n: number) => number
  importer?: (url: string) => Promise<unknown>
  sleep?: (ms: number) => Promise<void>
}

// Monotonic across the document, so two retries of the same chunk — whether
// from the automatic pass or a later manual one — can never collide on a URL
// the module map has already poisoned.
let bust = 0

const cacheBust = (url: string) => `${url}${url.includes('?') ? '&' : '?'}__retry=${++bust}`

const defaultImporter = (url: string) => import(/* @vite-ignore */ url)

/**
 * Runs `factory`, and on a chunk *fetch* failure re-imports the same chunk
 * through cache-busted URLs. Resolves with whichever attempt lands.
 *
 * The error thrown when every attempt fails is the **original** one: it names
 * the real URL, while the retries' errors name a `__retry=` URL that exists
 * nowhere in the build and would send anyone reading a log to look for a file
 * that was never deployed.
 */
export async function retryImport<T>(
  factory: () => Promise<T>,
  options: RetryImportOptions = {},
): Promise<T> {
  const {
    attempts = 2,
    delayMs = n => 250 * 2 ** (n - 1),
    importer = defaultImporter,
    sleep = ms => new Promise<void>(resolve => { setTimeout(resolve, ms) }),
  } = options

  try {
    return await factory()
  } catch (error) {
    const url = moduleUrlFrom(error)
    if (url == null) throw error

    for (let n = 1; n <= attempts; n++) {
      await sleep(delayMs(n))
      try {
        return await importer(cacheBust(url)) as T
      } catch {
        // Keep going; the original error is what finally surfaces.
      }
    }
    throw error
  }
}
