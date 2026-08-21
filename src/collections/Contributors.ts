import type { CollectionConfig } from 'payload'

export const Contributors: CollectionConfig = {
  slug: 'contributors',
  admin: {
    useAsTitle: 'name',
    group: 'Publication',
    defaultColumns: ['name', 'roles', 'slug'],
    description: 'Writers, artists, translators, and editors — one entry per person.',
  },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Used in the URL, e.g. /contributors/jane-doe' },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      options: ['Writer', 'Artist', 'Translator', 'Editor'],
      admin: {
        description: 'Select all roles that apply.',
      },
    },
    {
      name: 'bio',
      type: 'richText',
      admin: {
        description: 'Shown at the foot of their pieces.',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional headshot.' },
    },
    {
      name: 'website',
      type: 'text',
      admin: { description: 'Optional. Personal site or portfolio.' },
    },
  ],
}
