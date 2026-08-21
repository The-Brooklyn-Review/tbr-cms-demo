import type { CollectionConfig } from 'payload'
import { anyone, authenticated, staff } from '../access'
import { revalidateRelatedContent } from '../hooks/revalidate'
import { slugField } from '../fields/slug'

export const Contributors: CollectionConfig = {
  slug: 'contributors',
  admin: {
    useAsTitle: 'name',
    group: 'Publication',
    defaultColumns: ['name', 'roles', 'slug'],
    description: 'Writers, artists, translators, and editors — one entry per person.',
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
    slugField('name', 'The URL for this person, e.g. /contributors/jane-doe. Auto-filled from their name.'),
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
