/**
 * Runs pending migrations as the first step of a deploy.
 *
 * Preview deploys are skipped deliberately. This project has one database, so
 * a preview build running migrations would apply a branch's unreviewed schema
 * change to the live site's data — the branch would look fine and production
 * would quietly be running its schema. Previews read the production schema
 * instead; anything needing a schema change is verified after merge.
 *
 * A failed migration fails the build, which is the point: a deploy should not
 * go out against a schema it does not match.
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dirname = path.dirname(fileURLToPath(import.meta.url))
// Resolve the local binary directly rather than relying on PATH — `node
// scripts/migrate-before-build.mjs` run outside a package-manager script
// context (e.g. a plain `node` invocation) doesn't get node_modules/.bin
// prepended the way `pnpm build` does.
const payloadBin = path.resolve(dirname, '../node_modules/.bin/payload')

if (process.env.VERCEL_ENV === 'preview') {
  console.log('[migrate] Preview build — skipping migrations against the shared database.')
  process.exit(0)
}

if (!process.env.DATABASE_URL) {
  console.log('[migrate] No DATABASE_URL — skipping migrations.')
  process.exit(0)
}

const result = spawnSync(payloadBin, ['migrate'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
})

process.exit(result.status ?? 1)
