import { ROUTES } from './routes'

// The markdown mirror of a route. `/` mirrors to /index.md; every other route
// appends `.md` to its own path. Derived rather than maintained as a second
// list, so adding a route to ROUTES cannot leave a mirror silently missing.
export const mirrorFor = (path: string) => (path === '/' ? '/index.md' : `${path}.md`)

export const MIRRORS = ROUTES.map(r => mirrorFor(r.path))

// Site-level files the Agent Readability Spec expects at the domain root.
// openapi.json is emitted from the repo-root schema by vite.config.js rather
// than living in public/, so AGENTS.md can link a schema that cannot drift
// from the one `pnpm openapi-gen` reads.
export const SITE_FILES = [
  '/robots.txt',
  '/llms.txt',
  '/sitemap.xml',
  '/sitemap.md',
  '/AGENTS.md',
  '/glossary.md',
  '/openapi.json',
]

// The crawlers the spec requires an explicit allow for. Omitting a robots.txt
// entirely would also leave them unblocked, but the spec asks for the positive
// statement — silence and consent are not the same signal.
export const AGENT_USER_AGENTS = ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended']

/** Split `---`-delimited YAML-ish frontmatter off the top of a markdown file. */
export const frontmatter = (body: string): Record<string, string> | null => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(body)
  if (match?.[1] == null) return null
  const fields: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line)
    if (kv?.[1] != null && kv[2] != null) fields[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '')
  }
  return fields
}
