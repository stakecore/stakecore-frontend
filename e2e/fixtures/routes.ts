// Every route in src/route/router.tsx. Headings and titles are literal per
// route — read from each page component and from the route handles, not
// inferred — so a wrong page rendering under the right URL still fails.
// Shared by routes.spec.ts and a11y.spec.ts, which each assert the heading at
// level 1.
//
// `title` is the document title, which is a hash router's one genuinely hard
// a11y problem: the server returns index.html for every fragment, so without
// the handle in router.tsx every route ships <title>StakeCore</title> and a
// screen-reader user gets no signal that navigation happened at all
// (WCAG 2.4.2 Page Titled, level A).
export const ROUTES = [
  { path: '/', heading: 'StakeCore', title: 'StakeCore' },
  { path: '/about', heading: 'Your stake, our engine', title: 'About — StakeCore' },
  { path: '/news', heading: "What's new", title: 'News — StakeCore' },
  { path: '/contact', heading: 'Get in touch', title: 'Contact — StakeCore' },
  { path: '/flare/fsp', heading: 'Flare Systems Protocol', title: 'Flare Systems Protocol — StakeCore' },
  { path: '/songbird/fsp', heading: 'Songbird Systems Protocol', title: 'Songbird Systems Protocol — StakeCore' },
  { path: '/flare/validator', heading: 'Flare Validator', title: 'Flare Validator — StakeCore' },
  { path: '/avalanche/validator', heading: 'Avalanche Validator', title: 'Avalanche Validator — StakeCore' },
]

// Not a real route — used by both specs to exercise the 404 fallback.
export const NOT_FOUND_PATH = '/#/no-such-page'
export const NOT_FOUND_TITLE = 'Page not found — StakeCore'
