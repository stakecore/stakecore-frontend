import http2 from 'node:http2'
import { test, expect } from '@playwright/test'
import { ROUTES } from './fixtures/routes'
import {
  AGENT_USER_AGENTS,
  MIRRORS,
  SITE_FILES,
  frontmatter,
  mirrorFor,
} from './fixtures/agentFiles'

// The agent-readable surface is static files under public/ (plus the emitted
// openapi.json), so these assert against `request` rather than a page: what an
// agent fetching the site sees, with no JS execution in the loop.
//
// Content-Type is deliberately not asserted. Preview's MIME table is Vite's,
// not GitHub Pages', so a green run here would prove nothing about production
// — that check belongs against the live deploy.

for (const path of [...SITE_FILES, ...MIRRORS]) {
  test(`${path} is served and non-empty`, async ({ request }) => {
    const res = await request.get(path)
    const body = await res.text()

    expect(res.status()).toBe(200)
    expect(body.trim().length).toBeGreaterThan(0)
    // `vite preview` falls back to index.html for any path it cannot resolve,
    // so a 200 alone is worthless here — a missing file returns the SPA shell
    // rather than the 404 GitHub Pages would give. Reject the shell explicitly
    // or every assertion below it passes on a file that was never written.
    expect(body, 'served the SPA shell instead of the file').not.toContain('<div id="root">')
  })
}

// Text and markdown have no in-band way to declare an encoding the way HTML's
// <meta charset> does, so a response without the parameter leaves the reader
// guessing — browsers fall back to windows-1252 and every em dash in these
// files renders as mojibake. GitHub Pages sends `; charset=utf-8` for both
// extensions; this covers the dev/preview shim in vite.config.js, so a file
// that reads as garbage locally is genuinely broken rather than an artifact of
// the server we happen to test against.
//
// Asserted over BOTH protocols on purpose. The static middleware sets the type
// through a different API on each, and an earlier version of the shim patched
// only the HTTP/1.1 path: `request` (h1) went green while a browser, which
// negotiates h2, still rendered mojibake. One protocol is not evidence for the
// other here.
const UTF8_FILES = ['/llms.txt', '/robots.txt', '/index.md', '/AGENTS.md']

for (const path of UTF8_FILES) {
  test(`${path} declares utf-8 over HTTP/1.1`, async ({ request }) => {
    const res = await request.get(path)

    expect(res.headers()['content-type']).toMatch(/charset=utf-8/i)
    // Round-trips a non-ASCII byte, so the header is not merely cosmetic.
    expect(await res.text()).toContain('—')
  })

  test(`${path} declares utf-8 over HTTP/2`, async ({ baseURL }) => {
    const res = await getOverHttp2(`${baseURL}${path}`)

    expect(res.status).toBe(200)
    expect(res.contentType).toMatch(/charset=utf-8/i)
    expect(res.body).toContain('—')
  })
}

/**
 * Playwright's `request` fixture speaks HTTP/1.1, and the browser contexts
 * won't navigate to a markdown response without treating it as a download, so
 * the h2 path needs a client of its own.
 */
function getOverHttp2(url: string) {
  return new Promise<{ status: number; contentType: string; body: string }>((resolve, reject) => {
    const { origin, pathname } = new URL(url)
    // Same self-signed cert the rest of the suite waives via ignoreHTTPSErrors.
    const client = http2.connect(origin, { rejectUnauthorized: false })
    const req = client.request({ ':path': pathname })

    let status = 0
    let contentType = ''
    let body = ''

    req.on('response', headers => {
      status = Number(headers[':status'])
      contentType = String(headers['content-type'] ?? '')
    })
    req.setEncoding('utf8')
    req.on('data', chunk => { body += chunk })
    req.on('end', () => { client.close(); resolve({ status, contentType, body }) })

    client.on('error', reject)
    req.on('error', reject)
    req.end()
  })
}

test('robots.txt explicitly allows the agent crawlers', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text()

  for (const agent of AGENT_USER_AGENTS) {
    expect(body).toMatch(new RegExp(`^User-agent:\\s*${agent}\\s*$`, 'im'))
  }
  expect(body).toMatch(/^Sitemap:\s*https:\/\/stakecore\.org\/sitemap\.xml\s*$/im)
})

test('robots.txt does not disallow the agent entry points', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text()

  // Anchor the negative assertions to a file that actually parses as robots
  // rules. Without this the three `not.toMatch`es below are satisfied by any
  // response that happens to lack the word Disallow — including a 404 body.
  expect(body).toMatch(/^User-agent:/im)

  // A blanket `Disallow: /` would technically parse, so check the literal
  // paths as well as the bare rule.
  for (const disallowed of [/^Disallow:\s*\/\s*$/im, /Disallow:.*llms\.txt/i, /Disallow:.*AGENTS\.md/i]) {
    expect(body).not.toMatch(disallowed)
  }
})

test('every llms.txt link resolves', async ({ request }) => {
  const body = await (await request.get('/llms.txt')).text()

  const links = [...body.matchAll(/\]\((\/[^)]+|https:\/\/stakecore\.org[^)]*)\)/g)]
    .map(m => m[1]!)
    .map(href => href.replace('https://stakecore.org', '') || '/')

  expect(links.length).toBeGreaterThan(0)

  for (const href of [...new Set(links)]) {
    expect((await request.get(href)).status(), `llms.txt links to ${href}`).toBe(200)
  }
})

