import type { CollectionConfig } from 'payload'

export const Genres: CollectionConfig = {
  slug: 'genres',
  admin: {
    useAsTitle: 'name',
    group: 'Taxonomy',
    defaultColumns: ['name', 'slug', 'description'],
    description: 'Fiction, Poetry, Nonfiction, and so on.',
  },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Used in the URL, e.g. /genre/poetry' },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Optional. Shown at the top of the genre archive page.' },
    },
  ],
}
