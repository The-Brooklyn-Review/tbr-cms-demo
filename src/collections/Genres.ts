import type { CollectionConfig } from 'payload'
import { anyone, authenticated, staff } from '../access'
import { revalidateRelatedContent } from '../hooks/revalidate'
import { slugField } from '../fields/slug'

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
    delete: staff,
  },
  hooks: { afterChange: [revalidateRelatedContent] },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name', 'Used in the URL, e.g. /genre/poetry. Auto-filled from the name.'),
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Optional. Shown at the top of the genre archive page.' },
    },
  ],
}
