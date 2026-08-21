# Build Notes — CMS Demo

Findings from building and hardening the `tbr-cms-demo` Payload/Next/Supabase/Vercel
stack, for feeding into the production (`website`) spec. This file is a findings
log, not a spec — nothing here should be pasted wholesale into the master plan.
Each finding states what to *require* or *watch for*; the plan author decides how
it's expressed there.

Categories: `TRANSFERABLE REQUIREMENT` (applies to `website` regardless of this
demo) · `RECOMMENDED PATTERN` (worked well here, adopt if convenient) ·
`DEMO-SPECIFIC WORKAROUND` (exists only because of this sandbox/demo's
constraints — do not carry forward as-is) · `UNRESOLVED` (known gap, not
investigated or not fixed).

Severity (requirements/patterns only): `blocking` · `should-fix` · `nice-to-have`.

Some findings have one root cause but two faces — a requirement for `website`,
and a workaround that was needed *only* to unblock this demo. Those are written
as a single entry with both sections, rather than split into two findings that
would obscure the shared cause.

---

## 1. Publish must be gated separately from draft-save

**Category:** TRANSFERABLE REQUIREMENT — **Severity:** blocking

**Question tested:** With two roles (editor can publish, a lower tier can only
draft), does restricting `update` access to "any signed-in user" actually stop
the lower tier from publishing?

**Observed behavior:** No. Payload has no distinct "publish" permission —
publishing is just a normal `update` that sets `_status: 'published'`. A
collection access rule of `update: authenticated` (or any role-blind check) lets
every signed-in user publish, regardless of what the UI copy or role labels
promise. This was caught by re-reading the access rules on request, not by any
test failing — nothing in the app surfaced it.

**Relevant demo files:** `src/access/index.ts` (`draftOrEditorPublish`, later
folded into `staff` once the role model simplified to editor/admin, both of
whom are meant to publish), `src/collections/Pieces.ts` (`access.create`,
`access.update`).

**Minimal transferable implementation pattern:** Access functions receive
`data` for create/update. Gate on it directly:
```ts
export const draftOrPublish: Access = ({ req: { user }, data }) => {
  if (!user) return false
  if (canPublish(user)) return true
  return data?._status !== 'published'
}
```
Apply to both `create` and `update` — a lower-tier role can otherwise publish
by setting `_status: 'published'` on the initial create instead of an update.

**Verification procedure for `website`:** For every role below the
highest-trust tier, attempt a direct API `PATCH`/`POST` with `_status:
'published'` while authenticated as that role. Expect a 403. Do this for every
collection with `versions.drafts` enabled, not just the primary content type.

**Stack dependencies:** Payload's `versions.drafts` + role-based `access`
config. Not React/Next-specific.

**Confidence:** High — reproduced and fixed in this demo; the fix was verified
end-to-end (see Finding 4).

---

## 2. Local API calls silently drop the authenticated user unless told otherwise

**Category:** TRANSFERABLE REQUIREMENT — **Severity:** blocking

**Question tested:** Does a Next.js Server Component's `payload.find()` call
(Payload's Local API, not a fetch to `/api/...`) see the signed-in editor's
session when rendering a page for that editor?

**Observed behavior:** No, not automatically. The Local API has no HTTP
request to read a session cookie from, so `req.user` is `undefined` inside
access control unless the caller explicitly authenticates and passes `user`.
This was invisible for a piece still in its original published state (the
`_status: published` fallback happened to match), and only surfaced once an
editor edited a piece *after* publishing it — its latest version became
`_status: draft`, and the draft-preview query (running as an effectively
anonymous Local API call) filtered it out. The result was a 404 shown to the
signed-in editor who owned the edit.

**Relevant demo files:** `src/app/(frontend)/pieces/[slug]/page.tsx`
(`getPiece`), `src/app/(frontend)/next/preview/route.ts` (the route that
correctly authenticates the *redirect*, but didn't propagate that identity
downstream).

**Minimal transferable implementation pattern:**
```ts
let user
if (draft) {
  const auth = await payload.auth({ headers: await headers() })
  user = auth?.user ?? undefined
}
const { docs } = await payload.find({ ..., overrideAccess: false, user })
```
General rule: any Local API call made on behalf of a specific visitor (not a
trusted system/cron job) must explicitly authenticate and pass `user` —
`overrideAccess: false` alone is not sufficient without it.

**Verification procedure for `website`:** For any authenticated preview/draft
path, test with a document whose *latest version* differs from its published
state (i.e., edited after publishing) — not just a freshly-drafted,
never-published document. That's the case that silently breaks.

**Stack dependencies:** Payload Local API + Next.js Server Components/Route
Handlers reading `next/headers`. Generic to any Payload app that renders
authenticated content through Server Components rather than REST calls.

**Confidence:** High — reproduced against real production traffic (Vercel
runtime logs showed the 404, then showed 200 after the fix), not just local
reasoning.

---

## 3. Postgres native enums and role-based DDL ownership on Supabase

**Category:** TRANSFERABLE REQUIREMENT — **Severity:** should-fix
**+ DEMO-SPECIFIC WORKAROUND** for the specific incident below.

**Question tested:** Does the app's own migration runner (using the same
pooled `DATABASE_URL` the app runs on) have permission to run every DDL
statement Payload's Postgres adapter might generate for a `select`-type field
change?

