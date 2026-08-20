import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'System',
    defaultColumns: ['name', 'email', 'role'],
    description: 'Who can log in. Roles decide what they are allowed to change.',
  },
  auth: true,
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Editor — can publish anything', value: 'editor' },
        { label: 'Reader — can draft, cannot publish', value: 'reader' },
      ],
      admin: {
        description:
          'A real build would go finer-grained than this; two roles is enough to show the idea.',
      },
    },
  ],
}