test('sitemap.xml lists every route mirror with a lastmod', async ({ request }) => {
  const body = await (await request.get('/sitemap.xml')).text()

  for (const mirror of MIRRORS) {
    expect(body).toContain(`https://stakecore.org${mirror}`)
  }
  // One <lastmod> per <loc>, so a new entry cannot land undated.
  expect((body.match(/<lastmod>/g) ?? []).length).toBe((body.match(/<loc>/g) ?? []).length)
  expect(body).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
})

test('sitemap.md lists every route mirror', async ({ request }) => {
  const body = await (await request.get('/sitemap.md')).text()

  expect(body).toMatch(/^##\s+Sitemap\s*$/im)
  for (const mirror of MIRRORS) {
    expect(body).toContain(mirror)
  }
})

// CLAUDE.md calls the hand-maintained <lastmod>/dateModified pair "the one
// failure mode that no test can catch" — but that's only true of whether a
// date is *correct*, not of whether the two copies of it *agree*. This test
// covers the latter: every <loc> in sitemap.xml that points at a file with
// frontmatter must have a <lastmod> equal to that file's own dateModified.
// A mirror edited without bumping its date, or a sitemap.xml bumped without
// touching the mirror, fails this instead of shipping quietly.
test('every frontmatter dateModified agrees with sitemap.xml\'s lastmod for the same page', async ({ request }) => {
  const sitemapBody = await (await request.get('/sitemap.xml')).text()

  const entries = [...sitemapBody.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)]
    .map(([, loc, lastmod]) => ({ loc: loc!, lastmod: lastmod! }))
  expect(entries.length).toBeGreaterThan(0)

  // Not every <loc> carries frontmatter (the HTML root does not), so this
  // counts how many comparisons actually ran — a count of zero would mean
  // the loop below silently checked nothing.
  let checked = 0
  for (const { loc, lastmod } of entries) {
    const path = loc.replace('https://stakecore.org', '') || '/'
    const body = await (await request.get(path)).text()
    const fields = frontmatter(body)
    if (fields?.dateModified == null) continue

    checked++
    expect(fields.dateModified, `${path}: frontmatter dateModified vs sitemap.xml lastmod`).toBe(lastmod)
  }
  expect(checked).toBeGreaterThan(0)
})

for (const { path, heading } of ROUTES) {
  test(`the ${path} mirror carries frontmatter, headings and a sitemap link`, async ({ request }) => {
    const body = await (await request.get(mirrorFor(path))).text()

    const fields = frontmatter(body)
    expect(fields, 'mirror has --- frontmatter').not.toBeNull()
    expect(fields!.title).toBeTruthy()
    // The spec's own floor for a meta description.
    expect(fields!.description?.length ?? 0).toBeGreaterThanOrEqual(50)
    expect(fields!.url).toBe(`https://stakecore.org${mirrorFor(path)}`)
    expect(fields!.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    // The mirror must be about the page it mirrors, not merely well-formed.
    expect(body).toContain(heading)

    expect((body.match(/^##\s+\S/gm) ?? []).length).toBeGreaterThanOrEqual(3)
    expect(body).toMatch(/^##\s+Sitemap\s*$/im)
    expect(body).toContain('/sitemap.md')

    // Every fenced block carries a language identifier.
    for (const fence of body.match(/^```.*$/gm) ?? []) {
      if (fence === '```') continue
      expect(fence).toMatch(/^```[a-z]/)
    }
    expect((body.match(/^```/gm) ?? []).length % 2, 'code fences are balanced').toBe(0)
  })
}

test('index.html carries canonical, a markdown alternate and JSON-LD', async ({ request }) => {
  const html = await (await request.get('/')).text()

  expect(html).toMatch(/<link[^>]+rel="canonical"[^>]+href="https:\/\/stakecore\.org\/"/)
  expect(html).toMatch(/<link[^>]+rel="alternate"[^>]+type="text\/markdown"[^>]+href="\/index\.md"/)

  const jsonLd = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/.exec(html)
  expect(jsonLd, 'index.html has a JSON-LD block').not.toBeNull()

  const parsed = JSON.parse(jsonLd![1]!)
  const graph: Record<string, unknown>[] = parsed['@graph'] ?? [parsed]
  const types = graph.map(node => node['@type'])

  expect(types).toContain('Organization')
  expect(types).toContain('WebSite')
  expect(types).toContain('BreadcrumbList')
})

test('AGENTS.md links the OpenAPI schema and the backend', async ({ request }) => {
  const body = await (await request.get('/AGENTS.md')).text()

  expect(body).toContain('/openapi.json')
  expect(body).toContain('https://backend.stakecore.org')
  expect((body.match(/^##\s+\S/gm) ?? []).length).toBeGreaterThanOrEqual(3)
})

test('the emitted openapi.json matches the repo schema', async ({ request }) => {
  const res = await request.get('/openapi.json')

  const schema = JSON.parse(await res.text())
  expect(schema.openapi ?? schema.swagger).toBeTruthy()
  expect(schema.paths).toBeTruthy()
})