**Observed behavior:** No. `ALTER TABLE ... ALTER COLUMN ... SET DEFAULT`
succeeded fine through the app's pooled connection. `ALTER TYPE ... ADD VALUE`
(needed because Payload maps a fixed-option `select` field to a native
Postgres enum) failed with `must be owner of type enum_users_role` — Postgres
requires literal type ownership for `ALTER TYPE`, which is a stricter bar than
the table/DDL privileges the pooled role otherwise has on Supabase. This broke
a production deploy outright (`payload migrate` runs as the first build step;
the build failed, so the *old* build stayed live — no partial/broken deploy,
but the new code never shipped until this was resolved).

**Relevant demo files:** `src/migrations/20260821_192800_admin_role.ts`,
`scripts/migrate-before-build.mjs`.

**Minimal transferable implementation pattern:** Two options, in order of
preference:
1. Avoid the situation: model role-like fields as `text` + a `beforeValidate`/
   `validate` allow-list instead of relying on Payload's default enum mapping,
   if the field's options are expected to change over the project's life.
2. If already on a native enum: any migration doing `ALTER TYPE ... ADD VALUE`
   needs to run through a connection that owns the type — not necessarily the
   app's runtime pooled connection. Know in advance which connection string(s)
   in your stack have that privilege (on Supabase: the direct/session
   connection as the project owner, or the dashboard's SQL runner — not
   necessarily the transaction-pooler connection the app uses at runtime).

**DEMO-SPECIFIC WORKAROUND (do not carry forward as-is):** Applied the
`ALTER TYPE` directly through Supabase's own SQL execution (which runs with
project-owner privilege), then hand-inserted a row into `payload_migrations`
so the next build's `payload migrate` would see that migration as already
applied and skip re-running (and re-failing) it. This is a manual,
human-in-the-loop patch appropriate for unblocking one demo deploy — a real
project needs a *repeatable* answer (see pattern above), not a one-off manual
insert every time this class of migration is needed.

**Verification procedure for `website`:** Before relying on `payload migrate`
in CI/CD for any field that maps to a native enum, dry-run an `ADD VALUE`-shaped
migration against the actual deployment connection string (not a superuser
session) and confirm it succeeds.

**Stack dependencies:** Supabase's connection-pooling model (PgBouncer roles
vs. Postgres native ownership semantics) + `@payloadcms/db-postgres`'s enum
mapping for `select` fields. Would not occur on a database where the app
connects with the schema-owning role directly.

**Confidence:** High for the failure mode and root cause (reproduced with the
exact error message from a real production build). Medium on "option 1" as
the right long-term fix — it trades a real limitation for a small amount of
extra validation code; worth the plan author's judgment call, not asserted
as the only answer.

---

## 4. `NEXT_PUBLIC_*` URL env vars need normalization when used in exact-match comparisons

**Category:** TRANSFERABLE REQUIREMENT — **Severity:** should-fix

**Question tested:** Does Payload's Live Preview (the `useLivePreview` hook's
`postMessage` sync) work correctly when `NEXT_PUBLIC_SERVER_URL` is set with a
trailing slash in the hosting platform's env var UI?

**Observed behavior:** No — silently. The hook compares incoming
`postMessage` events with `event.origin === serverURL`. Browsers never include
a trailing slash in `event.origin`; if the configured URL has one, the
comparison never matches, so live updates are dropped with no error anywhere
in the stack (server logs clean, client console clean). The initial page load
still worked, making this easy to mistake for "mostly working."

**Relevant demo files:**
`src/app/(frontend)/pieces/[slug]/PieceArticle.tsx`,
`src/collections/Pieces.ts` (`previewURL`).

**Minimal transferable implementation pattern:**
```ts
const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_URL || fallback).replace(/\/+$/, '')
```
Apply everywhere a public-facing URL env var feeds an exact string/origin
comparison, not just Live Preview.

**Verification procedure for `website`:** After setting/changing this env var
on the hosting platform, open Live Preview, edit a field, and confirm the
preview pane updates *without* a manual refresh. A working initial load is not
sufficient evidence — check the live-update path specifically.

