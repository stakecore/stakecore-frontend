// Every route in src/route/router.tsx. Headings are literal per route — read
// from each page component, not inferred — so a wrong page rendering under the
// right URL still fails. Shared by routes.spec.ts and a11y.spec.ts, which each
// assert the heading at level 1.
export const ROUTES = [
  { path: '/', heading: 'StakeCore' },
  { path: '/about', heading: 'Your stake, our engine' },
  { path: '/news', heading: "What's new" },
  { path: '/contact', heading: 'Get in touch' },
  { path: '/flare/fsp', heading: 'Flare Systems Protocol' },
  { path: '/songbird/fsp', heading: 'Songbird Systems Protocol' },
  { path: '/flare/validator', heading: 'Flare Validator' },
  { path: '/avalanche/validator', heading: 'Avalanche Validator' },
]

// Not a real route — used by both specs to exercise the 404 fallback.
export const NOT_FOUND_PATH = '/#/no-such-page'
