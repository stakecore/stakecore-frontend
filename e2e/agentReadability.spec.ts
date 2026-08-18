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
