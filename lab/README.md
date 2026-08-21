# Converter lab — isolated from the demo

This branch exists so converter stress-testing never touches what classmates see.

## The three isolation boundaries

| Layer | Demo (`main`) | Lab (this branch) |
|---|---|---|
| **Code** | `main` | **`converter-lab`** — never merge to `main` |
| **Database** | Supabase `tbr-cms-demo` | **local Postgres `tbr_converter_lab`** |
| **Deployment** | `tbr-cms-demo.vercel.app` | **never deployed** |

**The database is the boundary that actually matters.** Code on a branch is invisible;
test records in the shared Supabase instance are not. Classmates poking at
`/admin` would see converter debris in the piece list.

## Running the lab

```bash
git checkout converter-lab
cp .env .env.demo.bak                      # keep the demo's env safe
# point DATABASE_URL at the LOCAL lab database:
#   postgres://thomasmathew@localhost:5432/tbr_converter_lab
pnpm dev --port 3001
```

**Never** run the lab with `DATABASE_URL` pointing at Supabase. If a lab run needs a
clean slate: `dropdb tbr_converter_lab && createdb tbr_converter_lab`.

## Why the deployed demo is already safe

The Vercel deploy is **not git-linked** — it was shipped by file upload because the
Hobby plan can't link a private org repo. Pushing this branch cannot redeploy anything.
That's protective here, but it also means the demo only updates when someone deliberately
re-uploads.

## What the lab is for

Proving or disproving the Lexical round-trip risk in
`docs/plan/FORMATTING.md` — whether Payload's editor normalises away empty paragraphs,
whitespace runs, trailing breaks and rare inline marks when a record is opened and saved.

That answer determines whether the production schema needs custom nodes, so it blocks the
foundation lane. Everything else in the migration plan is already settled on paper.

## Rules

- Do not merge `converter-lab` into `main`.
- Do not deploy from this branch.
- Do not point it at Supabase.
- Findings go to `docs/plan/FORMATTING.md` in the `website` repo — not here.