**Stack dependencies:** `@payloadcms/live-preview-react`'s `postMessage`
protocol. Applies to any deployment platform where env vars are typed by hand
(trailing slash is an easy, invisible typo).

**Confidence:** High — confirmed by inspecting the actual deployed client
bundle (the trailing slash was visible in the minified `serverURL` constant)
before and after the fix.

---

## 5. Freeform slug fields accumulate exactly the kind of bad data access-control changes then expose

**Category:** RECOMMENDED PATTERN — **Severity:** should-fix

**Question tested:** What happens when an editor hand-types a slug (mixed
case, trailing whitespace) into a plain `text` field, and that value is later
used verbatim in a route match and an `<a href>`?

**Observed behavior:** It saves without complaint (Payload's default `text`
field does no normalization), renders fine on the page that created it, and
then breaks unpredictably elsewhere — a link built from the raw value 404s or
silently mismatches depending on exact casing, and a trailing space rides
along into an href unnoticed until clicked. This surfaced as "the preview is
broken" for one specific piece, with no error message pointing at the actual
cause.

**Relevant demo files:** `src/fields/slug.ts`, `src/fields/SlugField.tsx`,
used from `src/collections/Pieces.ts`, `Contributors.ts`, `Genres.ts`,
`Issues.ts`.

**Minimal transferable implementation pattern:** A slug field that (a)
auto-fills from a source field (title/name) as the editor types, and (b)
reformats — lowercase, trim, non-alphanumeric runs collapsed to one hyphen —
both live in a small admin client component *and* again in a
`beforeValidate` hook, so the same rule holds for direct API writes and
autosave, not just the UI widget. Payload ships an experimental built-in
`SlugField` (`@payloadcms/ui`) that provides a similar lock/generate UI but
only reformats on an explicit "Generate" click, not on every keystroke or on
save — the `beforeValidate` hook is the part worth keeping regardless of
which UI is used, since it's the actual enforcement point.

**Verification procedure for `website`:** Attempt to save a slug field via
direct API call with a value containing uppercase letters, leading/trailing
whitespace, and repeated special characters. Confirm the stored value is
already normalized, not merely accepted.

**Stack dependencies:** None beyond Payload's field/hook system — portable to
any collection with a slug-like unique text field.

**Confidence:** High — root-caused via direct DB inspection of the actual bad
row, fixed, and the specific broken piece verified working afterward.

---

## 6. Static generation + on-publish revalidation removes the connection-exhaustion failure class, not just cost

**Category:** RECOMMENDED PATTERN — **Severity:** nice-to-have (but see note)

**Question tested:** Is there a way to keep the free-tier Supabase connection
cap from becoming a recurring outage source under normal reader traffic?

**Observed behavior:** The earlier version of this project served every
public page dynamically (a live DB query per request), and a Supabase
pooler-mode misconfiguration under that load produced connection-exhaustion
errors (`EMAXCONNSESSION`) repeatedly. Switching public pages to `export const
revalidate = false` + `generateStaticParams` + an `afterChange` hook calling
`revalidatePath` on publish means readers are served from the CDN and never
touch Postgres at all in the common case — the pooler misconfiguration (a
real, separate bug, see the pooler-mode fix in git history) stopped being able
to take the site down even before it was fixed, because most traffic no
longer reached the database.

**Relevant demo files:** `src/app/(frontend)/pieces/[slug]/page.tsx`,
`src/app/(frontend)/page.tsx`, `src/hooks/revalidate.ts`.

**Minimal transferable implementation pattern:** For any content collection
where "readers see it" and "editors can preview drafts" are separate needs:
static + `revalidatePath` in `afterChange` for the former, an authenticated
draft-mode route (see Finding 2) for the latter. Don't reach for
`force-dynamic` on public pages by default.

**Verification procedure for `website`:** Publish a piece, confirm the public
page reflects it within the revalidation window without a redeploy. Separately,
load-test (even lightly) a fully static page and confirm zero DB queries in
logs for that request.

**Stack dependencies:** Next.js App Router ISR/`revalidatePath` + Payload
`afterChange` hooks. Not Supabase-specific, though the cost/reliability
motivation is sharper on a connection-capped free tier.

**Confidence:** High that this pattern works as implemented (verified via
Vercel runtime logs showing `PRERENDER`/cache hits on public routes). Medium
on "removes the failure class" as a general claim — it reduces exposure, but
the underlying pooler-mode bug was a separate, necessary fix (see git history:
session-mode → transaction-mode pooler).

---

## 7. Versioned migrations need a build-time gate, and the gate needs a documented escape hatch for the connection that can't do it

**Category:** RECOMMENDED PATTERN — **Severity:** should-fix

**Question tested:** With `push: false` (schema changes only via reviewed
migration files, never auto-diffed at boot), how does a deploy actually fail
safe if a migration can't apply?

