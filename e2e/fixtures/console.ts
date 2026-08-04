import { test as base } from '@playwright/test'

// Console output that is environmental, not a product defect. Keep this list
// short and justified — every entry is coverage deliberately given up.
const IGNORED = [
  // The preview server's self-signed cert. Expected; we set ignoreHTTPSErrors.
  /ERR_CERT_AUTHORITY_INVALID/,
  // The YouTube iframe (movieClip.tsx) intermittently emits this permissions-
  // policy warning itself; it's YouTube's player code reacting to a policy we
  // don't control, not a defect in our pages.
  /compute-pressure/,
]

type ConsoleFixtures = {
  /**
   * Console errors and uncaught page exceptions collected for the whole test,
   * minus the IGNORED noise. Assert `toEqual([])` after the page has settled —
   * the array keeps filling until the test ends, so asserting too early passes
   * on errors that have not been logged yet.
   */
  consoleErrors: string[]
}

export const test = base.extend<ConsoleFixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = []

    // Attached before the test body runs — and therefore before any goto —
    // because this fixture resolves during setup.
    page.on('console', msg => {
      if (msg.type() !== 'error') return
      const text = msg.text()
      if (IGNORED.some(re => re.test(text))) return
      errors.push(text)
    })
    page.on('pageerror', err => errors.push(`pageerror: ${err.message}`))

    await use(errors)
  },
})

export { expect } from '@playwright/test'
