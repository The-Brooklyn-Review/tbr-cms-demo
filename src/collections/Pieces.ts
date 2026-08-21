import type { CollectionConfig } from 'payload'
import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const Pieces: CollectionConfig = {
  slug: 'pieces',
  labels: { singular: 'Piece', plural: 'Pieces' },
  admin: {
    useAsTitle: 'title',
    group: 'Publication',
    defaultColumns: ['title', 'genre', 'issue', 'status', 'publishedAt'],
    description:
      'A single published work — a poem, a story, an essay, an interview. This is where most editorial work happens.',
    livePreview: {
      // Falls back to the homepage until the piece has a slug — pointing at
      // /pieces/ with nothing after it 404s, which is what "Live Preview"
      // showed for a piece that hadn't been given a slug yet.
      url: ({ data }) =>
        data?.slug
          ? `${process.env.NEXT_PUBLIC_SERVER_URL || ''}/pieces/${data.slug}`
          : `${process.env.NEXT_PUBLIC_SERVER_URL || ''}/`,
    },
  },
  versions: {
    drafts: {
      autosave: { interval: 400 },
    },
    maxPerDoc: 20,
  },
  access: {
    read: () => true,
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
                description:
                  'A short standfirst shown under the title. One or two sentences. Optional.',
              },
            },
            {
              name: 'body',
              type: 'richText',
              required: true,
              editor: lexicalEditor({
                features: () => [
                  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
                  FixedToolbarFeature(),
                  InlineToolbarFeature(),
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
                              description:
                                'Paste the poem here. Line breaks and indentation are preserved exactly as you type them — this block exists so poems never get reflowed like prose.',
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
                description:
                  'The piece itself. Use the Verse block for poetry so line breaks survive.',
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
                description:
                  'The writer, plus a translator or interviewer if there is one. Their bios pull through automatically.',
              },
            },
            {
              name: 'artwork',
              type: 'relationship',
              relationTo: 'artworks',
              hasMany: true,
              admin: {
                description:
                  'Art paired with this piece. The artist and their bio come from the artwork itself, so you never retype credits.',
              },
            },
            {
              name: 'accentColor',
              type: 'text',
              admin: {
                description:
                  'Optional hex value pulled from the artwork, used as this piece’s accent on the site. Leave blank for the house colour.',
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
                description:
                  'Optional. Chosen by hand — an editor deciding what reads well next to this, rather than an algorithm guessing.',
              },
            },
          ],
        },
      ],
    },
  ],
}
