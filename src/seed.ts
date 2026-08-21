import type { Payload } from 'payload'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const p = (text: string) => ({
  type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
  children: [{ type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
})
const block = (blockType: string, fields: Record<string, unknown>) => ({
  type: 'block', format: '', version: 2,
  fields: { blockType, ...fields },
})
const doc = (children: unknown[]) => ({
  root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children },
})

// abstract placeholder art, generated locally so the demo needs no external images
async function makeArt(dir: string, name: string, a: string, b: string, seed: number) {
  const shapes = Array.from({ length: 7 }, (_, i) => {
    const x = ((seed * (i + 3) * 37) % 900) + 50
    const y = ((seed * (i + 5) * 53) % 600) + 40
    const r = ((seed * (i + 2) * 17) % 160) + 60
    const o = 0.18 + ((i * seed) % 5) / 12
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? a : b}" opacity="${o.toFixed(2)}"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700">
    <rect width="1000" height="700" fill="#efe8dc"/>${shapes}
    <rect width="1000" height="700" fill="none" stroke="${a}" stroke-width="6" opacity="0.35"/>
  </svg>`
  const file = path.join(dir, name)
  await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toFile(file)
  return file
}

export const seed = async (payload: Payload) => {
  const tmp = path.join(process.cwd(), '.seed-art')
  fs.mkdirSync(tmp, { recursive: true })

  payload.logger.info('Seeding demo content…')

  // ── genres ──────────────────────────────────────────────
  const genreDefs = [
    ['Poetry', 'poetry'], ['Fiction', 'fiction'], ['Nonfiction', 'nonfiction'],
    ['Interview', 'interview'], ['Visual Art', 'visual-art'],
  ]
  const genres: Record<string, any> = {}
  for (const [name, slug] of genreDefs) {
    genres[slug] = await payload.create({ collection: 'genres', data: { name, slug } })
  }

  // ── issues ──────────────────────────────────────────────
  const spring26 = await payload.create({
    collection: 'issues',
    data: {
      title: 'Spring 2026', slug: 'spring-2026', season: 'Spring', year: 2026,
      publishedAt: '2026-04-01',
      editorsNote: doc([p('A note from the editors would run here — this is demo text, not the real issue.')]) as any,
    },
  })
  const fall25 = await payload.create({
    collection: 'issues',
    data: { title: 'Fall 2025', slug: 'fall-2025', season: 'Fall', year: 2025, publishedAt: '2025-10-15' },
  })

  // ── contributors ────────────────────────────────────────
  const mk = (
    name: string,
    slug: string,
    roles: ('Writer' | 'Artist' | 'Translator' | 'Editor')[],
    bio: string,
  ) =>
    payload.create({ collection: 'contributors', data: { name, slug, roles, bio: doc([p(bio)]) as any } })

  const nadia = await mk('Nadia Okonkwo', 'nadia-okonkwo', ['Writer'],
    'Nadia Okonkwo is a poet living in Crown Heights. Her work has appeared in several journals that do not exist. She teaches somewhere plausible. (Invented for this demo.)')
  const marcus = await mk('Marcus Reyes-Hall', 'marcus-reyes-hall', ['Writer'],
    'Marcus Reyes-Hall writes short fiction and is at work on a first collection. (Invented for this demo.)')
  const junia = await mk('Junia Feld', 'junia-feld', ['Artist'],
    'Junia Feld makes paintings and cut-paper collage. She has shown in Brooklyn and Philadelphia. (Invented for this demo.)')
  const tobi = await mk('Tobi Aarons', 'tobi-aarons', ['Writer', 'Artist'],
    'Tobi Aarons is an essayist and printmaker — one person, two roles, one contributor page. That is deliberate: the schema does not make you choose. (Invented for this demo.)')

  // ── artworks ────────────────────────────────────────────
  const artFor = async (title: string, artist: any, medium: string, year: string, a: string, b: string, seed: number) => {
    const file = await makeArt(tmp, `${seed}.jpg`, a, b, seed)
    const media = await payload.create({
      collection: 'media',
      data: { alt: `${title} — abstract placeholder artwork` },
      filePath: file,
    })
    return payload.create({
      collection: 'artworks',
      data: { title, image: media.id, artist: artist.id, medium, year, dimensions: '24 × 36 in' },
    })
  }

  const art1 = await artFor('Sunken Field', junia, 'Oil on canvas', '2025', '#a20641', '#fab63d', 7)
  const art2 = await artFor('Receivers', junia, 'Cut-paper collage', '2024', '#2f5d50', '#e0873f', 13)
  const art3 = await artFor('Plate VII', tobi, 'Linocut', '2025', '#3b3168', '#c96a4f', 21)

  // ── pieces ──────────────────────────────────────────────
  const poem = await payload.create({
    collection: 'pieces',
    data: {
      title: 'Witnessing, With Goldfinch',
      slug: 'witnessing-with-goldfinch',
      genre: genres['poetry'].id,
      issue: spring26.id,
      publishedAt: '2026-04-02',
      featured: true,
      deck: 'Three movements on looking, and on what looking costs.',
      accentColor: '#a20641',
      contributors: [nadia.id],
      artwork: [art1.id],
      body: doc([
        block('epigraph', { text: 'What is seen is never only what is there.', attribution: 'attributed, probably wrongly' }),
        block('verse', {
          lines: `The bird arrives the way weather arrives,\n  without asking, without apology.\n\nI have been standing here so long\nthe window has begun to hold me\n  the way a frame holds\n  something already finished.\n\n        Goldfinch.\n        Goldfinch.\n\nThe word is a small yellow room\nI keep walking into.`,
        }),
        p('A prose stanza can sit beside verse without either one losing its shape — that is the whole point of the Verse block.'),
        block('pullQuote', { text: 'The word is a small yellow room I keep walking into.' }),
        block('verse', {
          lines: `Later, the field.\n  Later, the field again,\n    and the light going\n      the way light goes —\n\nall at once, then\nnot at all.`,
        }),
      ]) as any,
    },
  })

  const story = await payload.create({
    collection: 'pieces',
    data: {
      title: 'The Receivers',
      slug: 'the-receivers',
      genre: genres['fiction'].id,
      issue: spring26.id,
      publishedAt: '2026-04-02',
      deck: 'A story about a switchboard, and the people who kept it running after nobody was calling.',
      accentColor: '#2f5d50',
      contributors: [marcus.id],
      artwork: [art2.id],
      relatedPieces: [poem.id],
      body: doc([
        p('The switchboard had not rung in four years, which did not stop anyone from arriving at seven to sit in front of it. This is demo text — invented for the CMS walkthrough, not a real story from the archive.'),
        p('Delia took the morning shift because the morning shift had the better chair. The chair had been better since 1987, when someone from the third floor had swapped it out and never admitted to it.'),
        block('pullQuote', { text: 'Nobody was calling. Everybody came in anyway.' }),
        p('What follows in a real piece would be several thousand more words. What matters here is that the editor pasted it in, hit publish, and it appeared on the site with the artwork, the byline, and the contributor note already attached.'),
      ]) as any,
    },
  })

  await payload.create({
    collection: 'pieces',
    data: {
      title: 'On Cutting the Plate',
      slug: 'on-cutting-the-plate',
      genre: genres['nonfiction'].id,
      issue: fall25.id,
      publishedAt: '2025-10-16',
      deck: 'An essay on printmaking, error, and the pleasure of an unrecoverable mistake.',
      accentColor: '#3b3168',
      contributors: [tobi.id],
      artwork: [art3.id],
      relatedPieces: [poem.id, story.id],
      body: doc([
        p('The linoleum does not forgive, which is the reason to use it. Demo text again — invented for the walkthrough.'),
        p('Every cut is a decision you cannot take back, and so the plate accumulates a record of your nerve. A good print is mostly a record of where you did not hesitate.'),
      ]) as any,
    },
  })

  await payload.create({
    collection: 'pieces',
    data: {
      title: 'A Conversation with Junia Feld',
      slug: 'a-conversation-with-junia-feld',
      genre: genres['interview'].id,
      issue: fall25.id,
      publishedAt: '2025-10-18',
      deck: 'The painter on colour, on scale, and on refusing to explain a picture.',
      contributors: [tobi.id, junia.id],
      artwork: [art2.id],
      body: doc([
        p('TBR: Let us start with the field paintings.'),
        p('JF: Everyone starts with the field paintings. (Invented dialogue for the demo.)'),
        p('TBR: Then let us start somewhere else.'),
        p('JF: Thank you.'),
      ]) as any,
    },
  })

  fs.rmSync(tmp, { recursive: true, force: true })
  payload.logger.info('Seed complete.')
}
