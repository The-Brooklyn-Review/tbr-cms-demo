# Editorial workflow demo — a script for the team

This is a proof-of-concept CMS built on Payload, Next.js, and Postgres — not
the real archive. It's invented content (placeholder text, generated
artwork) meant to show what publishing would actually feel like day to day.
Everything below can be tried live; nothing you do here can break anything
that matters.

**Site:** https://tbr-cms-demo.vercel.app
**CMS login:** https://tbr-cms-demo.vercel.app/admin
**Demo account:** `editor@thebrooklynreview.demo` / `brooklyn2026`

Budget about 20–30 minutes to go through all of it.

---

## 1. Log in and look around

Go to `/admin` and sign in. The left sidebar is grouped: **Publication**
(Pieces, Issues, Contributors, Artworks), **Taxonomy** (Genres), and
**System** (Users, Media). Click **Pieces** — you'll see the pieces already
seeded for the demo, each with a status (Draft / Published).

Open one of the published pieces. This is the editor you'll use for every
real piece.

## 2. Create a new piece

Click **Pieces → Create New**.

- **Title**, **Slug** (this becomes the URL — `/pieces/your-slug`),
  **Genre**, and **Issue** are required. Genre and issue are dropdowns
  pulling from Genres/Issues, not free text — pick from what exists, or open
  a second tab and add a new one on the fly if you need to.
- The sidebar also has **Published date** and a **Featured** checkbox
  (featured pieces are eligible to be the homepage lead).

Switch to the **The Work** tab. This is where the actual writing goes.

## 3. The rich text editor

The toolbar has the basics you'd expect — bold, italic, headings, links,
bulleted and numbered lists, indentation, a horizontal rule — plus three
blocks built specifically for literary work. Insert one from the `+` menu
mid-document:

- **Verse** — a plain text box where line breaks and indentation are kept
  exactly as typed. Regular paragraphs reflow and collapse whitespace, which
  quietly mangles poetry; Verse doesn't.
- **Epigraph** — a quote-plus-attribution block for the line some pieces
  open with.
- **Pull Quote** — a styled callout quote, for breaking up longer prose.

Try dropping a few lines of verse in the Verse block and watch the line
breaks hold.

## 4. Images — two different jobs

There are two separate places images go, because they mean different
things:

- **Media** is the general upload library — anything that's just an image
  file (a headshot, a document scan). Upload here directly from the Pieces
  editor wherever you see an upload field.
- **Artworks** is its own collection, not just an image. Go to
  **Artworks → Create New**: upload the image, then set **Artist** by
  picking an existing **Contributor** (or add one first). Fill in medium,
  year, and dimensions if you have them.

Now go back to your piece, **People & Art** tab, and add that artwork under
**Artwork**. This is the part worth noticing: you did not retype the
artist's name anywhere on the piece. The credit line under the image and the
artist's bio at the bottom of the article both come from that one
relationship — change the artist's name once on their Contributor record and
every piece using their art updates everywhere, automatically, next time the
page rebuilds.

## 5. Contributors

**Contributors** hold the writer, translator, interviewer, or artist for a
piece — one record per person, reused across everything they're credited on.
Each has a name, roles (Writer / Artist / Translator / Editor — pick as many
as apply), an optional bio (its own rich text field), and an optional photo.

Add your contributor to the piece under **People & Art → Contributors**.
Their name becomes the byline; their bio (if they have one) renders
automatically at the bottom of the piece.

## 6. Live preview

With your draft piece still open, look for **Live Preview** in the
top-right of the editor (or open the preview panel). As you type — title,
body text, swapping the artwork — the preview updates within a fraction of a
second, before you've saved anything. This isn't a special demo trick: it's
the same page a reader would see, rendered live from what's currently in the
editor.

There's also a plain **Preview** button that opens the draft in a new tab at
full size, useful for reading a longer piece properly before deciding it's
ready.

## 7. Draft → publish

Look at the sidebar's status control. Everything starts as a **Draft** and
autosaves as you type (every ~400ms) — you can close the tab and come back
without losing work. Nothing is visible on the public site while it's a
draft, no matter how much you've written or previewed it.

When it's ready, use **Publish**. That's the moment it becomes visible on
the live site — the homepage, the archive, and its own `/pieces/...` page
all update within moments (there's a brief rebuild, not a wait for a new
deploy).

You can also unpublish something that's already live, or edit and republish
a piece that's already out — Payload tracks the difference between "what's
saved" and "what's public" the whole time.

## 8. Version history

Every save is a version, going back up to 20 revisions per piece. Open the
**Versions** panel from a piece (clock icon, or Versions tab) to see the
history and diff any version against the current one. If an edit turns out
to be wrong, or you want to see what a piece looked like before a change,
you can view or restore any prior version — this is not something a plain
text file or Google Doc gives you for free.

## 9. Roles

There are two roles: **Editor** (can publish, delete, and manage other
users) and **Reader** (can draft and save, but not publish or delete). New
accounts default to Reader, so a contributor or intern given CMS access
can't accidentally take something live or delete a colleague's work — an
editor has to promote them first, from **Users**.

## 10. Search the archive

Visit `/archive` on the public site. It searches title, contributor names,
genre, issue, and the piece body itself (including text inside Verse,
Epigraph, and Pull Quote blocks) — fuzzy, so a typo or partial name still
finds something — with filters for genre, issue, and contributor that
combine with the search box. Publish your new piece and it shows up here
too, instantly.

## Why this is different from WordPress

WordPress (and most generic CMSes) gives you one shape: a post with a title
and a blob of HTML, plus tags. Everything else — bylines, artwork credits,
issue groupings, "who wrote what" — is either a plugin, a convention held
together by discipline, or copy-pasted by hand into every post it applies
to.

Here the shape is the magazine's, not a blogging platform's:

- **Contributors and artworks are real records, not text fields.** A name
  typed into a WordPress "byline" field is just a string — rename someone
  and every old post still says the old name. Here it's a relationship:
  change it once, it's correct everywhere, including on pieces published
  months ago.
- **Structure survives, instead of degrading to HTML.** Verse-formatted
  poetry, epigraphs, and pull quotes are distinct content types with their
  own fields, not paragraphs the editor cell hopes don't get auto-formatted
  away. A generic rich text field allows all four but distinguishes none of
  them.
- **The schema enforces the workflow, not just formatting.** Required
  genre/issue, editor-only publish and delete, versioned drafts with
  autosave, live preview tied to the real page template — this is built
  into what a "piece" *is*, not bolted on after the fact with a plugin that
  might break on the next update.
- **The archive is genuinely structured data.** Search and filtering by
  genre, issue, and contributor work because those are real relationships
  the database can query — not tags applied inconsistently by whoever
  happened to be publishing that week.

The tradeoff is honest: a generic CMS is faster to stand up and has a
plugin for almost anything. This is slower to build and narrower — it does
The Brooklyn Review's kind of publishing, not any kind of publishing. That's
the point of building it custom instead of configuring something generic.

---

Questions or something feels broken? This is a demo running on free-tier
infrastructure (Vercel Hobby, Supabase free Postgres) — it's built to hold
up under normal editorial use, not load-tested traffic. Report anything odd
and it'll get fixed.
