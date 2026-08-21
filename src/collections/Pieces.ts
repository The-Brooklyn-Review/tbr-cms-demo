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

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://tbr-cms-demo.vercel.app'

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
      url: ({ data }) => (data?.slug ? `${SITE_URL}/pieces/${data.slug}` : `${SITE_URL}/`),
    },
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
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'The URL for this piece, e.g. /pieces/the-sunken-place',
      },
    },
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
