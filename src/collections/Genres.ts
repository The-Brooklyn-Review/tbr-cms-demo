import type { CollectionConfig } from 'payload'
import { anyone, authenticated, editorOnly } from '../access'
import { revalidateRelatedContent } from '../hooks/revalidate'

export const Genres: CollectionConfig = {
  slug: 'genres',
  admin: {
    useAsTitle: 'name',
    group: 'Taxonomy',
    defaultColumns: ['name', 'slug', 'description'],
    description: 'Fiction, Poetry, Nonfiction, and so on.',
  },
  access: {
    // Reference data shown on published pages — public to read,
    // signed-in to change.
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: editorOnly,
  },
  hooks: { afterChange: [revalidateRelatedContent] },
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
