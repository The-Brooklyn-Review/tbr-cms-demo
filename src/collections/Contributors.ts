import type { CollectionConfig } from 'payload'

export const Contributors: CollectionConfig = {
  slug: 'contributors',
  admin: {
    useAsTitle: 'name',
    group: 'Publication',
    defaultColumns: ['name', 'roles', 'slug'],
    description:
      'Everyone who appears in the magazine — writers, artists, translators, editors. One entry per person, even if they wear more than one hat.',
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
        description:
          'A person can hold more than one role — a poet who also makes collages gets both, and keeps one page.',
      },
    },
    {
      name: 'bio',
      type: 'richText',
      admin: {
        description:
          'The contributor note that runs at the foot of a piece. Works for writers and artists alike.',
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
