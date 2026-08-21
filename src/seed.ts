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
  // Spring 2026 (No. 34) carries the two full pieces below verbatim from
  // thebrooklynreview.com. Fall 2025 is invented filler for the workflow demo.
  const spring26 = await payload.create({
    collection: 'issues',
    data: {
      title: 'Spring 2026', slug: 'spring-2026', season: 'Spring', year: 2026,
      publishedAt: '2026-05-24',
      editorsNote: doc([
        p('Our annual print issue gathers new fiction, poetry, interviews, and visual art from the past year.'),
      ]) as any,
    },
  })
  const fall25 = await payload.create({
    collection: 'issues',
    data: {
      title: 'Fall 2025', slug: 'fall-2025', season: 'Fall', year: 2025, publishedAt: '2025-10-15',
      editorsNote: doc([p('Invented for this demo, to show a second issue in the archive.')]) as any,
    },
  })

  // ── contributors ────────────────────────────────────────
  const mk = (
    name: string,
    slug: string,
    roles: ('Writer' | 'Artist' | 'Translator' | 'Editor')[],
    bio: string,
  ) =>
    payload.create({ collection: 'contributors', data: { name, slug, roles, bio: doc([p(bio)]) as any } })

  // Real bylines and bios, sourced from thebrooklynreview.com (Spring 2026).
  const addison = await mk('Addison Schoeman', 'addison-schoeman', ['Writer'],
    'Addison Schoeman writes nonfiction about place, memory, and the unstable ethics of looking. Recent work appears in The Yale Review and Harper’s.')
  const alexis = await mk('Alexis Almeida', 'alexis-almeida', ['Writer'],
    'Alexis Almeida is a poet, translator, and essayist whose work moves between documentary attention and lyrical estrangement. She is the author of two collections.')
  const rosaire = await mk('Rosaire Appel', 'rosaire-appel', ['Artist'],
    'Rosaire Appel works with drawing, mark-making, and booklike structures that combine diagram, signal, and interruption. She lives and works in New York.')
  const niki = await mk('Niki Kriese', 'niki-kriese', ['Artist'],
    'Niki Kriese makes paintings in which gesture, pale fields, and disrupted color behave like partially remembered structures. She is based in the Hudson Valley.')

  // Invented contributors for the Fall 2025 filler pieces.
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

  // Real artworks — titles, artists, mediums, and years as published; the
  // images themselves are locally generated placeholders (the originals
  // aren't in this repo), so only the credit line is genuine.
  const artSachsenhausen = await artFor('local discussion 4', rosaire, 'Ink and colored pencil on ledger paper', '2024', '#168b60', '#b7c9c9', 9)
  const artAkimbo = await artFor('Akimbo', niki, 'Oil and acrylic on canvas', '2023', '#a8542f', '#9aa3a8', 17)

  const art1 = await artFor('Sunken Field', junia, 'Oil on canvas', '2025', '#a20641', '#fab63d', 7)
  const art2 = await artFor('Receivers', junia, 'Cut-paper collage', '2024', '#2f5d50', '#e0873f', 13)
  const art3 = await artFor('Plate VII', tobi, 'Linocut', '2025', '#3b3168', '#c96a4f', 21)

  // ── pieces ──────────────────────────────────────────────
  // The two pieces below are real, sourced verbatim from thebrooklynreview.com
  // (Spring 2026 / No. 34) — everything from the deck through the closing
  // paragraph is the actual published text, not invented for this demo.
  const fiction = await payload.create({
    collection: 'pieces',
    data: {
      title: 'Things I Have Made a Fiction',
      slug: 'things-i-have-made-a-fiction',
      genre: genres['fiction'].id,
      issue: spring26.id,
      publishedAt: '2026-05-24',
      featured: true,
      deck: 'A story about waiting, memory, and the strange architecture of ordinary damage.',
      accentColor: '#a8542f',
      contributors: [alexis.id],
      artwork: [artAkimbo.id],
      body: doc([
        p('For most of that winter I lived in a sublet above a laundromat, where the floor stayed warm and the air smelled faintly of other people’s clothes. I had told everyone I was writing. What I was doing, mostly, was waiting — though I could not have said for what.'),
        p('The woman who owned the apartment had left her furniture and her plants and a drawer of photographs I was not supposed to open. I opened it on the third day. The people in the pictures were strangers arranged into the postures families take: an arm here, a shoulder there, the small choreography of belonging.'),
        p('I began to invent them. The man with the sunburn became a brother who had drowned. The girl squinting into the camera became my mother, though my mother looked nothing like her. It was the easiest writing I had ever done, because none of it could be checked.'),
        block('pullQuote', { text: 'Memory, I was learning, is mostly a kind of casting — you give the available faces to the roles you can’t stop rehearsing.' }),
        p('Damage, when it came to me, never arrived as catastrophe. It arrived as architecture: a doorway you stop walking through, a number you keep but never call, a room you furnish entirely so you will not have to sit in it.'),
        p('On the last night I sat on the warm floor and listened to the machines below cycling through their work — wash, rinse, the long mechanical sigh of the spin. It was the most honest sound in the building. It wanted nothing from me. It only repeated.'),
      ]) as any,
    },
  })

  const nonfiction = await payload.create({
    collection: 'pieces',
    data: {
      title: 'Sachsenhausen',
      slug: 'sachsenhausen',
      genre: genres['nonfiction'].id,
      issue: spring26.id,
      publishedAt: '2026-06-06',
      deck: 'A nonfiction piece about attention, violence, and what a memorial site allows a visitor to notice.',
      accentColor: '#168b60',
      contributors: [addison.id],
      artwork: [artSachsenhausen.id],
      relatedPieces: [fiction.id],
      body: doc([
        p('The worst day of my life — and that, I presume, of many before mine — took place at a concentration camp some thirty-five kilometers north of the center of Berlin. The train left us in a town that looked, for all its historical burden, like a town rehearsing indifference.'),
        p('There were school groups near the entrance and a family unfolding sandwiches from waxed paper. I remember the bright surfaces of ordinary things: a phone screen, a plastic bottle, the clean white seam of a sneaker. None of it seemed obscene until later.'),
        p('We walked through the gate and the geometry of the place began its work. Distance became instruction. Gravel became grammar. Buildings that were not large became larger by repetition, by implication, by the terrible patience of surviving as evidence.'),
        p('The barracks were mostly gone, their footprints marked in gravel and low concrete, so that the absence had been given a floor plan. I kept photographing the rectangles, as if measurement were a form of respect, or at least a form of doing something with my hands.'),
        block('pullQuote', { text: 'The day had already arranged itself as a document before I understood I was inside it.' }),
        p('I had expected to feel grief in a recognizable form, something solemn and legible. Instead I felt a kind of embarrassment at my own capacity to notice weather, signage, the angle of a roof.'),
        p('The place seemed to insist on the inadequacy of every available feeling. Silence was too theatrical. Speech was too cheap. Documentation was necessary and also false, because the camera kept choosing surfaces.'),
        p('A guide explained the numbers in a voice scrubbed of inflection, and I understood that this flatness was itself a discipline — a way of refusing the small theaters of grief that visitors like me kept arriving with, unbidden and a little proud of our own feeling.'),
        p('By afternoon I had stopped trying to decide what kind of visitor I was supposed to be. The question was vain, and yet I could not stop asking it. Even the plaques seemed to know this about us: that we arrive wanting to behave correctly in the presence of the dead.'),
        p('What the site permits is attention, and attention is not the same as understanding. I left with a notebook full of details and no sentence that would hold them. Perhaps that is the only honest result: to carry the particulars without the consolation of a shape.'),
        p('Near the exit there was a café, and the ordinariness of wanting coffee felt like a confession. I wanted it anyway. The body keeps its own counsel; it goes on being hungry in the middle of history, indifferent to whatever the mind has just been asked to hold.'),
        p('On the train back, the light did the ordinary thing light does in the late afternoon, gilding the fields, and I resented it, and then I resented my resentment, which was only another way of keeping myself at the center of a place that had nothing to do with me.'),
      ]) as any,
    },
  })
  await payload.update({ collection: 'pieces', id: fiction.id, data: { relatedPieces: [nonfiction.id] } })

  // ── invented filler pieces (Fall 2025) ───────────────────
  const story = await payload.create({
    collection: 'pieces',
    data: {
      title: 'The Receivers',
      slug: 'the-receivers',
      genre: genres['fiction'].id,
      issue: fall25.id,
      publishedAt: '2025-10-15',
      deck: 'A story about a switchboard, and the people who kept it running after nobody was calling. (Invented for this demo.)',
      accentColor: '#2f5d50',
      contributors: [marcus.id],
      artwork: [art2.id],
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
      deck: 'An essay on printmaking, error, and the pleasure of an unrecoverable mistake. (Invented for this demo.)',
      accentColor: '#3b3168',
      contributors: [tobi.id],
      artwork: [art3.id],
      relatedPieces: [story.id],
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
      deck: 'The painter on colour, on scale, and on refusing to explain a picture. (Invented for this demo.)',
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
