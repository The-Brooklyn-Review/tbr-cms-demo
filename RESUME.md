# tbr-cms-demo — where this left off (Aug 20, 2026)

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

## Not done — next session picks up here
1. **Deploy to Vercel + Supabase so it survives the laptop closing.**
   - Supabase project already created: `tbr-cms-demo` (ref `jvmiljmyjtyhetlblprw`, us-east-1, $0/mo).
   - Need to set a DB password (can be done via MCP `execute_sql`:
     `ALTER USER postgres WITH PASSWORD '…'`), then use the **session pooler**
     host for serverless: `aws-0-us-east-1.pooler.supabase.com:5432`.
   - Push schema + run seed against Supabase.
   - Create Vercel project under team **The Brooklyn Review**
     (`team_40vODsSegEo14mmXqUrufHCm`), linked to the GitHub repo above. Set
     `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`.
   - Generate a **fresh** `PAYLOAD_SECRET` for the deploy — do not reuse the
     local demo one in `.env`.
2. **Media storage adapter** — local disk does not work on serverless.
   Add `@payloadcms/storage-vercel-blob` with `clientUploads: true` (Vercel caps
   request bodies at 4.5MB; art uploads will exceed it).
3. Optional: issue archive page, genre archive page.

## Gotchas already hit (don't rediscover)
- `payload run <script>` silently no-ops here. Use:
  `set -a; . ./.env; set +a; NODE_OPTIONS="--no-deprecation --import=tsx/esm" node src/seedRun.ts`
- `filterOptions` on a self-relationship must guard for undefined id on create:
  `({ id }) => (id ? { id: { not_equals: id } } : true)`
- The template's `next.config.ts` imported `./redirects`, which was deleted — removed.
- Claude's `preview_start` resolves to the wrong project's launch.json from the
  home directory; start the dev server directly instead.
