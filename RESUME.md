# tbr-cms-demo — where this left off (Aug 21, 2026)

> **Project-wide plan: `~/Development/tbr-plan/PLAN.md`** — schedule, migration
> runbook, design method, risks, and where everything lives. This file covers
> only the demo.

Goal: a shareable demo of the editorial workflow — editor publishes in Payload,
the piece appears on a live site. Invented content, not the real archive.

## Done
- Payload 3.85 + Next 16, stripped down from the website template.
- Schema written and working: **Pieces, Issues, Contributors, Artworks, Genres, Media, Users**
  (`src/collections/`). Pieces has tabs (The Work / People & Art / Related),
  drafts + autosave, live preview, and literary Lexical blocks: **Verse**
  (preserves line breaks for poetry), **Epigraph**, **Pull Quote**.
- Frontend at `src/app/(frontend)/`: homepage (featured lead + pieces grouped by
  issue), piece page (artwork + credits + contributor bios + editor-picked
  related), contributor page. TBR-flavoured CSS, v3 font stack.
- Seed script (`src/seed.ts`) — 4 pieces, 4 contributors, 3 artworks (generated
  locally with sharp, no external images), 2 issues, 5 genres.
- Runs locally: `pnpm dev --port 3001` (3000 is taken by tbr-art-board).
- Demo login: `editor@thebrooklynreview.demo` / `brooklyn2026`

## Repo
Pushed to **https://github.com/The-Brooklyn-Review/tbr-cms-demo** (private, org-owned).
`.env`, `node_modules/`, and `media/` are gitignored — no secrets in the repo.

## 🟢 LIVE — deployed Aug 21, 2026

**https://tbr-cms-demo.vercel.app** — homepage, piece pages, and `/admin` all
confirmed working end-to-end against Supabase. Demo login:
`editor@thebrooklynreview.demo` / `brooklyn2026`.

Deployed via Vercel's file-upload API (`deploy_to_vercel`), **not** git-linked —
the GitHub App integration available in this environment can't create repos or
change repo visibility (403 "Resource not accessible by integration" on both),
and the Vercel team is on the Hobby plan, which can't link a private org repo.
So there's currently no auto-deploy-on-push. To redeploy after future commits:
either re-run the file-upload deploy, or unblock git-linking by making the repo
public, upgrading the Vercel team to Pro, or widening the GitHub App's
permissions — then link normally via `create_git_project`.

Two pre-existing (unrelated to this session's earlier work) dead-code files
broke the Vercel build and were deleted: `src/utilities/formatAuthors.ts`,
`generateMeta.ts`, `generatePreviewPath.ts`, `getGlobals.ts`, `getRedirects.ts`,
and `getDocument.ts` — all leftover from the original website template,
unused anywhere in this app, referencing collections (`posts`, `pages`) that
don't exist in this schema. `src/seed.ts`'s `mk()` helper also had a
`roles: string[]` param that needed narrowing to the actual union type.

Live env vars (set in Vercel dashboard — **not** in git):
- `DATABASE_URL` → `payload_app` role on the Supabase pooler (see below)
- `PAYLOAD_SECRET` → freshly generated for this deploy, not the local `.env` one
- `NEXT_PUBLIC_SERVER_URL` → `https://tbr-cms-demo.vercel.app`
- `BLOB_READ_WRITE_TOKEN` → **not yet set** — no Blob store created yet, so
  media uploads through the admin UI will still write to local disk (which is
  read-only/ephemeral on Vercel and will fail). Next session: Storage →
  Create Database → Blob → connect to project, then redeploy.

Supabase advisory: RLS is disabled on all 18 tables in `public`. Not a
functional issue here since the app connects via a dedicated Postgres role
over the session pooler, not Supabase's PostgREST/anon-key API — but flagged,
not auto-fixed, since enabling RLS without policies would lock out the app's
own connection. Remediation SQL is in the advisory if wanted later.

## Earlier progress (Aug 21, 2026 — autonomous continuation, before deploy)
- **Media storage adapter added.** `@payloadcms/storage-vercel-blob` is wired
  into `src/payload.config.ts`, gated on `process.env.BLOB_READ_WRITE_TOKEN`
  (falls back to local disk when the var isn't set, so local dev is
  unaffected). Verified: boots clean against local Postgres with the plugin
  array empty; `tsc` shows no new errors from this change (the pre-existing
  template-leftover errors in `src/utilities/*` and `src/seed.ts` predate
  this work and are unrelated).
- **Supabase DB role created.** On project `jvmiljmyjtyhetlblprw`: could not
  `ALTER USER postgres WITH PASSWORD …` (Supabase blocks changing the
  `postgres` role's password via SQL — only via Dashboard → Settings →
  Database → Reset Database password). Instead created a dedicated app role:
  `payload_app`, granted `ALL PRIVILEGES` on schema `public` + all
  tables/sequences (including default privileges for future objects created
  by other roles, e.g. by `apply_migration`). Session pooler connection
  string for this role:
  `postgresql://payload_app.jvmiljmyjtyhetlblprw:<password>@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
  — password was generated but **not recorded here**; regenerate with
  `ALTER ROLE payload_app WITH PASSWORD '…'` via the Supabase MCP or
  dashboard SQL editor if lost.
- **Schema generated locally**, ready to replay against Supabase. This
  sandbox has no direct network path to Postgres (raw TCP 5432 is blocked,
  and the HTTPS proxy 403s any host that isn't allowlisted — confirmed via
  `psql` hang + `curl` 403 to `*.supabase.co` and `api.supabase.com`). Worked
  around it by starting a local Postgres 16 (`service postgresql start`,
  already installed in this sandbox), running the existing seed flow against
  it (`set -a; . ./.env; set +a; NODE_OPTIONS="--no-deprecation
  --import=tsx/esm" node src/seedRun.ts`) to get Payload's dev-mode schema
  push to build the real schema, then `pg_dump --schema-only` /
  `--data-only --column-inserts` to get portable SQL. The Supabase MCP tools
  (`apply_migration`, `execute_sql`, even read-only `list_tables`) started
  returning `MCP tool call requires approval` on every call partway through
  this session — including calls that had succeeded minutes earlier before
  the MCP connection cycled — and retries across several reconnects didn't
  clear it. Same symptom hit the Vercel MCP tools (`list_projects`). This
  looks like a session-side approval gate, not a Supabase/Vercel-side
  problem — next session, retry `list_tables`/`list_projects` first; if
  still blocked, a human needs to approve the MCP tool call once
  interactively.

## Not done — next session picks up here
1. **Create the Vercel Blob store** and set `BLOB_READ_WRITE_TOKEN` (see live
   env vars above), then redeploy — media uploads via `/admin` don't work
   until this is done.
2. **Git-linked auto-deploy** — see the "not git-linked" note above for the
   three ways to unblock this.
3. Optional: issue archive page, genre archive page.

## Gotchas already hit (don't rediscover)
- `payload run <script>` silently no-ops here. Use:
  `set -a; . ./.env; set +a; NODE_OPTIONS="--no-deprecation --import=tsx/esm" node src/seedRun.ts`
- `filterOptions` on a self-relationship must guard for undefined id on create:
  `({ id }) => (id ? { id: { not_equals: id } } : true)`
- The template's `next.config.ts` imported `./redirects`, which was deleted — removed.
- Claude's `preview_start` resolves to the wrong project's launch.json from the
  home directory; start the dev server directly instead.
