import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'System',
    description: 'Raw uploads. Most of the time you want Artworks instead.',
  },
  access: { read: () => true },
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
