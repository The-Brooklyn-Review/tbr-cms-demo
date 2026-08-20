import type { CollectionConfig } from 'payload'

export const Artworks: CollectionConfig = {
  slug: 'artworks',
  admin: {
    useAsTitle: 'title',
    group: 'Publication',
    defaultColumns: ['title', 'artist', 'medium', 'year'],
    description:
      'Art is its own thing here, not just an image attached to a piece. One entry per artwork, so it can be paired with writing and still keep its own credits.',
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Upload the highest resolution you have.' },
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'contributors',
      admin: { description: 'The artist. Their bio lives on their contributor page.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'medium',
          type: 'text',
          admin: { width: '50%', description: 'e.g. "Oil on canvas", "Collage"' },
        },
        { name: 'year', type: 'text', admin: { width: '50%' } },
      ],
    },
    {
      name: 'dimensions',
      type: 'text',
      admin: { description: 'Optional, e.g. 24 × 36 in' },
    },
    {
      name: 'credit',
      type: 'text',
      admin: { description: 'Credit line, if the work requires one.' },
    },
  ],
}
