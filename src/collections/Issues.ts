import type { CollectionConfig } from 'payload'
import { anyone, authenticated, staff } from '../access'
import { revalidateRelatedContent } from '../hooks/revalidate'
import { slugField } from '../fields/slug'

export const Issues: CollectionConfig = {
  slug: 'issues',
  admin: {
    useAsTitle: 'title',
    group: 'Publication',
    defaultColumns: ['title', 'season', 'year', 'publishedAt'],
    description: 'One per published issue, e.g. "Spring 2026".',
  },
  access: {
    // Reference data shown on published pages — public to read,
    // signed-in to change.
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: staff,
  },
  hooks: { afterChange: [revalidateRelatedContent] },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Display name, e.g. "Spring 2026".' },
    },
    slugField('title'),
    {
      type: 'row',
      fields: [
        {
          name: 'season',
          type: 'select',
          required: true,
          options: ['Spring', 'Summer', 'Fall', 'Winter'],
          admin: { width: '50%' },
        },
        {
          name: 'year',
          type: 'number',
          required: true,
          admin: { width: '50%', description: 'Used with season to order the archive.' },
        },
      ],
    },
    {
      name: 'coverArtwork',
      type: 'relationship',
      relationTo: 'artworks',
      admin: { description: 'The artwork that fronts this issue.' },
    },
    {
      name: 'editorsNote',
      type: 'richText',
      admin: { description: "Optional. Appears at the top of the issue page." },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
  ],
}
