import type { CollectionConfig } from 'payload'
import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { authenticated, editorOnly, publishedOrSignedIn } from '../access'
import { revalidatePiece, revalidatePieceOnDelete } from '../hooks/revalidate'
import { slugField } from '../fields/slug'

// A trailing slash here breaks live preview silently: the postMessage handler
// compares this string against the browser's event.origin, which never has a
// trailing slash, so the two would never match and updates would be dropped
// without an error anywhere.
const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://tbr-cms-demo.vercel.app').replace(/\/+$/, '')

/**
 * Routes previews through /next/preview, which verifies the editor's session
 * and switches on draft mode before redirecting to the piece. Going straight
 * to /pieces/<slug> would show the published version — or 404 on a piece that
 * has never been published.
 */
const previewURL = (slug: string) => {
  const params = new URLSearchParams({
    slug,
    collection: 'pieces',
    path: `/pieces/${slug}`,
    previewSecret: process.env.PREVIEW_SECRET || '',
  })
  return `${SITE_URL}/next/preview?${params.toString()}`
}

export const Pieces: CollectionConfig = {
  slug: 'pieces',
  labels: { singular: 'Piece', plural: 'Pieces' },
  admin: {
    useAsTitle: 'title',
    group: 'Publication',
    defaultColumns: ['title', 'genre', 'issue', 'status', 'publishedAt'],
    description: 'A single published work: a poem, story, essay, or interview.',
    livePreview: {
      // Falls back to the homepage until the piece has a slug — pointing at
      // /pieces/ with nothing after it 404s.
      url: ({ data }) => (data?.slug ? previewURL(data.slug) : `${SITE_URL}/`),
    },
    // The "Preview" button. Same route as live preview, opened in a new tab so
    // an editor can read a draft at full width before publishing it.
    preview: (data) => (data?.slug ? previewURL(String(data.slug)) : `${SITE_URL}/`),
  },
  versions: {
    drafts: {
      autosave: { interval: 400 },
    },
    maxPerDoc: 20,
  },
  access: {
    // Anonymous readers see published pieces only — drafts stay internal.
    read: publishedOrSignedIn,
    create: authenticated,
    update: authenticated,
    delete: editorOnly,
  },
  hooks: {
    afterChange: [revalidatePiece],
    afterDelete: [revalidatePieceOnDelete],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField('title', 'The URL for this piece, e.g. /pieces/the-sunken-place. Auto-filled from the title.'),
    {
      name: 'genre',
      type: 'relationship',
      relationTo: 'genres',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'issue',
      type: 'relationship',
      relationTo: 'issues',
      required: true,
      admin: { position: 'sidebar', description: 'Which issue this piece belongs to.' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
        description: 'Featured pieces are eligible for the homepage lead.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'The Work',
          fields: [
            {
              name: 'deck',
              type: 'textarea',
              admin: {
                description: 'Optional standfirst shown under the title. One or two sentences.',
              },
            },
            {
              name: 'body',
              type: 'richText',
              required: true,
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures.filter((f) => f.key !== 'heading'),
                  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
                  FixedToolbarFeature(),
                  HorizontalRuleFeature(),
                  BlocksFeature({
                    blocks: [
                      {
                        slug: 'verse',
                        labels: { singular: 'Verse', plural: 'Verse' },
                        fields: [
                          {
                            name: 'lines',
                            type: 'textarea',
                            required: true,
                            admin: {
                              description: 'Line breaks and indentation are preserved as typed.',
                            },
                          },
                        ],
                      },
                      {
                        slug: 'epigraph',
                        labels: { singular: 'Epigraph', plural: 'Epigraphs' },
                        fields: [
                          { name: 'text', type: 'textarea', required: true },
                          { name: 'attribution', type: 'text' },
                        ],
                      },
                      {
                        slug: 'pullQuote',
                        labels: { singular: 'Pull Quote', plural: 'Pull Quotes' },
                        fields: [{ name: 'text', type: 'textarea', required: true }],
                      },
                    ],
                  }),
                ],
              }),
              admin: {
                description: 'Use the Verse block for poetry so line breaks survive.',
              },
            },
          ],
        },
        {
          label: 'People & Art',
          fields: [
            {
              name: 'contributors',
              type: 'relationship',
              relationTo: 'contributors',
              hasMany: true,
              required: true,
              admin: {
                description: 'The writer, plus translator or interviewer if applicable.',
              },
            },
            {
              name: 'artwork',
              type: 'relationship',
              relationTo: 'artworks',
              hasMany: true,
              admin: {
                description: 'Art paired with this piece.',
              },
            },
            {
              name: 'accentColor',
              type: 'text',
              admin: {
                description: 'Optional hex color for this piece’s accent. Leave blank for the house color.',
              },
            },
          ],
        },
        {
          label: 'Related',
          fields: [
            {
              name: 'relatedPieces',
              type: 'relationship',
              relationTo: 'pieces',
              hasMany: true,
              filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
              admin: {
                description: 'Optional. Shown as "Read next" on the piece page.',
              },
            },
          ],
        },
      ],
    },
  ],
}
