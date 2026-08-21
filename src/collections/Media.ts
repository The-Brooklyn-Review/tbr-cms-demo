import type { CollectionConfig } from 'payload'
import { anyone, authenticated, editorOnly } from '../access'
import { revalidateRelatedContent } from '../hooks/revalidate'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'System',
    description: 'Raw uploads. Most of the time you want Artworks instead.',
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
  upload: {
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: {
        description:
          'Describe the image for readers using a screen reader. Required for accessibility.',
      },
    },
  ],
}