**Observed behavior:** Wiring `payload migrate` as the first step of the
build script (before `next build`) means a bad migration fails the whole
deploy — the previous build stays live, nothing partially ships. This worked
exactly as intended for the incident in Finding 3: the build failed loudly
instead of shipping code against a schema it didn't match.

**Relevant demo files:** `scripts/migrate-before-build.mjs`,
`src/payload.config.ts` (`push: false`, `migrationDir`),
`src/migrations/index.ts`.

**Minimal transferable implementation pattern:**
```json
"build": "node ./scripts/migrate-before-build.mjs && next build"
```
with the script skipping cleanly (not erroring) on preview deploys / when
`DATABASE_URL` is absent, so it doesn't block environments that shouldn't be
migrating a shared database.

**Verification procedure for `website`:** Intentionally author a migration
that fails, push it, and confirm the deploy fails at the build step (not at
runtime) and the previously-deployed version keeps serving traffic.

**Stack dependencies:** Payload's migration CLI + whatever CI/CD runs the
build (Vercel here). Generic otherwise.

**Confidence:** High — this is exactly what happened, unintentionally, during
this session (Finding 3), and it behaved as designed.

---

## 8. Seeding/testing accounts without a reachable POST path

**Category:** DEMO-SPECIFIC WORKAROUND — do not carry forward

**Question tested:** N/A — this is a workaround for a demo-environment
limitation, not a finding about the target stack.

**Observed behavior:** This sandbox's outbound network policy blocks direct
HTTP requests to the deployed production URL (proxy rejects the CONNECT), and
no available tool could issue an authenticated `POST` against it. Test
accounts still needed to be created with working, verifiable passwords.

**Relevant demo files:** none shipped — ad hoc shell commands only.

**What was done:** Replicated Payload's own password hashing exactly
(`pbkdf2`, 25000 iterations, 512-byte length, SHA-256, hex-encoded salt+hash —
read directly from `@payloadcms/*`'s installed source, not guessed) in a
local Node script, then inserted the resulting rows directly via a
privileged DB connection. Correctness was verified by recomputing the hash
from the stored salt and confirming it matched, rather than by an actual
login round-trip (which the network restriction also blocked).

**Why this isn't transferable:** A real environment doing account
provisioning should always go through the application's own auth
create-user path (API or admin UI), which also runs field validation, hooks,
and any side effects (welcome email, audit log, etc.) that a direct SQL
insert bypasses entirely. This was a last-resort, sandbox-specific move.

**Confidence:** High that the created accounts work (hash verified to
round-trip correctly against Payload's exact algorithm). Not independently
confirmed via an actual login HTTP round-trip, due to the same network
restriction that necessitated the workaround.

---

## 9. Guest-editor / scoped-contributor role is unresolved

**Category:** UNRESOLVED

**Question tested:** Can the current role model (editor/admin) support a
third, more restricted tier for a one-off contributor who should only see and
edit their own assigned piece(s)?

**Observed behavior:** Not investigated beyond design discussion. The current
access model gates by *role* only (`user.role === 'admin' | 'editor'`) — it
has no per-document ownership concept. A "guest editor" role added the same
way would, at best, replicate the old draft-only tier (which turned out to be
under-enforced — see Finding 1) and would still see every other editor's
unpublished drafts, not just their own assigned piece. That's a real gap
against "most restricted," which is what a guest-editor tier is *for*.

**What it would need:** A row-level scoping field (e.g., an `assignedEditors`
relationship on the content collection) and query-constraint-returning access
functions (`{ assignedEditors: { contains: user.id } }`) rather than a boolean
role check — the same query-constraint pattern already used for
`publishedOrSignedIn`, extended to ownership instead of publish state.

**Confidence:** N/A — flagged, not attempted.

---

## 10. No email adapter, no backups, no submissions page

**Category:** UNRESOLVED

**Observed behavior / what's missing:**
- **Email:** Password reset and any account-invite flow log to console
  (`No email adapter provided` — observed repeatedly in production runtime
  logs) rather than sending real mail. Fine with one shared/known account;
  breaks the moment a real second person forgets a password.
- **Backups:** No automated export of the Postgres database beyond Supabase's
  own free-tier point-in-time restore (90-day window, not independently
  controlled or downloadable).
- **Submissions:** An original stated requirement (an instructions page
  linking out to Submittable) was never built.

**Why unresolved rather than attempted:** Explicitly deprioritized by the
project owner relative to the access-control and preview-correctness work in
this session; not a technical blocker, just not yet done.

**Confidence:** N/A — confirmed absent by direct inspection (grepped for a
submissions route/page and for backup automation in `.github/workflows`;
neither exists), not further investigated.
